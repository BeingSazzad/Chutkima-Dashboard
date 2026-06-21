import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote, MapPin, Phone, Printer, StickyNote } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/shared/Avatar'
import { ProductThumb } from '@/components/shared/ProductThumb'
import { OrderStatusBadge, PaymentBadge } from '@/components/shared/StatusBadge'
import { OrderJourney } from '@/components/orders/OrderJourney'
import { AssignDriverModal } from '@/components/orders/AssignDriverModal'
import { PackingCard } from '@/components/orders/PackingCard'
import { RiderCard } from '@/components/orders/RiderCard'
import { SubstituteModal } from '@/components/orders/SubstituteModal'
import { ACTOR_META, ORDER_JOURNEY, ORDER_STAGE_ACTOR, ORDER_STATUS_META, PAYMENT_META } from '@/lib/constants'
import { printOrderInvoice } from '@/lib/export'
import { cn, formatDateTime, formatNPR } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import {
  useGetOrderQuery,
  useMarkCodCollectedMutation,
  useUpdateOrderStatusMutation,
} from '@/services/endpoints/ordersApi'
import { useGetDriverQuery } from '@/services/endpoints/driversApi'
import type { OrderItem, OrderStatus } from '@/types/common.types'

export default function OrderDetailPage() {
  const { orderId = '' } = useParams()
  const navigate = useNavigate()
  const { data: order, isLoading } = useGetOrderQuery(orderId)
  const { data: driver } = useGetDriverQuery(order?.driverId ?? '', { skip: !order?.driverId })
  const [updateStatus, { isLoading: updating }] = useUpdateOrderStatusMutation()
  const [markCod, { isLoading: markingCod }] = useMarkCodCollectedMutation()
  const [assignOpen, setAssignOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [substituteFor, setSubstituteFor] = useState<OrderItem | null>(null)

  if (isLoading) return <Spinner label="Loading order…" className="py-24" />
  if (!order)
    return (
      <Card className="p-10 text-center">
        <p className="text-slate-500">Order not found.</p>
        <Button variant="outline" className="mx-auto mt-4" onClick={() => navigate(ROUTES.orders)}>
          Back to orders
        </Button>
      </Card>
    )

  const currentIndex = ORDER_JOURNEY.indexOf(order.status)
  const nextStatus = ORDER_JOURNEY[currentIndex + 1] as OrderStatus | undefined
  const isClosed = order.status === 'delivered' || order.status === 'cancelled'
  const nextActor = nextStatus ? ORDER_STAGE_ACTOR[nextStatus] : null
  const nextLabel = nextStatus ? ORDER_STATUS_META[nextStatus].label : ''
  const needsRider = nextStatus === 'picked_up' && !order.driverId

  return (
    <>
      <PageHeader
        title={order.reference}
        breadcrumbs={[{ label: 'Orders', to: ROUTES.orders }, { label: order.reference }]}
        actions={
          <>
            <Button variant="outline" leftIcon={<Printer className="h-4 w-4" />} onClick={() => printOrderInvoice(order, driver?.name)}>
              Print invoice
            </Button>
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(ROUTES.orders)}>
              Back
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Left: items + summary */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader
              title="Order items"
              subtitle={`${order.items.length} products · placed ${formatDateTime(order.placedAt)}`}
              action={<OrderStatusBadge status={order.status} />}
            />
            <CardContent className="space-y-3 pt-2">
              {order.items.map((it) => (
                <div key={it.productId} className="flex items-center gap-3">
                  <ProductThumb src={it.image} alt={it.name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-800">{it.name}</p>
                      {it.substituted && <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/15">Substituted</Badge>}
                    </div>
                    <p className="text-xs text-slate-400">
                      {formatNPR(it.price)} × {it.quantity}
                      {it.substituted && it.originalName ? ` · was ${it.originalName}` : ''}
                    </p>
                  </div>
                  <span className="font-bold text-slate-800">{formatNPR(it.price * it.quantity)}</span>
                  {!isClosed && (
                    <button
                      onClick={() => setSubstituteFor(it)}
                      className="focus-ring rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
                    >
                      Substitute
                    </button>
                  )}
                </div>
              ))}

              <div className="mt-2 space-y-2 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-700">{formatNPR(order.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Delivery fee</span>
                  <span className="font-medium text-slate-700">
                    {order.deliveryFee === 0 ? (
                      <span className="font-semibold text-success">FREE</span>
                    ) : (
                      formatNPR(order.deliveryFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-2 text-base font-extrabold text-slate-800">
                  <span>Grand total</span>
                  <span>{formatNPR(order.grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status actions — role-aware (store/admin vs rider) */}
          <Card>
            <CardHeader title="Update status" subtitle="Store/Admin accepts & packs · the rider drives the rest" />
            <CardContent className="space-y-3 pt-2">
              {isClosed ? (
                order.status === 'cancelled' ? (
                  <div className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
                    Cancelled{order.cancelReason ? ` — ${order.cancelReason}` : ''}.
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">This order is delivered and closed.</p>
                )
              ) : (
                <>
                  {/* Store/admin-controlled step */}
                  {nextStatus && nextActor === 'store' && (
                    <Button loading={updating} onClick={() => updateStatus({ orderId: order.id, status: nextStatus })}>
                      Accept &amp; mark {nextLabel}
                    </Button>
                  )}

                  {/* Rider-controlled step */}
                  {nextStatus && nextActor === 'rider' && (
                    needsRider ? (
                      <div className="rounded-xl bg-amber-50 px-3 py-3">
                        <p className="text-sm font-medium text-amber-700">Assign a rider to begin delivery.</p>
                        <Button className="mt-2" size="sm" onClick={() => setAssignOpen(true)}>
                          Assign rider
                        </Button>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-violet-50 px-3 py-3">
                        <p className="text-sm font-medium text-violet-700">
                          “{nextLabel}” is normally updated by the rider in their app.
                        </p>
                        <Button className="mt-2" size="sm" variant="outline" loading={updating} onClick={() => updateStatus({ orderId: order.id, status: nextStatus })}>
                          Admin override → Mark {nextLabel}
                        </Button>
                      </div>
                    )
                  )}

                  <Button variant="danger" size="sm" onClick={() => setCancelOpen(true)}>
                    Cancel order
                  </Button>

                  {/* Who-does-what legend */}
                  <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-[11px]">
                    {(['system', 'store', 'rider'] as const).map((a) => (
                      <span key={a} className={cn('rounded-full px-2 py-0.5 font-semibold ring-1 ring-inset', ACTOR_META[a].badge)}>
                        {ACTOR_META[a].label}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <PackingCard order={order} />
        </div>

        {/* Right: journey + people */}
        <div className="space-y-4">
          <Card>
            <CardHeader title="Order journey" />
            <CardContent className="pt-2">
              <OrderJourney status={order.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Customer" />
            <CardContent className="pt-2">
              <div className="flex items-center gap-3">
                <Avatar name={order.customerName} />
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800">{order.customerName}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <Phone className="h-3 w-3" /> {order.customerPhone}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-mint-50 p-3 text-sm text-slate-600">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                {order.address}
              </div>
              {order.note && (
                <div className="mt-2 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                  <StickyNote className="mt-0.5 h-4 w-4 shrink-0" />
                  <span><span className="font-semibold">Note:</span> {order.note}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <RiderCard order={order} onAssignPrimary={() => setAssignOpen(true)} />

          <Card className="p-5">
            <p className="text-sm font-medium text-slate-400">Payment</p>
            <p className="mt-1 font-bold text-slate-800">{PAYMENT_META[order.paymentMethod].label}</p>
            <div className="mt-2">
              <PaymentBadge method={order.paymentMethod} status={order.paymentStatus} />
            </div>
            {order.paymentMethod === 'cod' && (
              <>
                <div className="mt-3 flex items-center justify-between rounded-xl bg-amber-50 px-3 py-2.5">
                  <span className="text-xs font-semibold text-amber-700">Rider collects on delivery</span>
                  <span className="text-sm font-extrabold text-amber-800">{formatNPR(order.grandTotal)}</span>
                </div>
                {order.codCollected ? (
                  <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-success">
                    <Banknote className="h-4 w-4" /> Cash collected & reconciled
                  </p>
                ) : (
                  <Button
                    className="mt-2 w-full"
                    variant="secondary"
                    loading={markingCod}
                    leftIcon={<Banknote className="h-4 w-4" />}
                    onClick={() => markCod(order.id)}
                  >
                    Mark COD collected
                  </Button>
                )}
              </>
            )}
          </Card>
        </div>
      </div>

      <AssignDriverModal order={order} open={assignOpen} onClose={() => setAssignOpen(false)} />
      <SubstituteModal orderId={order.id} item={substituteFor} onClose={() => setSubstituteFor(null)} />

      <Modal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        title="Cancel order"
        description={`Order ${order.reference}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setCancelOpen(false)}>Keep order</Button>
            <Button
              variant="danger"
              loading={updating}
              disabled={!cancelReason.trim()}
              onClick={async () => {
                await updateStatus({ orderId: order.id, status: 'cancelled', reason: cancelReason.trim() }).unwrap()
                setCancelOpen(false)
                setCancelReason('')
              }}
            >
              Cancel order
            </Button>
          </>
        }
      >
        <Textarea
          label="Reason for cancellation (required)"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          rows={3}
          placeholder="e.g. Customer not reachable / item unavailable"
          autoFocus
        />
        {order.paymentMethod !== 'cod' && (
          <p className="mt-2 text-xs text-slate-400">A prepaid order will be auto-refunded to {PAYMENT_META[order.paymentMethod].label}.</p>
        )}
      </Modal>
    </>
  )
}
