/**
 * Breadcrumb · Tailwind theme extension mirroring styles/tokens.css (v0.2).
 *
 * Tailwind v3: merge `theme.extend` (and the plugin) into tailwind.config.js.
 * Tailwind v4: load this file with `@config "./styles/tailwind.config.snippet.js";`
 *              in your main CSS.
 * Either way, also import styles/tokens.css, because every value here points at a
 * CSS variable so there is a single source of truth. (Opacity modifiers such as
 * bg-red/50 won't work on var() colors; use the -tint colors instead.)
 *
 * Usage examples:
 *   bg-line-rl text-on-color border-thin border-ink rounded-card shadow-sm
 *   font-display (Archivo Expanded caps)   eyebrow   panel
 */
const v = (name) => `var(--${name})`;

module.exports = {
  theme: {
    extend: {
      colors: {
        red: { DEFAULT: v("color-red"), tint: v("color-red-tint"), strong: v("color-red-strong") },
        green: { DEFAULT: v("color-green"), tint: v("color-green-tint"), strong: v("color-green-strong") },
        blue: { DEFAULT: v("color-blue"), tint: v("color-blue-tint"), strong: v("color-blue-strong") },
        yellow: { DEFAULT: v("color-yellow"), tint: v("color-yellow-tint"), strong: v("color-yellow-strong") },
        sky: { DEFAULT: v("color-sky"), tint: v("color-sky-tint"), strong: v("color-sky-strong") },
        orange: { DEFAULT: v("color-orange"), tint: v("color-orange-tint") },
        silver: v("color-silver"),
        purple: v("color-purple"),
        ink: v("color-ink"),
        paper: v("color-paper"),
        gray: {
          50: v("color-gray-50"),
          light: v("color-gray-light"),
          mid: v("color-gray-mid"),
          dark: v("color-gray-dark"),
        },
        line: {
          rl: v("line-rl"),
          gl: v("line-gl"),
          bl: v("line-bl"),
          ol: v("line-ol"),
          sl: v("line-sl"),
          cr: v("line-cr"),
        },
        mode: { bus: v("mode-bus"), walk: v("mode-walk"), bike: v("mode-bike") },
        // semantic
        surface: { DEFAULT: v("color-surface"), muted: v("color-surface-muted") },
        border: { DEFAULT: v("color-border"), subtle: v("color-border-subtle") },
        accent: v("color-accent"),
        link: v("color-link"),
        active: { DEFAULT: v("color-active"), bg: v("color-active-bg") },
        focus: v("color-focus"),
        muted: v("color-text-muted"),
        "on-color": v("color-text-on-color"),
      },
      fontFamily: {
        display: ["Archivo", "Arial Black", "sans-serif"],
        primary: ["Akshar", "Arial Narrow", "system-ui", "sans-serif"],
        body: ["Noto Sans", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
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
        "4xl": v("text-4xl"),
        "5xl": v("text-5xl"),
      },
      lineHeight: { tight: v("leading-tight"), snug: v("leading-snug"), normal: v("leading-normal") },
      letterSpacing: { display: v("tracking-display"), caps: v("tracking-caps") },
      spacing: {
        1: v("space-1"), 2: v("space-2"), 3: v("space-3"), 4: v("space-4"), 5: v("space-5"),
        6: v("space-6"), 8: v("space-8"), 10: v("space-10"), 12: v("space-12"),
        16: v("space-16"), 20: v("space-20"), 24: v("space-24"),
        gutter: v("gutter"),
      },
      maxWidth: { container: v("container-max") },
      borderRadius: {
        xs: v("radius-xs"),
        sm: v("radius-sm"),
        md: v("radius-md"),
        lg: v("radius-lg"),
        xl: v("radius-xl"),
        pill: v("radius-pill"),
        control: v("radius-control"),
        card: v("radius-card"),
        button: v("radius-button"),
      },
      borderWidth: {
        hairline: v("border-hairline"),
        thin: v("border-thin"),
        base: v("border-base"),
        line: v("border-line"),
        button: v("border-button"),
      },
      boxShadow: {
        xs: v("shadow-xs"),
        sm: v("shadow-sm"),
        md: v("shadow-md"),
        lg: v("shadow-lg"),
        focus: v("focus-ring"),
        "button-sm": v("shadow-button-sm"),
        button: v("shadow-button"),
        "button-hover": v("shadow-button-hover"),
      },
      rotate: { button: v("tilt-button") },
      transitionTimingFunction: { out: v("ease-out") },
      transitionDuration: { fast: v("duration-fast"), base: v("duration-base") },
    },
  },
  plugins: [
    // Same utilities as tokens.css
    function ({ addUtilities }) {
      addUtilities({
        ".font-display": {
          fontFamily: v("font-display"),
          fontStretch: v("font-display-stretch"),
          fontWeight: v("weight-bold"),
          letterSpacing: v("tracking-display"),
          textTransform: "uppercase",
        },
        ".eyebrow": {
          fontFamily: v("font-primary"),
          fontWeight: v("weight-semibold"),
          fontSize: v("text-sm"),
          letterSpacing: v("tracking-caps"),
          textTransform: "uppercase",
        },
        ".panel": {
          background: v("color-surface"),
          border: `${v("border-hairline")} solid ${v("color-border-subtle")}`,
          borderRadius: v("radius-card"),
          boxShadow: v("shadow-xs"),
        },
        ".outline-ink": {
          border: `${v("border-thin")} solid ${v("color-border")}`,
          borderRadius: v("radius-card"),
        },
        ".text-highlight": {
          background:
            "linear-gradient(transparent 58%, var(--color-yellow) 58%, var(--color-yellow) 90%, transparent 90%)",
          padding: "0 0.1em",
          boxDecorationBreak: "clone",
        },
      });
    },
  ],
};
