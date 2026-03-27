#!/usr/bin/env python3
"""Fetch Zion Narrows status data from USGS, NPS, and Open-Meteo APIs."""

import json
import os
import sys
from datetime import datetime, timezone

import requests

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
OPEN_METEO_URL = (
    "https://api.open-meteo.com/v1/forecast"
    "?latitude=37.2982&longitude=-112.9789"
    "&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max"
    "&current=temperature_2m,weather_code"
    "&temperature_unit=fahrenheit&timezone=America/Denver&forecast_days=4"
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
        alerts.append({
            "title": alert.get("title", ""),
            "description": alert.get("description", ""),
            "category": alert.get("category", ""),
            "url": alert.get("url", ""),
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

    # Skip today (index 0), show next 3 days
    for i in range(1, min(4, len(dates))):
        forecast.append({
            "date": dates[i],
            "high": highs[i] if i < len(highs) else None,
            "low": lows[i] if i < len(lows) else None,
            "precipChance": precip_chance[i] if i < len(precip_chance) else None,
            "precipSum": precip_sum[i] if i < len(precip_sum) else None,
        })

    return {
        "currentTemp": current.get("temperature_2m"),
        "weatherCode": current.get("weather_code"),
        "forecast": forecast,
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
    }

    output_path = os.path.abspath(OUTPUT_PATH)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)

    print(f"Status: {status} — {status_reason}")
    print(f"Data written to {output_path}")


if __name__ == "__main__":
    main()
