/**
 * Data calls for the Make a trail page: load the curated place library
 * (experiences) for the place picker, and save a trail through the
 * save_trail() database function, which writes the trail, its stops and crumbs
 * in one transaction.
 */

import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/database.types'
import { toSavePayload, type TrailDraft } from './draft'

export type Place = Pick<
  Tables<'experiences'>,
  'id' | 'name' | 'address' | 'neighborhood' | 'latitude' | 'longitude' | 'estimated_cost' | 'nearest_station' | 'category'
>

/** Every place in the curated library, by name. */
export async function loadPlaces(): Promise<Place[]> {
  const { data, error } = await supabase
    .from('experiences')
    .select('id, name, address, neighborhood, latitude, longitude, estimated_cost, nearest_station, category')
    .order('name')
  if (error) throw error
  return data ?? []
}

export type SaveResult = { ok: true; id: string } | { ok: false; message: string }

/**
 * Creates the trail (trailId null) or updates it. Returns the trail id, or a
 * message to show. save_trail() raises friendly messages for checklist problems
 * ("Add at least 2 stops before publishing"), which are passed through.
 */
export async function saveTrail(
  draft: TrailDraft,
  status: 'draft' | 'published',
  trailId: string | null,
): Promise<SaveResult> {
  const { data, error } = await supabase.rpc('save_trail', {
    p_trail: toSavePayload(draft, status),
    ...(trailId ? { p_trail_id: trailId } : {}),
  })
  if (!error && data) return { ok: true, id: data }
  if (error?.code === '23514' || error?.code === '42501') return { ok: false, message: error.message }
  if (error?.message?.toLowerCase().includes('fetch')) {
    return { ok: false, message: "Couldn't reach the server. Check your connection and try again." }
  }
  console.error('[make] save failed', error)
  return { ok: false, message: 'Something went wrong saving your trail. Please try again.' }
}
