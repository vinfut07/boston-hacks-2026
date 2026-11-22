/**
 * Reads and saves the signed-in user's editable profile fields (username,
 * display name, university) for /onboarding. The profile row is created by the
 * signup trigger, so this only ever UPDATEs it (RLS: users edit only their own row).
 * Used by OnboardingPage.tsx.
 */
import { supabase } from '@/lib/supabase'

/** Same rule as the profiles.username CHECK constraint. */
export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/
export const DISPLAY_NAME_MAX = 80
export const UNIVERSITY_MAX = 120

export type ProfileFields = { username: string; displayName: string; university: string }

export type LoadResult = { status: 'ok'; fields: ProfileFields } | { status: 'error'; message: string }
export type SaveResult =
  | { status: 'saved' }
  /** `field` is set when the problem belongs to one input (e.g. a taken username). */
  | { status: 'error'; message: string; field?: 'username' }

const NETWORK_ERROR = 'We couldn’t reach Breadcrumb. Check your connection and try again.'
const GENERIC_ERROR = 'Something went wrong on our end. Please try again.'

export async function loadProfileFields(userId: string): Promise<LoadResult> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username, display_name, university')
      .eq('id', userId)
      .maybeSingle()
    if (error) return { status: 'error', message: error.code ? GENERIC_ERROR : NETWORK_ERROR }
    if (!data) return { status: 'error', message: MISSING_PROFILE }
    return {
      status: 'ok',
      fields: {
        username: data.username ?? '',
        displayName: data.display_name ?? '',
        university: data.university ?? '',
      },
    }
  } catch {
    return { status: 'error', message: NETWORK_ERROR }
  }
}

const MISSING_PROFILE = 'We couldn’t find your profile. Log out and back in, then try again.'

/** Saves the fields. Empty display name / university are stored as null. */
export async function saveProfileFields(userId: string, fields: ProfileFields): Promise<SaveResult> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        username: fields.username,
        display_name: fields.displayName.trim() || null,
        university: fields.university.trim() || null,
      })
      .eq('id', userId)
      .select('id')
    if (error) {
      // 23505 = unique_violation: someone else has this username.
      if (error.code === '23505') {
        return { status: 'error', field: 'username', message: 'That username is taken. Try another one.' }
      }
      // 23514 = check_violation: only reachable if the form's checks were bypassed.
      if (error.code === '23514') {
        return { status: 'error', message: 'Some of those details aren’t allowed. Check each field and try again.' }
      }
      // supabase-js reports network failures as an error without a Postgres code.
      return { status: 'error', message: error.code ? GENERIC_ERROR : NETWORK_ERROR }
    }
    // No row updated: the profile is missing (or isn't this user's).
    if (!data || data.length === 0) return { status: 'error', message: MISSING_PROFILE }
    return { status: 'saved' }
  } catch {
    return { status: 'error', message: NETWORK_ERROR }
  }
}
