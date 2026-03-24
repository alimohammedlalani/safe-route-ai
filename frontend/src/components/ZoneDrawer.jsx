import { X, MapPin, Calendar, AlertCircle, Lightbulb, Target, TrendingUp } from 'lucide-react'
import RiskScoreRing from './RiskScoreRing'
import { StatusBadge, RiskBadge } from './Badges'
import { RISK_COLORS } from '../utils/riskEngine'

const FACTOR_ICONS = {
  'High Severity History':  '💥',
  'Nighttime Risk':         '🌙',
  'Weather Exposure':       '⛈️',
  'Flooding Risk':          '🌊',
  'Construction Activity':  '🚧',
  'Signal Failures':        '🚦',
  'Poor Lighting':          '🔦',
  'Road Deterioration':     '⚠️',
  'High Traffic Volume':    '🚗',
}

function FactorBar({ factor, index, max = 5 }) {
  const width = Math.round(100 - (index / max) * 55)
  const color = index === 0 ? '#ef4444' : index === 1 ? '#f97316' : '#f59e0b'
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-base w-6 text-center">{FACTOR_ICONS[factor] ?? '📍'}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] font-body text-gray-300">{factor}</span>
          <span className="text-[10px] font-mono text-gray-500">#{index + 1}</span>
        </div>
        <div className="h-1 rounded-full bg-navy-500">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${width}%`, background: color }}
          />
        </div>
      </div>
    </div>
  )
}

function SeverityBar({ label, count, total, color }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-mono w-12 text-right" style={{ color }}>{label}</span>
      <div className="flex-1 h-2 rounded-full bg-navy-500">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-[10px] font-mono text-gray-400 w-5 text-right">{count}</span>
    </div>
  )
}

export default function ZoneDrawer({ zone, onClose }) {
  if (!zone) return null

  const color       = RISK_COLORS[zone.riskLevel] ?? '#10b981'
  const total       = zone.incidentCount
  const { minor, major, fatal } = zone.severityBreakdown

  // Last 5 incidents sorted by date desc
  const recent = [...(zone.incidents ?? [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5)

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <aside className="fixed top-14 right-0 bottom-0 z-40 w-[360px] border-l border-navy-500 overflow-y-auto animate-slide-in"
        style={{ background: '#0d1117' }}>
        {/* Header */}
        <div className="sticky top-0 z-10 border-b border-navy-500 px-5 py-4"
          style={{ background: '#0d1117' }}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display font-bold text-base text-white leading-tight">{zone.name}</h2>
              <div className="flex items-center gap-1.5 mt-1 text-[11px] font-mono text-gray-500">
                <MapPin size={10} />
                {zone.landmark}
              </div>
            </div>
            <button onClick={onClose}
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-gray-500
                         hover:text-white hover:bg-navy-600 transition-all">
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-5">
          {/* Risk score + badges */}
          <div className="flex items-center gap-4">
            <RiskScoreRing score={zone.riskScore} level={zone.riskLevel} size="lg" />
            <div className="space-y-1.5">
              <RiskBadge level={zone.riskLevel} />
              <StatusBadge status={zone.status} />
              <div className="flex items-center gap-1.5 mt-1">
                <Target size={10} className="text-gray-500" />
                <span className="text-[10px] font-mono text-gray-500">
                  Confidence: {zone.confidence}%
                </span>
              </div>
            </div>
          </div>

          {/* Explanation */}
          <div className="rounded-xl p-3.5 border"
            style={{ background: `${color}08`, borderColor: `${color}25` }}>
            <div className="flex items-start gap-2">
              <Lightbulb size={13} style={{ color }} className="mt-0.5 flex-shrink-0" />
              <p className="text-xs font-body leading-relaxed text-gray-300">{zone.explanation}</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Total',   value: total,           sub: 'incidents' },
              { label: 'Recent',  value: zone.recentCount, sub: 'last 30d' },
              { label: 'Segment', value: zone.road_segment?.split('–')[0] ?? '—', sub: 'road type' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="rounded-lg bg-navy-700 border border-navy-500 p-3 text-center">
                <div className="font-display font-bold text-lg text-white leading-tight">{value}</div>
                <div className="text-[9px] font-mono text-gray-500 mt-0.5 uppercase tracking-wide">{label}</div>
                <div className="text-[9px] font-body text-gray-600">{sub}</div>
              </div>
            ))}
          </div>

          {/* Severity breakdown */}
          <div>
            <h3 className="text-[11px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2.5">
              Severity Breakdown
            </h3>
            <div className="space-y-2">
              <SeverityBar label="Fatal"  count={fatal} total={total} color="#ef4444" />
              <SeverityBar label="Major"  count={major} total={total} color="#f97316" />
              <SeverityBar label="Minor"  count={minor} total={total} color="#10b981" />
            </div>
          </div>

          {/* Top risk factors */}
          <div>
            <h3 className="text-[11px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2.5">
              Risk Factors
            </h3>
            <div className="space-y-3">
              {zone.topFactors?.map((f, i) => (
                <FactorBar key={f} factor={f} index={i} />
              ))}
            </div>
          </div>

          {/* Recent incidents timeline */}
          <div>
            <h3 className="text-[11px] font-mono font-bold text-gray-500 uppercase tracking-widest mb-2.5">
              Recent Incidents
            </h3>
            <div className="space-y-2">
              {recent.map(inc => {
                const sevColors = { fatal: '#ef4444', major: '#f97316', minor: '#10b981' }
                const sc = sevColors[inc.severity] ?? '#60a5fa'
                return (
                  <div key={inc.id}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg bg-navy-700 border border-navy-500">
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: sc }} />
                    <div className="min-w-0">
                      <p className="text-[11px] font-body text-gray-300 leading-tight truncate">{inc.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-gray-500">{inc.date} · {inc.time}</span>
                        <span className="text-[9px] font-mono uppercase" style={{ color: sc }}>{inc.severity}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Road segment */}
          <div className="rounded-lg bg-navy-700 border border-navy-500 p-3">
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wide mb-1">Road Segment</p>
            <p className="text-xs font-body text-gray-300">{zone.road_segment}</p>
          </div>
        </div>
      </aside>
    </>
  )
}
