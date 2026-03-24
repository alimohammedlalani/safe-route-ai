import { TrendingUp, Minus, TrendingDown, AlertTriangle, AlertCircle, CheckCircle, Info } from 'lucide-react'

const STATUS_CONFIG = {
  Escalating: {
    cls: 'bg-red-500/10 text-red-400 border-red-500/25',
    icon: TrendingUp,
    dot: 'bg-red-400',
  },
  Stable: {
    cls: 'bg-blue-500/10 text-blue-400 border-blue-500/25',
    icon: Minus,
    dot: 'bg-blue-400',
  },
  Improving: {
    cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25',
    icon: TrendingDown,
    dot: 'bg-emerald-400',
  },
}

const RISK_CONFIG = {
  Critical: { cls: 'bg-red-500/10 text-red-400 border-red-500/25',    icon: AlertTriangle },
  High:     { cls: 'bg-orange-500/10 text-orange-400 border-orange-500/25', icon: AlertCircle },
  Moderate: { cls: 'bg-amber-500/10 text-amber-400 border-amber-500/25',    icon: Info },
  Low:      { cls: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25', icon: CheckCircle },
}

export function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.Stable
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${cfg.cls}`}>
      <Icon size={10} />
      {status}
    </span>
  )
}

export function RiskBadge({ level }) {
  const cfg = RISK_CONFIG[level] ?? RISK_CONFIG.Moderate
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-bold border ${cfg.cls}`}>
      <Icon size={10} />
      {level}
    </span>
  )
}
