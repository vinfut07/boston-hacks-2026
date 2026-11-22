"""breadcrumb SVG assets: logo mark, app icon, stop markers, trail divider,
empty-state illustration.

Usage (from the repo root): python docs/tools/build_assets.py docs/assets/svg
"""
import math
import os
import sys

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

PAPER = "#F7F6F2"
WHITE = "#FFFFFF"
INK = "#1B1916"
CRUMB = "#E8552D"
CRUMB_STRONG = "#C2410C"
CRUMB_SOFT = "#F08A69"
CRUMB_PALE = "#F7C2B1"
GREEN = "#15803D"
LAND, PARK, WATER, ROAD = "#EFEDE6", "#DDE8D3", "#D8E6F0", "#FBFAF7"
HEADER = '<!-- Original artwork - BostonHacks 2026 "breadcrumb" team. -->'
DOTS = 'fill="none" stroke-width="{w}" stroke-linecap="round" stroke-dasharray="0 {gap}"'


def n(v):
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s == "-0" else s


def write(name, w, h, title, body, vb=None):
    vb = vb or f"0 0 {n(w)} {n(h)}"
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{n(w)}" height="{n(h)}" role="img">\n'
         f"  {HEADER}\n  <title>{title}</title>\n  {body}\n</svg>\n")
    with open(os.path.join(OUT, name), "w", encoding="utf-8", newline="\n") as f:
        f.write(s)


def wave(points, amp, start_dir=-1):
    """Cubic path through points, alternating humps and dips (same math as trail.js)."""
    d = f"M{n(points[0][0])} {n(points[0][1])}"
    for i in range(len(points) - 1):
        (x0, y0), (x1, y1) = points[i], points[i + 1]
        s = start_dir if i % 2 == 0 else -start_dir
        dx = x1 - x0
        d += f"C{n(x0 + dx * .35)} {n(y0 + s * amp)} {n(x1 - dx * .35)} {n(y1 + s * amp)} {n(x1)} {n(y1)}"
    return d


def ring(x, y, r=7.5, w=2.5, color=CRUMB):
    return f'<circle cx="{n(x)}" cy="{n(y)}" r="{n(r)}" fill="{WHITE}" stroke="{color}" stroke-width="{n(w)}"/>'


# ---- logo mark: three crumbs, growing and warming toward the trail's end
write("logo-mark.svg", 34, 14, "breadcrumb logo mark",
      f'<circle cx="3.6" cy="7" r="2.6" fill="{CRUMB_PALE}"/>'
      f'<circle cx="13.4" cy="7" r="3.2" fill="{CRUMB_SOFT}"/>'
      f'<circle cx="26.6" cy="7" r="4.6" fill="{CRUMB}"/>')

# ---- app icon: the same three crumbs climbing on orange
write("app-icon.svg", 512, 512, "breadcrumb app icon",
      f'<rect width="512" height="512" rx="114" fill="{CRUMB_STRONG}"/>'
      f'<circle cx="146" cy="330" r="34" fill="{WHITE}" fill-opacity=".45"/>'
      f'<circle cx="240" cy="268" r="42" fill="{WHITE}" fill-opacity=".72"/>'
      f'<circle cx="360" cy="190" r="58" fill="{WHITE}"/>')

# ---- stop markers (static; numbered markers are HTML .num-ring)
write("stop-ring.svg", 24, 24, "Trail stop", ring(12, 12, 9, 3))
write("stop-done.svg", 24, 24, "Finished stop", f'<circle cx="12" cy="12" r="9.5" fill="{GREEN}"/>')
write("stop-number.svg", 32, 32, "Numbered trail stop (template)",
      ring(16, 16, 13.5, 3) +
      f'<text x="16" y="21" text-anchor="middle" font-family="Inter, system-ui, sans-serif" font-weight="700" font-size="14" fill="{INK}">1</text>')

# ---- trail divider: section breaks, onboarding
pts = [(12, 22), (210, 18), (400, 24), (590, 17), (788, 21)]
body = f'<path d="{wave(pts, 9)}" stroke="{CRUMB}" {DOTS.format(w=3, gap=8.5)}/>'
for i in (0, 2, 4):
    body += ring(*pts[i])
write("trail-divider.svg", 800, 44, "Dotted trail divider", body)

# ---- empty state: a map tile with a trail that hasn't been finished yet
clip = '<clipPath id="bc-empty-tile"><rect width="240" height="160" rx="22"/></clipPath>'
tile = (f'<defs>{clip}</defs><g clip-path="url(#bc-empty-tile)">'
        f'<rect width="240" height="160" fill="{LAND}"/>'
        f'<circle cx="222" cy="6" r="62" fill="{WATER}"/>'
        f'<rect x="22" y="26" width="86" height="58" rx="16" fill="{PARK}"/>'
        f'<path d="M0 108H240M152 0V160" stroke="{ROAD}" stroke-width="9"/>'
        "</g>")
route = [(40, 128), (104, 64), (196, 114)]
tile += f'<path d="{wave(route, 12)}" stroke="{CRUMB}" {DOTS.format(w=3.2, gap=9)}/>'
tile += ring(*route[0], 9, 3) + ring(*route[1], 9, 3)
tile += (f'<circle cx="{route[2][0]}" cy="{route[2][1]}" r="11" fill="{WHITE}" stroke="{CRUMB}" stroke-width="2.5" stroke-dasharray="4 3.5"/>'
         f'<path d="M{route[2][0] - 4.5} {route[2][1]}H{route[2][0] + 4.5}M{route[2][0]} {route[2][1] - 4.5}V{route[2][1] + 4.5}" stroke="{CRUMB_STRONG}" stroke-width="2.4" stroke-linecap="round"/>')
write("empty-trail.svg", 240, 160, "A trail waiting for its next stop", tile)

print("wrote 7 breadcrumb SVGs to", OUT)
