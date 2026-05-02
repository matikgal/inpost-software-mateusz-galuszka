import { useEffect, useRef, useState } from 'react'
import { useMap } from 'react-leaflet'
import { geocodeAddress } from '../../api/geocodingApi'

export function MapSearch() {
  const map = useMap()
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => { abortRef.current?.abort() }, [])

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    abortRef.current?.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    setError(false)
    const result = await geocodeAddress(q, ctrl.signal)
    if (ctrl.signal.aborted) return
    setLoading(false)
    if (!result) { setError(true); return }
    map.flyTo([result.lat, result.lon], 13, { duration: 1.2 })
  }

  return (
    <form
      onSubmit={handleSearch}
      className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] flex gap-1"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => { setQuery(e.target.value); setError(false) }}
        placeholder="Szukaj miejscowości…"
        className={`w-52 px-3 py-1.5 rounded-lg text-xs bg-dash-900/90 backdrop-blur border ${
          error ? 'border-red-500' : 'border-dash-700'
        } text-white placeholder-gray-500 focus:outline-none focus:border-inpost-yellow/60`}
      />
      <button
        type="submit"
        disabled={loading}
        className="px-2.5 py-1.5 rounded-lg bg-dash-900/90 backdrop-blur border border-dash-700 text-gray-400 hover:text-white transition disabled:opacity-50"
      >
        {loading ? (
          <span className="inline-block w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 3a6 6 0 100 12A6 6 0 009 3zM1 9a8 8 0 1114.32 4.906l3.387 3.387a1 1 0 01-1.414 1.414l-3.387-3.387A8 8 0 011 9z" clipRule="evenodd" />
          </svg>
        )}
      </button>
    </form>
  )
}
