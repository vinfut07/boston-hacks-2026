-- =============================================================================
-- Breadcrumb — seed_curated_demo_trails
--
-- Demo content so Explore and Trail detail have real trails before users make
-- their own (PRD §10). All places are real Boston/Cambridge places.
--
-- - A "breadcrumb" team account that owns curated trails. It has no password,
--   so nobody can log in as it.
-- - 9 places in the curated library (experiences).
-- - 3 published, curated trails (sidequests) with stops and crumbs:
--     Sunday Café Hop            anytime, Beacon Hill → Back Bay (the PRD demo trail)
--     North End Cannoli Duel     anytime, North End
--     Harvard Square Bookstores  scheduled (Sun Nov 29 2026, 11 AM) so Join can be tested
--
-- Costs are rough per-person estimates. No hours or travel times are stored.
-- Fixed ids + "on conflict do nothing" make it safe if rows already exist.
--
-- Runs after: grant_api_access_to_app_tables.
-- Used by: Explore feed, Trail detail, Make a trail place picker.
-- Immutable once applied: make changes in a new migration (npm run db:new).
-- =============================================================================


-- -----------------------------------------------------------------------------
-- Team account (profile is created by the signup trigger, then named)
-- -----------------------------------------------------------------------------
insert into auth.users (instance_id, id, aud, role, email, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
values (
  '00000000-0000-0000-0000-000000000000',
  'b2ead000-0000-4000-8000-000000000001',
  'authenticated', 'authenticated',
  'team@breadcrumb.invalid',
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "breadcrumb"}',
  now(), now()
)
on conflict (id) do nothing;

update public.profiles
set username = 'breadcrumb',
    display_name = 'breadcrumb',
    bio = 'Curated trails from the Breadcrumb team.'
where id = 'b2ead000-0000-4000-8000-000000000001';


-- -----------------------------------------------------------------------------
-- Curated places
-- -----------------------------------------------------------------------------
insert into public.experiences (id, name, description, category, neighborhood, address, latitude, longitude, estimated_cost, nearest_station, open_late) values
  ('e0000000-0000-4000-8000-000000000001', 'Tatte Bakery & Café', 'Bright bakery on Charles Street known for pastries and shakshuka.', 'food_drink', 'Beacon Hill', '70 Charles St, Boston, MA 02114', 42.3587, -71.0707, 15, 'Charles/MGH (Red Line)', false),
  ('e0000000-0000-4000-8000-000000000002', 'Boston Public Garden', 'Victorian garden with a lagoon, the swan boats and the Make Way for Ducklings statues.', 'outdoors', 'Back Bay', '4 Charles St, Boston, MA 02116', 42.3541, -71.0703, 0, 'Arlington (Green Line)', false),
  ('e0000000-0000-4000-8000-000000000003', 'Trident Booksellers & Café', 'Bookstore and café on Newbury Street, good for a slow coffee and browsing.', 'food_drink', 'Back Bay', '338 Newbury St, Boston, MA 02115', 42.3486, -71.0864, 12, 'Hynes Convention Center (Green Line)', true),
  ('e0000000-0000-4000-8000-000000000004', 'Modern Pastry', 'Family-run Italian bakery on Hanover Street, famous for cannoli.', 'food_drink', 'North End', '257 Hanover St, Boston, MA 02113', 42.3633, -71.0544, 6, 'Haymarket (Orange/Green Line)', false),
  ('e0000000-0000-4000-8000-000000000005', 'Mike''s Pastry', 'The North End''s best-known cannoli shop, usually with a line out the door.', 'food_drink', 'North End', '300 Hanover St, Boston, MA 02113', 42.3643, -71.0544, 6, 'Haymarket (Orange/Green Line)', false),
  ('e0000000-0000-4000-8000-000000000006', 'Christopher Columbus Waterfront Park', 'Harbor-side park with a long trellis walkway and the Rose Kennedy Rose Garden.', 'outdoors', 'North End', 'Atlantic Ave, Boston, MA 02110', 42.3614, -71.0509, 0, 'Aquarium (Blue Line)', false),
  ('e0000000-0000-4000-8000-000000000007', 'Harvard Yard', 'The historic heart of Harvard University, home of the John Harvard statue.', 'attractions', 'Harvard Square', 'Harvard Yard, Cambridge, MA 02138', 42.3745, -71.1171, 0, 'Harvard (Red Line)', false),
  ('e0000000-0000-4000-8000-000000000008', 'Harvard Book Store', 'Independent bookstore on Mass Ave with new books upstairs and used books downstairs.', 'shopping', 'Harvard Square', '1256 Massachusetts Ave, Cambridge, MA 02138', 42.3724, -71.1162, 15, 'Harvard (Red Line)', false),
  ('e0000000-0000-4000-8000-000000000009', 'Grolier Poetry Book Shop', 'One of the oldest poetry bookshops in the US, tucked onto Plympton Street.', 'shopping', 'Harvard Square', '6 Plympton St, Cambridge, MA 02138', 42.3722, -71.1160, 10, 'Harvard (Red Line)', false)
on conflict (id) do nothing;


-- -----------------------------------------------------------------------------
-- Trails
-- -----------------------------------------------------------------------------
insert into public.sidequests (id, creator_id, title, description, category, neighborhood, estimated_cost, estimated_duration_minutes, scheduled_at, status, primary_line, is_curated) values
  ('5eed0000-0000-4000-8000-000000000001', 'b2ead000-0000-4000-8000-000000000001',
   'Sunday Café Hop',
   'A slow Sunday through Beacon Hill and Back Bay: breakfast on Charles Street, a lap of the Public Garden, then a book and a coffee on Newbury Street. Mostly walking, with one short Green Line ride.',
   'food_drink', 'Beacon Hill', 25, 150, null, 'published', 'gl', true),
  ('5eed0000-0000-4000-8000-000000000002', 'b2ead000-0000-4000-8000-000000000001',
   'North End Cannoli Duel',
   'Settle the oldest argument in Boston: Modern Pastry or Mike''s Pastry? Try one cannoli from each, pick a winner, then walk it off by the harbor.',
   'food_drink', 'North End', 15, 90, null, 'published', 'ol', true),
  ('5eed0000-0000-4000-8000-000000000003', 'b2ead000-0000-4000-8000-000000000001',
   'Harvard Square Bookstores',
   'A Sunday morning in Harvard Square: a lap of Harvard Yard, the stacks at Harvard Book Store, and a poem from the Grolier. Join the group or do it on your own.',
   'arts_culture', 'Harvard Square', 20, 120, '2026-11-29 11:00:00-05', 'published', 'rl', true)
on conflict (id) do nothing;


-- -----------------------------------------------------------------------------
-- Stops (travel_mode_to_stop = how to get here from the previous stop)
-- -----------------------------------------------------------------------------
insert into public.sidequest_stops (id, sidequest_id, experience_id, place_name, address, latitude, longitude, stop_order, planned_activity, travel_mode_to_stop, estimated_cost) values
  -- Sunday Café Hop
  ('5e000000-0000-4000-8001-000000000001', '5eed0000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000001', 'Tatte Bakery & Café', '70 Charles St, Boston, MA 02114', 42.3587, -71.0707, 0, 'Start with breakfast on Charles Street.', null, 15),
  ('5e000000-0000-4000-8001-000000000002', '5eed0000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000002', 'Boston Public Garden', '4 Charles St, Boston, MA 02116', 42.3541, -71.0703, 1, 'Loop the lagoon and cross the footbridge.', 'walk', 0),
  ('5e000000-0000-4000-8001-000000000003', '5eed0000-0000-4000-8000-000000000001', 'e0000000-0000-4000-8000-000000000003', 'Trident Booksellers & Café', '338 Newbury St, Boston, MA 02115', 42.3486, -71.0864, 2, 'Wander up Newbury Street and end with a book and a coffee.', 'train', 10),
  -- North End Cannoli Duel
  ('5e000000-0000-4000-8002-000000000001', '5eed0000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000004', 'Modern Pastry', '257 Hanover St, Boston, MA 02113', 42.3633, -71.0544, 0, 'Cannoli number one.', null, 6),
  ('5e000000-0000-4000-8002-000000000002', '5eed0000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000005', 'Mike''s Pastry', '300 Hanover St, Boston, MA 02113', 42.3643, -71.0544, 1, 'Cannoli number two, from a block up Hanover Street.', 'walk', 6),
  ('5e000000-0000-4000-8002-000000000003', '5eed0000-0000-4000-8000-000000000002', 'e0000000-0000-4000-8000-000000000006', 'Christopher Columbus Waterfront Park', 'Atlantic Ave, Boston, MA 02110', 42.3614, -71.0509, 2, 'Walk down to the harbor and declare a winner.', 'walk', 0),
  -- Harvard Square Bookstores
  ('5e000000-0000-4000-8003-000000000001', '5eed0000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000007', 'Harvard Yard', 'Harvard Yard, Cambridge, MA 02138', 42.3745, -71.1171, 0, 'Meet in the Yard and take a lap.', null, 0),
  ('5e000000-0000-4000-8003-000000000002', '5eed0000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000008', 'Harvard Book Store', '1256 Massachusetts Ave, Cambridge, MA 02138', 42.3724, -71.1162, 1, 'Browse new books upstairs and used books downstairs.', 'walk', 15),
  ('5e000000-0000-4000-8003-000000000003', '5eed0000-0000-4000-8000-000000000003', 'e0000000-0000-4000-8000-000000000009', 'Grolier Poetry Book Shop', '6 Plympton St, Cambridge, MA 02138', 42.3722, -71.1160, 2, 'Finish around the corner in a tiny poetry shop.', 'walk', 10)
on conflict (id) do nothing;


-- -----------------------------------------------------------------------------
-- Crumbs (small tasks at each stop)
-- -----------------------------------------------------------------------------
insert into public.checklist_items (sidequest_id, stop_id, label, item_type, item_order)
select v.sidequest_id::uuid, v.stop_id::uuid, v.label, v.item_type, v.item_order
from (values
  -- Sunday Café Hop
  ('5eed0000-0000-4000-8000-000000000001', '5e000000-0000-4000-8001-000000000001', 'Order a pastry or the shakshuka',              'do',  0),
  ('5eed0000-0000-4000-8000-000000000001', '5e000000-0000-4000-8001-000000000001', 'Walk a block of brick-lined Charles Street',   'see', 1),
  ('5eed0000-0000-4000-8000-000000000001', '5e000000-0000-4000-8001-000000000002', 'Find the Make Way for Ducklings statues',      'see', 2),
  ('5eed0000-0000-4000-8000-000000000001', '5e000000-0000-4000-8001-000000000002', 'Cross the lagoon footbridge',                  'do',  3),
  ('5eed0000-0000-4000-8000-000000000001', '5e000000-0000-4000-8001-000000000003', 'Read one chapter with a coffee',               'do',  4),
  -- North End Cannoli Duel
  ('5eed0000-0000-4000-8000-000000000002', '5e000000-0000-4000-8002-000000000001', 'Get one cannoli at Modern',                    'do',  0),
  ('5eed0000-0000-4000-8000-000000000002', '5e000000-0000-4000-8002-000000000002', 'Get one cannoli at Mike''s',                   'do',  1),
  ('5eed0000-0000-4000-8000-000000000002', '5e000000-0000-4000-8002-000000000003', 'Walk under the long trellis by the harbor',    'see', 2),
  ('5eed0000-0000-4000-8000-000000000002', '5e000000-0000-4000-8002-000000000003', 'Pick a winner',                                'do',  3),
  -- Harvard Square Bookstores
  ('5eed0000-0000-4000-8000-000000000003', '5e000000-0000-4000-8003-000000000001', 'Find the John Harvard statue',                 'see', 0),
  ('5eed0000-0000-4000-8000-000000000003', '5e000000-0000-4000-8003-000000000002', 'Browse the used books downstairs',             'do',  1),
  ('5eed0000-0000-4000-8000-000000000003', '5e000000-0000-4000-8003-000000000003', 'Read one poem start to finish',                'do',  2)
) as v(sidequest_id, stop_id, label, item_type, item_order)
where not exists (
  select 1 from public.checklist_items ci
  where ci.sidequest_id = v.sidequest_id::uuid and ci.label = v.label
);
