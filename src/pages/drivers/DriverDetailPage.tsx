import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Ban, Bike, Fuel, IdCard, MapPin, MessageSquare, Phone, ShieldAlert, ShieldCheck, Star, UserX } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { EmptyState } from '@/components/ui/EmptyState'
import { Tabs } from '@/components/ui/Tabs'
import { Avatar } from '@/components/shared/Avatar'
import { EntityLink } from '@/components/shared/EntityLink'
import { Stars } from '@/components/shared/Stars'
import { DriverStatusBadge } from '@/components/shared/StatusBadge'
import { WarnRiderModal } from '@/components/drivers/WarnRiderModal'
import { RiderLiveTrackingCard } from '@/components/drivers/RiderLiveTrackingCard'
import { DRIVER_ACCOUNT_META, REPORT_REASON_META, REPORT_STATUS_META, WARNING_SEVERITY_META } from '@/lib/constants'
import { formatDateTime, timeAgo } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import {
  useGetDriverAccountEventsQuery,
  useGetDriverDeliveriesQuery,
  useGetDriverQuery,
  useSetDriverAccountMutation,
  useSetDriverStatusMutation,
} from '@/services/endpoints/driversApi'
import { useGetReportsQuery, useGetReviewsQuery, useGetWarningsQuery } from '@/services/endpoints/reviewsApi'
import { useGetOpsConfigQuery } from '@/services/endpoints/settingsApi'
import { FUEL_RATE_PER_KM } from '@/lib/constants'
import { formatNPR } from '@/lib/utils'
import type { DriverAccountAction } from '@/types/common.types'

const ACCOUNT_ACTION_LABEL: Record<DriverAccountAction, string> = {
  suspended: 'Suspended',
  terminated: 'Terminated',
  reinstated: 'Reinstated',
}

export default function DriverDetailPage() {
  const { driverId = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data: driver, isLoading } = useGetDriverQuery(driverId)
  const { data: reviews = [] } = useGetReviewsQuery({ driverId })
  const { data: reports = [] } = useGetReportsQuery({ driverId })
  const { data: warnings = [] } = useGetWarningsQuery({ driverId })
  const { data: accountEvents = [] } = useGetDriverAccountEventsQuery(driverId)
  const { data: deliveries = [] } = useGetDriverDeliveriesQuery(driverId)
  const { data: ops } = useGetOpsConfigQuery()
  const [setStatus] = useSetDriverStatusMutation()
  const [setAccount, { isLoading: savingAccount }] = useSetDriverAccountMutation()
  const [warnFor, setWarnFor] = useState<{ reportId?: string; reportReason?: string } | null>(null)
  const [acctAction, setAcctAction] = useState<DriverAccountAction | null>(null)
  const [acctReason, setAcctReason] = useState('')
  const [activityTab, setActivityTab] = useState('deliveries')

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
  const accountStatus = driver.accountStatus ?? 'active'
  const acctMeta = DRIVER_ACCOUNT_META[accountStatus]

  const submitAccount = async () => {
    if (!acctAction || !acctReason.trim()) return
    await setAccount({ driverId: driver.id, action: acctAction, reason: acctReason.trim(), by: user?.name ?? 'Admin' }).unwrap()
    setAcctAction(null)
    setAcctReason('')
  }

  return (
    <>
      <PageHeader
        title={driver.name}
        backTo={ROUTES.drivers}
        breadcrumbs={[{ label: 'Riders', to: ROUTES.drivers }, { label: driver.name }]}
        actions={
          <>
            {accountStatus === 'active' ? (
              <>
                <Button variant="outline" leftIcon={<Ban className="h-4 w-4" />} onClick={() => setAcctAction('suspended')}>
                  Suspend
                </Button>
                <Button variant="outline" leftIcon={<UserX className="h-4 w-4" />} onClick={() => setAcctAction('terminated')}>
                  Terminate
                </Button>
              </>
            ) : (
              <Button variant="secondary" leftIcon={<ShieldCheck className="h-4 w-4" />} onClick={() => setAcctAction('reinstated')}>
                Reinstate
              </Button>
            )}
            <Button variant="danger" leftIcon={<ShieldAlert className="h-4 w-4" />} onClick={() => setWarnFor({})}>
              Warn rider
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile — sticky sidebar so it stays in view beside the long activity column */}
        <div className="space-y-4 lg:sticky lg:top-6 lg:self-start">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={driver.name} src={driver.avatar} size="lg" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-800">{driver.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <DriverStatusBadge status={driver.status} />
                    {accountStatus !== 'active' && <Badge tone={acctMeta.badge}>{acctMeta.label}</Badge>}
                  </div>
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
                {accountStatus !== 'active' ? (
                  <Button size="sm" variant="outline" className="flex-1" disabled>{acctMeta.label} — reinstate first</Button>
                ) : driver.status === 'offline' ? (
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

          {(driver.licenseDoc || driver.vehicleRegDoc) && (
            <Card>
              <CardHeader title="Documents" subtitle="KYC — license & registration" />
              <CardContent className="grid grid-cols-2 gap-3 pt-2">
                {[
                  { label: 'Driving license', src: driver.licenseDoc },
                  { label: 'Vehicle registration', src: driver.vehicleRegDoc },
                ].map((doc) =>
                  doc.src ? (
                    <a key={doc.label} href={doc.src} target="_blank" rel="noreferrer" className="group">
                      <img src={doc.src} alt={doc.label} className="aspect-[16/10] w-full rounded-xl border border-slate-200 object-cover transition group-hover:opacity-90" />
                      <p className="mt-1 text-xs font-medium text-slate-500">{doc.label}</p>
                    </a>
                  ) : (
                    <div key={doc.label} className="flex aspect-[16/10] items-center justify-center rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                      No {doc.label.toLowerCase()}
                    </div>
                  ),
                )}
              </CardContent>
            </Card>
          )}

          {openReports > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              <ShieldAlert className="h-4 w-4" /> {openReports} open report{openReports > 1 ? 's' : ''} need review.
            </div>
          )}
        </div>

        {/* Activity — live tracking full-width, then a balanced 2-column card grid */}
        <div className="space-y-4 lg:col-span-2">
          <RiderLiveTrackingCard driver={driver} />

          <Card>
            <Tabs
              className="px-3 pt-1"
              items={[
                { label: 'Deliveries', value: 'deliveries', count: deliveries.length },
                { label: 'Reports', value: 'reports', count: reports.length },
                { label: 'Warnings', value: 'warnings', count: warnings.length },
                { label: 'Account', value: 'account', count: accountEvents.length },
                { label: 'Reviews', value: 'reviews', count: reviews.length },
              ]}
              value={activityTab}
              onChange={setActivityTab}
            />
            <CardContent className="pt-3">
              {activityTab === 'deliveries' &&
                (deliveries.length === 0 ? (
                  <EmptyState title="No deliveries yet" description="Completed deliveries will appear here." icon={<Bike className="h-6 w-6" />} />
                ) : (
                  <div className="divide-y divide-slate-50">
                    {deliveries.map((o) => (
                      <div key={o.id} className="flex items-center justify-between py-2.5">
                        <div className="min-w-0">
                          <EntityLink kind="order" id={o.id} newTab className="block text-sm font-semibold text-slate-800">{o.reference}</EntityLink>
                          <p className="truncate text-xs text-slate-400">
                            <EntityLink kind="customer" id={o.customerId} className="hover:text-brand-600">{o.customerName}</EntityLink> · {o.zone} · {timeAgo(o.placedAt)}
                          </p>
                        </div>
                        <span className="text-sm font-bold text-slate-800">{formatNPR(o.grandTotal)}</span>
                      </div>
                    ))}
                  </div>
                ))}

              {activityTab === 'reports' &&
                (reports.length === 0 ? (
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
                        <div className="mt-1.5 flex items-center justify-between gap-2">
                          <p className="text-xs text-slate-400">By {r.customerName} · {r.orderId} · {timeAgo(r.createdAt)}</p>
                          <Button size="sm" variant="ghost" leftIcon={<ShieldAlert className="h-3.5 w-3.5" />} onClick={() => setWarnFor({ reportId: r.id, reportReason: REPORT_REASON_META[r.reason] })}>
                            Warn
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

              {activityTab === 'warnings' && (
                <>
                  <div className="mb-3 flex justify-end">
                    <Button size="sm" variant="outline" leftIcon={<ShieldAlert className="h-3.5 w-3.5" />} onClick={() => setWarnFor({})}>
                      Send warning
                    </Button>
                  </div>
                  {warnings.length === 0 ? (
                    <EmptyState title="No warnings" description="This rider has not been warned." icon={<ShieldAlert className="h-6 w-6" />} />
                  ) : (
                    <div className="space-y-2">
                      {warnings.map((w) => (
                        <div key={w.id} className="rounded-xl border border-slate-100 p-3.5">
                          <div className="flex items-center justify-between gap-2">
                            <Badge tone={WARNING_SEVERITY_META[w.severity].badge}>{WARNING_SEVERITY_META[w.severity].label}</Badge>
                            <span className="text-xs text-slate-400">{formatDateTime(w.createdAt)}</span>
                          </div>
                          <p className="mt-1.5 text-sm text-slate-600">{w.message}</p>
                          <p className="mt-1.5 text-xs text-slate-400">By {w.issuedBy}{w.reportId ? ' · from a complaint' : ''}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activityTab === 'account' &&
                (accountEvents.length === 0 ? (
                  <EmptyState title="No account actions" description="No suspensions or terminations on record." icon={<ShieldCheck className="h-6 w-6" />} />
                ) : (
                  <ol className="space-y-2.5">
                    {accountEvents.map((e) => (
                      <li key={e.id} className="flex gap-2.5">
                        <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${e.action === 'reinstated' ? 'bg-success' : e.action === 'terminated' ? 'bg-danger' : 'bg-amber-400'}`} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">{ACCOUNT_ACTION_LABEL[e.action]}</p>
                          <p className="text-sm text-slate-600">{e.reason}</p>
                          <p className="text-xs text-slate-400">{e.by} · {formatDateTime(e.at)}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                ))}

              {activityTab === 'reviews' &&
                (reviews.length === 0 ? (
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
                ))}
            </CardContent>
          </Card>
        </div>
      </div>

      <WarnRiderModal
        open={!!warnFor}
        onClose={() => setWarnFor(null)}
        driverId={driver.id}
        driverName={driver.name}
        reportId={warnFor?.reportId}
        reportReason={warnFor?.reportReason}
      />

      <Modal
        open={!!acctAction}
        onClose={() => {
          setAcctAction(null)
          setAcctReason('')
        }}
        title={acctAction ? `${ACCOUNT_ACTION_LABEL[acctAction]} rider` : undefined}
        description={driver.name}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => { setAcctAction(null); setAcctReason('') }}>
              Cancel
            </Button>
            <Button
              variant={acctAction === 'reinstated' ? 'primary' : 'danger'}
              loading={savingAccount}
              disabled={!acctReason.trim()}
              onClick={submitAccount}
            >
              {acctAction ? ACCOUNT_ACTION_LABEL[acctAction] : 'Confirm'}
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason (required)"
          value={acctReason}
          onChange={(e) => setAcctReason(e.target.value)}
          rows={3}
          placeholder={acctAction === 'reinstated' ? 'e.g. Issue resolved — rider reinstated.' : 'e.g. Repeated extra-charge complaints from customers.'}
          autoFocus
        />
        {acctAction !== 'reinstated' && (
          <p className="mt-2 text-xs text-slate-400">The rider will be taken offline and cannot be assigned new orders.</p>
        )}
      </Modal>
    </>
  )
}
