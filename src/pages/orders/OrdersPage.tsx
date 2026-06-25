import { useMemo, useState } from 'react'
import { Bike, Search, UserPlus } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { Avatar } from '@/components/shared/Avatar'
import { PaymentBadge } from '@/components/shared/StatusBadge'
import { AssignDriverModal } from '@/components/orders/AssignDriverModal'
import { OrderStatusSelect } from '@/components/orders/OrderStatusSelect'
import { PAYMENT_META, ZONES } from '@/lib/constants'
import { formatNPR, openInNewTab, timeAgo } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { useDebounce } from '@/hooks/useDebounce'
import { useGetOrdersQuery, useUpdateOrderStatusMutation } from '@/services/endpoints/ordersApi'
import { useGetDriversQuery } from '@/services/endpoints/driversApi'
import { useGetStoresQuery } from '@/services/endpoints/storesApi'
import type { Order, OrderStatus, PaymentMethod } from '@/types/common.types'

const TABS: TabItem[] = [
  { label: 'All', value: 'all' },
  { label: 'New', value: 'placed' },
  { label: 'Packing', value: 'packing' },
  { label: 'On the way', value: 'on_the_way' },
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
  const [days, setDays] = useState('')
  const [store, setStore] = useState('')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 300)
  const [assignFor, setAssignFor] = useState<Order | null>(null)
  const [cancelFor, setCancelFor] = useState<Order | null>(null)
  const [cancelReason, setCancelReason] = useState('')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [updateStatus, { isLoading: cancelling }] = useUpdateOrderStatusMutation()
  const { data: stores = [] } = useGetStoresQuery()

  /** Quick inline status change. Cancelling needs a reason, so route it to the modal. */
  const changeStatus = async (order: Order, status: OrderStatus) => {
    if (status === 'cancelled') {
      setCancelFor(order)
      return
    }
    setPendingId(order.id)
    try {
      await updateStatus({ orderId: order.id, status }).unwrap()
    } finally {
      setPendingId(null)
    }
  }

  const confirmCancel = async () => {
    if (!cancelFor || !cancelReason.trim()) return
    await updateStatus({ orderId: cancelFor.id, status: 'cancelled', reason: cancelReason.trim() }).unwrap()
    setCancelFor(null)
    setCancelReason('')
  }

  const { data: orders = [], isLoading } = useGetOrdersQuery({
    status: (tab === 'scheduled' ? 'all' : tab) as OrderStatus | 'all',
    zone: zone || undefined,
    payment: (payment as PaymentMethod) || undefined,
    days: days ? Number(days) : undefined,
    storeId: store || undefined,
    search: debouncedSearch || undefined,
  })
  const { data: drivers = [] } = useGetDriversQuery()
  const { data: allOrders = [] } = useGetOrdersQuery()

  // Scheduled tab shows pre-booked (after-hours) orders.
  const shown = tab === 'scheduled' ? orders.filter((o) => o.scheduledFor) : orders

  const driverName = (id: string | null) => drivers.find((d) => d.id === id)?.name

  const tabs = useMemo<TabItem[]>(
    () =>
      TABS.map((t) => ({
        ...t,
        count:
          t.value === 'all'
            ? allOrders.length
            : t.value === 'scheduled'
              ? allOrders.filter((o) => o.scheduledFor).length
              : allOrders.filter((o) => o.status === t.value).length,
      })),
    [allOrders],
  )

  const columns: Column<Order>[] = [
    {
      key: 'ref',
      header: 'Order',
      cell: (o) => (
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-slate-800">{o.reference}</p>
            {o.scheduledFor && <Badge tone="bg-violet-50 text-violet-700 ring-violet-600/15">Scheduled</Badge>}
          </div>
          <p className="text-xs text-slate-400">{o.scheduledFor ? `For ${fmtSchedule(o.scheduledFor)}` : timeAgo(o.placedAt)}</p>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      cell: (o) => (
        <div className="flex items-center gap-2.5">
          <Avatar name={o.customerName} size="sm" />
          <div>
            <p className="font-medium text-slate-700">{o.customerName}</p>
            <p className="text-xs text-slate-400">{o.zone}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'items',
      header: 'Items',
      cell: (o) => <span className="text-slate-600">{o.items.reduce((s, i) => s + i.quantity, 0)} items</span>,
    },
    {
      key: 'total',
      header: 'Total',
      cell: (o) => <p className="font-bold text-slate-800">{formatNPR(o.grandTotal)}</p>,
    },
    {
      key: 'payment',
      header: 'Payment',
      cell: (o) => <PaymentBadge method={o.paymentMethod} status={o.paymentStatus} />,
    },
    {
      key: 'driver',
      header: 'Rider',
      cell: (o) =>
        o.driverId ? (
          <span className="flex items-center gap-1.5 text-sm font-medium text-slate-700">
            <Bike className="h-4 w-4 text-brand-500" />
            {driverName(o.driverId)}
            {o.assignments.length > 1 && (
              <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold text-brand-700">+{o.assignments.length - 1}</span>
            )}
          </span>
        ) : (
          <span className="text-xs font-medium text-amber-600">Unassigned</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (o) => <OrderStatusSelect status={o.status} loading={pendingId === o.id} onChange={(status) => changeStatus(o, status)} />,
    },
    {
      key: 'action',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (o) =>
        ['delivered', 'cancelled'].includes(o.status) ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              openInNewTab(ROUTES.orderDetail(o.id))
            }}
          >
            View
          </Button>
        ) : (
          <Button
            variant={o.driverId ? 'outline' : 'secondary'}
            size="sm"
            leftIcon={<UserPlus className="h-3.5 w-3.5" />}
            onClick={(e) => {
              e.stopPropagation()
              setAssignFor(o)
            }}
          >
            {o.driverId ? 'Reassign' : 'Assign'}
          </Button>
        ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Orders"
        description="Track and dispatch every order across Butwal zones."
      />

      <Card>
        <div className="px-3 pt-2">
          <Tabs items={tabs} value={tab} onChange={setTab} />
        </div>

        <div className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by reference, name or phone…"
              className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:flex">
            <div className="w-full sm:w-40">
              <Select value={zone} onChange={(e) => setZone(e.target.value)} placeholder="All zones" options={ZONES.map((z) => ({ label: z, value: z }))} />
            </div>
            <div className="w-full sm:w-40">
              <Select
                value={payment}
                onChange={(e) => setPayment(e.target.value)}
                placeholder="All payments"
                options={[
                  { label: 'eSewa', value: 'esewa' },
                  { label: 'Khalti', value: 'khalti' },
                  { label: 'ConnectIPS', value: 'connectips' },
                  { label: 'Cash on Delivery', value: 'cod' },
                ]}
              />
            </div>
            <div className="w-full sm:w-36">
              <Select
                value={days}
                onChange={(e) => setDays(e.target.value)}
                placeholder="All time"
                options={[
                  { label: 'Today', value: '1' },
                  { label: 'Last 7 days', value: '7' },
                  { label: 'Last 30 days', value: '30' },
                ]}
              />
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
    </>
  )
}
