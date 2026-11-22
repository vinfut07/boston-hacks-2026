"""Bluebikes assets: side views of the classic bike and the e-bike, a station,
map markers, a mode pill and a divider.

References: Wikimedia Commons photos of Bluebikes stations (Lansdowne, May 2026;
Four Corners/Geneva, Oct 2026; "Bluebikes (54924730595).jpg") and the Dec 2023
e-bike launch coverage. No Bluebikes or sponsor logos: the panels stay blank.

Everything is drawn at 20 units per foot (26 in wheels, ground at y=76
for the bikes and y=150 for the station). CSS shows the bikes at the T-vehicle
scale with .vehicle--bike / .vehicle--ebike.
Usage (from the repo root): python docs/tools/build_bikes.py docs/assets/svg
"""
import math
import os
import sys

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

INK = "#000000"
SKY = "#2F9DD9"          # classic frame, e-bike rear panel (= --color-sky / --mode-bike)
WHITE = "#FFFFFF"
FRAME_WHITE = "#EEF0F2"  # e-bike frame
DARK = "#2A2E33"         # chain case, carrier, cranks
SADDLE = "#1F2327"
RIM = "#9AA2A9"
SPOKE = "#8D959C"
HUB = "#8D959C"
STEEL = "#C9CFD4"        # seatpost
FENDER = "#C7CDD2"       # e-bike fenders
BASKET = "#A7AEB4"       # e-bike tub basket
BASKET_DARK = "#868E95"
NAVY = "#1D2B4F"         # e-bike basket plate
RED = "#CE2634"
YELLOW = "#F7DD04"
GREEN = "#0C6B14"
LAMP = "#FFF4C2"
DOCK = "#8A939A"
DOCK_DARK = "#4E555C"
GLASS = "#283038"

HEADER = '<!-- Original artwork - BostonHacks 2026 "Breadcrumb" team.{} -->'
R_WHEEL = 21.5           # 26 in wheel at 20 units per foot


def n(v):
    """Compact number formatting."""
    s = f"{v:.2f}".rstrip("0").rstrip(".")
    return "0" if s == "-0" else s


def write(name, vb, title, body, note=""):
    x, y, w, h = vb
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{n(x)} {n(y)} {n(w)} {n(h)}" '
         f'width="{n(w)}" height="{n(h)}" role="img">\n'
         f"  {HEADER.format(note)}\n  <title>{title}</title>\n  {body}\n</svg>\n")
    with open(os.path.join(OUT, name), "w", encoding="utf-8", newline="\n") as f:
        f.write(s)


def pt(cx, cy, r, deg):
    """Point on a circle; degrees counter-clockwise from +x, screen y down."""
    a = math.radians(deg)
    return cx + r * math.cos(a), cy - r * math.sin(a)


def tubes(items, ink_w=0.9):
    """Outlined tubes. All ink strokes go first so joints merge cleanly."""
    ink = "".join(f'<path d="{d}" fill="none" stroke="{INK}" stroke-width="{n(w + 2 * ink_w)}" '
                  f'stroke-linecap="round" stroke-linejoin="round"/>' for d, w, c in items)
    fill = "".join(f'<path d="{d}" fill="none" stroke="{c}" stroke-width="{n(w)}" '
                   f'stroke-linecap="round" stroke-linejoin="round"/>' for d, w, c in items)
    return ink + fill


def wheel(cx, cy, r=R_WHEEL, spokes=16):
    d = ""
    for i in range(spokes):
        x1, y1 = pt(cx, cy, 2.2, i * 360 / spokes + 6)
        x2, y2 = pt(cx, cy, r - 3.7, i * 360 / spokes + 6 + 14)  # tangent-laced look
        d += f"M{n(x1)} {n(y1)}L{n(x2)} {n(y2)}"
    return (f'<path d="{d}" stroke="{SPOKE}" stroke-width=".4"/>'
            f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r - 3.3)}" fill="none" stroke="{RIM}" stroke-width="1.3"/>'
            f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r - 1.3)}" fill="none" stroke="{INK}" stroke-width="2.6"/>')


def hub(cx, cy, r=2.6):
    return f'<circle cx="{n(cx)}" cy="{n(cy)}" r="{n(r)}" fill="{HUB}" stroke="{INK}" stroke-width=".6"/>'


def rear_panel(cx, cy, a1, fill, band):
    """Skirt panel over the top of the rear wheel, from the seat stay back."""
    r = 24.6
    x1, y1 = pt(cx, cy, r, a1)
    x2, y2 = pt(cx, cy, r, 166)
    bx1, by1 = pt(cx, cy, 22.4, 100)
    bx2, by2 = pt(cx, cy, 22.4, 163)
    lx, ly = pt(cx, cy, 25.2, 157)
    return (f'<path d="M{n(cx)} {n(cy)}L{n(x1)} {n(y1)}A{r} {r} 0 0 0 {n(x2)} {n(y2)}Z" fill="{fill}"/>'
            f'<path d="M{n(bx1)} {n(by1)}A22.4 22.4 0 0 0 {n(bx2)} {n(by2)}" fill="none" stroke="{band}" stroke-width="2.6"/>'
            f'<path d="M{n(cx)} {n(cy)}L{n(x1)} {n(y1)}A{r} {r} 0 0 0 {n(x2)} {n(y2)}Z" fill="none" stroke="{INK}" stroke-width="1" stroke-linejoin="round"/>'
            f'<circle cx="{n(lx)}" cy="{n(ly)}" r="1.7" fill="{RED}" stroke="{INK}" stroke-width=".6"/>')


def chain_case(bb, rx, ry):
    bx, by = bb
    return (f'<path d="M{n(rx)} {n(ry - 3.2)}L{n(bx)} {n(by - 4.5)}A4.5 4.5 0 0 1 {n(bx)} {n(by + 4.5)}'
            f'L{n(rx)} {n(ry + 3.2)}A3.2 3.2 0 0 1 {n(rx)} {n(ry - 3.2)}Z" fill="{DARK}" stroke="{INK}" stroke-width=".6"/>'
            f'<circle cx="{n(bx)}" cy="{n(by)}" r="1.8" fill="{HUB}" stroke="{INK}" stroke-width=".5"/>')


def crank(bb, near=True):
    bx, by = bb
    ang = -58 if near else 122
    px, py = pt(bx, by, 11, ang)
    color = DARK if near else "#555B61"
    return (f'<path d="M{n(bx)} {n(by)}L{n(px)} {n(py)}" stroke="{INK}" stroke-width="2.6" stroke-linecap="round"/>'
            f'<path d="M{n(bx)} {n(by)}L{n(px)} {n(py)}" stroke="{color}" stroke-width="1.6" stroke-linecap="round"/>'
            f'<rect x="{n(px - 3)}" y="{n(py - 1.1)}" width="6" height="2.2" rx=".6" fill="{color}" stroke="{INK}" stroke-width=".5"/>')


def saddle(cx, top):
    x, y = cx - 7.7, top
    return (f'<path d="M{n(x)} {n(y + 2.4)}Q{n(x - .4)} {n(y + .1)} {n(x + 2.6)} {n(y)}L{n(x + 13.4)} {n(y + .4)}'
            f'Q{n(x + 16.4)} {n(y + .7)} {n(x + 16.3)} {n(y + 2.2)}Q{n(x + 16.2)} {n(y + 3.5)} {n(x + 13.8)} {n(y + 3.6)}'
            f'L{n(x + 2.6)} {n(y + 4.2)}Q{n(x + .3)} {n(y + 4.2)} {n(x)} {n(y + 2.4)}Z" fill="{SADDLE}" stroke="{INK}" stroke-width=".6"/>')


def handlebar(top, color):
    """Stem up the steering axis from the head tube, bars swept back to the grips."""
    hx, hy = top
    sx, sy = hx - 3.45, hy - 10.45
    return (tubes([(f"M{n(hx)} {n(hy)}L{n(sx)} {n(sy)}", 2.2, color),
                   (f"M{n(sx)} {n(sy)}Q{n(sx - .8)} {n(sy - 3)} {n(sx - 5)} {n(sy - 3.4)}L{n(sx - 8.6)} {n(sy - 3.4)}", 1.6, DARK)], .7)
            + f'<path d="M{n(sx - 8.4)} {n(sy - 3.4)}H{n(sx - 4.6)}" stroke="{INK}" stroke-width="2.8" stroke-linecap="round"/>'
            + f'<path d="M{n(sx - 3.6)} {n(sy - 2.8)}L{n(sx - 7.2)} {n(sy)}" stroke="{DARK}" stroke-width=".9" stroke-linecap="round"/>'), (sx, sy)


# ---------------------------------------------------------------- side views
AY = 76 - R_WHEEL          # axle height
ST_DIR = (math.cos(math.radians(110)), -math.sin(math.radians(110)))  # seat tube, up and back


def along(p, d, length):
    return p[0] + d[0] * length, p[1] + d[1] * length


def classic():
    rx, fx = 27, 103
    bb = (54, 57.5)
    st_top, post_top, stay_top = along(bb, ST_DIR, 30), along(bb, ST_DIR, 38.6), along(bb, ST_DIR, 22)
    ht_top, ht_bot = (91, 24.5), (94.6, 35.5)
    a1 = math.degrees(math.atan2(AY - stay_top[1], stay_top[0] - rx))
    fa, fb = pt(fx, AY, 24, 35), pt(fx, AY, 24, 145)
    bars, _ = handlebar(ht_top, SKY)
    body = (
        wheel(rx, AY) + wheel(fx, AY)
        + tubes([(f"M{n(fa[0])} {n(fa[1])}A24 24 0 0 0 {n(fb[0])} {n(fb[1])}", 2, SKY)], .7)
        + crank(bb, near=False)
        + rear_panel(rx, AY, a1, WHITE, SKY)
        + chain_case(bb, rx, AY)
        + tubes([
            (f"M{n(stay_top[0])} {n(stay_top[1])}L{rx} {n(AY)}", 1.8, SKY),
            (f"M{n(bb[0])} {n(bb[1])}L{n(st_top[0])} {n(st_top[1])}", 3.6, SKY),
            ("M92.6 30C84 35.5 66 45 55.5 56", 5.2, SKY),
            (f"M{n(ht_bot[0])} {n(ht_bot[1])}L98.4 46.5Q99.9 52.3 {fx} {n(AY)}", 2.6, SKY),
            (f"M{n(ht_top[0])} {n(ht_top[1])}L{n(ht_bot[0])} {n(ht_bot[1])}", 4.2, SKY),
        ])
        + tubes([(f"M{n(st_top[0])} {n(st_top[1])}L{n(post_top[0])} {n(post_top[1])}", 2, STEEL)], .6)
        + f'<circle cx="{n(st_top[0])}" cy="{n(st_top[1])}" r="1.6" fill="{DARK}" stroke="{INK}" stroke-width=".5"/>'
        + saddle(post_top[0], post_top[1] - 3.2)
        + hub(rx, AY, 3.1)
        # front carrier on the head tube: tray, back stop, white front plate with a sky band, lamp
        + f'<rect x="93" y="28" width="27" height="2.6" rx=".8" fill="{DARK}" stroke="{INK}" stroke-width=".6"/>'
        + f'<rect x="93" y="23.4" width="2.3" height="5.4" rx=".8" fill="{DARK}" stroke="{INK}" stroke-width=".6"/>'
        + f'<path d="M95 25.6L118.6 24.6" stroke="{DARK}" stroke-width=".8"/>'
        + f'<path d="M118.8 21.5Q119.2 19.6 121.4 19.8L123.2 20.1Q124.2 20.3 124.2 21.6L124.6 34Q124.6 35.6 123 35.6L120 35.6Q118.8 35.6 118.8 34.3Z" fill="{WHITE}"/>'
        + f'<path d="M118.8 30.6L124.44 30.3L124.6 34Q124.6 35.6 123 35.6L120 35.6Q118.8 35.6 118.8 34.3Z" fill="{SKY}"/>'
        + f'<path d="M118.8 21.5Q119.2 19.6 121.4 19.8L123.2 20.1Q124.2 20.3 124.2 21.6L124.6 34Q124.6 35.6 123 35.6L120 35.6Q118.8 35.6 118.8 34.3Z" fill="none" stroke="{INK}" stroke-width=".9"/>'
        + f'<rect x="124.3" y="24.6" width="1.6" height="3.2" rx=".6" fill="{LAMP}" stroke="{INK}" stroke-width=".5"/>'
        + hub(fx, AY, 2.8)
        + bars
        + crank(bb)
    )
    return body


def ebike():
    rx, fx = 27, 104
    bb = (56, 57)
    st_top, post_top, stay_top = along(bb, ST_DIR, 29), along(bb, ST_DIR, 37.6), along(bb, ST_DIR, 21)
    ht_top, ht_bot = (92, 24), (95.8, 35.5)
    a1 = math.degrees(math.atan2(AY - stay_top[1], stay_top[0] - rx))
    fa, fb = pt(fx, AY, 24, 35), pt(fx, AY, 24, 145)
    bars, (sx, sy) = handlebar(ht_top, FRAME_WHITE)
    body = (
        wheel(rx, AY) + wheel(fx, AY)
        + tubes([(f"M{n(fa[0])} {n(fa[1])}A24 24 0 0 0 {n(fb[0])} {n(fb[1])}", 2.2, FENDER)], .7)
        + crank(bb, near=False)
        + rear_panel(rx, AY, a1, SKY, WHITE)
        + chain_case(bb, rx, AY)
        + tubes([
            (f"M{n(stay_top[0])} {n(stay_top[1])}L{rx} {n(AY)}", 2, FRAME_WHITE),
            (f"M{n(bb[0])} {n(bb[1])}L{n(st_top[0])} {n(st_top[1])}", 4.2, FRAME_WHITE),
            ("M94 31L58.5 55.5", 7.4, FRAME_WHITE),          # battery down tube
            (f"M{n(ht_bot[0])} {n(ht_bot[1])}L99.6 46.8Q101.1 52.4 {fx} {n(AY)}", 3, FRAME_WHITE),
            (f"M{n(ht_top[0])} {n(ht_top[1])}L{n(ht_bot[0])} {n(ht_bot[1])}", 4.6, FRAME_WHITE),
        ])
        + f'<path d="M87.6 35.6L65 51.2" stroke="{SKY}" stroke-width="1.6" stroke-linecap="round"/>'
        + f'<rect x="60.6" y="50.4" width="4.2" height="2.6" rx=".6" transform="rotate(-34.6 62.7 51.7)" fill="{DARK}"/>'
        + tubes([(f"M{n(st_top[0])} {n(st_top[1])}L{n(post_top[0])} {n(post_top[1])}", 2, STEEL)], .6)
        + f'<circle cx="{n(st_top[0])}" cy="{n(st_top[1])}" r="1.6" fill="{DARK}" stroke="{INK}" stroke-width=".5"/>'
        + saddle(post_top[0], post_top[1] - 3.2)
        + hub(rx, AY, 3.1)
        # front tub basket on the head tube, navy plate on its front face, lamp
        + f'<path d="M94.3 18H121.4Q122.6 18 122.4 19.2L120.6 30Q120.4 31.2 119.2 31.2H97Q95.8 31.2 95.6 30L93.3 19.2Q93.2 18 94.3 18Z" fill="{BASKET}"/>'
        + f'<path d="M93.5 20.4H122.1" stroke="{BASKET_DARK}" stroke-width=".7"/>'
        + f'<path d="M99.2 23.8H115.8M99.8 27.2H115.2" stroke="{BASKET_DARK}" stroke-width="1.6" stroke-linecap="round"/>'
        + f'<path d="M119.9 20.6L122.2 20.4L120.6 30L118.5 30.1Z" fill="{NAVY}"/>'
        + f'<path d="M94.3 18H121.4Q122.6 18 122.4 19.2L120.6 30Q120.4 31.2 119.2 31.2H97Q95.8 31.2 95.6 30L93.3 19.2Q93.2 18 94.3 18Z" fill="none" stroke="{INK}" stroke-width=".9"/>'
        + f'<rect x="120.1" y="31.6" width="2.4" height="1.6" rx=".6" fill="{LAMP}" stroke="{INK}" stroke-width=".5"/>'
        + hub(fx, AY, 2.8)
        + bars
        + f'<rect x="{n(sx - 2.6)}" y="{n(sy - 1.6)}" width="4.8" height="3.2" rx=".8" transform="rotate(-12 {n(sx)} {n(sy)})" fill="#5B636B" stroke="{INK}" stroke-width=".5"/>'
        + crank(bb)
    )
    return body


# ---------------------------------------------------------------- station (side view)
G = 150  # station ground line


def dock_post(x0, top):
    """Dock post seen from the side: gray column, light cap, dark face, status light."""
    x1 = x0 + 10
    return (f'<path d="M{n(x0)} {n(G - 2.4)}V{n(top + 3)}Q{n(x0)} {n(top)} {n(x0 + 3)} {n(top)}H{n(x1 - 3)}'
            f'Q{n(x1)} {n(top)} {n(x1)} {n(top + 3)}V{n(G - 2.4)}Z" fill="{DOCK}" stroke="{INK}" stroke-width="1" stroke-linejoin="round"/>'
            f'<path d="M{n(x0 + 1.6)} {n(top + 2.4)}H{n(x1 - 1.6)}" stroke="#B5BCC2" stroke-width="1.6" stroke-linecap="round"/>'
            f'<rect x="{n(x0 + 2.6)}" y="{n(top + 9)}" width="4.8" height="26" rx="1.2" fill="{DOCK_DARK}"/>'
            f'<circle cx="{n(x0 + 5)}" cy="{n(top + 6)}" r="1.3" fill="{GREEN}" stroke="{INK}" stroke-width=".5"/>')


def station(classic_body, ebike_body):
    out = f'<path d="M0 {G}H358" stroke="{INK}" stroke-width="1.2"/>'
    # two-sided map board on legs
    out += (f'<path d="M14 {G}V118M52 {G}V118" stroke="{INK}" stroke-width="3.4"/>'
            f'<path d="M14 {G}V118M52 {G}V118" stroke="#5B636B" stroke-width="1.8"/>'
            f'<rect x="6" y="40" width="54" height="80" rx="2.5" fill="#5B636B" stroke="{INK}" stroke-width="1"/>'
            f'<rect x="9" y="43" width="48" height="74" rx="1" fill="{WHITE}"/>'
            f'<rect x="9" y="43" width="48" height="10" fill="{SKY}"/>'
            f'<g fill="none" stroke="{WHITE}" stroke-width="1.1"><circle cx="14" cy="49.6" r="2"/><circle cx="20" cy="49.6" r="2"/><path d="M14 49.6L16.4 46.6L18 49.6L20 46.2"/></g>'
            f'<path d="M25 46.6H44M25 50H37" stroke="{WHITE}" stroke-width="1.4" stroke-linecap="round"/>'
            f'<rect x="11" y="56" width="44" height="40" fill="#EEF1F3"/>'
            f'<path d="M11 86Q24 80 33 88T55 84V96H11Z" fill="#BFE1F4"/>'
            f'<path d="M11 66H55M24 56V96M42 56V88" stroke="{WHITE}" stroke-width="2.2"/>'
            f'<path d="M11 74Q28 70 40 62T55 59" fill="none" stroke="{RED}" stroke-width="1.6"/>'
            f'<path d="M30 56V96" stroke="{GREEN}" stroke-width="1.6"/>'
            f'<circle cx="33" cy="76" r="2.4" fill="{SKY}" stroke="{INK}" stroke-width=".8"/>'
            f'<path d="M13 101H40M13 105.5H48M13 110H34" stroke="#C3C9CE" stroke-width="1.6" stroke-linecap="round"/>')
    # kiosk with solar panel
    out += (f'<path d="M80 34V26" stroke="{INK}" stroke-width="2.6"/>'
            f'<path d="M62 18H98L96 27H64Z" fill="#24364F" stroke="{INK}" stroke-width="1" stroke-linejoin="round"/>'
            f'<path d="M71 18.2L70.4 26.8M80 18.2V26.8M89 18.2L89.6 26.8M63 22.5H97" stroke="#4A6286" stroke-width=".6"/>'
            f'<path d="M68 {G}V38Q68 34 72 34H88Q92 34 92 38V{G}Z" fill="{DOCK}" stroke="{INK}" stroke-width="1" stroke-linejoin="round"/>'
            f'<rect x="68.5" y="40" width="23" height="4" fill="{SKY}"/>'
            f'<rect x="71" y="48" width="18" height="14" rx="1.4" fill="{GLASS}" stroke="{INK}" stroke-width=".8"/>'
            f'<path d="M73.5 52H83M73.5 55.2H86.5" stroke="{SKY}" stroke-width="1.2" stroke-linecap="round"/>'
            f'<rect x="72" y="66" width="7" height="9" rx="1" fill="{DOCK_DARK}"/>'
            f'<path d="M81.5 67.5h1.6M84.6 67.5h1.6M81.5 70.5h1.6M84.6 70.5h1.6M81.5 73.5h1.6M84.6 73.5h1.6" stroke="{INK}" stroke-width="1.4" stroke-linecap="round"/>'
            f'<rect x="74" y="80" width="12" height="2" rx="1" fill="{INK}"/>'
            f'<rect x="66" y="{G - 4}" width="28" height="4" rx="1" fill="{DOCK_DARK}" stroke="{INK}" stroke-width="1"/>')
    # double-sided dock row seen end-on: a classic docked from the left, an e-bike from the right
    out += (f'<rect x="196" y="{G - 2.4}" width="66" height="2.4" rx="1" fill="#9AA1A7" stroke="{INK}" stroke-width=".8"/>'
            f'<g transform="translate(100 {G - 76})">{classic_body}</g>'
            f'<g transform="translate(355.6 {G - 76}) scale(-1 1)">{ebike_body}</g>'
            + dock_post(224, G - 47))
    return out


# ---------------------------------------------------------------- markers, pill, divider
GLYPH = ('<circle cx="-6.7" cy="3" r="3.5"/><circle cx="6.7" cy="3" r="3.5"/>'
         '<path d="M-6.7 3H-.4L-2.8-3L-6.7 3M-4.8-3.4H-1.2M-.4 3Q1.7-.6 4.4-4.4L6.7 3M4.4-4.4L3.8-6.2H1.8"/>')


def glyph(tx, ty, s, color=INK, w=2):
    return (f'<g transform="translate({n(tx)} {n(ty)}) scale({n(s)})" fill="none" stroke="{color}" '
            f'stroke-width="{n(w / s)}" stroke-linecap="round" stroke-linejoin="round">{GLYPH}</g>')


TEAR = "M16 38.5C9.5 30.5 3.5 24 3.5 16a12.5 12.5 0 0 1 25 0c0 8-6 14.5-12.5 22.5z"


def markers():
    base = f'<path d="{TEAR}" fill="{SKY}" stroke="{INK}" stroke-width="2" stroke-linejoin="round"/>' + glyph(16, 16.2, .84, INK, 1.75)
    write("marker-bike.svg", (0, 0, 32, 40), "Map marker: Bluebikes station", base)
    bolt = (f'<circle cx="25.4" cy="7" r="5.6" fill="{YELLOW}" stroke="{INK}" stroke-width="1.8"/>'
            f'<path d="M26.3 3.4L23.1 7.7H25.4L24.6 10.6L27.8 6.3H25.5Z" fill="{INK}"/>')
    write("marker-ebike.svg", (0, 0, 32, 40), "Map marker: Bluebikes station with e-bikes", base + bolt)


def pill():
    body = f'<rect width="52" height="28" rx="14" fill="{SKY}"/>' + glyph(26, 14, 1, INK, 1.9)
    write("pill-bike.svg", (0, 0, 52, 28), "Bike pill (Bluebikes)", body)


def divider():
    path = "M8 32H232q8 0 14-6l8-8q6-6 14-6H532q8 0 14 6l8 8q6 6 14 6H792"
    body = f'<path d="{path}" fill="none" stroke="{SKY}" stroke-width="6" stroke-linecap="round" stroke-dasharray="14 12"/>'
    for x, y in ((120, 32), (400, 12), (680, 32)):
        body += f'<rect x="{x - 6.5}" y="{y - 6.5}" width="13" height="13" rx="3" fill="{WHITE}" stroke="{INK}" stroke-width="2.5"/>'
    write("divider-bike.svg", (0, 0, 800, 44), "Bike route divider (Bluebikes docks)", body)


BIKE_NOTE = " Side view, 20 units per foot; components.css shows it at the T-vehicle scale."
classic_body, ebike_body = classic(), ebike()
write("vehicle-bike.svg", (1, 8, 127, 68), "Bluebikes classic bike (side view)", classic_body, BIKE_NOTE)
write("vehicle-ebike.svg", (1, 8, 127, 68), "Bluebikes e-bike (side view)", ebike_body, BIKE_NOTE)
write("bike-station.svg", (0, 14, 358, 138), "Bluebikes station: map board, kiosk and a double-sided dock",
      station(classic_body, ebike_body), " Bikes side view, 20 units per foot.")
markers()
pill()
divider()
print("wrote 7 Bluebikes SVGs to", OUT)
