import { useMemo, useState } from 'react'
import { AlertTriangle, Bike, Check, Clock3, Download, Eye, PauseCircle, Search, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Avatar } from '@/components/shared/Avatar'
import { PaymentBadge } from '@/components/shared/StatusBadge'
import { AssignDriverModal } from '@/components/orders/AssignDriverModal'
import { OrderStatusSelect } from '@/components/orders/OrderStatusSelect'
import { DateRangeFilter } from '@/components/shared/DateRangeFilter'
import { ORDER_STATUS_META, PAYMENT_META, ZONES } from '@/lib/constants'
import { awaitingRiderAcceptance } from '@/lib/orderStage'
import { downloadCSV } from '@/lib/export'
import { formatDateTime, formatNPR, openInNewTab, timeAgo } from '@/lib/utils'
import { EntityLink } from '@/components/shared/EntityLink'
import { ROUTES } from '@/constants/routes'
import { useDebounce } from '@/hooks/useDebounce'
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '@/services/endpoints/ordersApi'
import { useGetDriversQuery } from '@/services/endpoints/driversApi'
import { useGetStoresQuery } from '@/services/endpoints/storesApi'
import type { Order, OrderStatus, PaymentMethod } from '@/types/common.types'

/** The three rider stages, grouped under one "In transit" tab. */
const IN_TRANSIT: OrderStatus[] = ['picked_up', 'on_the_way', 'arrived']

const TABS: TabItem[] = [
  { label: 'All', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Packing', value: 'packing' },
  { label: 'Packed', value: 'packed' },
  { label: 'In transit', value: 'in_transit' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Scheduled', value: 'scheduled' },
  { label: 'Cancelled', value: 'cancelled' },
]

const fmtSchedule = (iso: string) =>
  new Date(iso).toLocaleString([], { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

export default function OrdersPage() {
  const [tab, setTab] = useState<string>('all')
  const [zone, setZone] = useState('')
  const [payment, setPayment] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [store, setStore] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [assignFor, setAssignFor] = useState<Order | null>(null)
  const [cancelFor, setCancelFor] = useState<Order | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [confirmStatus, setConfirmStatus] = useState<{ order: Order; status: OrderStatus } | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [updateStatus, { isLoading: cancelling }] = useUpdateOrderStatusMutation()
  const { data: stores = [] } = useGetStoresQuery()

  /** Quick inline status change. Cancel needs a reason; pickup needs a rider; others confirm. */
  const changeStatus = (order: Order, status: OrderStatus) => {
    if (status === 'cancelled') {
      setCancelFor(order)
      return
    }
    if (status === 'picked_up' && !order.driverId) {
      // Can't pick up without a rider — open the assign dialog instead.
      setAssignFor(order)
      return
    }
    setConfirmStatus({ order, status })
  }

  const confirmChangeStatus = async () => {
    if (!confirmStatus) return
    const { order, status } = confirmStatus
    setPendingId(order.id)
    try {
      await updateStatus({ orderId: order.id, status }).unwrap()
    } finally {
      setPendingId(null)
      setConfirmStatus(null)
    }
  }

  const confirmCancel = async () => {
    if (!cancelFor || !cancelReason.trim()) return
    await updateStatus({ orderId: cancelFor.id, status: 'cancelled', reason: cancelReason.trim() }).unwrap()
    setCancelFor(null)
    setCancelReason('')
  }

  const { data: orders = [], isLoading } = useGetOrdersQuery({
    status: (tab === 'scheduled' || tab === 'in_transit' ? 'all' : tab) as OrderStatus | 'all',
    zone: zone || undefined,
    payment: (payment as PaymentMethod) || undefined,
    from: from || undefined,
    to: to || undefined,
    storeId: store || undefined,
    search: debouncedSearch || undefined,
  })
  const { data: drivers = [] } = useGetDriversQuery()
  const { data: allOrders = [] } = useGetOrdersQuery()

  // Scheduled tab shows pre-booked orders; In transit groups the three rider stages.
  const shown =
    tab === 'scheduled'
      ? orders.filter((o) => o.scheduledFor)
      : tab === 'in_transit'
        ? orders.filter((o) => IN_TRANSIT.includes(o.status))
        : orders

  // Orders where a rider was assigned but hasn't accepted yet — admin should reassign.
  const awaitingAccept = allOrders.filter(awaitingRiderAcceptance)

  const driverName = (id: string | null) => drivers.find((d) => d.id === id)?.name

  const exportCsv = () => {
    downloadCSV(
      'chutkima-orders.csv',
      shown.map((o) => ({
        reference: o.reference,
        customer: o.customerName,
        phone: o.customerPhone,
        zone: o.zone,
        items: o.items.reduce((s, i) => s + i.quantity, 0).toString(),
        total: formatNPR(o.grandTotal, false),
        payment: PAYMENT_META[o.paymentMethod].label,
        paymentStatus: o.paymentStatus,
        rider: driverName(o.driverId) ?? 'Unassigned',
        status: ORDER_STATUS_META[o.status].label,
        placed: formatDateTime(o.placedAt),
        scheduledFor: o.scheduledFor ? formatDateTime(o.scheduledFor) : '',
      })),
      [
        { key: 'reference', label: 'Order' },
        { key: 'customer', label: 'Customer' },
        { key: 'phone', label: 'Phone' },
        { key: 'zone', label: 'Zone' },
        { key: 'items', label: 'Items' },
        { key: 'total', label: 'Total (NPR)' },
        { key: 'payment', label: 'Payment' },
        { key: 'paymentStatus', label: 'Payment status' },
        { key: 'rider', label: 'Rider' },
        { key: 'status', label: 'Status' },
        { key: 'placed', label: 'Placed' },
        { key: 'scheduledFor', label: 'Scheduled for' },
      ],
    )
  }

  const tabs = useMemo<TabItem[]>(
    () =>
      TABS.map((t) => ({
        ...t,
        count:
          t.value === 'all'
            ? allOrders.length
            : t.value === 'scheduled'
              ? allOrders.filter((o) => o.scheduledFor).length
              : t.value === 'in_transit'
                ? allOrders.filter((o) => IN_TRANSIT.includes(o.status)).length
                : allOrders.filter((o) => o.status === t.value).length,
      })),
    [allOrders],
  )

  const columns: Column<Order>[] = [
    {
      key: 'ref',
      header: 'Order',
      className: 'whitespace-nowrap',
      cell: (o) => (
        <div className="leading-tight">
          <button
            onClick={(e) => {
              e.stopPropagation()
              openInNewTab(ROUTES.orderDetail(o.id))
            }}
            className="focus-ring rounded font-semibold text-brand-700 hover:underline"
            title="Open order details in a new tab"
          >
            {o.reference}
          </button>
          {o.scheduledFor ? (
            <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-violet-600">
              <Clock3 className="h-3 w-3" /> {fmtSchedule(o.scheduledFor)}
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-slate-400">{timeAgo(o.placedAt)}</p>
          )}
          {o.holdUntil && Date.parse(o.holdUntil) > Date.now() && (
            <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-amber-600">
              <PauseCircle className="h-3 w-3" /> On hold
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      className: 'whitespace-nowrap',
      cell: (o) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={o.customerName} size="sm" />
          <div>
            <EntityLink kind="customer" id={o.customerId} className="font-medium text-slate-700">{o.customerName}</EntityLink>
            <p className="text-xs text-slate-400">{o.zone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      className: 'whitespace-nowrap',
      cell: (o) => <span className="text-slate-600">{o.items.reduce((s, i) => s + i.quantity, 0)}</span>,
    },
    {
      key: 'total',
      header: 'Total',
      className: 'whitespace-nowrap',
      cell: (o) => <p className="font-bold text-slate-800">{formatNPR(o.grandTotal)}</p>,
    },
    {
      key: 'payment',
      header: 'Payment',
      className: 'whitespace-nowrap',
      cell: (o) => <PaymentBadge method={o.paymentMethod} status={o.paymentStatus} />,
    },
    {
      key: 'driver',
      header: 'Rider',
      className: 'whitespace-nowrap',
      cell: (o) => {
        const closed = ['delivered', 'cancelled'].includes(o.status)
        if (!o.driverId) {
          return closed ? (
            <span className="text-xs text-slate-400">—</span>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="h-7 px-2.5"
              leftIcon={<UserPlus className="h-3.5 w-3.5" />}
              onClick={(e) => {
                e.stopPropagation()
                setAssignFor(o)
              }}
            >
              Assign
            </Button>
          )
        }
        return (
          <div className="text-sm font-medium text-slate-700">
            <span className="flex items-center gap-1.5">
              <Bike className="h-4 w-4 text-brand-500" />
              <EntityLink kind="driver" id={o.driverId} className="font-medium text-slate-700">{driverName(o.driverId)}</EntityLink>
              {!closed && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setAssignFor(o)
                  }}
                  className="focus-ring rounded px-1 text-[11px] font-semibold text-brand-600 hover:underline"
                  title="Change rider"
                >
                  Reassign
                </button>
              )}
            </span>
            {awaitingRiderAcceptance(o) ? (
              <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-600">
                <Clock3 className="h-3 w-3" /> Awaiting accept
              </span>
            ) : o.riderAccepted && !['picked_up', 'on_the_way', 'arrived', 'delivered'].includes(o.status) ? (
              <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-success">
                <Check className="h-3 w-3" /> Accepted
              </span>
            ) : null}
          </div>
        )
      },
    },
    {
      key: 'status',
      header: 'Status',
      className: 'whitespace-nowrap',
      cell: (o) => <OrderStatusSelect status={o.status} loading={pendingId === o.id} onChange={(status) => changeStatus(o, status)} />,
    },
    {
      key: 'action',
      header: '',
      headerClassName: 'text-right',
      className: 'whitespace-nowrap text-right',
      cell: (o) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="px-2"
            onClick={(e) => {
              e.stopPropagation()
              openInNewTab(ROUTES.orderDetail(o.id))
            }}
            aria-label="Open in new tab"
            title="Open in new tab"
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Orders"
        description="Track and dispatch every order across Butwal zones."
        actions={
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={shown.length === 0}>
            Export CSV
          </Button>
        }
      />

      {awaitingAccept.length > 0 && (
        <div className="mb-3 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {awaitingAccept.length} order{awaitingAccept.length > 1 ? 's' : ''} waiting for a rider to accept — reassign if needed.
        </div>
      )}

      <Card>
        <div className="px-3 pt-2">
          <Tabs items={tabs} value={tab} onChange={setTab} />
        </div>

        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference, name or phone…"
              className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-3 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
            <div className="w-full sm:w-40">
              <Select value={zone} onChange={(e) => setZone(e.target.value)} placeholder="All zones" options={ZONES.map((z) => ({ label: z, value: z }))} />
            </div>
            <div className="w-full sm:w-40">
              <Select
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                placeholder="All payments"
                options={[
                  { label: 'COD (cash)', value: 'cod' },
                  { label: 'eSewa', value: 'esewa' },
                  { label: 'Khalti', value: 'khalti' },
                  { label: 'ConnectIPS', value: 'connectips' },
                ]}
              />
            </div>
            <div className="col-span-2 sm:w-auto">
              <DateRangeFilter from={from} to={to} max={new Date().toISOString().slice(0, 10)} onChange={(r) => { setFrom(r.from); setTo(r.to) }} />
            </div>
            {stores.length > 1 && (
              <div className="w-full sm:w-44">
                <Select value={store} onChange={(e) => setStore(e.target.value)} placeholder="All stores" options={stores.map((s) => ({ label: s.name, value: s.id }))} />
              </div>
            )}
          </div>
        </div>

        <DataTable
          columns={columns}
          data={shown}
          rowKey={(o) => o.id}
          onRowClick={(o) => openInNewTab(ROUTES.orderDetail(o.id))}
          loading={isLoading}
          emptyTitle="No orders found"
          emptyDescription="Try a different filter or search term."
        />
      </Card>

      <AssignDriverModal order={assignFor} open={!!assignFor} onClose={() => setAssignFor(null)} />

      <Modal
        open={!!cancelFor}
        onClose={() => {
          setCancelFor(null)
          setCancelReason('')
        }}
        title="Cancel order"
        description={cancelFor ? `Order ${cancelFor.reference}` : undefined}
        size="sm"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                setCancelFor(null)
                setCancelReason('')
              }}
            >
              Keep order
            </Button>
            <Button variant="danger" loading={cancelling} disabled={!cancelReason.trim()} onClick={confirmCancel}>
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
        {cancelFor && cancelFor.paymentMethod !== 'cod' && (
          <p className="mt-2 text-xs text-slate-400">
            A prepaid order will be auto-refunded to {PAYMENT_META[cancelFor.paymentMethod].label}.
          </p>
        )}
      </Modal>

      <ConfirmDialog
        open={!!confirmStatus}
        onClose={() => setConfirmStatus(null)}
        onConfirm={confirmChangeStatus}
        loading={pendingId === confirmStatus?.order.id}
        title="Change order status?"
        description={
          confirmStatus
            ? `Move ${confirmStatus.order.reference} to "${ORDER_STATUS_META[confirmStatus.status].label}".`
            : undefined
        }
        confirmLabel="Change status"
      />
    </>
  )
}
