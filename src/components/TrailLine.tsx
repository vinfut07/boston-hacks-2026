/**
 * The dotted trail drawing: a wavy dotted line between evenly spaced stop rings.
 * React port of docs/tools/trail.js (same path math), redrawn at the real pixel
 * width with a ResizeObserver so dots and rings stay the same size on any card.
 * Styled by .trail__line / .trail__path / .trail__ring in docs/styles/components.css.
 * Used by TrailCard; it's a decoration only, not a map or a route.
 */

import { useLayoutEffect, useRef, useState } from 'react'

const RING = 7.5
const round1 = (n: number) => Math.round(n * 10) / 10

type TrailLineProps = {
  /** Number of stops (rings). Values below 2 are drawn as 2. */
  stops: number
  /** done = green line with filled ends only (a finished trail). */
  state?: 'open' | 'done'
  /** Changes the wave so neighbouring cards don't look identical. */
  seed?: number
  height?: number
}

/** SVG path and ring positions for a trail of `stops` stops drawn `width` px wide. */
function trailGeometry(width: number, height: number, stops: number, seed: number) {
  const n = Math.max(2, Math.round(stops))
  const pad = RING + 2
  const mid = height / 2
  const xs = Array.from({ length: n }, (_, i) => pad + (i * (width - 2 * pad)) / (n - 1))
  const ys = xs.map((_, i) => mid + Math.round(Math.sin((i + 1) * 2.1 + seed * 1.3) * 3))
  const amp = Math.min(9, mid - 4)

  let d = `M${round1(xs[0])} ${round1(ys[0])}`
  for (let i = 0; i < n - 1; i++) {
    const dir = (i + seed) % 2 === 0 ? -1 : 1 // alternate humps and dips
    const dx = xs[i + 1] - xs[i]
    d +=
      `C${round1(xs[i] + dx * 0.35)} ${round1(ys[i] + dir * amp)} ` +
      `${round1(xs[i + 1] - dx * 0.35)} ${round1(ys[i + 1] + dir * amp)} ` +
      `${round1(xs[i + 1])} ${round1(ys[i + 1])}`
  }
  return { d, points: xs.map((x, i) => ({ x: round1(x), y: round1(ys[i]) })) }
}

export function TrailLine({ stops, state = 'open', seed = 0, height = 40 }: TrailLineProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useLayoutEffect(() => {
    const box = boxRef.current
    if (!box) return
    const measure = () => setWidth(Math.round(box.clientWidth))
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(box)
    return () => observer.disconnect()
  }, [])

  const geometry = width > 2 * RING ? trailGeometry(width, height, stops, seed) : null
  const ends = geometry ? [geometry.points[0], geometry.points[geometry.points.length - 1]] : []

  return (
    <div ref={boxRef} className="trail__line" style={{ height }}>
      {geometry ? (
        <svg
          className="trail__svg"
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          aria-hidden="true"
          focusable="false"
        >
          <path className="trail__path" d={geometry.d} />
          {state === 'done'
            ? ends.map((p, i) => <circle key={i} className="trail__end" cx={p.x} cy={p.y} r={RING - 0.5} />)
            : geometry.points.map((p, i) => <circle key={i} className="trail__ring" cx={p.x} cy={p.y} r={RING} />)}
        </svg>
      ) : null}
    </div>
  )
}
