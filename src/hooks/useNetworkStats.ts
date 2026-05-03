import { useMemo } from 'react'
import type { InPostPoint, NetworkStats } from '../types/inpost'
import { computeNetworkStats } from '../utils/statistics'

export function useNetworkStats(points: InPostPoint[]): NetworkStats | null {
  return useMemo(() => {
    try {
      return computeNetworkStats(points)
    } catch {
      return null
    }
  }, [points])
}
