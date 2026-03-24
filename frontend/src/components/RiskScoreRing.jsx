import { RISK_COLORS } from '../utils/riskEngine'

export default function RiskScoreRing({ score, level, size = 'md' }) {
  const color = RISK_COLORS[level] ?? '#10b981'
  const deg   = (score / 100) * 360

  const sizes = {
    sm:  { outer: 52,  inner: 38, font: '13px' },
    md:  { outer: 72,  inner: 54, font: '17px' },
    lg:  { outer: 96,  inner: 72, font: '22px' },
    xl:  { outer: 120, inner: 92, font: '28px' },
  }
  const { outer, inner, font } = sizes[size] || sizes.md

  return (
    <div className="relative flex-shrink-0" style={{ width: outer, height: outer }}>
      {/* Conic gradient track */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(${color} 0deg ${deg}deg, #1e2a3a ${deg}deg 360deg)`,
        }}
      />
      {/* Inner circle */}
      <div
        className="absolute rounded-full flex items-center justify-center"
        style={{
          top: (outer - inner) / 2,
          left: (outer - inner) / 2,
          width: inner,
          height: inner,
          background: '#0d1117',
        }}
      >
        <span
          className="font-mono font-bold leading-none"
          style={{ color, fontSize: font }}
        >
          {score}
        </span>
      </div>
    </div>
  )
}
