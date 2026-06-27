import { lazy, Suspense } from 'react'
import { Navigation, Radio } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { distanceKm } from '@/lib/utils'
import { DRIVER_STATUS_META } from '@/lib/constants'
import { useGetStoresQuery } from '@/services/endpoints/storesApi'
import { useGetOrderQuery } from '@/services/endpoints/ordersApi'
import type { DarkStore, Driver } from '@/types/common.types'

const LiveTrackingMap = lazy(() => import('@/components/orders/LiveTrackingMap').then((m) => ({ default: m.LiveTrackingMap })))

/** Rough ETA from a distance at an average urban scooter speed. */
const AVG_KMH = 18
const etaMin = (km: number | null) => (km == null ? null : Math.max(1, Math.round((km / AVG_KMH) * 60)))

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-100 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-bold text-slate-800">{value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  )
}

/** Rider-centric live tracking: position, distance + ETA to the dark store and customer. */
export function RiderLiveTrackingCard({ driver }: { driver: Driver }) {
  const { data: stores = [] } = useGetStoresQuery()
  const { data: activeOrder } = useGetOrderQuery(driver.activeOrderId ?? '', { skip: !driver.activeOrderId })
  const hasGps = driver.lat != null && driver.lng != null
  const here = { lat: driver.lat, lng: driver.lng }

  // Pickup store = the active order's store; otherwise the nearest assigned store.
  let nearest: DarkStore | undefined
  let nearestKm: number | null = null
  if (activeOrder) nearest = stores.find((s) => s.id === activeOrder.storeId)
  if (!nearest) {
    for (const s of stores.filter((x) => driver.storeIds?.includes(x.id))) {
      const km = distanceKm(here, { lat: s.lat, lng: s.lng })
      if (km != null && (nearestKm == null || km < nearestKm)) {
        nearestKm = km
        nearest = s
      }
    }
  }
  if (nearest && nearestKm == null) nearestKm = distanceKm(here, { lat: nearest.lat, lng: nearest.lng })
  const storePt: [number, number] | undefined = nearest?.lat != null && nearest?.lng != null ? [nearest.lat, nearest.lng] : undefined
  const destPt: [number, number] | undefined = activeOrder?.lat != null && activeOrder?.lng != null ? [activeOrder.lat, activeOrder.lng] : undefined
  const kmToCustomer = destPt ? distanceKm(here, { lat: destPt[0], lng: destPt[1] }) : null
  const meta = DRIVER_STATUS_META[driver.status]

  return (
    <Card>
      <CardHeader
        title="Live location & ETA"
        subtitle="Position, distance & ETA — streamed from the Rider App"
        action={<Badge tone={meta.badge}>{meta.label}</Badge>}
      />
      <CardContent className="pt-2">
        {hasGps ? (
          <>
            <Suspense fallback={<Spinner label="Loading live map…" className="py-10" />}>
              <LiveTrackingMap rider={[driver.lat!, driver.lng!]} store={storePt} destination={destPt} riderName={driver.name} />
            </Suspense>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
              <Stat label="To dark store" value={nearestKm != null ? `${nearestKm.toFixed(1)} km` : '—'} sub={etaMin(nearestKm) != null ? `ETA ${etaMin(nearestKm)} min` : nearest ? '' : 'No store set'} />
              <Stat
                label="To customer"
                value={kmToCustomer != null ? `${kmToCustomer.toFixed(1)} km` : '—'}
                sub={activeOrder ? `ETA ${activeOrder.etaMinutes} min` : 'No active order'}
              />
              <Stat label="Serves" value={`${driver.storeIds?.length ?? 0} store${(driver.storeIds?.length ?? 0) === 1 ? '' : 's'}`} sub={nearest ? `Nearest: ${nearest.name}` : ''} />
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <Radio className="h-3.5 w-3.5 text-brand-500" /> Live from {driver.name}'s Rider App
            </p>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
            <Navigation className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-500">No live location</p>
            <p className="text-xs text-slate-400">Appears when the rider is online in the Rider App.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
