/**
 * "Good to know" box and the "Curated by / Made by" card on the Trail detail page.
 * Every line is worked out from the trail's own data (when, length, how you get
 * around, T line, cost), so nothing is invented. Used by TrailDetailPage.
 */

import { useId, type CSSProperties } from 'react'
import { Bike, Bus, CalendarDays, Clock, Footprints, TrainFront, Wallet } from 'lucide-react'
import { Link } from 'react-router'
import logoMark from '../../../docs/assets/svg/logo-mark.svg'
import { LINE_INFO, formatMinutes, formatSchedule } from '@/components/trailFormat'
import type { TrailDetail } from '@/lib/api/trails'

const plural = (n: number, word: string) => `${n === 1 ? 'one' : n} ${word}${n === 1 ? '' : 's'}`

/** "All walking", "Walking and one T ride", "Biking and 2 bus rides"… from the stops' travel modes. */
function gettingAround(trail: TrailDetail) {
  const legs = trail.stops.slice(1).map((s) => s.travelModeToStop)
  const count = (mode: string) => legs.filter((m) => m === mode).length
  const walk = count('walk')
  const train = count('train')
  const bus = count('bus')
  const bike = count('bike')
  if (walk + train + bus + bike === 0) return null
  if (walk > 0 && train + bus + bike === 0) return { text: 'All walking between stops', icon: Footprints }
  const parts = [
    walk > 0 ? 'walking' : null,
    bike > 0 ? 'biking' : null,
    train > 0 ? plural(train, 'T ride') : null,
    bus > 0 ? plural(bus, 'bus ride') : null,
  ].filter((p): p is string => p !== null)
  const text = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0]
  const icon = train > 0 ? TrainFront : bus > 0 ? Bus : bike > 0 ? Bike : Footprints
  return { text: text.charAt(0).toUpperCase() + text.slice(1), icon }
}

export function TrailGoodToKnow({ trail }: { trail: TrailDetail }) {
  const headingId = useId()
  const around = gettingAround(trail)
  const line = trail.primaryLine ? LINE_INFO[trail.primaryLine] : null
  const items = [
    trail.scheduledAt
      ? { key: 'when', icon: CalendarDays, text: `Group outing ${formatSchedule(trail.scheduledAt)}` }
      : { key: 'when', icon: CalendarDays, text: 'Go anytime, on your own or with friends' },
    trail.estimatedMinutes !== null
      ? { key: 'time', icon: Clock, text: `About ${formatMinutes(trail.estimatedMinutes)} start to finish` }
      : null,
    around ? { key: 'around', icon: around.icon, text: around.text } : null,
    trail.estimatedCost !== null
      ? {
          key: 'cost',
          icon: Wallet,
          text: trail.estimatedCost <= 0 ? 'Free' : `About $${Math.round(trail.estimatedCost)} per person`,
        }
      : null,
  ].filter((item) => item !== null)

  return (
    <section aria-labelledby={headingId} className="rounded-card border border-line bg-white px-5 py-4.5">
      <h2 id={headingId} className="text-lg font-bold">
        Good to know
      </h2>
      <ul className="m-0 mt-3.5 grid list-none gap-3 p-0 text-base">
        {items.map(({ key, icon: Icon, text }) => (
          <li key={key} className="flex items-center gap-2.5">
            <Icon aria-hidden className="size-[18px] shrink-0 text-ink-2" />
            {text}
          </li>
        ))}
        {line ? (
          <li className="flex items-center gap-2.5">
            <span aria-hidden className="grid size-[18px] shrink-0 place-items-center">
              {line.color ? <span className="line-dot" style={{ '--line': line.color } as CSSProperties} /> : null}
            </span>
            On the {line.name}
          </li>
        ) : null}
      </ul>
    </section>
  )
}

export function TrailCreatorCard({ trail }: { trail: TrailDetail }) {
  const creator = trail.creator
  if (trail.isCurated) {
    return (
      <div className="flex items-center gap-3 rounded-card border border-line bg-white px-5 py-4">
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-xl bg-crumb-tint">
          <img src={logoMark} alt="" className="w-7" />
        </span>
        <span>
          <span className="block text-base font-bold">Curated by breadcrumb</span>
          <span className="block text-sm text-muted-foreground">Real places, picked by the team</span>
        </span>
      </div>
    )
  }
  if (!creator) return null
  const name = creator.display_name || creator.username || 'Someone'
  return (
    <div className="flex items-center gap-3 rounded-card border border-line bg-white px-5 py-4">
      {creator.avatar_url ? (
        <img src={creator.avatar_url} alt="" referrerPolicy="no-referrer" className="size-10 shrink-0 rounded-full object-cover" />
      ) : (
        <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-crumb-tint font-extrabold text-crumb-strong">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="min-w-0">
        <span className="block text-base font-bold">Made by {name}</span>
        {creator.username ? (
          <Link to={`/u/${creator.username}`} className="block text-sm font-semibold text-crumb-strong hover:text-crumb-deep">
            @{creator.username}
          </Link>
        ) : null}
      </span>
    </div>
  )
}
