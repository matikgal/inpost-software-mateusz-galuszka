import { useMemo, useState } from 'react'
import type { AgencyStat } from '../../types/inpost'

type SortKey = keyof AgencyStat

interface Props {
  agencies: AgencyStat[]
}

const PAGE_SIZE = 12

export function AgencyTable({ agencies }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('count')
  const [sortAsc, setSortAsc] = useState(false)
  const [page, setPage] = useState(1)

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc(v => !v)
    else { setSortKey(key); setSortAsc(false) }
    setPage(1)
  }

  const sorted = useMemo(() => {
    return [...agencies].sort((a, b) => {
      const av = a[sortKey], bv = b[sortKey]
      if (typeof av === 'string' && typeof bv === 'string')
        return sortAsc ? av.localeCompare(bv) : bv.localeCompare(av)
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number)
    })
  }, [agencies, sortKey, sortAsc])

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const slice = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const thStyle = (col: SortKey): React.CSSProperties => ({
    fontSize: 11,
    fontWeight: 400,
    color: sortKey === col ? 'var(--text)' : 'var(--text-3)',
    textAlign: col === 'code' ? 'left' : 'right',
    padding: '10px 14px',
    borderBottom: '1px solid var(--line)',
    cursor: 'pointer',
    userSelect: 'none',
    fontFamily: 'IBM Plex Sans, sans-serif',
    whiteSpace: 'nowrap',
  })

  const cols: { key: SortKey; label: string }[] = [
    { key: 'code', label: 'Agencja' },
    { key: 'count', label: 'Punktów' },
    { key: 'operatingPercent', label: '% aktywnych' },
    { key: 'nextPercent', label: '% Next' },
    { key: 'expressPercent', label: '% Express' },
  ]

  const btnStyle = (disabled: boolean): React.CSSProperties => ({
    background: 'transparent',
    border: '1px solid var(--line)',
    color: disabled ? 'var(--text-4)' : 'var(--text-2)',
    padding: '4px 10px',
    fontSize: 11,
    borderRadius: 3,
    cursor: disabled ? 'default' : 'pointer',
    fontFamily: 'IBM Plex Mono, monospace',
  })

  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, overflow: 'hidden' }}>
      <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--line)' }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>Ranking agencji</div>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--text-3)' }}>{agencies.length} agencji</span>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {cols.map(c => (
                <th key={c.key} style={thStyle(c.key)} onClick={() => toggleSort(c.key)}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    {c.label}
                    {sortKey === c.key && (
                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: 'var(--text-3)' }}>
                        {sortAsc ? '↑' : '↓'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              <th style={{ borderBottom: '1px solid var(--line)' }} />
            </tr>
          </thead>
          <tbody>
            {slice.map((a, i) => (
              <tr key={a.code} style={{ borderBottom: i < slice.length - 1 ? '1px solid var(--line)' : 'none' }}>
                <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums', padding: '11px 14px', color: 'var(--text)', fontSize: 12 }}>
                  {a.code}
                </td>
                <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums', padding: '11px 14px', textAlign: 'right', color: 'var(--text)', fontSize: 12 }}>
                  {a.count.toLocaleString('pl-PL')}
                </td>
                <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums', padding: '11px 14px', textAlign: 'right', fontSize: 12, color: a.operatingPercent < 90 ? 'var(--neg)' : 'var(--text-2)' }}>
                  {a.operatingPercent.toFixed(1)}%
                </td>
                <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums', padding: '11px 14px', textAlign: 'right', color: 'var(--text-2)', fontSize: 12 }}>
                  {a.nextPercent.toFixed(1)}%
                </td>
                <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums', padding: '11px 14px', textAlign: 'right', color: 'var(--text-3)', fontSize: 12 }}>
                  {a.expressPercent.toFixed(1)}%
                </td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--line)' }}>
        <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--text-3)' }}>
          {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} z {sorted.length}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          <button style={btnStyle(page === 1)} disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Poprzednia</button>
          <button style={btnStyle(page === totalPages)} disabled={page === totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Następna</button>
        </div>
      </div>
    </div>
  )
}
