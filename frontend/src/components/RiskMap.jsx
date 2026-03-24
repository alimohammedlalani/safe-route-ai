import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { RISK_COLORS } from '../utils/riskEngine'

// Hyderabad center
const HYD_CENTER = [17.385, 78.4867]
const INIT_ZOOM  = 11

function makeSvgIcon(color, size = 10) {
  const pulse = `
    <circle cx="10" cy="10" r="${size}" fill="${color}" opacity="0.18"/>
    <circle cx="10" cy="10" r="${size * 0.55}" fill="${color}" opacity="0.55"/>
    <circle cx="10" cy="10" r="${size * 0.3}"  fill="${color}"/>
  `
  return L.divIcon({
    html: `<svg width="20" height="20" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">${pulse}</svg>`,
    className: '',
    iconSize:   [20, 20],
    iconAnchor: [10, 10],
  })
}

function makeZonePopup(zone) {
  const statusColors = { Escalating: '#ef4444', Stable: '#60a5fa', Improving: '#10b981' }
  const sc = statusColors[zone.status] ?? '#60a5fa'
  const rc = RISK_COLORS[zone.riskLevel] ?? '#10b981'
  return `
    <div style="padding:12px 14px;min-width:220px;font-family:'DM Sans',sans-serif;">
      <div style="font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:#f0f4f8;margin-bottom:4px;line-height:1.3">
        ${zone.name}
      </div>
      <div style="font-size:10px;color:#8899aa;margin-bottom:10px">${zone.landmark}</div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        <div style="font-family:'Space Mono',monospace;font-size:22px;font-weight:700;color:${rc}">${zone.riskScore}</div>
        <div>
          <div style="font-size:10px;font-family:'Space Mono',monospace;color:${rc};font-weight:700">${zone.riskLevel}</div>
          <div style="font-size:10px;font-family:'Space Mono',monospace;color:${sc}">${zone.status}</div>
        </div>
      </div>
      <div style="font-size:10px;color:#8899aa;margin-bottom:6px">${zone.explanation}</div>
      <div style="display:flex;gap:8px;font-size:10px;font-family:'Space Mono',monospace;margin-top:8px">
        <span style="color:#f0f4f8">${zone.incidentCount} incidents</span>
        <span style="color:#4a5568">·</span>
        <span style="color:#8899aa">${zone.recentCount} recent</span>
      </div>
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid #1e2a3a;font-size:9px;color:#4a5568;text-transform:uppercase;letter-spacing:0.08em">
        Click zone to view full details →
      </div>
    </div>
  `
}

export default function RiskMap({ zones, incidents, selectedZone, onZoneClick }) {
  const containerRef = useRef(null)
  const mapRef       = useRef(null)
  const layersRef    = useRef([])

  // Init map
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return

    const map = L.map(containerRef.current, {
      center: HYD_CENTER,
      zoom: INIT_ZOOM,
      zoomControl: true,
      attributionControl: false,
    })

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map)

    L.control.attribution({ prefix: false })
      .addAttribution('© <a href="https://carto.com" style="color:#4a5568">CARTO</a> · SafeRoute AI Demo')
      .addTo(map)

    mapRef.current = map
    return () => { map.remove(); mapRef.current = null }
  }, [])

  // Redraw layers whenever zones/incidents change
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Clear previous layers
    layersRef.current.forEach(l => l.remove())
    layersRef.current = []

    // Draw zone circles
    for (const zone of zones) {
      const color  = RISK_COLORS[zone.riskLevel] ?? '#10b981'
      const [lat, lng] = zone.centroid

      // Outer pulsing ring
      const outerRing = L.circle([lat, lng], {
        radius: zone.radius * 111_000 * 0.9,
        color,
        weight: 1.5,
        opacity: 0.5,
        fillColor: color,
        fillOpacity: 0.06,
        dashArray: zone.status === 'Escalating' ? '4 4' : undefined,
      }).addTo(map)

      // Centroid marker
      const marker = L.marker([lat, lng], {
        icon: makeSvgIcon(color, zone.riskScore > 75 ? 12 : zone.riskScore > 50 ? 9 : 6),
      }).addTo(map)

      const popup = L.popup({ closeButton: false, maxWidth: 280, className: '' })
        .setContent(makeZonePopup(zone))

      marker.bindPopup(popup)
      marker.on('click', () => onZoneClick(zone))

      layersRef.current.push(outerRing, marker)
    }

    // Draw individual incident dots (small, non-interactive)
    for (const inc of incidents) {
      const c = { fatal: '#ef4444', major: '#f97316', minor: '#10b981' }[inc.severity] ?? '#60a5fa'
      const dot = L.circleMarker([inc.latitude, inc.longitude], {
        radius: 3,
        color: c,
        weight: 1,
        opacity: 0.6,
        fillColor: c,
        fillOpacity: 0.4,
      }).addTo(map)
      layersRef.current.push(dot)
    }
  }, [zones, incidents, onZoneClick])

  // Fly to selected zone
  useEffect(() => {
    const map = mapRef.current
    if (!map || !selectedZone) return
    map.flyTo(selectedZone.centroid, 13, { animate: true, duration: 0.8 })
  }, [selectedZone])

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-navy-500">
      <div ref={containerRef} className="w-full h-full" />

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 z-[400] rounded-xl border border-navy-500 px-3.5 py-3"
        style={{ background: 'rgba(13,17,23,0.92)', backdropFilter: 'blur(8px)' }}>
        <p className="text-[9px] font-mono uppercase tracking-widest text-gray-500 mb-2">Risk Level</p>
        {[
          { label: 'Critical', color: '#ef4444' },
          { label: 'High',     color: '#f97316' },
          { label: 'Moderate', color: '#f59e0b' },
          { label: 'Low',      color: '#10b981' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-2 mb-1 last:mb-0">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-[10px] font-mono text-gray-400">{label}</span>
          </div>
        ))}
        <div className="border-t border-navy-500 mt-2 pt-2 space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-5 h-0.5 border-t-2 border-dashed border-red-500/70" />
            <span className="text-[10px] font-mono text-gray-500">Escalating</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full border border-emerald-500" />
            <span className="text-[10px] font-mono text-gray-500">Incident</span>
          </div>
        </div>
      </div>

      {/* Zone count */}
      <div className="absolute top-3 left-3 z-[400] rounded-lg border border-navy-500 px-2.5 py-1.5"
        style={{ background: 'rgba(13,17,23,0.9)' }}>
        <span className="text-[10px] font-mono text-gray-400">
          <span className="text-white font-bold">{zones.length}</span> zones · <span className="text-white font-bold">{incidents.length}</span> incidents
        </span>
      </div>
    </div>
  )
}
