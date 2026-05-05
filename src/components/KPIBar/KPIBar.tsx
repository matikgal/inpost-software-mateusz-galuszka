import type { MapFilter, NetworkStats } from '../../types/inpost'

interface CellProps {
  label: string
  value: string
  sub?: string
  filterKey: MapFilter
  activeFilter: MapFilter
  onFilterChange: (f: MapFilter) => void
  isAccent?: boolean
}

function KPICell({ label, value, sub, filterKey, activeFilter, onFilterChange, isAccent }: CellProps) {
  const active = activeFilter === filterKey

  return (
    <button
      onClick={() => onFilterChange(active && filterKey !== 'all' ? 'all' : filterKey)}
      style={{
        flex: 1,
        textAlign: 'left',
        padding: '18px 20px',
        background: 'transparent',
        border: 'none',
        borderRight: '1px solid var(--line)',
        cursor: 'pointer',
        position: 'relative',
        outline: 'none',
        fontFamily: 'inherit',
        minWidth: 0,
      }}
    >
      {active && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0,
          height: 1, background: 'var(--accent)',
        }} />
      )}
      <div style={{
        fontSize: 11,
        color: active ? 'var(--accent)' : 'var(--text-3)',
        marginBottom: 8,
        fontWeight: 400,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'IBM Plex Mono, monospace',
        fontVariantNumeric: 'tabular-nums',
        fontSize: 26,
        fontWeight: 400,
        color: (isAccent && !active) || active ? 'var(--accent)' : 'var(--text)',
        letterSpacing: '-0.02em',
        lineHeight: 1,
        marginBottom: sub ? 6 : 0,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontFamily: 'IBM Plex Mono, monospace',
          fontSize: 11,
          color: 'var(--text-3)',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}>
          {sub}
        </div>
      )}
    </button>
  )
}

interface Props {
  stats: NetworkStats
  activeFilter: MapFilter
  onFilterChange: (f: MapFilter) => void
}

export function KPIBar({ stats, activeFilter, onFilterChange }: Props) {
  return (
    <div style={{
      display: 'flex',
      background: 'var(--bg-2)',
      border: '1px solid var(--line)',
      borderRadius: 8,
      overflow: 'hidden',
    }}>
      <KPICell
        label="Wszystkich punktów"
        value={stats.total.toLocaleString('pl-PL')}
        filterKey="all"
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
        isAccent
      />
      <KPICell
        label="Aktywnych"
        value={`${stats.operatingPercent}%`}
        sub={`${stats.operatingCount.toLocaleString('pl-PL')} punktów`}
        filterKey="operating"
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />
      <KPICell
        label="Model Next"
        value={`${stats.nextPercent}%`}
        sub={`${stats.nextCount.toLocaleString('pl-PL')} maszyn`}
        filterKey="next"
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />
      <KPICell
        label="Express Delivery"
        value={`${stats.expressPercent}%`}
        sub={`${stats.expressCount.toLocaleString('pl-PL')} punktów`}
        filterKey="express"
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />
      <KPICell
        label="Easy Access"
        value={`${stats.easyAccessPercent}%`}
        sub={`${stats.easyAccessCount.toLocaleString('pl-PL')} punktów`}
        filterKey="easy_access"
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />
      <KPICell
        label="Czynne 24/7"
        value={`${stats.percent247}%`}
        sub={`${stats.count247.toLocaleString('pl-PL')} punktów`}
        filterKey="247"
        activeFilter={activeFilter}
        onFilterChange={onFilterChange}
      />
    </div>
  )
}
