/**
 * SafeRoute AI — Risk Engine (JavaScript)
 * Mirrors the Python backend logic for frontend self-contained operation.
 * 
 * Accident Risk Index (0–100) calculation:
 *   score = Σ (severity_weight × time_decay × flag_multiplier)
 *   normalized to 0–100 scale
 */

// Freeze reference date for demo consistency
export const REFERENCE_DATE = new Date('2024-03-15')

export const SEVERITY_WEIGHTS = { minor: 1.0, major: 2.5, fatal: 5.0 }

/**
 * Exponential time decay.
 * Half-life ≈ 31 days | 45-day characteristic decay.
 * Recent incidents dominate; old ones fade but aren't ignored.
 */
export function timeDecay(dateStr) {
  const date = new Date(dateStr)
  const daysAgo = (REFERENCE_DATE - date) / 86_400_000
  return Math.exp(-daysAgo / 45)
}

/**
 * Flag multiplier — amplifies score based on infrastructure/environmental risks.
 */
export function flagMultiplier(incident) {
  let mult = 1.0
  if (incident.weather_risk)        mult += 0.15
  if (incident.flood_risk)          mult += 0.20
  if (incident.construction_flag)   mult += 0.10
  if (incident.lighting_issue_flag) mult += 0.10
  if (incident.signal_issue_flag)   mult += 0.10
  if (incident.road_damage_flag)    mult += 0.08
  return mult
}

/** Per-incident weighted score. */
export function computeIncidentScore(incident) {
  const severity = SEVERITY_WEIGHTS[incident.severity] ?? 1.0
  return severity * timeDecay(incident.date) * flagMultiplier(incident)
}

/**
 * Aggregate zone score.
 * daysLimit: optional window in days (null = all incidents)
 */
export function computeZoneScore(incidents, daysLimit = null) {
  return incidents.reduce((total, inc) => {
    if (daysLimit !== null) {
      const daysAgo = (REFERENCE_DATE - new Date(inc.date)) / 86_400_000
      if (daysAgo > daysLimit) return total
    }
    return total + computeIncidentScore(inc)
  }, 0)
}

/** Scale raw score to 0–100. Max calibrated to dataset range. */
export function normalizeScore(raw, maxExpected = 18) {
  return Math.min(100, Math.round((raw / maxExpected) * 100))
}

/**
 * Dynamic zone status classification.
 * Compares last 30 days vs previous 31–120 days.
 */
export function determineStatus(incidents) {
  const recentScore = computeZoneScore(incidents, 30)

  const historicalIncidents = incidents.filter(inc => {
    const daysAgo = (REFERENCE_DATE - new Date(inc.date)) / 86_400_000
    return daysAgo > 30 && daysAgo <= 120
  })
  const historicalScore = computeZoneScore(historicalIncidents)

  if (historicalScore < 0.05) {
    return recentScore > 0.5 ? 'Escalating' : 'Stable'
  }

  const ratio = recentScore / historicalScore
  if (ratio > 1.3)  return 'Escalating'
  if (ratio < 0.60) return 'Improving'
  return 'Stable'
}

export function getRiskLevel(score) {
  if (score >= 75) return 'Critical'
  if (score >= 50) return 'High'
  if (score >= 25) return 'Moderate'
  return 'Low'
}

export const RISK_COLORS = {
  Critical: '#ef4444',
  High:     '#f97316',
  Moderate: '#f59e0b',
  Low:      '#10b981',
}

export const STATUS_COLORS = {
  Escalating: '#ef4444',
  Stable:     '#60a5fa',
  Improving:  '#10b981',
}

/**
 * Compute top contributing risk factors for a zone.
 */
export function getTopFactors(incidents) {
  const scores = {
    'High Severity History':  0,
    'Nighttime Risk':         0,
    'Weather Exposure':       0,
    'Flooding Risk':          0,
    'Construction Activity':  0,
    'Signal Failures':        0,
    'Poor Lighting':          0,
    'Road Deterioration':     0,
    'High Traffic Volume':    0,
  }

  for (const inc of incidents) {
    const w = SEVERITY_WEIGHTS[inc.severity] ?? 1.0
    if (['fatal', 'major'].includes(inc.severity)) scores['High Severity History'] += w
    if (['night', 'late-night'].includes(inc.time_band)) scores['Nighttime Risk'] += w * 0.8
    if (inc.weather_risk)        scores['Weather Exposure']      += w * 1.2
    if (inc.flood_risk)          scores['Flooding Risk']         += w * 1.3
    if (inc.construction_flag)   scores['Construction Activity'] += w * 0.9
    if (inc.signal_issue_flag)   scores['Signal Failures']       += w * 0.8
    if (inc.lighting_issue_flag) scores['Poor Lighting']         += w * 0.9
    if (inc.road_damage_flag)    scores['Road Deterioration']    += w * 0.7
    scores['High Traffic Volume'] += w * 0.3
  }

  return Object.entries(scores)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([k]) => k)
}

/** Generate natural-language explanation for a zone. */
export function generateExplanation(zone) {
  const phrases = {
    'High Severity History':  'a history of high-severity collisions',
    'Nighttime Risk':         'elevated nighttime accident rates',
    'Weather Exposure':       'adverse weather conditions',
    'Flooding Risk':          'recurring flood exposure',
    'Construction Activity':  'active construction zones',
    'Signal Failures':        'signal malfunction incidents',
    'Poor Lighting':          'inadequate road lighting',
    'Road Deterioration':     'deteriorated road surfaces',
    'High Traffic Volume':    'high traffic density',
  }

  const top = (zone.topFactors ?? []).slice(0, 3).map(f => phrases[f] ?? f.toLowerCase())

  const intros = {
    Escalating: 'Risk is rising sharply, driven by',
    Stable:     'Risk remains consistently elevated due to',
    Improving:  'Conditions are gradually improving — key remaining factors:',
  }
  const intro = intros[zone.status] ?? 'Risk is elevated due to'

  if (top.length === 0) return `${intro} multiple compounding factors.`
  if (top.length === 1) return `${intro} ${top[0]}.`
  if (top.length === 2) return `${intro} ${top[0]} and ${top[1]}.`
  return `${intro} ${top[0]}, ${top[1]}, and ${top[2]}.`
}

/**
 * Filter incidents by active dashboard filters.
 */
export function applyFilters(incidents, filters) {
  const { days, severity, weatherOnly, infraOnly } = filters
  const cutoff = new Date(REFERENCE_DATE)
  cutoff.setDate(cutoff.getDate() - days)

  return incidents.filter(inc => {
    if (new Date(inc.date) < cutoff) return false
    if (severity === 'fatal' && inc.severity !== 'fatal') return false
    if (severity === 'major_fatal' && !['fatal', 'major'].includes(inc.severity)) return false
    if (weatherOnly && !inc.weather_risk && !inc.flood_risk) return false
    if (infraOnly && !inc.construction_flag && !inc.lighting_issue_flag && !inc.signal_issue_flag && !inc.road_damage_flag) return false
    return true
  })
}
