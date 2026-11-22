# Database (Supabase)

The database schema is managed with the **Supabase CLI**, the standard Supabase workflow. Every schema change is a SQL file in `migrations/`. The CLI applies them in order and records which ones have run, so nobody pastes SQL by hand and nothing runs twice.

| Path | What it is |
|---|---|
| `config.toml` | CLI settings (created by `supabase init`) |
| `migrations/` | One SQL file per schema change, applied in timestamp order |
| `seed.sql` | Demo/dev data. Runs automatically on a local `supabase db reset` |

The CLI is a dev dependency, so `npm install` gets it. Run it with `npx supabase …` or the npm scripts below.

## One-time setup (per computer)

```bash
npx supabase login                               # opens the browser to authorize
npx supabase link --project-ref <project-ref>    # asks for the database password
```

- `<project-ref>` is the `xxxx` in your `https://xxxx.supabase.co` URL.
- The database password is in Supabase → **Project Settings → Database** (ask whoever created the project).
- Linking stores local state in `supabase/.temp/`, which is gitignored.

## Everyday commands

The CLI targets a *local* database by default. The npm scripts add `--remote` so they act on the linked Supabase project. If you run `npx supabase …` directly, add `--remote` yourself.

| Command | What it does |
|---|---|
| `npm run db:new -- <name>` | Create a new empty migration, e.g. `npm run db:new -- add_quest_photo_storage_bucket` |
| `npm run db:status` | Show which migrations exist locally and which have been applied to the project |
| `npm run db:push` | Apply all not-yet-applied migrations to the linked Supabase project |
| `npm run db:types` | Regenerate `src/types/database.types.ts` from the live project |
| `npm run test:db` | Run the database security tests against a **local** database (needs Docker; see below) |

## Changing the schema

1. Branch: `git checkout -b db/<description>`.
2. `npm run db:new -- <verb>_<what>`. Name it for what it does, starting with a verb: `add_quest_photo_storage_bucket`, `allow_editing_published_stops`. Never `update_schema` or `v3_changes`. The CLI adds the timestamp prefix.
3. Write the SQL. **Start the file with a header comment** (copy one from an existing migration) saying what it changes, why, what it runs after, and which features use it.
4. Enable RLS and add policies for every new table in the same file. (API access grants for new tables are automatic, via the `grant_api_access_to_app_tables` migration.)
5. Open a PR. **Person A** reviews every `db/…` PR.
6. After it's approved, Person A runs `npm run db:push`, then `npm run db:types`, and commits the regenerated types to the same PR before merging.

Rules:
- **Never edit a migration that has been pushed.** Fix it with a new migration.
- Only Person A pushes to the shared project, so two people never apply migrations at once.
- Don't run schema SQL in the Supabase SQL Editor. The CLI can't see those changes, and the next `db push` may break.

## Database tests

`supabase/tests/database/*.test.sql` are [pgTAP](https://pgtap.org) tests for the rules the database enforces: who can see drafts and community-only sidequests, that you can only write your own progress, that only people who completed a sidequest can rate it, that the rating averages are right, and so on. They act as different users (`set local role authenticated` plus a fake login) and roll everything back.

- **CI runs them on every PR** against a fresh local database built from `migrations/` (`.github/workflows/ci.yml`). A PR that breaks a security rule goes red.
- **Changing a rule?** Update or add a test in the same PR. New table? Add a test file for its policies, e.g. `04_quest_photos.test.sql`.
- Run them yourself with Docker running: `npx supabase db start`, `npx supabase db reset`, then `npm run test:db`.

## Optional: local database

With Docker running, `npx supabase start` runs a full local Supabase (database, auth, storage, Studio UI) on your machine. `npx supabase db reset` rebuilds it from `migrations/` and then loads `seed.sql`. It's handy for testing a migration before pushing, but not required.

## First push to the shared project (one time)

The shared project still has tables from an early schema that was pasted into the SQL Editor by hand (`saved_sidequests`, `community_members`, …). They hold no real data and the CLI doesn't know about them, so **reset the shared database once** and let the CLI build everything from `migrations/`:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db reset --remote     # wipes the public schema, then applies all migrations + seed.sql
npm run db:status                  # every migration should show as applied
npm run db:types
```

- `db reset --remote` asks you to confirm. It deletes all data in the app's tables, which is fine now and **never OK after launch**.
- Anyone who already signed up (e.g. OAuth testing) automatically gets a fresh profile row: the first migration backfills profiles for existing users.
- From then on, use `npm run db:push` for new migrations. Never reset the shared project again.

## Current migrations

| Migration | What it creates |
|---|---|
| `20261121120001_create_profiles_and_communities` | `profiles` (auto-created on signup, backfilled for existing users), `communities`, `follows`, the `private` helper schema |
| `20261121120002_create_sidequests_stops_and_places` | `experiences` (curated place library), `sidequests`, `sidequest_stops`, visibility/ownership helpers |
| `20261121120003_create_quest_progress_and_checklists` | `checklist_items`, `user_sidequests` (saved / signed_up / in_progress / completed / aborted), `checklist_completions`, `quest_photos` |
| `20261121120004_create_ratings` | `sidequest_ratings` (price/time/enjoyment/memorability), `creator_ratings`, rating average views |
| `20261121220540_grant_api_access_to_app_tables` | Lets the app's API roles reach the tables (newer Supabase projects don't do this automatically); RLS still controls rows |
| `20261121225902_seed_curated_demo_trails` | Demo content: the "breadcrumb" team account, 9 real places, 3 curated trails (Sunday Café Hop, North End Cannoli Duel, Harvard Square Bookstores) with stops and crumbs |
| `20261121233400_add_save_trail_function` | `save_trail(p_trail, p_trail_id)`: Make a trail saves a trail + stops + crumbs in one transaction, enforcing the publish checklist |

Add a row when you add a migration. Which ones are applied is tracked by the CLI (`npm run db:status`), not here.
