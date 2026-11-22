-- =============================================================================
-- Database tests: saving, signing up, running a quest, and ticking checklists.
--
-- Checks the rules in user_sidequests and checklist_completions: you can only
-- sign up for scheduled sidequests, only write your own progress, only tick
-- items on a quest you've saved or started, timestamps fill in automatically, and other
-- people can't see your progress. Rolled back, so it leaves no data.
--
-- Run locally with Docker: npm run test:db. Runs in CI on every PR.
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

-- ---------------------------------------------------------------- setup (as admin)
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'creator@test.dev'),
  ('22222222-2222-2222-2222-222222222222', 'player@test.dev'),
  ('33333333-3333-3333-3333-333333333333', 'other@test.dev');

insert into public.sidequests (id, creator_id, title, status, scheduled_at) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Anytime',   'published', null),
  ('a0000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Scheduled', 'published', now() + interval '3 days'),
  ('a0000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Draft',     'draft',     null);

insert into public.sidequest_stops (id, sidequest_id, place_name, stop_order) values
  ('50000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Stop 1', 0),
  ('50000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000002', 'Stop A', 0);

insert into public.checklist_items (id, sidequest_id, stop_id, label) values
  ('ca000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Try the pastry');

-- ---------------------------------------------------------------- data integrity (as admin)
select throws_ok(
  $$insert into public.checklist_items (sidequest_id, stop_id, label) values ('a0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'Wrong stop')$$,
  '23503', null, 'a checklist item''s stop must belong to the same sidequest');

-- ---------------------------------------------------------------- as the player
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', true);

select lives_ok(
  $$insert into public.user_sidequests (user_id, sidequest_id, status) values ('22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000001', 'saved')$$,
  'can save a sidequest');
select throws_ok(
  $$update public.user_sidequests set status = 'signed_up' where sidequest_id = 'a0000000-0000-0000-0000-000000000001'$$,
  '23514', null, 'cannot sign up for an anytime sidequest');
select lives_ok(
  $$insert into public.user_sidequests (user_id, sidequest_id, status) values ('22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000002', 'signed_up')$$,
  'can sign up for a scheduled sidequest');
select throws_ok(
  $$insert into public.user_sidequests (user_id, sidequest_id, status) values ('22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000003', 'saved')$$,
  '42501', null, 'cannot save a draft you can''t see');
select throws_ok(
  $$insert into public.user_sidequests (user_id, sidequest_id, status) values ('33333333-3333-3333-3333-333333333333', 'a0000000-0000-0000-0000-000000000001', 'saved')$$,
  '42501', null, 'cannot write progress for someone else');
update public.user_sidequests set status = 'in_progress' where sidequest_id = 'a0000000-0000-0000-0000-000000000001';
select isnt(
  (select started_at from public.user_sidequests where sidequest_id = 'a0000000-0000-0000-0000-000000000001'),
  null, 'starting a quest sets started_at');
select lives_ok(
  $$insert into public.checklist_completions (user_id, checklist_item_id) values ('22222222-2222-2222-2222-222222222222', 'ca000000-0000-0000-0000-000000000001')$$,
  'can tick items once the quest is in progress');

update public.user_sidequests set status = 'completed' where sidequest_id = 'a0000000-0000-0000-0000-000000000001';
select isnt(
  (select completed_at from public.user_sidequests where sidequest_id = 'a0000000-0000-0000-0000-000000000001'),
  null, 'completing a quest sets completed_at');

update public.user_sidequests set status = 'saved' where sidequest_id = 'a0000000-0000-0000-0000-000000000001';
select is(
  (select completed_at from public.user_sidequests where sidequest_id = 'a0000000-0000-0000-0000-000000000001'),
  null, 'leaving completed clears completed_at');

-- ---------------------------------------------------------------- as someone else
select set_config('request.jwt.claims', '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}', true);
select is((select count(*)::int from public.user_sidequests), 0, 'other users cannot see your progress');
select is((select count(*)::int from public.checklist_completions), 0, 'other users cannot see your checklist ticks');
select throws_ok(
  $$insert into public.checklist_completions (user_id, checklist_item_id) values ('33333333-3333-3333-3333-333333333333', 'ca000000-0000-0000-0000-000000000001')$$,
  '42501', null, 'cannot tick items on a quest you never saved or started');

select * from finish();
rollback;
