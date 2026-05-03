import type { AgencyStat, InPostPoint, NetworkStats, ProvinceStat } from '../types/inpost'
import { normalizeProvince, PROVINCE_POPULATION } from './constants'

function pct(n: number, total: number): number {
  if (total === 0) return 0
  return Math.round((n / total) * 1000) / 10
}

export function isExpress(p: InPostPoint): boolean {
  return (
    p.express_delivery_send ||
    p.express_delivery_collect ||
    p.functions.some((f) => f.includes('express'))
  )
}

export function computeNetworkStats(points: InPostPoint[]): NetworkStats {
  const plPoints = points.filter((p) => p.country === 'PL')
  const total = plPoints.length
  let operatingCount = 0, nextCount = 0, expressCount = 0, easyAccessCount = 0, count247 = 0
  for (const p of plPoints) {
    if (p.status === 'Operating') operatingCount++
    if (p.is_next || p.physical_type === 'next') nextCount++
    if (isExpress(p)) expressCount++
    if (p.easy_access_zone) easyAccessCount++
    if (p.location_247) count247++
  }

  // physical type breakdown
  const typeMap = new Map<import('../types/inpost').PhysicalType, number>()
  for (const p of plPoints) {
    typeMap.set(p.physical_type, (typeMap.get(p.physical_type) ?? 0) + 1)
  }
  const physicalTypeBreakdown = [...typeMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }))

  // provinces — normalize + drop unknown
  const provMap = new Map<string, InPostPoint[]>()
  for (const p of plPoints) {
    const key = normalizeProvince(p.address_details.province)
    if (!key) continue
    if (!provMap.has(key)) provMap.set(key, [])
    provMap.get(key)!.push(p)
  }
  const byProvince: ProvinceStat[] = [...provMap.entries()]
    .map(([name, pts]) => {
      const pop = PROVINCE_POPULATION[name] ?? 0
      return {
        name,
        count: pts.length,
        perCapita: Math.round((pts.length / pop) * 100000 * 10) / 10,
        nextPercent: pct(pts.filter((p) => p.is_next || p.physical_type === 'next').length, pts.length),
        operatingPercent: pct(pts.filter((p) => p.status === 'Operating').length, pts.length),
      }
    })
    .sort((a, b) => b.count - a.count)

  // agencies
  const agencyMap = new Map<string, InPostPoint[]>()
  for (const p of plPoints) {
    const code = p.agency_code || p.agency || 'UNKNOWN'
    if (!agencyMap.has(code)) agencyMap.set(code, [])
    agencyMap.get(code)!.push(p)
  }
  const byAgency: AgencyStat[] = [...agencyMap.entries()]
    .map(([code, pts]) => ({
      code,
      count: pts.length,
      operatingPercent: pct(pts.filter((p) => p.status === 'Operating').length, pts.length),
      nextPercent: pct(pts.filter((p) => p.is_next || p.physical_type === 'next').length, pts.length),
      expressPercent: pct(pts.filter(isExpress).length, pts.length),
    }))
    .sort((a, b) => b.count - a.count)

  return {
    total,
    operatingCount,
    operatingPercent: pct(operatingCount, total),
    nextCount,
    nextPercent: pct(nextCount, total),
    expressCount,
    expressPercent: pct(expressCount, total),
    easyAccessCount,
    easyAccessPercent: pct(easyAccessCount, total),
    count247,
    percent247: pct(count247, total),
    uniqueProvinces: provMap.size,
    byProvince,
    byAgency,
    physicalTypeBreakdown,
  }
}
