/**
 * "The trail" on the Trail detail page: numbered stops joined by dotted lines, each
 * with its address, what to do there, its crumbs (See / Do) and how to get to the
 * next stop (walk, T, bus, bike). Only shows travel modes that are stored; no
 * invented times or routes. Styled by .stops / .stop / .crumb-item in components.css.
 */

import { Bike, Bus, Footprints, TrainFront } from 'lucide-react'
import type { TrailCrumb, TrailStop } from '@/lib/api/trails'
import type { TravelMode } from '@/types/db-values'

const LEG: Record<TravelMode, { verb: string; icon: typeof Footprints }> = {
  walk: { verb: 'Walk to', icon: Footprints },
  train: { verb: 'Take the T to', icon: TrainFront },
  bus: { verb: 'Take the bus to', icon: Bus },
  bike: { verb: 'Bike to', icon: Bike },
}

function CrumbItem({ crumb }: { crumb: TrailCrumb }) {
  return (
    <li className="crumb-item">
      <span>
        <b>{crumb.type === 'see' ? 'See:' : 'Do:'}</b> {crumb.label}
      </span>
    </li>
  )
}

export function TrailStops({ stops, betweenStopCrumbs }: { stops: TrailStop[]; betweenStopCrumbs: TrailCrumb[] }) {
  if (stops.length === 0) {
    return <p className="mt-4 text-base text-ink-2">This trail doesn't have any stops yet.</p>
  }

  return (
    <div className="mt-4 rounded-card border border-line bg-white px-5 py-5 md:px-6">
      <ol className="stops m-0">
        {stops.map((stop, i) => {
          const next = stops[i + 1]
          const leg = next?.travelModeToStop ? LEG[next.travelModeToStop] : null
          const showActivity = stop.plannedActivity && stop.plannedActivity !== stop.description
          return (
            <li key={stop.id} className="stop">
              <span className="num-ring">{i + 1}</span>
              <div className="min-w-0">
                <h3 className="stop__name">{stop.placeName}</h3>
                {stop.address ? <p className="stop__place">{stop.address}</p> : null}
                {stop.description ? <p className="mt-2 text-base leading-normal text-ink-2">{stop.description}</p> : null}
                {showActivity ? <p className="mt-2 text-base leading-normal text-ink-2">{stop.plannedActivity}</p> : null}
                {stop.crumbs.length > 0 ? (
                  <ul className="m-0 list-none p-0">
                    {stop.crumbs.map((crumb) => (
                      <CrumbItem key={crumb.id} crumb={crumb} />
                    ))}
                  </ul>
                ) : null}
                {stop.notes ? <p className="mt-2 text-sm text-muted-foreground">{stop.notes}</p> : null}
                {leg && next ? (
                  <p className="stop__leg">
                    <leg.icon aria-hidden />
                    {leg.verb} {next.placeName}
                  </p>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>

      {betweenStopCrumbs.length > 0 ? (
        <div className="mt-5 border-t border-line pt-4">
          <h3 className="text-base font-bold">On the way</h3>
          <ul className="m-0 list-none p-0">
            {betweenStopCrumbs.map((crumb) => (
              <CrumbItem key={crumb.id} crumb={crumb} />
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
