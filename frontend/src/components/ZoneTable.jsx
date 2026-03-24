import { ChevronRight, MapPin } from 'lucide-react'
import RiskScoreRing from './RiskScoreRing'
import { StatusBadge, RiskBadge } from './Badges'

export default function ZoneTable({ zones, onZoneClick }) {
  return (
    <div className="card overflow-hidden">
      <div className="px-4 py-3 border-b border-navy-500 flex items-center justify-between">
        <h3 className="font-display font-bold text-sm text-white">Risk Zones</h3>
        <span className="text-[10px] font-mono text-gray-500">{zones.length} active zones</span>
      </div>
      <div className="divide-y divide-navy-500">
        {zones.map((zone) => (
          <button
            key={zone.id}
            onClick={() => onZoneClick(zone)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-navy-600 transition-all duration-150 group"
          >
            <RiskScoreRing score={zone.riskScore} level={zone.riskLevel} size="sm" />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-body font-medium text-white truncate leading-tight">{zone.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <MapPin size={9} className="text-gray-600 flex-shrink-0" />
                    <p className="text-[10px] font-mono text-gray-500 truncate">{zone.landmark}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <RiskBadge level={zone.riskLevel} />
                  <StatusBadge status={zone.status} />
                </div>
              </div>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] font-mono text-gray-500">{zone.incidentCount} incidents</span>
                <span className="text-[10px] font-mono text-gray-600">·</span>
                <span className="text-[10px] font-mono text-gray-500">{zone.recentCount} recent</span>
                <span className="text-[10px] font-mono text-gray-600">·</span>
                <span className="text-[10px] font-mono text-gray-500">conf. {zone.confidence}%</span>
              </div>
            </div>

            <ChevronRight size={14} className="text-gray-600 flex-shrink-0 group-hover:text-gray-400 transition-colors" />
          </button>
        ))}

        {zones.length === 0 && (
          <div className="px-4 py-8 text-center text-gray-500 text-xs font-mono">
            No zones match current filters
          </div>
        )}
      </div>
    </div>
  )
}
