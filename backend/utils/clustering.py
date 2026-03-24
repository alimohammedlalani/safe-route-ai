"""
SafeRoute AI - Zone Clustering
Groups incidents into pre-defined high-risk zones using spatial proximity.
Each zone must meet minimum incident thresholds to be reported as a blackspot.
"""

import math
from utils.risk_engine import (
    compute_zone_score,
    normalize_score,
    determine_status,
    get_top_factors,
    get_risk_level,
    generate_explanation,
    REFERENCE_DATE,
)

# Pre-defined known high-risk zones for Hyderabad
# (centroid lat, centroid lon, capture radius in decimal degrees ≈ km/111)
ZONE_DEFINITIONS = [
    {
        "id": "Z001",
        "name": "Gachibowli–HITEC Corridor",
        "centroid": [17.4440, 78.3620],
        "radius": 0.028,
        "landmark": "ORR Exit 7 / ISB Road",
        "road_segment": "ORR–Gachibowli–Madhapur",
    },
    {
        "id": "Z002",
        "name": "Kukatpally–KPHB",
        "centroid": [17.4855, 78.4138],
        "radius": 0.022,
        "landmark": "KPHB Colony / NH65 Junction",
        "road_segment": "NH65 Kukatpally Stretch",
    },
    {
        "id": "Z003",
        "name": "LB Nagar–Nagole Corridor",
        "centroid": [17.3560, 78.5500],
        "radius": 0.030,
        "landmark": "LB Nagar X Roads / Nagole Bridge",
        "road_segment": "RR District Ring Road",
    },
    {
        "id": "Z004",
        "name": "Mehdipatnam–Ameerpet",
        "centroid": [17.4160, 78.4428],
        "radius": 0.025,
        "landmark": "Mehdipatnam Flyover / Ameerpet Metro",
        "road_segment": "Inner Ring Road West",
    },
    {
        "id": "Z005",
        "name": "Shamshabad ORR–Airport Stretch",
        "centroid": [17.2408, 78.4297],
        "radius": 0.030,
        "landmark": "ORR Exit 14 / Rajiv Gandhi Airport Road",
        "road_segment": "NH44 Airport Expressway",
    },
    {
        "id": "Z006",
        "name": "Uppal–Habsiguda",
        "centroid": [17.4063, 78.5580],
        "radius": 0.022,
        "landmark": "Uppal X Roads / RTC Colony",
        "road_segment": "Uppal Main Road–Ring Road",
    },
    {
        "id": "Z007",
        "name": "Jubilee Hills–Banjara Hills",
        "centroid": [17.4220, 78.4108],
        "radius": 0.022,
        "landmark": "JH Check Post / Road No. 12",
        "road_segment": "JH–BH Internal Roads",
    },
    {
        "id": "Z008",
        "name": "Secunderabad–Begumpet",
        "centroid": [17.4420, 78.4810],
        "radius": 0.025,
        "landmark": "Clock Tower Junction / SD Road",
        "road_segment": "SD Road–Begumpet Arterial",
    },
    {
        "id": "Z009",
        "name": "Miyapur–BHEL Chowk",
        "centroid": [17.4965, 78.3576],
        "radius": 0.020,
        "landmark": "Miyapur X Roads / BHEL Gate",
        "road_segment": "Miyapur–Chandanagar NH65 Link",
    },
    {
        "id": "Z010",
        "name": "Dilsukhnagar–Kothapet",
        "centroid": [17.3688, 78.5260],
        "radius": 0.022,
        "landmark": "Dilsukhnagar Bus Terminal",
        "road_segment": "Dilsukhnagar–Malakpet Corridor",
    },
    {
        "id": "Z011",
        "name": "Tolichowki–Attapur",
        "centroid": [17.3963, 78.4245],
        "radius": 0.022,
        "landmark": "Tolichowki Jn / Attapur Bridge",
        "road_segment": "PVNR Expressway Service Road",
    },
    {
        "id": "Z012",
        "name": "Kompally–Alwal",
        "centroid": [17.5005, 78.4968],
        "radius": 0.025,
        "landmark": "Kompally Crossroads / Alwal Jn",
        "road_segment": "NH44 Northern Stretch",
    },
]


def euclidean_distance(lat1, lon1, lat2, lon2):
    """Simple Euclidean distance in degree-space (sufficient for ~50km range)."""
    return math.sqrt((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2)


def cluster_incidents(incidents: list) -> list:
    """
    Assign each incident to the nearest zone within its capture radius.
    Compute risk scores, status, and factors for qualifying zones.
    Returns list of zone objects sorted by risk score descending.
    """
    from datetime import timedelta

    zones = []

    for zone_def in ZONE_DEFINITIONS:
        clat, clon = zone_def["centroid"]
        radius = zone_def["radius"]

        # Collect incidents within radius
        zone_incidents = [
            inc for inc in incidents
            if euclidean_distance(inc["latitude"], inc["longitude"], clat, clon) <= radius
        ]

        # Minimum 2 incidents to qualify as a zone (avoid false blackspots)
        if len(zone_incidents) < 2:
            continue

        raw_score = compute_zone_score(zone_incidents)
        risk_score = normalize_score(raw_score)
        status = determine_status(zone_incidents)
        top_factors = get_top_factors(zone_incidents)
        risk_level = get_risk_level(risk_score)

        # Count severity breakdown
        severity_counts = {"minor": 0, "major": 0, "fatal": 0}
        for inc in zone_incidents:
            severity_counts[inc["severity"]] = severity_counts.get(inc["severity"], 0) + 1

        # Recent incidents (last 30 days)
        recent_incidents = [
            inc for inc in zone_incidents
            if (REFERENCE_DATE - __import__("datetime").datetime.fromisoformat(inc["date"])).days <= 30
        ]

        # Confidence score: more incidents + higher severity = more confident
        confidence = min(99, 50 + len(zone_incidents) * 5 + severity_counts["fatal"] * 10)

        zone = {
            **zone_def,
            "incidentCount": len(zone_incidents),
            "recentCount": len(recent_incidents),
            "riskScore": risk_score,
            "riskLevel": risk_level,
            "status": status,
            "topFactors": top_factors,
            "severityBreakdown": severity_counts,
            "confidence": confidence,
            "incidents": zone_incidents,
        }
        zone["explanation"] = generate_explanation(zone)

        zones.append(zone)

    return sorted(zones, key=lambda z: z["riskScore"], reverse=True)
