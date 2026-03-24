"""
SafeRoute AI - Risk Engine
Computes Accident Risk Index (0-100) using:
  - Severity weighting
  - Time-decay (exponential, half-life ~45 days)
  - Environmental flag multipliers
  - Zone status classification (Improving / Stable / Escalating)
"""

import math
from datetime import datetime, timedelta

# Demo reference date — freeze point for hackathon
REFERENCE_DATE = datetime(2024, 3, 15)

# Severity base weights
SEVERITY_WEIGHTS = {
    "minor": 1.0,
    "major": 2.5,
    "fatal": 5.0,
}


def time_decay(incident_date_str: str) -> float:
    """
    Exponential decay based on recency.
    Incidents from 45 days ago have ~37% weight.
    Incidents from 90 days ago have ~14% weight.
    """
    date = datetime.fromisoformat(incident_date_str)
    days_ago = (REFERENCE_DATE - date).days
    return math.exp(-days_ago / 45)


def flag_multiplier(incident: dict) -> float:
    """
    Infrastructure and environmental risk amplifier.
    Each active flag increases the incident's contribution.
    """
    mult = 1.0
    if incident.get("weather_risk"):     mult += 0.15
    if incident.get("flood_risk"):       mult += 0.20
    if incident.get("construction_flag"):mult += 0.10
    if incident.get("lighting_issue_flag"): mult += 0.10
    if incident.get("signal_issue_flag"):   mult += 0.10
    if incident.get("road_damage_flag"):    mult += 0.08
    return mult


def compute_incident_score(incident: dict) -> float:
    """
    Weighted score for a single incident.
    score = severity_weight × time_decay × flag_multiplier
    """
    severity = SEVERITY_WEIGHTS.get(incident["severity"], 1.0)
    decay = time_decay(incident["date"])
    flags = flag_multiplier(incident)
    return severity * decay * flags


def compute_zone_score(incidents: list, days_limit: int = None) -> float:
    """
    Sum of weighted incident scores for a zone.
    Optionally restrict to incidents within 'days_limit' days.
    """
    total = 0.0
    for inc in incidents:
        if days_limit is not None:
            days_ago = (REFERENCE_DATE - datetime.fromisoformat(inc["date"])).days
            if days_ago > days_limit:
                continue
        total += compute_incident_score(inc)
    return total


def normalize_score(raw: float, max_expected: float = 18.0) -> int:
    """Scale raw score to 0–100. max_expected calibrated to dataset."""
    return min(100, int((raw / max_expected) * 100))


def determine_status(incidents: list) -> str:
    """
    Compare recent (last 30 days) vs historical (31–120 days) weighted scores.
    - ratio > 1.3  → Escalating
    - ratio < 0.60 → Improving
    - else         → Stable
    """
    recent_score = compute_zone_score(incidents, days_limit=30)

    historical_incidents = [
        i for i in incidents
        if 30 < (REFERENCE_DATE - datetime.fromisoformat(i["date"])).days <= 120
    ]
    historical_score = compute_zone_score(historical_incidents)

    if historical_score < 0.05:
        return "Escalating" if recent_score > 0.5 else "Stable"

    ratio = recent_score / historical_score
    if ratio > 1.3:
        return "Escalating"
    elif ratio < 0.60:
        return "Improving"
    return "Stable"


def get_risk_level(score: int) -> str:
    if score >= 75: return "Critical"
    if score >= 50: return "High"
    if score >= 25: return "Moderate"
    return "Low"


def get_top_factors(incidents: list) -> list:
    """
    Compute top contributing risk factors for a zone's incidents.
    Returns ordered list of factor names.
    """
    factor_scores = {
        "High Severity History":  0.0,
        "Nighttime Risk":         0.0,
        "Weather Exposure":       0.0,
        "Flooding Risk":          0.0,
        "Construction Activity":  0.0,
        "Signal Failures":        0.0,
        "Poor Lighting":          0.0,
        "Road Deterioration":     0.0,
        "High Traffic Volume":    0.0,
    }

    for inc in incidents:
        w = SEVERITY_WEIGHTS.get(inc["severity"], 1.0)
        if inc["severity"] in ("fatal", "major"):
            factor_scores["High Severity History"] += w
        if inc.get("time_band") in ("night", "late-night"):
            factor_scores["Nighttime Risk"] += w * 0.8
        if inc.get("weather_risk"):
            factor_scores["Weather Exposure"] += w * 1.2
        if inc.get("flood_risk"):
            factor_scores["Flooding Risk"] += w * 1.3
        if inc.get("construction_flag"):
            factor_scores["Construction Activity"] += w * 0.9
        if inc.get("signal_issue_flag"):
            factor_scores["Signal Failures"] += w * 0.8
        if inc.get("lighting_issue_flag"):
            factor_scores["Poor Lighting"] += w * 0.9
        if inc.get("road_damage_flag"):
            factor_scores["Road Deterioration"] += w * 0.7
        # Baseline traffic proxy
        factor_scores["High Traffic Volume"] += w * 0.3

    return [
        k for k, v in sorted(factor_scores.items(), key=lambda x: x[1], reverse=True)
        if v > 0
    ][:5]


def generate_explanation(zone: dict) -> str:
    """Generate a natural-language risk explanation for a zone."""
    factor_phrases = {
        "High Severity History":  "a history of high-severity collisions",
        "Nighttime Risk":         "elevated nighttime accident rates",
        "Weather Exposure":       "adverse weather conditions",
        "Flooding Risk":          "recurring flood exposure",
        "Construction Activity":  "active construction zones",
        "Signal Failures":        "signal malfunction incidents",
        "Poor Lighting":          "inadequate road lighting",
        "Road Deterioration":     "deteriorated road surface",
        "High Traffic Volume":    "high traffic density",
    }

    phrases = [
        factor_phrases.get(f, f.lower())
        for f in zone.get("topFactors", [])[:3]
    ]

    intros = {
        "Escalating": "Risk is rising sharply, driven by",
        "Stable":     "Risk remains consistently elevated due to",
        "Improving":  "Conditions are improving, but key factors remain:",
    }
    intro = intros.get(zone["status"], "Risk is elevated due to")

    if len(phrases) >= 3:
        return f"{intro} {phrases[0]}, {phrases[1]}, and {phrases[2]}."
    elif len(phrases) == 2:
        return f"{intro} {phrases[0]} and {phrases[1]}."
    elif phrases:
        return f"{intro} {phrases[0]}."
    return f"{intro} multiple compounding factors."
