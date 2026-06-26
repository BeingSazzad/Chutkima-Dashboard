import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Maximize2, Minimize2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type Pt = [number, number]

/** Re-measure once mounted (cards/modals can mount the map hidden → grey tiles). */
function FixSize() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200)
    return () => clearTimeout(t)
  }, [map])
  return null
}

/** Keep all markers (store · rider · destination) in view. */
function FitBounds({ points }: { points: Pt[] }) {
  const map = useMap()
  const key = points.map((p) => p.join(',')).join('|')
  useEffect(() => {
    if (points.length >= 2) map.fitBounds(points, { padding: [34, 34], maxZoom: 15 })
    else if (points.length === 1) map.setView(points[0], 14)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])
  return null
}

/** Read-only live map: rider position vs the dark store and the delivery destination. */
export function LiveTrackingMap({
  rider,
  store,
  destination,
  riderName,
}: {
  rider: Pt
  store?: Pt
  destination?: Pt
  riderName: string
}) {
  const [full, setFull] = useState(false)
  const points = [store, rider, destination].filter(Boolean) as Pt[]

  const map = (
    <div className={cn('w-full overflow-hidden rounded-xl border border-slate-200', full ? 'min-h-0 flex-1' : 'h-56')}>
      <MapContainer key={full ? 'full' : 'box'} center={rider} zoom={14} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <FixSize />
        <FitBounds points={points} />
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {/* Store → rider (path travelled) */}
        {store && <Polyline positions={[store, rider]} pathOptions={{ color: '#94a3b8', dashArray: '6', weight: 2 }} />}
        {/* Rider → destination (remaining path) */}
        {destination && <Polyline positions={[rider, destination]} pathOptions={{ color: '#0c7d60', weight: 3 }} />}
        {store && (
          <CircleMarker center={store} radius={7} pathOptions={{ color: '#0c7d60', fillColor: '#0c7d60', fillOpacity: 0.9, weight: 2 }}>
            <Tooltip>Dark store</Tooltip>
          </CircleMarker>
        )}
        {destination && (
          <CircleMarker center={destination} radius={8} pathOptions={{ color: '#dc2626', fillColor: '#dc2626', fillOpacity: 0.9, weight: 2 }}>
            <Tooltip>Destination</Tooltip>
          </CircleMarker>
        )}
        <CircleMarker center={rider} radius={9} pathOptions={{ color: '#7c3aed', fillColor: '#7c3aed', fillOpacity: 0.95, weight: 3 }}>
          <Tooltip permanent direction="top">{riderName}</Tooltip>
        </CircleMarker>
      </MapContainer>
    </div>
  )

  const toggle = (
    <Button
      size="sm"
      variant="outline"
      leftIcon={full ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
      onClick={() => setFull((f) => !f)}
    >
      {full ? 'Exit' : 'Fullscreen'}
    </Button>
  )

  if (full) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col gap-2 bg-white p-4">
        <div className="flex justify-end">{toggle}</div>
        {map}
      </div>
    )
  }
  return (
    <div className="space-y-2">
      {map}
      <div className="flex justify-end">{toggle}</div>
    </div>
  )
}
