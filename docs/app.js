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
    return `
        <div class="status-card ${data.status}">
            <div class="status-label">${data.status}</div>
            <div class="status-reason">${data.statusReason}</div>
        </div>
    `;
}

function renderHikeForecast(hikeForecast) {
    if (!hikeForecast || !hikeForecast.length) return "";

    const cardsHtml = hikeForecast.map(day => {
        const d = new Date(day.date + "T00:00:00");
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const color = RATING_COLORS[day.rating] || "#64748b";
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
                    <div class="stat-value">${cfs}</div>
                    <div class="stat-label">Flow (CFS)</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${height}<span class="stat-unit"> ft</span></div>
                    <div class="stat-label">Gauge Height</div>
                </div>
                <div class="stat">
                    <div class="stat-value ${trendClass}">${arrow} ${trendLabel}</div>
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
                    <div class="weather-temp">${temp}</div>
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
        const link = a.url ? `<a class="alert-link" href="${a.url}" target="_blank">More info &rarr;</a>` : "";
        return `
            <div class="alert-item ${cssClass}">
                <div class="alert-title">${a.title}</div>
                <div class="alert-desc">${a.description}</div>
                ${link}
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

function createChart(history, forecast, historical) {
    const ctx = document.getElementById("flow-chart");
    if (!ctx || !history.length) return;

    const historyLabels = history.map(h => {
        const d = new Date(h.timestamp);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "America/Denver" });
    });
    const historyValues = history.map(h => h.cfs);

    const forecastLabels = (forecast || []).map(f => formatShortDate(f.date));
    const forecastValues = (forecast || []).map(f => f.predictedCfs);

    const allLabels = [...historyLabels, ...forecastLabels];
    const actualData = [...historyValues, ...new Array(forecastLabels.length).fill(null)];
    const forecastData = [...new Array(historyLabels.length - 1).fill(null), historyValues[historyValues.length - 1], ...forecastValues];
    const thresholdData = allLabels.map(() => 150);

    const datasets = [{
        label: "Actual",
        data: actualData,
        borderColor: "#38bdf8",
        backgroundColor: "rgba(56, 189, 248, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
    }];

    if (forecast && forecast.length) {
        datasets.push({
            label: "Forecast",
            data: forecastData,
            borderColor: "#38bdf8",
            borderDash: [5, 5],
            backgroundColor: "rgba(56, 189, 248, 0.05)",
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            borderWidth: 2,
        });
        datasets.push({
            label: "Closure Threshold",
            data: thresholdData,
            borderColor: "#ef4444",
            borderDash: [10, 5],
            borderWidth: 1,
            pointRadius: 0,
            fill: false,
        });
    }

    // Add historical band if available
    if (historical && historical.dailyStats && historical.dailyStats.length) {
        const statsByDay = {};
        historical.dailyStats.forEach(s => { statsByDay[s.monthDay] = s; });

        const p75Data = history.map(h => {
            const d = new Date(h.timestamp);
            const md = `${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
            const s = statsByDay[md];
            return s ? s.p75Cfs : null;
        });
        const p25Data = history.map(h => {
            const d = new Date(h.timestamp);
            const md = `${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
            const s = statsByDay[md];
            return s ? s.p25Cfs : null;
        });

        datasets.push({
            label: "Typical range (p75)",
            data: p75Data,
            borderWidth: 0,
            pointRadius: 0,
            fill: false,
        });
        datasets.push({
            label: "Typical range (p25)",
            data: p25Data,
            borderWidth: 0,
            pointRadius: 0,
            fill: "-1",
            backgroundColor: "rgba(148, 163, 184, 0.12)",
        });
    }

    new Chart(ctx, {
        type: "line",
        data: { labels: allLabels, datasets },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: (forecast && forecast.length > 0) || (historical && historical.dailyStats && historical.dailyStats.length > 0),
                    labels: {
                        color: "#94a3b8",
                        usePointStyle: true,
                        boxWidth: 8,
                        font: { size: 11 },
                        filter: item => item.text !== "Closure Threshold" && item.text !== "Typical range (p75)",
                        generateLabels: chart => {
                            const original = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                            return original.map(l => {
                                if (l.text === "Typical range (p25)") l.text = "Typical range";
                                return l;
                            });
                        },
                    },
                },
                tooltip: {
                    backgroundColor: "#1e293b",
                    borderColor: "rgba(148, 163, 184, 0.2)",
                    borderWidth: 1,
                    titleColor: "#e2e8f0",
                    bodyColor: "#94a3b8",
                    callbacks: {
                        label: ctx => ctx.parsed.y != null ? `${ctx.parsed.y.toFixed(1)} CFS` : "",
                    },
                },
            },
            scales: {
                x: {
                    ticks: { maxTicksLimit: 8, font: { size: 11 }, color: "#64748b" },
                    grid: { display: false },
                },
                y: {
                    beginAtZero: true,
                    ticks: { font: { size: 11 }, color: "#64748b" },
                    grid: { color: "rgba(148, 163, 184, 0.08)" },
                },
            },
        },
    });
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

        app.innerHTML = [
            renderStatus(data),
            renderHikeForecast(data.hikeForecast),
            renderRiver(data.river),
            renderFlowGuide(),
            renderWeather(data.weather),
            renderChart(data.river.history, forecast, historical),
            renderAlerts(data.alerts),
        ].join("");

        createChart(data.river.history, forecast, historical);

        if (data.lastUpdated) {
            lastUpdatedEl.textContent = "Last updated: " + formatTimestamp(data.lastUpdated);
        }
    } catch (err) {
        app.innerHTML = `<div class="card" style="text-align:center;color:#ef4444">
            <p>Unable to load status data.</p>
            <p style="font-size:0.8rem;color:#64748b;margin-top:0.5rem">${err.message}</p>
        </div>`;
    }
}

init();
