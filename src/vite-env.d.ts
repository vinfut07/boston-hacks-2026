/**
 * TypeScript types for Vite and for the VITE_* environment variables read
 * through import.meta.env. Add a line here when you add a new VITE_ variable.
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
