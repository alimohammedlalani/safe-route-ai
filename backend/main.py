"""
SafeRoute AI - FastAPI Backend
Serves incident data, computed risk zones, summary stats, and trend data.
"""

import json
import os
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional

from utils.risk_engine import (
    compute_incident_score,
    compute_zone_score,
    normalize_score,
    determine_status,
    get_top_factors,
    get_risk_level,
    generate_explanation,
    REFERENCE_DATE,
)
from utils.clustering import cluster_incidents

# Load incident data from JSON
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "incidents.json")

with open(DATA_PATH) as f:
    ALL_INCIDENTS = json.load(f)

app = FastAPI(title="SafeRoute AI API", version="1.0.0")

# Allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def filter_incidents(incidents, days: int = 180, severity: Optional[str] = None):
    """Filter incidents by time range and severity."""
    from datetime import datetime, timedelta
    cutoff = REFERENCE_DATE - timedelta(days=days)
    
    result = []
    for inc in incidents:
        inc_date = datetime.fromisoformat(inc["date"])
        if inc_date < cutoff:
            continue
        if severity and severity != "all":
            if severity == "fatal" and inc["severity"] != "fatal":
                continue
            elif severity == "major_fatal" and inc["severity"] not in ("major", "fatal"):
                continue
        result.append(inc)
    return result


@app.get("/api/incidents")
def get_incidents(
    days: int = Query(180, description="Lookback window in days"),
    severity: Optional[str] = Query(None),
    zone_status: Optional[str] = Query(None),
):
    """Return filtered incident list."""
    incidents = filter_incidents(ALL_INCIDENTS, days, severity)
    return {"incidents": incidents, "total": len(incidents)}


@app.get("/api/zones")
def get_zones(
    days: int = Query(180),
    severity: Optional[str] = Query(None),
    zone_status: Optional[str] = Query(None),
):
    """Return computed risk zones with clustering."""
    incidents = filter_incidents(ALL_INCIDENTS, days, severity)
    zones = cluster_incidents(incidents)
    
    if zone_status and zone_status != "all":
        zones = [z for z in zones if z["status"].lower() == zone_status.lower()]
    
    return {"zones": zones, "total": len(zones)}


@app.get("/api/summary")
def get_summary():
    """Return high-level dashboard summary stats."""
    incidents = ALL_INCIDENTS
    zones = cluster_incidents(incidents)
    
    total_incidents = len(incidents)
    active_zones = len(zones)
    critical_clusters = len([z for z in zones if z["riskLevel"] == "Critical"])
    improving_zones = len([z for z in zones if z["status"] == "Improving"])
    escalating_zones = len([z for z in zones if z["status"] == "Escalating"])
    
    # Severity breakdown
    fatal = sum(1 for i in incidents if i["severity"] == "fatal")
    major = sum(1 for i in incidents if i["severity"] == "major")
    minor = sum(1 for i in incidents if i["severity"] == "minor")
    
    return {
        "total_incidents": total_incidents,
        "active_zones": active_zones,
        "critical_clusters": critical_clusters,
        "improving_zones": improving_zones,
        "escalating_zones": escalating_zones,
        "severity": {"fatal": fatal, "major": major, "minor": minor},
    }


@app.get("/api/trends")
def get_trends():
    """Return time-series trend data for charts."""
    from datetime import datetime, timedelta
    from collections import defaultdict

    # Monthly incident counts for last 6 months
    monthly = defaultdict(lambda: {"minor": 0, "major": 0, "fatal": 0, "total": 0})
    
    for inc in ALL_INCIDENTS:
        date = datetime.fromisoformat(inc["date"])
        month_key = date.strftime("%b %Y")
        monthly[month_key][inc["severity"]] += 1
        monthly[month_key]["total"] += 1

    # Sort by date
    months_ordered = []
    ref = REFERENCE_DATE
    for i in range(5, -1, -1):
        d = ref - timedelta(days=30 * i)
        months_ordered.append(d.strftime("%b %Y"))

    monthly_series = [
        {"month": m, **monthly.get(m, {"minor": 0, "major": 0, "fatal": 0, "total": 0})}
        for m in months_ordered
    ]

    # Time-of-day distribution
    time_band_counts = defaultdict(int)
    for inc in ALL_INCIDENTS:
        time_band_counts[inc["time_band"]] += 1

    tod_order = ["morning", "afternoon", "evening", "night", "late-night"]
    time_of_day = [
        {"band": band, "count": time_band_counts.get(band, 0)}
        for band in tod_order
    ]

    # Top zones by risk score
    zones = cluster_incidents(ALL_INCIDENTS)
    top_zones = [
        {"name": z["name"], "riskScore": z["riskScore"], "status": z["status"]}
        for z in sorted(zones, key=lambda x: x["riskScore"], reverse=True)[:8]
    ]

    return {
        "monthly_series": monthly_series,
        "time_of_day": time_of_day,
        "top_zones": top_zones,
    }


@app.get("/api/zone/{zone_id}")
def get_zone_detail(zone_id: str):
    """Return detailed info for a specific zone."""
    zones = cluster_incidents(ALL_INCIDENTS)
    zone = next((z for z in zones if z["id"] == zone_id), None)
    if not zone:
        return {"error": "Zone not found"}, 404
    return zone


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
