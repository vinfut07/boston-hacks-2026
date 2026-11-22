"""Side-view drawings of the current MBTA vehicles, one per line.

Scale: about 3.25 units per foot for every vehicle, ground line at y=58,
so files placed at the same scale line up correctly.
Usage (from the repo root): python docs/tools/build_vehicles.py docs/assets/svg
"""
import os
import sys

OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)

INK = "#000000"
STEEL = "#CDD2D6"        # stainless body
STEEL_LIGHT = "#E3E7EA"  # doors
WHITE = "#F3F4F2"
GLASS = "#283038"
TRUCK = "#3A3F44"
ROOF = "#A9B0B6"
SILVER_PAINT = "#B7BEC5"
RED, ORANGE, BLUE, GREEN = "#CE2634", "#ED8B00", "#206DDF", "#0C6B14"
HEADER = "<!-- Original artwork - BostonHacks 2026 \"Breadcrumb\" team. Side view, ~3.25 units per foot. -->"


def write(name, vb, title, body):
    x, y, w, h = vb
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x} {y} {w} {h}" width="{w}" height="{h}" role="img">\n'
         f"  {HEADER}\n  <title>{title}</title>\n  {body}\n</svg>\n")
    with open(os.path.join(OUT, name), "w", encoding="utf-8", newline="\n") as f:
        f.write(s)


def truck(cx, r=3.5, y=48):
    return (f'<rect x="{cx-14}" y="{y}" width="28" height="5" rx="1.5" fill="{TRUCK}"/>'
            f'<circle cx="{cx-8}" cy="{y+5.5}" r="{r}" fill="{INK}"/><circle cx="{cx+8}" cy="{y+5.5}" r="{r}" fill="{INK}"/>')


def windows_between(a, b, y0=18, y1=29, max_w=19):
    """Evenly fill the gap a..b with windows, 3 units apart."""
    gap = b - a
    n = max(1, round((gap - 3) / (max_w + 3)))
    w = (gap - 3 * (n + 1)) / n
    out = ""
    for i in range(n):
        x = a + 3 + i * (w + 3)
        out += f'<rect x="{x:.1f}" y="{y0}" width="{w:.1f}" height="{y1-y0}" rx="1.5" fill="{GLASS}"/>'
    return out


def pantograph(cx, roof):
    """Single-arm pantograph, raised to the wire (head ~17 units above the roof)."""
    h = roof - 17
    return (f'<rect x="{cx-9}" y="{roof-1.8}" width="18" height="1.8" rx=".6" fill="{ROOF}" stroke="{INK}" stroke-width=".7"/>'
            f'<path d="M{cx-6} {roof-1.8}L{cx+6} {roof-9.5}L{cx-2} {h}" fill="none" stroke="{INK}" stroke-width="1.3" stroke-linejoin="round"/>'
            f'<path d="M{cx-7} {roof-1.8}L{cx+6} {roof-9.5}" fill="none" stroke="{INK}" stroke-width=".7"/>'
            f'<path d="M{cx-12} {h+1.5}Q{cx-11} {h} {cx-9} {h}H{cx+7}Q{cx+9} {h} {cx+10} {h+1.5}" fill="none" stroke="{INK}" stroke-width="1.5" stroke-linecap="round"/>')


# ---------------------------------------------------------------- heavy rail (Red, Orange, Blue)
def heavy_rail(name, title, length, door_centers, band, body_fill=STEEL, cab_fill=None,
               skirt=None, panto_x=None, roof_units=(0.22, 0.62)):
    x0, x1, top, bot = 4, 4 + length, 14, 48
    roof_y = 14
    body_path = f"M{x0} {bot}V{top+3}Q{x0} {top} {x0+3} {top}H{x1-3}Q{x1} {top} {x1} {top+3}V{bot}Z"
    parts = []
    # roof equipment
    for f in roof_units:
        rx = x0 + length * f
        parts.append(f'<rect x="{rx:.1f}" y="11" width="30" height="3" rx="1" fill="{ROOF}" stroke="{INK}" stroke-width=".8"/>')
    if panto_x:
        parts.append(pantograph(panto_x, 11))
    # trucks under the body
    parts.append(truck(x0 + length * 0.16) + truck(x0 + length * 0.84))
    # couplers
    parts.append(f'<rect x="{x0-3}" y="40" width="3" height="3" fill="{TRUCK}"/><rect x="{x1}" y="40" width="3" height="3" fill="{TRUCK}"/>')
    # body + livery
    parts.append(f'<path d="{body_path}" fill="{body_fill}"/>')
    by0, by1, bcolor = band
    parts.append(f'<rect x="{x0}" y="{by0}" width="{length}" height="{by1-by0}" fill="{bcolor}"/>')
    if skirt:
        parts.append(f'<rect x="{x0}" y="{by1}" width="{length}" height="{bot-by1}" fill="{skirt}"/>')
    # cab end (front, right)
    if cab_fill:
        parts.append(f'<path d="M{x1-8} {bot}V{top}H{x1-3}Q{x1} {top} {x1} {top+3}V{bot}Z" fill="{cab_fill}"/>')
    parts.append(f'<rect x="{x1-7}" y="17" width="6" height="12" rx="1" fill="{GLASS}"/>')
    parts.append(f'<circle cx="{x1-2.5}" cy="40" r="1.4" fill="#FFF4C2" stroke="{INK}" stroke-width=".5"/>')
    # windows between doors
    edges = [x0] + [e for c in door_centers for e in (c - 8, c + 8)] + [x1 - 8]
    for a, b in zip(edges[0::2], edges[1::2]):
        if b - a > 12:
            parts.append(windows_between(a, b))
    # doors (double-leaf, silver, with windows)
    for c in door_centers:
        parts.append(f'<rect x="{c-8}" y="16" width="16" height="{bot-16}" fill="{STEEL_LIGHT}" stroke="{INK}" stroke-width=".8"/>'
                     f'<path d="M{c} 16V{bot}" stroke="{INK}" stroke-width=".8"/>'
                     f'<rect x="{c-6.2}" y="19" width="4.6" height="11" rx="1" fill="{GLASS}"/>'
                     f'<rect x="{c+1.6}" y="19" width="4.6" height="11" rx="1" fill="{GLASS}"/>')
    # outline
    parts.append(f'<path d="{body_path}" fill="none" stroke="{INK}" stroke-width="1.2" stroke-linejoin="round"/>')
    ymin = -9 if panto_x else 9
    write(name, (0, ymin, x1 + 4, 58 - ymin), title, "".join(parts))


# Red Line: CRRC #4 (1900-series), 69.75 ft, four double doors per side, red lower band, red cab end
heavy_rail("vehicle-rl.svg", "Red Line car (CRRC #4, 1900-series)", 227,
           [40, 96, 152, 208], (31, 48, RED), cab_fill=RED)

# Orange Line: CRRC #14 (1400-series), 65 ft, three double doors per side, orange lower band, orange cab end
heavy_rail("vehicle-ol.svg", "Orange Line car (CRRC #14, 1400-series)", 211,
           [50, 110, 170], (31, 48, ORANGE), cab_fill=ORANGE)

# Blue Line: Siemens 0700-series, 48 ft, two double doors per side, white body with blue band, pantograph
heavy_rail("vehicle-bl.svg", "Blue Line car (Siemens 0700-series)", 157,
           [56, 112], (30, 42, BLUE), body_fill=WHITE, skirt="#C3C9CE",
           panto_x=128, roof_units=(0.14,))


# ---------------------------------------------------------------- Green Line: Type 7 LRV (two sections)
def green_type7():
    top, bot = 14, 48
    A0, A1, B0, B1 = 4, 121, 131, 248
    parts = []
    # roof equipment + pantograph over the front section
    parts.append(f'<rect x="20" y="10.5" width="86" height="3.5" rx="1" fill="{ROOF}" stroke="{INK}" stroke-width=".8"/>')
    parts.append(f'<rect x="146" y="10.5" width="86" height="3.5" rx="1" fill="{ROOF}" stroke="{INK}" stroke-width=".8"/>')
    parts.append(pantograph(176, 10.5))
    # three trucks: one under each end, one under the articulation
    parts.append(truck(32, 3) + truck(126, 3) + truck(220, 3))
    sec_a = f"M{A0} {bot}L{A0+.6} {top+5}Q{A0+1} {top} {A0+5} {top}H{A1}V{bot}Z"
    sec_b = f"M{B1} {bot}L{B1-.6} {top+5}Q{B1-1} {top} {B1-5} {top}H{B0}V{bot}Z"
    for path, x0, x1 in ((sec_a, A0, A1), (sec_b, B0, B1)):
        parts.append(f'<path d="{path}" fill="{WHITE}"/>')
        parts.append(f'<rect x="{x0}" y="30" width="{x1-x0}" height="{bot-30}" fill="{GREEN}"/>')
    # bellows
    parts.append(f'<rect x="{A1}" y="16" width="{B0-A1}" height="30" fill="#4A4F55"/>'
                 + "".join(f'<path d="M{x} 16V46" stroke="{INK}" stroke-width=".6"/>' for x in range(A1 + 2, B0, 2)))
    # windshields (double-ended car) + headlights
    parts.append(f'<rect x="{A0+1.2}" y="16.5" width="7" height="16" rx="1.5" fill="{GLASS}"/>'
                 f'<rect x="{B1-8.2}" y="16.5" width="7" height="16" rx="1.5" fill="{GLASS}"/>'
                 f'<circle cx="{A0+3}" cy="40" r="1.4" fill="#FFF4C2" stroke="{INK}" stroke-width=".5"/>'
                 f'<circle cx="{B1-3}" cy="40" r="1.4" fill="#FFF4C2" stroke="{INK}" stroke-width=".5"/>')
    doors = [24, 106, 146, 228]
    edges = [A0 + 8, 24 - 7, 24 + 7, 106 - 7, 106 + 7, A1, B0, 146 - 7, 146 + 7, 228 - 7, 228 + 7, B1 - 8]
    for a, b in zip(edges[0::2], edges[1::2]):
        if b - a > 12:
            parts.append(windows_between(a, b, 17, 28, 18))
    # folding doors: glass above, green panels below
    for c in doors:
        parts.append(f'<rect x="{c-7}" y="16" width="14" height="{bot-16}" fill="{GREEN}" stroke="{INK}" stroke-width=".8"/>'
                     f'<rect x="{c-6}" y="17.5" width="5.2" height="18" rx=".8" fill="{GLASS}"/>'
                     f'<rect x="{c+.8}" y="17.5" width="5.2" height="18" rx=".8" fill="{GLASS}"/>'
                     f'<path d="M{c} 16V{bot}" stroke="{INK}" stroke-width=".8"/>')
    for path in (sec_a, sec_b):
        parts.append(f'<path d="{path}" fill="none" stroke="{INK}" stroke-width="1.2" stroke-linejoin="round"/>')
    write("vehicle-gl.svg", (0, -9, 252, 67), "Green Line car (Kinki Sharyo Type 7 LRV)", "".join(parts))


green_type7()


# ---------------------------------------------------------------- Silver Line: 60 ft articulated hybrid bus
def silver_bus():
    top, bot = 20, 52
    R0, R1, F0, F1 = 4, 76, 84, 204
    parts = []
    parts.append(f'<rect x="18" y="15.5" width="44" height="4.5" rx="2" fill="{ROOF}" stroke="{INK}" stroke-width=".8"/>'
                 f'<rect x="112" y="14" width="66" height="6" rx="2" fill="{ROOF}" stroke="{INK}" stroke-width=".8"/>')
    rear = f"M{R0} {bot-2}V{top+4}Q{R0} {top} {R0+4} {top}H{R1}V{bot}H{R0+2}Q{R0} {bot} {R0} {bot-2}Z"
    front = f"M{F0} {bot}V{top}H{F1-6}Q{F1-1} {top} {F1-.5} {top+5}L{F1} {bot-4}Q{F1} {bot} {F1-4} {bot}Z"
    parts.append(f'<path d="{rear}" fill="{SILVER_PAINT}"/><path d="{front}" fill="{SILVER_PAINT}"/>')
    # accordion joint
    parts.append(f'<rect x="{R1}" y="22" width="{F0-R1}" height="29" fill="#3A3F44"/>'
                 + "".join(f'<path d="M{x} 22V51" stroke="{INK}" stroke-width=".6"/>' for x in range(R1 + 2, F0, 2)))
    # window band + windshield
    parts.append(f'<rect x="{R0+4}" y="24" width="{R1-R0-6}" height="11" rx="1" fill="{GLASS}"/>'
                 f'<rect x="{F0+2}" y="24" width="{F1-F0-12}" height="11" rx="1" fill="{GLASS}"/>'
                 f'<path d="M{F1-8} 23H{F1-3}Q{F1-1.2} 23 {F1-1} 26L{F1-.6} 44H{F1-8}Z" fill="{GLASS}"/>'
                 f'<rect x="{F1-8}" y="21" width="6" height="2" fill="{INK}"/>'
                 f'<circle cx="{F1-2.5}" cy="47" r="1.4" fill="#FFF4C2" stroke="{INK}" stroke-width=".5"/>')
    # doors: rear, middle, front
    for x0, x1 in ((58, 70), (108, 120), (182, 194)):
        c = (x0 + x1) / 2
        parts.append(f'<rect x="{x0}" y="24" width="{x1-x0}" height="{bot-25}" fill="{GLASS}" stroke="{INK}" stroke-width=".8"/>'
                     f'<path d="M{c} 24V{bot-1}" stroke="#5B636B" stroke-width=".8"/>')
    # wheel arches + wheels
    for ax in (26, 96, 168):
        parts.append(f'<circle cx="{ax}" cy="51" r="7.6" fill="#2A2E33"/><circle cx="{ax}" cy="51" r="6" fill="{INK}"/>'
                     f'<circle cx="{ax}" cy="51" r="2.6" fill="#8D959C"/>')
    parts.append(f'<path d="{rear}" fill="none" stroke="{INK}" stroke-width="1.2" stroke-linejoin="round"/>'
                 f'<path d="{front}" fill="none" stroke="{INK}" stroke-width="1.2" stroke-linejoin="round"/>')
    write("vehicle-sl.svg", (0, 12, 208, 46), "Silver Line bus (60 ft articulated hybrid)", "".join(parts))


silver_bus()
print("done")
