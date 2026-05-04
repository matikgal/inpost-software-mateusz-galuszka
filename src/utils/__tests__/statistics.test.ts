import { describe, it, expect } from 'vitest'
import { isExpress, computeNetworkStats } from '../statistics'
import { makePoint } from './factory'

// ── isExpress ────────────────────────────────────────────────────────────────

describe('isExpress', () => {
  it('false when no express flags', () => {
    expect(isExpress(makePoint())).toBe(false)
  })

  it('true when express_delivery_send', () => {
    expect(isExpress(makePoint({ express_delivery_send: true }))).toBe(true)
  })

  it('true when express_delivery_collect', () => {
    expect(isExpress(makePoint({ express_delivery_collect: true }))).toBe(true)
  })

  it('true when functions include express string', () => {
    expect(isExpress(makePoint({ functions: ['parcel', 'express_send'] }))).toBe(true)
  })

  it('false when functions have no express', () => {
    expect(isExpress(makePoint({ functions: ['parcel', 'parcel_collect'] }))).toBe(false)
  })
})

// ── computeNetworkStats ──────────────────────────────────────────────────────

describe('computeNetworkStats', () => {
  it('returns zeros for empty array', () => {
    const s = computeNetworkStats([])
    expect(s.total).toBe(0)
    expect(s.operatingCount).toBe(0)
    expect(s.operatingPercent).toBe(0)
    expect(s.byProvince).toHaveLength(0)
    expect(s.byAgency).toHaveLength(0)
    expect(s.physicalTypeBreakdown).toHaveLength(0)
  })

  it('filters out non-PL points', () => {
    const pts = [makePoint({ country: 'PL' }), makePoint({ country: 'DE' })]
    expect(computeNetworkStats(pts).total).toBe(1)
  })

  it('counts operating correctly', () => {
    const pts = [
      makePoint({ status: 'Operating' }),
      makePoint({ status: 'Operating' }),
      makePoint({ status: 'Disabled' }),
    ]
    const s = computeNetworkStats(pts)
    expect(s.operatingCount).toBe(2)
    expect(s.operatingPercent).toBe(66.7)
  })

  it('counts next via physical_type and is_next', () => {
    const pts = [
      makePoint({ physical_type: 'next' }),
      makePoint({ is_next: true }),
      makePoint(),
    ]
    const s = computeNetworkStats(pts)
    expect(s.nextCount).toBe(2)
  })

  it('counts express via isExpress', () => {
    const pts = [
      makePoint({ express_delivery_send: true }),
      makePoint({ functions: ['express_collect'] }),
      makePoint(),
    ]
    expect(computeNetworkStats(pts).expressCount).toBe(2)
  })

  it('counts location_247', () => {
    const pts = [makePoint({ location_247: true }), makePoint()]
    expect(computeNetworkStats(pts).count247).toBe(1)
  })

  it('counts easy_access_zone', () => {
    const pts = [makePoint({ easy_access_zone: true }), makePoint()]
    expect(computeNetworkStats(pts).easyAccessCount).toBe(1)
  })

  it('groups by province, drops unknown', () => {
    const pts = [
      makePoint({ address_details: { ...makePoint().address_details, province: 'mazowieckie' } }),
      makePoint({ address_details: { ...makePoint().address_details, province: 'mazowieckie' } }),
      makePoint({ address_details: { ...makePoint().address_details, province: 'nieznane_xyz' } }),
    ]
    const s = computeNetworkStats(pts)
    expect(s.uniqueProvinces).toBe(1)
    expect(s.byProvince[0].name).toBe('mazowieckie')
    expect(s.byProvince[0].count).toBe(2)
  })

  it('groups by agency_code, falls back to agency', () => {
    const pts = [
      makePoint({ agency_code: 'WAW', agency: 'WAW' }),
      makePoint({ agency_code: '', agency: 'KRK' }),
    ]
    const s = computeNetworkStats(pts)
    const codes = s.byAgency.map((a) => a.code)
    expect(codes).toContain('WAW')
    expect(codes).toContain('KRK')
  })

  it('computes physicalTypeBreakdown sorted by count desc', () => {
    const pts = [
      makePoint({ physical_type: 'classic' }),
      makePoint({ physical_type: 'classic' }),
      makePoint({ physical_type: 'next' }),
    ]
    const bd = computeNetworkStats(pts).physicalTypeBreakdown
    expect(bd[0]).toEqual({ type: 'classic', count: 2 })
    expect(bd[1]).toEqual({ type: 'next', count: 1 })
  })

  it('perCapita uses PROVINCE_POPULATION denominator', () => {
    const pts = Array.from({ length: 100 }, () =>
      makePoint({ address_details: { ...makePoint().address_details, province: 'opolskie' } })
    )
    const s = computeNetworkStats(pts)
    // 100 / 992000 * 100000 = ~10.1
    expect(s.byProvince[0].perCapita).toBeCloseTo(10.1, 0)
  })
})
