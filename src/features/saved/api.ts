/**
 * Data for the Saved page: the signed-in user's trails with status saved,
 * signed_up or in_progress, shaped for <TrailCard> (stop names, rating) and
 * tagged with that status. user_sidequests rows are private to their owner
 * (RLS). Used by SavedPage.tsx.
 */
import { supabase } from '@/lib/supabase'
import type { TrailCardData } from '@/components/TrailCard'
import type { Category, UserSidequestStatus } from '@/types/db-values'

export type SavedStatus = Extract<UserSidequestStatus, 'saved' | 'signed_up' | 'in_progress'>
export type SavedTrail = TrailCardData & { status: SavedStatus; updatedAt: string }

export type SavedResult = { ok: true; trails: SavedTrail[] } | { ok: false; message: string }

const NETWORK_ERROR = 'We couldn’t reach Breadcrumb. Check your connection and try again.'
const GENERIC_ERROR = 'Something went wrong loading your trails. Please try again.'
const fail = (error: { code?: string } | null): SavedResult => ({
  ok: false,
  // supabase-js reports network failures as an error without a Postgres code.
  message: error?.code ? GENERIC_ERROR : NETWORK_ERROR,
})

/** Numeric columns can arrive as strings; normalise to number | null. */
const num = (v: number | string | null | undefined) => (v === null || v === undefined || v === '' ? null : Number(v))

export async function getSavedTrails(userId: string): Promise<SavedResult> {
  try {
    const { data, error } = await supabase
      .from('user_sidequests')
      .select(
        `status, updated_at,
         sidequest:sidequests(id, title, category, neighborhood, estimated_cost,
           estimated_duration_minutes, scheduled_at, sidequest_stops(place_name, stop_order))`,
      )
      .eq('user_id', userId)
      .in('status', ['in_progress', 'signed_up', 'saved'])
      .order('updated_at', { ascending: false })
    if (error) return fail(error)

    // A trail its creator has since hidden comes back as null; skip it.
    const rows = data.filter((row) => row.sidequest !== null)
    const ids = rows.map((row) => row.sidequest!.id)

    const ratings = new Map<string, { average: number | null; count: number }>()
    if (ids.length > 0) {
      const { data: stats, error: statsError } = await supabase
        .from('sidequest_rating_stats')
        .select('sidequest_id, avg_overall, rating_count')
        .in('sidequest_id', ids)
      // Ratings only decorate the cards; show the trails even if this fails.
      if (!statsError) {
        for (const s of stats) {
          if (s.sidequest_id) ratings.set(s.sidequest_id, { average: num(s.avg_overall), count: s.rating_count ?? 0 })
        }
      }
    }

    const trails = rows.map<SavedTrail>((row) => {
      const trail = row.sidequest!
      const stops = [...trail.sidequest_stops].sort((a, b) => a.stop_order - b.stop_order)
      return {
        id: trail.id,
        title: trail.title,
        category: trail.category as Category | null,
        neighborhood: trail.neighborhood,
        estimatedCost: num(trail.estimated_cost),
        estimatedMinutes: trail.estimated_duration_minutes,
        scheduledAt: trail.scheduled_at,
        stopCount: stops.length,
        firstStopName: stops[0]?.place_name ?? null,
        lastStopName: stops.length > 1 ? stops[stops.length - 1].place_name : null,
        rating: ratings.get(trail.id) ?? { average: null, count: 0 },
        status: row.status as SavedStatus,
        updatedAt: row.updated_at,
      }
    })
    return { ok: true, trails }
  } catch {
    return fail(null)
  }
}
