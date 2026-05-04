import { useRef, useEffect, useMemo } from 'react'
import type { PhysicalType } from '../../types/inpost'
import { PHYSICAL_TYPE_LABELS } from '../../utils/constants'

const TYPE_COLORS: Record<PhysicalType, string> = {
  classic:    '#3a4049',
  next:       '#FFD100',
  newfm:      '#5a6270',
  fm:         '#4a525d',
  modular:    '#2d3239',
  screenless: '#252930',
}

interface Props {
  breakdown: { type: PhysicalType; count: number }[]
}

export function TypeDistributionChart({ breakdown }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<unknown>(null)

  const total = useMemo(() => breakdown.reduce((s, b) => s + b.count, 0), [breakdown])
  const data = useMemo(() => breakdown.map(b => ({
    label: PHYSICAL_TYPE_LABELS[b.type] ?? b.type,
    count: b.count,
    color: TYPE_COLORS[b.type] ?? '#3a4049',
  })), [breakdown])

  useEffect(() => {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext('2d')
    if (!ctx) return

    // Simple donut via arc
    const size = 160
    const cx = size / 2, cy = size / 2
    const outerR = size / 2 - 4
    const innerR = outerR * 0.68
    const gap = 0.025

    ctx.clearRect(0, 0, size, size)

    let angle = -Math.PI / 2
    for (const d of data) {
      const slice = (d.count / total) * (Math.PI * 2 - gap * data.length)
      ctx.beginPath()
      ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR)
      ctx.arc(cx, cy, outerR, angle, angle + slice)
      ctx.arc(cx, cy, innerR, angle + slice, angle, true)
      ctx.closePath()
      ctx.fillStyle = d.color
      ctx.fill()
      angle += slice + gap
    }

    // Store for cleanup (not needed for canvas)
    chartRef.current = true
  }, [data, total])

  return (
    <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 8, padding: 20 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', marginBottom: 18 }}>Modele urządzeń</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <div style={{ position: 'relative', width: 160, height: 160, flexShrink: 0 }}>
          <canvas ref={canvasRef} width={160} height={160} />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums', fontSize: 20, color: 'var(--text)', letterSpacing: '-0.02em' }}>
              {total.toLocaleString('pl-PL')}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>łącznie</div>
          </div>
        </div>

        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 20px' }}>
          {data.map(d => {
            const pct = total > 0 ? ((d.count / total) * 100).toFixed(1) : '0.0'
            return (
              <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, background: d.color, borderRadius: 2, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text-2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
                <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontVariantNumeric: 'tabular-nums', fontSize: 11, color: 'var(--text-3)', width: 36, textAlign: 'right' }}>{pct}%</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
