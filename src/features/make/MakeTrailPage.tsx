/**
 * Make a trail (docs/mockups/Web-Create + Mobile-Create): basics (name,
 * description, category, anytime vs. a date), 2–8 stops picked from the place
 * library or added by hand, a crumb at each stop and how to get there, a live
 * preview card, and the "Ready to publish" checklist. Save draft / Publish trail
 * call save_trail() through ./api, which saves everything in one transaction.
 * Logged-out users are sent to /login?next=/make.
 * Route: /make · Owner: Dom
 */

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, Check, Circle, X } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router'
import { TrailCard } from '@/components/TrailCard'
import { useSession } from '@/lib/useSession'
import { cn } from '@/lib/utils'
import type { TravelMode } from '@/types/db-values'
import { loadPlaces, saveTrail, type Place } from './api'
import {
  CATEGORY_OPTIONS,
  MAX_STOPS,
  TRAVEL_OPTIONS,
  canPublish,
  emptyDraft,
  publishChecklist,
  suggestedCost,
  suggestedMinutes,
  type StopDraft,
  type TrailDraft,
} from './draft'
import { PlacePicker } from './PlacePicker'

const DURATION_OPTIONS = [30, 60, 90, 120, 150, 180, 240, 300]

const newKey = () => Math.random().toString(36).slice(2)

function stopFromPlace(place: Place): StopDraft {
  return {
    key: newKey(),
    experienceId: place.id,
    placeName: place.name,
    address: place.address ?? '',
    latitude: place.latitude,
    longitude: place.longitude,
    neighborhood: place.neighborhood,
    estimatedCost: place.estimated_cost === null ? null : Number(place.estimated_cost),
    travelMode: 'walk',
    crumb: '',
  }
}

function customStop(name: string): StopDraft {
  return {
    key: newKey(),
    experienceId: null,
    placeName: name,
    address: '',
    latitude: null,
    longitude: null,
    neighborhood: null,
    estimatedCost: null,
    travelMode: 'walk',
    crumb: '',
  }
}

function formatMinutes(minutes: number) {
  return minutes < 60 ? `${minutes} min` : `${minutes / 60} hr`
}

/** White rounded box used for each section of the form. */
function Panel({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-card border border-line bg-white p-4 shadow-[var(--shadow-card)] md:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="text-md font-bold text-ink">{title}</h2>
        {aside ? <span className="text-sm text-muted-foreground">{aside}</span> : null}
      </div>
      {children}
    </section>
  )
}

const fieldClass =
  'w-full rounded-[10px] border border-line-strong bg-white px-3 py-2.5 text-base text-ink outline-none placeholder:text-muted-foreground focus:shadow-[var(--focus-ring)]'
const labelClass = 'mb-1.5 block text-sm font-semibold text-ink-2'

export function MakeTrailPage() {
  const { session, loading } = useSession()
  if (loading) return null
  if (!session) return <Navigate to="/login?next=/make" replace />
  return <MakeTrailForm />
}

function MakeTrailForm() {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<TrailDraft>(emptyDraft)
  const [places, setPlaces] = useState<Place[]>([])
  const [placesError, setPlacesError] = useState(false)
  const [trailId, setTrailId] = useState<string | null>(null)
  const [saving, setSaving] = useState<'draft' | 'published' | null>(null)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadPlaces()
      .then(setPlaces)
      .catch(() => setPlacesError(true))
  }, [])

  const update = (patch: Partial<TrailDraft>) => {
    setDraft((d) => ({ ...d, ...patch }))
    setMessage(null)
  }
  const updateStop = (key: string, patch: Partial<StopDraft>) =>
    update({ stops: draft.stops.map((s) => (s.key === key ? { ...s, ...patch } : s)) })
  const removeStop = (key: string) => update({ stops: draft.stops.filter((s) => s.key !== key) })
  const moveStop = (index: number, by: -1 | 1) => {
    const stops = [...draft.stops]
    const [stop] = stops.splice(index, 1)
    stops.splice(index + by, 0, stop)
    update({ stops })
  }
  const addStop = (stop: StopDraft) => {
    if (draft.stops.length < MAX_STOPS) update({ stops: [...draft.stops, stop] })
  }

  const checklist = publishChecklist(draft)
  const publishable = canPublish(draft)
  const cost = suggestedCost(draft.stops)
  const minutes = draft.durationMinutes ?? suggestedMinutes(draft.stops.length)
  const usedPlaceIds = useMemo(
    () => new Set(draft.stops.map((s) => s.experienceId).filter((id): id is string => id !== null)),
    [draft.stops],
  )

  async function save(status: 'draft' | 'published') {
    if (saving) return
    if (draft.title.trim() === '') {
      setMessage({ tone: 'error', text: 'Give your trail a name first.' })
      return
    }
    setSaving(status)
    const result = await saveTrail(draft, status, trailId)
    setSaving(null)
    if (!result.ok) {
      setMessage({ tone: 'error', text: result.message })
      return
    }
    setTrailId(result.id)
    if (status === 'published') navigate(`/trails/${result.id}`)
    else setMessage({ tone: 'ok', text: 'Draft saved. Only you can see it.' })
  }

  const preview = {
    id: trailId ?? 'preview',
    title: draft.title.trim() || 'Your trail name',
    category: draft.category,
    neighborhood: draft.stops[0]?.neighborhood ?? null,
    estimatedCost: cost,
    estimatedMinutes: minutes,
    scheduledAt:
      draft.when === 'scheduled' && draft.scheduledLocal ? new Date(draft.scheduledLocal).toISOString() : null,
    stopCount: Math.max(draft.stops.length, 2),
    firstStopName: draft.stops[0]?.placeName ?? null,
    lastStopName: draft.stops.length > 1 ? draft.stops[draft.stops.length - 1].placeName : null,
    rating: { average: null, count: 0 },
  }

  return (
    <div className="pb-24 md:pb-0">
      {/* Title row with the two actions */}
      <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-[2rem] leading-[var(--leading-tight)] font-extrabold tracking-[var(--tracking-title)] text-ink md:text-[2.5rem]">
            Make a trail
          </h1>
          <p className="mt-1.5 text-md text-ink-2">Pick 2 to {MAX_STOPS} stops, add a crumb at each, and publish.</p>
        </div>
        <div className="fixed inset-x-0 bottom-[calc(var(--tabbar-height)+env(safe-area-inset-bottom,0px))] z-20 flex gap-2 border-t border-line bg-white/95 p-3 backdrop-blur md:static md:border-0 md:bg-transparent md:p-0">
          <button
            type="button"
            className="btn btn--sm btn--secondary flex-1 md:flex-none"
            onClick={() => save('draft')}
            aria-disabled={saving !== null}
          >
            {saving === 'draft' ? 'Saving…' : 'Save draft'}
          </button>
          <button
            type="button"
            className="btn btn--sm flex-1 md:flex-none"
            onClick={() => (publishable ? save('published') : undefined)}
            aria-disabled={!publishable || saving !== null}
            title={publishable ? undefined : 'Finish the "Ready to publish" list first'}
          >
            {saving === 'published' ? 'Publishing…' : 'Publish trail'}
          </button>
        </div>
      </div>

      {message ? (
        <p
          role={message.tone === 'error' ? 'alert' : 'status'}
          className={cn(
            'mb-4 rounded-[10px] px-4 py-3 text-sm font-medium',
            message.tone === 'error' ? 'bg-crumb-tint text-crumb-deep' : 'bg-[var(--color-green-tint)] text-done',
          )}
        >
          {message.text}
        </p>
      ) : null}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:gap-8">
        <div className="flex min-w-0 flex-col gap-4">
          {/* ---------------------------------------------------------- Basics */}
          <Panel title="Basics">
            <div className="flex flex-col gap-4">
              <div>
                <label htmlFor="trail-title" className={labelClass}>
                  Name
                </label>
                <input
                  id="trail-title"
                  className={fieldClass}
                  maxLength={120}
                  placeholder="Rainy Day Bookshop Crawl"
                  value={draft.title}
                  onChange={(e) => update({ title: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="trail-description" className={labelClass}>
                  Short description
                </label>
                <textarea
                  id="trail-description"
                  className={cn(fieldClass, 'min-h-20 resize-y')}
                  maxLength={500}
                  placeholder="Two of Boston's oldest bookshops for a gray afternoon, with a coffee at the end."
                  value={draft.description}
                  onChange={(e) => update({ description: e.target.value })}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <fieldset>
                  <legend className={labelClass}>Category</legend>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className="tab"
                        aria-pressed={draft.category === option.value}
                        aria-selected={draft.category === option.value}
                        onClick={() => update({ category: option.value })}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className={labelClass}>When</legend>
                  <div className="flex gap-2">
                    {(['anytime', 'scheduled'] as const).map((when) => (
                      <button
                        key={when}
                        type="button"
                        className="tab flex-1"
                        aria-pressed={draft.when === when}
                        aria-selected={draft.when === when}
                        onClick={() => update({ when })}
                      >
                        {when === 'anytime' ? 'Anytime' : 'Pick a date'}
                      </button>
                    ))}
                  </div>
                  {draft.when === 'scheduled' ? (
                    <input
                      type="datetime-local"
                      aria-label="Date and time"
                      className={cn(fieldClass, 'mt-2')}
                      value={draft.scheduledLocal}
                      onChange={(e) => update({ scheduledLocal: e.target.value })}
                    />
                  ) : null}
                  <p className="mt-1.5 text-sm text-muted-foreground">Dated trails show a time and let people join.</p>
                </fieldset>
              </div>
            </div>
          </Panel>

          {/* ----------------------------------------------------------- Stops */}
          <Panel title="Stops" aside={`${draft.stops.length} of ${MAX_STOPS} · use the arrows to reorder`}>
            <PlacePicker
              places={places}
              usedPlaceIds={usedPlaceIds}
              disabled={draft.stops.length >= MAX_STOPS}
              onPickPlace={(place) => addStop(stopFromPlace(place))}
              onAddCustom={(name) => addStop(customStop(name))}
            />
            {placesError ? (
              <p className="mt-2 text-sm text-crumb-deep">Couldn't load the place library. You can still add your own places.</p>
            ) : null}

            {draft.stops.length === 0 ? (
              <p className="mt-4 rounded-[10px] border border-dashed border-line-strong px-4 py-6 text-center text-sm text-muted-foreground">
                Search above to add your first stop.
              </p>
            ) : (
              <ol className="mt-4 flex flex-col">
                {draft.stops.map((stop, index) => (
                  <li key={stop.key}>
                    {index > 0 ? (
                      <div className="flex items-center gap-2 py-2 pl-[13px]">
                        <span aria-hidden className="h-6 border-l-2 border-dotted border-crumb" />
                        <label className="ml-4 flex items-center gap-2 text-sm text-muted-foreground">
                          Getting here
                          <select
                            className="rounded-pill border border-line-strong bg-white px-2.5 py-1 text-sm font-semibold text-ink outline-none focus-visible:shadow-[var(--focus-ring)]"
                            value={stop.travelMode}
                            onChange={(e) => updateStop(stop.key, { travelMode: e.target.value as TravelMode })}
                          >
                            {TRAVEL_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>
                                {o.label}
                              </option>
                            ))}
                          </select>
                        </label>
                      </div>
                    ) : null}

                    <div className="rounded-[12px] border border-line bg-paper p-3">
                      <div className="flex items-start gap-3">
                        <span className="num-ring shrink-0" aria-hidden>
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-bold text-ink">{stop.placeName}</p>
                          {stop.experienceId ? (
                            <p className="truncate text-sm text-muted-foreground">{stop.address}</p>
                          ) : (
                            <input
                              aria-label={`Address for ${stop.placeName}`}
                              className="mt-1 w-full rounded-[8px] border border-line-strong bg-white px-2.5 py-1.5 text-sm outline-none focus:shadow-[var(--focus-ring)]"
                              placeholder="Address (optional)"
                              value={stop.address}
                              onChange={(e) => updateStop(stop.key, { address: e.target.value })}
                            />
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            className="icon-btn size-9 disabled:pointer-events-none disabled:opacity-30"
                            aria-label={`Move ${stop.placeName} up`}
                            disabled={index === 0}
                            onClick={() => moveStop(index, -1)}
                          >
                            <ArrowUp aria-hidden className="size-4" />
                          </button>
                          <button
                            type="button"
                            className="icon-btn size-9 disabled:pointer-events-none disabled:opacity-30"
                            aria-label={`Move ${stop.placeName} down`}
                            disabled={index === draft.stops.length - 1}
                            onClick={() => moveStop(index, 1)}
                          >
                            <ArrowDown aria-hidden className="size-4" />
                          </button>
                          <button
                            type="button"
                            className="icon-btn size-9 disabled:pointer-events-none disabled:opacity-30"
                            aria-label={`Remove ${stop.placeName}`}
                            onClick={() => removeStop(stop.key)}
                          >
                            <X aria-hidden className="size-4" />
                          </button>
                        </div>
                      </div>
                      <label className="mt-3 block">
                        <span className="mb-1 block text-xs font-semibold tracking-wide text-crumb-strong uppercase">Crumb</span>
                        <input
                          className="w-full rounded-[8px] border border-line-strong bg-white px-3 py-2 text-sm outline-none focus:shadow-[var(--focus-ring)]"
                          maxLength={200}
                          placeholder="A small thing to do here, e.g. Dig through the outdoor sale lot"
                          value={stop.crumb}
                          onChange={(e) => updateStop(stop.key, { crumb: e.target.value })}
                        />
                      </label>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        {/* ------------------------------------------------------- Sidebar */}
        <aside className="mt-4 flex flex-col gap-4 lg:sticky lg:top-24 lg:mt-0">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink-2">Preview · how it shows in the feed</p>
            <div inert className="pointer-events-none">
              <TrailCard trail={preview} />
            </div>
          </div>

          <Panel title="Estimates">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Cost per person</dt>
                <dd className="mt-0.5 font-bold text-ink">
                  {cost === null ? '—' : cost === 0 ? 'Free' : `~$${Math.round(cost)}`}
                </dd>
                <dd className="text-xs text-muted-foreground">Added up from your stops</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">
                  <label htmlFor="trail-duration">About how long</label>
                </dt>
                <dd className="mt-0.5">
                  <select
                    id="trail-duration"
                    className="w-full rounded-[8px] border border-line-strong bg-white px-2 py-1.5 font-bold text-ink outline-none focus-visible:shadow-[var(--focus-ring)]"
                    value={minutes ?? ''}
                    onChange={(e) => update({ durationMinutes: e.target.value ? Number(e.target.value) : null })}
                  >
                    {minutes === null ? <option value="">—</option> : null}
                    {DURATION_OPTIONS.map((m) => (
                      <option key={m} value={m}>
                        {formatMinutes(m)}
                      </option>
                    ))}
                  </select>
                </dd>
                <dd className="text-xs text-muted-foreground">
                  {draft.durationMinutes === null ? 'Suggested, change it if needed' : 'Set by you'}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="Ready to publish">
            <ul className="flex flex-col gap-2 text-sm">
              {checklist.map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  {item.done ? (
                    <Check aria-hidden className="size-4 rounded-full bg-done p-0.5 text-white" />
                  ) : (
                    <Circle aria-hidden className="size-4 text-line-strong" />
                  )}
                  <span className={item.done ? 'text-ink' : 'text-muted-foreground'}>{item.label}</span>
                  <span className="sr-only">{item.done ? '(done)' : '(not done yet)'}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>
      </div>
    </div>
  )
}
