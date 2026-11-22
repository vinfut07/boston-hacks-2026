/**
 * Start trail / Save / Join buttons for the Trail detail page. Which buttons show
 * depends on the viewer's status (saved, going, in progress, finished). Renders
 * inline on desktop and as a sticky bottom bar on phones (layout="bar"); both
 * share one useTrailActions() state from the page.
 */

import { Bookmark, BookmarkCheck, Check, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TrailActionsState } from './useTrailActions'

type TrailActionsProps = {
  actions: TrailActionsState
  scheduled: boolean
  layout: 'inline' | 'bar'
}

export function TrailActions({ actions, scheduled, layout }: TrailActionsProps) {
  const { status, statusLoading, busy, error, start, toggleSave, join } = actions
  const bar = layout === 'bar'

  const startLabel =
    status === 'in_progress' ? 'Continue trail' : status === 'completed' ? 'Do it again' : 'Start trail'
  // One row per user per trail, so Save only makes sense before you've joined or started.
  const canSave = status === null || status === 'saved' || status === 'aborted'
  const saved = status === 'saved'
  const canJoin = scheduled && (status === null || status === 'saved' || status === 'aborted')
  const going = status === 'signed_up'

  return (
    <div className={cn(bar && 'action-bar fixed inset-x-0 bottom-0 z-20 md:hidden')}>
      <div className={cn('flex flex-wrap items-center gap-3', bar && 'flex-nowrap')}>
        <button
          type="button"
          className={cn('btn', bar ? 'btn--lg min-w-0 flex-1' : 'px-7')}
          onClick={start}
          disabled={busy !== null || statusLoading}
        >
          {busy === 'start' ? 'Starting…' : startLabel}
        </button>

        {canSave ? (
          <button
            type="button"
            className={cn('btn btn--secondary', bar ? 'btn--lg w-14 shrink-0 px-0' : 'px-5.5')}
            aria-pressed={saved}
            aria-label={bar ? (saved ? 'Saved, tap to unsave' : 'Save trail') : undefined}
            onClick={toggleSave}
            disabled={busy !== null || statusLoading}
          >
            {saved ? <BookmarkCheck aria-hidden className="fill-current" /> : <Bookmark aria-hidden />}
            {bar ? null : saved ? 'Saved' : 'Save'}
          </button>
        ) : null}

        {canJoin ? (
          <button
            type="button"
            className={cn('btn btn--secondary', bar ? 'btn--lg shrink-0 px-5' : 'px-5.5')}
            onClick={join}
            disabled={busy !== null || statusLoading}
          >
            <UserPlus aria-hidden />
            {busy === 'join' ? 'Joining…' : 'Join'}
          </button>
        ) : null}

        {going && !bar ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-scheduled">
            <Check aria-hidden className="size-4" />
            You're going
          </span>
        ) : null}
        {status === 'completed' && !bar ? (
          <span className="inline-flex items-center gap-1.5 font-semibold text-done">
            <Check aria-hidden className="size-4" />
            You finished this trail
          </span>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className={cn('mt-2 text-sm font-medium text-crumb-deep', bar && 'text-center')}>
          {error}
        </p>
      ) : null}
    </div>
  )
}
