# Visual Refresh: Warm Earth Theme — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Zion Narrows tracker from a cold slate-blue dashboard into an immersive, warm earth-toned experience with a blurred canyon photo background, smoky glass cards, entrance animations, and responsive multi-column layout.

**Architecture:** Pure CSS/JS changes to 3 existing files plus 1 new image asset. No new dependencies. The palette swap touches every color reference in `style.css` and chart config in `app.js`. The background image uses CSS filters for blur/darken. Animations are CSS keyframes + small JS additions for number counters and parallax.

**Tech Stack:** Vanilla CSS3 (backdrop-filter, @keyframes, CSS Grid), Vanilla JS (requestAnimationFrame, IntersectionObserver), Chart.js 4 (existing)

**Spec:** `docs/superpowers/specs/2026-03-28-visual-refresh-design.md`

---

### Task 1: Add Background Image Asset

**Files:**
- Copy: `.context/attachments/zion-narrows.jpg` → `docs/zion-narrows.jpg`

- [ ] **Step 1: Copy the image file**

```bash
cp /Users/chinmay/conductor/workspaces/zion-narrows-tracker/copenhagen/.context/attachments/zion-narrows.jpg /Users/chinmay/conductor/workspaces/zion-narrows-tracker/copenhagen/docs/zion-narrows.jpg
```

- [ ] **Step 2: Update index.html — add background image container**

In `docs/index.html`, add a `div.bg-image` and `div.bg-overlay` immediately after the opening `<body>` tag (before `<header>`):

```html
<div class="bg-image"></div>
<div class="bg-overlay"></div>
```

The full `<body>` opening should become:

```html
<body>
    <div class="bg-image"></div>
    <div class="bg-overlay"></div>
    <header>
```

- [ ] **Step 3: Commit**

```bash
git add docs/zion-narrows.jpg docs/index.html
git commit -m "Add Narrows background image and container elements"
```

---

### Task 2: CSS Palette Swap & Background Styling

**Files:**
- Modify: `docs/style.css` (full file)

This task replaces every color value in the CSS file with the warm earth palette and adds background image styling.

- [ ] **Step 1: Replace body styles**

In `docs/style.css`, replace the `body` rule:

Old:
```css
body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #0f172a;
    color: #e2e8f0;
    line-height: 1.5;
    min-height: 100vh;
}
```

New:
```css
body {
    font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    background: #120a06;
    color: #ede0d4;
    line-height: 1.5;
    min-height: 100vh;
}
```

- [ ] **Step 2: Add background image and overlay styles**

Insert these rules immediately after the `body` rule, before the `/* Header */` comment:

```css
/* Background image */
.bg-image {
    position: fixed;
    inset: 0;
    z-index: -2;
    background-image: url('zion-narrows.jpg');
    background-size: cover;
    background-position: center;
    filter: blur(8px) brightness(0.15) sepia(0.3);
    transform: scale(1.1);
}

.bg-overlay {
    position: fixed;
    inset: 0;
    z-index: -1;
    background: rgba(18, 10, 6, 0.6);
}
```

- [ ] **Step 3: Replace header styles**

Old:
```css
header {
    background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
    border-bottom: 1px solid rgba(148, 163, 184, 0.1);
    padding: 1.5rem 1rem 1.25rem;
}
```

New:
```css
header {
    background: linear-gradient(135deg, rgba(28, 25, 23, 0.8) 0%, rgba(18, 10, 6, 0.8) 100%);
    border-bottom: 1px solid rgba(196, 149, 106, 0.1);
    padding: 1.5rem 1rem 1.25rem;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}
```

- [ ] **Step 4: Replace header content colors**

Old:
```css
.header-icon {
    color: #38bdf8;
    margin-bottom: 0.5rem;
}

header h1 {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #f1f5f9;
}

.subtitle {
    font-size: 0.8rem;
    color: #64748b;
    margin-top: 0.15rem;
    font-weight: 500;
}
```

New:
```css
.header-icon {
    color: #c4956a;
    margin-bottom: 0.5rem;
}

header h1 {
    font-size: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    color: #ede0d4;
}

.subtitle {
    font-size: 0.8rem;
    color: #8b7355;
    margin-top: 0.15rem;
    font-weight: 500;
}
```

- [ ] **Step 5: Replace loading spinner colors**

Old:
```css
.loading {
    text-align: center;
    padding: 4rem 1rem;
    color: #64748b;
}

.loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid #1e293b;
    border-top-color: #38bdf8;
    border-radius: 50%;
    margin: 0 auto 1rem;
    animation: spin 0.8s linear infinite;
}
```

New:
```css
.loading {
    text-align: center;
    padding: 4rem 1rem;
    color: #8b7355;
}

.loading-spinner {
    width: 32px;
    height: 32px;
    border: 3px solid rgba(28, 25, 23, 0.75);
    border-top-color: #c4956a;
    border-radius: 50%;
    margin: 0 auto 1rem;
    animation: spin 0.8s linear infinite;
}
```

- [ ] **Step 6: Replace card styles with smoky glass**

Old:
```css
.card {
    background: #1e293b;
    border: 1px solid rgba(148, 163, 184, 0.08);
    border-radius: 14px;
    padding: 1.25rem;
    margin-bottom: 0.75rem;
}

.card h2 {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #64748b;
    margin-bottom: 0.75rem;
    font-weight: 600;
}
```

New:
```css
.card {
    background: rgba(28, 25, 23, 0.75);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(196, 149, 106, 0.1);
    border-radius: 14px;
    padding: 1.25rem;
    margin-bottom: 0.75rem;
}

.card h2 {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #8b7355;
    margin-bottom: 0.75rem;
    font-weight: 700;
}
```

- [ ] **Step 7: Replace status card colors**

Old `status-card::before`:
```css
.status-card::before {
    content: "";
    position: absolute;
    inset: 0;
    opacity: 0.15;
    background: radial-gradient(circle at 30% 50%, white, transparent 70%);
}
```

New (keep same, but add text-shadow to status-label):

Old `.status-label`:
```css
.status-label {
    font-size: 2.25rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    position: relative;
}
```

New:
```css
.status-label {
    font-size: 2.25rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    position: relative;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}
```

- [ ] **Step 8: Replace hike forecast colors**

Old:
```css
.hike-day {
    min-width: 72px;
    text-align: center;
    padding: 0.6rem 0.4rem;
    background: #0f172a;
    border: 1px solid rgba(148, 163, 184, 0.06);
    border-radius: 10px;
    flex-shrink: 0;
    transition: transform 0.15s;
}
```

New:
```css
.hike-day {
    min-width: 72px;
    text-align: center;
    padding: 0.6rem 0.4rem;
    background: rgba(12, 10, 9, 0.6);
    border: 1px solid rgba(196, 149, 106, 0.08);
    border-radius: 10px;
    flex-shrink: 0;
    transition: transform 0.15s;
}
```

Old:
```css
.hike-day-name {
    font-size: 0.7rem;
    font-weight: 700;
    color: #e2e8f0;
}

.hike-day-date {
    font-size: 0.6rem;
    color: #64748b;
    font-weight: 500;
}
```

New:
```css
.hike-day-name {
    font-size: 0.7rem;
    font-weight: 700;
    color: #ede0d4;
}

.hike-day-date {
    font-size: 0.6rem;
    color: #8b7355;
    font-weight: 500;
}
```

Old:
```css
.hike-cfs {
    font-size: 0.7rem;
    font-weight: 600;
    color: #94a3b8;
}
```

New:
```css
.hike-cfs {
    font-size: 0.7rem;
    font-weight: 600;
    color: #c4956a;
}
```

Old:
```css
.hike-precip {
    font-size: 0.6rem;
    color: #38bdf8;
}
```

New:
```css
.hike-precip {
    font-size: 0.6rem;
    color: #c4956a;
}
```

- [ ] **Step 9: Replace river stats colors**

Old:
```css
.stat {
    text-align: center;
    padding: 0.75rem 0.5rem;
    background: #0f172a;
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.06);
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #f1f5f9;
}

.stat-unit {
    font-size: 0.75rem;
    font-weight: 400;
    color: #64748b;
}

.stat-label {
    font-size: 0.65rem;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 0.15rem;
    font-weight: 600;
}
```

New:
```css
.stat {
    text-align: center;
    padding: 0.75rem 0.5rem;
    background: rgba(12, 10, 9, 0.6);
    border-radius: 10px;
    border: 1px solid rgba(196, 149, 106, 0.08);
}

.stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #ede0d4;
}

.stat-unit {
    font-size: 0.75rem;
    font-weight: 400;
    color: #78716c;
}

.stat-label {
    font-size: 0.65rem;
    color: #8b7355;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    margin-top: 0.15rem;
    font-weight: 600;
}
```

- [ ] **Step 10: Replace weather colors**

Old:
```css
.weather-current {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(148, 163, 184, 0.08);
}

.weather-temp {
    font-size: 2.5rem;
    font-weight: 700;
    color: #f1f5f9;
    line-height: 1;
}

.weather-desc {
    font-size: 0.8rem;
    color: #94a3b8;
    font-weight: 500;
}
```

New:
```css
.weather-current {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    margin-bottom: 1rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(196, 149, 106, 0.08);
}

.weather-temp {
    font-size: 2.5rem;
    font-weight: 700;
    color: #ede0d4;
    line-height: 1;
}

.weather-desc {
    font-size: 0.8rem;
    color: #c4956a;
    font-weight: 500;
}
```

Old:
```css
.forecast-day {
    text-align: center;
    padding: 0.75rem 0.5rem;
    background: #0f172a;
    border-radius: 10px;
    border: 1px solid rgba(148, 163, 184, 0.06);
}

.forecast-date {
    font-size: 0.7rem;
    color: #64748b;
    font-weight: 600;
}

.forecast-temps {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0.25rem 0;
    color: #e2e8f0;
}

.forecast-temps .low {
    color: #64748b;
    font-weight: 400;
}

.forecast-precip {
    font-size: 0.7rem;
    color: #38bdf8;
    font-weight: 500;
}
```

New:
```css
.forecast-day {
    text-align: center;
    padding: 0.75rem 0.5rem;
    background: rgba(12, 10, 9, 0.6);
    border-radius: 10px;
    border: 1px solid rgba(196, 149, 106, 0.08);
}

.forecast-date {
    font-size: 0.7rem;
    color: #8b7355;
    font-weight: 600;
}

.forecast-temps {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0.25rem 0;
    color: #ede0d4;
}

.forecast-temps .low {
    color: #78716c;
    font-weight: 400;
}

.forecast-precip {
    font-size: 0.7rem;
    color: #c4956a;
    font-weight: 500;
}
```

- [ ] **Step 11: Replace alert colors**

Old:
```css
.alert-item {
    padding: 0.75rem;
    background: rgba(239, 68, 68, 0.08);
    border-left: 3px solid #ef4444;
    border-radius: 0 8px 8px 0;
    margin-bottom: 0.5rem;
}

.alert-item.info {
    background: rgba(56, 189, 248, 0.08);
    border-left-color: #38bdf8;
}

.alert-item.caution-alert {
    background: rgba(234, 179, 8, 0.08);
    border-left-color: #eab308;
}
```

New:
```css
.alert-item {
    padding: 0.75rem;
    background: rgba(239, 68, 68, 0.08);
    border-left: 3px solid #ef4444;
    border-radius: 0 8px 8px 0;
    margin-bottom: 0.5rem;
}

.alert-item.info {
    background: rgba(196, 149, 106, 0.08);
    border-left-color: #c4956a;
}

.alert-item.caution-alert {
    background: rgba(234, 179, 8, 0.08);
    border-left-color: #eab308;
}
```

Old:
```css
.alert-title {
    font-weight: 600;
    font-size: 0.85rem;
    color: #e2e8f0;
}

.alert-date {
    font-size: 0.7rem;
    color: #64748b;
    white-space: nowrap;
    flex-shrink: 0;
}

.alert-desc {
    font-size: 0.75rem;
    color: #94a3b8;
    margin-top: 0.2rem;
    line-height: 1.4;
}

.alert-source {
    display: inline-block;
    font-size: 0.7rem;
    color: #38bdf8;
    text-decoration: none;
    margin-top: 0.3rem;
    font-weight: 500;
}
```

New:
```css
.alert-title {
    font-weight: 600;
    font-size: 0.85rem;
    color: #ede0d4;
}

.alert-date {
    font-size: 0.7rem;
    color: #8b7355;
    white-space: nowrap;
    flex-shrink: 0;
}

.alert-desc {
    font-size: 0.75rem;
    color: #c4956a;
    margin-top: 0.2rem;
    line-height: 1.4;
}

.alert-source {
    display: inline-block;
    font-size: 0.7rem;
    color: #c4956a;
    text-decoration: none;
    margin-top: 0.3rem;
    font-weight: 500;
}
```

Old:
```css
.alert-source:hover {
    text-decoration: underline;
}

.no-alerts {
    color: #4ade80;
    font-weight: 500;
    font-size: 0.9rem;
    padding: 0.5rem 0;
}
```

Keep these unchanged.

- [ ] **Step 12: Replace flow guide colors**

Old:
```css
.flow-guide-row {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.55rem 0;
    border-bottom: 1px solid rgba(148, 163, 184, 0.06);
}
```

New:
```css
.flow-guide-row {
    display: flex;
    align-items: flex-start;
    gap: 0.65rem;
    padding: 0.55rem 0;
    border-bottom: 1px solid rgba(196, 149, 106, 0.06);
}
```

Old:
```css
.flow-guide-range {
    font-size: 0.75rem;
    color: #94a3b8;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.flow-guide-desc {
    font-size: 0.72rem;
    color: #64748b;
    margin-top: 0.1rem;
    line-height: 1.4;
}

.flow-guide-note {
    margin-top: 0.75rem;
    padding-top: 0.65rem;
    border-top: 1px solid rgba(148, 163, 184, 0.1);
    font-size: 0.68rem;
    color: #475569;
    line-height: 1.5;
}
```

New:
```css
.flow-guide-range {
    font-size: 0.75rem;
    color: #c4956a;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
}

.flow-guide-desc {
    font-size: 0.72rem;
    color: #8b7355;
    margin-top: 0.1rem;
    line-height: 1.4;
}

.flow-guide-note {
    margin-top: 0.75rem;
    padding-top: 0.65rem;
    border-top: 1px solid rgba(196, 149, 106, 0.1);
    font-size: 0.68rem;
    color: #78716c;
    line-height: 1.5;
}
```

- [ ] **Step 13: Replace seasonal context and chart colors**

Old (there are two `.seasonal-context` rules — replace both with one):
```css
.seasonal-context {
    font-size: 0.75rem;
    color: #64748b;
    text-align: center;
    margin-top: 0.75rem;
    font-style: italic;
}

.seasonal-context {
    font-size: 0.8rem;
    color: #78716c;
    text-align: center;
    margin-top: 0.75rem;
    font-style: italic;
}
```

New (single rule):
```css
.seasonal-context {
    font-size: 0.8rem;
    color: #8b7355;
    text-align: center;
    margin-top: 0.75rem;
    font-style: italic;
}
```

- [ ] **Step 14: Replace footer colors**

Old:
```css
footer {
    max-width: 640px;
    margin: 0 auto;
    padding: 1.5rem 1rem 2rem;
    text-align: center;
    font-size: 0.7rem;
    color: #475569;
}
```

New:
```css
footer {
    max-width: 640px;
    margin: 0 auto;
    padding: 1.5rem 1rem 2rem;
    text-align: center;
    font-size: 0.7rem;
    color: #78716c;
}
```

Old:
```css
footer a {
    color: #64748b;
    text-decoration: none;
}

footer a:hover {
    color: #94a3b8;
    text-decoration: underline;
}

#last-updated {
    margin-top: 0.25rem;
    color: #475569;
}
```

New:
```css
footer a {
    color: #8b7355;
    text-decoration: none;
}

footer a:hover {
    color: #c4956a;
    text-decoration: underline;
}

#last-updated {
    margin-top: 0.25rem;
    color: #78716c;
}
```

- [ ] **Step 15: Commit palette swap**

```bash
git add docs/style.css
git commit -m "Apply warm earth palette and smoky glass card styling"
```

---

### Task 3: CSS Animations

**Files:**
- Modify: `docs/style.css`

- [ ] **Step 1: Add animation keyframes**

Append these rules at the end of `docs/style.css`, before the `/* Responsive */` media query:

```css
/* Animations */
@keyframes fadeUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes glowPulse-open {
    0%, 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.1); }
    50% { box-shadow: 0 0 20px 0 rgba(34, 197, 94, 0.3); }
}

@keyframes glowPulse-caution {
    0%, 100% { box-shadow: 0 0 0 0 rgba(234, 179, 8, 0.1); }
    50% { box-shadow: 0 0 20px 0 rgba(234, 179, 8, 0.3); }
}

@keyframes glowPulse-dangerous {
    0%, 100% { box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.1); }
    50% { box-shadow: 0 0 20px 0 rgba(249, 115, 22, 0.3); }
}

@keyframes glowPulse-closed {
    0%, 100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.1); }
    50% { box-shadow: 0 0 20px 0 rgba(239, 68, 68, 0.3); }
}

@keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-4px); }
}

.card, .status-card {
    animation: fadeUp 400ms ease-out both;
}

.status-card.open { animation: fadeUp 400ms ease-out both, glowPulse-open 3s ease-in-out infinite; }
.status-card.caution { animation: fadeUp 400ms ease-out both, glowPulse-caution 3s ease-in-out infinite; }
.status-card.dangerous { animation: fadeUp 400ms ease-out both, glowPulse-dangerous 3s ease-in-out infinite; }
.status-card.closed { animation: fadeUp 400ms ease-out both, glowPulse-closed 3s ease-in-out infinite; }

.trend-arrow {
    display: inline-block;
    animation: bounce 600ms ease-in-out;
}

@media (prefers-reduced-motion: reduce) {
    .card, .status-card,
    .status-card.open, .status-card.caution,
    .status-card.dangerous, .status-card.closed,
    .trend-arrow {
        animation: none;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add docs/style.css
git commit -m "Add entrance animations, glow pulse, and trend bounce"
```

---

### Task 4: Responsive Layout Breakpoints

**Files:**
- Modify: `docs/style.css`
- Modify: `docs/app.js` (add wrapper classes for grid layout)

- [ ] **Step 1: Update main container to be responsive**

In `docs/style.css`, replace the `main` rule:

Old:
```css
main {
    max-width: 640px;
    margin: 0 auto;
    padding: 0.75rem;
}
```

New:
```css
main {
    max-width: 640px;
    margin: 0 auto;
    padding: 0.75rem;
}
```

Then replace the entire `/* Responsive */` section (from `@media (max-width: 400px)` to end of file) with:

```css
/* Responsive */
@media (max-width: 400px) {
    .river-stats {
        gap: 0.35rem;
    }

    .stat-value {
        font-size: 1.25rem;
    }

    .forecast-grid {
        gap: 0.35rem;
    }
}

@media (min-width: 640px) {
    main {
        max-width: 800px;
    }

    footer {
        max-width: 800px;
    }

    .tablet-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
    }

    .tablet-row > .card {
        margin-bottom: 0;
    }
}

@media (min-width: 1024px) {
    main {
        max-width: 960px;
    }

    footer {
        max-width: 960px;
    }

    .desktop-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;
    }

    .desktop-grid > .card {
        margin-bottom: 0;
    }

    .desktop-col {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
    }

    .desktop-col > .card {
        margin-bottom: 0;
    }
}
```

- [ ] **Step 2: Update app.js to wrap cards in responsive grid containers**

In `docs/app.js`, replace the `app.innerHTML` block in the `init()` function:

Old:
```javascript
        app.innerHTML = [
            renderStatus(data),
            renderHikeForecast(data.hikeForecast),
            renderRiver(data.river),
            renderFlowGuide(),
            renderWeather(data.weather),
            renderChart(data.river.history, forecast, historical),
            renderAlerts(data.alerts),
        ].join("");
```

New:
```javascript
        app.innerHTML = [
            renderStatus(data),
            `<div class="tablet-row">${renderRiver(data.river)}${renderWeather(data.weather)}</div>`,
            `<div class="desktop-grid">`,
                `<div class="desktop-col">`,
                    renderChart(data.river.history, forecast, historical),
                    renderFlowGuide(),
                `</div>`,
                `<div class="desktop-col">`,
                    renderHikeForecast(data.hikeForecast),
                    renderAlerts(data.alerts),
                `</div>`,
            `</div>`,
        ].join("");
```

- [ ] **Step 3: Add staggered animation delays to cards**

In `docs/app.js`, add this function after the `init()` function's `createChart` call, before the `if (data.lastUpdated)` check:

```javascript
        // Stagger card entry animations
        const cards = app.querySelectorAll('.card, .status-card');
        cards.forEach((card, i) => {
            card.style.animationDelay = `${i * 50}ms`;
        });
```

- [ ] **Step 4: Commit**

```bash
git add docs/style.css docs/app.js
git commit -m "Add responsive breakpoints and staggered card animations"
```

---

### Task 5: Chart Recoloring

**Files:**
- Modify: `docs/app.js`

- [ ] **Step 1: Recolor the threshold bands plugin**

In `docs/app.js`, replace the `bands` array inside `thresholdBandsPlugin.beforeDraw`:

Old:
```javascript
        const bands = [
            { min: 0, max: 50, color: "rgba(34, 197, 94, 0.06)" },
            { min: 50, max: 100, color: "rgba(234, 179, 8, 0.06)" },
            { min: 100, max: 150, color: "rgba(249, 115, 22, 0.06)" },
            { min: 150, max: Infinity, color: "rgba(239, 68, 68, 0.06)" },
        ];
```

New:
```javascript
        const bands = [
            { min: 0, max: 50, color: "rgba(34, 197, 94, 0.04)" },
            { min: 50, max: 100, color: "rgba(234, 179, 8, 0.04)" },
            { min: 100, max: 150, color: "rgba(249, 115, 22, 0.04)" },
            { min: 150, max: Infinity, color: "rgba(239, 68, 68, 0.04)" },
        ];
```

- [ ] **Step 2: Recolor the "Now" line plugin**

In `docs/app.js`, replace the stroke and fill colors in `nowLinePlugin.afterDraw`:

Old:
```javascript
        ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
```

New:
```javascript
        ctx.strokeStyle = "rgba(196, 149, 106, 0.5)";
```

Old:
```javascript
        ctx.fillStyle = "#94a3b8";
```

New:
```javascript
        ctx.fillStyle = "#c4956a";
```

- [ ] **Step 3: Recolor the actual flow dataset**

In `docs/app.js`, in the `createChart` function, replace the first dataset object:

Old:
```javascript
    const datasets = [{
        label: "Actual Flow",
        data: actualData,
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56, 189, 248, 0.08)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: "#38bdf8",
        borderWidth: 2.5,
    }];
```

New:
```javascript
    const datasets = [{
        label: "Actual Flow",
        data: actualData,
        borderColor: "#c4956a",
        backgroundColor: "rgba(196, 149, 106, 0.15)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: "#c4956a",
        borderWidth: 2.5,
    }];
```

- [ ] **Step 4: Recolor the forecast dataset**

Old:
```javascript
        datasets.push({
            label: "Forecast",
            data: forecastData,
            borderColor: "#fbbf24",
            borderDash: [6, 4],
            backgroundColor: "rgba(251, 191, 36, 0.06)",
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: "#fbbf24",
            borderWidth: 2,
        });
```

New:
```javascript
        datasets.push({
            label: "Forecast",
            data: forecastData,
            borderColor: "#d4a574",
            borderDash: [6, 4],
            backgroundColor: "rgba(212, 165, 116, 0.08)",
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            pointHoverRadius: 4,
            pointHoverBackgroundColor: "#d4a574",
            borderWidth: 2,
        });
```

- [ ] **Step 5: Recolor historical bands**

Old:
```javascript
        datasets.push({
            label: "Typical range (p75)",
            data: p75Data,
            borderColor: "rgba(148, 163, 184, 0.15)",
            borderWidth: 1,
            borderDash: [3, 3],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
        });
        datasets.push({
            label: "Typical range (p25)",
            data: p25Data,
            borderColor: "rgba(148, 163, 184, 0.15)",
            borderWidth: 1,
            borderDash: [3, 3],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: "-1",
            backgroundColor: "rgba(148, 163, 184, 0.08)",
        });
```

New:
```javascript
        datasets.push({
            label: "Typical range (p75)",
            data: p75Data,
            borderColor: "rgba(139, 115, 85, 0.2)",
            borderWidth: 1,
            borderDash: [3, 3],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
        });
        datasets.push({
            label: "Typical range (p25)",
            data: p25Data,
            borderColor: "rgba(139, 115, 85, 0.2)",
            borderWidth: 1,
            borderDash: [3, 3],
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: "-1",
            backgroundColor: "rgba(139, 112, 64, 0.1)",
        });
```

- [ ] **Step 6: Recolor chart options (legend, tooltip, axes)**

Replace the `options` object in the chart config:

Old legend labels color:
```javascript
                        color: "#94a3b8",
```

New:
```javascript
                        color: "#8b7355",
```

Old tooltip:
```javascript
                tooltip: {
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    borderColor: "rgba(148, 163, 184, 0.2)",
                    borderWidth: 1,
                    titleColor: "#e2e8f0",
                    bodyColor: "#94a3b8",
```

New:
```javascript
                tooltip: {
                    backgroundColor: "rgba(28, 25, 23, 0.95)",
                    borderColor: "rgba(196, 149, 106, 0.2)",
                    borderWidth: 1,
                    titleColor: "#ede0d4",
                    bodyColor: "#c4956a",
```

Old x-axis ticks:
```javascript
                    ticks: { maxTicksLimit: 10, font: { size: 10 }, color: "#64748b", maxRotation: 45 },
```

New:
```javascript
                    ticks: { maxTicksLimit: 10, font: { size: 10 }, color: "#8b7355", maxRotation: 45 },
```

Old y-axis:
```javascript
                    ticks: {
                        font: { size: 11 },
                        color: "#64748b",
                        callback: val => val + " CFS",
                    },
                    grid: { color: "rgba(148, 163, 184, 0.06)" },
```

New:
```javascript
                    ticks: {
                        font: { size: 11 },
                        color: "#8b7355",
                        callback: val => val + " CFS",
                    },
                    grid: { color: "rgba(139, 115, 85, 0.15)" },
```

- [ ] **Step 7: Add chart animation config**

In the chart `options` object, add an `animation` key at the top level (inside `options`, before `responsive`):

```javascript
            animation: {
                duration: 1200,
                easing: "easeOutQuart",
            },
```

- [ ] **Step 8: Commit**

```bash
git add docs/app.js
git commit -m "Recolor chart to warm earth palette"
```

---

### Task 6: Number Counters, Parallax, and Trend Arrow

**Files:**
- Modify: `docs/app.js`

- [ ] **Step 1: Add animateValue utility function**

Add this function at the top of `docs/app.js`, after the constant declarations (after the `RATING_LABELS` object):

```javascript
function animateValue(element, target, decimals, duration = 800) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        element.textContent = target.toFixed(decimals);
        return;
    }
    const start = performance.now();
    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        const current = target * eased;
        element.textContent = current.toFixed(decimals);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}
```

- [ ] **Step 2: Add parallax scroll listener**

Add this function after `animateValue`:

```javascript
function initParallax() {
    const bgImage = document.querySelector('.bg-image');
    if (!bgImage || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(() => {
                const scrollY = window.scrollY;
                bgImage.style.transform = `scale(1.1) translateY(${scrollY * 0.3}px)`;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}
```

- [ ] **Step 3: Wrap trend arrow in a span for CSS animation**

In `docs/app.js`, in the `renderRiver` function, update the trend stat to wrap the arrow in a `<span class="trend-arrow">`:

Old:
```javascript
                <div class="stat">
                    <div class="stat-value ${trendClass}">${arrow} ${trendLabel}</div>
                    <div class="stat-label">Trend</div>
                </div>
```

New:
```javascript
                <div class="stat">
                    <div class="stat-value ${trendClass}"><span class="trend-arrow">${arrow}</span> ${trendLabel}</div>
                    <div class="stat-label">Trend</div>
                </div>
```

- [ ] **Step 4: Add data attributes for animated counters**

In `renderRiver`, update the CFS and gauge height stat-value divs to include data attributes:

Old:
```javascript
                <div class="stat">
                    <div class="stat-value">${cfs}</div>
                    <div class="stat-label">Flow (CFS)</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${height}<span class="stat-unit"> ft</span></div>
                    <div class="stat-label">Gauge Height</div>
                </div>
```

New:
```javascript
                <div class="stat">
                    <div class="stat-value" data-animate="${river.currentCfs}" data-decimals="1">${cfs}</div>
                    <div class="stat-label">Flow (CFS)</div>
                </div>
                <div class="stat">
                    <div class="stat-value" data-animate="${river.gaugeHeight}" data-decimals="2">${height}<span class="stat-unit"> ft</span></div>
                    <div class="stat-label">Gauge Height</div>
                </div>
```

In `renderWeather`, update the temperature display:

Old:
```javascript
                    <div class="weather-temp">${temp}</div>
```

New:
```javascript
                    <div class="weather-temp" data-animate="${weather.currentTemp != null ? Math.round(weather.currentTemp) : ''}" data-decimals="0" data-suffix="°F">${temp}</div>
```

- [ ] **Step 5: Trigger animated counters and parallax in init()**

In the `init()` function, after the staggered animation delays block, add:

```javascript
        // Animate number counters
        app.querySelectorAll('[data-animate]').forEach(el => {
            const target = parseFloat(el.dataset.animate);
            if (isNaN(target)) return;
            const decimals = parseInt(el.dataset.decimals) || 0;
            const suffix = el.dataset.suffix || '';
            const unit = el.querySelector('.stat-unit');
            animateValue(el, target, decimals);
            if (suffix) {
                const orig = el.textContent;
                const observer = new MutationObserver(() => {
                    if (!el.textContent.endsWith(suffix)) {
                        el.textContent = el.textContent + suffix;
                    }
                });
                observer.observe(el, { childList: true, characterData: true, subtree: true });
                // Suffix will be appended by animateValue textContent updates
                setTimeout(() => observer.disconnect(), 1000);
            }
            if (unit) {
                // Re-append the unit span after animation completes
                setTimeout(() => {
                    const val = el.textContent;
                    el.innerHTML = val + '<span class="stat-unit"> ft</span>';
                }, 850);
            }
        });

        // Initialize parallax
        initParallax();
```

- [ ] **Step 6: Commit**

```bash
git add docs/app.js
git commit -m "Add number counters, parallax scroll, and trend arrow bounce"
```

---

### Task 7: Recolor Hardcoded Colors in app.js

**Files:**
- Modify: `docs/app.js`

- [ ] **Step 1: Update error state colors**

In the `catch` block of `init()`:

Old:
```javascript
        app.innerHTML = `<div class="card" style="text-align:center;color:#ef4444">
            <p>Unable to load status data.</p>
            <p style="font-size:0.8rem;color:#64748b;margin-top:0.5rem">${err.message}</p>
        </div>`;
```

New:
```javascript
        app.innerHTML = `<div class="card" style="text-align:center;color:#ef4444">
            <p>Unable to load status data.</p>
            <p style="font-size:0.8rem;color:#8b7355;margin-top:0.5rem">${err.message}</p>
        </div>`;
```

- [ ] **Step 2: Commit**

```bash
git add docs/app.js
git commit -m "Update remaining hardcoded colors in app.js"
```

---

### Task 8: Visual Verification

- [ ] **Step 1: Serve the site locally and verify**

```bash
cd /Users/chinmay/conductor/workspaces/zion-narrows-tracker/copenhagen/docs && python3 -m http.server 8080
```

Open `http://localhost:8080` in a browser. Verify:

1. Background image is visible but heavily blurred and darkened
2. Cards have smoky glass effect (semi-transparent with blur)
3. All text is warm cream/amber tones, no cyan/blue remnants
4. Status card pulses with appropriate glow color
5. Cards animate in with staggered fade-up on page load
6. Flow chart uses amber/sand colors
7. Number counters animate from 0 to their values
8. Scrolling creates subtle parallax on the background
9. Layout responds at 640px and 1024px breakpoints
10. Trend arrow has a bounce animation

- [ ] **Step 2: Kill the server**

```bash
# Ctrl+C or kill the process
```

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A docs/
git commit -m "Visual refresh: final adjustments"
```
