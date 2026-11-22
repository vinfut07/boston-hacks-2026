/**
 * Explore's data source. TEMPORARY until task D1 (src/lib/api/trails.ts) is merged:
 * returns the three curated trails from D1's seed migration (same ids, places and
 * numbers), shaped exactly like D1's FeedTrail. After D1 merges, delete the sample
 * and the copied types and make loadFeed() call getFeed(filters); nothing else changes.
 */

import type { Category, TransitLine } from '@/types/db-values'

// --- Copied from D1's src/lib/api/trails.ts (delete after D1 merges) ---------
export type FeedTrail = {
  id: string
  title: string
  description: string | null
  category: Category | null
  neighborhood: string | null
  coverImageUrl: string | null
  estimatedCost: number | null
  estimatedMinutes: number | null
  scheduledAt: string | null
  primaryLine: TransitLine | null
  isCurated: boolean
  createdAt: string
  creator: { id: string; username: string | null; display_name: string | null; avatar_url: string | null } | null
  stopCount: number
  crumbCount: number
  firstStopName: string | null
  lastStopName: string | null
  rating: { average: number | null; count: number }
}

export type FeedFilters = {
  category?: Category
  maxCost?: number
  maxMinutes?: number
}
// -----------------------------------------------------------------------------

const BREADCRUMB_TEAM = {
  id: 'b2ead000-0000-4000-8000-000000000001',
  username: 'breadcrumb',
  display_name: 'breadcrumb',
  avatar_url: null,
}

/** The curated trails seeded by D1 (supabase/migrations/…_seed_curated_demo_trails.sql). */
const SAMPLE_FEED: FeedTrail[] = [
  {
    id: '5eed0000-0000-4000-8000-000000000001',
    title: 'Sunday Café Hop',
    description:
      'A slow Sunday through Beacon Hill and Back Bay: breakfast on Charles Street, a lap of the Public Garden, then a book and a coffee on Newbury Street. Mostly walking, with one short Green Line ride.',
    category: 'food_drink',
    neighborhood: 'Beacon Hill',
    coverImageUrl: null,
    estimatedCost: 25,
    estimatedMinutes: 150,
    scheduledAt: null,
    primaryLine: 'gl',
    isCurated: true,
    createdAt: '2026-11-21T22:59:02Z',
    creator: BREADCRUMB_TEAM,
    stopCount: 3,
    crumbCount: 5,
    firstStopName: 'Tatte Bakery & Café',
    lastStopName: 'Trident Booksellers & Café',
    rating: { average: null, count: 0 },
  },
  {
    id: '5eed0000-0000-4000-8000-000000000002',
    title: 'North End Cannoli Duel',
    description:
      "Settle the oldest argument in Boston: Modern Pastry or Mike's Pastry? Try one cannoli from each, pick a winner, then walk it off by the harbor.",
    category: 'food_drink',
    neighborhood: 'North End',
    coverImageUrl: null,
    estimatedCost: 15,
    estimatedMinutes: 90,
    scheduledAt: null,
    primaryLine: 'ol',
    isCurated: true,
    createdAt: '2026-11-21T22:59:02Z',
    creator: BREADCRUMB_TEAM,
    stopCount: 3,
    crumbCount: 4,
    firstStopName: 'Modern Pastry',
    lastStopName: 'Christopher Columbus Waterfront Park',
    rating: { average: null, count: 0 },
  },
  {
    id: '5eed0000-0000-4000-8000-000000000003',
    title: 'Harvard Square Bookstores',
    description:
      'A Sunday morning in Harvard Square: a lap of Harvard Yard, the stacks at Harvard Book Store, and a poem from the Grolier. Join the group or do it on your own.',
    category: 'arts_culture',
    neighborhood: 'Harvard Square',
    coverImageUrl: null,
    estimatedCost: 20,
    estimatedMinutes: 120,
    scheduledAt: '2026-11-29T16:00:00Z',
    primaryLine: 'rl',
    isCurated: true,
    createdAt: '2026-11-21T22:59:02Z',
    creator: BREADCRUMB_TEAM,
    stopCount: 3,
    crumbCount: 3,
    firstStopName: 'Harvard Yard',
    lastStopName: 'Grolier Poetry Book Shop',
    rating: { average: null, count: 0 },
  },
]

/** Published trails for the "For you" feed. Same filters as D1's getFeed(). */
export async function loadFeed(filters: FeedFilters = {}): Promise<FeedTrail[]> {
  return SAMPLE_FEED.filter(
    (t) =>
      (filters.category === undefined || t.category === filters.category) &&
      (filters.maxCost === undefined || (t.estimatedCost !== null && t.estimatedCost <= filters.maxCost)) &&
      (filters.maxMinutes === undefined || (t.estimatedMinutes !== null && t.estimatedMinutes <= filters.maxMinutes)),
  )
}
