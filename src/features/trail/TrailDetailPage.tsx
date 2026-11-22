/**
 * Trail detail page (docs/mockups/Web-Detail + Mobile-Detail), loaded with getTrail(id):
 * eyebrow, title, cost / time / stops / crumbs / rating, description, Start trail /
 * Save / Join (TrailActions), the stops with crumbs, Good to know, the creator and
 * reviews. Map on the right is a placeholder for now. Phones get a sticky action bar.
 * Route: /trails/:id · Owner: Jason
 */

import { useEffect, useState, type ReactNode } from 'react'
import { ChevronLeft, MapIcon, Star } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { CATEGORY_LABELS, formatCost, formatMinutes, formatSchedule } from '@/components/trailFormat'
import { getTrail, type TrailDetail } from '@/lib/api/trails'
import { cn } from '@/lib/utils'
import { TrailActions } from './TrailActions'
import { TrailCreatorCard, TrailGoodToKnow } from './TrailGoodToKnow'
import { TrailReviews } from './TrailReviews'
import { TrailStops } from './TrailStops'
import { useTrailActions } from './useTrailActions'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

type LoadResult = { key: string; trail?: TrailDetail | null; error?: string }

function BackLink() {
  return (
    <Link to="/" className="inline-flex h-10 items-center gap-1.5 text-base font-semibold text-ink-2 hover:text-ink">
      <ChevronLeft aria-hidden className="size-[18px]" />
      All trails
    </Link>
  )
}

/** Not found / error message in place of the page. */
function TrailMessage({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div>
      <BackLink />
      <div className="mt-4 rounded-card border border-dashed border-line-strong bg-white px-6 py-12 text-center">
        <p className="text-xl font-bold">{title}</p>
        <div className="mt-2 text-base text-ink-2">{children}</div>
      </div>
    </div>
  )
}

function TrailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading trail">
      <BackLink />
      <div className="mt-4 max-w-2xl animate-pulse space-y-4">
        <div className="h-4 w-40 rounded-pill bg-sand" />
        <div className="h-10 w-3/4 rounded-pill bg-sand" />
        <div className="h-4 w-56 rounded-pill bg-sand" />
        <div className="h-20 w-full rounded-card bg-sand" />
        <div className="h-64 w-full rounded-card bg-sand" />
      </div>
    </div>
  )
}

export function TrailDetailPage() {
  const { id = '' } = useParams()
  const valid = UUID.test(id)
  const [attempt, setAttempt] = useState(0)
  const [result, setResult] = useState<LoadResult | null>(null)
  const actions = useTrailActions(id)

  const key = `${id}|${attempt}`
  const loading = valid && result?.key !== key

  useEffect(() => {
    if (!valid) return
    let cancelled = false
    getTrail(id).then(
      (trail) => !cancelled && setResult({ key, trail }),
      (error: unknown) =>
        !cancelled && setResult({ key, error: error instanceof Error ? error.message : 'Something went wrong.' }),
    )
    return () => {
      cancelled = true
    }
  }, [id, key, valid])

  const trail = !loading && result?.key === key ? result.trail : undefined

  useEffect(() => {
    if (!trail) return
    const previous = document.title
    document.title = `${trail.title} · breadcrumb`
    return () => {
      document.title = previous
    }
  }, [trail])

  if (loading) return <TrailSkeleton />

  if (result?.error) {
    return (
      <TrailMessage title="Couldn't load this trail">
        <p>{result.error}</p>
        <button type="button" className="btn btn--sm btn--secondary mt-4" onClick={() => setAttempt((n) => n + 1)}>
          Try again
        </button>
      </TrailMessage>
    )
  }

  if (!trail) {
    return (
      <TrailMessage title="Trail not found">
        <p>It may have been removed, or it isn't published yet.</p>
        <Link to="/" className="btn btn--sm btn--secondary mt-4">
          Browse trails
        </Link>
      </TrailMessage>
    )
  }

  const scheduled = trail.scheduledAt !== null
  const eyebrow = [
    trail.category ? CATEGORY_LABELS[trail.category] : null,
    scheduled ? formatSchedule(trail.scheduledAt!) : 'Anytime',
    trail.isCurated ? 'Curated' : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="pb-28 md:pb-0">
      <BackLink />

      <div className="mt-2 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(320px,400px)] lg:items-start lg:gap-10">
        <article className="min-w-0">
          <p className={cn('text-sm font-semibold md:text-[0.875rem]', scheduled ? 'text-scheduled' : 'text-crumb-strong')}>
            {eyebrow}
          </p>
          <h1 className="mt-2 text-[1.75rem] leading-[1.05] font-extrabold tracking-[var(--tracking-title)] md:text-[3rem]">
            {trail.title}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-base font-semibold text-ink-2 md:mt-3.5 md:text-lg">
            {trail.estimatedCost !== null ? <span>{formatCost(trail.estimatedCost)}</span> : null}
            {trail.estimatedMinutes !== null ? <span>{formatMinutes(trail.estimatedMinutes)}</span> : null}
            <span>
              {trail.stopCount} {trail.stopCount === 1 ? 'stop' : 'stops'}
            </span>
            <span>
              {trail.crumbCount} {trail.crumbCount === 1 ? 'crumb' : 'crumbs'}
            </span>
            {trail.rating.count > 0 && trail.rating.average !== null ? (
              <span className="rating">
                <Star aria-hidden />
                {trail.rating.average.toFixed(1)} ({trail.rating.count})
                <span className="sr-only"> out of 5, {trail.rating.count} ratings</span>
              </span>
            ) : null}
          </div>

          {trail.description ? (
            <p className="mt-4 max-w-[60ch] text-base leading-[1.55] text-ink-2 md:mt-4.5 md:text-lg">{trail.description}</p>
          ) : null}

          <div className="mt-6 hidden md:block">
            <TrailActions actions={actions} scheduled={scheduled} layout="inline" />
          </div>

          <h2 className="mt-8 text-xl font-bold tracking-[var(--tracking-tight)] md:mt-10">The trail</h2>
          <TrailStops stops={trail.stops} betweenStopCrumbs={trail.betweenStopCrumbs} />

          <div className="mt-6 grid gap-4 lg:hidden">
            <TrailGoodToKnow trail={trail} />
            <TrailCreatorCard trail={trail} />
          </div>

          <h2 className="mt-8 text-xl font-bold tracking-[var(--tracking-tight)] md:mt-10">Reviews</h2>
          <TrailReviews rating={trail.rating} reviews={trail.reviews} />
        </article>

        <aside aria-label="Map and details" className="sticky top-24 hidden flex-col gap-4 lg:flex">
          <div className="grid aspect-[400/420] place-items-center rounded-card border border-line bg-sand p-8 text-center">
            <div>
              <MapIcon aria-hidden className="mx-auto size-8 text-muted-foreground" />
              <p className="mt-3 font-bold text-ink">Map coming soon</p>
              <p className="mt-1 text-sm text-muted-foreground">The stops will show here on a real map of Boston.</p>
            </div>
          </div>
          <TrailGoodToKnow trail={trail} />
          <TrailCreatorCard trail={trail} />
        </aside>
      </div>

      <TrailActions actions={actions} scheduled={scheduled} layout="bar" />
    </div>
  )
}
