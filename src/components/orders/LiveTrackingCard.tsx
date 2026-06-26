import { lazy, Suspense } from 'react'
import { Navigation, Radio } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import type { DarkStore, Driver, Order } from '@/types/common.types'

// Leaflet is heavy — only load the live map when this card actually renders.
const LiveTrackingMap = lazy(() => import('./LiveTrackingMap').then((m) => ({ default: m.LiveTrackingMap })))

/**
 * Live rider tracking + ETA on the order page. Location/ETA are streamed from
 * the Rider App; here we render the latest known rider position vs the dark store.
 */
export function LiveTrackingCard({ order, driver, store }: { order: Order; driver?: Driver; store?: DarkStore }) {
  const inTransit = ['picked_up', 'on_the_way', 'arrived'].includes(order.status)
  const hasRiderGps = !!driver && driver.lat != null && driver.lng != null
  const storePt: [number, number] | undefined = store?.lat != null && store?.lng != null ? [store.lat, store.lng] : undefined

  return (
    <Card>
      <CardHeader
        title="Live tracking"
        subtitle="Rider location & ETA — streamed from the Rider App"
        action={
          inTransit ? (
            <Badge tone="bg-brand-50 text-brand-700 ring-brand-600/15" dot="bg-brand-500">
              <Navigation className="h-3 w-3" /> ETA {order.etaMinutes}m
            </Badge>
          ) : undefined
        }
      />
      <CardContent className="pt-2">
        {hasRiderGps && driver ? (
          <>
            <Suspense fallback={<Spinner label="Loading live map…" className="py-10" />}>
              <LiveTrackingMap rider={[driver.lat!, driver.lng!]} store={storePt} riderName={driver.name} />
            </Suspense>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <Radio className="h-3.5 w-3.5 text-brand-500" /> Live position from {driver.name}'s Rider App
              {!inTransit && ' · updates once the rider is out for delivery'}
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
