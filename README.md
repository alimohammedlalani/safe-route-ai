# SafeRoute AI 🛡️
### Dynamic Accident Risk Index & Adaptive Zone Clustering — Hyderabad

> **Hackathon Submission: Problem Statement 56 — Accident Risk Index & Zone Clustering Model**
> **Category: Smart Mobility & Traffic Safety**

---

## What It Does

SafeRoute AI transforms raw accident incident data into a **structured, explainable, time-aware risk intelligence layer** for Hyderabad's road network.

Instead of a static heatmap that permanently labels zones as dangerous, SafeRoute AI:

- Computes an **Accident Risk Index (0–100)** per zone using severity, recency, weather exposure, and infrastructure flags
- **Clusters nearby incidents** into high-confidence blackspot zones
- Applies **exponential time-decay** so old incidents don't permanently inflate risk
- Classifies each zone as **Escalating / Stable / Improving**
- Provides a **natural-language explanation** of why each zone is risky
- Visualises everything on a **premium dark-mode dashboard**

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+

### 1 — Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API available at: `http://localhost:8000`

### 2 — Frontend
```bash
cd frontend
npm install
npm run dev
```
App available at: `http://localhost:5173`

> **Note:** The frontend is fully self-contained with embedded JS logic and data, so it works even without the backend running. The backend adds a proper API layer.

---

## Project Structure

```
saferoute-ai/
├── backend/
│   ├── main.py                 # FastAPI app, all endpoints
│   ├── requirements.txt
│   ├── data/
│   │   └── incidents.json      # 50 curated Hyderabad incidents
│   └── utils/
│       ├── risk_engine.py      # Scoring, time-decay, explainability
│       └── clustering.py       # Spatial zone clustering
│
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── tailwind.config.js
    └── src/
        ├── App.jsx
        ├── main.jsx
        ├── index.css
        ├── data/
        │   └── incidents.js     # JS mirror of backend data
        ├── utils/
        │   ├── riskEngine.js    # JS risk scoring + explainability
        │   └── clustering.js    # JS spatial clustering
        ├── components/
        │   ├── Navbar.jsx
        │   ├── RiskMap.jsx      # Leaflet map with zone overlays
        │   ├── ZoneDrawer.jsx   # Zone detail side panel
        │   ├── ZoneTable.jsx    # Zone list sidebar
        │   ├── SummaryCards.jsx # Dashboard stat cards
        │   ├── DashboardFilters.jsx
        │   ├── RiskScoreRing.jsx
        │   └── Badges.jsx
        └── pages/
            ├── Landing.jsx      # Hero + features + how it works
            ├── Dashboard.jsx    # Main risk map dashboard
            ├── Trends.jsx       # Charts & insights page
            └── Methodology.jsx  # How the model works (for judges)
```

---

## API Endpoints

| Endpoint | Description |
|---|---|
| `GET /api/incidents` | All incidents with optional `days` / `severity` filter |
| `GET /api/zones` | Computed risk zones with clustering |
| `GET /api/summary` | Dashboard summary stats |
| `GET /api/trends` | Monthly series, TOD distribution, top zones |
| `GET /api/zone/{id}` | Single zone detail |

---

## Risk Model Summary

### Accident Risk Index Formula

```
per_incident_score = severity_weight × time_decay × flag_multiplier

zone_score = Σ per_incident_score (all incidents in zone)
risk_index = normalize(zone_score, 0–100)
```

### Severity Weights
| Level | Weight |
|---|---|
| Fatal | 5.0 |
| Major | 2.5 |
| Minor | 1.0 |

### Time Decay
```
decay = e^(−days_ago / 45)
```
- 0 days ago → 100%
- 30 days ago → 51%
- 45 days ago → 37%
- 90 days ago → 14%

### Environmental Multipliers
- Flood risk: ×1.20
- Weather risk: ×1.15
- Construction: ×1.10
- Lighting issue: ×1.10
- Signal malfunction: ×1.10
- Road damage: ×1.08

### Zone Status Logic
| Ratio (recent / historical) | Status |
|---|---|
| > 1.30 | 🔴 Escalating |
| 0.60–1.30 | 🔵 Stable |
| < 0.60 | 🟢 Improving |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Map | Leaflet + OpenStreetMap (CARTO dark tiles) |
| Charts | Recharts |
| Routing | React Router v6 |
| Backend | FastAPI + Uvicorn |
| Data | JSON flat file (50 curated incidents) |
| Fonts | Syne (display) + DM Sans (body) + Space Mono |

---

## Demo Data

50 realistic accident incidents across Hyderabad's known high-risk corridors:
- Gachibowli–HITEC City Corridor
- Kukatpally–KPHB
- LB Nagar–Nagole Corridor
- Mehdipatnam–Ameerpet
- Shamshabad ORR & Airport Stretch
- Uppal–Habsiguda
- Jubilee Hills–Banjara Hills
- Secunderabad–Begumpet
- Miyapur–BHEL Chowk
- Dilsukhnagar–Kothapet
- Tolichowki–Attapur
- Kompally–Alwal

---

## Hackathon Screenshots Guide

For the best PPT screenshots, capture:

1. **Landing Page Hero** — full-width, shows product pitch + stat strip
2. **Dashboard — Full Map View** — map with all zone circles visible, zoomed to ~zoom 11
3. **Dashboard — Zone Drawer Open** (click Dilsukhnagar or Shamshabad) — shows risk score ring, factors, timeline
4. **Dashboard — Filters Active** — set to "Fatal only" + "Weather Risk" toggle ON
5. **Trends — Monthly Chart** — bar chart showing 6-month trend
6. **Trends — Top Zones Table** — ranked zone list with badges
7. **Methodology — Risk Formula Section** — formula + weight bars
8. **Methodology — Comparison Table** — "vs Static Heatmap" section

---

## Recommended 2-Minute Demo Flow

1. Open **Landing Page** → read headline → click "Explore Risk Dashboard"
2. On **Dashboard** → zoom to Shamshabad area → point out Critical zones (red circles)
3. Click **Shamshabad zone** → Zone Drawer opens → explain risk score, status, explanation
4. Toggle **"Fatal only"** filter → map updates live
5. Navigate to **Trends** → point out nighttime accident dominance
6. Navigate to **Methodology** → show the time-decay table → "not a heatmap"

---

## Future Scope

- Live data ingestion from city accident reports / police FIR APIs
- CCTV integration for real-time incident detection
- Route recommendation engine (safer path vs fastest path)
- Traffic authority alert dashboard with push notifications
- Mobile app for field incident reporting
- Integration with GHMC and Hyderabad Traffic Police systems
- DBSCAN-based adaptive clustering as data volume grows

---

## Alignment with PS 56

| PS 56 Requirement | SafeRoute AI Response |
|---|---|
| Accident data integration | 50-record curated dataset, ready for API expansion |
| Weather conditions | Weather risk and flood risk flags per incident |
| Vehicle patterns | Vehicle type tagging per incident |
| Infrastructure factors | 6 infrastructure flag types |
| Structured risk index | Weighted 0–100 Accident Risk Index |
| Clustering model | Spatial zone clustering with confidence scoring |

---

## Limitations (Honest Disclosure)

- Demo data — not live official city feeds
- No real-time scraping pipeline in this MVP
- Zone boundaries use simplified radial capture
- No routing engine integration
- Not deployed to production hosting
- No authentication layer

These are intentional MVP constraints. The architecture is designed to scale with real data sources.

---

*Built for hackathon demonstration purposes. Reference date: March 15, 2024.*
