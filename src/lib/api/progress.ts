/**
 * Trail actions for the logged-in user: save, join, start, finish, abort, and
 * ticking crumbs. Each action writes the user's single user_sidequests row (one
 * per user per trail) with an upsert on (user_id, sidequest_id); toggleCrumb
 * inserts or deletes a checklist_completions row.
 *
 * Owner: Gio. Signatures are the agreed contract (trail detail, active trail and
 * Saved pages call them); don't rename them.
 *
 * What each action does from the row's current status ("–" = left unchanged):
 *
 *   current \ action   save    unsave           join       start        finish     abort
 *   (no row)           saved   –                signed_up  in_progress  completed  –
 *   saved              –       removed (1)      signed_up  in_progress  completed  aborted
 *   signed_up          –       –                –          in_progress  completed  aborted
 *   in_progress        saved   –                –          – (resume)   completed  aborted
 *   completed          –       –                –          –            –          –
 *   aborted            saved   –                signed_up  in_progress  completed  –
 *
 *   (1) Deleted if the trail was never started; if it was paused mid-trail
 *       ("save for later") it becomes aborted, which keeps the history.
 *
 * A finished trail is never moved out of `completed`: that would clear its
 * completed_at and take it off the user's Finished tab. "Save" on an in-progress
 * trail is "save for later" (ticked crumbs are kept, PRD Flow C).
 *
 * The database enforces the hard rules (join only scheduled trails, tick crumbs
 * only on trails you've started, private rows). Failures throw a ProgressError
 * whose `message` is ready to show and whose `code` says what to do (e.g.
 * `not_signed_in` → send to /login?next=…).
 */

import { supabase } from '@/lib/supabase'
import type { UserSidequestStatus } from '@/types/db-values'

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export type ProgressErrorCode =
  | 'not_signed_in'
  | 'not_scheduled'
  | 'not_started'
  | 'unavailable'
  | 'network'
  | 'unknown'

/** Thrown by every action. `message` is user-facing. */
export class ProgressError extends Error {
  readonly code: ProgressErrorCode
  constructor(code: ProgressErrorCode, message: string) {
    super(message)
    this.name = 'ProgressError'
    this.code = code
  }
}

const MESSAGES: Record<ProgressErrorCode, string> = {
  not_signed_in: 'Log in to keep track of your trails.',
  not_scheduled: 'Only trails with a set date and time can be joined.',
  not_started: 'Start this trail before checking off its crumbs.',
  unavailable: 'This trail isn’t available anymore.',
  network: 'We couldn’t reach Breadcrumb. Check your connection and try again.',
  unknown: 'Something went wrong. Please try again.',
}

/** User-facing text for anything an action threw. */
export function progressErrorMessage(error: unknown): string {
  return error instanceof ProgressError ? error.message : MESSAGES.unknown
}

type DbError = { code?: string; message?: string } | null

/** Turns a Supabase/Postgres error into a ProgressError. */
function toProgressError(error: DbError, context: 'trail' | 'crumb'): ProgressError {
  const code = error?.code ?? ''
  const fail = (c: ProgressErrorCode) => new ProgressError(c, MESSAGES[c])
  // No code: the request never reached the database.
  if (!code) return fail('network')
  // Raised by the user_sidequests trigger for signed_up on an anytime trail.
  if (code === '23514' && /scheduled/i.test(error?.message ?? '')) return fail('not_scheduled')
  // RLS refused the write: the trail is hidden from you, or (crumbs) you haven't started it.
  if (code === '42501') return fail(context === 'crumb' ? 'not_started' : 'unavailable')
  // Foreign key / bad id: the trail or crumb no longer exists.
  if (code === '23503' || code === '22P02') return fail('unavailable')
  // Expired or invalid login token.
  if (code === 'PGRST301' || code === 'PGRST303') return fail('not_signed_in')
  return fail('unknown')
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** The logged-in user's id (read locally, no network), or a not_signed_in error. */
async function requireUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new ProgressError('not_signed_in', MESSAGES.not_signed_in)
  return id
}

type Row = { status: UserSidequestStatus; startedAt: string | null }

/**
 * Reads the user's row. `retry` is supabase-js's automatic retry of failed reads
 * (up to ~7 s of backoff): fine for a page load, too slow behind a button press,
 * so actions turn it off and fail fast instead.
 */
async function readRow(userId: string, trailId: string, retry: boolean): Promise<Row | null> {
  try {
    const { data, error } = await supabase
      .from('user_sidequests')
      .select('status, started_at')
      .eq('user_id', userId)
      .eq('sidequest_id', trailId)
      .retry(retry)
      .maybeSingle()
    if (error) throw toProgressError(error, 'trail')
    return data ? { status: data.status as UserSidequestStatus, startedAt: data.started_at } : null
  } catch (error) {
    throw error instanceof ProgressError ? error : toProgressError(null, 'trail')
  }
}

/** Upserts the row's status. The database trigger fills started_at / completed_at. */
async function writeStatus(userId: string, trailId: string, status: UserSidequestStatus): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_sidequests')
      .upsert({ user_id: userId, sidequest_id: trailId, status }, { onConflict: 'user_id,sidequest_id' })
    if (error) throw toProgressError(error, 'trail')
  } catch (error) {
    throw error instanceof ProgressError ? error : toProgressError(null, 'trail')
  }
}

/**
 * Moves the row to `next` when the current status is in `from` (null = no row
 * yet); otherwise leaves it alone. Implements one column of the table above.
 */
async function transition(
  trailId: string,
  next: UserSidequestStatus,
  from: ReadonlyArray<UserSidequestStatus | null>,
): Promise<void> {
  const userId = await requireUserId()
  const row = await readRow(userId, trailId, false)
  if (from.includes(row?.status ?? null)) await writeStatus(userId, trailId, next)
}

// ---------------------------------------------------------------------------
// Actions (agreed contract)
// ---------------------------------------------------------------------------

/** The user's status on a trail, or null if they have no row yet (or are logged out). */
export async function getMyStatus(trailId: string): Promise<UserSidequestStatus | null> {
  const { data } = await supabase.auth.getSession()
  const userId = data.session?.user.id
  if (!userId) return null
  return (await readRow(userId, trailId, true))?.status ?? null
}

/** Bookmark a trail (status 'saved'). On an in-progress trail this is "save for later". */
export function saveTrail(trailId: string): Promise<void> {
  return transition(trailId, 'saved', [null, 'in_progress', 'aborted'])
}

/** Remove the bookmark (deletes the row if the trail wasn't started). */
export async function unsaveTrail(trailId: string): Promise<void> {
  const userId = await requireUserId()
  const row = await readRow(userId, trailId, false)
  if (row?.status !== 'saved') return
  // Paused mid-trail: keep the history (and ticked crumbs) but take it off Saved.
  if (row.startedAt) return writeStatus(userId, trailId, 'aborted')
  try {
    const { error } = await supabase
      .from('user_sidequests')
      .delete()
      .eq('user_id', userId)
      .eq('sidequest_id', trailId)
    if (error) throw toProgressError(error, 'trail')
  } catch (error) {
    throw error instanceof ProgressError ? error : toProgressError(null, 'trail')
  }
}

/** Sign up for a scheduled trail (status 'signed_up'). Only works if scheduled_at is set. */
export function joinTrail(trailId: string): Promise<void> {
  return transition(trailId, 'signed_up', [null, 'saved', 'aborted'])
}

/** Start the trail (status 'in_progress'). Resumes if already started. */
export function startTrail(trailId: string): Promise<void> {
  return transition(trailId, 'in_progress', [null, 'saved', 'signed_up', 'aborted'])
}

/** Finish the trail (status 'completed'). Unlocks rating. */
export function finishTrail(trailId: string): Promise<void> {
  return transition(trailId, 'completed', [null, 'saved', 'signed_up', 'in_progress', 'aborted'])
}

/** Stop the attempt (status 'aborted'). Doesn't count as finished. */
export function abortTrail(trailId: string): Promise<void> {
  return transition(trailId, 'aborted', ['saved', 'signed_up', 'in_progress'])
}

/** Tick or untick a crumb (checklist_items row) during an active trail. */
export async function toggleCrumb(crumbId: string, done: boolean): Promise<void> {
  const userId = await requireUserId()
  try {
    const { error } = done
      ? // Already ticked is fine: ignore the duplicate instead of failing.
        await supabase
          .from('checklist_completions')
          .upsert(
            { user_id: userId, checklist_item_id: crumbId },
            { onConflict: 'user_id,checklist_item_id', ignoreDuplicates: true },
          )
      : await supabase
          .from('checklist_completions')
          .delete()
          .eq('user_id', userId)
          .eq('checklist_item_id', crumbId)
    if (error) throw toProgressError(error, 'crumb')
  } catch (error) {
    throw error instanceof ProgressError ? error : toProgressError(null, 'crumb')
  }
}
