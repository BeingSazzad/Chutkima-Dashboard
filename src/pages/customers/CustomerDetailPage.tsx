import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Ban, Calendar, MapPin, Phone, Receipt, ShieldCheck, Trash2, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Avatar } from '@/components/shared/Avatar'
import { ProductThumb } from '@/components/shared/ProductThumb'
import { CustomerTrustBadge, OrderStatusBadge, PaymentBadge } from '@/components/shared/StatusBadge'
import { COD_MODE_LABEL, deriveTrustBadge } from '@/lib/trust'
import { useGetTrustConfigQuery } from '@/services/endpoints/settingsApi'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateTime, formatNPR, timeAgo } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import {
  useBanCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomerOrdersQuery,
  useGetCustomerQuery,
} from '@/services/endpoints/customersApi'

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
            <Button variant="outline" leftIcon={<ArrowLeft className="h-4 w-4" />} onClick={() => navigate(ROUTES.customers)}>
              Back
            </Button>
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
                  <Badge className="mt-0.5">{customer.zone}</Badge>
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
