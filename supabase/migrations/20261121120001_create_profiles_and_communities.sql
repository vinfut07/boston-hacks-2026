-- =============================================================================
-- Breadcrumb — create_profiles_and_communities
--
-- Users and the groups they belong to.
--
-- - profiles: one row per Supabase Auth user, created automatically on signup
--   (email or Google OAuth). username starts empty and is chosen in onboarding.
--   display_name / avatar_url are filled from the signup or OAuth metadata.
-- - communities: school groups (BU, BC…). Each user can belong to one, via
--   profiles.community_id (PRD §6.1).
-- - follows: who follows whom (P2 social feature).
-- - private schema: security helper functions used by RLS policies. Not
--   exposed through the API, so clients can't call them directly.
--
-- Runs first. Used by: auth/onboarding, profile pages, community switcher.
-- Immutable once applied: make changes in a new migration (npm run db:new).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Private schema for helper functions (RLS can call them; the API can't).
-- -----------------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to anon, authenticated;


-- -----------------------------------------------------------------------------
-- communities
-- -----------------------------------------------------------------------------
create table public.communities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 100),
  slug        text unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  university  text check (char_length(university) <= 120),
  description text check (char_length(description) <= 2000),
  created_by  uuid,  -- FK added after profiles exists
  created_at  timestamptz not null default now()
);
comment on column public.communities.slug is 'URL-safe id, e.g. "bu", "bc".';
create index communities_university_idx on public.communities (university);


-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique check (username ~ '^[a-z0-9_]{3,30}$'),
  display_name text check (char_length(display_name) <= 80),
  avatar_url   text,
  bio          text check (char_length(bio) <= 500),
  university   text check (char_length(university) <= 120),
  community_id uuid references public.communities (id) on delete set null,
  created_at   timestamptz not null default now()
);
comment on column public.profiles.username is
  'Null until the user picks one in onboarding. Lowercase [a-z0-9_], 3–30 chars.';
comment on column public.profiles.community_id is
  'The one community the user belongs to. Null = none. Set in settings.';
create index profiles_community_idx on public.profiles (community_id);

alter table public.communities
  add constraint communities_created_by_fkey
  foreign key (created_by) references public.profiles (id) on delete set null;


-- -----------------------------------------------------------------------------
-- follows (P2)
-- -----------------------------------------------------------------------------
create table public.follows (
  follower_id  uuid not null references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (follower_id, following_id),
  constraint follows_no_self check (follower_id <> following_id)
);
create index follows_following_idx on public.follows (following_id);


-- -----------------------------------------------------------------------------
-- Auto-create a profile when someone signs up (email or OAuth).
-- username stays null so signup can never fail on a username clash.
-- -----------------------------------------------------------------------------
create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      nullif(new.raw_user_meta_data ->> 'name', ''),
      split_part(coalesce(new.email, ''), '@', 1)
    ), 80),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function private.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- Backfill: give a profile to anyone who signed up before this migration ran.
insert into public.profiles (id, display_name, avatar_url)
select
  u.id,
  left(coalesce(
    nullif(u.raw_user_meta_data ->> 'display_name', ''),
    nullif(u.raw_user_meta_data ->> 'full_name', ''),
    nullif(u.raw_user_meta_data ->> 'name', ''),
    split_part(coalesce(u.email, ''), '@', 1)
  ), 80),
  u.raw_user_meta_data ->> 'avatar_url'
from auth.users u
on conflict (id) do nothing;


-- -----------------------------------------------------------------------------
-- Helper: is the current user a member of this community?
-- -----------------------------------------------------------------------------
create or replace function private.in_community(p_community_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.community_id = p_community_id
  );
$$;
revoke all on function private.in_community(uuid) from public;
grant execute on function private.in_community(uuid) to anon, authenticated;


-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.communities enable row level security;
alter table public.follows     enable row level security;

-- profiles: public read. Only the signup trigger inserts. Users edit only themselves.
create policy "Profiles are publicly readable"
  on public.profiles for select to anon, authenticated using (true);
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- communities: public read; creators manage their own.
create policy "Communities are publicly readable"
  on public.communities for select to anon, authenticated using (true);
create policy "Users can create communities as themselves"
  on public.communities for insert to authenticated
  with check (created_by = (select auth.uid()));
create policy "Creators can update their communities"
  on public.communities for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));
create policy "Creators can delete their communities"
  on public.communities for delete to authenticated
  using (created_by = (select auth.uid()));

-- follows: public read; follow/unfollow only as yourself.
create policy "Follows are publicly readable"
  on public.follows for select to anon, authenticated using (true);
create policy "Users can follow on their own behalf"
  on public.follows for insert to authenticated
  with check (follower_id = (select auth.uid()));
create policy "Users can unfollow on their own behalf"
  on public.follows for delete to authenticated
  using (follower_id = (select auth.uid()));
