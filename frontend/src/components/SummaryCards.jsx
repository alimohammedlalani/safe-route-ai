import { MapPin, AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react'

function Card({ icon: Icon, label, value, sub, color = '#f4a261', trend }) {
  return (
    <div className="card p-4 flex items-start gap-3 animate-fade-in card-hover cursor-default">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}30` }}
      >
        <Icon size={18} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-body text-gray-500 mb-0.5 truncate">{label}</p>
        <p className="font-display font-bold text-2xl text-white leading-tight">{value}</p>
        {sub && <p className="text-[11px] font-mono text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
}

export default function SummaryCards({ zones, incidents }) {
  const critical   = zones.filter(z => z.riskLevel === 'Critical').length
  const improving  = zones.filter(z => z.status === 'Improving').length
  const escalating = zones.filter(z => z.status === 'Escalating').length
  const fatal      = incidents.filter(i => i.severity === 'fatal').length

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card
        icon={Activity}
        label="Total Incidents"
        value={incidents.length}
        sub={`${fatal} fatal`}
        color="#f4a261"
      />
      <Card
        icon={MapPin}
        label="Active Risk Zones"
        value={zones.length}
        sub="Clustered blackspots"
        color="#60a5fa"
      />
      <Card
        icon={AlertTriangle}
        label="Critical Clusters"
        value={critical}
        sub="Score ≥ 75"
        color="#ef4444"
      />
      <Card
        icon={TrendingDown}
        label="Improving Zones"
        value={improving}
        sub={`${escalating} escalating`}
        color="#10b981"
      />
    </div>
  )
}
