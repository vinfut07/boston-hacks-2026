# Breadcrumb — Product Requirements Document

- **Version:** 3.0 — BostonHacks MVP (revised)
- **Track:** Bos(tons) of Eats and Streets
- **Platform:** Mobile-first web app
- **Product category:** Social discovery, transit-first exploration, and shareable sidequests
- **Tagline:** You've lived here. Have you explored it?

## Table of Contents

1. [Product Vision](#1-product-vision)
2. [Problem Statement](#2-problem-statement)
3. [Target Users and Constraints](#3-target-users-and-constraints)
4. [Core Product Pillars](#4-core-product-pillars)
5. [Core Features (MVP)](#5-core-features-mvp)
6. [Cherry-on-Top Features](#6-cherry-on-top-features)
7. [Core User Flows](#7-core-user-flows)
8. [Technical Stack](#8-technical-stack)
9. [Database Design](#9-database-design)
10. [Content Strategy](#10-content-strategy)
11. [Hackathon Build Priorities](#11-hackathon-build-priorities)
12. [Suggested Build Sequence](#12-suggested-build-sequence)
13. [Demo Scenario](#13-demo-scenario)
14. [Success Criteria](#14-success-criteria)
15. [Product Positioning](#15-product-positioning)
16. [Revision Notes (v2.0 to v3.0)](#16-revision-notes-v20-to-v30)

## 1. Product Vision

Breadcrumb helps Boston college students make the most of the city they live in, without a car.

Boston students move by the T, bus, bike, and on foot. Whether it is a matcha run, a cheap meal off the Orange Line, or the one place open past 3:00am during finals week, the MBTA is how students get around. Yet many spend four years in the same few neighborhoods, and when a weekend arrives or friends visit, they struggle to think of something worth doing.

Breadcrumb solves that with **sidequests**: student-made, shareable outings that string together real Boston places into a route. Each sidequest shows the full path on a stylized map, tells you exactly how to get there by T and on foot, and turns the outing into a scavenger-hunt style checklist you can complete, photograph, and rate.

Think Beli × Strava × a student-made Boston city guide.

The goal is not simply finding somewhere to go. It is getting students to experience more of Boston before they graduate, and making that exploration social.

## 2. Problem Statement

Boston offers an enormous variety of food, culture, neighborhoods, and events, but students default to the same familiar places. The biggest barrier is logistics: no car, so every plan depends on knowing how to get there by public transit, bike, or walking.

Current solutions are fragmented:

- **Google Maps:** Finds places and routes but does not tell you what is worth doing as a college student, and does not package multi-stop outings.
- **Beli:** Tracks and ranks restaurants but does not cover full outings, transit, or activities.
- **TikTok/Instagram:** Offers inspiration but makes recommendations hard to organize, compare, and actually follow.
- **Event platforms:** Focus on single events rather than ongoing exploration, and rarely account for how students get there.

Students need a fun, social way to discover worthwhile outings and turn them into real plans that work without a car.

## 3. Target Users and Constraints

**Primary users:** University students in Boston and Cambridge, ages approximately 18–24.

**Constraints (apply to the whole product):**

- Boston and Cambridge only.
- Transportation is limited to the **MBTA train (T), buses, biking, and walking**. The app never suggests driving or rideshare.
- Mobile-first: the app is used on a phone while out exploring.

**Use cases:**

- "I've lived here for two years and barely explored Boston."
- "My friends are visiting. What should I show them?"
- "We want something fun to do Saturday under $30."
- "I need a cheap late-night meal I can reach by the T."
- "I saw my friend's sidequest and want to try it."
- "I want to plan an outing and invite people to join."

## 4. Core Product Pillars

### Pillar 1: Sidequests (the core content type)

A **sidequest** is a student-created outing made of one or more stops, with a route, a cost, a time estimate, and a checklist of things to see and do. Sidequests replace the separate "sidequest" and "itinerary" content types from v2.0: every outing is a sidequest, and every sidequest has a planned route.

Examples:

- "Sunday Cafe Hopping"
- "The Great Cannoli Debate" (two North End bakeries, pick a winner)
- "Broke in Boston" (a full outing under $20)
- "Cross the Charles" (an afternoon in Cambridge by T)
- "Finals Week Midnight Eats" (late-night spots reachable by transit)

Each sidequest includes:

- Title, short description, and cover image
- Estimated time and approximate total cost
- Ordered stops, each with a location, description, and planned activity
- A checklist of sights to see and activities to do
- The route between stops and how to travel each leg (T, bus, bike, or walk)
- Ratings and reviews from people who completed it
- The creator (the "questgiver") and their questgiver rating

Creators can optionally set a scheduled start time and invite others to join. Sidequests can be public or limited to a community (see Section 6).

### Pillar 2: Transit-First Maps

Public transit is the enabling feature that makes the track's constraint a product strength. Every sidequest has a stylized map showing the full path, and users can see how to get to and between stops by T, bus, bike, or on foot, similar to Google Maps. During a quest, the map shows the user's live location along the recommended path.

### Pillar 3: Social Accounts, Ratings, and Reputation

Users have accounts that track what they have created, saved, signed up for, and completed. Completed sidequests can be rated, and ratings roll up into a reputation for the questgiver who made them. Following friends, communities, and personalized recommendations extend this social layer (see Section 6).

**Curated experiences as building blocks.** The database still holds a library of verified Boston places ("experiences") that creators can pick from when building a sidequest, so stops come with accurate locations, cost estimates, and nearby stations. Creators can also add a custom location.

## 5. Core Features (MVP)

### 5.1 Accounts and Profiles

- Sign up and log in (Supabase Auth, plus a reliable demo account for judging).
- Profile with username, avatar, and bio.
- Profile tabs:
  - **Completed:** sidequests the user has finished
  - **Saved for later:** sidequests the user has bookmarked
  - **Signed up:** sidequests the user has joined but not yet finished
  - **Created:** sidequests the user has made
- **Questgiver rating:** the average rating across all completed ratings of sidequests the user created, with the number of ratings.

### 5.2 For You Page (Sidequest Feed)

The home screen is a list of available sidequests. Each post card shows:

- Title
- Time (estimated duration, plus scheduled start if set)
- Cost
- Short description
- Questgiver and overall rating

MVP ordering is simple (newest and highest rated). Filters: category, neighborhood, budget, and travel time. Because the track centers on cravings, budget, and location, include quick filters such as **Late night**, **Under $20**, and **Near a T station**.

### 5.3 Sidequest Detail Page

Opening a post shows an in-depth view:

- A Google Maps-style recommended path across all stops, on a stylized map
- Underneath, a description of each location and the planned event at that stop
- How to travel each leg (T line, bus route, bike, or walking) with estimated time
- The checklist of sights to see and activities to do
- Ratings and reviews from people who completed it
- Buttons: **Start quest**, **Save for later**, and **Sign up** (for sidequests with a scheduled start)

### 5.4 Start Quest Mode

Pressing **Start quest** opens a live view:

- The user's real-time location overlaid on the map and the recommended path.
- Below the map, a scavenger-hunt style checklist of sights to see and activities to do, grouped by stop. Users tick items off as they go.
- Optional photo attached to a checklist item as proof of completion (see Section 11 for priority).
- A bottom tab to add other photos from the outing.
- Bottom buttons: **Completed**, **Saved for later**, and **Abort**.

Completion is based on the user's checklist progress and confirmation. Photos serve as social proof and are visible on the sidequest; they are not machine-verified. Location is used for the live map only and is not stored.

### 5.5 Create a Sidequest

Users build a sidequest by:

1. Adding a title and description.
2. Adding stops from the curated library or as custom locations, and reordering them.
3. Writing the planned activity for each stop and adding checklist items (sights to see, things to do).
4. Choosing how to travel between stops (walk, bike, bus, or T).
5. Previewing the route on the map with combined cost and time.
6. Setting visibility, an optional scheduled start, and publishing to the For You page.

Other users can invite friends via a shareable link.

### 5.6 Rating a Completed Sidequest

After completing a sidequest, users can rate it on four dimensions, each 1–5:

- **Price:** was the cost fair for what you got?
- **Time:** did the travel and timing work out?
- **Enjoyment:** how fun was it?
- **Memorability:** will you remember it?

Users can add an optional short written review. The four scores combine into an overall rating shown on the sidequest card, and roll up into the creator's questgiver rating. Only users who completed a sidequest can rate it.

### 5.7 Maps and Transit

- Stylized map of the full path, with markers for each stop.
- Directions by T and walking (and bus or bike where available), using the Google Maps Directions API where possible.
- Nearby T stations shown for each stop (MBTA V3 API).
- "Open in Google Maps" deep link for turn-by-turn navigation on the phone.

## 6. Cherry-on-Top Features

Built only after all P0 features work end to end.

### 6.1 Communities

Community-specific sidequests (starting with BU and BC):

- Users join a community in settings.
- Sidequests can be tagged to a community.
- The For You page can switch between a single community's feed or view all communities.

### 6.2 Checkpoints

Things to see or do on the journey between stops, not just at stops. Examples: a mural on the walk between stations or a view from a bridge crossing. Each checkpoint can have an optional photo for completion verification.

### 6.3 Friends and Advanced Recommendations

- Follow other users.
- Rate individual users' quest-making ability directly (in addition to the automatic questgiver rating).
- Use the follow graph for more advanced recommendations on the For You page (for example, weight ratings from followed users and prefer sidequests in the user's budget and travel range).
- Friends' activity feed: friends completing or publishing sidequests.

MVP note: no comments, private messages, or push notifications are required.

## 7. Core User Flows

### Flow A: Discover and complete a sidequest

1. User opens Breadcrumb and sees the For You page.
2. Browses sidequest cards (title, time, cost, description).
3. Opens "Sunday Cafe Hopping" and reviews the route map, stops, and transit directions.
4. Taps **Start quest** (or **Save for later**).
5. Follows the live location along the path and checks off sights and activities, adding photos.
6. Taps **Completed**.
7. Rates the sidequest on price, time, enjoyment, and memorability.
8. The completion appears on their profile and counts toward the questgiver's rating.

### Flow B: Create and share a sidequest

1. User opens **Create**.
2. Adds a title, description, and stops, and orders them.
3. Adds the checklist and chooses how to travel between stops.
4. Previews the route, cost, and time on the map.
5. Publishes it, optionally with a scheduled start.
6. Shares the link; a friend opens it, signs up or saves it, and follows the route.

### Flow C: Abort or save for later

1. User starts a quest and changes plans.
2. Taps **Saved for later** to keep progress, or **Abort** to end the attempt.
3. Saved quests appear on the profile; aborted quests do not count as completed.

## 8. Technical Stack

| Component | Technology |
| --- | --- |
| Frontend | React 19 + Vite + TypeScript, React Router |
| Styling | Tailwind CSS |
| UI components | shadcn/ui + Lucide |
| Backend | Supabase called directly from the browser, protected by Row Level Security (Supabase Edge Functions only if a secret key is ever needed) |
| Database | Supabase PostgreSQL |
| Authentication | Supabase Auth |
| Maps and routes | Google Maps JavaScript API with custom map styling, plus the Directions API for transit, walking, and bicycling |
| Transit data | MBTA V3 API (stations, lines, nearby stops) |
| Live location | Browser Geolocation API (`watchPosition`) |
| Navigation | Google Maps deep links for turn-by-turn |
| Image and photo storage | Supabase Storage |
| Hosting | Vercel |
| Collaboration | GitHub |

**Technical architecture.** A Vite + React single-page app serves the mobile-first frontend and talks to Supabase directly; Row Level Security in the database enforces who can read and write what. There is no separate app server. Supabase stores profiles, places, sidequests, stops, checklists, progress, photos, and ratings. Google Maps renders the stylized route map and supplies directions; the MBTA API supplies station and line data. The browser Geolocation API powers live location during a quest.

**Maps decision to confirm.** v2.0 used MapLibre with MapTiler tiles. This revision uses Google Maps because the team wants Google-style transit directions. Google's terms generally expect Directions results to be shown on a Google map, so mixing Google routes with MapLibre may not be allowed (verify the current terms). If cost or terms become a problem, fall back to MapLibre plus MBTA data and Google Maps deep links.

AI is not required for the MVP. The focus is real data, social functionality, live location, and structured exploration.

## 9. Database Design

**profiles**

- id
- username
- display_name
- avatar_url
- bio
- community_id (nullable)
- created_at

**communities**

- id
- name (for example, BU, BC)
- slug

**experiences** (curated place library)

- id
- name
- description
- category
- neighborhood
- latitude
- longitude
- address
- estimated_cost
- nearest_station
- open_late (boolean)
- image_url
- created_at

**sidequests**

- id
- creator_id
- title
- description
- estimated_cost
- estimated_duration_minutes
- scheduled_start (nullable)
- community_id (nullable; null means visible to all)
- is_public
- image_url
- created_at

**sidequest_stops**

- id
- sidequest_id
- experience_id (nullable for custom locations)
- name
- latitude
- longitude
- stop_order
- planned_activity
- travel_mode_to_stop (walk, bike, bus, train)
- notes

**checklist_items**

- id
- sidequest_id
- stop_id (nullable; null for checkpoints between stops)
- label
- item_type (see or do)
- item_order
- is_checkpoint (boolean; used by the cherry-on-top checkpoints feature)

**user_sidequests**

- user_id
- sidequest_id
- status (saved, signed_up, in_progress, completed, aborted)
- started_at
- completed_at

**checklist_completions**

- user_id
- checklist_item_id
- completed_at
- photo_url (nullable)

**quest_photos** (extra photos from the "add other photos" tab)

- id
- user_id
- sidequest_id
- photo_url
- created_at

**sidequest_ratings**

- id
- user_id
- sidequest_id
- price_rating
- time_rating
- enjoyment_rating
- memorability_rating
- review_text
- created_at

**follows** (cherry on top)

- follower_id
- following_id

**creator_ratings** (cherry on top; direct rating of a user's quest-making)

- rater_id
- creator_id
- rating

**Derived values.** A questgiver rating is computed from `sidequest_ratings` across all sidequests a user created (a database view), so no separate column is needed for the MVP.

Use UUID identifiers, foreign keys, appropriate unique constraints (for example, one rating per user per sidequest), and Supabase Row Level Security. Public content is readable; only owners can modify their records; progress, photos, and saved lists are private to the user.

## 10. Content Strategy

Curated content is crucial. For the MVP, seed the database with approximately:

- 25–40 verified Boston experiences, including several open late and several reachable on a student budget
- 8–10 example sidequests, built from those experiences, with stops, checklists, and realistic costs
- Two communities (BU and BC) and several demo accounts with completed sidequests, ratings, and photos

Prioritize recognizable neighborhoods and places that are easy to reach by T or bus. Every seeded stop needs an accurate location and a nearby station. Use real, verified places rather than AI-generated fictional listings.

Initial categories:

- Food and drink (including late night and coffee or matcha)
- Outdoors
- Arts and culture
- Shopping
- Attractions
- Affordable activities

## 11. Hackathon Build Priorities

### P0 — Must Build

- Mobile-first responsive interface
- Accounts with profile tabs: completed, saved for later, signed up, created
- Questgiver rating on profiles
- For You page: list of sidequest cards (title, time, cost, description)
- Sidequest detail page with route map and location descriptions
- Create sidequest (stops, checklist, route preview, publish)
- Directions by T and walking (and bus or bike where available)
- Start quest mode: live location on the map, checklist, and Completed / Saved for later / Abort
- Rating a completed sidequest on price, time, enjoyment, and memorability
- Deployed working demo

### P1 — Build If Time Allows

- Photo upload on checklist items and the "add other photos" tab
- Sign up for a scheduled sidequest and share an invite link
- Filters: category, neighborhood, budget, late night, near a T station
- Curated experience library in the creator flow
- Basic ordering of the For You page by rating and recency

### P2 — Cherry on Top / Post-Hackathon

- Communities (BU and BC), joining in settings, and community switching on the For You page
- Checkpoints on the journey between stops, with photo verification
- Friends: follow, rate quest-making ability, and recommendations using the follow graph
- Friends' activity feed
- Remixing another person's sidequest
- Automatic route optimization
- Machine-verified completion, badges, and leaderboards
- Notifications, in-app messaging, and native mobile apps

## 12. Suggested Build Sequence

**Phase 1 — Foundation.** Set up Vite + React, Supabase, UI components, the schema, and seed data for experiences and sidequests.

**Phase 2 — Feed and Detail.** Build sidequest cards, the For You page, and the detail page without maps.

**Phase 3 — Maps and Transit.** Add the stylized route map, stop markers, nearby stations, and Directions API integration (the riskiest piece; start early).

**Phase 4 — Create.** Build the sidequest creator with stops, checklist, and route preview.

**Phase 5 — Quest Mode.** Add live location, checklist progress, completed/saved/abort states, and ratings.

**Phase 6 — Profiles and Polish.** Build profile tabs and questgiver rating, add photos if time allows, seed demo activity, fix bugs, and deploy.

**Phase 7 — Cherry on top.** Communities, checkpoints, and friends.

## 13. Demo Scenario

**Opening problem:** "You've spent three years in Boston. But when someone asks what there is to do this weekend, you still don't have an answer. And you don't have a car."

**Demo sequence:**

1. Open Breadcrumb to the For You page and scroll the sidequest cards.
2. Open "Sunday Cafe Hopping" and show the stylized route map and transit directions by T and walking.
3. Tap **Start quest** and show live location on the path and the checklist.
4. Check off sights and activities and add a photo.
5. Tap **Completed** and rate the sidequest on price, time, enjoyment, and memorability.
6. Show the profile: completed, saved, and signed-up sidequests, and the questgiver rating.
7. Create a new sidequest from curated places and publish it.
8. (If built) Switch communities between BU and BC on the For You page.

**Closing message:** "College only lasts four years. Breadcrumb helps you make the most of the city you're spending them in, no car required."

## 14. Success Criteria

The hackathon MVP is successful if:

- Users can browse sidequests and see each route on a map with T and walking directions.
- Users can create and publish a multi-stop sidequest.
- Users can run a quest with live location and a checklist, and complete, save, or abort it.
- Users can rate completed sidequests on price, time, enjoyment, and memorability.
- Profiles show completed, saved, signed-up, and created sidequests and a questgiver rating.
- Every sidequest works within the track constraint: transit, bus, bike, or walking only.
- The product is deployed and usable on mobile.

## 15. Product Positioning

Breadcrumb is a social exploration app that helps Boston college students discover student-made sidequests, follow transit-first routes, complete them like a scavenger hunt, and rate and share them with friends.

**Core hook:** You've lived here. Have you explored it?

**Primary differentiator:** A trackable, social way to explore Boston using only the T, bus, bike, and your feet, instead of another search or review app.

## 16. Revision Notes (v2.0 to v3.0)

- **Merged sidequests and itineraries** into one content type, the sidequest, created by users and shown on the For You page.
- **Added Start Quest mode** with live location, a scavenger-hunt checklist, and Completed / Saved for later / Abort. v2.0 only had manual confirmation with no live map.
- **Replaced 1–5 experience reviews with sidequest ratings** on price, time, enjoyment, and memorability, and added the questgiver rating.
- **Added the transport constraint** (T, bus, bike, walking) and track-aligned filters such as late night and budget.
- **Moved following to cherry on top** and added communities (BU, BC), checkpoints, and creator ratings.
- **Changed the maps stack** from MapLibre to Google Maps for transit directions.
- **Rebuilt the schema** around sidequests, stops, checklists, user progress, photos, and ratings.
- **Stayed on Vite + React** instead of Next.js: the foundation was already built, and nothing in P0 needs a server (team decision).
- **Renamed the product to Breadcrumb.** "Sidequest" remains the name of the content type.


## notes

- Blue bikes integration 
- Boston bus lines integration
- walking routes integration
