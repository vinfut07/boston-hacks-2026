/**
 * Keeps track of who is logged in for the whole app. Wraps the app in App.tsx,
 * listens to Supabase Auth (login, logout, token refresh, OAuth redirects) and
 * loads the user's profile row. Components read it through useSession().
 */

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { SessionContext, type SessionProfile, type SessionState } from '@/lib/session-context'

async function fetchProfile(userId: string): Promise<SessionProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .eq('id', userId)
    .maybeSingle()
  if (error) {
    console.error('[session] could not load profile', error)
    return null
  }
  return data
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  // The profile is stored with the user id it belongs to, so a stale profile
  // (after logout or switching accounts) is ignored instead of shown.
  const [loaded, setLoaded] = useState<{ userId: string; profile: SessionProfile | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const userId = session?.user.id ?? null
  const profile = loaded && loaded.userId === userId ? loaded.profile : null
  const profileLoading = userId !== null && loaded?.userId !== userId

  // Track the session. onAuthStateChange fires once on load (INITIAL_SESSION)
  // and again on every login, logout and token refresh.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setLoading(false)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  // Load the profile whenever the logged-in user changes. Done here rather than
  // inside the auth callback, which must not await other Supabase calls.
  useEffect(() => {
    if (!userId) return
    let cancelled = false
    fetchProfile(userId).then((p) => {
      if (!cancelled) setLoaded({ userId, profile: p })
    })
    return () => {
      cancelled = true
    }
  }, [userId])

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut()
    if (error) console.error('[session] sign out failed', error)
  }, [])

  const refreshProfile = useCallback(async () => {
    if (userId) setLoaded({ userId, profile: await fetchProfile(userId) })
  }, [userId])

  const value = useMemo<SessionState>(
    () => ({ session, profile, loading, profileLoading, signOut, refreshProfile }),
    [session, profile, loading, profileLoading, signOut, refreshProfile],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
