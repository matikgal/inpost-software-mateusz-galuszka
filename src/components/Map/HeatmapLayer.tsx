import { useEffect, useRef } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet.heat'

interface Props {
  points: { lat: number; lng: number; intensity?: number }[]
}

declare module 'leaflet' {
  function heatLayer(
    latlngs: [number, number, number?][],
    options?: { radius?: number; blur?: number; maxZoom?: number; max?: number; gradient?: Record<number, string> }
  ): L.Layer
}

export function HeatmapLayer({ points }: Props) {
  const map = useMap()
  const layerRef = useRef<L.Layer | null>(null)

  useEffect(() => {
    if (layerRef.current) {
      map.removeLayer(layerRef.current)
    }
    const latlngs: [number, number, number?][] = points.map((p) => [p.lat, p.lng, p.intensity ?? 1])
    const layer = L.heatLayer(latlngs, {
      radius: 16,
      blur: 22,
      maxZoom: 11,
      gradient: {
        0.1: 'rgba(255,209,0,0.0)',
        0.3: 'rgba(255,209,0,0.25)',
        0.55: 'rgba(255,209,0,0.55)',
        0.8: 'rgba(255,209,0,0.85)',
        1.0: 'rgba(255,232,140,1.0)',
      },
    })
    layer.addTo(map)
    layerRef.current = layer

    return () => {
      map.removeLayer(layer)
    }
  }, [map, points])

  return null
}
