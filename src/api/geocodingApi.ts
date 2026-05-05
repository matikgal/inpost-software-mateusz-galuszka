interface NominatimResult {
  lat: string
  lon: string
  display_name: string
}

const cache = new Map<string, { lat: number; lon: number; label: string } | null>()
let lastCallAt = 0

async function throttle() {
  const now = Date.now()
  const wait = 1000 - (now - lastCallAt)
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastCallAt = Date.now()
}

export async function geocodeAddress(
  query: string,
  signal?: AbortSignal
): Promise<{ lat: number; lon: number; label: string } | null> {
  const key = query.trim().toLowerCase()
  if (cache.has(key)) return cache.get(key)!
  await throttle()
  const url = `https://nominatim.openstreetmap.org/search?format=json&countrycodes=pl&limit=1&q=${encodeURIComponent(query)}`
  const res = await fetch(url, { headers: { 'Accept-Language': 'pl' }, signal })
  if (!res.ok) { cache.set(key, null); return null }
  const data: NominatimResult[] = await res.json()
  if (!data.length) { cache.set(key, null); return null }
  const result = { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), label: data[0].display_name }
  cache.set(key, result)
  return result
}
