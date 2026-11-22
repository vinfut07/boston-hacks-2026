/**
 * Reusable trail card: eyebrow (category · Anytime or the date), title, the dotted
 * trail with first/last stop names, then cost, time, stops and rating. The whole
 * card links to /trails/:id. Styled by .trail-card in docs/styles/components.css.
 * Used by Explore (feed grid) and Saved / You. Takes any object with the fields of
 * TrailCardData, so a FeedTrail from @/lib/api/trails can be passed as-is.
 */

import type { CSSProperties, ReactNode } from 'react'
import { Star } from 'lucide-react'
import { Link } from 'react-router'
import { TrailLine } from '@/components/TrailLine'
import { CATEGORY_LABELS, formatCost, formatMinutes, formatSchedule } from '@/components/trailFormat'
import { cn } from '@/lib/utils'
import type { Category, UserSidequestStatus } from '@/types/db-values'

/** The fields a card needs (a subset of FeedTrail). */
export type TrailCardData = {
  id: string
  title: string
  category: Category | null
  neighborhood: string | null
  estimatedCost: number | null
  estimatedMinutes: number | null
  /** Null = anytime trail; set = scheduled outing people can join. */
  scheduledAt: string | null
  stopCount: number
  firstStopName: string | null
  lastStopName: string | null
  rating: { average: number | null; count: number }
}

type TrailCardProps = {
  trail: TrailCardData
  /** The viewer's own progress on this trail, if any (Saved / You pages). */
  progress?: UserSidequestStatus | null
  className?: string
}

/** Small stable number from the id, so each card's wave is different but never changes. */
function waveSeed(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 997
  return h % 7
}

export function TrailCard({ trail, progress, className }: TrailCardProps) {
  const done = progress === 'completed'
  const scheduled = !done && trail.scheduledAt !== null
  const when = done ? 'Finished' : scheduled ? formatSchedule(trail.scheduledAt!) : 'Anytime'
  const eyebrow = [trail.category ? CATEGORY_LABELS[trail.category] : null, when].filter(Boolean).join(' · ')
  const labels = [trail.firstStopName, trail.lastStopName].filter((name): name is string => Boolean(name))

  let end: ReactNode
  if (progress === 'signed_up') end = <span className="status-link">Going</span>
  else if (progress === 'in_progress') end = <span className="status-link">In progress</span>
  else if (trail.rating.count > 0 && trail.rating.average !== null) {
    end = (
      <span className="rating">
        <Star aria-hidden />
        {trail.rating.average.toFixed(1)}
        <span className="sr-only">
          {' '}
          out of 5, {trail.rating.count} {trail.rating.count === 1 ? 'rating' : 'ratings'}
        </span>
      </span>
    )
  } else if (scheduled) end = <span className="status-link">Join</span>
  else end = <span className="text-muted font-medium">New</span>

  return (
    <Link
      to={`/trails/${trail.id}`}
      className={cn('trail-card', scheduled && 'trail-card--scheduled', done && 'trail-card--done', className)}
    >
      <div className="trail-card__head">
        <span className="trail-card__eyebrow shrink-0">{eyebrow}</span>
        {trail.neighborhood ? <span className="trail-card__meta min-w-0 truncate">{trail.neighborhood}</span> : null}
      </div>
      <h2 className="trail-card__title">{trail.title}</h2>

      <div className={cn('trail', done && 'trail--done')}>
        <TrailLine stops={trail.stopCount} state={done ? 'done' : 'open'} seed={waveSeed(trail.id)} />
        {labels.length > 0 && !done ? (
          <div className="trail__labels" style={{ '--stops': labels.length } as CSSProperties}>
            {labels.map((name, i) => (
              <span key={i} title={name}>
                {name}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {done ? null : (
        <div className="trail-card__stats">
          {trail.estimatedCost !== null ? <span>{formatCost(trail.estimatedCost)}</span> : null}
          {trail.estimatedMinutes !== null ? <span>{formatMinutes(trail.estimatedMinutes)}</span> : null}
          <span>
            {trail.stopCount} {trail.stopCount === 1 ? 'stop' : 'stops'}
          </span>
          <span className="trail-card__end">{end}</span>
        </div>
      )}
    </Link>
  )
}
