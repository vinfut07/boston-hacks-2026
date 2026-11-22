-- =============================================================================
-- Breadcrumb — create_quest_progress_and_checklists
--
-- Everything about doing a sidequest: its checklist, each user's progress,
-- what they've ticked off, and photos from the outing.
--
-- - checklist_items: things to see/do on a sidequest, per stop or between
--   stops (is_checkpoint = P2 checkpoints). Same visibility/ownership as the
--   sidequest.
-- - user_sidequests: ONE private row per user per sidequest with status
--   saved · signed_up · in_progress · completed · aborted. Drives the Save /
--   Sign up / Start / Completed / Abort buttons and the profile tabs. A trigger
--   fills started_at/completed_at and only allows signed_up for scheduled quests.
-- - checklist_completions: private ticks (+ optional proof photo), only on a
--   quest you've started. Kept when you "save for later".
-- - quest_photos: extra photos from the outing, public on the sidequest as
--   social proof (PRD §5.4). Storage bucket for files comes in a later migration.
--
-- Runs after: create_sidequests_stops_and_places.
-- Used by: detail page, Quest mode, profile tabs.
-- Immutable once applied: make changes in a new migration (npm run db:new).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- checklist_items — things to see/do, per stop or between stops
-- -----------------------------------------------------------------------------
create table public.checklist_items (
  id            uuid primary key default gen_random_uuid(),
  sidequest_id  uuid not null references public.sidequests (id) on delete cascade,
  stop_id       uuid,
  label         text not null check (char_length(label) between 1 and 200),
  item_type     text not null default 'do' check (item_type in ('see', 'do')),
  item_order    integer not null default 0 check (item_order >= 0),
  is_checkpoint boolean not null default false,
  created_at    timestamptz not null default now(),
  -- The stop must belong to the same sidequest. Deleting a stop deletes its items.
  constraint checklist_items_stop_fk foreign key (stop_id, sidequest_id)
    references public.sidequest_stops (id, sidequest_id) on delete cascade
);
comment on column public.checklist_items.stop_id is
  'Null = not tied to a stop (e.g. a checkpoint on the way between stops).';
comment on column public.checklist_items.is_checkpoint is
  'True for P2 "checkpoints" between stops (PRD §6.2).';
create index checklist_items_sidequest_idx on public.checklist_items (sidequest_id, item_order);
create index checklist_items_stop_idx      on public.checklist_items (stop_id);

alter table public.checklist_items enable row level security;

-- Same visibility and ownership as the parent sidequest (like stops).
create policy "Checklist items visible when sidequest is visible"
  on public.checklist_items for select to anon, authenticated
  using ((select private.can_view_sidequest(sidequest_id)));
create policy "Creators can add checklist items"
  on public.checklist_items for insert to authenticated
  with check ((select private.owns_sidequest(sidequest_id)));
create policy "Creators can update checklist items"
  on public.checklist_items for update to authenticated
  using ((select private.owns_sidequest(sidequest_id)))
  with check ((select private.owns_sidequest(sidequest_id)));
create policy "Creators can delete checklist items"
  on public.checklist_items for delete to authenticated
  using ((select private.owns_sidequest(sidequest_id)));


-- =============================================================================
-- user_sidequests — one row per user per sidequest holding its status
--    saved → signed_up → in_progress → completed / aborted (any order allowed)
-- Private: each user sees only their own rows (PRD §9).
-- =============================================================================
create table public.user_sidequests (
  user_id      uuid not null references public.profiles (id) on delete cascade,
  sidequest_id uuid not null references public.sidequests (id) on delete cascade,
  status       text not null check (status in ('saved', 'signed_up', 'in_progress', 'completed', 'aborted')),
  started_at   timestamptz,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  primary key (user_id, sidequest_id),
  constraint user_sidequests_completed_at check ((status = 'completed') = (completed_at is not null))
);
create index user_sidequests_status_idx    on public.user_sidequests (user_id, status);
create index user_sidequests_sidequest_idx on public.user_sidequests (sidequest_id);

-- Fill in timestamps and validate status changes:
--  * in_progress sets started_at (first time only)
--  * completed sets completed_at; leaving completed clears it
--  * signed_up only for scheduled sidequests (PRD §5.3)
create or replace function private.user_sidequests_before_write()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();

  if new.status = 'in_progress' and new.started_at is null then
    new.started_at := now();
  end if;

  if new.status = 'completed' then
    new.completed_at := coalesce(new.completed_at, now());
    new.started_at := coalesce(new.started_at, new.completed_at);
  else
    new.completed_at := null;
  end if;

  if new.status = 'signed_up' and not exists (
    select 1 from public.sidequests s
    where s.id = new.sidequest_id and s.scheduled_at is not null
  ) then
    raise exception 'Can only sign up for a sidequest with a scheduled start'
      using errcode = 'check_violation';
  end if;

  return new;
end;
$$;

create trigger user_sidequests_before_write
  before insert or update on public.user_sidequests
  for each row execute function private.user_sidequests_before_write();

alter table public.user_sidequests enable row level security;
create policy "Users read their own progress"
  on public.user_sidequests for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users add progress for visible sidequests"
  on public.user_sidequests for insert to authenticated
  with check (user_id = (select auth.uid())
              and (select private.can_view_sidequest(sidequest_id)));
create policy "Users update their own progress"
  on public.user_sidequests for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users delete their own progress"
  on public.user_sidequests for delete to authenticated
  using (user_id = (select auth.uid()));


revoke all on function private.user_sidequests_before_write() from public, anon, authenticated;


-- =============================================================================
-- checklist_completions — a user's ticked items (+ optional proof photo)
-- Private to the user. Kept when a quest is "saved for later" so progress
-- survives (PRD Flow C).
-- =============================================================================
create table public.checklist_completions (
  user_id           uuid not null references public.profiles (id) on delete cascade,
  checklist_item_id uuid not null references public.checklist_items (id) on delete cascade,
  completed_at      timestamptz not null default now(),
  photo_url         text,
  primary key (user_id, checklist_item_id)
);
create index checklist_completions_item_idx on public.checklist_completions (checklist_item_id);

-- Can the current user tick this item? They must have a progress row for its
-- sidequest (any status except aborted: in progress, saved mid-quest, or done).
create or replace function private.can_complete_item(p_item_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.checklist_items ci
    join public.user_sidequests us
      on us.sidequest_id = ci.sidequest_id and us.user_id = (select auth.uid())
    where ci.id = p_item_id and us.status <> 'aborted'
  );
$$;
revoke all on function private.can_complete_item(uuid) from public;
grant execute on function private.can_complete_item(uuid) to authenticated;

alter table public.checklist_completions enable row level security;
create policy "Users read their own completions"
  on public.checklist_completions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "Users tick items on quests they started"
  on public.checklist_completions for insert to authenticated
  with check (user_id = (select auth.uid())
              and (select private.can_complete_item(checklist_item_id)));
create policy "Users update their own completions"
  on public.checklist_completions for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
create policy "Users untick their own completions"
  on public.checklist_completions for delete to authenticated
  using (user_id = (select auth.uid()));


-- =============================================================================
-- quest_photos — extra photos from a quest ("add other photos" tab)
-- PRD §5.4: photos are social proof "visible on the sidequest", so they're
-- readable wherever the sidequest is. Only the owner can add or remove them.
-- (Checklist proof photos live on checklist_completions and stay private.)
-- The Storage bucket for the files themselves comes in a later migration.
-- =============================================================================
create table public.quest_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  sidequest_id uuid not null references public.sidequests (id) on delete cascade,
  photo_url    text not null,
  caption      text check (char_length(caption) <= 300),
  created_at   timestamptz not null default now()
);
create index quest_photos_sidequest_idx on public.quest_photos (sidequest_id, created_at desc);
create index quest_photos_user_idx      on public.quest_photos (user_id);

alter table public.quest_photos enable row level security;
create policy "Quest photos visible when sidequest is visible"
  on public.quest_photos for select to anon, authenticated
  using ((select private.can_view_sidequest(sidequest_id)));
create policy "Users add photos to quests they started"
  on public.quest_photos for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.user_sidequests us
                where us.user_id = (select auth.uid())
                  and us.sidequest_id = quest_photos.sidequest_id
                  and us.status in ('in_progress', 'completed', 'saved'))
  );
create policy "Users delete their own photos"
  on public.quest_photos for delete to authenticated
  using (user_id = (select auth.uid()));
