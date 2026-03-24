import { useMemo } from 'react'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'
import { INCIDENTS } from '../data/incidents'
import { clusterIncidents } from '../utils/clustering'
import { REFERENCE_DATE, RISK_COLORS } from '../utils/riskEngine'
import { StatusBadge, RiskBadge } from '../components/Badges'
import RiskScoreRing from '../components/RiskScoreRing'

const CHART_STYLE = {
  fontSize: 10,
  fontFamily: "'Space Mono', monospace",
  fill: '#8899aa',
}

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="card p-5">
      <h3 className="font-display font-bold text-sm text-white mb-0.5">{title}</h3>
      {subtitle && <p className="text-[10px] font-mono text-gray-500 mb-4">{subtitle}</p>}
      {children}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg border border-navy-500 px-3 py-2.5 text-xs"
      style={{ background: '#111827' }}>
      <p className="font-mono text-gray-400 mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-gray-300">{p.name}:</span>
          <span className="font-bold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Trends() {
  const zones = useMemo(() => clusterIncidents(INCIDENTS), [])

  // Monthly series: last 6 months
  const monthly = useMemo(() => {
    const counts = {}
    const months = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(REFERENCE_DATE)
      d.setMonth(d.getMonth() - i)
      const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      counts[key] = { month: key, minor: 0, major: 0, fatal: 0, total: 0 }
      months.push(key)
    }
    for (const inc of INCIDENTS) {
      const d = new Date(inc.date)
      const key = d.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' })
      if (counts[key]) {
        counts[key][inc.severity]++
        counts[key].total++
      }
    }
    return months.map(m => counts[m])
  }, [])

  // Time-of-day distribution
  const todData = useMemo(() => {
    const bands = { morning: 0, afternoon: 0, evening: 0, night: 0, 'late-night': 0 }
    for (const inc of INCIDENTS) bands[inc.time_band] = (bands[inc.time_band] ?? 0) + 1
    return Object.entries(bands).map(([band, count]) => ({ band, count }))
  }, [])

  // Severity pie
  const sevData = useMemo(() => {
    const s = { minor: 0, major: 0, fatal: 0 }
    for (const inc of INCIDENTS) s[inc.severity]++
    return [
      { name: 'Minor',  value: s.minor,  color: '#10b981' },
      { name: 'Major',  value: s.major,  color: '#f97316' },
      { name: 'Fatal',  value: s.fatal,  color: '#ef4444' },
    ]
  }, [])

  // Cause tag frequency
  const causeTags = useMemo(() => {
    const freq = {}
    for (const inc of INCIDENTS) {
      for (const tag of (inc.possible_cause_tags ?? [])) {
        freq[tag] = (freq[tag] ?? 0) + 1
      }
    }
    return Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, count]) => ({ tag, count }))
  }, [])

  const topZones     = zones.slice(0, 5)
  const improvingZ   = zones.filter(z => z.status === 'Improving').slice(0, 3)
  const escalatingZ  = zones.filter(z => z.status === 'Escalating').slice(0, 3)

  return (
    <div className="flex-1 overflow-auto">
      <div className="max-w-screen-xl mx-auto px-4 py-4 space-y-4 pb-12">
        {/* Header */}
        <div>
          <h1 className="font-display font-bold text-xl text-white">Trends &amp; Insights</h1>
          <p className="text-xs font-mono text-gray-500 mt-0.5">6-month analysis · Hyderabad accident patterns</p>
        </div>

        {/* Row 1: Monthly trend + TOD */}
        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard title="Monthly Incident Trend" subtitle="Fatal, Major, Minor breakdown over 6 months">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthly} barSize={12} barGap={2}>
                <CartesianGrid stroke="#1e2a3a" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={CHART_STYLE} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="fatal"  name="Fatal"  fill="#ef4444" radius={[2,2,0,0]} />
                <Bar dataKey="major"  name="Major"  fill="#f97316" radius={[2,2,0,0]} />
                <Bar dataKey="minor"  name="Minor"  fill="#10b981" radius={[2,2,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard title="Time-of-Day Distribution" subtitle="When accidents occur most frequently">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={todData} barSize={28}>
                <CartesianGrid stroke="#1e2a3a" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="band" tick={{ ...CHART_STYLE, fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={CHART_STYLE} axisLine={false} tickLine={false} width={24} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Incidents" radius={[3,3,0,0]}>
                  {todData.map((entry, i) => (
                    <Cell key={i} fill={
                      entry.band === 'late-night' || entry.band === 'night'
                        ? '#ef4444'
                        : entry.band === 'evening'
                        ? '#f97316'
                        : '#f59e0b'
                    } />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 2: Zone tables + Severity pie */}
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Top zones */}
          <div className="lg:col-span-2 card overflow-hidden">
            <div className="px-4 py-3 border-b border-navy-500">
              <h3 className="font-display font-bold text-sm text-white">Top High-Risk Zones</h3>
            </div>
            <div className="divide-y divide-navy-500">
              {topZones.map((z, i) => (
                <div key={z.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="font-mono text-xs text-gray-600 w-5">#{i + 1}</span>
                  <RiskScoreRing score={z.riskScore} level={z.riskLevel} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-body font-medium text-white truncate">{z.name}</p>
                    <p className="text-[10px] font-mono text-gray-500 truncate">{z.landmark}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <RiskBadge level={z.riskLevel} />
                    <StatusBadge status={z.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Severity pie */}
          <ChartCard title="Severity Distribution" subtitle="By incident severity level">
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={sevData} dataKey="value" nameKey="name"
                  cx="50%" cy="50%" innerRadius={48} outerRadius={72}
                  strokeWidth={0}>
                  {sevData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: 10, fontFamily: "'Space Mono',monospace", color: '#8899aa' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Row 3: Cause tags + status breakdown */}
        <div className="grid lg:grid-cols-2 gap-4">
          <ChartCard title="Top Accident Cause Tags" subtitle="Most frequently reported contributing factors">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={causeTags} layout="vertical" barSize={12}>
                <CartesianGrid stroke="#1e2a3a" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" tick={CHART_STYLE} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="tag" tick={{ ...CHART_STYLE, fontSize: 9 }}
                  axisLine={false} tickLine={false} width={110} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" fill="#f4a261" radius={[0,2,2,0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Zone status summary */}
          <div className="space-y-3">
            <ChartCard title="Escalating Zones" subtitle="Risk rising — needs intervention">
              <div className="space-y-2">
                {escalatingZ.length ? escalatingZ.map(z => (
                  <div key={z.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-red-500/5 border border-red-500/15">
                    <span className="font-mono font-bold text-sm text-red-400">{z.riskScore}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-body truncate">{z.name}</p>
                      <p className="text-[10px] font-mono text-gray-500">{z.incidentCount} incidents</p>
                    </div>
                  </div>
                )) : <p className="text-xs font-mono text-gray-500">No escalating zones</p>}
              </div>
            </ChartCard>
            <ChartCard title="Improving Zones" subtitle="Risk declining — positive trend">
              <div className="space-y-2">
                {improvingZ.length ? improvingZ.map(z => (
                  <div key={z.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/15">
                    <span className="font-mono font-bold text-sm text-emerald-400">{z.riskScore}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-white font-body truncate">{z.name}</p>
                      <p className="text-[10px] font-mono text-gray-500">{z.incidentCount} incidents</p>
                    </div>
                  </div>
                )) : <p className="text-xs font-mono text-gray-500">No improving zones detected</p>}
              </div>
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  )
}
