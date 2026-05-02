import { useMemo, useState } from 'react'
import { useNetworkData } from './hooks/useNetworkData'
import { useNetworkStats } from './hooks/useNetworkStats'
import type { AdvancedFilter, MapFilter } from './types/inpost'
import { DEFAULT_ADVANCED_FILTER } from './types/inpost'
import { normalizeProvince, UNKNOWN_VALUE } from './utils/constants'
import { KPIBar } from './components/KPIBar/KPIBar'
import { LoadingOverlay } from './components/LoadingOverlay/LoadingOverlay'
import { NetworkMap } from './components/Map/NetworkMap'
import { FilterPanel } from './components/FilterPanel/FilterPanel'
import { ProvinceRankingChart } from './components/Charts/ProvinceRankingChart'
import { TypeDistributionChart } from './components/Charts/TypeDistributionChart'
import { AgencyTable } from './components/AgencyTable/AgencyTable'

function SectionLabel({ eyebrow, label }: { eyebrow: string; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', color: 'var(--text-4)', fontSize: 11, letterSpacing: '0.04em' }}>{eyebrow}</span>
      <span style={{ color: 'var(--text)', fontSize: 14, fontWeight: 500 }}>{label}</span>
    </div>
  )
}

export default function App() {
  const { status, points, loaded, total, error } = useNetworkData()
  const [mapFilter, setMapFilter] = useState<MapFilter>('all')
  const [advancedFilter, setAdvancedFilter] = useState<AdvancedFilter>(DEFAULT_ADVANCED_FILTER)

  const zones = useMemo(() => {
    const set = new Set<string>()
    for (const p of points) {
      const z = p.d2d_courier_micro_area || p.delivery_area_id
      if (z && z !== UNKNOWN_VALUE) set.add(z)
    }
    return [...set].sort()
  }, [points])

  const agencies = useMemo(() => {
    const set = new Set<string>()
    for (const p of points) {
      const a = p.agency_code || p.agency
      if (a && a !== UNKNOWN_VALUE) set.add(a)
    }
    return [...set].sort()
  }, [points])

  const cities = useMemo(() => {
    const set = new Set<string>()
    for (const p of points) {
      const c = p.address_details.city
      if (c) set.add(c)
    }
    return [...set].sort((a, b) => a.localeCompare(b, 'pl'))
  }, [points])

  const filteredPoints = useMemo(() => {
    const { physicalTypes, status, city, province, zone, agency } = advancedFilter
    if (!physicalTypes.length && !status && !city.trim() && !province && !zone.trim() && !agency.trim()) return points
    return points.filter((p) => {
      if (physicalTypes.length && !physicalTypes.includes(p.physical_type)) return false
      if (status === 'Operating' && p.status !== 'Operating') return false
      if (status === 'non_operating' && p.status === 'Operating') return false
      if (city.trim() && !p.address_details.city.toLowerCase().includes(city.trim().toLowerCase())) return false
      if (province && normalizeProvince(p.address_details.province) !== province) return false
      if (zone.trim()) {
        const pZone = (p.d2d_courier_micro_area || p.delivery_area_id || '').toLowerCase()
        if (!pZone.includes(zone.trim().toLowerCase())) return false
      }
      if (agency.trim() && (p.agency_code || p.agency) !== agency.trim()) return false
      return true
    })
  }, [points, advancedFilter])

  const stats = useNetworkStats(filteredPoints)

  return (
    <div className="min-h-screen bg-dash-950">
      {status === 'loading' && <LoadingOverlay loaded={loaded} total={total} />}

      <header style={{ borderBottom: '1px solid var(--line)', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 18, height: 18, borderRadius: 3, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 11, fontWeight: 700 }}>i</div>
            <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>InPost</span>
          </div>
          <div style={{ width: 1, height: 14, background: 'var(--line-2)' }} />
          <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Sieć paczkomatów · PL</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {status === 'success' && stats && (
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--pos)', display: 'inline-block' }} />
              {stats.total.toLocaleString('pl-PL')} pkt · {stats.uniqueProvinces} woj · {new Date().toLocaleDateString('pl-PL')}
            </div>
          )}
          {status === 'error' && <span style={{ fontSize: 12, color: 'var(--neg)' }}>Błąd ładowania danych</span>}
          <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--text-3)', padding: '3px 8px', border: '1px solid var(--line)', borderRadius: 4 }}>PL</span>
        </div>
      </header>

      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 28px 64px', display: 'flex', flexDirection: 'column', gap: 36 }}>
        {status === 'error' && (
          <div style={{ background: 'rgba(217,112,112,0.08)', border: '1px solid rgba(217,112,112,0.3)', borderRadius: 8, padding: '20px 24px' }}>
            <p style={{ color: 'var(--neg)', fontWeight: 500 }}>Błąd ładowania danych</p>
            <p style={{ color: 'var(--neg)', fontSize: 12, marginTop: 4, opacity: 0.7 }}>{error}</p>
            <p style={{ color: 'var(--text-3)', fontSize: 11, marginTop: 8 }}>Upewnij się że serwer dev jest uruchomiony (Vite proxy na /api).</p>
          </div>
        )}

        {stats && (
          <section>
            <SectionLabel eyebrow="01" label="Wskaźniki sieci" />
            <KPIBar stats={stats} activeFilter={mapFilter} onFilterChange={setMapFilter} />
          </section>
        )}

        {status === 'success' && (
          <>
            <section>
              <SectionLabel eyebrow="02" label="Mapa sieci" />
              <div className="relative">
                <div className="absolute top-3 left-3 z-[1001]">
                  <FilterPanel
                    filter={advancedFilter}
                    onChange={setAdvancedFilter}
                    totalFiltered={filteredPoints.length}
                    totalAll={points.length}
                    zones={zones}
                    agencies={agencies}
                    cities={cities}
                  />
                </div>
                <div style={{ height: 580, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)', isolation: 'isolate' }}>
                  <NetworkMap points={filteredPoints} mapFilter={mapFilter} />
                </div>
              </div>
            </section>

            {stats && (
              <>
                <section>
                  <SectionLabel eyebrow="03" label="Rozkład sieci" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
                    <TypeDistributionChart breakdown={stats.physicalTypeBreakdown} />
                    <ProvinceRankingChart provinces={stats.byProvince} />
                  </div>
                </section>

                <section>
                  <SectionLabel eyebrow="04" label="Agencje" />
                  <AgencyTable agencies={stats.byAgency} />
                </section>
              </>
            )}
          </>
        )}

        {status === 'idle' && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 256, color: 'var(--text-4)', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12 }}>
            Inicjalizacja…
          </div>
        )}
      </main>
    </div>
  )
}
