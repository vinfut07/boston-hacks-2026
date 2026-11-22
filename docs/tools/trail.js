/**
 * breadcrumb dotted-trail renderer (no dependencies).
 *
 * trailSVG() returns SVG markup for a trail between evenly spaced stops, drawn
 * at the real pixel width so dots and rings keep the same size on any card.
 * Styling comes from components.css (.trail__path, .trail__ring, .trail__end).
 *
 * In the style guide: <div class="trail__line" data-trail data-stops="3"></div>
 * then mountTrails(). In React: measure the container with a ResizeObserver and
 * render trailSVG({ width }) (or port the path math into a component).
 */

const r1 = (n) => Math.round(n * 10) / 10;

/**
 * @param {object} o
 * @param {number} o.width   container width in px
 * @param {number} [o.height=40]
 * @param {number} [o.stops=3]  number of stops (2 or more)
 * @param {"open"|"done"} [o.state="open"]  done = green line, filled ends only
 * @param {number} [o.seed=0]  changes the wave so cards in a feed don't match
 */
export function trailSVG({ width, height = 40, stops = 3, state = "open", seed = 0 } = {}) {
  const n = Math.max(2, Math.round(stops));
  const ring = 7.5;
  const pad = ring + 2;
  const mid = height / 2;
  const xs = Array.from({ length: n }, (_, i) => pad + (i * (width - 2 * pad)) / (n - 1));
  const ys = xs.map((_, i) => mid + Math.round(Math.sin((i + 1) * 2.1 + seed * 1.3) * 3));
  const amp = Math.min(9, mid - 4);

  let d = `M${r1(xs[0])} ${r1(ys[0])}`;
  for (let i = 0; i < n - 1; i++) {
    const dir = (i + seed) % 2 === 0 ? -1 : 1; // alternate humps and dips
    const dx = xs[i + 1] - xs[i];
    d += `C${r1(xs[i] + dx * 0.35)} ${r1(ys[i] + dir * amp)} ${r1(xs[i + 1] - dx * 0.35)} ${r1(ys[i + 1] + dir * amp)} ${r1(xs[i + 1])} ${r1(ys[i + 1])}`;
  }

  let marks = "";
  if (state === "done") {
    for (const i of [0, n - 1]) marks += `<circle class="trail__end" cx="${r1(xs[i])}" cy="${r1(ys[i])}" r="${ring - 0.5}"/>`;
  } else {
    xs.forEach((x, i) => { marks += `<circle class="trail__ring" cx="${r1(x)}" cy="${r1(ys[i])}" r="${ring}"/>`; });
  }

  return `<svg class="trail__svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" aria-hidden="true" focusable="false">` +
    `<path class="trail__path" d="${d}"/>${marks}</svg>`;
}

/** Render every [data-trail] element under root, and redraw when its width changes. */
export function mountTrails(root = document) {
  const draw = (el) => {
    const width = Math.round(el.clientWidth);
    if (!width || el.dataset.drawnWidth === String(width)) return;
    el.dataset.drawnWidth = String(width);
    el.innerHTML = trailSVG({
      width,
      height: Number(el.dataset.height) || el.clientHeight || 40,
      stops: Number(el.dataset.stops) || 3,
      state: el.dataset.state || "open",
      seed: Number(el.dataset.seed) || 0,
    });
  };
  const els = root.querySelectorAll("[data-trail]");
  const observer = typeof ResizeObserver !== "undefined"
    ? new ResizeObserver((entries) => entries.forEach((e) => draw(e.target)))
    : null;
  els.forEach((el) => { draw(el); observer?.observe(el); });
}
