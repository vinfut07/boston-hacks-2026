-- =============================================================================
-- Breadcrumb — create_sidequests_stops_and_places
--
-- The core content: sidequests (outings), their ordered stops, and the curated
-- library of real Boston places that stops can be picked from.
--
-- - experiences: verified places with location, cost, nearest T station.
--   Read-only for users; the team fills it via seed.sql.
-- - sidequests: an outing. status draft/published/archived. scheduled_at null
--   = anytime. community_id null = everyone, set = only that community.
--   primary_line sets the card colour; is_curated marks team demo content.
-- - sidequest_stops: ordered stops with planned activity and how to travel
--   there from the previous stop (walk/bike/bus/train).
-- - private.can_view_sidequest / owns_sidequest: visibility and ownership
--   checks reused by every table attached to a sidequest.
--
-- Runs after: create_profiles_and_communities.
-- Used by: For You feed, detail page, Create flow, maps.
-- Immutable once applied: make changes in a new migration (npm run db:new).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- experiences — curated place library
-- -----------------------------------------------------------------------------
create table public.experiences (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) between 1 and 200),
  description     text check (char_length(description) <= 2000),
  category        text not null check (category in
                    ('food_drink', 'outdoors', 'arts_culture', 'shopping', 'attractions', 'affordable')),
  neighborhood    text check (char_length(neighborhood) <= 80),
  address         text check (char_length(address) <= 300),
  latitude        double precision not null check (latitude between -90 and 90),
  longitude       double precision not null check (longitude between -180 and 180),
  estimated_cost  numeric(10, 2) check (estimated_cost >= 0),
  nearest_station text check (char_length(nearest_station) <= 120),
  open_late       boolean not null default false,
  image_url       text,
  created_at      timestamptz not null default now()
);
create index experiences_category_idx     on public.experiences (category);
create index experiences_neighborhood_idx on public.experiences (neighborhood);


-- -----------------------------------------------------------------------------
-- sidequests
-- -----------------------------------------------------------------------------
create table public.sidequests (
  id                         uuid primary key default gen_random_uuid(),
  creator_id                 uuid not null references public.profiles (id) on delete cascade,
  title                      text not null check (char_length(title) between 1 and 120),
  description                text check (char_length(description) <= 5000),
  cover_image_url            text,
  category                   text check (category in
                               ('food_drink', 'outdoors', 'arts_culture', 'shopping', 'attractions', 'affordable')),
  estimated_cost             numeric(10, 2) check (estimated_cost >= 0),
  estimated_duration_minutes integer check (estimated_duration_minutes > 0
                                            and estimated_duration_minutes <= 10080),
  neighborhood               text check (char_length(neighborhood) <= 80),
  scheduled_at               timestamptz,
  status                     text not null default 'draft'
                             check (status in ('draft', 'published', 'archived')),
  community_id               uuid references public.communities (id) on delete set null,
  primary_line               text check (primary_line in ('rl', 'gl', 'bl', 'ol', 'sl', 'cr')),
  is_curated                 boolean not null default false,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);
comment on column public.sidequests.status is
  'draft = creator only; published = visible; archived = creator only (soft delete, keeps history).';
comment on column public.sidequests.scheduled_at is 'Null = anytime. Set = scheduled outing people can sign up for.';
comment on column public.sidequests.community_id is 'Null = everyone. Set = only members of that community.';
comment on column public.sidequests.primary_line is 'Main T line (sets card colour). Null = walk/bike only.';
comment on column public.sidequests.is_curated is 'Team-made demo content, shown with a "Curated" badge.';

create index sidequests_feed_idx         on public.sidequests (created_at desc) where status = 'published';
create index sidequests_creator_idx      on public.sidequests (creator_id);
create index sidequests_scheduled_idx    on public.sidequests (scheduled_at) where scheduled_at is not null and status = 'published';
create index sidequests_category_idx     on public.sidequests (category);
create index sidequests_neighborhood_idx on public.sidequests (neighborhood);
create index sidequests_community_idx    on public.sidequests (community_id);


-- -----------------------------------------------------------------------------
-- sidequest_stops
-- -----------------------------------------------------------------------------
create table public.sidequest_stops (
  id                  uuid primary key default gen_random_uuid(),
  sidequest_id        uuid not null references public.sidequests (id) on delete cascade,
  experience_id       uuid references public.experiences (id) on delete set null,
  place_name          text not null check (char_length(place_name) between 1 and 200),
  address             text check (char_length(address) <= 300),
  latitude            double precision check (latitude between -90 and 90),
  longitude           double precision check (longitude between -180 and 180),
  stop_order          integer not null check (stop_order >= 0),
  description         text check (char_length(description) <= 2000),
  planned_activity    text check (char_length(planned_activity) <= 1000),
  travel_mode_to_stop text check (travel_mode_to_stop in ('walk', 'bike', 'bus', 'train')),
  estimated_cost      numeric(10, 2) check (estimated_cost >= 0),
  notes               text check (char_length(notes) <= 2000),
  created_at          timestamptz not null default now(),
  constraint sidequest_stops_coords_pair check ((latitude is null) = (longitude is null)),
  -- Deferrable so stops can be reordered (swapped) in one transaction.
  constraint sidequest_stops_order_unique unique (sidequest_id, stop_order) deferrable initially deferred,
  -- Lets checklist_items reference (stop_id, sidequest_id) safely.
  constraint sidequest_stops_id_sidequest_unique unique (id, sidequest_id)
);
comment on column public.sidequest_stops.experience_id is 'Library place this stop came from. Null = custom location.';
comment on column public.sidequest_stops.travel_mode_to_stop is 'How to get here from the previous stop. Null for the first stop.';
create index sidequest_stops_experience_idx on public.sidequest_stops (experience_id);


-- -----------------------------------------------------------------------------
-- Keep sidequests.updated_at current.
-- -----------------------------------------------------------------------------
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function private.set_updated_at() from public, anon, authenticated;

create trigger sidequests_set_updated_at
  before update on public.sidequests
  for each row execute function private.set_updated_at();


-- -----------------------------------------------------------------------------
-- Visibility helpers. SECURITY DEFINER so child-table policies can check the
-- parent sidequest without recursive RLS. They only answer yes/no for the
-- current user, so nothing leaks.
-- -----------------------------------------------------------------------------

-- Visible = I created it, or it's published and (for everyone or my community).
create or replace function private.can_view_sidequest(p_sidequest_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.sidequests s
    where s.id = p_sidequest_id
      and (
        s.creator_id = (select auth.uid())
        or (s.status = 'published'
            and (s.community_id is null or private.in_community(s.community_id)))
      )
  );
$$;

create or replace function private.owns_sidequest(p_sidequest_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.sidequests s
    where s.id = p_sidequest_id and s.creator_id = (select auth.uid())
  );
$$;

revoke all on function private.can_view_sidequest(uuid) from public;
revoke all on function private.owns_sidequest(uuid)     from public;
grant execute on function private.can_view_sidequest(uuid) to anon, authenticated;
grant execute on function private.owns_sidequest(uuid)     to anon, authenticated;


-- -----------------------------------------------------------------------------
-- Row Level Security
-- Deleting a sidequest cascades to everything attached to it. Use
-- status = 'archived' to hide one while keeping its history.
-- -----------------------------------------------------------------------------
alter table public.experiences     enable row level security;
alter table public.sidequests      enable row level security;
alter table public.sidequest_stops enable row level security;

-- experiences: read-only (no insert/update policies, so only the team via SQL).
create policy "Experiences are publicly readable"
  on public.experiences for select to anon, authenticated using (true);

-- sidequests
create policy "Visible sidequests are readable"
  on public.sidequests for select to anon, authenticated
  using (
    creator_id = (select auth.uid())
    or (status = 'published'
        and (community_id is null or (select private.in_community(community_id))))
  );
create policy "Users can create sidequests as themselves"
  on public.sidequests for insert to authenticated
  with check (creator_id = (select auth.uid()));
create policy "Creators can update their own sidequests"
  on public.sidequests for update to authenticated
  using (creator_id = (select auth.uid()))
  with check (creator_id = (select auth.uid()));
create policy "Creators can delete their own sidequests"
  on public.sidequests for delete to authenticated
  using (creator_id = (select auth.uid()));

-- stops: same visibility and ownership as the parent sidequest.
create policy "Stops visible when parent sidequest is visible"
  on public.sidequest_stops for select to anon, authenticated
  using ((select private.can_view_sidequest(sidequest_id)));
create policy "Creators can add stops to their sidequests"
  on public.sidequest_stops for insert to authenticated
  with check ((select private.owns_sidequest(sidequest_id)));
create policy "Creators can update stops on their sidequests"
  on public.sidequest_stops for update to authenticated
  using ((select private.owns_sidequest(sidequest_id)))
  with check ((select private.owns_sidequest(sidequest_id)));
create policy "Creators can delete stops on their sidequests"
  on public.sidequest_stops for delete to authenticated
  using ((select private.owns_sidequest(sidequest_id)));
