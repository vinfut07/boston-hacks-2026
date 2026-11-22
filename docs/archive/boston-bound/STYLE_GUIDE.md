# Breadcrumb style guide (v0.2)

This is the visual foundation for **Breadcrumb**, our BostonHacks 2026 entry for the *Bos(tons) of Eats and Streets* track.

> **See it:** from the repo root, run `python -m http.server 5178 --directory docs`, then visit http://localhost:5178/style-guide.html. It shows every token, asset and component. All paths in this guide are relative to `docs/`.
>
> **Using it in the app:** the app runs Tailwind v4, so import `docs/styles/tokens.css` (and `components.css` if you want the ready-made classes) and add `@config "../docs/styles/tailwind.config.snippet.js";` to `src/index.css`, adjusting the path. Icons are already covered: the app ships `lucide-react`.

## Direction

v0.1 copied the organizers' "Boston Bound" look closely (hand-drawn marker doodles), and it read as too cartoony. v0.2 keeps the theme's DNA but draws it cleanly, like a well-made transit map. **Buttons are the one exception:** they keep the bold marker treatment (thick outline, hard shadow, uneven corners, slight tilt), so they're the playful accent on an otherwise calm screen.

| Kept from Boston Bound | Changed in v0.2 |
|---|---|
| Palette: Red Line red lead, line colors, ink + white | No wobbly or hand-drawn outlines: clean geometry, no SVG filters |
| Ink + white as the base | Plain white background: the graph-paper grid is gone. 1.5 px ink rules instead of 4 px marker borders |
| Subway lines, station dots, transfer capsules | Soft, short shadows instead of hard offset ink shadows (except buttons) |
| Line pills (RL/GL/BL…) | Consistent radii (8 px controls, 12 px cards) instead of uneven corners (except buttons) |
| The bold marker button: 4 px outline, hard shadow, tilt | Used on buttons only |
| Track-card layout: colored top, gray bottom, vehicle + status label | Archivo Expanded instead of Unbounded for display type |
| Akshar as the primary UI face | No clouds, sparkles or squiggles. Landmarks became line illustrations for empty states only. The spiral-notebook nav became a plain tab bar. |

| File | What it is |
|---|---|
| `styles/tokens.css` | CSS variables plus utilities: `.font-display`, `.eyebrow`, `.panel`, `.outline-ink`, `.text-highlight` |
| `styles/components.css` | Card, button, pill, chip, rating input, nav tabs, map legend, route strip |
| `styles/tailwind.config.snippet.js` | Tailwind `theme.extend` + plugin that mirror the tokens (all values are `var(--…)`) |
| `styles/map-style.json` | Google Maps JS styling array |
| `assets/svg/` | 26 original SVGs |
| `style-guide.html` | Live preview page |

---

## 1. Color

Ink and white do most of the work. Line colors mark transit, and **each sidequest card takes the color of the main T line it rides.** Yellow is the rarest color on any screen.

### Core palette (from bostonhacks.org)

| Token | Hex | Use for | Text on it |
|---|---|---|---|
| `--color-red` | `#CE2634` | Primary accent: main button, RL cards, logo | White (5.3:1) |
| `--color-green` | `#0C6B14` | GL cards, "Start route", cost icon, success | White (6.7:1) |
| `--color-blue` | `#206DDF` | BL cards, links, focus ring | White (4.9:1) |
| `--color-sky` | `#2F9DD9` | Map water, bike legs, illustration accents | Ink only |
| `--color-yellow` | `#F7DD04` | Rating stars, checkpoints, one highlight per screen | Ink only |
| `--color-ink` | `#000000` | Text, card and control borders, map markers | White |
| `--color-gray-light` | `#D9D9D9` | Hairlines: panel, chip and divider borders | Ink |
| `--color-gray-mid` | `#868686` | Disabled text and placeholders only | — |
| `--color-paper` | `#FFFFFF` | Page and card background | Ink |

### Extended and neutrals (ours)

| Token | Hex | Use for |
|---|---|---|
| `--color-orange` | `#ED8B00` | OL cards and pills. **Ink text only** (white is 2.5). |
| `--color-silver` | `#7C878E` | SL cards. White text at large or bold sizes only (3.7). |
| `--color-purple` | `#80276C` | Commuter Rail (optional). |
| `--color-gray-50` | `#F4F5F6` | Muted surfaces: card bottoms, hover fills. |
| `--color-gray-dark` | `#4A4A4A` | Muted text (`--color-text-muted`, 8.9:1). |

- **Tints** (`--color-{red,green,blue,sky,yellow,orange}-tint`) are backgrounds, always with ink text.
- **Strong shades** (`--color-{red,green,blue,yellow}-strong`) are for hover and pressed fills. `--color-blue-strong` on `--color-blue-tint` is the active-nav pair (5.2:1). `--color-sky-strong` (`#17699A`) is for bike icons and text on white or sky tint (5.1:1), since sky itself is too light to carry text.
- **Line and mode tokens:** `--line-rl` `--line-gl` `--line-bl` `--line-ol` `--line-sl` `--line-cr` · `--mode-bus` (yellow) · `--mode-walk` (ink, dotted) · `--mode-bike` (sky, dashed).

### Rules
- Use white text on Red, Green, Blue, Silver, Purple and Ink. Use ink on Orange, Yellow, Sky, grays and tints.
- Inline links use `--color-link`. Sky blue never carries text.
- Card tops are one flat line color. Show extra lines as pills, not as gradients.
- Light theme only for now.

## 2. Typography

| Role | Font | How | Use |
|---|---|---|---|
| Display | **Archivo Expanded** 700, all caps | `.font-display`, or `font-family: var(--font-display); font-stretch: var(--font-display-stretch)` | Card titles, page and section titles. Five words or fewer. |
| Primary | **Akshar** 600/700 | `--font-primary` | Headings, buttons, nav, chips, pills, labels. This is the workhorse. |
| Body | **Noto Sans** 400 | `--font-body` | Descriptions, reviews, anything longer than a sentence |

- Scale: `--text-2xs` 11 · `xs` 12 · `sm` 14 · `base` 16 · `md` 18 · `lg` 20 · `xl` 24 · `2xl` 30 · `3xl` 36 · `4xl` 48 · `5xl` 64.
- Leading: tight 1.1 (display), snug 1.25 (headings), normal 1.55 (body).
- Small uppercase labels (`.eyebrow`): Akshar 600, 14 px, 0.08em tracking.
- Fonts load via the `@import` at the top of `tokens.css`. Archivo is requested with its width axis (100–125%), so `font-stretch: 125%` gives the expanded cut.

## 3. Spacing, shape, depth

- **Spacing** (4 px base): `--space-1` 4 · `2` 8 · `3` 12 · `4` 16 · `5` 20 · `6` 24 · `8` 32 · `10` 40 · `12` 48 · `16` 64 · `20` 80 · `24` 96. The phone side gutter is `--gutter` (16).
- **Radii**: `xs` 4 · `sm` 6 · `md` 8 (`--radius-control`) · `lg` 12 (`--radius-card`) · `xl` 16 · `pill`. Buttons use `--radius-button`, which gives each corner a different curve.
- **Borders**:
  - `--border-hairline` 1 px gray: panels, chips, dividers
  - `--border-thin` 1.5 px ink: cards, buttons, inputs
  - `--border-base` 2 px: selected and emphasis states
  - `--border-line` 6 px: subway-line strokes in the UI
  - `--border-button` 4 px ink: buttons only (3 px on `--sm`)
- **Shadows**: `--shadow-xs` for resting cards, `--shadow-sm` for the map and menus, `--shadow-md` for hover and overlays, `--shadow-lg` for sheets and dialogs. `--focus-ring` is a 3 px translucent blue ring. **Buttons only:** `--shadow-button` (5/5 hard ink), `--shadow-button-hover` (6/7), `--shadow-button-sm` (3/3), and `--tilt-button` (−2°).
- **Motion**: `--ease-out`, `--duration-fast` 120 ms, `--duration-base` 200 ms. Hover lifts at most 2 px. Only buttons tilt. Motion is turned off under `prefers-reduced-motion`.

### Utilities
- `.panel`: white, hairline border, card radius, xs shadow.
- `.outline-ink`: a 1.5 px ink rule at card radius, for the printed-map look on featured blocks.
- `.font-display`, `.eyebrow`, and `.text-highlight` (a yellow stripe behind one or two words).

## 4. Components (`styles/components.css`)

### Sidequest card (`.sq-card`)
This is the organizers' track-card layout, drawn cleanly:
- **Top half**: the line color (`.sq-card--rl|gl|bl|ol|sl`), a white line pill and the day/time, and the title in Archivo Expanded caps. Orange cards switch to ink text automatically.
- **Bottom half**: gray 50, separated by a 1.5 px ink rule. It holds a **status label** (Akshar caps) next to the matching vehicle drawing (`vehicle-*.svg` at `--vehicle-scale: 0.28`), a short description in Noto Sans, and the three rating chips.
- **Status vocabulary**: `OUTBOUND` = open to join · `BOARDING` = you signed up · `INBOUND` = completed · `LAYOVER` = saved for later.
- The whole card is one `<a>`. Hover lifts it 2 px with a medium shadow, and focus shows the blue ring.

```html
<a class="sq-card sq-card--rl" href="/q/123">
  <div class="sq-card__top">
    <div class="sq-card__meta"><span class="pill pill--rl">RL</span><span>Sun · 10:00 AM</span></div>
    <h3 class="sq-card__title">Sunday Café Hop</h3>
  </div>
  <div class="sq-card__bottom">
    <p class="sq-card__label"><img class="vehicle vehicle--rl" src="/assets/svg/vehicle-rl.svg" alt="">Outbound <small>· 3 stops</small></p>
    <p class="sq-card__desc">Matcha in Harvard Sq, pastries in Central, then a Kendall rooftop.</p>
    <ul class="chips">…rating chips…</ul>
  </div>
</a>
```

### Vehicles (`.vehicle`)
Each line has a side-view drawing of the vehicle actually running on it today. All five share one scale (about 3.25 units per foot), so the `.vehicle--rl|ol|bl|gl|sl` classes keep them true to size relative to each other. Change `--vehicle-scale` to resize them together (the card label uses 0.28, the style guide lineup uses 1.75). `.vehicle--bike` and `.vehicle--ebike` put the Bluebikes drawings on the same scale (about 21 px wide at scale 1), which is only useful next to the trains; see Bluebikes below for sizing them on their own.

| Line | Vehicle drawn | What makes it recognizable |
|---|---|---|
| Red | CRRC #4 (1900-series), 69 ft 9 in | Stainless body, broad red lower band, red cab end, 4 double doors per side |
| Orange | CRRC #14 (1400-series), 65 ft | Same family as the Red Line car, with an orange band and cab end, 3 double doors per side |
| Blue | Siemens 0700-series, 48 ft | Short car, white body with a blue band, 2 double doors per side, pantograph for the overhead wire north of Airport |
| Green | Kinki Sharyo Type 7 LRV, 74 ft | Two sections on a bellows, green below and white above, pantograph, folding doors, 3 trucks |
| Silver | 60 ft articulated hybrid bus (New Flyer) | It's a bus: silver paint, dark window band, accordion joint, 3 doors |

Sources: the Wikipedia articles on each line and on the Type 7, plus Wikimedia Commons photos (2025–26) used only as drawing references. Red Line note: most Red Line trains are still the older Bombardier 1800-series (similar stainless body with a red band). We drew the CRRC car because it is replacing them.

### Buttons (`.btn`)
Buttons are the bold accent of the system: a 4 px ink outline, a hard 5 px ink shadow, uneven corners (`--radius-button`) and a −2° tilt. Nothing else gets this treatment.
- Variants: `--primary` (red, **one per screen**), default (white), `--go` (green: start a route), `--highlight` (yellow: rate), `--ghost` (no outline, shadow or tilt), `--icon` (round, 48 px), and `--straight` (no tilt, for dense forms and toolbars).
- Sizes: `--sm` 38 px (3 px outline, 3 px shadow), default 48 px, `--lg` 58 px. Labels are Akshar 700 caps.
- States: hover lifts the button, grows the shadow and darkens the fill (`-strong` colors). Pressing pushes it into its shadow. Focus shows a 3 px blue outline. Disabled is flat gray with no shadow or tilt.

### Line and mode pills (`.pill`)
- `.pill--rl|gl|bl|ol|sl|cr` for T lines. `.pill--bus|walk|bike` for modes, with a Lucide icon inside.
- Pills are solid with no outline. Inside a colored card top they flip to white with ink text.
- Static SVG versions live in `assets/svg/pill-*.svg`.

### Rating chips (`.chip`), read-only
Chips are neutral (white, hairline border), and the icon carries the color:
- **Cost** `.chip--cost`: green `wallet`, `$`–`$$$`, unused signs grayed out with `.chip__off`.
- **Travel time** `.chip--time`: blue `clock`, door-to-door minutes.
- **Fun factor** `.chip--fun`: a yellow-filled `star`, average out of 5 to one decimal.

### Rate a sidequest (`.rate`), input
Each group is a `<fieldset>` with a visually hidden `<legend>`, built from radio inputs:
- **Cost**: a segmented control, `$ / $$ / $$$`. The selected segment fills green.
- **Travel**: a segmented control, `<15 / 15–30 / 30–45 / 45+`. The selected segment fills blue.
- **Fun**: five stars. Every star up to the chosen one fills yellow (CSS `:has()`).

On phones, each label stacks above its options.

### Nav tabs (`.nav-tabs`)
A white bar with a 1.5 px ink rule. Items are Akshar caps with a Lucide icon. The **active item turns blue**: `--color-active` text on `--color-active-bg`, set with `.is-active` or `aria-current="page"`. Below 640 px it becomes an icon-over-label tab bar; dock it to the bottom in the app. App tabs: For You · Map · Create · Saved · Profile.

### Map route legend (`.map-legend`)
| Swatch | Meaning | How to draw it on the map |
|---|---|---|
| Line color + white station dot | Subway line | Polyline `strokeWeight: 6` in the line color over an ink polyline `strokeWeight: 9` |
| Yellow with an ink edge | Bus | Yellow `strokeWeight: 5` over ink `strokeWeight: 8` |
| Ink dots | Walk | `strokeOpacity: 0` plus a repeating circle symbol (`icons`, `repeat: '10px'`) |
| Sky dashes | Bike / Bluebikes | Dashed symbol in `--mode-bike` |
| Sky pin with a bike | Bluebikes station | `marker-bike.svg` (`marker-ebike.svg` when e-bikes are available), or `.bike-pin` when zoomed in |
| Numbered white circle | Sidequest stop | HTML marker: 22–28 px circle, 2.5 px ink border, Akshar bold number (or `marker-stop.svg`) |
| Yellow diamond | Checkpoint | `marker-checkpoint.svg` |

### Itinerary route strip (`.route-strip`)
The detail view drawn as a vertical subway line:
- `li.stop` items get a numbered station dot.
- `li.leg` items get a 6 px colored segment: `.leg--walk` (dotted), `.leg--bike` (dashed), `.leg--bus`, `.leg--rl|gl|bl|ol|sl`.
- Put checkpoints inside a stop as `.checkpoint` with `marker-checkpoint.svg`.

### Bluebikes
Boston's bike share. Write the name as one word, "Bluebikes". The drawings follow 2024–26 photos of Boston stations.

| Asset | What's drawn | Use for |
|---|---|---|
| `vehicle-bike.svg` | **Classic** pedal bike: sky frame with a low curved main tube, white rear panel with a sky band and red tail light, black chain case, front carrier with a white plate (the part that locks into the dock) | Bike legs, station sheets, onboarding |
| `vehicle-ebike.svg` | **E-bike** (pedal assist, in service since Dec 2023): white frame, thick battery down tube, gray tub basket with a navy front plate, sky rear panel, handlebar display | Wherever e-bikes are called out |
| `bike-station.svg` | Two-sided map board, solar-topped kiosk, and a double-sided dock with a classic docked from one side and an e-bike from the other | Station sheet header, "no bikes nearby" empty state |
| `marker-bike.svg` / `marker-ebike.svg` | Sky map pin with a bike glyph; the e-bike version adds a yellow bolt badge, matching the bolt Bluebikes uses for e-bike stations | Stations on the map when zoomed out |
| `pill-bike.svg` | Static version of `.pill--bike` | Places where HTML pills can't go |
| `divider-bike.svg` | Dashed sky route with square dock stops (T stations are round) | Section breaks on bike-heavy screens |

- **Sizing:** the bike files are drawn at 20 units per foot (127 × 68), so set their width directly, e.g. `width: 160px` on a sheet or `width: 48px` inline. Use `.vehicle--bike` / `.vehicle--ebike` only in a lineup with the trains.
- **No logos:** the rear panels, front plate and basket plate stay blank. Don't add the Bluebikes wordmark or the sponsor's logo.
- **Station sheet (`.bike-avail`):** three count tiles: classic bikes, e-bikes, open docks. Get them from the Bluebikes GBFS `station_status` feed (`num_bikes_available`, `vehicle_types_available`, `num_docks_available`). Add `.is-zero` to gray out a 0. Always show open docks, because riders need one at the end of the trip. Icons: Lucide `bike`, `zap` (yellow fill), `circle-parking`.
- **Map pin (`.bike-pin`):** an HTML marker (AdvancedMarkerElement content) for zoomed-in maps: sky bike icon, bike count, and then a bolt with the e-bike count. `.bike-pin--empty` grays it out. The tip hangs 9 px below the box, so offset the marker by 9 px. Zoomed out, switch to `marker-bike.svg` / `marker-ebike.svg`.
- **Routes:** a Bluebikes leg is the dashed sky line (`.leg--bike`, `--mode-bike`). Mark the pickup and drop-off stations with the bike marker.
- Regenerate all of these from the repo root with `python docs/tools/build_bikes.py docs/assets/svg`.

### Empty state
This is the one place illustrations appear: a centered line illustration (`skyline.svg`, `citgo.svg`, `lobster.svg`), an Akshar heading, one sentence and one primary button.

## 5. Google Maps (`styles/map-style.json`)
- The base map is muted: pale gray land, white roads, mid-gray labels. Most POIs are hidden. Parks are green tint, water is light sky blue, and transit lines and rail stations stay in ink so they stand out.
- Usage: `new google.maps.Map(el, { styles: mapStyle, disableDefaultUI: true, zoomControl: true })`.
- **Note:** JSON `styles` only apply when no `mapId` is set. If you switch to cloud-based styling (a Map ID, which Advanced Markers require), paste this JSON into the Cloud Console style editor's JSON import instead.
- Draw our route with our own polylines (spec above) rather than relying on `TransitLayer` colors.
- Directions: `travelMode: TRANSIT` with `transitOptions.modes: ['SUBWAY','TRAIN','TRAM','BUS']`, plus `WALKING` / `BICYCLING` legs. Never `DRIVING`.

## 6. Iconography
- **UI icons: [Lucide](https://lucide.dev)** (ISC license). The preview loads `lucide@0.460.0` from jsDelivr. In the app, use `lucide-react` or `lucide` from npm.
- Use a 2–2.25 stroke width and `currentColor`. Size icons at 16–18 px inline, 22 px in the mobile tab bar.
- Core set: `house` `map` `circle-plus` `bookmark` `user` · `wallet` `clock` `star` · `bus` `footprints` `bike` `zap` `circle-parking` `train-front` `navigation` · `share-2` `user-plus` `check` `x`.
- Illustrations come from `assets/svg/`, never from Lucide.

## 7. Assets (`assets/svg/`)

| Group | Files |
|---|---|
| Line pills | `pill-rl.svg`, `pill-gl.svg`, `pill-bl.svg`, `pill-ol.svg`, `pill-sl.svg` |
| Lines & stations | `divider-red.svg`, `divider-green.svg`, `divider-blue.svg`, `divider-orange.svg`, `divider-bundle.svg`, `line-corner.svg`, `station-dot.svg`, `station-dot-ink.svg`, `station-transfer.svg` |
| Map markers | `marker-stop.svg`, `marker-checkpoint.svg`, `marker-bike.svg`, `marker-ebike.svg` |
| Vehicles (one shared scale) | `vehicle-rl.svg`, `vehicle-ol.svg`, `vehicle-bl.svg`, `vehicle-gl.svg`, `vehicle-sl.svg` (regenerate from the repo root with `python docs/tools/build_vehicles.py docs/assets/svg`) |
| Bluebikes | `vehicle-bike.svg`, `vehicle-ebike.svg`, `bike-station.svg`, `pill-bike.svg`, `divider-bike.svg` (regenerate with `python docs/tools/build_bikes.py docs/assets/svg`) |
| Illustrations (empty states only) | `skyline.svg` (Custom House, Hancock, Pru, State House, Zakim), `citgo.svg` (Kenmore Square sign), `lobster.svg` |
| Brand | `logo-mark.svg` (app icon / favicon), `logo-wordmark.svg` |

- All files are clean vector with no filters. Letters in the pills and wordmark are drawn as strokes, so the files don't depend on fonts.
- Decorative use: `<img src="…" alt="" aria-hidden="true">`. Logos and pills carry real alt text.
- Removed in v0.2: `frame-wobbly`, `highlight-swipe`, `spiral-ring`, `squiggle`, `cloud`, `cloud-ink`, `sparkle`, `graph-paper`.

## 8. Do and don't

| Do | Don't |
|---|---|
| Make buttons bold: 4 px outline, hard shadow, uneven corners, slight tilt | Use flat, outline-free buttons that blend into the cards |
| Keep cards, chips, panels and nav clean: thin rules, soft shadows | Put hard shadows or tilts on anything but buttons |
| Use white text on Red, Green, Blue and Silver; ink on Orange, Yellow and Sky | Put white text on yellow, orange or sky blue |
| Give each card top one flat line color | Use gradients or rainbow fills |
| Keep backgrounds plain white | Add grids, textures or colored page fills |
| Use one illustration per empty state | Scatter doodles or illustrations around content |
| Use Archivo Expanded for short all-caps titles | Set paragraphs or buttons in it |
| Draw our own trains, lines and landmarks | Use the MBTA "T" logo, official map art, or the organizers' images, logo or illustrations |
| Draw Bluebikes with blank panels | Add the Bluebikes wordmark or the sponsor's logo to a bike or station |

## 9. Attribution and licensing

- **Artwork**: every file in `assets/svg/` was drawn for this project and is not traced from or copied from bostonhacks.org. Only the organizers' palette and general motifs are referenced.
- **Fonts**: Akshar, Archivo and Noto Sans come from Google Fonts under the **SIL Open Font License 1.1**.
- **Presicav (Typodermic)**: *not used.* It's a commercial family. Typodermic's free desktop licenses don't include web embedding, and live website text needs a paid webfont license (sold through MyFonts). **Archivo Expanded 700** is the free substitute: a wide, all-caps grotesque in the same spirit. If the team buys a Presicav webfont license, swap the first entry of `--font-display` and set `--font-display-stretch: normal`.
- **Icons**: Lucide, **ISC license** (keep its license notice if you bundle it).
- **Trademarks**: the Kenmore Square sign illustration (`citgo.svg`) shows the CITGO name and trimark, which are CITGO Petroleum's trademarks. Use it only as a landmark illustration, never as our logo or in a way that suggests endorsement. MBTA line names and colors identify transit lines. Breadcrumb isn't affiliated with or endorsed by the MBTA. Don't use the MBTA "T" logo. "Bluebikes" is used only to name the bike-share service; Breadcrumb isn't affiliated with Bluebikes, Lyft or the system's sponsor, and the bike drawings carry none of their logos.
- **Map data**: Google Maps requires its own attribution on the map. Keep the default logo and copyright.
