import { Filter, Cloud, Construction } from 'lucide-react'

const TIME_OPTIONS = [
  { value: 30,  label: '30d' },
  { value: 90,  label: '90d' },
  { value: 180, label: '6m'  },
]

const SEV_OPTIONS = [
  { value: 'all',         label: 'All' },
  { value: 'major_fatal', label: 'Major+' },
  { value: 'fatal',       label: 'Fatal only' },
]

const STATUS_OPTIONS = [
  { value: 'all',        label: 'All zones' },
  { value: 'Escalating', label: '↑ Escalating' },
  { value: 'Stable',     label: '— Stable' },
  { value: 'Improving',  label: '↓ Improving' },
]

function ToggleGroup({ options, value, onChange }) {
  return (
    <div className="flex rounded-lg border border-navy-500 overflow-hidden">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 text-xs font-mono transition-all duration-150 border-r border-navy-500 last:border-r-0
            ${value === opt.value
              ? 'bg-amber-glow text-navy-900 font-bold'
              : 'text-gray-400 hover:text-white hover:bg-navy-600'
            }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Toggle({ label, checked, onChange, icon: Icon, activeColor = '#60a5fa' }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all duration-150
        ${checked
          ? 'text-white border-opacity-60'
          : 'text-gray-500 border-navy-500 hover:text-gray-300'
        }`}
      style={checked ? { borderColor: `${activeColor}60`, background: `${activeColor}18`, color: activeColor } : {}}
    >
      {Icon && <Icon size={12} />}
      {label}
    </button>
  )
}

export default function DashboardFilters({ filters, onChange }) {
  const set = (key) => (val) => onChange({ ...filters, [key]: val })

  return (
    <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl border border-navy-500 bg-navy-700">
      <Filter size={14} className="text-gray-500 flex-shrink-0" />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wide">Period</span>
          <ToggleGroup options={TIME_OPTIONS} value={filters.days} onChange={set('days')} />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wide">Severity</span>
          <ToggleGroup options={SEV_OPTIONS} value={filters.severity} onChange={set('severity')} />
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wide">Status</span>
          <ToggleGroup options={STATUS_OPTIONS} value={filters.zoneStatus} onChange={set('zoneStatus')} />
        </div>

        <div className="flex items-center gap-1.5">
          <Toggle
            label="Weather Risk"
            checked={filters.weatherOnly}
            onChange={set('weatherOnly')}
            icon={Cloud}
            activeColor="#60a5fa"
          />
          <Toggle
            label="Infra Risk"
            checked={filters.infraOnly}
            onChange={set('infraOnly')}
            icon={Construction}
            activeColor="#f59e0b"
          />
        </div>
      </div>
    </div>
  )
}
