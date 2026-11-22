/**
 * breadcrumb · Tailwind theme extension mirroring styles/tokens.css (v1.0, "Dotted trail").
 *
 * The app runs Tailwind v4 as an ES module, so this file uses `export default`.
 * Tailwind v4: load it with `@config "../docs/styles/tailwind.config.snippet.js";`
 *              (path relative to src/index.css), after `@import "tailwindcss";`.
 * Tailwind v3: merge `theme.extend` (and the plugin) into tailwind.config.js.
 * Either way, also import styles/tokens.css: every value here points at a CSS
 * variable so there is one source of truth. (Opacity modifiers such as
 * bg-crumb/50 won't work on var() colors; use the -tint colors instead.)
 *
 * Usage examples:
 *   bg-paper text-ink   bg-white border border-line rounded-card shadow-card
 *   text-crumb-strong font-semibold text-sm   (an eyebrow)
 *   font-heavy tracking-title text-3xl        (a page title)
 */
const v = (name) => `var(--${name})`;

export default {
  theme: {
    extend: {
      colors: {
        paper: v("color-paper"),
        white: v("color-white"),
        sand: v("color-sand"),
        ink: { DEFAULT: v("color-ink"), 2: v("color-ink-2") },
        muted: v("color-muted"),
        line: { DEFAULT: v("color-line"), strong: v("color-line-strong") },
        crumb: {
          DEFAULT: v("color-crumb"),
          strong: v("color-crumb-strong"),
          deep: v("color-crumb-deep"),
          tint: v("color-crumb-tint"),
          soft: v("color-crumb-soft"),
          pale: v("color-crumb-pale"),
        },
        blue: { DEFAULT: v("color-blue"), tint: v("color-blue-tint") },
        green: { DEFAULT: v("color-green"), tint: v("color-green-tint") },
        map: { land: v("map-land"), park: v("map-park"), water: v("map-water"), road: v("map-road"), label: v("map-label") },
        mbta: { red: v("line-red"), orange: v("line-orange"), green: v("line-green"), blue: v("line-blue"), silver: v("line-silver") },
        // semantic
        surface: { DEFAULT: v("color-surface"), sunken: v("color-surface-sunken") },
        accent: v("color-accent"),
        trail: v("color-trail"),
        anytime: v("color-anytime"),
        scheduled: v("color-scheduled"),
        done: v("color-done"),
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      fontSize: {
        "2xs": v("text-2xs"),
        xs: v("text-xs"),
        sm: v("text-sm"),
        base: v("text-base"),
        md: v("text-md"),
        lg: v("text-lg"),
        xl: v("text-xl"),
        "2xl": v("text-2xl"),
        "3xl": v("text-3xl"),
      },
      fontWeight: { heavy: v("weight-heavy") },
      lineHeight: { tight: v("leading-tight"), snug: v("leading-snug"), normal: v("leading-normal") },
      letterSpacing: { title: v("tracking-title"), tight: v("tracking-tight") },
      spacing: {
        1: v("space-1"), 2: v("space-2"), 3: v("space-3"), 4: v("space-4"), 5: v("space-5"),
        6: v("space-6"), 8: v("space-8"), 10: v("space-10"), 12: v("space-12"), 16: v("space-16"),
        gutter: v("gutter"),
        tabbar: v("tabbar-height"),
      },
      maxWidth: { container: v("container-max") },
      borderRadius: {
        sm: v("radius-sm"),
        md: v("radius-md"),
        card: v("radius-card"),
        sheet: v("radius-sheet"),
        pill: v("radius-pill"),
      },
      boxShadow: {
        card: v("shadow-card"),
        float: v("shadow-float"),
        sheet: v("shadow-sheet"),
        fab: v("shadow-fab"),
        focus: v("focus-ring"),
      },
      transitionTimingFunction: { out: v("ease-out") },
      transitionDuration: { fast: v("duration-fast"), base: v("duration-base") },
    },
  },
  plugins: [
    // Same utilities as tokens.css
    function ({ addUtilities }) {
      addUtilities({
        ".font-title": {
          fontFamily: v("font-sans"),
          fontWeight: v("weight-heavy"),
          letterSpacing: v("tracking-title"),
          lineHeight: v("leading-tight"),
        },
        ".eyebrow": {
          fontFamily: v("font-sans"),
          fontWeight: v("weight-semibold"),
          fontSize: v("text-sm"),
          lineHeight: v("leading-snug"),
          color: v("color-anytime"),
        },
        ".trail-dots": {
          // apply to an SVG <path>: round dots along the path
          fill: "none",
          stroke: v("color-trail"),
          strokeWidth: v("trail-dot"),
          strokeLinecap: "round",
          strokeDasharray: `0 ${v("trail-gap")}`,
        },
      });
    },
  ],
};
