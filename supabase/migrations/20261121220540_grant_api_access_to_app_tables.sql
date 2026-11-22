-- =============================================================================
-- Breadcrumb — grant_api_access_to_app_tables
--
-- Lets the app reach the tables through Supabase's API.
--
-- Newer Supabase projects don't automatically grant the API roles (anon =
-- logged out, authenticated = logged in) access to new tables, so every query
-- failed with "permission denied for table …". These grants open the door; the
-- RLS policies on each table still decide exactly which rows a user can read
-- or change. A table with RLS enabled and no matching policy stays locked.
--
-- - anon: read-only (browsing as a visitor). No anon write policies exist.
-- - authenticated: read/write, limited by RLS.
-- - Default privileges: tables and views created by later migrations get the
--   same grants automatically, so new features don't hit this again.
--
-- Runs after: create_ratings.
-- Used by: every Supabase query from the app.
-- Immutable once applied: make changes in a new migration (npm run db:new).
-- =============================================================================

grant usage on schema public to anon, authenticated;

-- Existing tables and views
grant select                         on all tables in schema public to anon;
grant select, insert, update, delete on all tables in schema public to authenticated;

-- Tables and views created by future migrations
alter default privileges in schema public grant select                         on tables to anon;
alter default privileges in schema public grant select, insert, update, delete on tables to authenticated;
