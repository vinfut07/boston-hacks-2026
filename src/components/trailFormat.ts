/**
 * Shared wording for trails: short category names, cost ("~$25" / "Free"),
 * length ("2.5 hr") and scheduled dates in Boston time ("Sun Nov 29, 11 AM").
 * Used by TrailCard and the Trail detail page so both say things the same way.
 */

import type { Category, TransitLine } from '@/types/db-values'

/** Short labels so the eyebrow fits on one line, as in the mockups ("Food · Sat 2:00 PM"). */
export const CATEGORY_LABELS: Record<Category, string> = {
  food_drink: 'Food',
  outdoors: 'Outdoors',
  arts_culture: 'Arts',
  shopping: 'Shopping',
  attractions: 'Sights',
  affordable: 'Budget',
}

/** "Sun Nov 29, 11 AM" (or "Sat Nov 28, 2:30 PM") in Boston time. */
const scheduleFormat = new Intl.DateTimeFormat('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
  timeZone: 'America/New_York',
})

export function formatSchedule(iso: string) {
  const parts = scheduleFormat.formatToParts(new Date(iso))
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? ''
  const minute = get('minute') === '00' ? '' : `:${get('minute')}`
  return `${get('weekday')} ${get('month')} ${get('day')}, ${get('hour')}${minute} ${get('dayPeriod')}`
}

/** 0 → "Free", 24.5 → "~$25". */
export function formatCost(cost: number) {
  return cost <= 0 ? 'Free' : `~$${Math.round(cost)}`
}

/** 45 → "45 min", 90 → "1.5 hr", 120 → "2 hr" (rounded to the half hour). */
export function formatMinutes(minutes: number) {
  if (minutes < 60) return `${minutes} min`
  const hours = Math.round(minutes / 30) / 2
  return `${hours} hr`
}

/** T line names and their MBTA color token (tokens.css). Commuter Rail has no token, so no dot. */
export const LINE_INFO: Record<TransitLine, { name: string; color: string | null }> = {
  rl: { name: 'Red Line', color: 'var(--line-red)' },
  ol: { name: 'Orange Line', color: 'var(--line-orange)' },
  gl: { name: 'Green Line', color: 'var(--line-green)' },
  bl: { name: 'Blue Line', color: 'var(--line-blue)' },
  sl: { name: 'Silver Line', color: 'var(--line-silver)' },
  cr: { name: 'Commuter Rail', color: null },
}

/** "Nov 9" in Boston time (review dates). */
export function formatShortDate(iso: string) {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', timeZone: 'America/New_York' }).format(
    new Date(iso),
  )
}
