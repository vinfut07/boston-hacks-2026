/**
 * Rating a finished trail: price, time, enjoyment and memorability (1–5 each)
 * plus an optional written review, stored in sidequest_ratings. The database
 * only accepts a rating from someone whose user_sidequests status is
 * 'completed', once per trail, and never from the trail's creator.
 *
 * Owner: Jason (task J3). These are agreed signatures so other screens (e.g.
 * Gio's Active trail "Finished" flow) can call them now. Fill in the bodies;
 * don't rename them.
 */

export type RatingInput = {
  price: number
  time: number
  enjoyment: number
  memorability: number
  review?: string | null
}

export type MyRating = RatingInput & { id: string; createdAt: string }

const notYet = (name: string) => () =>
  Promise.reject(new Error(`${name}() is not implemented yet (src/lib/api/ratings.ts)`))

/** The current user's rating of a trail, or null if they haven't rated it. */
export const getMyRating: (trailId: string) => Promise<MyRating | null> = notYet('getMyRating')

/** Create or update the current user's rating (upsert on user + trail). */
export const rateTrail: (trailId: string, rating: RatingInput) => Promise<void> = notYet('rateTrail')

/** Delete the current user's rating of a trail. */
export const deleteMyRating: (trailId: string) => Promise<void> = notYet('deleteMyRating')
