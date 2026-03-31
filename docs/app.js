const TREND_ARROWS = { rising: "\u2191", falling: "\u2193", stable: "\u2192" };
const TREND_LABELS = { rising: "Rising", falling: "Falling", stable: "Stable" };
const TREND_CLASSES = { rising: "trend-rising", falling: "trend-falling", stable: "trend-stable" };
const WEATHER_DESCRIPTIONS = {
    0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow",
    75: "Heavy snow", 80: "Rain showers", 81: "Rain showers", 82: "Heavy showers",
    85: "Snow showers", 86: "Heavy snow showers", 95: "Thunderstorm",
    96: "Thunderstorm w/ hail", 99: "Thunderstorm w/ heavy hail",
};
const WEATHER_ICONS = {
    0: "\u2600\ufe0f", 1: "\ud83c\udf24\ufe0f", 2: "\u26c5", 3: "\u2601\ufe0f",
    45: "\ud83c\udf2b\ufe0f", 48: "\ud83c\udf2b\ufe0f",
    51: "\ud83c\udf27\ufe0f", 53: "\ud83c\udf27\ufe0f", 55: "\ud83c\udf27\ufe0f",
    61: "\ud83c\udf26\ufe0f", 63: "\ud83c\udf27\ufe0f", 65: "\ud83c\udf27\ufe0f",
    71: "\ud83c\udf28\ufe0f", 73: "\u2744\ufe0f", 75: "\u2744\ufe0f",
    80: "\ud83c\udf26\ufe0f", 81: "\ud83c\udf27\ufe0f", 82: "\ud83c\udf27\ufe0f",
    85: "\ud83c\udf28\ufe0f", 86: "\ud83c\udf28\ufe0f",
    95: "\u26c8\ufe0f", 96: "\u26c8\ufe0f", 99: "\u26c8\ufe0f",
};
const RATING_COLORS = {
    great: "#22c55e", good: "#86efac", fair: "#eab308", poor: "#f97316", closed: "#ef4444",
};
const RATING_LABELS = {
    great: "Great", good: "Good", fair: "Fair", poor: "Poor", closed: "Closed",
};

function animateValue(element, target, decimals, duration = 800) {
    return new Promise(resolve => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
            element.textContent = target.toFixed(decimals);
            resolve();
            return;
        }
        const start = performance.now();
        function update(now) {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = target * eased;
            element.textContent = current.toFixed(decimals);
            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                resolve();
            }
        }
        requestAnimationFrame(update);
    });
}


function formatDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatShortDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatTimestamp(iso) {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
        timeZone: "America/Denver",
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
    }) + " MT";
}

function renderStatus(data) {
    const cfs = data.river.currentCfs != null ? data.river.currentCfs : 0;

    // Gauge marker position: 0–150+ CFS mapped to 0–100%
    const markerPct = Math.min(cfs / 150 * 100, 100);

    return `
        <div class="status-card ${data.status}">
            <div class="status-label">${data.status}</div>
            <div class="status-gauge">
                <div class="status-gauge-labels">
                    <span>0 CFS</span>
                    <span>150+ CFS</span>
                </div>
                <div class="status-gauge-track">
                    <div class="status-gauge-seg status-gauge-green"></div>
                    <div class="status-gauge-seg status-gauge-yellow"></div>
                    <div class="status-gauge-seg status-gauge-red"></div>
                    <div class="status-gauge-marker" style="left:${markerPct}%"></div>
                </div>
                <div class="status-gauge-value">
                    <span class="status-gauge-cfs">${Math.round(cfs)} CFS</span>
                    <span class="status-gauge-desc">${data.statusReason.split("—").slice(1).join("—").trim() || data.statusReason}</span>
                </div>
            </div>
        </div>
    `;
}

function renderClosureRisk(closureRisk) {
    if (!closureRisk || !closureRisk.daily) return "";

    const summary = closureRisk.summary || {};
    const maxProb = summary.next10DayMax || 0;
    const label = summary.label || "Unknown";

    const labelColors = {
        "Low": "#22c55e",
        "Moderate": "#eab308",
        "High": "#f97316",
        "Very High": "#ef4444",
    };
    const color = labelColors[label] || "#64748b";

    function riskColor(val) {
        if (val == null) return "#64748b";
        if (val < 15) return "#22c55e";
        if (val < 40) return "#eab308";
        if (val < 65) return "#f97316";
        return "#ef4444";
    }

    const barsHtml = closureRisk.daily.map(day => {
        const d = new Date(day.date + "T00:00:00");
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        const dateStr = formatShortDate(day.date);
        const ens = day.ensemble != null ? day.ensemble : (day.historical != null ? day.historical : 0);
        const barColor = riskColor(day.ensemble != null ? day.ensemble : day.historical);

        return `
            <div class="risk-day">
                <div class="risk-bar-container">
                    <div class="risk-bar" style="height:${Math.max(ens, 2)}%;background:${barColor}"></div>
                </div>
                <div class="risk-pct">${ens > 0 ? Math.round(ens) + "%" : "—"}</div>
                <div class="risk-day-name">${dayName}</div>
                <div class="risk-day-date">${dateStr}</div>
            </div>
        `;
    }).join("");

    const hasLogistic = closureRisk.daily.some(d => d.logistic != null);
    const hasGbm = closureRisk.daily.some(d => d.gbm != null);

    const modelRows = closureRisk.daily.map(day => {
        const d = new Date(day.date + "T00:00:00");
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const hist = day.historical != null ? `<span style="color:${riskColor(day.historical)}">${Math.round(day.historical)}%</span>` : "—";
        const logi = day.logistic != null ? `<span style="color:${riskColor(day.logistic)}">${Math.round(day.logistic)}%</span>` : "—";
        const gbm = day.gbm != null ? `<span style="color:${riskColor(day.gbm)}">${Math.round(day.gbm)}%</span>` : "—";
        const ens = day.ensemble != null ? `<span style="color:${riskColor(day.ensemble)}"><strong>${Math.round(day.ensemble)}%</strong></span>` : "—";

        return `<tr>
            <td>${dateStr}</td>
            <td>${hist}</td>
            ${hasLogistic ? `<td>${logi}</td>` : ""}
            ${hasGbm ? `<td>${gbm}</td>` : ""}
            <td>${ens}</td>
        </tr>`;
    }).join("");

    return `
        <div class="card closure-risk-card">
            <h2>10-Day Closure Risk${renderClosureRiskHistory(window.__closureRiskHistory)}</h2>
            <div class="risk-summary">
                <div class="risk-headline" style="color:${color}">${Math.round(maxProb)}%</div>
                <div class="risk-label" style="color:${color}">${label} Risk</div>
                <div class="risk-subtitle">Peak ensemble probability over next 10 days</div>
            </div>
            <div class="risk-chart">${barsHtml}</div>
            <details class="risk-details">
                <summary class="risk-details-toggle">Model Breakdown</summary>
                <table class="risk-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Historical</th>
                            ${hasLogistic ? '<th>Statistical</th>' : ''}
                            ${hasGbm ? '<th>ML Model</th>' : ''}
                            <th>Ensemble</th>
                        </tr>
                    </thead>
                    <tbody>${modelRows}</tbody>
                </table>
                <div class="risk-model-desc">
                    Historical: 10-year calendar frequency &bull; Statistical: Logistic regression &bull; ML Model: Gradient boosted &bull; Ensemble: Weighted blend (20/30/50%)
                </div>
            </details>
        </div>
    `;
}

function renderClosureRiskHistory(history) {
    if (!history || history.length < 2) return "";

    function riskColorHistory(val) {
        if (val == null) return "#64748b";
        if (val < 15) return "#22c55e";
        if (val < 40) return "#eab308";
        if (val < 65) return "#f97316";
        return "#ef4444";
    }

    const rows = [...history].reverse().map(entry => {
        const d = new Date(entry.timestamp);
        const dateStr = d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
        const color = riskColorHistory(entry.peakEnsemble);
        const pct = Math.round(entry.peakEnsemble);
        return `<div class="history-row"><span class="history-date">${dateStr}</span><span class="history-value" style="color:${color}">${pct}% ${entry.label}</span></div>`;
    }).join("");

    return `
        <div class="risk-history-trigger">
            <span class="risk-history-icon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
            </span>
            <div class="risk-history-dialog">
                <div class="history-title">Probability History</div>
                <canvas class="history-sparkline" width="248" height="50"></canvas>
                <div class="history-list">${rows}</div>
            </div>
        </div>
    `;
}

function drawHistorySparkline() {
    const canvas = document.querySelector(".history-sparkline");
    const history = window.__closureRiskHistory;
    if (!canvas || !history || history.length < 2) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0) return; // canvas hidden
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    const W = rect.width;
    const H = rect.height;
    const padTop = 8, padBottom = 8, padLeft = 4, padRight = 4;

    ctx.clearRect(0, 0, W, H);

    const values = history.map(e => e.peakEnsemble);
    const n = values.length;

    function xPos(i) {
        return padLeft + (i / (n - 1)) * (W - padLeft - padRight);
    }
    function yPos(v) {
        return padTop + (1 - v / 100) * (H - padTop - padBottom);
    }

    ctx.strokeStyle = "#c4956a";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    values.forEach((v, i) => {
        const x = xPos(i);
        const y = yPos(v);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.stroke();

    ctx.fillStyle = "#c4956a";
    values.forEach((v, i) => {
        ctx.beginPath();
        ctx.arc(xPos(i), yPos(v), 3, 0, Math.PI * 2);
        ctx.fill();
    });
}

function renderHikeForecast(hikeForecast) {
    if (!hikeForecast || !hikeForecast.length) return "";

    const cardsHtml = hikeForecast.map(day => {
        const d = new Date(day.date + "T00:00:00");
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const color = RATING_COLORS[day.rating] || "#8b7355";
        const label = RATING_LABELS[day.rating] || day.rating;
        const cfs = day.predictedCfs != null ? Math.round(day.predictedCfs) + " cfs" : "\u2014";
        const temp = day.high != null && day.low != null
            ? `${Math.round(day.high)}\u00b0/${Math.round(day.low)}\u00b0`
            : day.high != null ? `${Math.round(day.high)}\u00b0` : "";
        const precip = day.precipChance != null && day.precipChance > 0
            ? `${day.precipChance}% rain` : "";

        return `
            <div class="hike-day">
                <div class="hike-day-name">${dayName}</div>
                <div class="hike-day-date">${dateStr}</div>
                <div class="hike-dot" style="background:${color};color:${color}"></div>
                <div class="hike-rating" style="color:${color}">${label}</div>
                <div class="hike-cfs">${cfs}</div>
                <div class="hike-temp">${temp}</div>
                ${precip ? `<div class="hike-precip">${precip}</div>` : ""}
            </div>
        `;
    }).join("");

    return `
        <div class="card hike-forecast">
            <h2>Best Days to Hike</h2>
            <div class="hike-scroll">${cardsHtml}</div>
        </div>
    `;
}

function renderRiver(river) {
    const cfs = river.currentCfs != null ? river.currentCfs.toFixed(1) : "N/A";
    const height = river.gaugeHeight != null ? river.gaugeHeight.toFixed(2) : "N/A";
    const arrow = TREND_ARROWS[river.trend] || "\u2192";
    const trendLabel = TREND_LABELS[river.trend] || "Stable";
    const trendClass = TREND_CLASSES[river.trend] || "";

    return `
        <div class="card">
            <h2>River Conditions</h2>
            <div class="river-stats">
                <div class="stat">
                    <div class="stat-value" data-animate="${river.currentCfs}" data-decimals="1">${cfs}</div>
                    <div class="stat-label">Flow (CFS)</div>
                </div>
                <div class="stat">
                    <div class="stat-value" data-animate="${river.gaugeHeight}" data-decimals="2">${height}<span class="stat-unit"> ft</span></div>
                    <div class="stat-label">Gauge Height</div>
                </div>
                <div class="stat">
                    <div class="stat-value ${trendClass}"><span class="trend-arrow">${arrow}</span> ${trendLabel}</div>
                    <div class="stat-label">Trend</div>
                </div>
            </div>
        </div>
    `;
}

function renderWeather(weather) {
    const temp = weather.currentTemp != null ? Math.round(weather.currentTemp) + "\u00b0F" : "N/A";
    const desc = WEATHER_DESCRIPTIONS[weather.weatherCode] || "";
    const icon = WEATHER_ICONS[weather.weatherCode] || "";

    const forecastHtml = weather.forecast.map(day => `
        <div class="forecast-day">
            <div class="forecast-date">${formatShortDate(day.date)}</div>
            <div class="forecast-temps">${Math.round(day.high)}\u00b0 <span class="low">/ ${Math.round(day.low)}\u00b0</span></div>
            <div class="forecast-precip">${day.precipChance != null && day.precipChance > 0 ? day.precipChance + "% rain" : "\u2014"}</div>
        </div>
    `).join("");

    return `
        <div class="card">
            <h2>Weather</h2>
            <div class="weather-current">
                ${icon ? `<span class="weather-icon">${icon}</span>` : ""}
                <div>
                    <div class="weather-temp" data-animate="${weather.currentTemp != null ? Math.round(weather.currentTemp) : ''}" data-decimals="0" data-suffix="\u00b0F">${temp}</div>
                    <div class="weather-desc">${desc}</div>
                </div>
            </div>
            <div class="forecast-grid">${forecastHtml}</div>
        </div>
    `;
}

function renderAlerts(alerts) {
    if (!alerts.length) {
        return `
            <div class="card">
                <h2>NPS Alerts</h2>
                <div class="no-alerts">No active alerts for Zion</div>
            </div>
        `;
    }

    const alertsHtml = alerts.map(a => {
        const cat = (a.category || "").toLowerCase();
        const cssClass = cat === "information" ? "info" : cat === "caution" ? "caution-alert" : "";
        const date = a.date ? `<span class="alert-date">${a.date}</span>` : "";
        const source = a.url ? `<a class="alert-source" href="${a.url}" target="_blank">NPS.gov &rarr;</a>` : "";
        return `
            <div class="alert-item ${cssClass}">
                <div class="alert-header">
                    <div class="alert-title">${a.title}</div>
                    ${date}
                </div>
                <div class="alert-desc">${a.description}</div>
                ${source}
            </div>
        `;
    }).join("");

    return `
        <div class="card">
            <h2>NPS Alerts (${alerts.length})</h2>
            ${alertsHtml}
        </div>
    `;
}

function renderFlowGuide() {
    const levels = [
        { color: "#22c55e", range: "< 50 CFS", label: "Great", desc: "Ideal conditions. Easy rock-hopping, calm water, clear visibility." },
        { color: "#86efac", range: "50 \u2013 80 CFS", label: "Good", desc: "Comfortable wading. Knee-deep in spots, manageable current." },
        { color: "#eab308", range: "80 \u2013 120 CFS", label: "Fair", desc: "Waist-deep sections, moderate current. Use a walking stick." },
        { color: "#f97316", range: "120 \u2013 150 CFS", label: "Poor", desc: "Strong current, chest-deep water possible. Experience required." },
        { color: "#ef4444", range: "\u2265 150 CFS", label: "Closed", desc: "NPS closes the Narrows. Swift water, extremely dangerous." },
    ];

    const rows = levels.map(l => `
        <div class="flow-guide-row">
            <div class="flow-guide-swatch" style="background:${l.color}"></div>
            <div class="flow-guide-info">
                <div class="flow-guide-header">
                    <span class="flow-guide-label" style="color:${l.color}">${l.label}</span>
                    <span class="flow-guide-range">${l.range}</span>
                </div>
                <div class="flow-guide-desc">${l.desc}</div>
            </div>
        </div>
    `).join("");

    return `
        <div class="card flow-guide-card">
            <h2>Flow Guide &mdash; What the Numbers Mean</h2>
            ${rows}
            <div class="flow-guide-note">
                Flow is measured at the USGS North Fork Virgin River gauge near Springdale.
                The Narrows is closed when flow reaches <strong>150 CFS</strong> or during flash flood warnings.
            </div>
        </div>
    `;
}

function renderChart(history, forecast, historical) {
    const title = forecast && forecast.length ? "Flow History & 10-Day Forecast" : "7-Day Flow History";
    const context = historical && historical.seasonalContext
        ? `<div class="seasonal-context">${historical.seasonalContext}</div>`
        : "";

    return `
        <div class="card">
            <h2>${title}</h2>
            <div class="chart-container">
                <canvas id="flow-chart"></canvas>
            </div>
            ${context}
        </div>
    `;
}

function getStatusForCfs(cfs) {
    if (cfs < 50) return { label: "Great", color: "#22c55e" };
    if (cfs < 80) return { label: "Good", color: "#86efac" };
    if (cfs < 120) return { label: "Fair", color: "#eab308" };
    if (cfs < 150) return { label: "Poor", color: "#f97316" };
    return { label: "Closed", color: "#ef4444" };
}

// Chart.js plugin: draw colored threshold bands on background
const thresholdBandsPlugin = {
    id: "thresholdBands",
    beforeDraw(chart) {
        const { ctx, chartArea: { left, right, top, bottom }, scales: { y } } = chart;
        const bands = [
            { min: 0, max: 50, color: "rgba(34, 197, 94, 0.04)" },
            { min: 50, max: 80, color: "rgba(134, 239, 172, 0.04)" },
            { min: 80, max: 120, color: "rgba(234, 179, 8, 0.04)" },
            { min: 120, max: 150, color: "rgba(249, 115, 22, 0.04)" },
            { min: 150, max: Infinity, color: "rgba(239, 68, 68, 0.04)" },
        ];
        ctx.save();
        bands.forEach(band => {
            const yMax = y.getPixelForValue(band.min);
            const yMin = y.getPixelForValue(Math.min(band.max, y.max));
            if (yMin > bottom || yMax < top) return;
            ctx.fillStyle = band.color;
            ctx.fillRect(left, Math.max(yMin, top), right - left, Math.min(yMax, bottom) - Math.max(yMin, top));
        });
        ctx.restore();
    }
};

// Chart.js plugin: draw a "Now" vertical divider line
const nowLinePlugin = {
    id: "nowLine",
    afterDraw(chart) {
        const nowIndex = chart.config._nowIndex;
        if (nowIndex == null) return;
        const { ctx, chartArea: { top, bottom }, scales: { x } } = chart;
        const xPos = x.getPixelForValue(nowIndex);
        if (xPos < x.left || xPos > x.right) return;
        ctx.save();
        ctx.beginPath();
        ctx.setLineDash([4, 4]);
        ctx.strokeStyle = "rgba(196, 149, 106, 0.5)";
        ctx.lineWidth = 1;
        ctx.moveTo(xPos, top);
        ctx.lineTo(xPos, bottom);
        ctx.stroke();
        // "Now" label
        ctx.setLineDash([]);
        ctx.font = "600 10px Inter, sans-serif";
        ctx.fillStyle = "#c4956a";
        ctx.textAlign = "center";
        ctx.fillText("Now", xPos, top - 4);
        ctx.restore();
    }
};

function createChart(history, forecast, historical) {
    const ctx = document.getElementById("flow-chart");
    if (!ctx || !history.length) return;

    const historyLabels = history.map(h => {
        const d = new Date(h.timestamp);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", timeZone: "America/Denver" });
    });
    const historyValues = history.map(h => h.cfs);

    const forecastLabels = (forecast || []).map(f => formatShortDate(f.date));
    const forecastValues = (forecast || []).map(f => f.predictedCfs);

    const allLabels = [...historyLabels, ...forecastLabels];
    const actualData = [...historyValues, ...new Array(forecastLabels.length).fill(null)];
    const forecastData = [...new Array(historyLabels.length - 1).fill(null), historyValues[historyValues.length - 1], ...forecastValues];
    const thresholdData = allLabels.map(() => 150);
    const nowIndex = historyLabels.length - 1;

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

    if (forecast && forecast.length) {
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
        datasets.push({
            label: "Closure Threshold",
            data: thresholdData,
            borderColor: "rgba(239, 68, 68, 0.5)",
            borderDash: [10, 5],
            borderWidth: 1,
            pointRadius: 0,
            pointHoverRadius: 0,
            fill: false,
        });
    }

    // Add historical band if available — cover both history and forecast dates
    if (historical && historical.dailyStats && historical.dailyStats.length) {
        const statsByDay = {};
        historical.dailyStats.forEach(s => { statsByDay[s.monthDay] = s; });

        const getMd = (dateStr) => {
            const d = new Date(dateStr);
            return `${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
        };

        const allDates = [
            ...history.map(h => h.timestamp),
            ...(forecast || []).map(f => f.date + "T12:00:00"),
        ];

        const p75Data = allDates.map(dt => {
            const s = statsByDay[getMd(dt)];
            return s ? s.p75Cfs : null;
        });
        const p25Data = allDates.map(dt => {
            const s = statsByDay[getMd(dt)];
            return s ? s.p25Cfs : null;
        });

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
    }

    const config = {
        type: "line",
        data: { labels: allLabels, datasets },
        plugins: [thresholdBandsPlugin, nowLinePlugin],
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 1200,
                easing: "easeOutQuart",
            },
            layout: { padding: { top: 16 } },
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        color: "#8b7355",
                        usePointStyle: true,
                        pointStyle: "line",
                        boxWidth: 20,
                        font: { size: 11 },
                        filter: item => item.text !== "Closure Threshold" && item.text !== "Typical range (p75)",
                        generateLabels: chart => {
                            const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                            return original.map(l => {
                                if (l.text === "Typical range (p25)") l.text = "Typical range (10yr)";
                                return l;
                            });
                        },
                    },
                },
                tooltip: {
                    backgroundColor: "rgba(28, 25, 23, 0.95)",
                    borderColor: "rgba(196, 149, 106, 0.2)",
                    borderWidth: 1,
                    titleColor: "#ede0d4",
                    bodyColor: "#c4956a",
                    padding: 10,
                    callbacks: {
                        label: item => {
                            if (item.parsed.y == null) return "";
                            const val = item.parsed.y.toFixed(1);
                            const name = item.dataset.label;
                            if (name.startsWith("Typical")) return `${name}: ${val} CFS`;
                            if (name === "Closure Threshold") return "";
                            const status = getStatusForCfs(item.parsed.y);
                            return `${name}: ${val} CFS (${status.label})`;
                        },
                    },
                },
            },
            scales: {
                x: {
                    ticks: { maxTicksLimit: 10, font: { size: 10 }, color: "#8b7355", maxRotation: 45 },
                    grid: { display: false },
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { size: 11 },
                        color: "#8b7355",
                        callback: val => val + " CFS",
                    },
                    grid: { color: "rgba(139, 115, 85, 0.15)" },
                },
            },
        },
    };
    config._nowIndex = nowIndex;
    new Chart(ctx, config);
}

async function init() {
    const app = document.getElementById("app");
    const lastUpdatedEl = document.getElementById("last-updated");

    try {
        const resp = await fetch("data.json");
        if (!resp.ok) throw new Error("Failed to load data");
        const data = await resp.json();

        const forecast = data.forecast ? data.forecast.daily : [];
        const historical = data.historical || null;

        window.__closureRiskHistory = data.closureRiskHistory || null;

        app.innerHTML = [
            renderStatus(data),
            renderClosureRisk(data.closureRisk),
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

        // Redraw sparkline when history dialog becomes visible
        document.addEventListener("mouseenter", function(e) {
            if (e.target.closest && e.target.closest(".risk-history-trigger")) {
                setTimeout(drawHistorySparkline, 10);
            }
        }, true);

        // Mobile: tap to toggle history dialog (only on touch devices)
        const isTouchDevice = window.matchMedia("(hover: none)").matches;
        if (isTouchDevice) {
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
        }

        // Defer chart creation until canvas scrolls into view
        const chartCanvas = document.getElementById("flow-chart");
        if (chartCanvas) {
            const observer = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    createChart(data.river.history, forecast, historical);
                    observer.disconnect();
                }
            }, { threshold: 0.1 });
            observer.observe(chartCanvas);
        }

        // Animate number counters
        app.querySelectorAll('[data-animate]').forEach(el => {
            const target = parseFloat(el.dataset.animate);
            if (isNaN(target)) return;
            const decimals = parseInt(el.dataset.decimals) || 0;
            const suffix = el.dataset.suffix || '';
            const unit = el.querySelector('.stat-unit');
            animateValue(el, target, decimals).then(() => {
                if (suffix) {
                    el.textContent = el.textContent + suffix;
                }
                if (unit) {
                    el.innerHTML = target.toFixed(decimals) + '<span class="stat-unit"> ft</span>';
                }
            });
        });


        if (data.lastUpdated) {
            lastUpdatedEl.textContent = "Last updated: " + formatTimestamp(data.lastUpdated);
        }
    } catch (err) {
        app.innerHTML = `<div class="card" style="text-align:center;color:#ef4444">
            <p>Unable to load status data.</p>
            <p style="font-size:0.8rem;color:#8b7355;margin-top:0.5rem">${err.message}</p>
        </div>`;
    }
}

init();
