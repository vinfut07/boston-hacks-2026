/**
 * "Add a place" search box for Make a trail. Filters the curated place library
 * as you type (name, neighborhood or address) and also offers to add what you
 * typed as a custom place. Keyboard: ↑/↓ to move, Enter to pick, Esc to close.
 */

import { useId, useMemo, useState } from 'react'
import { MapPin, Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Place } from './api'

type PlacePickerProps = {
  places: Place[]
  /** Library places already on the trail, so they aren't offered twice. */
  usedPlaceIds: Set<string>
  onPickPlace: (place: Place) => void
  onAddCustom: (name: string) => void
  disabled?: boolean
}

type Option = { kind: 'place'; place: Place } | { kind: 'custom'; name: string }

export function PlacePicker({ places, usedPlaceIds, onPickPlace, onAddCustom, disabled }: PlacePickerProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const listId = useId()

  const options = useMemo<Option[]>(() => {
    const q = query.trim().toLowerCase()
    const matches = places
      .filter((p) => !usedPlaceIds.has(p.id))
      .filter((p) => !q || [p.name, p.neighborhood, p.address].some((v) => v?.toLowerCase().includes(q)))
      .slice(0, 6)
      .map<Option>((place) => ({ kind: 'place', place }))
    const exact = places.some((p) => p.name.toLowerCase() === q)
    return q && !exact ? [...matches, { kind: 'custom', name: query.trim() }] : matches
  }, [places, usedPlaceIds, query])

  function choose(option: Option) {
    if (option.kind === 'place') onPickPlace(option.place)
    else onAddCustom(option.name)
    setQuery('')
    setOpen(false)
    setActive(0)
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setOpen(true)
      setActive((i) => Math.min(i + 1, options.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (event.key === 'Enter' && open && options[active]) {
      event.preventDefault()
      choose(options[active])
    } else if (event.key === 'Escape') {
      setOpen(false)
    }
  }

  const showList = open && !disabled && options.length > 0

  return (
    <div className="relative">
      <label className="flex h-11 items-center gap-2 rounded-pill border border-line-strong bg-white px-4 focus-within:shadow-[var(--focus-ring)]">
        <Search aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <span className="sr-only">Add a place</span>
        <input
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={showList ? `${listId}-${active}` : undefined}
          value={query}
          disabled={disabled}
          placeholder={disabled ? 'That’s the maximum number of stops' : 'Search a place, or type a name to add your own'}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
            setActive(0)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
        />
      </label>

      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-card border border-line bg-white py-1 shadow-[var(--shadow-float)]"
        >
          {options.map((option, i) => (
            <li
              key={option.kind === 'place' ? option.place.id : 'custom'}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(option)}
              onMouseEnter={() => setActive(i)}
              className={cn('flex cursor-pointer items-start gap-3 px-4 py-2.5', i === active && 'bg-paper')}
            >
              {option.kind === 'place' ? (
                <>
                  <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-crumb-strong" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{option.place.name}</span>
                    <span className="block truncate text-sm text-muted-foreground">
                      {[option.place.address, option.place.nearest_station].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </>
              ) : (
                <>
                  <Plus aria-hidden className="mt-0.5 size-4 shrink-0 text-crumb-strong" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">Add “{option.name}”</span>
                    <span className="block text-sm text-muted-foreground">As your own place (add the address after)</span>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}
