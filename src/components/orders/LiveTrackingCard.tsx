import { lazy, Suspense } from 'react'
import { Navigation, Radio } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { EtaCountdown } from './EtaCountdown'
import { distanceKm } from '@/lib/utils'
import type { DarkStore, Driver, Order } from '@/types/common.types'

// Leaflet is heavy — only load the live map when this card actually renders.
const LiveTrackingMap = lazy(() => import('./LiveTrackingMap').then((m) => ({ default: m.LiveTrackingMap })))

const Dot = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-1 text-[11px] text-slate-500">
    <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} /> {label}
  </span>
)

/**
 * Track rider on the order page: live rider position vs the dark store and the
 * delivery destination, plus distance remaining + ETA (streamed from the Rider App).
 */
export function LiveTrackingCard({ order, driver, store }: { order: Order; driver?: Driver; store?: DarkStore }) {
  const inTransit = ['picked_up', 'on_the_way', 'arrived'].includes(order.status)
  const hasRiderGps = !!driver && driver.lat != null && driver.lng != null
  const storePt: [number, number] | undefined = store?.lat != null && store?.lng != null ? [store.lat, store.lng] : undefined
  const destPt: [number, number] | undefined = order.lat != null && order.lng != null ? [order.lat, order.lng] : undefined
  const remainingKm = hasRiderGps && destPt ? distanceKm({ lat: driver!.lat, lng: driver!.lng }, { lat: destPt[0], lng: destPt[1] }) : null

  return (
    <Card>
      <CardHeader
        title="Track rider"
        subtitle="Live position & distance to the destination"
        action={
          inTransit ? (
            <Badge tone="bg-brand-50 text-brand-700 ring-brand-600/15" dot="bg-brand-500">
              <Navigation className="h-3 w-3" /> ETA <EtaCountdown placedAt={order.placedAt} etaMinutes={order.etaMinutes} />
            </Badge>
          ) : undefined
        }
      />
      <CardContent className="pt-2">
        {hasRiderGps && driver ? (
          <>
            <Suspense fallback={<Spinner label="Loading live map…" className="py-10" />}>
              <LiveTrackingMap rider={[driver.lat!, driver.lng!]} store={storePt} destination={destPt} riderName={driver.name} />
            </Suspense>

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <Dot color="#7c3aed" label={driver.name} />
                <Dot color="#dc2626" label="Destination" />
                {storePt && <Dot color="#0c7d60" label="Store" />}
              </div>
              {remainingKm != null && (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                  <Navigation className="h-3.5 w-3.5 text-brand-500" /> {remainingKm.toFixed(1)} km to destination
                </span>
              )}
            </div>
            <p className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-400">
              <Radio className="h-3.5 w-3.5 text-brand-500" /> Live from {driver.name}'s Rider App
              {!inTransit && ' · updates once out for delivery'}
            </p>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
            <Navigation className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-2 text-sm font-medium text-slate-500">No live location yet</p>
            <p className="text-xs text-slate-400">Tracking appears once a rider is assigned and out for delivery.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
