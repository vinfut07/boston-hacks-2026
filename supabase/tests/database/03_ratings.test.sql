-- =============================================================================
-- Database tests: rating sidequests and the rating averages.
--
-- Checks that only people who completed a sidequest can rate it, only once,
-- with scores 1–5, that creators can't rate their own, and that the
-- sidequest_rating_stats and questgiver_ratings views compute the averages
-- shown on cards and profiles. Rolled back, so it leaves no data.
--
-- Run locally with Docker: npm run test:db. Runs in CI on every PR.
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

-- ---------------------------------------------------------------- setup (as admin)
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'creator@test.dev'),
  ('22222222-2222-2222-2222-222222222222', 'rater@test.dev'),
  ('33333333-3333-3333-3333-333333333333', 'rater2@test.dev');

insert into public.sidequests (id, creator_id, title, status) values
  ('a0000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Rated quest', 'published');

-- rater has saved it but not completed it yet; rater2 and the creator completed it
insert into public.user_sidequests (user_id, sidequest_id, status) values
  ('22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000001', 'saved'),
  ('33333333-3333-3333-3333-333333333333', 'a0000000-0000-0000-0000-000000000001', 'completed'),
  ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'completed');

-- ---------------------------------------------------------------- as the rater
set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', true);

select throws_ok(
  $$insert into public.sidequest_ratings (user_id, sidequest_id, price_rating, time_rating, enjoyment_rating, memorability_rating)
    values ('22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000001', 5, 5, 5, 5)$$,
  '23514', null, 'cannot rate a sidequest you haven''t completed');

update public.user_sidequests set status = 'completed' where sidequest_id = 'a0000000-0000-0000-0000-000000000001';
select lives_ok(
  $$insert into public.sidequest_ratings (user_id, sidequest_id, price_rating, time_rating, enjoyment_rating, memorability_rating)
    values ('22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000001', 4, 3, 5, 4)$$,
  'can rate after completing');
select throws_ok(
  $$insert into public.sidequest_ratings (user_id, sidequest_id, price_rating, time_rating, enjoyment_rating, memorability_rating)
    values ('22222222-2222-2222-2222-222222222222', 'a0000000-0000-0000-0000-000000000001', 1, 1, 1, 1)$$,
  '23505', null, 'can only rate a sidequest once');
select throws_ok(
  $$update public.sidequest_ratings set price_rating = 6 where user_id = '22222222-2222-2222-2222-222222222222'$$,
  '23514', null, 'scores must be between 1 and 5');
select throws_ok(
  $$insert into public.sidequest_ratings (user_id, sidequest_id, price_rating, time_rating, enjoyment_rating, memorability_rating)
    values ('33333333-3333-3333-3333-333333333333', 'a0000000-0000-0000-0000-000000000001', 5, 5, 5, 5)$$,
  '42501', null, 'cannot rate as someone else');

-- ---------------------------------------------------------------- as rater2 and the creator
select set_config('request.jwt.claims', '{"sub": "33333333-3333-3333-3333-333333333333", "role": "authenticated"}', true);
insert into public.sidequest_ratings (user_id, sidequest_id, price_rating, time_rating, enjoyment_rating, memorability_rating)
  values ('33333333-3333-3333-3333-333333333333', 'a0000000-0000-0000-0000-000000000001', 2, 3, 3, 4);

select set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);
select throws_ok(
  $$insert into public.sidequest_ratings (user_id, sidequest_id, price_rating, time_rating, enjoyment_rating, memorability_rating)
    values ('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 5, 5, 5, 5)$$,
  '23514', null, 'creators cannot rate their own sidequest');

-- ---------------------------------------------------------------- averages, as a visitor
-- rater: (4+3+5+4)/4 = 4.00, rater2: (2+3+3+4)/4 = 3.00 → overall 3.50
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select is(
  (select rating_count from public.sidequest_rating_stats where sidequest_id = 'a0000000-0000-0000-0000-000000000001'),
  2, 'rating stats count every rating');
select is(
  (select avg_overall from public.sidequest_rating_stats where sidequest_id = 'a0000000-0000-0000-0000-000000000001'),
  3.50, 'overall rating = average of the four scores across raters');
select is(
  (select avg_overall from public.questgiver_ratings where creator_id = '11111111-1111-1111-1111-111111111111'),
  3.50, 'questgiver rating = average across everything the creator made');

select * from finish();
rollback;
