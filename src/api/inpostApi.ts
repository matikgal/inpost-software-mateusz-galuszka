import type { InPostPoint, PointsResponse } from '../types/inpost'

export class InPostApiError extends Error {
  readonly status?: number
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'InPostApiError'
    this.status = status
  }
}

const BASE = '/api/v1/points'

async function fetchWithRetry(url: string, signal?: AbortSignal, retries = 3): Promise<Response> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, { signal })
      if (res.ok) return res
      if (res.status >= 400 && res.status < 500) {
        throw new InPostApiError(`HTTP ${res.status}`, res.status)
      }
      if (attempt === retries - 1) throw new InPostApiError(`HTTP ${res.status}`, res.status)
    } catch (err) {
      if (err instanceof InPostApiError) throw err
      if (signal?.aborted) throw err
      if (attempt === retries - 1) throw err
    }
    await new Promise((r) => setTimeout(r, 300 * 2 ** attempt))
  }
  throw new InPostApiError('Max retries exceeded')
}

export async function fetchPoints(
  params: Record<string, string | number>,
  signal?: AbortSignal
): Promise<PointsResponse> {
  const qs = new URLSearchParams(
    Object.entries(params).map(([k, v]) => [k, String(v)])
  ).toString()
  const res = await fetchWithRetry(`${BASE}?${qs}`, signal)
  return res.json() as Promise<PointsResponse>
}

export async function fetchPage(
  page: number,
  perPage = 1000,
  country = 'PL',
  signal?: AbortSignal
): Promise<PointsResponse> {
  return fetchPoints({ country, per_page: perPage, page }, signal)
}

export async function fetchAllPages(
  perPage = 1000,
  batchSize = 5,
  onProgress?: (loaded: number, total: number) => void,
  signal?: AbortSignal
): Promise<InPostPoint[]> {
  const first = await fetchPage(1, perPage, 'PL', signal)
  const totalPages = first.meta.total_pages
  const total = first.meta.count
  let loaded = first.items.length
  onProgress?.(loaded, total)

  const all: InPostPoint[] = [...first.items]

  const remaining = Array.from({ length: totalPages - 1 }, (_, i) => i + 2)

  for (let i = 0; i < remaining.length; i += batchSize) {
    if (signal?.aborted) throw new InPostApiError('Aborted')
    const batch = remaining.slice(i, i + batchSize)
    const settled = await Promise.allSettled(batch.map((p) => fetchPage(p, perPage, 'PL', signal)))
    for (const r of settled) {
      if (r.status === 'fulfilled') {
        all.push(...r.value.items)
        loaded += r.value.items.length
      }
    }
    onProgress?.(loaded, total)
  }

  return all
}
