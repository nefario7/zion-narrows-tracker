# Visual Refresh: Warm Earth Theme

## Overview

A holistic visual refresh of the Zion Narrows status tracker to make it more visually engaging, immersive, and responsive. The redesign introduces a canyon-inspired warm earth palette, an SVG slot canyon background with parallax, entrance animations and micro-interactions, and a responsive multi-column layout for wider screens.

No new dependencies. No changes to data fetching, data structure, or backend logic.

## Files Modified

- `docs/style.css` — Full palette swap, new background elements, responsive breakpoints, animation keyframes
- `docs/app.js` — Animated number counters, parallax scroll listener, chart color updates, staggered card rendering
- `docs/index.html` — Add inline SVG canyon wall elements, update any hardcoded color references

## 1. Color Palette

| Role | Current | New |
|------|---------|-----|
| Page background | `#0f172a` | `#120a06` (near-black warm brown) |
| Card background | `#1e293b` (solid) | `rgba(28,25,23,0.75)` + `backdrop-filter: blur(12px)` (smoky glass) |
| Card inner elements | `#0f172a` | `rgba(12,10,9,0.6)` (semi-transparent near-black) |
| Primary text | `#e2e8f0` | `#ede0d4` (warm cream) |
| Secondary text | `#64748b` | `#8b7355` (weathered stone) |
| Muted text | `#475569` | `#78716c` |
| Accent | `#38bdf8` (cyan) | `#c4956a` (amber sandstone) |
| Borders | `rgba(148,163,184,0.08)` | `rgba(196,149,106,0.1)` |

**Status colors are unchanged** — green (`#22c55e`/`#16a34a`), amber (`#eab308`/`#ca8a04`), orange (`#f97316`/`#ea580c`), red (`#ef4444`/`#dc2626`) remain as-is since they carry safety meaning.

## 2. Canyon Background

### Slot Canyon Walls

Two inline SVG elements positioned fixed on the left and right edges of the viewport. Each wall consists of two overlapping paths with irregular, organic edges to simulate rock faces.

- Left wall: `width: 14%` of viewport, `opacity: 0.25`, fills `#3d2317` and `#5a3a25`
- Right wall: mirrors the left with different path shapes
- A faint radial gradient light strip at top center simulates light entering the slot from above: `rgba(196,149,106,0.06)`

### Parallax

A scroll listener (throttled via `requestAnimationFrame`) translates the canyon wall SVGs at `0.3x` the scroll speed (`translateY`). This creates subtle depth as the user scrolls.

The listener must be lightweight — only a `transform` update, no layout triggers.

## 3. Animations

All animations respect `prefers-reduced-motion: reduce` — when enabled, all animations are disabled and elements render in their final state immediately.

### Card Entry (CSS)

Cards use a shared `@keyframes fadeUp` animation:
- From: `opacity: 0; transform: translateY(20px)`
- To: `opacity: 1; transform: translateY(0)`
- Duration: `400ms`, easing: `ease-out`
- Each card gets an incrementing `animation-delay` of `50ms` (set via inline style or CSS `nth-child`)

### Status Badge Glow Pulse (CSS)

The status card gets a `@keyframes glowPulse` animation on `box-shadow`:
- Pulses between `0px` and `20px` spread of a shadow matching the status color
- Duration: `3s`, infinite loop, `ease-in-out`
- Shadow opacity ranges from `0.1` to `0.3`

### Number Counters (JS)

CFS value, gauge height, and weather temperature animate from `0` to their target value on load:
- Duration: `800ms`
- Easing: ease-out (decelerate)
- Uses `requestAnimationFrame` loop
- Rounds to appropriate decimal places (CFS: 1 decimal, gauge: 2 decimals, temp: 0 decimals)

### Chart Draw-In (JS/Chart.js)

Chart.js built-in animation config:
- `animation.duration`: `1200ms`
- `animation.easing`: `easeOutQuart`
- Triggers when the chart element enters the viewport (IntersectionObserver)

### Trend Arrow Bounce (CSS)

`@keyframes bounce`: a single bounce effect on the trend arrow icon:
- `0%`: `translateY(0)`
- `50%`: `translateY(-4px)`
- `100%`: `translateY(0)`
- Duration: `600ms`, `ease-in-out`, plays once on load

## 4. Responsive Layout

### Breakpoints

- **Mobile** (`<640px`): Single column, `max-width: 100%`, `padding: 0.75rem`
- **Tablet** (`640px–1024px`): `max-width: 800px`, selective 2-column grids
- **Desktop** (`>1024px`): `max-width: 960px`, full 2-column layout

### Mobile (<640px)

No changes from current layout. Single column stack. Hike forecast scrolls horizontally.

### Tablet (640px–1024px)

- Status card: full width
- River conditions + weather: side-by-side in a `grid-template-columns: 1fr 1fr` container
- Flow chart: full width
- Best days to hike: shows more days visible (wider cards area)
- Flow guide + alerts: stack vertically, full width

### Desktop (>1024px)

- Status card: full width
- Below status card: 2-column grid layout
  - Left column: river conditions, flow chart, flow guide
  - Right column: weather, best days to hike, NPS alerts
- Canyon walls more prominent at wider viewports (more visible edge space)

### Canyon Walls Responsive Behavior

- Mobile: walls are `width: 8%`, very subtle
- Tablet: walls are `width: 12%`
- Desktop: walls are `width: 14%`

## 5. Chart Recoloring

| Element | Current | New |
|---------|---------|-----|
| Actual flow line | `#38bdf8` (cyan) | `#c4956a` (amber) |
| Actual flow fill | cyan at low opacity | `rgba(196,149,106,0.15)` |
| Forecast line | yellow dashed | `#d4a574` (light sand) dashed |
| Closure threshold | `#ef4444` red dashed | unchanged (safety) |
| Historical bands (p25/p75) | faint gray | `rgba(139,112,64,0.1)` (warm brown) |
| Grid lines | gray | `rgba(139,115,85,0.15)` |
| Axis labels | gray | `#8b7355` |
| "Now" divider | gray | `#c4956a` at `0.5` opacity |
| Tooltip background | dark | `#1c1917` |
| Tooltip text | white | `#ede0d4` |
| Tooltip accent | cyan | `#c4956a` |

Threshold background bands keep their hue meaning (green/amber/orange/red zones) but shift warmer in undertone.

## 6. Typography Adjustments

- Font family: unchanged (Inter)
- Card titles (`h2`): weight `600` → `700`
- Status label: add `text-shadow: 0 2px 8px rgba(0,0,0,0.3)` for depth
- No other typography changes

## 7. Non-Goals

- No changes to data fetching or `fetch_data.py`
- No changes to `data.json` structure
- No new external dependencies or images
- No changes to status determination logic
- No changes to GitHub Actions workflow
