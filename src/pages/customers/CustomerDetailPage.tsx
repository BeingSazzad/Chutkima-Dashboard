import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, Calendar, HandCoins, MapPin, Phone, Plus, Receipt, ShieldCheck, Trash2, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Avatar } from '@/components/shared/Avatar'
import { ProductThumb } from '@/components/shared/ProductThumb'
import { CustomerTrustBadge, OrderStatusBadge, PaymentBadge } from '@/components/shared/StatusBadge'
import { COD_MODE_LABEL, deriveTrustBadge } from '@/lib/trust'
import { CREDIT_TYPE_META } from '@/lib/constants'
import { useGetTrustConfigQuery } from '@/services/endpoints/settingsApi'
import { EmptyState } from '@/components/ui/EmptyState'
import { useAuth } from '@/hooks/useAuth'
import { formatDateTime, formatNPR, timeAgo } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import {
  useAddCustomerCreditMutation,
  useBanCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomerOrdersQuery,
  useGetCustomerQuery,
} from '@/services/endpoints/customersApi'
import type { CreditType, Customer, Order } from '@/types/common.types'

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 px-3 py-2">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-bold text-slate-800">{value}</p>
    </div>
  )
}

export default function CustomerDetailPage() {
  const { customerId = '' } = useParams()
  const navigate = useNavigate()
  const { data: customer, isLoading } = useGetCustomerQuery(customerId)
  const { data: orders = [], isLoading: ordersLoading } = useGetCustomerOrdersQuery(customerId)
  const { data: trustCfg } = useGetTrustConfigQuery()
  const [ban, { isLoading: banning }] = useBanCustomerMutation()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [del, { isLoading: deleting }] = useDeleteCustomerMutation()

  if (isLoading) return <Spinner label="Loading customer…" className="py-24" />
  if (!customer)
    return (
      <Card className="p-10 text-center">
        <p className="text-slate-500">Customer not found.</p>
        <Button variant="outline" className="mx-auto mt-4" onClick={() => navigate(ROUTES.customers)}>
          Back to customers
        </Button>
      </Card>
    )

  const avgOrder = customer.totalOrders ? Math.round(customer.totalSpent / customer.totalOrders) : 0
  const trustBadge = deriveTrustBadge(customer, trustCfg)

  const handleDelete = async () => {
    await del(customer.id).unwrap()
    navigate(ROUTES.customers, { replace: true })
  }

  return (
    <>
      <PageHeader
        title={customer.name}
        breadcrumbs={[{ label: 'Customers', to: ROUTES.customers }, { label: customer.name }]}
        actions={
          <>
            <Button
              variant={customer.banned ? 'secondary' : 'outline'}
              loading={banning}
              leftIcon={customer.banned ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
              onClick={() => ban(customer.id)}
            >
              {customer.banned ? 'Unban' : 'Ban'}
            </Button>
            <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDelete(true)}>
              Remove
            </Button>
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(ROUTES.customers)}>
              Back
            </Button>
          </>
        }
      />

      {customer.banned && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          <Ban className="h-4 w-4" /> This customer is banned and cannot place orders.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Profile */}
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <Avatar name={customer.name} size="lg" />
                <div className="min-w-0">
                  <p className="font-bold text-slate-800">{customer.name}</p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <Badge>{customer.zone}</Badge>
                    {customer.tier === 'vip' && <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/15">⭐ VIP · Free delivery</Badge>}
                    {customer.tier === 'loyal' && <Badge tone="bg-brand-50 text-brand-700 ring-brand-600/15">Loyal</Badge>}
                  </div>
                </div>
              </div>
              <div className="mt-4 space-y-2.5 text-sm">
                <p className="flex items-center gap-2 text-slate-600"><Phone className="h-4 w-4 text-slate-400" /> {customer.phone}</p>
                <p className="flex items-start gap-2 text-slate-600"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" /> {customer.address}</p>
                <p className="flex items-center gap-2 text-slate-600"><Calendar className="h-4 w-4 text-slate-400" /> Joined {formatDateTime(customer.joinedAt)}</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4 text-center">
              <Receipt className="mx-auto h-5 w-5 text-brand-500" />
              <p className="mt-1.5 text-lg font-extrabold text-slate-800">{customer.totalOrders}</p>
              <p className="text-[11px] text-slate-400">Orders</p>
            </Card>
            <Card className="p-4 text-center">
              <Wallet className="mx-auto h-5 w-5 text-brand-500" />
              <p className="mt-1.5 text-sm font-extrabold text-slate-800">{formatNPR(customer.totalSpent)}</p>
              <p className="text-[11px] text-slate-400">Lifetime</p>
            </Card>
            <Card className="p-4 text-center">
              <Receipt className="mx-auto h-5 w-5 text-brand-500" />
              <p className="mt-1.5 text-sm font-extrabold text-slate-800">{formatNPR(avgOrder)}</p>
              <p className="text-[11px] text-slate-400">Avg order</p>
            </Card>
          </div>

          {/* Trust */}
          <Card>
            <CardHeader title="Trust" action={<CustomerTrustBadge badge={trustBadge} />} />
            <CardContent className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-extrabold text-slate-800">{customer.codCancellations}</p>
                  <p className="text-[11px] text-slate-400">COD cancels</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-slate-800">{customer.notRespondingCount}</p>
                  <p className="text-[11px] text-slate-400">No-response</p>
                </div>
                <div>
                  <p className="text-lg font-extrabold text-slate-800">{customer.completedOrders}</p>
                  <p className="text-[11px] text-slate-400">Completed</p>
                </div>
              </div>
              {trustBadge !== 'green' && trustCfg?.enabled && (
                <p className="rounded-xl bg-amber-50 px-3 py-2.5 text-xs font-medium text-amber-700">
                  COD restriction: {COD_MODE_LABEL[trustCfg.codMode]}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Referral & wallet */}
          <Card>
            <CardHeader title="Referral & Wallet" />
            <CardContent className="space-y-3 pt-2">
              <div className="flex items-center justify-between rounded-xl bg-mint-50 px-3 py-2.5">
                <span className="text-sm text-slate-500">Referral code</span>
                <span className="font-mono font-bold text-brand-700">{customer.referralCode}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <Stat label="Friends referred" value={String(customer.referredCount)} />
                <Stat label="Wallet balance" value={formatNPR(customer.walletBalance)} />
                <Stat label="Credits earned" value={formatNPR(customer.creditsEarned)} />
                <Stat label="Credits redeemed" value={formatNPR(customer.creditsRedeemed)} />
              </div>
            </CardContent>
          </Card>

          <CreditCard customer={customer} orders={orders} />
        </div>

        {/* Order history */}
        <Card className="lg:col-span-2">
          <CardHeader title="Recent orders" subtitle={`Lifetime: ${customer.totalOrders} orders`} />
          <CardContent className="pt-2">
            {ordersLoading ? (
              <Spinner label="Loading orders…" className="py-10" />
            ) : orders.length === 0 ? (
              <EmptyState title="No orders yet" description="This customer hasn't placed any orders." />
            ) : (
              <div className="divide-y divide-slate-50">
                {orders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => navigate(ROUTES.orderDetail(o.id))}
                    className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-mint-50"
                  >
                    <div className="flex -space-x-3">
                      {o.items.slice(0, 3).map((it) => (
                        <ProductThumb key={it.productId} src={it.image} alt={it.name} size="sm" className="ring-2 ring-white" />
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">{o.reference}</p>
                      <p className="truncate text-xs text-slate-400">
                        {o.items.length} items · {timeAgo(o.placedAt)}
                      </p>
                    </div>
                    <div className="hidden sm:block">
                      <PaymentBadge method={o.paymentMethod} status={o.paymentStatus} />
                    </div>
                    <span className="text-sm font-bold text-slate-800">{formatNPR(o.grandTotal)}</span>
                    <OrderStatusBadge status={o.status} />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Remove customer?"
        description={`"${customer.name}" and their account will be permanently removed.`}
        confirmLabel="Remove customer"
      />
    </>
  )
}

/** Customer Credit management — add wallet credit with reason + full audit trail. */
function CreditCard({ customer, orders }: { customer: Customer; orders: Order[] }) {
  const { user } = useAuth()
  const [addCredit, { isLoading }] = useAddCustomerCreditMutation()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<CreditType>('compensation')
  const [reason, setReason] = useState('')
  const [orderId, setOrderId] = useState('')
  const [note, setNote] = useState('')

  const amt = Number(amount) || 0
  const valid = amt > 0 && reason.trim()

  const submit = async () => {
    await addCredit({
      customerId: customer.id,
      amount: amt,
      type,
      reason: reason.trim(),
      orderId: orderId || undefined,
      note: note.trim() || undefined,
      adminName: user?.name ?? 'Admin',
    }).unwrap()
    setOpen(false)
    setAmount('')
    setType('compensation')
    setReason('')
    setOrderId('')
    setNote('')
  }

  const history = [...customer.credits].sort((a, b) => Date.parse(b.at) - Date.parse(a.at))

  return (
    <Card>
      <CardHeader
        title="Customer credit"
        subtitle="Manual wallet credits"
        action={
          <Button size="sm" variant="outline" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setOpen(true)}>
            Add credit
          </Button>
        }
      />
      <CardContent className="pt-2">
        {history.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <HandCoins className="h-4 w-4" /> No credits issued yet.
          </p>
        ) : (
          <ol className="space-y-2.5">
            {history.map((c) => (
              <li key={c.id} className="flex gap-2.5">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-green-400" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-slate-800">{CREDIT_TYPE_META[c.type]}</p>
                    <span className="text-sm font-bold text-success">+{formatNPR(c.amount)}</span>
                  </div>
                  <p className="text-xs text-slate-500">{c.reason}{c.orderId ? ` · ${c.orderId}` : ''}</p>
                  {c.note && <p className="text-xs text-slate-500">{c.note}</p>}
                  <p className="text-xs text-slate-400">{c.adminName} · {formatDateTime(c.at)}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add customer credit"
        description={customer.name}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit} loading={isLoading} disabled={!valid}>Add credit</Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input label="Credit amount (NPR)" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} autoFocus />
          <Select
            label="Credit type"
            value={type}
            onChange={(e) => setType(e.target.value as CreditType)}
            options={(Object.keys(CREDIT_TYPE_META) as CreditType[]).map((k) => ({ label: CREDIT_TYPE_META[k], value: k }))}
          />
          <Input label="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Refund for damaged item" />
          <Select
            label="Related order (optional)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="None"
            options={orders.map((o) => ({ label: `${o.reference} · ${formatNPR(o.grandTotal)}`, value: o.reference }))}
          />
          <Textarea label="Notes / comments (optional)" value={note} onChange={(e) => setNote(e.target.value)} rows={2} />
        </div>
      </Modal>
    </Card>
  )
}
