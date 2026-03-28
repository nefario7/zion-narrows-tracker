#!/usr/bin/env python3
"""Fetch Zion Narrows status data from USGS, NPS, and Open-Meteo APIs."""

import calendar
import json
import os
import statistics
import sys
from collections import defaultdict
from datetime import datetime, timedelta, timezone

import numpy as np
import requests
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler

USGS_SITE = "09405500"
USGS_CURRENT_URL = (
    f"https://waterservices.usgs.gov/nwis/iv/"
    f"?sites={USGS_SITE}&parameterCd=00060,00065&format=json"
)
USGS_HISTORY_URL = (
    f"https://waterservices.usgs.gov/nwis/iv/"
    f"?sites={USGS_SITE}&parameterCd=00060&period=P7D&format=json"
)
NPS_ALERTS_URL = "https://developer.nps.gov/api/v1/alerts?parkCode=zion"
NOAA_NWPS_URL = f"https://api.water.noaa.gov/nwps/v1/gauges/{USGS_SITE}/stageflow"
USGS_DAILY_API_URL = "https://api.waterdata.usgs.gov/ogcapi/v0/collections/daily/items"
OPEN_METEO_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=37.2982&longitude=-112.9789"
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max"
    "&current=temperature_2m,weather_code"
    "&temperature_unit=fahrenheit&timezone=America/Denver&forecast_days=11"
)

OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "docs", "data.json")

# CFS thresholds for Narrows status
THRESHOLDS = [
    (50, "open", "Easy hiking conditions"),
    (100, "caution", "Moderate conditions — use caution"),
    (150, "dangerous", "Difficult and dangerous conditions"),
    (float("inf"), "closed", "River flow too high — Narrows closed"),
]


def fetch_json(url, headers=None, timeout=30):
    """Fetch JSON from a URL, returning None on failure."""
    try:
        resp = requests.get(url, headers=headers, timeout=timeout)
        resp.raise_for_status()
        return resp.json()
    except requests.RequestException as e:
        print(f"Warning: Failed to fetch {url}: {e}", file=sys.stderr)
        return None


def parse_usgs_current(data):
    """Extract current CFS and gauge height from USGS response."""
    if not data:
        return None, None
    try:
        time_series = data["value"]["timeSeries"]
        cfs = None
        gauge_height = None
        for series in time_series:
            param = series["variable"]["variableCode"][0]["value"]
            values = series["values"][0]["value"]
            if values:
                latest = values[-1]
                val = float(latest["value"])
                if param == "00060":
                    cfs = val
                elif param == "00065":
                    gauge_height = val
        return cfs, gauge_height
    except (KeyError, IndexError, ValueError) as e:
        print(f"Warning: Failed to parse USGS current data: {e}", file=sys.stderr)
        return None, None


def parse_usgs_history(data):
    """Extract 7-day flow history from USGS response."""
    if not data:
        return []
    try:
        time_series = data["value"]["timeSeries"]
        for series in time_series:
            param = series["variable"]["variableCode"][0]["value"]
            if param == "00060":
                values = series["values"][0]["value"]
                # Sample every 4 hours to keep data manageable
                history = []
                for i, v in enumerate(values):
                    if i % 16 == 0 or i == len(values) - 1:  # ~every 4 hours (15-min intervals)
                        try:
                            history.append({
                                "timestamp": v["dateTime"],
                                "cfs": float(v["value"]),
                            })
                        except (ValueError, KeyError):
                            continue
                return history
        return []
    except (KeyError, IndexError) as e:
        print(f"Warning: Failed to parse USGS history: {e}", file=sys.stderr)
        return []


def compute_trend(history):
    """Compare current flow to ~6 hours ago to determine trend."""
    if len(history) < 2:
        return "stable"
    current = history[-1]["cfs"]
    # Find value closest to 6 hours ago (about 1-2 entries back in sampled data)
    compare = history[-2]["cfs"] if len(history) >= 2 else current
    if compare == 0:
        return "stable"
    change = (current - compare) / compare
    if change > 0.05:
        return "rising"
    elif change < -0.05:
        return "falling"
    return "stable"


def compute_status(cfs, alerts):
    """Determine Narrows status from CFS and NPS alerts."""
    # Check NPS alerts for Narrows closure
    for alert in alerts:
        title = alert.get("title", "").lower()
        desc = alert.get("description", "").lower()
        category = alert.get("category", "").lower()
        if "narrows" in title or "narrows" in desc:
            if category in ("danger", "closure", "caution"):
                return "closed", "Officially closed by NPS — " + alert.get("title", "")

    if cfs is None:
        return "caution", "Unable to retrieve river flow data"

    for threshold, status, reason in THRESHOLDS:
        if cfs < threshold:
            return status, f"River flow is {cfs:.0f} CFS — {reason}"

    return "closed", f"River flow is {cfs:.0f} CFS — Narrows closed"


def cfs_status(cfs):
    """Return status string for a given CFS value."""
    for threshold, status, _ in THRESHOLDS:
        if cfs < threshold:
            return status
    return "closed"



def fetch_flow_forecast():
    """Fetch flow forecast from NOAA NWPS and aggregate to daily averages."""
    print("Fetching NOAA flow forecast...")
    data = fetch_json(NOAA_NWPS_URL, timeout=60)
    if not data or "forecast" not in data:
        return []
    try:
        forecast_data = data["forecast"]["data"]
        units = data["forecast"].get("secondaryUnits", "kcfs")
        multiplier = 1000.0 if units == "kcfs" else 1.0

        # Group by date and average
        daily = defaultdict(list)
        now = datetime.now(timezone.utc)
        for point in forecast_data:
            ts = datetime.fromisoformat(point["validTime"].replace("Z", "+00:00"))
            if ts <= now:
                continue
            date_str = ts.strftime("%Y-%m-%d")
            cfs = point["secondary"] * multiplier
            daily[date_str].append(cfs)

        result = []
        for date_str in sorted(daily.keys())[:10]:
            avg_cfs = sum(daily[date_str]) / len(daily[date_str])
            result.append({
                "date": date_str,
                "predictedCfs": round(avg_cfs, 1),
                "status": cfs_status(avg_cfs),
            })
        return result
    except (KeyError, IndexError, ValueError, TypeError) as e:
        print(f"Warning: Failed to parse NOAA forecast: {e}", file=sys.stderr)
        return []


def compute_hike_forecast(flow_forecast, weather_extended):
    """Combine flow forecast and weather to rate each day for hiking."""
    flow_by_date = {f["date"]: f["predictedCfs"] for f in flow_forecast}
    weather_by_date = {w["date"]: w for w in weather_extended}

    all_dates = sorted(set(list(flow_by_date.keys()) + list(weather_by_date.keys())))[:10]
    result = []

    for date in all_dates:
        cfs = flow_by_date.get(date)
        weather = weather_by_date.get(date, {})
        precip = weather.get("precipChance")
        high = weather.get("high")
        low = weather.get("low")

        # Rate flow
        if cfs is None:
            flow_rating = "good"
        elif cfs >= 150:
            flow_rating = "closed"
        elif cfs >= 100:
            flow_rating = "poor"
        elif cfs >= 50:
            flow_rating = "fair"
        elif cfs >= 0:
            flow_rating = "great"
        else:
            flow_rating = "good"

        # Rate weather
        if precip is None:
            weather_rating = "good"
        elif precip > 60:
            weather_rating = "poor"
        elif precip >= 40:
            weather_rating = "fair"
        elif precip >= 20:
            weather_rating = "good"
        else:
            weather_rating = "great"

        # Combine: upgrade "great" flow + moderate precip to "good"
        ratings_order = ["great", "good", "fair", "poor", "closed"]
        combined = ratings_order[max(ratings_order.index(flow_rating), ratings_order.index(weather_rating))]

        # Special case: low CFS + low precip = great even if one was "good"
        if cfs is not None and cfs < 50 and precip is not None and precip < 20:
            combined = "great"
        elif cfs is not None and cfs < 80 and precip is not None and precip < 20 and combined == "fair":
            combined = "good"

        result.append({
            "date": date,
            "rating": combined,
            "predictedCfs": round(cfs, 1) if cfs is not None else None,
            "high": round(high) if high is not None else None,
            "low": round(low) if low is not None else None,
            "precipChance": round(precip) if precip is not None else None,
        })

    return result


CLOSURE_THRESHOLD = 150


def compute_closure_risk_historical(current_cfs, historical):
    """Compute 10-day closure probability using historical frequency.

    For each of the next 10 calendar days, calculates what % of years had CFS >= 150
    on that date. Adjusts by how current CFS compares to today's historical median.
    """
    if not historical or "rawByDay" not in historical:
        return None

    raw_by_day = historical["rawByDay"]
    stats_by_day = {s["monthDay"]: s for s in historical.get("dailyStats", [])}

    now = datetime.now()
    today_md = f"{now.month:02d}-{now.day:02d}"

    # Condition adjustment: current_cfs / today's historical median
    today_stats = stats_by_day.get(today_md)
    if today_stats and current_cfs is not None and today_stats["medianCfs"] > 0:
        adjustment = current_cfs / today_stats["medianCfs"]
        adjustment = max(0.5, min(adjustment, 2.0))
    else:
        adjustment = 1.0

    daily_risk = []
    for days_ahead in range(1, 11):
        future = now + timedelta(days=days_ahead)
        future_md = f"{future.month:02d}-{future.day:02d}"

        values = raw_by_day.get(future_md, [])
        if not values:
            daily_risk.append({
                "date": future.strftime("%Y-%m-%d"),
                "historical": None,
            })
            continue

        base_rate = sum(1 for v in values if v >= CLOSURE_THRESHOLD) / len(values)
        adjusted = max(0.0, min(base_rate * adjustment, 1.0))

        daily_risk.append({
            "date": future.strftime("%Y-%m-%d"),
            "historical": round(adjusted * 100, 1),
        })

    valid_probs = [d["historical"] for d in daily_risk if d["historical"] is not None]
    max_prob = max(valid_probs) if valid_probs else 0

    if max_prob < 15:
        label = "Low"
    elif max_prob < 40:
        label = "Moderate"
    elif max_prob < 65:
        label = "High"
    else:
        label = "Very High"

    return {
        "summary": {"next10DayMax": max_prob, "label": label},
        "daily": daily_risk,
    }


def compute_closure_risk_logistic(current_cfs, historical):
    """Compute 10-day closure probability using logistic regression.

    Features: current CFS, CFS trend, day-of-year, days-ahead.
    Trains on 10-year historical daily data where label = 1 if CFS >= 150.
    """
    if not historical or "rawByDay" not in historical:
        return None

    raw_by_day = historical["rawByDay"]
    stats_by_day = {s["monthDay"]: s for s in historical.get("dailyStats", [])}

    # Build training data from historical records
    # Features: prev_day_median_cfs, cfs_trend, day_of_year
    # We simulate multi-day-ahead by using observations N days apart
    X_train = []
    y_train = []

    sorted_days = sorted(raw_by_day.keys())
    for i, md in enumerate(sorted_days):
        values = raw_by_day[md]
        curr_stats = stats_by_day.get(md)
        if not curr_stats:
            continue

        try:
            doy = datetime.strptime(f"2024-{md}", "%Y-%m-%d").timetuple().tm_yday
        except ValueError:
            continue

        # For each lookback distance (simulating days_ahead), use stats from N days prior
        for days_back in range(1, 11):
            prior_idx = (i - days_back) % len(sorted_days)
            prior2_idx = (i - days_back - 1) % len(sorted_days)
            prior_stats = stats_by_day.get(sorted_days[prior_idx])
            prior2_stats = stats_by_day.get(sorted_days[prior2_idx])
            if not prior_stats:
                continue

            prior_cfs = prior_stats["medianCfs"]
            trend = prior_stats["medianCfs"] - prior2_stats["medianCfs"] if prior2_stats else 0

            for val in values:
                X_train.append([prior_cfs, trend, doy, days_back])
                y_train.append(1 if val >= CLOSURE_THRESHOLD else 0)

    if len(X_train) < 20 or sum(y_train) < 2:
        return None

    X_train = np.array(X_train)
    y_train = np.array(y_train)

    import warnings
    model = make_pipeline(
        StandardScaler(),
        LogisticRegression(max_iter=1000, class_weight="balanced"),
    )
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", RuntimeWarning)
        model.fit(X_train, y_train)

    now = datetime.now()
    today_md = f"{now.month:02d}-{now.day:02d}"
    prev_md_key = sorted_days[sorted_days.index(today_md) - 1] if today_md in sorted_days else None
    prev_stats = stats_by_day.get(prev_md_key) if prev_md_key else None

    if current_cfs is not None and prev_stats:
        trend_24h = current_cfs - prev_stats["medianCfs"]
    else:
        trend_24h = 0

    daily_risk = []
    for days_ahead in range(1, 11):
        future = now + timedelta(days=days_ahead)
        future_date = future.strftime("%Y-%m-%d")
        doy = future.timetuple().tm_yday

        X_pred = np.array([[current_cfs or 0, trend_24h, doy, days_ahead]])
        prob = model.predict_proba(X_pred)[0][1] * 100

        daily_risk.append({
            "date": future_date,
            "logistic": round(prob, 1),
        })

    return daily_risk


def compute_closure_risk_gbm(current_cfs, historical):
    """Compute 10-day closure probability using gradient boosted model.

    Features: current CFS, 7-day trend slope, sin/cos day-of-year (seasonality),
    rolling 3-day and 7-day CFS averages, days-ahead.
    """
    if not historical or "rawByDay" not in historical:
        return None

    raw_by_day = historical["rawByDay"]
    stats_by_day = {s["monthDay"]: s for s in historical.get("dailyStats", [])}
    sorted_days = sorted(raw_by_day.keys())

    if len(sorted_days) < 8:
        return None

    # Precompute median CFS array for rolling calculations
    median_by_idx = []
    for md in sorted_days:
        s = stats_by_day.get(md)
        median_by_idx.append(s["medianCfs"] if s else 0)

    X_train = []
    y_train = []

    for i, md in enumerate(sorted_days):
        values = raw_by_day[md]
        curr_stats = stats_by_day.get(md)
        if not curr_stats:
            continue

        try:
            doy = datetime.strptime(f"2024-{md}", "%Y-%m-%d").timetuple().tm_yday
        except ValueError:
            continue

        doy_sin = np.sin(2 * np.pi * doy / 365)
        doy_cos = np.cos(2 * np.pi * doy / 365)

        for days_back in range(1, 11):
            prior_idx = (i - days_back) % len(sorted_days)
            prior_cfs = median_by_idx[prior_idx]

            # Rolling 3-day average
            avg_3 = np.mean([median_by_idx[(prior_idx - j) % len(sorted_days)] for j in range(3)])
            # Rolling 7-day average
            avg_7 = np.mean([median_by_idx[(prior_idx - j) % len(sorted_days)] for j in range(7)])
            # 7-day trend slope (linear fit)
            week_vals = [median_by_idx[(prior_idx - j) % len(sorted_days)] for j in range(7)]
            week_vals.reverse()
            slope = np.polyfit(range(7), week_vals, 1)[0] if len(week_vals) == 7 else 0

            for val in values:
                X_train.append([prior_cfs, slope, doy_sin, doy_cos, avg_3, avg_7, days_back])
                y_train.append(1 if val >= CLOSURE_THRESHOLD else 0)

    if len(X_train) < 20 or sum(y_train) < 2:
        return None

    X_train = np.array(X_train)
    y_train = np.array(y_train)

    import warnings
    model = make_pipeline(
        StandardScaler(),
        GradientBoostingClassifier(
            n_estimators=100,
            max_depth=3,
            learning_rate=0.1,
            random_state=42,
        ),
    )
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        model.fit(X_train, y_train)

    # Build prediction features for next 10 days
    now = datetime.now()
    today_md = f"{now.month:02d}-{now.day:02d}"

    if today_md in sorted_days:
        today_idx = sorted_days.index(today_md)
    else:
        today_idx = len(sorted_days) - 1

    # Current rolling averages
    avg_3_now = np.mean([median_by_idx[(today_idx - j) % len(sorted_days)] for j in range(3)])
    avg_7_now = np.mean([median_by_idx[(today_idx - j) % len(sorted_days)] for j in range(7)])
    week_now = [median_by_idx[(today_idx - j) % len(sorted_days)] for j in range(7)]
    week_now.reverse()
    slope_now = np.polyfit(range(7), week_now, 1)[0]

    daily_risk = []
    for days_ahead in range(1, 11):
        future = now + timedelta(days=days_ahead)
        future_date = future.strftime("%Y-%m-%d")
        doy = future.timetuple().tm_yday
        doy_sin = np.sin(2 * np.pi * doy / 365)
        doy_cos = np.cos(2 * np.pi * doy / 365)

        X_pred = np.array([[current_cfs or 0, slope_now, doy_sin, doy_cos, avg_3_now, avg_7_now, days_ahead]])
        prob = model.predict_proba(X_pred)[0][1] * 100

        daily_risk.append({
            "date": future_date,
            "gbm": round(prob, 1),
        })

    return daily_risk


def fetch_historical_stats():
    """Fetch 10 years of daily flow data and compute seasonal statistics."""
    print("Fetching USGS historical data...")
    now = datetime.now()
    current_month = now.month
    next_month = current_month + 1 if current_month < 12 else 1

    all_values = defaultdict(list)
    for year in range(now.year - 10, now.year + 1):
        for month in [current_month, next_month]:
            query_year = year if month >= current_month else year
            last_day = calendar.monthrange(query_year, month)[1]
            url = (
                f"{USGS_DAILY_API_URL}?monitoring_location_id=USGS-{USGS_SITE}"
                f"&parameter_code=00060&statistic_id=00003"
                f"&datetime={query_year}-{month:02d}-01/{query_year}-{month:02d}-{last_day:02d}"
                f"&limit=100"
            )
            data = fetch_json(url)
            if not data:
                continue
            for feature in data.get("features", []):
                props = feature.get("properties", {})
                date_str = props.get("time", "")
                try:
                    val = float(props["value"])
                    month_day = date_str[5:10]  # MM-DD
                    all_values[month_day].append(val)
                except (ValueError, KeyError):
                    continue

    if not all_values:
        return None

    daily_stats = []
    for month_day in sorted(all_values.keys()):
        vals = sorted(all_values[month_day])
        if len(vals) < 3:
            continue
        n = len(vals)
        daily_stats.append({
            "monthDay": month_day,
            "medianCfs": round(statistics.median(vals), 1),
            "p25Cfs": round(vals[n // 4], 1),
            "p75Cfs": round(vals[3 * n // 4], 1),
        })

    # Generate seasonal context for next month
    next_month_name = calendar.month_name[next_month]
    next_month_stats = [s for s in daily_stats if s["monthDay"].startswith(f"{next_month:02d}")]
    if next_month_stats:
        medians = [s["medianCfs"] for s in next_month_stats]
        low = round(min(medians))
        high = round(max(medians))
        context = f"{next_month_name} typically sees {low}-{high} CFS due to spring snowmelt"
    else:
        context = ""

    return {
        "seasonalContext": context,
        "dailyStats": daily_stats,
        "rawByDay": {k: v for k, v in all_values.items()},
    }


def fetch_nps_alerts():
    """Fetch NPS alerts for Zion."""
    api_key = os.environ.get("NPS_API_KEY", "")
    if not api_key:
        print("Warning: NPS_API_KEY not set, skipping NPS alerts", file=sys.stderr)
        return []
    data = fetch_json(NPS_ALERTS_URL, headers={"X-Api-Key": api_key})
    if not data:
        return []
    alerts = []
    for alert in data.get("data", []):
        last_indexed = alert.get("lastIndexedDate", "")
        date_str = ""
        if last_indexed:
            try:
                dt = datetime.strptime(last_indexed.split(".")[0], "%Y-%m-%d %H:%M:%S")
                date_str = dt.strftime("%b %d, %Y")
            except (ValueError, IndexError):
                date_str = last_indexed[:10] if len(last_indexed) >= 10 else ""
        alerts.append({
            "title": alert.get("title", ""),
            "description": alert.get("description", ""),
            "category": alert.get("category", ""),
            "url": alert.get("url", ""),
            "date": date_str,
        })
    return alerts


def fetch_weather():
    """Fetch weather data from Open-Meteo."""
    data = fetch_json(OPEN_METEO_URL)
    if not data:
        return {"currentTemp": None, "weatherCode": None, "forecast": []}

    current = data.get("current", {})
    daily = data.get("daily", {})

    forecast = []
    dates = daily.get("time", [])
    highs = daily.get("temperature_2m_max", [])
    lows = daily.get("temperature_2m_min", [])
    precip_chance = daily.get("precipitation_probability_max", [])
    precip_sum = daily.get("precipitation_sum", [])

    # Skip today (index 0), show next 3 days for main forecast
    for i in range(1, min(4, len(dates))):
        forecast.append({
            "date": dates[i],
            "high": highs[i] if i < len(highs) else None,
            "low": lows[i] if i < len(lows) else None,
            "precipChance": precip_chance[i] if i < len(precip_chance) else None,
            "precipSum": precip_sum[i] if i < len(precip_sum) else None,
        })

    # Extended 10-day forecast for hike scoring
    extended = []
    for i in range(1, min(11, len(dates))):
        extended.append({
            "date": dates[i],
            "high": highs[i] if i < len(highs) else None,
            "low": lows[i] if i < len(lows) else None,
            "precipChance": precip_chance[i] if i < len(precip_chance) else None,
        })

    return {
        "currentTemp": current.get("temperature_2m"),
        "weatherCode": current.get("weather_code"),
        "forecast": forecast,
        "extendedForecast": extended,
    }


def main():
    print("Fetching USGS current data...")
    usgs_current = fetch_json(USGS_CURRENT_URL)
    cfs, gauge_height = parse_usgs_current(usgs_current)

    print("Fetching USGS 7-day history...")
    usgs_history_data = fetch_json(USGS_HISTORY_URL)
    history = parse_usgs_history(usgs_history_data)

    print("Fetching NPS alerts...")
    alerts = fetch_nps_alerts()

    print("Fetching weather data...")
    weather = fetch_weather()

    flow_forecast = fetch_flow_forecast()
    hike_forecast = compute_hike_forecast(flow_forecast, weather.get("extendedForecast", []))
    historical = fetch_historical_stats()
    closure_risk = compute_closure_risk_historical(cfs, historical)
    logistic_risk = compute_closure_risk_logistic(cfs, historical)
    gbm_risk = compute_closure_risk_gbm(cfs, historical)

    trend = compute_trend(history)
    status, status_reason = compute_status(cfs, alerts)

    result = {
        "status": status,
        "statusReason": status_reason,
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "river": {
            "currentCfs": cfs,
            "gaugeHeight": gauge_height,
            "trend": trend,
            "history": history,
        },
        "weather": weather,
        "alerts": alerts,
        "forecast": {"daily": flow_forecast},
        "hikeForecast": hike_forecast,
    }
    if historical:
        result["historical"] = {k: v for k, v in historical.items() if k != "rawByDay"}
    # Merge model predictions into unified closureRisk
    if closure_risk:
        logistic_by_date = {d["date"]: d["logistic"] for d in logistic_risk} if logistic_risk else {}
        gbm_by_date = {d["date"]: d["gbm"] for d in gbm_risk} if gbm_risk else {}

        for day in closure_risk["daily"]:
            day["logistic"] = logistic_by_date.get(day["date"])
            day["gbm"] = gbm_by_date.get(day["date"])

            hist = day.get("historical")
            logi = day.get("logistic")
            gbm = day.get("gbm")

            # Ensemble: weighted average of available models
            # Full weights: 20% historical, 30% logistic, 50% GBM
            weights = []
            values = []
            if hist is not None:
                weights.append(0.2)
                values.append(hist)
            if logi is not None:
                weights.append(0.3)
                values.append(logi)
            if gbm is not None:
                weights.append(0.5)
                values.append(gbm)

            if weights:
                total_weight = sum(weights)
                day["ensemble"] = round(sum(w * v for w, v in zip(weights, values)) / total_weight, 1)
            else:
                day["ensemble"] = None

        valid = [d["ensemble"] for d in closure_risk["daily"] if d["ensemble"] is not None]
        max_prob = max(valid) if valid else 0
        if max_prob < 15:
            label = "Low"
        elif max_prob < 40:
            label = "Moderate"
        elif max_prob < 65:
            label = "High"
        else:
            label = "Very High"
        closure_risk["summary"] = {"next10DayMax": round(max_prob, 1), "label": label}

    if closure_risk:
        result["closureRisk"] = closure_risk

    output_path = os.path.abspath(OUTPUT_PATH)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"Status: {status} — {status_reason}")
    if closure_risk:
        print(f"Closure risk (next 10 days max): {closure_risk['summary']['next10DayMax']}% — {closure_risk['summary']['label']}")
    print(f"Data written to {output_path}")


if __name__ == "__main__":
    main()
