/**
 * The viewer's status on one trail (getMyStatus) and the Start / Save / Join actions
 * from @/lib/api/progress. Logged-out viewers are sent to /login?next=/trails/:id.
 * Used by TrailActions on the Trail detail page; one instance per page.
 */

import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { getMyStatus, joinTrail, saveTrail, startTrail, unsaveTrail } from '@/lib/api/progress'
import { useSession } from '@/lib/useSession'
import type { UserSidequestStatus } from '@/types/db-values'

type Action = 'start' | 'save' | 'join'

/** Turns API errors into something a person can act on. */
function friendlyError(error: unknown) {
  const message = error instanceof Error ? error.message : ''
  if (/not implemented/i.test(message)) return "That button isn't hooked up yet. It's coming soon."
  if (/network|fetch/i.test(message)) return 'No connection. Check your internet and try again.'
  return message || 'Something went wrong. Try again.'
}

/** The viewer's status on a trail plus the three actions. One instance per page. */
export function useTrailActions(trailId: string) {
  const { session, loading: sessionLoading } = useSession()
  const navigate = useNavigate()
  const [status, setStatus] = useState<{ trailId: string; value: UserSidequestStatus | null } | null>(null)
  const [busy, setBusy] = useState<Action | null>(null)
  const [error, setError] = useState<string | null>(null)
  const userId = session?.user.id ?? null

  useEffect(() => {
    if (sessionLoading || !userId) return
    let cancelled = false
    getMyStatus(trailId).then(
      (value) => !cancelled && setStatus({ trailId, value }),
      // Until progress.ts is filled in (task G2) this rejects; treat it as "no status yet".
      () => !cancelled && setStatus({ trailId, value: null }),
    )
    return () => {
      cancelled = true
    }
  }, [trailId, userId, sessionLoading])

  const current = userId && status?.trailId === trailId ? status.value : null
  const statusLoading = sessionLoading || (userId !== null && status?.trailId !== trailId)

  const run = useCallback(
    async (action: Action, call: () => Promise<void>, next: UserSidequestStatus | null) => {
      if (!userId) {
        navigate(`/login?next=${encodeURIComponent(`/trails/${trailId}`)}`)
        return false
      }
      setBusy(action)
      setError(null)
      try {
        await call()
        setStatus({ trailId, value: next })
        return true
      } catch (err) {
        setError(friendlyError(err))
        return false
      } finally {
        setBusy(null)
      }
    },
    [userId, trailId, navigate],
  )

  return {
    status: current,
    statusLoading,
    busy,
    error,
    start: async () => {
      if (await run('start', () => startTrail(trailId), 'in_progress')) navigate(`/trails/${trailId}/go`)
    },
    toggleSave: () =>
      current === 'saved'
        ? run('save', () => unsaveTrail(trailId), null)
        : run('save', () => saveTrail(trailId), 'saved'),
    join: () => run('join', () => joinTrail(trailId), 'signed_up'),
  }
}

export type TrailActionsState = ReturnType<typeof useTrailActions>
