import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Polygon, CircleMarker, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { Maximize2, Minimize2, Trash2, Undo2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type Pt = [number, number]
const BUTWAL: Pt = [27.7006, 83.4484]

/** Capture map clicks to drop boundary vertices. */
function Clicker({ onAdd }: { onAdd: (p: Pt) => void }) {
  useMapEvents({
    click(e) {
      onAdd([e.latlng.lat, e.latlng.lng])
    },
  })
  return null
}

/** Re-measure the map once it's mounted inside a modal (avoids grey tiles). */
function FixSize() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 200)
    return () => clearTimeout(t)
  }, [map])
  return null
}

export function ZoneMapEditor({ value, onChange }: { value: Pt[]; onChange: (pts: Pt[]) => void }) {
  const center = value.length ? value[0] : BUTWAL
  const [full, setFull] = useState(false)

  const toolbar = (
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs text-slate-500">Click the map to drop boundary points — 3+ form the geo-fence.</p>
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" leftIcon={<Undo2 className="h-3.5 w-3.5" />} disabled={!value.length} onClick={() => onChange(value.slice(0, -1))}>
          Undo
        </Button>
        <Button size="sm" variant="outline" leftIcon={<Trash2 className="h-3.5 w-3.5" />} disabled={!value.length} onClick={() => onChange([])}>
          Clear
        </Button>
        <Button
          size="sm"
          variant="outline"
          leftIcon={full ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          onClick={() => setFull((f) => !f)}
        >
          {full ? 'Exit' : 'Fullscreen'}
        </Button>
      </div>
    </div>
  )

  // Remount the map on fullscreen toggle so FixSize re-measures (no grey tiles).
  const mapBox = (
    <div className={cn('w-full overflow-hidden rounded-xl border border-slate-200', full ? 'min-h-0 flex-1' : 'h-80')}>
      <MapContainer key={full ? 'full' : 'box'} center={center} zoom={14} scrollWheelZoom style={{ height: '100%', width: '100%' }}>
        <FixSize />
        {/* Clean, light "Positron" base map — brand-neutral so the teal-green geo-fences pop. */}
        <TileLayer
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        <Clicker onAdd={(p) => onChange([...value, p])} />
        {value.length >= 3 && (
          <Polygon positions={value} pathOptions={{ color: '#0c7d60', fillColor: '#0c7d60', fillOpacity: 0.25, weight: 2 }} />
        )}
        {value.map((p, i) => (
          <CircleMarker key={i} center={p} radius={6} pathOptions={{ color: '#0c7d60', fillColor: '#ffffff', fillOpacity: 1, weight: 2 }} />
        ))}
      </MapContainer>
    </div>
  )

  const counter = <p className="text-xs text-slate-400">{value.length} point{value.length === 1 ? '' : 's'} drawn</p>

  if (full) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col gap-2 bg-white p-4">
        {toolbar}
        {mapBox}
        {counter}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {toolbar}
      {mapBox}
      {counter}
    </div>
  )
}
