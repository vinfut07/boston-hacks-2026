# Breadcrumb mockups ("Dotted trail" style)

Nine screens built on the design system in `docs/styles/` (see `docs/STYLE_GUIDE.md`).

| File | Screen |
|---|---|
| `Main.dc.html` | Mobile · Explore (For You feed) |
| `Mobile-Detail.dc.html` | Mobile · Trail detail |
| `Mobile-Run.dc.html` | Mobile · On the trail (live map, crumb checklist) |
| `Mobile-Finished.dc.html` | Mobile · Trail finished (fun / worth it / getting there ratings) |
| `Mobile-Create.dc.html` | Mobile · Make a trail |
| `Mobile-Profile.dc.html` | Mobile · You (stats, neighborhoods, finished trails) |
| `Web-Explore.dc.html` | Web · Explore (feed + map) |
| `Web-Detail.dc.html` | Web · Trail detail |
| `Web-Create.dc.html` | Web · Make a trail (form + live preview) |

**View them:** serve the docs folder (`python -m http.server 5178 --directory docs`) and open http://localhost:5178/mockups/. The gallery shows every screen at its real size. You can also open a single `.dc.html` file on its own.

These are copies of a Claude Design canvas. `canvas.json` holds the canvas layout. On the canvas the screens are linked into a clickable prototype, and the crumb checkboxes and rating stars work. Opened here as plain HTML, the links still work. The checklist and stars on the Run and Finished screens need the canvas runtime, so they show placeholders.

Sample people, counts and reviews are made up. Every place is a real Boston spot.
