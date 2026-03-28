# Development & Setup

## Prerequisites

- Python 3.8+
- A free [NPS API key](https://www.nps.gov/subjects/developer/get-started.htm)

## Setup

### 1. Add the API Key to GitHub Secrets

Go to your repo **Settings > Secrets and variables > Actions** and add:

- Name: `NPS_API_KEY`
- Value: your NPS API key

### 2. Enable GitHub Pages

Go to **Settings > Pages** and set:

- Source: **Deploy from a branch**
- Branch: `main`, folder: `/docs`

### 3. Run It

The workflow runs automatically at 6 AM and 6 PM UTC. To trigger manually:

- Go to **Actions > Update Narrows Status > Run workflow**

Or run locally:

```bash
pip install -r requirements.txt
NPS_API_KEY=your_key python scripts/fetch_data.py
open docs/index.html
```
