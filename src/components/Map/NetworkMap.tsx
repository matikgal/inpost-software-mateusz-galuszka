import 'leaflet/dist/leaflet.css'
// @ts-expect-error — no type declaration for this subpath export
import 'react-leaflet-markercluster/styles'

import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, TileLayer, ZoomControl, useMap, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.markercluster'
import type { InPostPoint, MapFilter } from '../../types/inpost'
import { HeatmapLayer } from './HeatmapLayer'
import { MapSearch } from './MapSearch'
import { isExpress } from '../../utils/statistics'
import { PHYSICAL_TYPE_LABELS, UNKNOWN_VALUE } from '../../utils/constants'

type ViewMode = 'heatmap' | 'cluster' | 'zones'

const MODES: { key: ViewMode; label: string }[] = [
  { key: 'heatmap', label: 'Heatmapa' },
  { key: 'cluster', label: 'Klastry' },
  { key: 'zones', label: 'Strefy' },
]

const POLAND_BOUNDS: L.LatLngBoundsExpression = [[48, 13], [55.5, 25]]

const MAP_CONFIG = {
  heatmapZoomThreshold: 14,
  clusterMaxRadius: 60,
  clusterChunkInterval: 50,
  clusterChunkDelay: 50,
  disableClusteringAtZoom: 14,
  heatmapClickMaxDist: 0.0025,
} as const

const pointIcon = L.divIcon({
  html: `<div style="width:24px;height:24px;display:flex;align-items:center;justify-content:center;cursor:pointer;">
    <div style="width:10px;height:10px;border-radius:50%;background:#FFD100;border:2px solid #111;box-shadow:0 0 4px rgba(255,209,0,0.6);"></div>
  </div>`,
  className: '',
  iconSize: [24, 24],
  iconAnchor: [12, 12],
})

// ── Side panel ────────────────────────────────────────────────────────────────

function AvailBadge({ label, val }: { label: string; val: string }) {
  const ok = val === 'AVAILABLE'
  return (
    <div className={`flex flex-col items-center rounded-lg px-3 py-2 border text-xs font-semibold ${
      ok ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
         : 'border-dash-700 bg-dash-800 text-gray-500'
    }`}>
      <span className="text-base font-bold">{label}</span>
      <span className="text-[10px] font-normal mt-0.5">{ok ? 'wolny' : 'brak'}</span>
    </div>
  )
}

function PointPanel({ point, onClose }: { point: InPostPoint; onClose: () => void }) {
  const isOperating = point.status === 'Operating'
  const avail = point.locker_availability?.details

  return (
    <div className="absolute top-0 right-0 h-full w-80 z-[1001] flex flex-col bg-dash-900 border-l border-dash-700 shadow-2xl overflow-hidden">
      {/* image */}
      <div className="relative shrink-0">
        {point.image_url
          ? <img src={point.image_url} alt={point.name} className="w-full h-44 object-cover"
              onError={(e) => { (e.target as HTMLImageElement).parentElement!.style.display = 'none' }} />
          : <div className="w-full h-20 bg-dash-800 flex items-center justify-center text-gray-600 text-xs">brak zdjęcia</div>
        }
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-dash-950/80 backdrop-blur flex items-center justify-center text-gray-400 hover:text-white transition cursor-pointer"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* scrollable content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* title */}
        <div>
          <p className="font-mono text-xl font-bold text-inpost-yellow tracking-wider">{point.name}</p>
          <p className="text-base text-gray-400 mt-1 leading-snug">{point.address.line1}</p>
          <p className="text-sm text-gray-600">{point.address.line2}</p>
        </div>

        {/* badges */}
        <div className="flex flex-wrap gap-2">
          <span className={`text-sm font-semibold px-3 py-1.5 rounded-md border ${
            isOperating ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                        : 'text-red-400 border-red-500/30 bg-red-500/10'
          }`}>{isOperating ? 'Aktywny' : 'Nieaktywny'}</span>
          {(point.is_next || point.physical_type === 'next') && (
            <span className="text-sm font-semibold px-3 py-1.5 rounded-md border text-inpost-yellow border-inpost-yellow/30 bg-inpost-yellow/10">
              {PHYSICAL_TYPE_LABELS[point.physical_type] ?? 'Next'}
            </span>
          )}
          {point.location_247 && (
            <span className="text-sm font-semibold px-3 py-1.5 rounded-md border text-blue-400 border-blue-500/30 bg-blue-500/10">24/7</span>
          )}
          {point.easy_access_zone && (
            <span className="text-sm font-semibold px-3 py-1.5 rounded-md border text-purple-400 border-purple-500/30 bg-purple-500/10">Easy Access</span>
          )}
          {isExpress(point) && (
            <span className="text-sm font-semibold px-3 py-1.5 rounded-md border text-orange-400 border-orange-500/30 bg-orange-500/10">Express</span>
          )}
        </div>

        {/* locker availability */}
        {avail && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Dostępność skrytek</p>
            <div className="grid grid-cols-3 gap-2">
              <AvailBadge label="A" val={avail.A} />
              <AvailBadge label="B" val={avail.B} />
              <AvailBadge label="C" val={avail.C} />
            </div>
          </div>
        )}

        {/* hours */}
        {point.opening_hours && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">Godziny otwarcia</p>
            <p className="text-sm text-gray-400 leading-relaxed">{point.opening_hours}</p>
          </div>
        )}

        {/* agency + type */}
        <div className="grid grid-cols-2 gap-3">
          {point.agency_code && (
            <div className="bg-dash-800 rounded-lg p-3 border border-dash-700">
              <p className="text-xs text-gray-600 uppercase tracking-widest">Agencja</p>
              <p className="font-mono text-base text-white font-bold mt-0.5">{point.agency_code}</p>
            </div>
          )}
          <div className="bg-dash-800 rounded-lg p-3 border border-dash-700">
            <p className="text-xs text-gray-600 uppercase tracking-widest">Typ</p>
            <p className="font-mono text-base text-white font-bold mt-0.5">
              {PHYSICAL_TYPE_LABELS[point.physical_type] ?? point.physical_type}
            </p>
          </div>
        </div>

        {/* functions */}
        {point.functions.length > 0 && (
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Usługi</p>
            <div className="flex flex-wrap gap-1.5">
              {point.functions.map((f) => (
                <span key={f} className="text-xs text-gray-400 bg-dash-800 border border-dash-700 rounded px-2 py-1">{f}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Courier zones ─────────────────────────────────────────────────────────────

function strToHex(s: string): string {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  const hue = Math.abs(h) % 360
  const ctx = document.createElement('canvas').getContext('2d')
  if (!ctx) return '#808080'
  ctx.fillStyle = `hsl(${hue},70%,58%)`
  return ctx.fillStyle as string
}


function ZoneLayer({ points, onSelect }: { points: InPostPoint[]; onSelect: (p: InPostPoint) => void }) {
  const map = useMap()
  const onSelectRef = useRef(onSelect)
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  useEffect(() => {
    // Group by micro area → fall back to delivery_area_id
    const groups = new Map<string, InPostPoint[]>()
    for (const p of points) {
      const key = p.d2d_courier_micro_area || p.delivery_area_id
      if (!key || key.toLowerCase() === 'null' || key.toLowerCase() === UNKNOWN_VALUE.toLowerCase()) continue
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(p)
    }

    const canvas = L.canvas({ padding: 0.5 })
    const layers: L.Layer[] = []

    for (const [zoneId, pts] of groups) {
      const color = strToHex(zoneId)
      // Canvas circle markers — kolorowane per strefa
      for (const p of pts) {
        const cm = L.circleMarker([p.location.latitude, p.location.longitude], {
          renderer: canvas,
          radius: 4,
          color: '#111',
          fillColor: color,
          fillOpacity: 0.9,
          weight: 0.5,
        })
        cm.bindTooltip(`${zoneId}`, { sticky: false, className: 'zone-tooltip' })
        cm.on('click', () => onSelectRef.current(p))
        map.addLayer(cm)
        layers.push(cm)
      }
    }

    return () => { for (const l of layers) map.removeLayer(l) }
  }, [map, points])

  return null
}

// ── Filter helpers ────────────────────────────────────────────────────────────

const ALL_FILTERS: MapFilter[] = ['all', 'operating', 'next', 'express', 'easy_access', '247']

const FILTER_FN: Record<MapFilter, (p: InPostPoint) => boolean> = {
  all:        () => true,
  operating:  (p) => p.status === 'Operating',
  next:       (p) => p.is_next || p.physical_type === 'next',
  express:    isExpress,
  easy_access:(p) => p.easy_access_zone,
  '247':      (p) => p.location_247,
}

function makeClusterOpts(): L.MarkerClusterGroupOptions {
  return {
    chunkedLoading: true,
    chunkInterval: MAP_CONFIG.clusterChunkInterval,
    chunkDelay: MAP_CONFIG.clusterChunkDelay,
    disableClusteringAtZoom: MAP_CONFIG.disableClusteringAtZoom,
    maxClusterRadius: MAP_CONFIG.clusterMaxRadius,
    spiderfyOnMaxZoom: true,
  }
}

function buildCluster(pts: InPostPoint[], onSelect: (p: InPostPoint) => void): L.MarkerClusterGroup {
  const cluster = L.markerClusterGroup(makeClusterOpts())
  const markers = pts.map((p) => {
    const m = L.marker([p.location.latitude, p.location.longitude], { icon: pointIcon })
    m.on('click', () => onSelect(p))
    return m
  })
  cluster.addLayers(markers)
  return cluster
}

// ── All-filters pre-built cluster manager ─────────────────────────────────────
// Builds all 6 filter clusters once (lazily in background), switch = addLayer/removeLayer O(1)

type ClustersMap = Map<MapFilter, L.MarkerClusterGroup>

function ClusterManager({ points, mapFilter, active, onSelect }: {
  points: InPostPoint[]
  mapFilter: MapFilter
  active: boolean          // false when heatmap at low zoom
  onSelect: (p: InPostPoint) => void
}) {
  const map = useMap()
  const clustersRef = useRef<ClustersMap>(new Map())
  const builtRef = useRef<Set<MapFilter>>(new Set())
  const onSelectRef = useRef(onSelect)
  const mapFilterRef = useRef(mapFilter)
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])
  useEffect(() => { mapFilterRef.current = mapFilter }, [mapFilter])

  // Rebuild all clusters when base points change (data load)
  useEffect(() => {
    // Destroy previous
    for (const [, c] of clustersRef.current) { map.removeLayer(c); c.clearLayers() }
    clustersRef.current = new Map()
    builtRef.current = new Set()

    let cancelled = false

    // Build filters one-by-one in idle time to avoid blocking UI
    // Active filter first, rest deferred
    const queue = [mapFilterRef.current, ...ALL_FILTERS.filter(f => f !== mapFilterRef.current)]

    const buildNext = (i: number) => {
      if (cancelled || i >= queue.length) return
      const f = queue[i]
      if (builtRef.current.has(f)) { buildNext(i + 1); return }
      const filtered = f === 'all' ? points : points.filter(FILTER_FN[f])
      const cluster = buildCluster(filtered, (p) => onSelectRef.current(p))
      clustersRef.current.set(f, cluster)
      builtRef.current.add(f)
      // Show if this is the active filter and layer should be active
      if (f === mapFilterRef.current && active) map.addLayer(cluster)
      // Next filter deferred to idle
      const next = () => buildNext(i + 1)
      if (typeof requestIdleCallback !== 'undefined') requestIdleCallback(next)
      else setTimeout(next, 30)
    }

    buildNext(0)
    return () => {
      cancelled = true
      for (const [, c] of clustersRef.current) { map.removeLayer(c); c.clearLayers() }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, points])

  // Filter switch: instant addLayer/removeLayer on pre-built clusters
  useEffect(() => {
    for (const [f, cluster] of clustersRef.current) {
      const shouldShow = f === mapFilter && active
      if (shouldShow && !map.hasLayer(cluster)) map.addLayer(cluster)
      if (!shouldShow && map.hasLayer(cluster)) map.removeLayer(cluster)
    }
  }, [map, mapFilter, active])

  return null
}

// ── Heatmap click (low zoom) ──────────────────────────────────────────────────

function HeatmapClickLayer({ points, onSelect }: { points: InPostPoint[]; onSelect: (p: InPostPoint) => void }) {
  const onSelectRef = useRef(onSelect)
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng
      let nearest: InPostPoint | null = null
      let bestDist = Infinity
      for (const p of points) {
        const d = (p.location.latitude - lat) ** 2 + (p.location.longitude - lng) ** 2
        if (d < bestDist) { bestDist = d; nearest = p }
      }
      if (!nearest || bestDist > MAP_CONFIG.heatmapClickMaxDist) return
      onSelectRef.current(nearest)
    },
  })
  return null
}

// ── Zoom tracker ──────────────────────────────────────────────────────────────

function ZoomTracker({ onChange }: { onChange: (z: number) => void }) {
  const map = useMap()
  useMapEvents({ zoomend: () => onChange(map.getZoom()) })
  return null
}

// ── Main component ────────────────────────────────────────────────────────────

interface Props {
  points: InPostPoint[]
  mapFilter: MapFilter
}

const TILES = {
  dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
  light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
}

export function NetworkMap({ points, mapFilter }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('heatmap')
  const [selected, setSelected] = useState<InPostPoint | null>(null)
  const [zoom, setZoom] = useState(6)
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>('dark')

  const showCluster = (viewMode === 'cluster' || (viewMode === 'heatmap' && zoom >= MAP_CONFIG.heatmapZoomThreshold))

  // Heatmap data per filter — cheap array extract, no marker objects
  const heatPoints = useMemo(() => {
    const pts = mapFilter === 'all' ? points : points.filter(FILTER_FN[mapFilter])
    return pts.map((p) => ({ lat: p.location.latitude, lng: p.location.longitude }))
  }, [points, mapFilter])

  // For heatmap click: filtered subset (only needed at low zoom)
  const filtered = useMemo(
    () => (mapFilter === 'all' ? points : points.filter(FILTER_FN[mapFilter])),
    [points, mapFilter]
  )

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[52.1, 19.4]} zoom={6} minZoom={5} maxZoom={18}
        maxBounds={POLAND_BOUNDS} maxBoundsViscosity={0.8}
        className="w-full h-full" zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url={TILES[mapTheme]}
        />
        <ZoomControl position="bottomright" />
        <MapSearch />
        <ZoomTracker onChange={setZoom} />

        {/* Pre-built clusters for all filters — switch is O(1) */}
        <ClusterManager
          points={points}
          mapFilter={mapFilter}
          active={showCluster}
          onSelect={setSelected}
        />

        {viewMode === 'zones' && (
          <ZoneLayer points={filtered} onSelect={setSelected} />
        )}

        {/* Heatmap only at low zoom in heatmap mode */}
        {viewMode === 'heatmap' && zoom < MAP_CONFIG.heatmapZoomThreshold && (
          <>
            <HeatmapLayer points={heatPoints} />
            <HeatmapClickLayer points={filtered} onSelect={setSelected} />
          </>
        )}
      </MapContainer>

      {/* View mode toggle */}
      <div style={{
        position: 'absolute', top: 12, right: 12, zIndex: 1000,
        display: 'flex', background: 'rgba(21,24,29,0.92)', backdropFilter: 'blur(8px)',
        border: '1px solid var(--line)', borderRadius: 4, padding: 2, gap: 2,
      }}>
        {MODES.map((m) => (
          <button key={m.key} onClick={() => setViewMode(m.key)} style={{
            background: viewMode === m.key ? 'var(--bg-3)' : 'transparent',
            color: viewMode === m.key ? 'var(--text)' : 'var(--text-3)',
            border: 'none', padding: '5px 12px', fontSize: 11,
            cursor: 'pointer', borderRadius: 3,
            fontFamily: 'IBM Plex Mono, monospace',
          }}>{m.label}</button>
        ))}
      </div>

      {/* Point count + legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, zIndex: 1000,
        background: 'rgba(21,24,29,0.92)', backdropFilter: 'blur(8px)',
        border: '1px solid var(--line)', padding: '8px 12px', borderRadius: 4,
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--text-3)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span>{filtered.length.toLocaleString('pl-PL')} punktów</span>
        {viewMode === 'heatmap' && (
          <>
            <span style={{ color: 'var(--text-4)' }}>·</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              gęstość
              <span style={{ width: 50, height: 5, borderRadius: 1, background: 'linear-gradient(to right, rgba(255,209,0,0.15), rgba(255,209,0,1))' }} />
            </span>
          </>
        )}
      </div>

      {/* Theme toggle */}
      <button
        onClick={() => setMapTheme((t) => t === 'dark' ? 'light' : 'dark')}
        title={mapTheme === 'dark' ? 'Jasny motyw' : 'Ciemny motyw'}
        style={{
          position: 'absolute', top: 52, right: 12, zIndex: 1000,
          background: 'rgba(21,24,29,0.92)', backdropFilter: 'blur(8px)',
          border: '1px solid var(--line)', borderRadius: 4, padding: '6px 8px',
          color: 'var(--text-3)', cursor: 'pointer', display: 'flex', alignItems: 'center',
        }}
      >
        {mapTheme === 'dark' ? (
          <svg viewBox="0 0 20 20" fill="currentColor" width={14} height={14}>
            <path d="M10 2a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1Zm4 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm-.464 4.95.707.707a1 1 0 0 0 1.414-1.414l-.707-.707a1 1 0 0 0-1.414 1.414Zm2.12-10.607a1 1 0 0 1 0 1.414l-.706.707a1 1 0 1 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 0ZM17 11a1 1 0 1 0 0-2h-1a1 1 0 1 0 0 2h1Zm-7 4a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM5.05 6.464A1 1 0 1 0 6.464 5.05l-.707-.707a1 1 0 0 0-1.414 1.414l.707.707Zm1.414 8.486-.707.707a1 1 0 0 1-1.414-1.414l.707-.707a1 1 0 0 1 1.414 1.414ZM4 11a1 1 0 1 0 0-2H3a1 1 0 0 0 0 2h1Z" fillRule="evenodd" clipRule="evenodd" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" fill="currentColor" width={14} height={14}>
            <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clipRule="evenodd" />
          </svg>
        )}
      </button>

      {selected && <PointPanel point={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
