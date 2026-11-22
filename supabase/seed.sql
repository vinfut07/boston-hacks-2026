-- Seed data for LOCAL/dev and the demo project. Safe to re-run.
--
-- Profiles are created by the auth trigger, so sidequests (which need a
-- creator_id) are added after the "Breadcrumb Team" demo account exists.
-- Experiences and curated sidequests below are generated from
-- docs/research/experiences.json and docs/research/sidequests.json.

insert into public.communities (name, slug, university) values
  ('Boston University', 'bu', 'Boston University'),
  ('Boston College',    'bc', 'Boston College')
on conflict (slug) do nothing;

-- -----------------------------------------------------------------------------
-- experiences: verified place library (source: docs/research/experiences.json)
-- Re-runnable: a place is skipped if one with the same name and address exists.
-- -----------------------------------------------------------------------------
insert into public.experiences
  (name, description, category, neighborhood, address, latitude, longitude,
   estimated_cost, nearest_station, open_late)
select v.* from (values
  ('Tatte Bakery & Café', 'Bright bakery café in the old Charles Street Meeting House, known for pastries and shakshuka.', 'food_drink', 'Beacon Hill', '70 Charles St, Boston, MA 02114', 42.35792, -71.07065, 15, 'Charles/MGH (Red Line)', false),
  ('Beacon Hill Books & Cafe', 'Independent bookstore in a five-story townhouse, with a small café inside.', 'shopping', 'Beacon Hill', '71 Charles St, Boston, MA 02114', 42.35818, -71.07032, 10, 'Charles/MGH (Red Line)', false),
  ('Boston Public Garden', 'Historic public park with a lagoon, a footbridge and the Make Way for Ducklings statues.', 'outdoors', 'Beacon Hill', '4 Charles St, Boston, MA 02116', 42.35409, -71.07004, 0, 'Arlington (Green Line)', false),
  ('Charles River Esplanade & Hatch Shell', 'Riverside park path along the Charles, centered on the Hatch Memorial Shell. Good for walks and sunsets.', 'outdoors', 'Beacon Hill', '47 David G Mugar Way, Boston, MA 02108', 42.3573, -71.0737, 0, 'Charles/MGH (Red Line)', false),
  ('Boston Public Library, Central Library', 'Landmark library in Copley Square with murals, a courtyard and the grand Bates Hall reading room. Free to visit.', 'arts_culture', 'Back Bay', '700 Boylston St, Boston, MA 02116', 42.34933, -71.07865, 0, 'Copley (Green Line)', false),
  ('Trident Booksellers & Café', 'Bookstore and all-day café on Newbury Street, popular for brunch and browsing.', 'food_drink', 'Back Bay', '338 Newbury St, Boston, MA 02115', 42.34824, -71.08661, 15, 'Hynes Convention Center (Green Line)', false),
  ('Pavement Coffeehouse', 'Local coffee shop chain''s Newbury Street café, with bagels and a cozy room for studying.', 'food_drink', 'Back Bay', '286 Newbury St, Boston, MA 02115', 42.34889, -71.08441, 8, 'Hynes Convention Center (Green Line)', false),
  ('Mike''s Pastry', 'Famous North End pastry shop known for cannoli in its signature white box.', 'food_drink', 'North End', '300 Hanover St, Boston, MA 02113', 42.36427, -71.05438, 8, 'Haymarket (Orange and Green Lines)', false),
  ('Caffè Vittoria', 'Old-school Italian café on Hanover Street for espresso, gelato and cannoli. Stays open late.', 'food_drink', 'North End', '290 Hanover St, Boston, MA 02113', 42.36407, -71.05437, 10, 'Haymarket (Orange and Green Lines)', true),
  ('Bova''s Bakery', 'Family-run Italian bakery open 24 hours, a classic stop for late-night cannoli and calzones.', 'affordable', 'North End', '134 Salem St, Boston, MA 02113', 42.3652, -71.05559, 6, 'Haymarket (Orange and Green Lines)', true),
  ('Pizzeria Regina', 'The original North End location of a pizzeria open since 1926, serving brick-oven pies.', 'food_drink', 'North End', '11 1/2 Thacher St, Boston, MA 02113', 42.3654, -71.05686, 15, 'Haymarket (Orange and Green Lines)', false),
  ('Paul Revere House', 'Paul Revere''s 17th-century home, one of the oldest buildings in downtown Boston and a Freedom Trail stop.', 'attractions', 'North End', '19 North Square, Boston, MA 02113', 42.36374, -71.05368, 6, 'Haymarket (Orange and Green Lines)', false),
  ('Harvard Book Store', 'Independent bookstore in Harvard Square with new and used books and a busy author events series.', 'shopping', 'Harvard Square', '1256 Massachusetts Ave, Cambridge, MA 02138', 42.37254, -71.11636, 0, 'Harvard (Red Line)', false),
  ('Harvard Art Museums', 'Three museums under one glass roof, from Asian art to modern European painting. Admission is free for everyone.', 'arts_culture', 'Harvard Square', '32 Quincy St, Cambridge, MA 02138', 42.3741, -71.11411, 0, 'Harvard (Red Line)', false),
  ('Harvard Yard', 'The historic heart of Harvard''s campus, with the John Harvard statue and leafy paths open to the public.', 'attractions', 'Harvard Square', 'Massachusetts Ave & Peabody St, Cambridge, MA 02138', 42.37409, -71.11672, 0, 'Harvard (Red Line)', false),
  ('Pinocchio''s Pizza & Subs', 'Harvard Square pizza shop since 1966, known as "Noch''s" and famous for late-night Sicilian slices.', 'affordable', 'Harvard Square', '74 Winthrop St, Cambridge, MA 02138', 42.372003, -71.120268, 8, 'Harvard (Red Line)', true),
  ('MIT Museum', 'Museum of science, technology and art in Kendall Square, with robots, holograms and rotating exhibits.', 'arts_culture', 'Central/Kendall Square', '314 Main St, Cambridge, MA 02142', 42.36198, -71.08642, 20, 'Kendall/MIT (Red Line)', false),
  ('Graffiti Alley (Modica Way)', 'A walkway off Mass Ave where graffiti is legal and the murals change constantly. Free.', 'arts_culture', 'Central/Kendall Square', '567 Massachusetts Ave, Cambridge, MA 02139', 42.36491, -71.10229, 0, 'Central (Red Line)', false),
  ('Flour Bakery + Café', 'Popular Boston bakery''s Central Square location, known for sticky buns and sandwiches.', 'food_drink', 'Central/Kendall Square', '190 Massachusetts Ave, Cambridge, MA 02139', 42.360996, -71.096827, 12, 'Central (Red Line)', false),
  ('Museum of Fine Arts, Boston', 'One of the largest art museums in the country, with collections from ancient Egypt to contemporary art. Many local colleges get students in free.', 'arts_culture', 'Fenway', '465 Huntington Ave, Boston, MA 02115', 42.33946, -71.0939, 27, 'Museum of Fine Arts (Green Line E)', false),
  ('Isabella Stewart Gardner Museum', 'A Venetian-style palace filled with art around a flowering courtyard. Student tickets are discounted, and Thursday nights are free.', 'arts_culture', 'Fenway', '25 Evans Way, Boston, MA 02115', 42.33825, -71.09915, 15, 'Museum of Fine Arts (Green Line E)', false),
  ('James P. Kelleher Rose Garden', 'Free formal rose garden tucked inside the Back Bay Fens, at its best in early summer.', 'outdoors', 'Fenway', '73 Park Dr, Boston, MA 02215', 42.34164, -71.09476, 0, 'Museum of Fine Arts (Green Line E)', false),
  ('Institute of Contemporary Art (ICA)', 'Contemporary art museum cantilevered over Boston Harbor, with harbor views from the glass-walled gallery.', 'arts_culture', 'Seaport', '25 Harbor Shore Dr, Boston, MA 02210', 42.35287, -71.04296, 15, 'Courthouse (Silver Line)', false),
  ('Fan Pier Park & Harborwalk', 'Waterfront lawn and harbor walk with skyline views, next to the ICA. Free.', 'outdoors', 'Seaport', 'Fan Pier Blvd, Boston, MA 02210', 42.35466, -71.04718, 0, 'Courthouse (Silver Line)', false),
  ('Boston Tea Party Ships & Museum', 'Floating museum with replica ships and costumed guides where you can throw tea into the harbor.', 'attractions', 'Seaport', '306 Congress St, Boston, MA 02210', 42.3522, -71.0513, 36, 'South Station (Red Line)', false),
  ('Flour Bakery + Café (Fort Point)', 'Fort Point location of the Boston bakery, an easy stop for coffee and a pastry near the Seaport.', 'food_drink', 'Seaport', '12 Farnsworth St, Boston, MA 02210', 42.35141, -71.04881, 12, 'South Station (Red Line)', false),
  ('Chinatown Gate', 'Ornate paifang gate marking the entrance to Boston''s Chinatown, with a small park beside it. Free.', 'attractions', 'Chinatown', 'Beach St & Surface Rd, Boston, MA 02111', 42.35119, -71.05975, 0, 'Chinatown (Orange Line)', false),
  ('Double Chin', 'Modern Asian comfort food and dessert spot, known for its cube toast. Open late, especially on weekends.', 'food_drink', 'Chinatown', '86 Harrison Ave, Boston, MA 02111', 42.35074, -71.06124, 25, 'Chinatown (Orange Line)', true),
  ('Hei La Moon', 'Large Cantonese restaurant known for daytime dim sum, good for groups.', 'food_drink', 'Chinatown', '83 Essex St, Boston, MA 02111', 42.35238, -71.06023, 25, 'Chinatown (Orange Line)', false),
  ('Dumpling Cafe', 'Casual Taiwanese spot for soup dumplings and noodles at student-friendly prices, open late.', 'affordable', 'Chinatown', '695 Washington St, Boston, MA 02111', 42.35122, -71.06305, 20, 'Chinatown (Orange Line)', true)
) as v(name, description, category, neighborhood, address, latitude, longitude,
          estimated_cost, nearest_station, open_late)
where not exists (
  select 1 from public.experiences e
  where e.name = v.name and e.address = v.address
);

-- -----------------------------------------------------------------------------
-- Curated sidequest: Chinatown Food Tour (source: docs/research/sidequests.json)
-- Owned by the "Breadcrumb Team" demo profile (username breadcrumb). If that
-- account doesn't exist yet, nothing is inserted: sign it up, set the username,
-- then re-run the seed. Skipped if the team already has a sidequest with this title.
-- Stops link to experiences by name + address; crumbs link to their stop.
-- -----------------------------------------------------------------------------
with creator as (
  select id from public.profiles where username = 'breadcrumb'
),
quest as (
  insert into public.sidequests
    (creator_id, title, description, category, estimated_cost, estimated_duration_minutes,
     neighborhood, scheduled_at, status, primary_line, is_curated)
  select creator.id, 'Chinatown Food Tour',
         'Eat your way through Boston''s Chinatown in one afternoon: dim sum, soup dumplings, then dessert. Every stop is a short walk from the last, and portions are meant for sharing, so come hungry and bring friends.',
         'food_drink', 37, 150,
         'Chinatown', '2026-11-28T11:00:00-05:00', 'published', 'ol', true
  from creator
  where not exists (
    select 1 from public.sidequests sq
    where sq.creator_id = creator.id and sq.title = 'Chinatown Food Tour'
  )
  returning id
),
stops as (
  insert into public.sidequest_stops
    (sidequest_id, experience_id, place_name, address, latitude, longitude, stop_order,
     description, planned_activity, travel_mode_to_stop, estimated_cost, notes)
  select quest.id, e.id, v.place_name, v.address, v.latitude, v.longitude, v.stop_order,
         v.description, v.planned_activity, v.travel_mode_to_stop, v.estimated_cost, v.notes
  from quest
  cross join (values
    (0, 'Chinatown Gate', 'Beach St & Surface Rd, Boston, MA 02111', 42.35119, -71.05975, 'Meet at the gate at the start of Beach Street.', 'Meet up and take a group photo.', null, 0, '2 min walk from Chinatown station (Orange Line).'),
    (1, 'Hei La Moon', '83 Essex St, Boston, MA 02111', 42.35238, -71.06023, 'Big Cantonese dining room for dim sum. Dim sum is served during the day only.', 'Share a round of dim sum.', 'walk', 15, 'About 2 min walk. Arrive before noon on weekends to beat the line.'),
    (2, 'Dumpling Cafe', '695 Washington St, Boston, MA 02111', 42.35122, -71.06305, 'Casual Taiwanese spot known for soup dumplings.', 'Split an order of soup dumplings.', 'walk', 10, 'About 4 min walk.'),
    (3, 'Double Chin', '86 Harrison Ave, Boston, MA 02111', 42.35074, -71.06124, 'Modern Asian comfort food and dessert, finishing the tour on something sweet.', 'Share dessert.', 'walk', 12, 'About 3 min walk.')
  ) as v(stop_order, place_name, address, latitude, longitude, description,
         planned_activity, travel_mode_to_stop, estimated_cost, notes)
  left join public.experiences e on e.name = v.place_name and e.address = v.address
  returning id, sidequest_id, stop_order
)
insert into public.checklist_items (sidequest_id, stop_id, label, item_type, item_order, is_checkpoint)
select stops.sidequest_id, stops.id, c.label, c.item_type, c.item_order, c.is_checkpoint
from stops
join (values
  (0, 'Take a group photo under the gate', 'do', 0, true),
  (0, 'Find the four characters written across the top of the gate', 'see', 1, false),
  (1, 'Order har gow and shumai for the table', 'do', 0, false),
  (1, 'Try one dish nobody in your group has had before', 'do', 1, false),
  (2, 'Eat a soup dumpling without spilling the soup', 'do', 0, false),
  (3, 'Split a cube toast', 'do', 0, false),
  (3, 'Vote on the best bite of the day', 'do', 1, true)
) as c(stop_order, label, item_type, item_order, is_checkpoint)
  on c.stop_order = stops.stop_order;
