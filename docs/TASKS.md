# Breadcrumb — Tasks

Who builds what, in what order. **Agents: read this file, `AGENTS.md` and `docs/STYLE_GUIDE.md` before starting a task.**

Sources: [PRD.md](PRD.md) · design: [`mockups/`](mockups/) (Main = web, Mobile-* = phone) and [STYLE_GUIDE.md](STYLE_GUIDE.md) · database: [`supabase/README.md`](../supabase/README.md)

## Words

| Say in the UI | Database / code name |
|---|---|
| **Trail** (an outing) | `sidequests` |
| **Stop** | `sidequest_stops` |
| **Crumb** (a small task at a stop) | `checklist_items` |
| Make a trail | create a `sidequests` row + stops + crumbs |
| Start trail / Finished / Saved | `user_sidequests.status` = `in_progress` / `completed` / `saved` |

Screens say trail and crumb. Code keeps the table names; don't rename tables. (The style guide mentions `quest_checkpoints`; that table doesn't exist. Crumbs are `checklist_items`.)

## How to do a task

1. `git checkout main && git pull`
2. Open your agent in the repo and tell it: **"Do task <ID> from docs/TASKS.md."**
3. Check the result with `npm run dev`, on desktop and at phone width.
4. The agent creates the branch named in the task, runs `npm run build && npm run lint`, and opens a PR. **It doesn't merge.**
5. Wait for CI to go green, then ask a teammate to review and merge. (`main` is protected: no direct pushes.)

## Routes

Every route already exists in `src/App.tsx` and points at a placeholder page. **Replace your page's contents; don't edit `App.tsx`.**

| Path | Screen | Owner | File |
|---|---|---|---|
| `/` | Explore ("Trails for you") | Jason | `src/features/explore/ExplorePage.tsx` |
| `/trails/:id` | Trail detail | Jason | `src/features/trail/TrailDetailPage.tsx` |
| `/trails/:id/go` | Active trail (Start trail) | Gio | `src/features/trail/ActiveTrailPage.tsx` |
| `/trails/:id/rate` | Rate a finished trail | Jason | `src/features/trail/RateTrailPage.tsx` |
| `/trails/:id/edit` | Edit your trail | Gio | `src/features/make/EditTrailPage.tsx` |
| `/make` | Make a trail (done) | Dom | `src/features/make/MakeTrailPage.tsx` |
| `/saved` | Saved | Gio | `src/features/saved/SavedPage.tsx` |
| `/me`, `/u/:username` | You / profile | Gio | `src/features/profile/ProfilePage.tsx` |
| `/onboarding` | Pick a username | Gio | `src/features/auth/OnboardingPage.tsx` |
| `/login`, `/signup` | Auth (done) | Gio | `src/features/auth/AuthPage.tsx` |
| `/map` | Map tab (P1) | later | `src/features/map/MapPage.tsx` |

## Shared code you can use

| What | Where | Status |
|---|---|---|
| `useSession()` → `{ session, profile, loading, signOut, refreshProfile }` | `@/lib/useSession` | ✅ done |
| Supabase client | `@/lib/supabase` | ✅ done |
| Table types `Tables<'sidequests'>` etc. | `@/types/database.types` | ✅ done (regenerate with `npm run db:types`) |
| Allowed values (statuses, categories, T lines…) | `@/types/db-values` | ✅ done |
| `getFeed()`, `getTrail()` + types `FeedTrail`, `TrailDetail` | `@/lib/api/trails` | ✅ done (D1) |
| `saveTrail`, `unsaveTrail`, `joinTrail`, `startTrail`, `finishTrail`, `abortTrail`, `toggleCrumb`, `getMyStatus` | `@/lib/api/progress` | ⏳ stubs exist; filled in by task G2 |
| `<TrailCard trail={…} progress? />` | `@/components/TrailCard` | ✅ done (J1) |
| `save_trail(p_trail, p_trail_id)` database function | `src/features/make/api.ts` → `saveTrail()` | ✅ done (D2) |
| `<RouteMap stops mode="preview" \| "live" userLocation? selectedStopId? onSelectStop? />` | `@/components/RouteMap` | ⏳ placeholder exists; real map in task D3 |
| `getMyRating`, `rateTrail`, `deleteMyRating` | `@/lib/api/ratings` | ⏳ stubs exist; filled in by task J3 |

Call shared functions by these names even before they're finished, so nobody waits.

---

## Round 1 ✅ done

Merge **D1 first** if possible; J1 uses its types.

### D1 · Dom · Trail data functions + sample trails ✅ (#10)
Branch: `feat/trail-data`
- Create `src/lib/api/trails.ts` using `@/lib/supabase` and the generated types:
  - `getFeed({ category?, maxCost?, maxMinutes? })`: published trails for Explore, newest first. Each item has: id, title, category, cost, duration, `scheduled_at`, `primary_line`, `is_curated`, creator (username, display_name, avatar_url), stop count, crumb count, first and last stop names, rating average + count (view `sidequest_rating_stats`).
  - `getTrail(id)`: one trail with creator, stops in order, crumbs per stop, rating stats, and reviews (`sidequest_ratings` with reviewer profiles).
  - Export the return types: `FeedTrail`, `TrailDetail`.
- Seed 2–3 real, verified Boston trails (including **"Sunday Café Hop"**) owned by a "breadcrumb" team account, with stops, crumbs and `is_curated = true`. Use a new migration or `seed.sql`; follow `supabase/README.md`.
- Add a short "Words" section (trail / stop / crumb → table names) to `AGENTS.md`.

### J1 · Jason · App look, trail card, Explore page ✅ (#12)
Branch: `feat/explore`
- Bring the style guide into the app: import `docs/styles/tokens.css` and `components.css` (or port them to Tailwind) so colors, type and spacing match the mockups.
- Header in `src/components/layout/AppLayout.tsx`, matching `docs/mockups/Main.dc.html`: breadcrumb logo, Explore / Map / Saved / You nav, search box, orange **Make a trail** button (links to `/make`). Keep the existing `useSession()` log-in / log-out menu. On phones, use the bottom tab bar from the mobile mockups.
- `src/components/TrailCard.tsx`: reusable card with the dotted trail drawing (`docs/tools/trail.js`), title, cost, time, stops, rating; links to `/trails/:id`.
- Explore page (`ExplorePage.tsx`), "Trails for you": tabs For you / Nearby / Friends (only For you needs to work), cost and length filters, grid of `TrailCard`s, map placeholder on the right. Until D1 is merged, use one hard-coded sample shaped like `FeedTrail`, then switch to `getFeed()`.
- Add desktop and phone screenshots to the PR.

### G1 · Gio · Username onboarding + You page ✅ (#13)
Branch: `feat/onboarding-and-profile`
- Onboarding (`OnboardingPage.tsx`): after login, if `profile.username` is empty, send the user to `/onboarding` to pick a username (3–30 chars: lowercase letters, numbers, `_`; must be unique, so show a friendly message if taken), display name and university. Save with an **UPDATE** on their `profiles` row (never insert), then call `refreshProfile()` and go to `/`.
- Switch `AuthPage`'s own session check to `useSession()`.
- You page (`ProfilePage.tsx`, `/me` = me, `/u/:username` = anyone): avatar, name, university, questgiver rating (view `questgiver_ratings`: average + count), and tabs **Finished / Saved / Signed up / Made**:
  - Finished / Saved / Signed up = the user's `user_sidequests` with status `completed` / `saved` / `signed_up` (only visible on your own page; other people's progress is private).
  - Made = `sidequests` where `creator_id` = that user.
  - Empty states from `docs/mockups/Mobile-Profile.dc.html`.

---

## Round 2 (in progress)

### J2 · Jason · Trail detail page
Branch: `feat/trail-detail`
- `TrailDetailPage.tsx` per the mockup ("Web · Trail detail"), using `getTrail(id)`: title, cost / time / stops / crumbs / rating, description, the trail (stops with crumbs and how to get between them), "Good to know" box, reviews with the three rating bars.
- Buttons: **Start trail** → `startTrail(id)` then go to `/trails/:id/go`; **Save** → `saveTrail` / `unsaveTrail`; **Join** only when `scheduled_at` is set → `joinTrail`. Use `getMyStatus(id)` to show the current state. If logged out, send to `/login?next=/trails/:id`.
- Map on the right: placeholder for now.

### G2 · Gio · Trail actions + Saved page
Branch: `feat/trail-actions-and-saved`
- Fill in every function in `src/lib/api/progress.ts` (keep the names): each writes the user's `user_sidequests` row (`upsert` on `user_id, sidequest_id`); `toggleCrumb` inserts or deletes in `checklist_completions`. The database already enforces the rules (e.g. join only works on scheduled trails); turn its errors into friendly messages.
- Saved page (`SavedPage.tsx`): trails the user saved, signed up for, or has in progress, using `TrailCard`.

### D2 · Dom · Make a trail ✅ done (#14)
Branch: `feat/make-trail`
- `MakeTrailPage.tsx` per the mockup ("Web · Make a trail"): basics (name, short description, category, anytime vs. pick a date), stops (search or add a place, reorder, remove), a crumb at each stop, live preview card, "Ready to publish" checklist, **Save draft** / **Publish trail**.
- Writes `sidequests` (status `draft` / `published`), `sidequest_stops` and `checklist_items`. Save everything together so a half-saved trail can't happen (an RPC function in a new migration is fine).
- Logged-out users are sent to `/login?next=/make`.

---

## Round 3 (after your Round 2 PR is merged)

### D3 · Dom · Route map + directions
Branch: `feat/route-map`
- Make `src/components/RouteMap.tsx` real (keep its props): Google Maps JS API with the style guide's map style, numbered stop markers (`.num-ring`), and the **real route** between stops from the Directions API using each stop's `travelModeToStop` (walk / transit / bicycling, never driving). Fit the map to the stops. In `live` mode, show `userLocation` as a dot and keep it in view.
- If a leg has no route (or the API fails), show the stops without a line plus an "Open in Google Maps" link. **Never draw straight lines as routes.**
- Add `getDirectionsLink(from, to, mode)` in `src/lib/maps.ts` for "Open in Google Maps" deep links (transit / walking).
- API key: `VITE_GOOGLE_MAPS_API_KEY` in `.env` (add it to `.env.example`, referrer-restricted to localhost + the Vercel domain). Load the script once.
- Use it on Trail detail's right column and in Make a trail's preview (swap the placeholder).

### J3 · Jason · Rate a trail + reviews
Branch: `feat/rate-trail`
- Fill in `src/lib/api/ratings.ts` (keep the names): `rateTrail` upserts `sidequest_ratings` (on `user_id, sidequest_id`), `getMyRating`, `deleteMyRating`. The database only allows it after the trail is finished, once per trail, and never for your own trail; show those as friendly messages.
- `RateTrailPage.tsx` (`/trails/:id/rate`) from `docs/mockups/Mobile-Finished.dc.html`: "Trail finished!" header, four 1–5 ratings (**Price, Time, Enjoyment, Memorability**) with big tap targets, optional review, **Post rating** and **Skip**. Editing an existing rating pre-fills it. Afterwards go to `/trails/:id`.
- On Trail detail, show a **Rate this trail** button when the user has finished it (`getMyStatus` = `completed`) and hasn't rated it yet.

### G3 · Gio · Active trail (Start trail mode)
Branch: `feat/active-trail`
- `ActiveTrailPage.tsx` (`/trails/:id/go`) from `docs/mockups/Mobile-Run.dc.html`, using `getTrail(id)` and `@/lib/api/progress`:
  - On open, call `startTrail(id)` (resumes if already started). Logged out → `/login?next=/trails/:id/go`.
  - Ask for location **only on this page** (`navigator.geolocation.watchPosition`), pass it to `<RouteMap mode="live" userLocation={…} />`. Handle denied / unavailable with a friendly note; never store or send the location.
  - Current stop card: name, planned activity, "Open in Google Maps" for getting there. Next / previous stop.
  - Crumbs grouped by stop with big checkboxes; ticking calls `toggleCrumb(crumbId, done)` and survives a refresh. Progress ("3 of 5 crumbs").
  - Bottom actions: **Finished** (`finishTrail`, then go to `/trails/:id/rate`), **Save for later** (`saveTrail`, keeps ticks), **Abort** (`abortTrail`, with a confirm).
  - Keep the screen awake while active (Wake Lock API, if supported).

---

## Round 4 (after your Round 3 PR is merged)

### D4 · Dom · Deploy + content
Branch: `feat/deploy-and-content`
- Deploy to **Vercel** (SPA rewrite so `/trails/…` URLs work on refresh, env vars set). Add the Vercel URL to Supabase Auth redirect URLs and the Google OAuth / Maps key restrictions. HTTPS is required for location on phones.
- Move Jason's researched places and the Chinatown Food Tour from `seed.sql` into a migration so they go live (`npm run db:push`).
- `<NearbyStations lat lng />` in `src/components/NearbyStations.tsx`: closest T stops to a place from the MBTA V3 API, shown under each stop on Trail detail.

### J4 · Jason · Map on Explore + mobile polish
Branch: `feat/explore-map-and-polish`
- Replace Explore's map placeholder with a real map of trails (first-stop pins coloured by `primary_line`), using the map loader from D3. Hover a card → highlight its pin.
- Map tab (`/map`): full-screen map of trails with a swipeable card rail on phones.
- Mobile pass on every screen at 375 px: tab bar, spacing, tap targets, empty and loading states.

### G4 · Gio · Edit and delete your trails
Branch: `feat/edit-trail`
- `EditTrailPage.tsx` (`/trails/:id/edit`): load the trail with `getTrail(id)` into the Make a trail form and save with `save_trail(p_trail, p_trail_id)` (reuse `src/features/make/` pieces; small exports there are fine, mention them in the PR). Only the creator can open it.
- **Unpublish** (back to draft) and **Delete** (with a confirm) for your own trails. Show an **Edit** button on Trail detail and on the You page's "Made" tab for your own trails, plus your drafts there.

---

## Later (P1)

- Photos: a photo on a crumb and an "add photos" tab during a trail (Supabase Storage bucket + policies, a `db/…` migration via Dom).
- Nearby / Friends tabs on Explore (location sorting, follows).
- Communities (BU / BC) switcher.
- Bluebikes and bus routes in directions.

## Rules

- **Stay in your own files.** Shared files (`AppLayout`, `src/lib/`, `App.tsx`, the database): keep changes minimal and say so in the PR.
- **Database changes go through Dom**, as a new migration in its own PR (`supabase/README.md`).
- Name files for what they do and start each with a short header comment (`AGENTS.md`).
- One task per PR. Pull `main` before starting. Never commit `.env`.
