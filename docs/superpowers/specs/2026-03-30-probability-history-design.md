# Probability History — Design Spec

## Goal

Let users see how the 10-day closure risk headline number (peak ensemble probability) has changed over time, directly from the existing closure risk panel. A history icon in the panel header reveals a hover dialog with a sparkline and timestamped snapshot list.

## Data Layer — `fetch_data.py`

### New field: `closureRiskHistory`

After computing `closureRisk`, the script reads the existing `data.json`, extracts any prior `closureRiskHistory` array, appends the current run's snapshot, trims entries older than 7 days, and writes the updated array back.

**Snapshot schema:**

```json
{
  "timestamp": "2026-03-29T18:10:29+00:00",
  "peakEnsemble": 38.1,
  "label": "Moderate"
}
```

**Array location in `data.json`:**

```json
{
  "closureRisk": { ... },
  "closureRiskHistory": [
    { "timestamp": "...", "peakEnsemble": 38.1, "label": "Moderate" },
    ...
  ]
}
```

### Retention

- Keep snapshots from the last 7 days only.
- The script runs every 12 hours, so ~14 entries max.
- On first run (no existing history), the array starts with a single entry.

### Implementation details

- Read existing `data.json` before writing (already overwritten at end of script — just read before that point).
- Use `datetime.now(timezone.utc) - timedelta(days=7)` as the cutoff.
- Append new snapshot with values from the just-computed `closureRisk.summary`.

## UI Layer — `app.js`

### History icon

- Small inline SVG clock icon, placed in the top-right of the `.closure-risk-card` header area (next to the title).
- Size: 18×18px. Color: `#c4956a` (accent), with hover brightness increase.
- Cursor: pointer.

### Hover dialog

Triggered on `mouseenter` of the icon; dismissed on `mouseleave` of the dialog (with a small grace area so the cursor can move from icon to dialog).

**Layout (top to bottom):**

1. **Header:** "Probability History" — small, muted text.
2. **Sparkline:** `<canvas>` element, ~220×50px.
   - Line plot of `peakEnsemble` values over time.
   - Line color: `#c4956a` (accent).
   - Small filled dots at each data point.
   - Y-axis range: 0–100 (probability percentage). No axis labels — the list below provides exact numbers.
   - X-axis: evenly spaced by entry index (not time-proportional — entries are roughly equidistant at 12h intervals).
3. **Snapshot list:** Scrollable container, max-height ~200px.
   - Newest first.
   - Each row: `"Mar 28, 6:00 PM — 38.1% Moderate"`
   - Percentage text colored by risk level:
     - `#22c55e` (green): < 15%
     - `#eab308` (yellow): 15–39%
     - `#f97316` (orange): 40–64%
     - `#ef4444` (red): 65%+
   - Risk label uses the same color as the percentage.

**Positioning:**

- Absolutely positioned, anchored to the icon.
- Appears to the left or below the icon depending on available space (simple right-aligned dropdown by default).
- Z-index above other cards.

### Mobile behavior

- On touch devices, the icon triggers on `click`/`tap`.
- Dialog dismisses on tap outside (add a one-time `document.addEventListener('click', ...)` when opened).

### Empty/insufficient state

- If `closureRiskHistory` is missing or has fewer than 2 entries, hide the history icon entirely (no point showing a sparkline with one dot).

## Styling — `style.css`

### Dialog

- Background: `rgba(18, 10, 6, 0.95)` with `backdrop-filter: blur(20px)`.
- Border: `1px solid rgba(196, 149, 106, 0.15)`.
- Border-radius: `12px`.
- Padding: `16px`.
- Width: `280px`.
- Box-shadow: `0 8px 32px rgba(0, 0, 0, 0.4)`.

### Sparkline canvas

- Width: 100% of dialog content area.
- Height: 50px.
- Margin-bottom: 12px.

### Snapshot list

- Font-size: 13px.
- Row padding: 6px 0.
- Border-bottom on each row: `1px solid rgba(196, 149, 106, 0.08)`.
- Scrollbar: thin, styled to match dark theme.

### Icon

- Positioned absolute, top-right of card header.
- Opacity: 0.6 default, 1.0 on hover.
- Transition: opacity 0.2s ease.

## Files changed

| File | Change |
|------|--------|
| `scripts/fetch_data.py` | Read existing history, append snapshot, trim to 7 days, write to output |
| `docs/app.js` | Add `renderClosureRiskHistory()`, sparkline drawing, hover dialog logic |
| `docs/style.css` | Add styles for history icon, dialog, sparkline, snapshot list |

## Out of scope

- Per-day history (only the headline peak ensemble number is tracked).
- Exporting or downloading history data.
- Persisting history beyond what's in `data.json` (no separate database).
