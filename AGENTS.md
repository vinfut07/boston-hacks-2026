# Breadcrumb — rules for contributors and AI agents

This file is for **every** AI coding agent working in this repo (Claude Code, Codex, Cursor, Copilot…) and for the humans driving them. Read it before making changes.

Breadcrumb is a transit-first social exploration web app for Boston college students (BostonHacks 2026). Users browse, run, and rate **sidequests**: multi-stop outings reached by T, bus, bike, or on foot. "Breadcrumb" is the product name; "sidequest" is the content type.

- Product spec: [`docs/PRD.md`](docs/PRD.md)
- Who owns what, and the contracts between lanes: [`docs/TASKS.md`](docs/TASKS.md)
- Screens: [`docs/mockup.html`](docs/mockup.html) · Visual rules: [`docs/STYLE_GUIDE.md`](docs/STYLE_GUIDE.md)
- Database change process: [`supabase/README.md`](supabase/README.md)

## Words

The UI and the code use different names for the same things. Screens say the left column; code and the database use the right.

| UI word | Database / code |
|---|---|
| **Trail** (an outing) | `sidequests` |
| **Stop** | `sidequest_stops` |
| **Crumb** (a small task at a stop) | `checklist_items` |
| Start trail / Finished / Saved | `user_sidequests.status` = `in_progress` / `completed` / `saved` |

Don't rename tables to match the UI. (`quest_checkpoints`, mentioned in the style guide, doesn't exist; crumbs are `checklist_items`.)

## Stack

React 19 + Vite + TypeScript, React Router, Tailwind CSS v4 + shadcn/ui, Lucide icons, Supabase (Postgres, Auth, Storage) called directly from the browser and protected by Row Level Security, Google Maps JS + Directions API, MBTA V3 API. Hosted on Vercel. **Not Next.js**, and there is no app server.

## Workflow: every change is a pull request

1. Start from an up-to-date `main`: `git checkout main && git pull`.
2. Create a branch: `git checkout -b feat/<lane>-<short-description>`. Use `fix/…` for bug fixes and `db/…` for migrations.
3. Keep the change to **one feature or fix**. Smaller is better.
4. Before pushing, run `npm run build && npm run lint`. Both must pass. CI (`.github/workflows/ci.yml`) also runs lint, typecheck, build and the database tests on every PR; a red PR doesn't get merged.
5. Push the branch and open a pull request into `main`, e.g. `gh pr create --fill --base main`. Fill in the PR template: what changed, screenshots for UI, and how to test it.
6. A teammate reviews and merges. **Never push or merge to `main` yourself, and never force-push `main`.**
7. After merge, delete the branch and pull `main` before starting the next task.

AI agents: when a task is done, open the PR and report its link. Don't merge it.

## Stay in your lane

- Each feature lives in `src/features/<lane>/` and has one owner (see `docs/TASKS.md`). Only edit files in the lane you were asked to work on.
- Shared code has owners too: `src/lib/`, `src/types/`, `supabase/` (Person A) and `src/components/` (Person C). If you need a change there, keep it minimal, say so in the PR, and tag the owner.
- Use other lanes only through their exported contracts (e.g. `<RouteMap>`, `getSidequest()`). Never reach into another lane's internals.
- Don't add dependencies, change `package.json` scripts, or modify config files (`vite.config.ts`, `tsconfig*`, `eslint.config.js`) unless the task asks for it. If you do, put it in its own PR.

## Database

- The schema is managed with the **Supabase CLI**. See `supabase/README.md`.
- To change the schema, create a migration with `npm run db:new -- <verb>_<what>` (e.g. `add_quest_photo_storage_bucket`), write the SQL with a header comment, and open it in its own `db/…` PR.
- Never edit a migration that has been pushed. Never run schema SQL in the Supabase SQL Editor. **Never run `supabase db push`, `db reset --remote`, or any command that changes the shared project from an agent.** Only Person A pushes, after review.
- Every new table gets RLS enabled with policies in the same migration, plus pgTAP tests for those policies in `supabase/tests/database/`.
- After a migration is pushed, regenerate types with `npm run db:types` and commit them.

## Naming and file headers

There isn't much backend route code to read in this project, so **file names and header comments are the documentation**.

- **Name files for what they do.** Components and pages: `SidequestCard.tsx`, `QuestChecklist.tsx`, not `Card2.tsx` or `utils2.ts`. Migrations: `npm run db:new -- <verb>_<what>` (the CLI adds a timestamp), e.g. `add_quest_photo_storage_bucket`, never `update` or `v3_changes`.
- **Start every file with a short header comment** (2–5 lines) saying what the file does, what uses it, and anything non-obvious. For example:
  ```ts
  /**
   * Quest mode checklist: shows a sidequest's checklist items grouped by stop and
   * saves each tick to checklist_completions. Used by the /q/:id/play page.
   */
  ```
- SQL migrations use the same header style as the existing ones: what it changes, why, what it runs after, and which features use it.
- Generated files (`src/types/database.types.ts`, `src/components/ui/*` from shadcn) are exempt; don't hand-edit them.
- Keep the header up to date when the file's job changes.

## Code conventions

- TypeScript strict. Import from `src` with `@/…`.
- Supabase calls go through `src/lib/api/*` or your lane's `api.ts`, not inline in components. Use the shared client from `@/lib/supabase`.
- Use the style-guide components and tokens (`docs/STYLE_GUIDE.md`); don't invent new colors or hard-code hex values.
- Mobile-first: every screen must work at 375 px wide. See `docs/mockup.html` for the mobile patterns.
- Don't fabricate data: no invented places, hours, travel times, or routes. Never draw straight lines as if they were routes.
- Location is used live only and is never stored.

## Secrets

- Never commit `.env` or any key. Only publishable/browser keys (`VITE_…`) belong in the frontend; never use a Supabase service-role or secret key.
