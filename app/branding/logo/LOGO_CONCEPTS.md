# PURE LINE — Logo Concepts

Three hand-authored vector concepts for **PURE LINE (بيور لاين)**, an Agricultural Technology company.
Every concept ships as six SVGs: `-main` (full lockup, color), `-icon` (mark only, color),
`-light` (for dark backgrounds), `-dark` (for light backgrounds), `-mono` (single color), `-favicon` (rounded tile, 16–32px legible).

---

## Concept 1 — "Growth + Technology"  *(leaf built from circuit lines)*
A single confident leaf whose central vein is rendered as a **circuit trace** with **sensor nodes** (gold dots)
branching off it. It fuses the two halves of the brand in one glyph: organic growth (the leaf silhouette) and
technology (the circuit vein + IoT nodes).
- **Symbolism:** growth, smart farming, IoT sensing, precision agriculture, data-driven cultivation.
- **Files:** `concept1-*.svg`

## Concept 2 — "Satellite + Smart Farming"  *(orbiting node around a sprout over field rows)*
A young sprout rising from two **field-row lines**, encircled by a tilted **orbital ring** carrying a
satellite **node**. Communicates remote sensing and satellite monitoring wrapping around the living crop.
- **Symbolism:** satellite monitoring, connectivity, aerial/precision agriculture, farm-scale intelligence.
- **Files:** `concept2-*.svg`
- *Trade-off:* the richest story, but the orbit + rows detail is the least legible at favicon scale.

## Concept 3 — "Growth + Sustainability"  *(ascending leaf / upward arrow)*
A minimal leaf that doubles as an **upward arrow**, with a gold chevron accent pointing up-right — a lockup
that reads as sustainable, always-rising growth. The cleanest, most scalable silhouette of the three.
- **Symbolism:** sustainability, upward growth, yield/efficiency gains, forward momentum.
- **Files:** `concept3-*.svg`

---

## ✅ PRIMARY DECISION — Concept 1 selected
**Concept 1 ("Growth + Technology") is the primary brand mark.**
Reasoning: it most directly expresses the company's positioning (a *technology* company for *agriculture*),
the leaf silhouette stays crisp and recognizable down to 16px, the circuit vein + gold nodes give a distinctive,
ownable detail, and it renders cleanly in mono and on both light and dark backgrounds. Concept 3 is the recommended
secondary/alternate. Concept 1's icon and lockup are wired into the website navbar, footer and favicon
(`website/src/components/ui/Logo.tsx` and `website/public/favicon.svg`).

---

## Brand color palette
| Role | Name | Hex |
|---|---|---|
| Primary | Deep Green | `#0F6B3A` |
| Secondary | Modern Green | `#3CB371` |
| Accent | Soft Gold | `#D4AF37` |
| Accent (light) | Champagne Gold | `#E7C868` |
| Neutral light | Off-white | `#F7F9F8` |
| Neutral gray | Slate Gray | `#8A9691` |
| Neutral dark | Near-black Green | `#111815` |

## Typography recommendation
- **Latin:** **Inter** (primary) — geometric, modern, excellent at all weights. Alternate: **Montserrat** for display.
- **Arabic:** **Tajawal** (primary) — clean geometric Naskh that pairs naturally with Inter. Alternate: **Cairo**.
- Wordmark: uppercase "PURE LINE", weight 800, +1 tracking; tagline "AGRITECH" weight 600, +3.5 tracking.
- All four are free Google Fonts and are already loaded in the website's `index.html`.
