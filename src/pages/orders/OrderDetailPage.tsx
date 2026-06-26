import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote, Clock, MapPin, MessageCircle, Phone, Printer, RotateCcw, StickyNote } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/shared/Avatar'
import { ProductThumb } from '@/components/shared/ProductThumb'
import { OrderStatusBadge, PaymentBadge } from '@/components/shared/StatusBadge'
import { OrderJourney } from '@/components/orders/OrderJourney'
import { LiveTrackingCard } from '@/components/orders/LiveTrackingCard'
import { PackingCard } from '@/components/orders/PackingCard'
import { AssignDriverModal } from '@/components/orders/AssignDriverModal'
import { RiderCard } from '@/components/orders/RiderCard'
import { SubstituteModal } from '@/components/orders/SubstituteModal'
import { ORDER_JOURNEY, ORDER_STAGE_ACTOR, ORDER_STATUS_META, PAYMENT_META } from '@/lib/constants'
import { printOrderInvoice } from '@/lib/export'
import { deliveryTiming } from '@/lib/orderTiming'
import { buildAdminOrderAlert, openWhatsApp } from '@/lib/whatsapp'
import { formatDateTime, formatNPR } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import {
  useGetOrderQuery,
  useMarkCodCollectedMutation,
  useAddOrderNoteMutation,
  useAddRefundMutation,
  useUpdateOrderStatusMutation,
  useAcceptRiderMutation,
} from '@/services/endpoints/ordersApi'
import { awaitingRiderAcceptance } from '@/lib/orderStage'
import { useGetDriverQuery } from '@/services/endpoints/driversApi'
import { useGetStoresQuery } from '@/services/endpoints/storesApi'
import { useGetOpsConfigQuery, useGetStoreSetupQuery, useGetSystemControlsQuery } from '@/services/endpoints/settingsApi'
import { useAuth } from '@/hooks/useAuth'
import type { Order, OrderItem, OrderStatus, RefundType } from '@/types/common.types'

export default function OrderDetailPage() {
  const { orderId = '' } = useParams()
  const navigate = useNavigate()
  const { data: order, isLoading } = useGetOrderQuery(orderId)
  const { data: driver } = useGetDriverQuery(order?.driverId ?? '', { skip: !order?.driverId })
  const { data: stores = [] } = useGetStoresQuery()
  const { data: ops } = useGetOpsConfigQuery()
  const { data: storeSetup } = useGetStoreSetupQuery()
  const { data: sysControls } = useGetSystemControlsQuery()
  const [updateStatus, { isLoading: updating }] = useUpdateOrderStatusMutation()
  const [acceptRider, { isLoading: accepting }] = useAcceptRiderMutation()
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
  const timing = deliveryTiming(order)
  const nextLabel = nextStatus ? ORDER_STATUS_META[nextStatus].label : ''
  const needsRider = nextStatus === 'picked_up' && !order.driverId
  const store = stores.find((s) => s.id === order.storeId)

  return (
    <>
      <PageHeader
        title={order.reference}
        breadcrumbs={[{ label: 'Orders', to: ROUTES.orders }, { label: order.reference }]}
        actions={
          <>
            {sysControls?.whatsappAdminAlert && ['pending', 'confirmed'].includes(order.status) && (
              <Button
                variant="outline"
                leftIcon={<MessageCircle className="h-4 w-4" />}
                onClick={() => openWhatsApp(sysControls.adminWhatsappNumber, buildAdminOrderAlert(order))}
              >
                Alert admin
              </Button>
            )}
            <Button variant="outline" leftIcon={<Printer className="h-4 w-4" />} onClick={() => printOrderInvoice(order, driver?.name, storeSetup)}>
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
              {order.scheduledFor && (
                <div className="flex items-center gap-2 rounded-xl bg-violet-50 px-3 py-2.5 text-sm font-medium text-violet-700">
                  <Clock className="h-4 w-4" /> Scheduled delivery for {formatDateTime(order.scheduledFor)}
                </div>
              )}
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
                  {/* Pending → one-click confirm (then dispatch to packer + rider). */}
                  {order.status === 'pending' && (
                    <div className="rounded-xl bg-blue-50 px-3 py-3">
                      <p className="text-sm font-medium text-blue-700">New order — confirm to dispatch to packer &amp; rider.</p>
                      <Button className="mt-2" size="sm" loading={updating} onClick={() => updateStatus({ orderId: order.id, status: 'confirmed' })}>
                        Confirm order
                      </Button>
                    </div>
                  )}

                  {/* Rider assigned but not yet accepted — admin can mark accepted or reassign. */}
                  {awaitingRiderAcceptance(order) && (
                    <div className="rounded-xl bg-amber-50 px-3 py-3">
                      <p className="text-sm font-medium text-amber-700">Rider assigned — waiting for them to accept.</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button size="sm" loading={accepting} onClick={() => acceptRider({ orderId: order.id })}>
                          Mark rider accepted
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setAssignOpen(true)}>
                          Reassign
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Rider-controlled step (full-width info box) */}
                  {nextStatus && nextActor === 'rider' && (
                    needsRider ? (
                      <div className="rounded-xl bg-amber-50 px-3 py-3">
                        <p className="text-sm font-medium text-amber-700">Assign a rider to begin delivery.</p>
                        <Button className="mt-2" size="sm" onClick={() => setAssignOpen(true)}>
                          Assign rider
                        </Button>
                      </div>
                    ) : nextStatus === 'delivered' && ops?.multiRiderEnabled && order.assignments.length > 1 ? (
                      <div className="rounded-xl bg-violet-50 px-3 py-3 text-sm font-medium text-violet-700">
                        This is a team order — it’s marked Delivered once <strong>all {order.assignments.length} riders confirm</strong> in the Riders panel.
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

                  {/* Confirmed/packing: packing is owned by the Packing card below; rider is assigned in parallel. */}
                  {(order.status === 'confirmed' || order.status === 'packing') && (
                    <p className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-500">
                      Assign a packer &amp; rider, then <strong>Mark ready for pickup</strong> in the Packing card below.
                    </p>
                  )}

                  {/* Cancel — allowed only before the rider picks up. */}
                  {['pending', 'confirmed', 'packing', 'packed'].includes(order.status) && (
                    <Button variant="danger" onClick={() => setCancelOpen(true)}>
                      Cancel order
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <PackingCard order={order} />
        </div>

        {/* Right: journey + people */}
        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Order journey"
              action={
                timing ? (
                  <Badge tone={timing.tone === 'green' ? 'bg-green-50 text-green-700 ring-green-600/15' : 'bg-red-50 text-red-700 ring-red-600/15'}>
                    {timing.label}
                  </Badge>
                ) : undefined
              }
            />
            <CardContent className="pt-2">
              <OrderJourney status={order.status} timestamps={order.stageTimestamps} order={order} />
            </CardContent>
          </Card>

          {order.driverId && !isClosed && <LiveTrackingCard order={order} driver={driver} store={store} />}

          <RefundCard order={order} />

          <OrderNotesCard order={order} />

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

/** Internal admin notes — append-only audit trail (multiple notes, never overwritten). */
function OrderNotesCard({ order }: { order: Order }) {
  const { user } = useAuth()
  const [addNote, { isLoading }] = useAddOrderNoteMutation()
  const [note, setNote] = useState('')

  const onSave = async () => {
    if (!note.trim()) return
    await addNote({ orderId: order.id, content: note.trim(), adminName: user?.name ?? 'Admin', adminId: user?.id }).unwrap()
    setNote('')
  }

  const history = [...order.notes].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))

  return (
    <Card>
      <CardHeader title="Admin notes" subtitle="Internal — disputes / follow-ups (not shown to customer)" />
      <CardContent className="space-y-3 pt-2">
        <div>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. Customer disputes missing item — follow up before refund." />
          <div className="mt-2 flex justify-end">
            <Button size="sm" onClick={onSave} loading={isLoading} disabled={!note.trim()} leftIcon={<StickyNote className="h-3.5 w-3.5" />}>Add note</Button>
          </div>
        </div>
        {history.length > 0 && (
          <ol className="space-y-2.5 border-t border-slate-100 pt-3">
            {history.map((n) => (
              <li key={n.id} className="flex gap-2.5">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-400" />
                <div className="min-w-0">
                  <p className="text-sm text-slate-700">{n.content}</p>
                  <p className="text-xs text-slate-400">{n.adminName} · {formatDateTime(n.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  )
}

/** Order refund management — full / partial refunds with history & remaining balance. */
function RefundCard({ order }: { order: Order }) {
  const { user } = useAuth()
  const [addRefund, { isLoading }] = useAddRefundMutation()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<RefundType>('full')
  const [amount, setAmount] = useState('')
  const [reason, setReason] = useState('')
  const [comments, setComments] = useState('')

  const refunded = order.refunds.reduce((s, r) => s + r.amount, 0)
  const remaining = Math.max(0, order.grandTotal - refunded)
  const partialAmount = Number(amount) || 0
  const valid = reason.trim() && comments.trim() && (type === 'full' || (partialAmount > 0 && partialAmount <= remaining))

  const submit = async () => {
    await addRefund({
      orderId: order.id,
      type,
      amount: type === 'full' ? remaining : partialAmount,
      reason: reason.trim(),
      comments: comments.trim(),
      adminName: user?.name ?? 'Admin',
    }).unwrap()
    setOpen(false)
    setType('full')
    setAmount('')
    setReason('')
    setComments('')
  }

  return (
    <Card>
      <CardHeader
        title="Refunds"
        subtitle="Full or partial — with audit trail"
        action={
          remaining > 0 ? (
            <Button size="sm" variant="outline" leftIcon={<RotateCcw className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>
              Refund
            </Button>
          ) : (
            <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/15">Fully refunded</Badge>
          )
        }
      />
      <CardContent className="space-y-3 pt-2">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-xl border border-slate-100 px-3 py-2">
            <p className="text-xs text-slate-400">Total refunded</p>
            <p className="font-bold text-slate-800">{formatNPR(refunded)}</p>
          </div>
          <div className="rounded-xl border border-slate-100 px-3 py-2">
            <p className="text-xs text-slate-400">Remaining refundable</p>
            <p className="font-bold text-slate-800">{formatNPR(remaining)}</p>
          </div>
        </div>
        {order.refunds.length > 0 && (
          <ol className="space-y-2.5 border-t border-slate-100 pt-3">
            {[...order.refunds].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)).map((r) => (
              <li key={r.id} className="flex gap-2.5">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800 capitalize">{r.type} refund</p>
                    <span className="text-sm font-bold text-amber-600">{formatNPR(r.amount)}</span>
                  </div>
                  <p className="text-xs text-slate-500">{r.reason} — {r.comments}</p>
                  <p className="text-xs text-slate-400">{r.adminName} · {formatDateTime(r.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Process refund"
        description={`${order.reference} · refundable ${formatNPR(remaining)}`}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="danger" loading={isLoading} disabled={!valid} onClick={submit}>Process refund</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Select
            label="Refund type"
            value={type}
            onChange={(e) => setType(e.target.value as RefundType)}
            options={[
              { label: `Full refund (${formatNPR(remaining)})`, value: 'full' },
              { label: 'Partial refund', value: 'partial' },
            ]}
          />
          {type === 'partial' && (
            <Input label={`Refund amount (max ${formatNPR(remaining)})`} type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          )}
          <Input label="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Damaged item / missing product" />
          <Textarea label="Comments (required)" value={comments} onChange={(e) => setComments(e.target.value)} rows={2} placeholder="Internal notes for the audit trail" />
        </div>
      </Modal>
    </Card>
  )
}
