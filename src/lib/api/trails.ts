/**
 * Trail data for the Explore feed and the Trail detail page.
 *
 *   getFeed(filters) → FeedTrail[]   published trails for Explore
 *   getTrail(id)     → TrailDetail   one trail with stops, crumbs and reviews
 *
 * Words: a "trail" is a row in `sidequests`, its stops are `sidequest_stops`
 * and its "crumbs" are `checklist_items`. Visibility (drafts, community-only
 * trails) is enforced by RLS, so these only ever return what the user may see.
 */

import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'
import type { Category, SidequestStatus, TransitLine, TravelMode, ChecklistItemType } from '@/types/db-values'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TrailCreator = Pick<Tables<'profiles'>, 'id' | 'username' | 'display_name' | 'avatar_url'>

export type TrailRating = {
  /** Average of the four scores (price, time, enjoyment, memorability), 1–5. Null if unrated. */
  average: number | null
  count: number
}

/** One card on the Explore page. */
export type FeedTrail = {
  id: string
  title: string
  description: string | null
  category: Category | null
  neighborhood: string | null
  coverImageUrl: string | null
  /** Rough total cost per person in USD. */
  estimatedCost: number | null
  estimatedMinutes: number | null
  /** Null = anytime trail; set = scheduled outing people can join. */
  scheduledAt: string | null
  primaryLine: TransitLine | null
  isCurated: boolean
  createdAt: string
  creator: TrailCreator | null
  stopCount: number
  crumbCount: number
  firstStopName: string | null
  lastStopName: string | null
  rating: TrailRating
}

export type FeedFilters = {
  category?: Category
  /** Only trails costing at most this many dollars. */
  maxCost?: number
  /** Only trails taking at most this many minutes. */
  maxMinutes?: number
}

export type TrailCrumb = {
  id: string
  label: string
  type: ChecklistItemType
  order: number
  /** Null when the crumb is on the way between stops rather than at one. */
  stopId: string | null
}

export type TrailStop = {
  id: string
  order: number
  placeName: string
  address: string | null
  latitude: number | null
  longitude: number | null
  description: string | null
  plannedActivity: string | null
  /** How to get here from the previous stop. Null for the first stop. */
  travelModeToStop: TravelMode | null
  estimatedCost: number | null
  notes: string | null
  crumbs: TrailCrumb[]
}

export type TrailReview = {
  id: string
  priceRating: number
  timeRating: number
  enjoymentRating: number
  memorabilityRating: number
  /** Average of the four scores. */
  overall: number
  text: string | null
  createdAt: string
  reviewer: TrailCreator | null
}

export type TrailRatingBreakdown = TrailRating & {
  price: number | null
  time: number | null
  enjoyment: number | null
  memorability: number | null
}

/** Everything the Trail detail page shows. */
export type TrailDetail = Omit<FeedTrail, 'rating'> & {
  status: SidequestStatus
  communityId: string | null
  stops: TrailStop[]
  /** Crumbs not tied to a stop (e.g. something to see between stops). */
  betweenStopCrumbs: TrailCrumb[]
  rating: TrailRatingBreakdown
  reviews: TrailReview[]
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CREATOR_FIELDS = 'id, username, display_name, avatar_url'

/** Postgres numeric columns can arrive as strings; normalise to number | null. */
function num(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

/** Rating stats for many trails at once, keyed by trail id. */
async function fetchRatingStats(trailIds: string[]) {
  const stats = new Map<string, Tables<'sidequest_rating_stats'>>()
  if (trailIds.length === 0) return stats
  const { data, error } = await supabase.from('sidequest_rating_stats').select('*').in('sidequest_id', trailIds)
  if (error) throw error
  for (const row of data ?? []) if (row.sidequest_id) stats.set(row.sidequest_id, row)
  return stats
}

function toCrumb(row: Pick<Tables<'checklist_items'>, 'id' | 'label' | 'item_type' | 'item_order' | 'stop_id'>): TrailCrumb {
  return {
    id: row.id,
    label: row.label,
    type: row.item_type as ChecklistItemType,
    order: row.item_order,
    stopId: row.stop_id,
  }
}

// ---------------------------------------------------------------------------
// getFeed
// ---------------------------------------------------------------------------

/** Published trails the user can see, newest first, with card details. */
export async function getFeed(filters: FeedFilters = {}): Promise<FeedTrail[]> {
  let query = supabase
    .from('sidequests')
    .select(
      `id, title, description, category, neighborhood, cover_image_url, estimated_cost,
       estimated_duration_minutes, scheduled_at, primary_line, is_curated, created_at,
       creator:profiles!sidequests_creator_id_fkey(${CREATOR_FIELDS}),
       sidequest_stops(place_name, stop_order),
       checklist_items(count)`,
    )
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  if (filters.category) query = query.eq('category', filters.category)
  if (filters.maxCost !== undefined) query = query.lte('estimated_cost', filters.maxCost)
  if (filters.maxMinutes !== undefined) query = query.lte('estimated_duration_minutes', filters.maxMinutes)

  const { data, error } = await query
  if (error) throw error
  const rows = data ?? []
  const stats = await fetchRatingStats(rows.map((r) => r.id))

  return rows.map((row) => {
    const stops = [...row.sidequest_stops].sort((a, b) => a.stop_order - b.stop_order)
    const s = stats.get(row.id)
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      category: row.category as Category | null,
      neighborhood: row.neighborhood,
      coverImageUrl: row.cover_image_url,
      estimatedCost: num(row.estimated_cost),
      estimatedMinutes: row.estimated_duration_minutes,
      scheduledAt: row.scheduled_at,
      primaryLine: row.primary_line as TransitLine | null,
      isCurated: row.is_curated,
      createdAt: row.created_at,
      creator: row.creator,
      stopCount: stops.length,
      crumbCount: row.checklist_items[0]?.count ?? 0,
      firstStopName: stops[0]?.place_name ?? null,
      lastStopName: stops.length > 1 ? stops[stops.length - 1].place_name : null,
      rating: { average: num(s?.avg_overall), count: s?.rating_count ?? 0 },
    }
  })
}

// ---------------------------------------------------------------------------
// getTrail
// ---------------------------------------------------------------------------

/** One trail with everything the detail page needs, or null if it doesn't exist or isn't visible. */
export async function getTrail(id: string): Promise<TrailDetail | null> {
  const { data: row, error } = await supabase
    .from('sidequests')
    .select(
      `id, title, description, category, neighborhood, cover_image_url, estimated_cost,
       estimated_duration_minutes, scheduled_at, primary_line, is_curated, created_at,
       status, community_id,
       creator:profiles!sidequests_creator_id_fkey(${CREATOR_FIELDS}),
       sidequest_stops(id, stop_order, place_name, address, latitude, longitude, description,
                       planned_activity, travel_mode_to_stop, estimated_cost, notes),
       checklist_items(id, label, item_type, item_order, stop_id),
       sidequest_ratings(id, price_rating, time_rating, enjoyment_rating, memorability_rating,
                         review_text, created_at,
                         reviewer:profiles!sidequest_ratings_user_id_fkey(${CREATOR_FIELDS}))`,
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  if (!row) return null

  const stats = (await fetchRatingStats([row.id])).get(row.id)
  const crumbs = row.checklist_items.map(toCrumb).sort((a, b) => a.order - b.order)
  const stops = [...row.sidequest_stops]
    .sort((a, b) => a.stop_order - b.stop_order)
    .map<TrailStop>((stop) => ({
      id: stop.id,
      order: stop.stop_order,
      placeName: stop.place_name,
      address: stop.address,
      latitude: stop.latitude,
      longitude: stop.longitude,
      description: stop.description,
      plannedActivity: stop.planned_activity,
      travelModeToStop: stop.travel_mode_to_stop as TravelMode | null,
      estimatedCost: num(stop.estimated_cost),
      notes: stop.notes,
      crumbs: crumbs.filter((c) => c.stopId === stop.id),
    }))

  const reviews = [...row.sidequest_ratings]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map<TrailReview>((r) => ({
      id: r.id,
      priceRating: r.price_rating,
      timeRating: r.time_rating,
      enjoymentRating: r.enjoyment_rating,
      memorabilityRating: r.memorability_rating,
      overall: (r.price_rating + r.time_rating + r.enjoyment_rating + r.memorability_rating) / 4,
      text: r.review_text,
      createdAt: r.created_at,
      reviewer: r.reviewer,
    }))

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category as Category | null,
    neighborhood: row.neighborhood,
    coverImageUrl: row.cover_image_url,
    estimatedCost: num(row.estimated_cost),
    estimatedMinutes: row.estimated_duration_minutes,
    scheduledAt: row.scheduled_at,
    primaryLine: row.primary_line as TransitLine | null,
    isCurated: row.is_curated,
    createdAt: row.created_at,
    status: row.status as SidequestStatus,
    communityId: row.community_id,
    creator: row.creator,
    stopCount: stops.length,
    crumbCount: crumbs.length,
    firstStopName: stops[0]?.placeName ?? null,
    lastStopName: stops.length > 1 ? stops[stops.length - 1].placeName : null,
    stops,
    betweenStopCrumbs: crumbs.filter((c) => c.stopId === null),
    rating: {
      average: num(stats?.avg_overall),
      count: stats?.rating_count ?? 0,
      price: num(stats?.avg_price),
      time: num(stats?.avg_time),
      enjoyment: num(stats?.avg_enjoyment),
      memorability: num(stats?.avg_memorability),
    },
    reviews,
  }
}
