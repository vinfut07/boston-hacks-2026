-- =============================================================================
-- Breadcrumb — create_ratings
--
-- Ratings and the averages shown on cards and profiles.
--
-- - sidequest_ratings: price, time, enjoyment, memorability (1–5 each) +
--   optional review. A trigger enforces: you completed it first, one rating
--   per user, and creators can't rate their own.
-- - creator_ratings: rate a user's quest-making directly (P2).
-- - sidequest_rating_stats view: averages + count per sidequest (card ★).
-- - questgiver_ratings view: a creator's average across their sidequests.
--
-- Runs after: create_quest_progress_and_checklists (needs user_sidequests).
-- Used by: Rate screen, feed cards, detail page, profile questgiver rating.
-- Immutable once applied: make changes in a new migration (npm run db:new).
-- =============================================================================

-- =============================================================================
-- sidequest_ratings — price, time, enjoyment, memorability (1–5 each)
-- Only users who completed the sidequest can rate it; one rating each.
-- =============================================================================
create table public.sidequest_ratings (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.profiles (id) on delete cascade,
  sidequest_id        uuid not null references public.sidequests (id) on delete cascade,
  price_rating        smallint not null check (price_rating between 1 and 5),
  time_rating         smallint not null check (time_rating between 1 and 5),
  enjoyment_rating    smallint not null check (enjoyment_rating between 1 and 5),
  memorability_rating smallint not null check (memorability_rating between 1 and 5),
  review_text         text check (char_length(review_text) <= 2000),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  unique (user_id, sidequest_id)
);
create index sidequest_ratings_sidequest_idx on public.sidequest_ratings (sidequest_id);

-- Enforce "completed it" in the database, not just the UI. Runs as definer so
-- the check works no matter which role writes. Creators can't rate their own.
create or replace function private.validate_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  if not exists (
    select 1 from public.user_sidequests us
    where us.user_id = new.user_id
      and us.sidequest_id = new.sidequest_id
      and us.status = 'completed'
  ) then
    raise exception 'You can only rate a sidequest you have completed'
      using errcode = 'check_violation';
  end if;
  if exists (select 1 from public.sidequests s
             where s.id = new.sidequest_id and s.creator_id = new.user_id) then
    raise exception 'Creators cannot rate their own sidequest'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger sidequest_ratings_validate
  before insert or update on public.sidequest_ratings
  for each row execute function private.validate_rating();

alter table public.sidequest_ratings enable row level security;
create policy "Ratings visible when sidequest is visible"
  on public.sidequest_ratings for select to anon, authenticated
  using ((select private.can_view_sidequest(sidequest_id)));
create policy "Users rate as themselves"
  on public.sidequest_ratings for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "Users edit their own ratings"
  on public.sidequest_ratings for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users delete their own ratings"
  on public.sidequest_ratings for delete to authenticated
  using (user_id = (select auth.uid()));


-- -----------------------------------------------------------------------------
-- creator_ratings — rate a user's quest-making directly (P2, PRD §6.3)
-- -----------------------------------------------------------------------------
create table public.creator_ratings (
  rater_id   uuid not null references public.profiles (id) on delete cascade,
  creator_id uuid not null references public.profiles (id) on delete cascade,
  rating     smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (rater_id, creator_id),
  constraint creator_ratings_no_self check (rater_id <> creator_id)
);
create index creator_ratings_creator_idx on public.creator_ratings (creator_id);

alter table public.creator_ratings enable row level security;
create policy "Creator ratings are publicly readable"
  on public.creator_ratings for select to anon, authenticated using (true);
create policy "Users rate creators as themselves"
  on public.creator_ratings for insert to authenticated
  with check (rater_id = (select auth.uid()));
create policy "Users update their creator ratings"
  on public.creator_ratings for update to authenticated
  using (rater_id = (select auth.uid()))
  with check (rater_id = (select auth.uid()));
create policy "Users remove their creator ratings"
  on public.creator_ratings for delete to authenticated
  using (rater_id = (select auth.uid()));


-- =============================================================================
-- Rating views
-- security_invoker = true: the views run with the caller's permissions, so
-- they only aggregate ratings the caller can already see.
-- =============================================================================

-- Per-sidequest averages. overall = mean of the four scores.
create view public.sidequest_rating_stats
with (security_invoker = true) as
select
  r.sidequest_id,
  count(*)::int                                   as rating_count,
  round(avg(r.price_rating), 2)                   as avg_price,
  round(avg(r.time_rating), 2)                    as avg_time,
  round(avg(r.enjoyment_rating), 2)               as avg_enjoyment,
  round(avg(r.memorability_rating), 2)            as avg_memorability,
  round(avg((r.price_rating + r.time_rating + r.enjoyment_rating + r.memorability_rating) / 4.0), 2)
                                                  as avg_overall
from public.sidequest_ratings r
group by r.sidequest_id;

-- Questgiver rating (PRD §5.1): average overall rating across everything a
-- user created, with the number of ratings.
create view public.questgiver_ratings
with (security_invoker = true) as
select
  s.creator_id,
  count(r.id)::int as rating_count,
  round(avg((r.price_rating + r.time_rating + r.enjoyment_rating + r.memorability_rating) / 4.0), 2)
                   as avg_overall
from public.sidequests s
join public.sidequest_ratings r on r.sidequest_id = s.id
group by s.creator_id;

grant select on public.sidequest_rating_stats to anon, authenticated;
grant select on public.questgiver_ratings     to anon, authenticated;


revoke all on function private.validate_rating()              from public, anon, authenticated;
