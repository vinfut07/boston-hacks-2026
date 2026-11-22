# Breadcrumb

> You've lived here. Have you explored it?

Breadcrumb is a social itinerary discovery app for Boston college students, built for BostonHacks 2026. Students create, discover, share, join, complete, and review "sidequests": outings around Boston made up of one or more stops (cafes, restaurants, attractions, activities).

- **Anytime sidequest** (`scheduled_at` is null): an itinerary others can save and follow whenever they like.
- **Scheduled sidequest** (`scheduled_at` is set): an outing others can join.

This repo is currently the **shared foundation**: tooling, styling, routing, database schema, and Supabase client. Product features are built on top of it by individual developers.

## Tech stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, Vite 8, TypeScript, React Router |
| UI | Tailwind CSS v4, shadcn/ui, Lucide React |
| Backend | Supabase (PostgreSQL, Auth, Storage later), `@supabase/supabase-js` |
| Maps (planned) | MapLibre GL JS, MBTA V3 API (not installed yet) |
| Deploy (planned) | Vercel (not set up yet) |

## Getting started

Requires Node 20+.

```bash
git clone https://github.com/domchenn/boston-hacks-2026.git
cd boston-hacks-2026
npm install
cp .env.example .env   # then fill in the values, see below
npm run dev
```

### Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server at http://localhost:5173 |
| `npm run build` | Type-check, then build for production into `dist/` |
| `npm run typecheck` | Type-check only (`tsc -b --noEmit`) |
| `npm run lint` | Run ESLint |
| `npm run db:new -- <name>` / `db:push` / `db:status` / `db:types` | Database migrations (see [`supabase/README.md`](supabase/README.md)) |
| `npm run preview` | Serve the production build locally |

### Environment variables

Set these in `.env`. That file is gitignored, so never commit it.

| Variable | Where to find it |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase Dashboard → Project Settings → API → Project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Same page → **publishable** key (or the legacy `anon` key) |

Anything prefixed with `VITE_` is shipped to the browser. **Never** put the `service_role` or secret key in this app. Security is enforced by Row Level Security in the database, not by the frontend.

If the variables are missing, `src/lib/supabase.ts` throws a clear error the first time the client is imported.

## Supabase database setup

The schema lives in **[`supabase/migrations/`](supabase/migrations/)**: one SQL file per change, each named for what it does and starting with a header comment. They're applied with the **Supabase CLI**, which tracks which migrations have run. Full workflow: [`supabase/README.md`](supabase/README.md).

First-time setup for the shared project (done once, by Person A):

```bash
npx supabase login
npx supabase link --project-ref <project-ref>   # the xxxx in https://xxxx.supabase.co
npx supabase db reset --remote                   # one time only: clears hand-made tables, applies all migrations
npm run db:types                                 # regenerates src/types/database.types.ts
```

Then, under **Authentication → Providers**, enable the sign-in methods you want (e.g. email, Google).

**Don't paste schema SQL into the Supabase SQL Editor.** The CLI can't see changes made that way. After this first setup, new migrations go out with `npm run db:push`.

### What the schema enforces

Migrations run in timestamp order; [`supabase/README.md`](supabase/README.md) lists what each one does.

- A profile row is created automatically on signup (`username` starts as `NULL` and is chosen during onboarding).
- Draft sidequests, and everything attached to them, are visible only to their creator. Community-only sidequests are visible only to that community's members.
- Each user has **one progress row per sidequest** in `user_sidequests` (`saved`, `signed_up`, `in_progress`, `completed`, `aborted`). It's private to that user. Signing up is only allowed for sidequests with a scheduled start.
- Checklist ticks are private and only allowed on a quest you've started.
- Ratings (price, time, enjoyment, memorability, 1–5 each) require a **completed** run, one per user, and creators can't rate their own. The views `sidequest_rating_stats` and `questgiver_ratings` give the averages.
- `experiences` (the curated place library) is read-only for users; the team adds rows through `seed.sql`.
- Users can only write their own rows. Deleting a sidequest cascades to everything attached to it. Use `status = 'archived'` to hide one instead.

### Database types

`src/types/database.types.ts` gives TypeScript types for every table, generated from the live project. After any migration is pushed, regenerate it with `npm run db:types` and commit the result. Don't edit it by hand. Allowed values for restricted text columns (statuses, categories, T lines…) live in `src/types/db-values.ts`.

## Folder structure

```text
src/
├── assets/             static images/fonts imported by code
├── components/
│   ├── ui/             shadcn/ui primitives (generated: `npx shadcn@latest add <name>`)
│   └── layout/         app shell (AppLayout: header + <Outlet/>)
├── pages/              route-level components (HomePage, NotFoundPage)
├── lib/
│   ├── supabase.ts     the ONE shared Supabase client
│   └── utils.ts        cn() class helper
├── types/
│   └── database.types.ts
├── App.tsx             route table
├── main.tsx            entry point
└── index.css           Tailwind + theme tokens
supabase/
├── config.toml        Supabase CLI config
├── migrations/        one SQL file per schema change (CLI-managed)
└── seed.sql
```

Add these folders when you first need them: `src/features/<feature>/` (see conventions), `src/hooks/`, `src/contexts/`.

## Team conventions

**Feature folders.** Each workstream owns a folder so people rarely edit the same files:

```text
src/features/
├── auth/         auth + profiles   (pages, components, hooks, api.ts)
├── discovery/    feed + social
├── sidequests/   create / edit / detail / save / join / complete / review
└── maps/         MapLibre + MBTA
```

- Put Supabase queries in `src/features/<feature>/api.ts`, not inside components.
- Don't import another feature's internals. If two features need something, move it to `src/components/`, `src/lib/`, or `src/hooks/`.
- Use the row types: `import type { Tables } from '@/types/database.types'` → `Tables<'sidequests'>`.
- Add your routes to `src/App.tsx` as children of `AppLayout`. Keep that diff small to avoid conflicts.
- Use the `@/` alias for imports from `src`.
- Add UI primitives with `npx shadcn@latest add button card ...` (they land in `src/components/ui/`). Use theme tokens (`bg-primary`, `text-muted-foreground`), not hard-coded colors. Design mobile-first: base styles target phones, and `sm:`/`md:` add larger layouts.
- Branch per feature (`feat/discovery-feed`) and open a PR into `main`. Run `npm run build && npm run lint` before pushing.
- Never commit `.env` or any secret key.
