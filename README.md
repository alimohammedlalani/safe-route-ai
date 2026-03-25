# SafeRoute AI 
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
| Map | Leaflet + OpenStreetMap |
| Charts | Recharts |
| Routing | React Router v6 |
| Backend | FastAPI + Uvicorn |

---

- Demo data — not live official city feeds(Currently MVP stage)

