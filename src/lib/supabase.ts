/**
 * The one shared Supabase client for the whole app. Import `supabase` from
 * here; never call createClient elsewhere. Reads the project URL and
 * publishable key from .env and stops with a setup message if they're missing.
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    '[Breadcrumb] Missing Supabase environment variables.\n' +
      'Copy .env.example to .env and set VITE_SUPABASE_URL and ' +
      'VITE_SUPABASE_PUBLISHABLE_KEY (Supabase Dashboard → Project Settings → API), ' +
      'then restart `npm run dev`.',
  )
}

/**
 * Shared, typed Supabase client. Import this everywhere — do not call createClient elsewhere.
 * Uses the publishable (anon) key only; all authorization is enforced by RLS in the database.
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseKey)
