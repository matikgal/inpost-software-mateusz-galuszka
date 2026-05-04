import { useMemo, useState } from 'react'
import type { ProvinceStat } from '../../types/inpost'

type SortMode = 'count' | 'perCapita' | 'nextPercent'

interface Props {
  provinces: ProvinceStat[]
}

export function ProvinceRankingChart({ provinces }: Props) {
  const [mode, setMode] = useState<SortMode>('count')

  const data = useMemo(() => {
    return [...provinces].sort((a, b) => b[mode] - a[mode])
  }, [provinces, mode])

  const max = useMemo(() => Math.max(...data.map(d => d[mode])), [data, mode])

  const formatValue = (v: number) => {
    if (mode === 'count') return v.toLocaleString('pl-PL')
    if (mode === 'perCapita') return v.toFixed(1)
    return `${v.toFixed(1)}%`
  }

  const btnStyle = (active: boolean): React.CSSProperties => ({
    background: active ? 'var(--bg-3)' : 'transparent',
    color: active ? 'var(--text)' : 'var(--text-3)',
    border: 'none',
    padding: '4px 10px',
    fontSize: 11,
    cursor: 'pointer',
    borderRadius: 3,
    fontFamily: 'IBM Plex Mono, monospace',
  })

  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Ranking województw</div>
        <div style={{ display: 'flex', background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 4, padding: 2, gap: 2 }}>
          <button style={btnStyle(mode === 'count')} onClick={() => setMode('count')}>liczba</button>
          <button style={btnStyle(mode === 'perCapita')} onClick={() => setMode('perCapita')}>na 100k</button>
          <button style={btnStyle(mode === 'nextPercent')} onClick={() => setMode('nextPercent')}>% Next</button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {data.map((p, i) => {
          const pct = max > 0 ? (p[mode] / max) * 100 : 0
          const isTop = i === 0
          return (
            <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 14, height: 22 }}>
              <div style={{ width: 130, fontSize: 12, color: 'var(--text-2)', textAlign: 'right', flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.name}
              </div>
              <div style={{ flex: 1, position: 'relative', height: 16 }}>
                <div style={{
                  position: 'absolute', left: 0, top: 0, bottom: 0,
                  width: `${pct}%`,
                  background: isTop ? 'var(--accent)' : 'var(--line-2)',
                  borderRadius: 1,
                  transition: 'width 280ms ease, background 200ms',
                }} />
              </div>
              <div style={{
                fontFamily: 'IBM Plex Mono, monospace',
                fontVariantNumeric: 'tabular-nums',
                width: 56,
                fontSize: 12,
                color: isTop ? 'var(--accent)' : 'var(--text)',
                textAlign: 'right',
                flexShrink: 0,
              }}>
                {formatValue(p[mode])}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
