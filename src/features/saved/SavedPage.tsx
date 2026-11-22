/**
 * Saved page: the signed-in user's trails, grouped In progress / Going (signed
 * up for a scheduled trail) / Saved, each as a <TrailCard>. Saved trails can be
 * removed here (unsaveTrail). Logged-out visitors are sent to /login?next=/saved.
 * Route: /saved · Owner: Gio
 */
import { useEffect, useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate } from 'react-router'
import { BookmarkX, LoaderCircle } from 'lucide-react'
import emptyTrail from '../../../docs/assets/svg/empty-trail.svg'
import { TrailCard } from '@/components/TrailCard'
import { ProgressError, progressErrorMessage, unsaveTrail } from '@/lib/api/progress'
import { useSession } from '@/lib/useSession'
import { getSavedTrails, type SavedStatus, type SavedTrail } from './api'

const SECTIONS: { status: SavedStatus; title: string }[] = [
  { status: 'in_progress', title: 'In progress' },
  { status: 'signed_up', title: 'Going' },
  { status: 'saved', title: 'Saved' },
]

export function SavedPage() {
  const { session, loading } = useSession()
  const userId = session?.user.id ?? null

  if (loading) return <SavedShell><CardSkeletons /></SavedShell>
  if (!userId) return <Navigate to="/login?next=%2Fsaved" replace />
  // Keyed by user so switching accounts never shows the previous user's list.
  return <SavedList key={userId} userId={userId} />
}

type State = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; trails: SavedTrail[] }

function SavedList({ userId }: { userId: string }) {
  const [state, setState] = useState<State>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    getSavedTrails(userId).then((result) => {
      if (cancelled) return
      setState(result.ok ? { status: 'ready', trails: result.trails } : { status: 'error', message: result.message })
    })
    return () => {
      cancelled = true
    }
  }, [userId, attempt])

  if (state.status === 'loading') {
    return (
      <SavedShell>
        <CardSkeletons />
      </SavedShell>
    )
  }

  if (state.status === 'error') {
    return (
      <SavedShell>
        <div role="alert" className="rounded-card border border-line bg-white px-6 py-10 text-center">
          <p className="font-bold text-ink">{state.message}</p>
          <button
            type="button"
            className="btn btn--sm btn--secondary mt-4"
            onClick={() => {
              setState({ status: 'loading' })
              setAttempt((n) => n + 1)
            }}
          >
            Try again
          </button>
        </div>
      </SavedShell>
    )
  }

  const { trails } = state
  if (trails.length === 0) {
    return (
      <SavedShell>
        <div className="grid justify-items-center gap-2 rounded-card border border-dashed border-line-strong bg-white px-6 py-12 text-center">
          <img src={emptyTrail} alt="" aria-hidden width={240} height={160} className="h-auto max-w-full" />
          <h2 className="mt-3 text-xl font-bold tracking-[var(--tracking-tight)] text-ink">No saved trails yet</h2>
          <p className="mb-3 max-w-[34ch] text-ink-2">Save one from your feed, or make your own. It only takes two stops.</p>
          <Link to="/" className="btn">
            Explore trails
          </Link>
        </div>
      </SavedShell>
    )
  }

  const removeTrail = (id: string) =>
    setState((s) => (s.status === 'ready' ? { ...s, trails: s.trails.filter((t) => t.id !== id) } : s))

  return (
    <SavedShell>
      <div className="grid gap-8">
        {SECTIONS.map(({ status, title }) => {
          let items = trails.filter((t) => t.status === status)
          if (items.length === 0) return null
          // Going: soonest first. The others stay most-recently-touched first.
          if (status === 'signed_up') {
            items = [...items].sort((a, b) => (a.scheduledAt ?? '').localeCompare(b.scheduledAt ?? ''))
          }
          const headingId = `saved-${status}`
          return (
            <section key={status} aria-labelledby={headingId}>
              <h2 id={headingId} className="mb-3 text-base font-bold text-ink">
                {title} <span className="font-semibold text-muted-foreground">· {items.length}</span>
              </h2>
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3 md:gap-4">
                {items.map((trail) => (
                  <li key={trail.id} className="grid content-start gap-1">
                    <TrailCard trail={trail} progress={trail.status} />
                    {status === 'saved' ? <RemoveButton trail={trail} onRemoved={() => removeTrail(trail.id)} /> : null}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </SavedShell>
  )
}

/** "Remove" under a saved card: calls unsaveTrail, then drops the card from the list. */
function RemoveButton({ trail, onRemoved }: { trail: SavedTrail; onRemoved: () => void }) {
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function remove() {
    if (busy) return
    setBusy(true)
    setError(null)
    try {
      await unsaveTrail(trail.id)
      onRemoved()
    } catch (e) {
      if (e instanceof ProgressError && e.code === 'not_signed_in') {
        navigate('/login?next=%2Fsaved')
        return
      }
      setError(progressErrorMessage(e))
      setBusy(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-end gap-x-3">
      {error ? (
        <p role="alert" className="text-sm font-semibold text-crumb-deep">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="btn btn--ghost btn--sm"
        onClick={remove}
        disabled={busy}
        aria-label={`Remove ${trail.title} from saved`}
      >
        {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : <BookmarkX aria-hidden />}
        Remove
      </button>
    </div>
  )
}

function SavedShell({ children }: { children: ReactNode }) {
  return (
    <section aria-labelledby="saved-title">
      <h1
        id="saved-title"
        className="text-[2rem] leading-[var(--leading-tight)] font-extrabold tracking-[var(--tracking-title)] text-ink md:text-[2.5rem]"
      >
        Saved
      </h1>
      <p className="mt-1.5 mb-5 text-md text-ink-2 md:mt-2 md:text-lg">Trails you’ve bookmarked, joined, or started.</p>
      {children}
    </section>
  )
}

/** Grey card-shaped blocks while the list loads (same as Explore). */
function CardSkeletons() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading your trails"
      className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,280px),1fr))] gap-3 md:gap-4"
    >
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[196px] animate-pulse rounded-card border border-line bg-sand" aria-hidden />
      ))}
    </div>
  )
}
