# Zion Narrows Status Tracker

A mobile-friendly dashboard that tracks whether the Narrows hike in Zion National Park is open, based on river flow, weather, and NPS alerts. Updated twice daily via GitHub Actions and hosted on GitHub Pages.

## Data Sources

- **USGS** — North Fork Virgin River flow (CFS) and gauge height at station 09405500
- **NPS Alerts API** — Official park closures and hazard warnings
- **Open-Meteo** — Current weather and 3-day forecast for Zion area

## Setup

### 1. Get an NPS API Key

Register for a free key at [developer.nps.gov](https://www.nps.gov/subjects/developer/get-started.htm).

### 2. Add the API Key to GitHub Secrets

Go to your repo **Settings > Secrets and variables > Actions** and add:

- Name: `NPS_API_KEY`
- Value: your NPS API key

### 3. Enable GitHub Pages

Go to **Settings > Pages** and set:

- Source: **Deploy from a branch**
- Branch: `main`, folder: `/docs`

### 4. Run It

The workflow runs automatically at 6 AM and 6 PM UTC. To trigger manually:

- Go to **Actions > Update Narrows Status > Run workflow**

Or run locally:

```bash
pip install -r requirements.txt
NPS_API_KEY=your_key python scripts/fetch_data.py
open docs/index.html
```

## Status Thresholds

| CFS Range | Status | Meaning |
|-----------|--------|---------|
| < 50 | Open | Easy hiking conditions |
| 50–100 | Caution | Moderate conditions |
| 100–150 | Dangerous | Difficult and dangerous |
| >= 150 | Closed | River flow too high |

NPS closure alerts override the flow-based status.
