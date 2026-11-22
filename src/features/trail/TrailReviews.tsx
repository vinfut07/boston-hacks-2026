/**
 * Reviews on the Trail detail page: the overall average with one bar per rating
 * question (fun, memorable, worth the money, worth the time; 1–5 each, from
 * sidequest_rating_stats), then each review with the reviewer and their score.
 * Shows an empty state until someone finishes and rates the trail.
 */

import { Link } from 'react-router'
import { formatShortDate } from '@/components/trailFormat'
import type { TrailRatingBreakdown, TrailReview } from '@/lib/api/trails'

const BARS: { key: 'enjoyment' | 'memorability' | 'price' | 'time'; label: string }[] = [
  { key: 'enjoyment', label: 'Fun' },
  { key: 'memorability', label: 'Memorable' },
  { key: 'price', label: 'Worth the money' },
  { key: 'time', label: 'Worth the time' },
]

function initials(name: string) {
  const words = name.split(/[\s._-]+/).filter(Boolean)
  return ((words[0]?.[0] ?? '') + (words[1]?.[0] ?? '')).toUpperCase() || '?'
}

function ReviewCard({ review }: { review: TrailReview }) {
  const name = review.reviewer?.display_name || review.reviewer?.username || 'Someone'
  const username = review.reviewer?.username
  return (
    <figure className="m-0 rounded-card border border-line bg-white px-5 py-4.5">
      <figcaption className="flex items-center gap-2.5">
        {review.reviewer?.avatar_url ? (
          <img
            src={review.reviewer.avatar_url}
            alt=""
            referrerPolicy="no-referrer"
            className="size-9 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-full bg-crumb-tint text-sm font-extrabold text-crumb-strong">
            {initials(name)}
          </span>
        )}
        <span className="min-w-0">
          {username ? (
            <Link to={`/u/${username}`} className="block truncate text-base font-bold text-ink hover:underline">
              {name}
            </Link>
          ) : (
            <span className="block truncate text-base font-bold">{name}</span>
          )}
          <span className="block text-sm text-muted-foreground">
            {formatShortDate(review.createdAt)} · rated {review.overall.toFixed(1)}
          </span>
        </span>
      </figcaption>
      {review.text ? <blockquote className="m-0 mt-3 text-base leading-normal">{review.text}</blockquote> : null}
    </figure>
  )
}

export function TrailReviews({ rating, reviews }: { rating: TrailRatingBreakdown; reviews: TrailReview[] }) {
  if (rating.count === 0 || rating.average === null) {
    return (
      <div className="mt-4 rounded-card border border-dashed border-line-strong bg-white px-6 py-8 text-center">
        <p className="text-lg font-bold">No reviews yet</p>
        <p className="mt-1 text-base text-ink-2">Finish this trail and be the first to rate it.</p>
      </div>
    )
  }

  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-x-10 gap-y-6 rounded-card border border-line bg-white px-6 py-5">
        <div>
          <p className="text-[2.75rem] leading-none font-extrabold tracking-[var(--tracking-title)]">
            {rating.average.toFixed(1)}
            <span className="sr-only"> out of 5</span>
          </p>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {rating.count} {rating.count === 1 ? 'review' : 'reviews'}
          </p>
        </div>
        <dl className="m-0 grid min-w-0 flex-[1_1_260px] grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-x-3.5 gap-y-2.5 text-sm">
          {BARS.map(({ key, label }) => {
            const value = rating[key]
            return (
              <div key={key} className="contents">
                <dt className="font-semibold">{label}</dt>
                <dd className="m-0 h-2 rounded-pill bg-sand" aria-hidden>
                  <span
                    className="block h-2 rounded-pill bg-crumb-strong"
                    style={{ width: `${value === null ? 0 : (value / 5) * 100}%` }}
                  />
                </dd>
                <dd className="m-0 font-semibold">{value === null ? '–' : value.toFixed(1)}</dd>
              </div>
            )
          })}
        </dl>
      </div>

      {reviews.length > 0 ? (
        <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(min(100%,300px),1fr))] gap-4">
          {reviews.map((review) => (
            <ReviewCard key={review.id} review={review} />
          ))}
        </div>
      ) : null}
    </>
  )
}
