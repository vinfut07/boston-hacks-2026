/**
 * Map of a trail: numbered stop markers and the real walking / transit route
 * between them (Google Maps JS + Directions API, styled per docs/STYLE_GUIDE.md).
 * In "live" mode it also shows the user's position (passed in, never stored).
 *
 * Owner: Dom (task D3). This is a PLACEHOLDER with the agreed props, so Trail
 * detail, Active trail, Make a trail and the Map tab can use it now. Never draw
 * straight lines between stops as if they were a route (PRD §5.5).
 */

import { MapIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { TravelMode } from '@/types/db-values'

export type RouteMapStop = {
  id: string
  placeName: string
  latitude: number | null
  longitude: number | null
  /** How to get here from the previous stop. Null for the first stop. */
  travelModeToStop: TravelMode | null
}

export type RouteMapProps = {
  stops: RouteMapStop[]
  /** "preview": static overview. "live": follows the user during an active trail. */
  mode?: 'preview' | 'live'
  /** The user's current position (live mode only). Never stored. */
  userLocation?: { latitude: number; longitude: number } | null
  /** Highlight one stop, e.g. the next stop on an active trail. */
  selectedStopId?: string | null
  onSelectStop?: (stopId: string) => void
  className?: string
}

export function RouteMap({ stops, className }: RouteMapProps) {
  return (
    <div
      className={cn(
        'grid aspect-[4/3] place-items-center rounded-card border border-line bg-sand p-6 text-center',
        className,
      )}
    >
      <div>
        <MapIcon aria-hidden className="mx-auto size-7 text-muted-foreground" />
        <p className="mt-2 font-bold text-ink">Map coming soon</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {stops.length} {stops.length === 1 ? 'stop' : 'stops'} will show here with walking and T directions.
        </p>
      </div>
    </div>
  )
}
