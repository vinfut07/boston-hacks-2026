/**
 * useSession(): who is logged in, from any component.
 *
 *   const { session, profile, loading, signOut } = useSession()
 *
 * session is null when logged out. Wait for loading === false before
 * redirecting based on it. Requires <SessionProvider> (set up in App.tsx).
 */

import { useContext } from 'react'
import { SessionContext, type SessionState } from '@/lib/session-context'

export function useSession(): SessionState {
  const value = useContext(SessionContext)
  if (!value) throw new Error('useSession() must be used inside <SessionProvider> (see App.tsx)')
  return value
}
