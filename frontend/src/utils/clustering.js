/**
 * SafeRoute AI — Zone Clustering (JavaScript)
 * 
 * Approach: Pre-defined zone centroids for Hyderabad's known corridors.
 * Each incident is assigned to the nearest zone within its capture radius.
 * Zones with < 2 incidents are excluded (minimum cluster size).
 * 
 * This is a deliberate, transparent design choice:
 * - More reliable than pure DBSCAN for sparse hackathon demo data
 * - Aligns with domain knowledge of known Hyderabad blackspot corridors
 * - Produces stable, predictable clusters for demo purposes
 */

import {
  computeZoneScore,
  normalizeScore,
  determineStatus,
  getTopFactors,
  getRiskLevel,
  generateExplanation,
  REFERENCE_DATE,
} from './riskEngine'

// Pre-defined Hyderabad risk zone definitions
export const ZONE_DEFINITIONS = [
  {
    id: 'Z001',
    name: 'Gachibowli–HITEC Corridor',
    centroid: [17.4440, 78.3620],
    radius: 0.028,
    landmark: 'ORR Exit 7 / ISB Road',
    road_segment: 'ORR–Gachibowli–Madhapur',
  },
  {
    id: 'Z002',
    name: 'Kukatpally–KPHB',
    centroid: [17.4855, 78.4138],
    radius: 0.022,
    landmark: 'KPHB Colony / NH65 Junction',
    road_segment: 'NH65 Kukatpally Stretch',
  },
  {
    id: 'Z003',
    name: 'LB Nagar–Nagole Corridor',
    centroid: [17.3560, 78.5500],
    radius: 0.030,
    landmark: 'LB Nagar X Roads / Nagole Bridge',
    road_segment: 'RR District Ring Road',
  },
  {
    id: 'Z004',
    name: 'Mehdipatnam–Ameerpet',
    centroid: [17.4160, 78.4428],
    radius: 0.028,
    landmark: 'Mehdipatnam Flyover / Ameerpet Metro',
    road_segment: 'Inner Ring Road West',
  },
  {
    id: 'Z005',
    name: 'Shamshabad ORR–Airport Stretch',
    centroid: [17.2408, 78.4297],
    radius: 0.030,
    landmark: 'ORR Exit 14 / Airport Expressway',
    road_segment: 'NH44 Airport Expressway',
  },
  {
    id: 'Z006',
    name: 'Uppal–Habsiguda',
    centroid: [17.4063, 78.5580],
    radius: 0.022,
    landmark: 'Uppal X Roads / RTC Colony',
    road_segment: 'Uppal Main Road–Ring Road',
  },
  {
    id: 'Z007',
    name: 'Jubilee Hills–Banjara Hills',
    centroid: [17.4220, 78.4108],
    radius: 0.022,
    landmark: 'JH Check Post / Road No. 12',
    road_segment: 'JH–BH Internal Roads',
  },
  {
    id: 'Z008',
    name: 'Secunderabad–Begumpet',
    centroid: [17.4420, 78.4810],
    radius: 0.025,
    landmark: 'Clock Tower Junction / SD Road',
    road_segment: 'SD Road–Begumpet Arterial',
  },
  {
    id: 'Z009',
    name: 'Miyapur–BHEL Chowk',
    centroid: [17.4965, 78.3576],
    radius: 0.020,
    landmark: 'Miyapur X Roads / BHEL Gate',
    road_segment: 'Miyapur–Chandanagar NH65 Link',
  },
  {
    id: 'Z010',
    name: 'Dilsukhnagar–Kothapet',
    centroid: [17.3688, 78.5260],
    radius: 0.022,
    landmark: 'Dilsukhnagar Bus Terminal',
    road_segment: 'Dilsukhnagar–Malakpet Corridor',
  },
  {
    id: 'Z011',
    name: 'Tolichowki–Attapur',
    centroid: [17.3963, 78.4245],
    radius: 0.022,
    landmark: 'Tolichowki Jn / Attapur Bridge',
    road_segment: 'PVNR Expressway Service Road',
  },
  {
    id: 'Z012',
    name: 'Kompally–Alwal',
    centroid: [17.5005, 78.4968],
    radius: 0.025,
    landmark: 'Kompally Crossroads / Alwal Jn',
    road_segment: 'NH44 Northern Stretch',
  },
]

function dist(lat1, lon1, lat2, lon2) {
  return Math.sqrt((lat1 - lat2) ** 2 + (lon1 - lon2) ** 2)
}

/**
 * Cluster incidents into zones and compute full zone objects.
 * Returns zones sorted by risk score (highest first).
 */
export function clusterIncidents(incidents) {
  const zones = []

  for (const def of ZONE_DEFINITIONS) {
    const [clat, clon] = def.centroid

    // Assign incidents within radius
    const zoneIncidents = incidents.filter(inc =>
      dist(inc.latitude, inc.longitude, clat, clon) <= def.radius
    )

    // Minimum cluster size: 2 incidents
    if (zoneIncidents.length < 2) continue

    const rawScore    = computeZoneScore(zoneIncidents)
    const riskScore   = normalizeScore(rawScore)
    const status      = determineStatus(zoneIncidents)
    const topFactors  = getTopFactors(zoneIncidents)
    const riskLevel   = getRiskLevel(riskScore)

    // Severity breakdown
    const severityBreakdown = { minor: 0, major: 0, fatal: 0 }
    for (const inc of zoneIncidents) severityBreakdown[inc.severity] = (severityBreakdown[inc.severity] || 0) + 1

    // Recent incidents (last 30 days)
    const recentCount = zoneIncidents.filter(inc =>
      (REFERENCE_DATE - new Date(inc.date)) / 86_400_000 <= 30
    ).length

    // Confidence: function of count + fatal weight
    const confidence = Math.min(99, 50 + zoneIncidents.length * 5 + severityBreakdown.fatal * 10)

    const zone = {
      ...def,
      incidentCount: zoneIncidents.length,
      recentCount,
      riskScore,
      riskLevel,
      status,
      topFactors,
      severityBreakdown,
      confidence,
      incidents: zoneIncidents,
    }
    zone.explanation = generateExplanation(zone)

    zones.push(zone)
  }

  return zones.sort((a, b) => b.riskScore - a.riskScore)
}
