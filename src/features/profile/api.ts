/**
 * Data for the You page (/me, /u/:username): a profile, its questgiver rating,
 * and the trail lists behind the Finished / Saved / Signed up / Made tabs.
 * Privacy comes from RLS: user_sidequests rows are only readable by their owner,
 * and other people's drafts never come back. Used by ProfilePage.tsx.
 */
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'
import type { UserSidequestStatus } from '@/types/db-values'

export type Result<T> = { ok: true; data: T } | { ok: false; message: string }

export type PublicProfile = Pick<
  Tables<'profiles'>,
  'id' | 'username' | 'display_name' | 'avatar_url' | 'university' | 'bio'
>

export type QuestgiverRating = { average: number; count: number }

/** A trail as listed on the profile, plus the viewer's progress on it when relevant. */
export type ProfileTrail = {
  id: string
  title: string
  category: string | null
  scheduledAt: string | null
  estimatedCost: number | null
  durationMinutes: number | null
  neighborhood: string | null
  /** sidequests.status: 'draft' only ever appears on your own Made tab. */
  trailStatus: string
  completedAt: string | null
  /** Your overall rating (mean of the four scores), on Finished trails you rated. */
  myRating: number | null
}

export type ProgressTab = Extract<UserSidequestStatus, 'completed' | 'saved' | 'signed_up'>

const PROFILE_COLUMNS = 'id, username, display_name, avatar_url, university, bio'
const TRAIL_COLUMNS =
  'id, title, category, scheduled_at, estimated_cost, estimated_duration_minutes, neighborhood, status'

const NETWORK_ERROR = 'We couldn’t reach Breadcrumb. Check your connection and try again.'
const GENERIC_ERROR = 'Something went wrong loading this. Please try again.'

/** supabase-js reports network failures as an error without a Postgres code. */
function failure(error: { code?: string } | null): { ok: false; message: string } {
  return { ok: false, message: error?.code ? GENERIC_ERROR : NETWORK_ERROR }
}

type TrailRow = Pick<
  Tables<'sidequests'>,
  | 'id'
  | 'title'
  | 'category'
  | 'scheduled_at'
  | 'estimated_cost'
  | 'estimated_duration_minutes'
  | 'neighborhood'
  | 'status'
>

function toTrail(row: TrailRow, extra: Partial<ProfileTrail> = {}): ProfileTrail {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    scheduledAt: row.scheduled_at,
    estimatedCost: row.estimated_cost,
    durationMinutes: row.estimated_duration_minutes,
    neighborhood: row.neighborhood,
    trailStatus: row.status,
    completedAt: null,
    myRating: null,
    ...extra,
  }
}

/** A profile by id or username. `data` is null when no one matches. */
export async function getProfile(by: { id: string } | { username: string }): Promise<Result<PublicProfile | null>> {
  try {
    const query = supabase.from('profiles').select(PROFILE_COLUMNS)
    const { data, error } = await ('id' in by ? query.eq('id', by.id) : query.eq('username', by.username)).maybeSingle()
    if (error) return failure(error)
    return { ok: true, data }
  } catch {
    return failure(null)
  }
}

/** Average overall rating across the user's trails, or null if nobody has rated one yet. */
export async function getQuestgiverRating(userId: string): Promise<Result<QuestgiverRating | null>> {
  try {
    const { data, error } = await supabase
      .from('questgiver_ratings')
      .select('avg_overall, rating_count')
      .eq('creator_id', userId)
      .maybeSingle()
    if (error) return failure(error)
    if (!data || !data.rating_count || data.avg_overall === null) return { ok: true, data: null }
    return { ok: true, data: { average: Number(data.avg_overall), count: data.rating_count } }
  } catch {
    return failure(null)
  }
}

/** How many trails a user has finished (yours only: other people's progress is private). */
export async function countMyFinished(userId: string): Promise<Result<number>> {
  try {
    const { count, error } = await supabase
      .from('user_sidequests')
      .select('sidequest_id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'completed')
    if (error) return failure(error)
    return { ok: true, data: count ?? 0 }
  } catch {
    return failure(null)
  }
}

/** How many trails a user made that the viewer can see (yours include drafts). */
export async function countMade(userId: string): Promise<Result<number>> {
  try {
    const { count, error } = await supabase
      .from('sidequests')
      .select('id', { count: 'exact', head: true })
      .eq('creator_id', userId)
      .neq('status', 'archived')
    if (error) return failure(error)
    return { ok: true, data: count ?? 0 }
  } catch {
    return failure(null)
  }
}

/** Your trails with a given progress status, most recent first. */
export async function getMyTrails(userId: string, status: ProgressTab): Promise<Result<ProfileTrail[]>> {
  try {
    const { data, error } = await supabase
      .from('user_sidequests')
      .select(`completed_at, updated_at, sidequest:sidequests(${TRAIL_COLUMNS})`)
      .eq('user_id', userId)
      .eq('status', status)
      .order(status === 'completed' ? 'completed_at' : 'updated_at', { ascending: false })
    if (error) return failure(error)

    // A trail its creator has since hidden comes back as null; skip it.
    const trails = data.flatMap((row) =>
      row.sidequest ? [toTrail(row.sidequest, { completedAt: row.completed_at })] : [],
    )
    if (status !== 'completed' || trails.length === 0) return { ok: true, data: trails }

    // "You rated 4" on finished trails: your own ratings, averaged across the four scores.
    const { data: ratings, error: ratingError } = await supabase
      .from('sidequest_ratings')
      .select('sidequest_id, price_rating, time_rating, enjoyment_rating, memorability_rating')
      .eq('user_id', userId)
      .in(
        'sidequest_id',
        trails.map((t) => t.id),
      )
    if (ratingError) return { ok: true, data: trails } // ratings are a nice-to-have here
    const byTrail = new Map(
      ratings.map((r) => [
        r.sidequest_id,
        (r.price_rating + r.time_rating + r.enjoyment_rating + r.memorability_rating) / 4,
      ]),
    )
    return { ok: true, data: trails.map((t) => ({ ...t, myRating: byTrail.get(t.id) ?? null })) }
  } catch {
    return failure(null)
  }
}

/** Trails a user made, newest first. Others see only what's published; you also see drafts. */
export async function getMadeTrails(userId: string): Promise<Result<ProfileTrail[]>> {
  try {
    const { data, error } = await supabase
      .from('sidequests')
      .select(TRAIL_COLUMNS)
      .eq('creator_id', userId)
      .neq('status', 'archived')
      .order('created_at', { ascending: false })
    if (error) return failure(error)
    return { ok: true, data: data.map((row) => toTrail(row)) }
  } catch {
    return failure(null)
  }
}
