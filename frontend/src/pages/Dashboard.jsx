import { useState, useMemo } from 'react'
import { INCIDENTS } from '../data/incidents'
import { applyFilters } from '../utils/riskEngine'
import { clusterIncidents } from '../utils/clustering'
import SummaryCards from '../components/SummaryCards'
import DashboardFilters from '../components/DashboardFilters'
import RiskMap from '../components/RiskMap'
import ZoneTable from '../components/ZoneTable'
import ZoneDrawer from '../components/ZoneDrawer'

const DEFAULT_FILTERS = {
  days:       180,
  severity:   'all',
  zoneStatus: 'all',
  weatherOnly: false,
  infraOnly:   false,
}

export default function Dashboard() {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [selectedZone, setSelectedZone] = useState(null)

  // Apply filters to incidents
  const filteredIncidents = useMemo(
    () => applyFilters(INCIDENTS, filters),
    [filters]
  )

  // Cluster filtered incidents into zones
  const allZones = useMemo(
    () => clusterIncidents(filteredIncidents),
    [filteredIncidents]
  )

  // Apply zone-status filter on top
  const zones = useMemo(() => {
    if (filters.zoneStatus === 'all') return allZones
    return allZones.filter(z => z.status === filters.zoneStatus)
  }, [allZones, filters.zoneStatus])

  const handleZoneClick = (zone) => {
    setSelectedZone(prev => prev?.id === zone.id ? null : zone)
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
      <div className="flex-1 overflow-auto">
        <div className="max-w-screen-2xl mx-auto px-4 py-4 space-y-4">
          {/* Page header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display font-bold text-xl text-white">Risk Dashboard</h1>
              <p className="text-xs font-mono text-gray-500 mt-0.5">
                Hyderabad Accident Risk Intelligence · Reference: Mar 15, 2024
              </p>
            </div>
          </div>

          {/* Summary cards */}
          <SummaryCards zones={allZones} incidents={filteredIncidents} />

          {/* Filters */}
          <DashboardFilters filters={filters} onChange={setFilters} />

          {/* Main content: map + zone list */}
          <div className="grid lg:grid-cols-[1fr_340px] gap-4 items-start">
            {/* Map */}
            <div style={{ height: '560px' }}>
              <RiskMap
                zones={zones}
                incidents={filteredIncidents}
                selectedZone={selectedZone}
                onZoneClick={handleZoneClick}
              />
            </div>

            {/* Zone list */}
            <div className="max-h-[560px] overflow-y-auto">
              <ZoneTable zones={zones} onZoneClick={handleZoneClick} />
            </div>
          </div>

          {/* Bottom hint */}
          <p className="text-[10px] font-mono text-gray-600 text-center pb-4">
            Click any zone marker or row to view detailed risk breakdown · Demo data · Hyderabad, Telangana
          </p>
        </div>
      </div>

      {/* Zone detail drawer */}
      {selectedZone && (
        <ZoneDrawer
          zone={selectedZone}
          onClose={() => setSelectedZone(null)}
        />
      )}
    </div>
  )
}
