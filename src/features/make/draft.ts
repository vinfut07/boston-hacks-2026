/**
 * The Make a trail form's data: what a trail-in-progress looks like, the
 * "Ready to publish" checklist, the suggested cost/time, and how the form turns
 * into the JSON that save_trail() expects. No React here, so it's easy to test.
 */

import type { Category, TravelMode } from '@/types/db-values'

export const MIN_STOPS = 2
export const MAX_STOPS = 8

export const CATEGORY_OPTIONS: { value: Category; label: string }[] = [
  { value: 'food_drink', label: 'Food & drink' },
  { value: 'outdoors', label: 'Outdoors' },
  { value: 'arts_culture', label: 'Arts & culture' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'attractions', label: 'Sights' },
  { value: 'affordable', label: 'Budget' },
]

export const TRAVEL_OPTIONS: { value: TravelMode; label: string }[] = [
  { value: 'walk', label: 'Walk' },
  { value: 'train', label: 'T (subway)' },
  { value: 'bus', label: 'Bus' },
  { value: 'bike', label: 'Bike' },
]

export type StopDraft = {
  /** Local id for React keys and reordering (not a database id). */
  key: string
  /** Set when the stop was picked from the curated place library. */
  experienceId: string | null
  placeName: string
  address: string
  latitude: number | null
  longitude: number | null
  neighborhood: string | null
  /** Rough cost per person from the library, if known. */
  estimatedCost: number | null
  /** How to get here from the previous stop (ignored for the first stop). */
  travelMode: TravelMode
  /** The small task at this stop. */
  crumb: string
}

export type TrailDraft = {
  title: string
  description: string
  category: Category | null
  when: 'anytime' | 'scheduled'
  /** Value of a datetime-local input, e.g. "2026-11-29T11:00", in the user's time zone. */
  scheduledLocal: string
  /** Minutes; null = use the suggestion. */
  durationMinutes: number | null
  stops: StopDraft[]
}

export const emptyDraft = (): TrailDraft => ({
  title: '',
  description: '',
  category: null,
  when: 'anytime',
  scheduledLocal: '',
  durationMinutes: null,
  stops: [],
})

/** Sum of the stops' known costs, or null if none are known. */
export function suggestedCost(stops: StopDraft[]): number | null {
  const known = stops.map((s) => s.estimatedCost).filter((c): c is number => c !== null)
  return known.length ? known.reduce((a, b) => a + b, 0) : null
}

/** A rough visit-time suggestion (about 45 min per stop, rounded to 30 min). The user can change it. */
export function suggestedMinutes(stopCount: number): number | null {
  if (stopCount === 0) return null
  return Math.max(30, Math.round((stopCount * 45) / 30) * 30)
}

export type ChecklistItem = { label: string; done: boolean }

/** The "Ready to publish" list. Publishing is allowed when every item is done. */
export function publishChecklist(draft: TrailDraft): ChecklistItem[] {
  const scheduledOk =
    draft.when === 'anytime' || (draft.scheduledLocal !== '' && new Date(draft.scheduledLocal).getTime() > Date.now())
  return [
    { label: 'A name and a category', done: draft.title.trim() !== '' && draft.category !== null },
    { label: `At least ${MIN_STOPS} stops`, done: draft.stops.length >= MIN_STOPS },
    { label: 'A crumb at every stop', done: draft.stops.length > 0 && draft.stops.every((s) => s.crumb.trim() !== '') },
    { label: 'A future date (dated trails only)', done: scheduledOk },
  ]
}

export const canPublish = (draft: TrailDraft) => publishChecklist(draft).every((item) => item.done)

/** The JSON body for save_trail() (see its migration for the shape). */
export function toSavePayload(draft: TrailDraft, status: 'draft' | 'published') {
  const cost = suggestedCost(draft.stops)
  const minutes = draft.durationMinutes ?? suggestedMinutes(draft.stops.length)
  return {
    title: draft.title.trim(),
    description: draft.description.trim() || null,
    category: draft.category,
    scheduled_at:
      draft.when === 'scheduled' && draft.scheduledLocal ? new Date(draft.scheduledLocal).toISOString() : null,
    status,
    estimated_cost: cost,
    estimated_duration_minutes: minutes,
    neighborhood: draft.stops[0]?.neighborhood ?? null,
    stops: draft.stops.map((s, i) => ({
      experience_id: s.experienceId,
      place_name: s.placeName.trim(),
      address: s.address.trim() || null,
      latitude: s.latitude,
      longitude: s.longitude,
      travel_mode_to_stop: i === 0 ? null : s.travelMode,
      estimated_cost: s.estimatedCost,
      crumb: s.crumb.trim(),
    })),
  }
}
