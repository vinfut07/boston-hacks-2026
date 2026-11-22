-- =============================================================================
-- Database tests: save_trail(), the function behind the Make a trail page.
--
-- Checks that drafts can be incomplete, that publishing enforces the checklist
-- (name, category, 2–8 stops, a crumb at every stop), that a trail and all its
-- stops and crumbs are saved together, that saving again replaces the stops,
-- and that nobody can edit someone else's trail or call it logged out.
-- Rolled back, so it leaves no data.
--
-- Run locally with Docker: npm run test:db. Runs in CI on every PR.
-- =============================================================================
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'maker@test.dev'),
  ('22222222-2222-2222-2222-222222222222', 'other@test.dev');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}', true);

-- ---------------------------------------------------------------- drafts
select lives_ok(
  $$select public.save_trail('{"title": "Half-done idea", "status": "draft",
      "stops": [{"place_name": "Somewhere", "crumb": ""}]}'::jsonb)$$,
  'a draft can be saved with one stop and no crumb');
select throws_ok(
  $$select public.save_trail('{"title": "  ", "status": "draft", "stops": []}'::jsonb)$$,
  '23514', 'Give your trail a name', 'even a draft needs a name');

-- ---------------------------------------------------------------- publish checklist
select throws_ok(
  $$select public.save_trail('{"title": "No category", "status": "published",
      "stops": [{"place_name": "A", "crumb": "x"}, {"place_name": "B", "crumb": "y"}]}'::jsonb)$$,
  '23514', 'Pick a category before publishing', 'publishing needs a category');
select throws_ok(
  $$select public.save_trail('{"title": "One stop", "category": "food_drink", "status": "published",
      "stops": [{"place_name": "A", "crumb": "x"}]}'::jsonb)$$,
  '23514', 'Add at least 2 stops before publishing', 'publishing needs 2+ stops');
select throws_ok(
  $$select public.save_trail('{"title": "Missing crumb", "category": "food_drink", "status": "published",
      "stops": [{"place_name": "A", "crumb": "x"}, {"place_name": "B", "crumb": " "}]}'::jsonb)$$,
  '23514', 'Add a crumb at every stop before publishing', 'publishing needs a crumb at every stop');

-- ---------------------------------------------------------------- a full publish
create temp table saved (id uuid) on commit drop;
grant all on saved to authenticated;
insert into saved
select public.save_trail('{"title": "Rainy Day Bookshop Crawl", "category": "shopping", "status": "published",
  "estimated_cost": 15, "estimated_duration_minutes": 120,
  "stops": [
    {"place_name": "Brattle Book Shop", "address": "9 West St, Boston, MA 02111", "latitude": 42.3555, "longitude": -71.0625, "crumb": "Dig through the outdoor sale lot"},
    {"place_name": "Trident Booksellers & Café", "travel_mode_to_stop": "train", "crumb": "Read one chapter over a coffee"}
  ]}'::jsonb);

select is((select status from public.sidequests where id = (select id from saved)),
  'published', 'publishing saves the trail as published');
select is((select count(*)::int from public.sidequest_stops where sidequest_id = (select id from saved)),
  2, 'all stops are saved with the trail');
select is((select count(*)::int from public.checklist_items where sidequest_id = (select id from saved)),
  2, 'one crumb is saved per stop');
select is((select travel_mode_to_stop from public.sidequest_stops where sidequest_id = (select id from saved) and stop_order = 0),
  null, 'the first stop has no travel mode');

-- ---------------------------------------------------------------- editing
select public.save_trail('{"title": "Rainy Day Bookshop Crawl", "category": "shopping", "status": "published",
  "stops": [
    {"place_name": "Brattle Book Shop", "crumb": "Dig through the outdoor sale lot"},
    {"place_name": "Trident Booksellers & Café", "travel_mode_to_stop": "walk", "crumb": "Read one chapter"},
    {"place_name": "Boston Public Library", "travel_mode_to_stop": "walk", "crumb": "Find the courtyard"}
  ]}'::jsonb, (select id from saved));
select is((select count(*)::int from public.sidequest_stops where sidequest_id = (select id from saved)),
  3, 'saving again replaces the stops (no duplicates)');

select set_config('request.jwt.claims', '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}', true);
select throws_ok(
  format($$select public.save_trail('{"title": "Hijacked", "status": "draft", "stops": []}'::jsonb, %L)$$, (select id from saved)),
  '42501', null, 'nobody can save over someone else''s trail');

-- ---------------------------------------------------------------- logged out
set local role anon;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
select throws_ok(
  $$select public.save_trail('{"title": "Anon", "status": "draft", "stops": []}'::jsonb)$$,
  '42501', null, 'visitors cannot call save_trail');

select * from finish();
rollback;
