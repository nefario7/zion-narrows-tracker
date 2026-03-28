const TREND_ARROWS = { rising: "\u2191", falling: "\u2193", stable: "\u2192" };
const TREND_CLASSES = { rising: "trend-rising", falling: "trend-falling", stable: "trend-stable" };
const WEATHER_DESCRIPTIONS = {
    0: "Clear sky", 1: "Mostly clear", 2: "Partly cloudy", 3: "Overcast",
    45: "Foggy", 48: "Fog", 51: "Light drizzle", 53: "Drizzle", 55: "Heavy drizzle",
    61: "Light rain", 63: "Rain", 65: "Heavy rain", 71: "Light snow", 73: "Snow",
    75: "Heavy snow", 80: "Rain showers", 81: "Rain showers", 82: "Heavy showers",
    85: "Snow showers", 86: "Heavy snow showers", 95: "Thunderstorm",
    96: "Thunderstorm w/ hail", 99: "Thunderstorm w/ heavy hail",
};

function formatDate(dateStr) {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function formatTimestamp(iso) {
    const d = new Date(iso);
    return d.toLocaleString("en-US", {
        timeZone: "America/Denver",
        weekday: "short", month: "short", day: "numeric",
        hour: "numeric", minute: "2-digit",
    });
}

function renderStatus(data) {
    return `
        <div class="status-card ${data.status}">
            <div class="status-label">${data.status}</div>
            <div class="status-reason">${data.statusReason}</div>
        </div>
    `;
}

const RATING_COLORS = {
    great: "#22c55e", good: "#86efac", fair: "#eab308", poor: "#f97316", closed: "#ef4444",
};

function renderHikeForecast(hikeForecast) {
    if (!hikeForecast || !hikeForecast.length) return "";

    const cardsHtml = hikeForecast.map(day => {
        const d = new Date(day.date + "T00:00:00");
        const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
        const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const color = RATING_COLORS[day.rating] || "#78716c";
        const cfs = day.predictedCfs != null ? Math.round(day.predictedCfs) + "" : "—";
        const temp = day.high != null ? Math.round(day.high) + "\u00b0" : "";

        return `
            <div class="hike-day">
                <div class="hike-day-name">${dayName}</div>
                <div class="hike-day-date">${dateStr}</div>
                <div class="hike-dot" style="background:${color}"></div>
                <div class="hike-cfs">${cfs}</div>
                <div class="hike-temp">${temp}</div>
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
    const height = river.gaugeHeight != null ? river.gaugeHeight.toFixed(2) + " ft" : "N/A";
    const arrow = TREND_ARROWS[river.trend] || "\u2192";
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
                    <div class="stat-value">${height}</div>
                    <div class="stat-label">Gauge Height</div>
                </div>
                <div class="stat">
                    <div class="stat-value ${trendClass}">${arrow}</div>
                    <div class="stat-label">Trend</div>
                </div>
            </div>
        </div>
    `;
}

function renderWeather(weather) {
    const temp = weather.currentTemp != null ? Math.round(weather.currentTemp) + "\u00b0F" : "N/A";
    const desc = WEATHER_DESCRIPTIONS[weather.weatherCode] || "";

    const forecastHtml = weather.forecast.map(day => `
        <div class="forecast-day">
            <div class="forecast-date">${formatDate(day.date)}</div>
            <div class="forecast-temps">${Math.round(day.high)}\u00b0 / ${Math.round(day.low)}\u00b0</div>
            <div class="forecast-precip">${day.precipChance != null ? day.precipChance + "% rain" : ""}</div>
        </div>
    `).join("");

    return `
        <div class="card">
            <h2>Weather</h2>
            <div class="current-temp">${temp} <span style="font-size:0.875rem;font-weight:400;color:#78716c">${desc}</span></div>
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

    const alertsHtml = alerts.map(a => `
        <div class="alert-item">
            <div class="alert-title">${a.title}</div>
            <div class="alert-desc">${a.description}</div>
        </div>
    `).join("");

    return `
        <div class="card">
            <h2>NPS Alerts</h2>
            ${alertsHtml}
        </div>
    `;
}

function renderChart(history, forecast, historical) {
    const title = forecast && forecast.length ? "Flow History & Forecast" : "7-Day Flow History";
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

    const forecastLabels = (forecast || []).map(f => formatDate(f.date));
    const forecastValues = (forecast || []).map(f => f.predictedCfs);

    const allLabels = [...historyLabels, ...forecastLabels];
    const actualData = [...historyValues, ...new Array(forecastLabels.length).fill(null)];
    const forecastData = [...new Array(historyLabels.length - 1).fill(null), historyValues[historyValues.length - 1], ...forecastValues];
    const thresholdData = allLabels.map(() => 150);

    const datasets = [{
        label: "Actual",
        data: actualData,
        borderColor: "#0ea5e9",
        backgroundColor: "rgba(14, 165, 233, 0.1)",
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
    }];

    if (forecast && forecast.length) {
        datasets.push({
            label: "Forecast",
            data: forecastData,
            borderColor: "#0ea5e9",
            borderDash: [5, 5],
            backgroundColor: "rgba(14, 165, 233, 0.05)",
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
            backgroundColor: "rgba(147, 197, 253, 0.2)",
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
                    callbacks: {
                        label: ctx => ctx.parsed.y != null ? `${ctx.parsed.y.toFixed(1)} CFS` : "",
                    },
                },
            },
            scales: {
                x: {
                    ticks: { maxTicksLimit: 8, font: { size: 11 } },
                    grid: { display: false },
                },
                y: {
                    beginAtZero: true,
                    ticks: { font: { size: 11 } },
                    grid: { color: "rgba(0,0,0,0.05)" },
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
            renderWeather(data.weather),
            renderAlerts(data.alerts),
            renderChart(data.river.history, forecast, historical),
        ].join("");

        createChart(data.river.history, forecast, historical);

        if (data.lastUpdated) {
            lastUpdatedEl.textContent = "Last updated: " + formatTimestamp(data.lastUpdated);
        }
    } catch (err) {
        app.innerHTML = `<div class="card" style="text-align:center;color:#ef4444">
            <p>Unable to load status data.</p>
            <p style="font-size:0.8rem;color:#78716c;margin-top:0.5rem">${err.message}</p>
        </div>`;
    }
}

init();
