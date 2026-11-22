# breadcrumb style guide (v1.0 · "Dotted trail")

The visual system for our BostonHacks 2026 app (track: *Bos(tons) of Eats and Streets*). Open **`style-guide.html`** to see everything live, including both core screens built from the real classes. The trail renderer is an ES module, so serve the folder instead of double-clicking the file:

```powershell
python -m http.server 5178 --directory docs
```

Then open http://localhost:5178/style-guide.html.

| File | What it is |
|---|---|
| `styles/tokens.css` | Every color, type size, radius, shadow and trail measurement as a CSS variable |
| `styles/components.css` | Component classes (cards, trail, tabs, tab bar, sheet, stop list, buttons) |
| `styles/tailwind.config.snippet.js` | The same tokens for Tailwind v4 (`@config`) or v3 |
| `styles/map-style.json` | Warm, quiet Google Maps style |
| `tools/trail.js` | Draws the dotted trail on cards (`trailSVG`, `mountTrails`) |
| `tools/build_assets.py` | Regenerates `assets/svg/` |
| `mockups/` | Mobile and web screen mockups in this style (see `mockups/README.md`) |
| `archive/boston-bound/` | The previous system (T vehicles, Bluebikes, line pills), kept for reference. `mockup.html` still uses it |

> **Naming.** The app is **Breadcrumb**. These mockups call an outing a **trail** and a checklist item a **crumb**. The PRD still calls them a *sidequest* and a *checkpoint*. They map one to one: trail = sidequest, stop = `sidequest_stops`, crumb = `quest_checkpoints`, Start trail = Start quest.

## Direction

Every outing is a **trail**: stops joined by a dotted line, with small tasks called **crumbs** along the way. The look is calm and editorial:

- Warm paper background, white cards with hairline borders, near-black type.
- **One accent, crumb orange,** for trails, the primary action and orange labels.
- Blue and green appear only as **status**: scheduled and finished.
- Soft radii and low, warm shadows. Nothing tilted, outlined thick or hard-shadowed.
- One type family (Inter). Hierarchy comes from size and weight, not color.

## 1. Color

### Core

| Token | Hex | Use | Text on it |
|---|---|---|---|
| `--color-paper` | `#F7F6F2` | App background, bottom sheets | Ink 16:1 |
| `--color-white` | `#FFFFFF` | Cards, tabs, buttons, tab bar | Ink 17.5:1 |
| `--color-ink` | `#1B1916` | Type, the selected filter tab, active tab bar item | White 17.5:1 |
| `--color-crumb-strong` | `#C2410C` | Orange text (eyebrows), primary button, + button | White 5.2:1 |
| `--color-crumb` | `#E8552D` | **Trail dots and rings only.** Never text (3.6:1) | — |
| `--color-blue` | `#1D4ED8` | Scheduled trails: "Sat 2:00 PM", "Going", "Join" | White 6.7:1 |
| `--color-green` | `#15803D` | Finished trails, done crumbs, done stops | White 5.0:1 |

### Text, lines, surfaces

| Token | Hex | Use |
|---|---|---|
| `--color-ink-2` | `#57534C` | Secondary text: stats on the sheet, subtitles (7.1:1 on paper) |
| `--color-muted` | `#736E66` | Meta: distance, head count, addresses, stop labels (4.7:1 on paper) |
| `--color-line` | `#E7E4DD` | Card borders, dividers, tab bar top edge |
| `--color-line-strong` | `#D6D2C8` | Unselected filter tab outline, inputs, secondary button |
| `--color-sand` | `#EFEDE6` | Map land, skeleton loaders, sunken fills |
| `--color-crumb-deep` | `#9A3412` | Hover and pressed state of orange buttons |

Tints (`--color-crumb-tint`, `--color-blue-tint`, `--color-green-tint`) are soft backgrounds for badges and selected rows, always with ink or the matching strong color as text. `--color-crumb-pale` and `--color-crumb-soft` exist for the logo's first two dots. Map colors: `--map-land`, `--map-park`, `--map-water`, `--map-road`, `--map-label`.

MBTA line colors (`--line-red`, `--line-orange`, `--line-green`, `--line-blue`, `--line-silver`) appear **only** as a 9 px dot beside a transit step (`.line-dot`), like "● Green Line, Arlington → Copley". Cards are never colored by line or category.

## 2. Typography

**Inter** (Google Fonts, variable weight 400–800). Sizes are CSS px on a 390 px-wide phone.

| Role | Token | Size / weight | Tracking |
|---|---|---|---|
| Page title ("Trails for you") | `--text-3xl` | 32 / 800 | −0.035em |
| Detail title | `--text-2xl` | 28 / 800 | −0.035em |
| Card title, wordmark | `--text-xl` | 21 / 700 | −0.02em |
| Stop name | `--text-lg` | 17 / 700 | 0 |
| Subtitle, button label | `--text-md` | 16 / 400, 700 | 0 |
| Body, stats, tabs, crumbs | `--text-base` | 15 / 400–600 | 0 |
| Eyebrow, meta, address | `--text-sm` | 13 / 600, 400 | 0 |
| Stop labels under a trail | `--text-xs` | 12 / 400 | 0 |
| Tab bar labels | `--text-2xs` | 11 / 500 (700 when active) | 0 |

- The **eyebrow** ("Cafés · Anytime") is the only colored text. Its color comes from the trail's status.
- Stats are written short and plain: `~$20 · 2 hr · 2 crumbs · ★ 4.6`. Use `~` for estimates, and "Free" when it costs nothing.

## 3. Shape, space, depth

- **Spacing:** 4 px base (`--space-1` … `--space-16`). Screen gutter is 16 px, cards are 12 px apart, and card padding is 16 × 18.
- **Radii:** `--radius-sm` 10 · `--radius-md` 14 · `--radius-card` 20 · `--radius-sheet` 24 (top corners) · `--radius-pill` for tabs, buttons and icon buttons.
- **Shadows:** `--shadow-card` (barely there, always with a hairline border) · `--shadow-float` (buttons over the map) · `--shadow-sheet` (bottom sheet) · `--shadow-fab` (the + button, the only raised element).
- **Focus:** a 3 px blue ring (`--focus-ring`) on every interactive element.

## 4. The dotted trail

The signature element. It's the same drawing everywhere a route appears: cards, the map, the stop list and dividers.

| Part | Spec |
|---|---|
| Dots | 3 px round dots every 8.5 px: `stroke-width: 3; stroke-linecap: round; stroke-dasharray: 0 8.5` in `--color-crumb` |
| Stop ring (cards) | r 7.5, white fill, 2.5 px `--color-crumb` stroke |
| Numbered ring (lists, map) | 28 px circle, 2.5 px orange border, number in 13 / 700 ink (`.num-ring`) |
| Path | Gentle alternating humps and dips between evenly spaced stops, ±9 px |
| Finished | Green path, filled green end points only, no middle rings |
| Vertical (stop list) | Dots between numbered rings, drawn with a radial-gradient background so they're round in every browser |

**On cards**, `tools/trail.js` draws the SVG at the container's real width, so dots and rings never stretch:

```html
<div class="trail" style="--stops:3">
  <div class="trail__line" data-trail data-stops="3" data-seed="0"></div>
  <div class="trail__labels"><span>Tatte</span><span>Public Garden</span><span>Newbury St</span></div>
</div>
<script type="module">import { mountTrails } from "./tools/trail.js"; mountTrails();</script>
```

`data-state="done"` gives the finished style. `data-seed` varies the wave so neighboring cards don't look identical. In React, copy `trailSVG` into `src/lib/trail.ts` and render it at a measured width:

```tsx
function Trail({ stops, state = "open", seed = 0 }: { stops: number; state?: "open" | "done"; seed?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)));
    ro.observe(ref.current!);
    return () => ro.disconnect();
  }, []);
  return <div ref={ref} className="trail__line"
    dangerouslySetInnerHTML={{ __html: width ? trailSVG({ width, stops, state, seed }) : "" }} />;
}
```

**On Google Maps**, draw the route as a dotted polyline: an invisible stroke plus a repeated circle symbol.

```js
new google.maps.Polyline({
  map, path,
  strokeOpacity: 0,
  icons: [{
    icon: { path: google.maps.SymbolPath.CIRCLE, scale: 1.6, fillColor: "#E8552D", fillOpacity: 1, strokeOpacity: 0 },
    offset: "0", repeat: "9px",
  }],
});
```

## 5. Components (`styles/components.css`)

| Class | What it is |
|---|---|
| `.app` | Screen base: Inter, paper background, ink text |
| `.brand` + `.brand__mark` | Logo mark (`logo-mark.svg`) + "breadcrumb" in 21 / 800 |
| `.app-bar` | Brand on the left, `.icon-btn` (search) on the right |
| `.icon-btn` | 44 px round white button with a hairline border. `--float` (no border, float shadow) goes over the map. `.is-on` fills a saved bookmark |
| `.page-head`, `.page-title`, `.page-sub` | "Trails for you" / "You've lived here. Have you explored it?" |
| `.tabs` > `.tab` | Filter pills. Selected (`.is-active` or `aria-selected="true"`) is solid ink. The row scrolls sideways |
| `.feed` | The card list: 12 px gaps, gutter padding |
| `.trail-card` | White card: `__head` (`__eyebrow` + `__meta`), `__title`, a `.trail`, and `__stats` with `__end` on the right |
| `.trail-card--scheduled` / `--done` | Blue eyebrow with a `.status-link` ("Going", "Join") / green eyebrow, `.trail--done`, no stats row |
| `.trail`, `.trail__line`, `.trail__labels` | The dotted trail (section 4). `--stops` sets the label columns |
| `.rating` | Filled Lucide `star` + number, e.g. `★ 4.6 (12)` |
| `.tabbar`, `__item`, `__fab` | Explore · Map · **+** · Saved · You. Active item is ink and bold. The + is a 54 px orange circle, raised 20 px |
| `.map-hero` + `__bar` | Top of the detail screen: the map, with floating back and save buttons |
| `.sheet`, `__title`, `__stats` | Paper bottom sheet that overlaps the map by 24 px |
| `.stops` > `.stop` | Numbered ring + `__name`, `__place`, `.crumb-item`, `__leg` (walk or transit step), with dots down to the next stop |
| `.num-ring` | Numbered stop. `--current` (orange fill, next stop during a run), `--done` (green with a check), `--map` (adds a float shadow for map markers) |
| `.crumb-item` | Orange bullet + "**Crumb:** find the Make Way for Ducklings statues". `.is-done` turns it green and muted |
| `.line-dot` | 9 px MBTA line-color dot. Set `--line: var(--line-green)` |
| `.btn` | 52 px orange pill (`--lg` 56, `--sm` 38, `--block` full width). Variants: `--secondary` (white, outlined), `--ink`, `--ghost`. Disabled is flat gray |
| `.action-bar` | Sticky bottom area for "Start trail", fading into paper |

**Rules for components**

- **One orange button per screen** ("Start trail", "Join"). Everything else is secondary, ink or ghost.
- **Card states:** Anytime (orange "Cafés · Anytime", distance, stop labels, rating) · Scheduled (blue "Food · Sat 2:00 PM", "6 going", Join/Going) · Finished (green "Finished · Nov 16", "You rated 5", green trail).
- Show stop labels under a card trail only when there are 3 or fewer stops. Otherwise show the count in the stats.

## 6. Screens

**For You (Explore tab):** status bar → app bar → page title + subtitle → filter tabs (For you · Nearby · Friends) → feed of trail cards → tab bar.

**Trail detail:** map hero (300 px, dotted route with numbered rings, floating back and save) → sheet: eyebrow ("Cafés · Anytime · Curated") → title → stats → stop list with crumbs and the walk or transit step between stops → sticky **Start trail**.

During a run, reuse the stop list: finished stops get `.is-done` + `.num-ring--done`, and the next stop gets `.num-ring--current`.

## 7. Google Maps (`styles/map-style.json`)

- Warm and quiet: sand land, pale green parks, pale blue water, off-white roads without outlines, muted labels. POIs, bus stops and road icons are hidden, and transit lines are a faint gray, so our orange trail is the only strong color.
- Usage: `new google.maps.Map(el, { styles: mapStyle, disableDefaultUI: true, zoomControl: true })`.
- JSON `styles` only apply **without** a `mapId`. Advanced Markers need a `mapId`, so if you use them, paste this JSON into the Cloud Console style editor instead. Marker content: `<span class="num-ring num-ring--map">1</span>`.
- Directions: `TRANSIT` (subway, train, tram, bus), `WALKING` and `BICYCLING` legs. Never `DRIVING`.

## 8. Icons

- **[Lucide](https://lucide.dev)** (ISC). Use `lucide-react` in the app. The style guide loads `lucide@0.460.0`.
- 2 px stroke, `currentColor`, 20 px in buttons, 22 px in the tab bar, 15 px inline.
- Core set: `compass` `map` `plus` `bookmark` `user` · `search` `chevron-left` `star` (filled) · `footprints` `train-front` `bike` · `check` `x` `user-plus` `share-2`.

## 9. Assets (`assets/svg/`)

| File | Use |
|---|---|
| `logo-mark.svg` | Three crumbs that grow and warm toward the end of the trail. Always next to the wordmark |
| `app-icon.svg` | Home-screen icon and favicon: the three crumbs climbing on orange |
| `stop-ring.svg`, `stop-done.svg`, `stop-number.svg` | Static stop markers (use `.num-ring` for live numbers) |
| `trail-divider.svg` | Section breaks and onboarding |
| `empty-trail.svg` | Empty states: a trail waiting for its next stop. Pair it with one heading, one sentence and one button |

Regenerate them from the repo root with `python docs/tools/build_assets.py docs/assets/svg`.

## 10. Do and don't

| Do | Don't |
|---|---|
| Draw every route as dots between rings | Draw solid lines or arrows for routes |
| Keep orange as the only accent | Color cards by category or T line |
| Use `--color-crumb-strong` for orange text | Set text in `--color-crumb` (dots and rings only) |
| Use blue only for scheduled and green only for finished | Use blue or green as decoration |
| Use soft shadows and hairline borders | Use hard offset shadows, tilts or thick outlines (the old Boston Bound look) |
| Keep one orange button per screen | Stack several orange buttons |
| Write plain, warm copy: "Start trail", "2 crumbs", "You rated 5" | Use gamer or quest jargon in the UI |
| Show transit with a small line-color dot | Use the MBTA "T" logo or official map art |

## 11. Attribution and licensing

- **Artwork:** every file in `assets/svg/` was drawn for this project.
- **Font:** Inter, from Google Fonts, under the SIL Open Font License 1.1.
- **Icons:** Lucide, ISC license (keep its notice if you bundle it).
- **Trademarks:** MBTA line names and colors only identify transit lines. We aren't affiliated with or endorsed by the MBTA. Place names (Tatte, Public Garden) are used descriptively.
- **Map data:** Google Maps requires its own attribution. Keep the default logo and copyright.
