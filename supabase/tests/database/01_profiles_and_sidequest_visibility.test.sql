-- =============================================================================
-- Database tests: profiles and who can see / edit sidequests.
--
-- Checks that signup creates a profile, that drafts and community-only
-- sidequests stay hidden from the wrong people, that nobody can edit someone
-- else's content, and that visitors (anon) and users can't write to read-only
-- tables. Runs in a transaction that is rolled back, so it leaves no data.
--
-- Run locally with Docker: npm run test:db. Runs in CI on every PR.
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

-- ---------------------------------------------------------------- setup (as admin)
insert into auth.users (id, email, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'alice@test.dev', '{"full_name": "Alice A"}'),
  ('22222222-2222-2222-2222-222222222222', 'bob@test.dev',   '{}'),
  ('33333333-3333-3333-3333-333333333333', 'cara@test.dev',  '{}');

insert into public.communities (id, name, slug) values
  ('c0000000-0000-0000-0000-000000000001', 'Test Community', 'test-community');
update public.profiles set community_id = 'c0000000-0000-0000-0000-000000000001'
  where id = '33333333-3333-3333-3333-333333333333';

insert into public.sidequests (id, creator_id, title, status, community_id) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Public',         'published', null),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Draft',          'draft',     null),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Community only', 'published', 'c0000000-0000-0000-0000-000000000001');

insert into public.sidequest_stops (sidequest_id, place_name, stop_order) values
  ('a0000000-0000-0000-0000-000000000001', 'Public stop', 0),
  ('a0000000-0000-0000-0000-000000000002', 'Secret stop', 0);

-- ---------------------------------------------------------------- signup trigger
select is(
  (select count(*)::int from public.profiles where id in (
    '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', '33333333-3333-3333-3333-333333333333')),
  3, 'signing up creates a profile automatically');
select is(
  (select display_name from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  'Alice A', 'display_name comes from the signup / OAuth full_name');
select is(
  (select username from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  null, 'username starts empty until onboarding');

-- ---------------------------------------------------------------- as Bob (no community)
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', true);

select is((select count(*)::int from public.sidequests where creator_id = '11111111-1111-1111-1111-111111111111'),
  1, 'others only see published, non-community sidequests');
select is((select count(*)::int from public.sidequest_stops where place_name = 'Secret stop'),
  0, 'stops of a draft are hidden');
select throws_ok(
  $$insert into public.sidequests (creator_id, title) values ('11111111-1111-1111-1111-111111111111', 'Fake')$$,
  '42501', null, 'cannot create a sidequest as someone else');
update public.sidequests set title = 'Hacked' where id = 'a0000000-0000-0000-0000-000000000001';
select throws_ok(
  $$insert into public.sidequest_stops (sidequest_id, place_name, stop_order) values ('a0000000-0000-0000-0000-000000000001', 'Injected', 9)$$,
  '42501', null, 'cannot add stops to someone else''s sidequest');
update public.profiles set bio = 'Hacked' where id = '11111111-1111-1111-1111-111111111111';
select throws_ok(
  $$insert into public.experiences (name, category, latitude, longitude) values ('Fake place', 'outdoors', 42.36, -71.06)$$,
  '42501', null, 'users cannot add to the curated place library');
select lives_ok(
  $$update public.profiles set username = 'bob_test' where id = '22222222-2222-2222-2222-222222222222'$$,
  'users can update their own profile');

-- ---------------------------------------------------------------- as Cara (community member)
select set_config('request.jwt.claims', '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}', true);
select is((select count(*)::int from public.sidequests where creator_id = '11111111-1111-1111-1111-111111111111'),
  2, 'community members also see their community''s sidequests');

-- ---------------------------------------------------------------- as Alice (creator)
select set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);
select is((select count(*)::int from public.sidequests where creator_id = '11111111-1111-1111-1111-111111111111'),
  3, 'creators see their own drafts');

-- ---------------------------------------------------------------- as a visitor (anon)
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select is((select count(*)::int from public.sidequests where creator_id = '11111111-1111-1111-1111-111111111111'),
  1, 'visitors see only published, non-community sidequests');
select throws_ok(
  $$insert into public.follows (follower_id, following_id) values ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')$$,
  '42501', null, 'visitors cannot write anything');

-- ---------------------------------------------------------------- results (as admin)
reset role;
select is((select title from public.sidequests where id = 'a0000000-0000-0000-0000-000000000001'),
  'Public', 'nobody can edit someone else''s sidequest (update was silently ignored)');
select is((select bio from public.profiles where id = '11111111-1111-1111-1111-111111111111'),
  null, 'nobody can edit someone else''s profile (update was silently ignored)');

select * from finish();
rollback;
