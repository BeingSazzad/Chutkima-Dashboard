import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Bike, Fuel, IdCard, MapPin, MessageSquare, Phone, ShieldAlert, Star } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { Avatar } from '@/components/shared/Avatar'
import { Stars } from '@/components/shared/Stars'
import { DriverStatusBadge } from '@/components/shared/StatusBadge'
import { REPORT_REASON_META, REPORT_STATUS_META } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import {
  useGetDriverDeliveriesQuery,
  useGetDriverQuery,
  useSetDriverStatusMutation,
} from '@/services/endpoints/driversApi'
import { useGetReportsQuery, useGetReviewsQuery } from '@/services/endpoints/reviewsApi'
import { useGetOpsConfigQuery } from '@/services/endpoints/settingsApi'
import { FUEL_RATE_PER_KM } from '@/lib/constants'
import { formatNPR } from '@/lib/utils'

export default function DriverDetailPage() {
  const { driverId = '' } = useParams()
  const navigate = useNavigate()
  const { data: driver, isLoading } = useGetDriverQuery(driverId)
  const { data: reviews = [] } = useGetReviewsQuery({ driverId })
  const { data: reports = [] } = useGetReportsQuery({ driverId })
  const { data: deliveries = [] } = useGetDriverDeliveriesQuery(driverId)
  const { data: ops } = useGetOpsConfigQuery()
  const [setStatus] = useSetDriverStatusMutation()

  if (isLoading) return <Spinner label="Loading rider…" className="py-24" />
  if (!driver)
    return (
      <Card className="p-10 text-center">
        <p className="text-slate-500">Rider not found.</p>
        <Button variant="outline" className="mx-auto mt-4" onClick={() => navigate(ROUTES.drivers)}>
          Back to drivers
        </Button>
      </Card>
    )

  const openReports = reports.filter((r) => r.status === 'open').length
  const avgRating = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : driver.rating

  return (
    <>
      <PageHeader
        title={driver.name}
        breadcrumbs={[{ label: 'Drivers', to: ROUTES.drivers }, { label: driver.name }]}
        actions={
          <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(ROUTES.drivers)}>
            Back
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={driver.name} src={driver.avatar} size="lg" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-800">{driver.name}</p>
                  <div className="mt-0.5"><DriverStatusBadge status={driver.status} /></div>
                </div>
              </div>
              <div className="mt-4 space-y-2.5 text-sm">
                <p className="flex items-center gap-2 text-slate-600"><Phone className="h-4 w-4 text-slate-400" /> {driver.phone}</p>
                <p className="flex items-center gap-2 text-slate-600"><Bike className="h-4 w-4 text-slate-400" /> {driver.vehicle}</p>
                <p className="flex items-center gap-2 text-slate-600"><MapPin className="h-4 w-4 text-slate-400" /> {driver.zone}</p>
                <p className="flex items-center gap-2 text-slate-600"><IdCard className="h-4 w-4 text-slate-400" /> License: {driver.licenseNo || <span className="text-slate-400">not on file</span>}</p>
                <p className="flex items-center gap-2 text-slate-600"><Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {avgRating.toFixed(1)} {reviews.length ? `(${reviews.length} reviews)` : 'rating'}</p>
                <p className="flex items-center gap-2 text-slate-600"><Fuel className="h-4 w-4 text-slate-400" /> {driver.kmToday} km today · {formatNPR(driver.kmToday * (ops?.fuelRatePerKm ?? FUEL_RATE_PER_KM))} fuel</p>
              </div>
              <div className="mt-4 flex gap-2">
                {driver.status === 'offline' ? (
                  <Button size="sm" className="flex-1" onClick={() => setStatus({ id: driver.id, status: 'available' })}>Set available</Button>
                ) : driver.status === 'available' ? (
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => setStatus({ id: driver.id, status: 'offline' })}>Set offline</Button>
                ) : (
                  <Button size="sm" variant="outline" className="flex-1" disabled>On a delivery</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center">
              <p className="text-lg font-extrabold text-slate-800">{driver.deliveriesToday}</p>
              <p className="text-[11px] text-slate-400">Today</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-lg font-extrabold text-slate-800">{driver.totalDeliveries.toLocaleString()}</p>
              <p className="text-[11px] text-slate-400">Total</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-lg font-extrabold text-slate-800">{driver.onTimeRate}%</p>
              <p className="text-[11px] text-slate-400">On-time</p>
            </Card>
          </div>

          {openReports > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <ShieldAlert className="h-4 w-4" /> {openReports} open report{openReports > 1 ? 's' : ''} need review.
            </div>
          )}
        </div>

        {/* Feedback */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Recent deliveries" subtitle={`${deliveries.length} completed`} />
            <CardContent className="pt-2">
              {deliveries.length === 0 ? (
                <EmptyState title="No deliveries yet" description="Completed deliveries will appear here." icon={<Bike className="h-6 w-6" />} />
              ) : (
                <div className="divide-y divide-slate-50">
                  {deliveries.map((o) => (
                    <div key={o.id} className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{o.reference}</p>
                        <p className="text-xs text-slate-400">{o.customerName} · {o.zone} · {timeAgo(o.placedAt)}</p>
                      </div>
                      <span className="text-sm font-bold text-slate-800">{formatNPR(o.grandTotal)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Reports" subtitle={`${reports.length} filed by customers`} />
            <CardContent className="pt-2">
              {reports.length === 0 ? (
                <EmptyState title="No reports" description="This rider has a clean record." icon={<ShieldAlert className="h-6 w-6" />} />
              ) : (
                <div className="space-y-2">
                  {reports.map((r) => (
                    <div key={r.id} className="rounded-xl border border-slate-100 p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-800">{REPORT_REASON_META[r.reason]}</span>
                        <Badge tone={REPORT_STATUS_META[r.status].badge}>{REPORT_STATUS_META[r.status].label}</Badge>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">{r.details}</p>
                      <p className="mt-1.5 text-xs text-slate-400">By {r.customerName} · {r.orderId} · {timeAgo(r.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Reviews" subtitle={`${reviews.length} customer ratings`} />
            <CardContent className="pt-2">
              {reviews.length === 0 ? (
                <EmptyState title="No reviews yet" description="Customer ratings will show here." icon={<MessageSquare className="h-6 w-6" />} />
              ) : (
                <div className="space-y-2">
                  {reviews.map((rv) => (
                    <div key={rv.id} className="rounded-xl border border-slate-100 p-3.5">
                      <div className="flex items-center gap-2">
                        <Stars value={rv.rating} />
                        <span className="text-sm font-semibold text-slate-700">{rv.rating}.0</span>
                      </div>
                      <p className="mt-1 text-sm text-slate-600">“{rv.comment}”</p>
                      <p className="mt-1.5 text-xs text-slate-400">By {rv.customerName} · {rv.orderId} · {timeAgo(rv.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
