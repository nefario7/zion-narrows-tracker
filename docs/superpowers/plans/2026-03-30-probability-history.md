# Probability History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a history icon to the closure risk panel that shows a hover dialog with a sparkline and timestamped list of past probability snapshots (last 7 days).

**Architecture:** Python backend appends a snapshot to `closureRiskHistory[]` in `data.json` on each run, trimming to 7 days. Frontend adds a clock icon to the panel header; hovering shows an absolutely-positioned dialog with a canvas sparkline and scrollable snapshot list.

**Tech Stack:** Python (datetime, json), vanilla JS (Canvas API), CSS

---

### File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `scripts/fetch_data.py` | Modify (lines 750-757) | Read existing history, append snapshot, trim, write |
| `docs/app.js` | Modify (lines 102-193) | Render history icon, dialog, sparkline, snapshot list |
| `docs/style.css` | Modify (append) | Styles for icon, dialog, sparkline, list |

---

### Task 1: Accumulate history snapshots in `fetch_data.py`

**Files:**
- Modify: `scripts/fetch_data.py:750-757`

- [ ] **Step 1: Read existing history from data.json before writing**

Insert this code at line 750, right after `result["closureRisk"] = closure_risk` (line 752) and before `output_path = ...` (line 754):

```python
    # Accumulate closure risk history
    closure_risk_history = []
    output_path = os.path.abspath(OUTPUT_PATH)
    if os.path.exists(output_path):
        try:
            with open(output_path, "r") as f:
                existing = json.load(f)
            closure_risk_history = existing.get("closureRiskHistory", [])
        except (json.JSONDecodeError, IOError):
            closure_risk_history = []

    if closure_risk:
        cutoff = datetime.now(timezone.utc) - timedelta(days=7)
        closure_risk_history = [
            entry for entry in closure_risk_history
            if datetime.fromisoformat(entry["timestamp"]) > cutoff
        ]
        closure_risk_history.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "peakEnsemble": closure_risk["summary"]["next10DayMax"],
            "label": closure_risk["summary"]["label"],
        })

    result["closureRiskHistory"] = closure_risk_history
```

And remove the duplicate `output_path = os.path.abspath(OUTPUT_PATH)` that already exists on line 754, since it's now declared above.

- [ ] **Step 2: Verify the import for `timedelta` exists**

Check line 1 area of `fetch_data.py`. `timedelta` is already imported via `from datetime import datetime, timezone`. Add `timedelta` to that import if missing:

```python
from datetime import datetime, timezone, timedelta
```

- [ ] **Step 3: Run the script to verify it works**

Run: `cd /Users/chinmay/conductor/workspaces/zion-narrows-tracker/quebec && python scripts/fetch_data.py`

Expected: Script completes, `docs/data.json` now contains a `closureRiskHistory` array with one entry.

- [ ] **Step 4: Verify the output**

Run: `python -c "import json; d=json.load(open('docs/data.json')); print(json.dumps(d.get('closureRiskHistory', []), indent=2))"`

Expected: Array with one object containing `timestamp`, `peakEnsemble`, `label`.

- [ ] **Step 5: Commit**

```bash
git add scripts/fetch_data.py
git commit -m "feat: accumulate closure risk history snapshots in data.json"
```

---

### Task 2: Add history icon and dialog HTML to `renderClosureRisk`

**Files:**
- Modify: `docs/app.js:102-193`

- [ ] **Step 1: Add history rendering function after `renderClosureRisk`**

Insert this new function after line 193 (end of `renderClosureRisk`):

```javascript
function renderClosureRiskHistory(history) {
    if (!history || history.length < 2) return "";

    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

    function historyRiskColor(val) {
        if (val == null) return "#64748b";
        if (val < 15) return "#22c55e";
        if (val < 40) return "#eab308";
        if (val < 65) return "#f97316";
        return "#ef4444";
    }

    const rows = [...history].reverse().map(entry => {
        const d = new Date(entry.timestamp);
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const timeStr = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
        const color = historyRiskColor(entry.peakEnsemble);
        return `<div class="history-row">
            <span class="history-date">${dateStr}, ${timeStr}</span>
            <span class="history-value" style="color:${color}">${Math.round(entry.peakEnsemble)}% ${entry.label}</span>
        </div>`;
    }).join("");

    return `
        <div class="risk-history-trigger">
            <span class="risk-history-icon">${iconSvg}</span>
            <div class="risk-history-dialog">
                <div class="history-title">Probability History</div>
                <canvas class="history-sparkline" width="248" height="50"></canvas>
                <div class="history-list">${rows}</div>
            </div>
        </div>
    `;
}
```

- [ ] **Step 2: Insert the history icon into the closure risk card header**

In the `renderClosureRisk` function, modify the `<h2>` line (line 166) to include the history icon. Replace:

```javascript
            <h2>10-Day Closure Risk</h2>
```

With:

```javascript
            <h2>10-Day Closure Risk${renderClosureRiskHistory(window.__closureRiskHistory)}</h2>
```

- [ ] **Step 3: Store history data on window for the render function**

Find the `init()` function where `renderClosureRisk(data.closureRisk)` is called. Add this line right before it:

```javascript
        window.__closureRiskHistory = data.closureRiskHistory;
```

- [ ] **Step 4: Add sparkline drawing logic**

Add this function after `renderClosureRiskHistory`:

```javascript
function drawHistorySparkline() {
    const canvas = document.querySelector(".history-sparkline");
    if (!canvas) return;
    const history = window.__closureRiskHistory;
    if (!history || history.length < 2) return;

    const ctx = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const padding = { top: 8, bottom: 8, left: 4, right: 4 };

    const values = history.map(e => e.peakEnsemble);
    const minVal = 0;
    const maxVal = 100;

    ctx.clearRect(0, 0, w, h);

    // Draw line
    ctx.beginPath();
    ctx.strokeStyle = "#c4956a";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";

    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    values.forEach((val, i) => {
        const x = padding.left + (i / (values.length - 1)) * plotW;
        const y = padding.top + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw dots
    values.forEach((val, i) => {
        const x = padding.left + (i / (values.length - 1)) * plotW;
        const y = padding.top + plotH - ((val - minVal) / (maxVal - minVal)) * plotH;
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fillStyle = "#c4956a";
        ctx.fill();
    });
}
```

- [ ] **Step 5: Call sparkline drawing after DOM render**

Find where the cards are inserted into the DOM (in `init()`, after the innerHTML is set). Add after the DOM update:

```javascript
        drawHistorySparkline();
```

Also add it inside any `mouseenter`/hover listener setup. Since the canvas is in a hidden dialog, we need to draw when shown. Add after `drawHistorySparkline()`:

```javascript
        // Redraw sparkline when dialog becomes visible
        document.addEventListener("mouseenter", function(e) {
            if (e.target.closest && e.target.closest(".risk-history-trigger")) {
                setTimeout(drawHistorySparkline, 10);
            }
        }, true);
```

- [ ] **Step 6: Commit**

```bash
git add docs/app.js
git commit -m "feat: add closure risk history icon, dialog, and sparkline"
```

---

### Task 3: Add CSS styles for history icon, dialog, and list

**Files:**
- Modify: `docs/style.css` (append at end)

- [ ] **Step 1: Add all history styles**

Append to end of `docs/style.css`:

```css
/* Closure Risk History */
.closure-risk-card h2 {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
}

.risk-history-trigger {
    position: absolute;
    right: 0;
    top: 50%;
    transform: translateY(-50%);
    cursor: pointer;
}

.risk-history-icon {
    display: flex;
    align-items: center;
    color: #c4956a;
    opacity: 0.6;
    transition: opacity 0.2s ease;
}

.risk-history-trigger:hover .risk-history-icon {
    opacity: 1;
}

.risk-history-dialog {
    display: none;
    position: absolute;
    right: 0;
    top: calc(100% + 8px);
    width: 280px;
    background: rgba(18, 10, 6, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(196, 149, 106, 0.15);
    border-radius: 12px;
    padding: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
    z-index: 100;
    text-align: left;
}

.risk-history-trigger:hover .risk-history-dialog {
    display: block;
}

.history-title {
    font-size: 0.75rem;
    font-weight: 600;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 12px;
}

.history-sparkline {
    width: 100%;
    height: 50px;
    margin-bottom: 12px;
}

.history-list {
    max-height: 200px;
    overflow-y: auto;
}

.history-list::-webkit-scrollbar {
    width: 4px;
}

.history-list::-webkit-scrollbar-track {
    background: transparent;
}

.history-list::-webkit-scrollbar-thumb {
    background: rgba(196, 149, 106, 0.2);
    border-radius: 2px;
}

.history-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 0;
    border-bottom: 1px solid rgba(196, 149, 106, 0.08);
    font-size: 13px;
}

.history-row:last-child {
    border-bottom: none;
}

.history-date {
    color: #94a3b8;
}

.history-value {
    font-weight: 600;
    white-space: nowrap;
}

@media (max-width: 600px) {
    .risk-history-dialog {
        width: 260px;
        right: -8px;
    }
}
```

- [ ] **Step 2: Commit**

```bash
git add docs/style.css
git commit -m "feat: add styles for closure risk history dialog"
```

---

### Task 4: Add mobile tap support

**Files:**
- Modify: `docs/app.js` (in the init section, after sparkline setup)

- [ ] **Step 1: Add tap-to-toggle for mobile**

Add this code after the sparkline event listener setup in `init()`:

```javascript
        // Mobile: tap to toggle history dialog
        document.addEventListener("click", function(e) {
            const trigger = e.target.closest(".risk-history-trigger");
            const dialog = document.querySelector(".risk-history-dialog");
            if (!dialog) return;

            if (trigger) {
                const isVisible = dialog.style.display === "block";
                dialog.style.display = isVisible ? "none" : "block";
                if (!isVisible) setTimeout(drawHistorySparkline, 10);
                e.stopPropagation();
            } else if (!e.target.closest(".risk-history-dialog")) {
                dialog.style.display = "";
            }
        });
```

- [ ] **Step 2: Update CSS to handle mobile display override**

The CSS hover rule already handles desktop. The JS click handler sets `display: block` inline for mobile, and clears it (back to CSS control) on outside click. No CSS changes needed.

- [ ] **Step 3: Commit**

```bash
git add docs/app.js
git commit -m "feat: add mobile tap support for history dialog"
```

---

### Task 5: Verify end-to-end

- [ ] **Step 1: Run the fetch script**

```bash
cd /Users/chinmay/conductor/workspaces/zion-narrows-tracker/quebec && python scripts/fetch_data.py
```

Expected: completes successfully, `data.json` has `closureRiskHistory` array.

- [ ] **Step 2: Open the site locally and verify**

```bash
cd docs && python -m http.server 8080
```

Open `http://localhost:8080`. Verify:
- Clock icon appears in top-right of "10-Day Closure Risk" header
- Hovering shows the dialog with title, sparkline canvas, and one history entry
- On narrow viewport / mobile emulation, tapping works

- [ ] **Step 3: Final commit if any fixes needed**

```bash
git add -A && git commit -m "fix: polish history dialog"
```
