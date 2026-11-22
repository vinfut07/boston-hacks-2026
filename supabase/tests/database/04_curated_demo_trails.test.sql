-- =============================================================================
-- Database tests: the curated demo trails seeded by seed_curated_demo_trails.
--
-- Checks that a logged-out visitor sees the three curated trails from the seed
-- migration, that every curated trail (including ones added later in seed.sql)
-- has stops and crumbs and links its stops to the place library, and that at
-- least one is scheduled. Doesn't assume an exact total, so new trails don't break it.
--
-- Run locally with Docker: npm run test:db. Runs in CI on every PR.
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(6);

select is(
  (select username from public.profiles where id = 'b2ead000-0000-4000-8000-000000000001'),
  'breadcrumb', 'the breadcrumb team account owns curated trails');

set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);

select is(
  (select count(*)::int from public.sidequests
   where status = 'published' and is_curated and id in (
     '5eed0000-0000-4000-8000-000000000001', '5eed0000-0000-4000-8000-000000000002', '5eed0000-0000-4000-8000-000000000003')),
  3, 'visitors see the three curated trails from the seed migration (more may be added by seed.sql)');
select ok(
  exists (select 1 from public.sidequests where title = 'Sunday Café Hop'),
  'the PRD demo trail "Sunday Café Hop" exists');
select ok(
  exists (select 1 from public.sidequests where is_curated and scheduled_at is not null),
  'at least one curated trail is scheduled (for testing Join)');
select ok(
  not exists (
    select 1 from public.sidequests s
    where s.is_curated
      and ((select count(*) from public.sidequest_stops st where st.sidequest_id = s.id) < 2
        or (select count(*) from public.checklist_items ci where ci.sidequest_id = s.id) < 2)),
  'every curated trail has at least 2 stops and 2 crumbs');
select ok(
  not exists (
    select 1 from public.sidequest_stops st
    join public.sidequests s on s.id = st.sidequest_id
    where s.is_curated and st.experience_id is null),
  'every curated stop is linked to a place in the library');

select * from finish();
rollback;
