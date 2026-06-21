import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ban, Download, Phone, Search, ShieldCheck, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Avatar } from '@/components/shared/Avatar'
import { CustomerTrustBadge } from '@/components/shared/StatusBadge'
import { downloadCSV } from '@/lib/export'
import { formatDateTime, formatNPR, timeAgo } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { useDebounce } from '@/hooks/useDebounce'
import {
  useBanCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomersQuery,
} from '@/services/endpoints/customersApi'
import type { Customer } from '@/types/common.types'

export default function CustomersPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)
  const { data: customers = [], isLoading } = useGetCustomersQuery({ search: debounced || undefined })
  const [ban] = useBanCustomerMutation()
  const [deleteFor, setDeleteFor] = useState<Customer | null>(null)

  const columns: Column<Customer>[] = [
    {
      key: 'name',
      header: 'Customer',
      cell: (c) => (
        <div className="flex items-center gap-3">
          <Avatar name={c.name} />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold text-slate-800">{c.name}</p>
              {c.banned && <Badge tone="bg-red-50 text-red-700 ring-red-600/15">Banned</Badge>}
            </div>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Phone className="h-3 w-3" /> {c.phone}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'zone', header: 'Zone', cell: (c) => <Badge>{c.zone}</Badge> },
    { key: 'orders', header: 'Orders', cell: (c) => <span className="font-semibold text-slate-700">{c.totalOrders}</span> },
    { key: 'spent', header: 'Lifetime spend', cell: (c) => <span className="font-bold text-slate-800">{formatNPR(c.totalSpent)}</span> },
    { key: 'last', header: 'Last order', cell: (c) => <span className="text-slate-500">{timeAgo(c.lastOrderAt)}</span> },
    { key: 'trust', header: 'Trust', cell: (c) => <CustomerTrustBadge badge={c.trustBadge} /> },
    {
      key: 'tier',
      header: 'Tier',
      cell: (c) =>
        c.totalSpent > 25000 ? (
          <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/15">⭐ VIP</Badge>
        ) : c.totalOrders > 15 ? (
          <Badge tone="bg-brand-50 text-brand-700 ring-brand-600/15">Loyal</Badge>
        ) : (
          <Badge>New</Badge>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (c) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => ban(c.id)}
            className={
              c.banned
                ? 'focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-green-50 hover:text-success'
                : 'focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600'
            }
            aria-label={c.banned ? 'Unban' : 'Ban'}
            title={c.banned ? 'Unban customer' : 'Ban customer'}
          >
            {c.banned ? <ShieldCheck className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          </button>
          <button onClick={() => setDeleteFor(c)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Remove" title="Remove customer">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  const exportCsv = () => {
    downloadCSV(
      'chutkima-customers.csv',
      customers.map((c) => ({
        name: c.name,
        phone: c.phone,
        zone: c.zone,
        address: c.address,
        orders: c.totalOrders,
        lifetimeSpend: c.totalSpent,
        status: c.banned ? 'Banned' : 'Active',
        joined: formatDateTime(c.joinedAt),
        lastOrder: formatDateTime(c.lastOrderAt),
      })),
      [
        { key: 'name', label: 'Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'zone', label: 'Zone' },
        { key: 'address', label: 'Address' },
        { key: 'orders', label: 'Orders' },
        { key: 'lifetimeSpend', label: 'Lifetime Spend (NPR)' },
        { key: 'status', label: 'Status' },
        { key: 'joined', label: 'Joined' },
        { key: 'lastOrder', label: 'Last Order' },
      ],
    )
  }

  return (
    <>
      <PageHeader
        title="Customers"
        description="Everyone ordering from your Butwal store. Click a row for full history."
        actions={
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={customers.length === 0}>
            Export CSV
          </Button>
        }
      />

      <Card>
        <div className="p-4">
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search customers…"
              className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm"
            />
          </div>
        </div>
        <DataTable
          columns={columns}
          data={customers}
          rowKey={(c) => c.id}
          onRowClick={(c) => navigate(ROUTES.customerDetail(c.id))}
          loading={isLoading}
          emptyTitle="No customers found"
        />
      </Card>

      <DeleteCustomer customer={deleteFor} onClose={() => setDeleteFor(null)} />
    </>
  )
}

function DeleteCustomer({ customer, onClose }: { customer: Customer | null; onClose: () => void }) {
  const [del, { isLoading }] = useDeleteCustomerMutation()
  const confirm = async () => {
    if (!customer) return
    await del(customer.id).unwrap()
    onClose()
  }
  return (
    <ConfirmDialog
      open={!!customer}
      onClose={onClose}
      onConfirm={confirm}
      loading={isLoading}
      title="Remove customer?"
      description={customer ? `"${customer.name}" and their account will be permanently removed.` : undefined}
      confirmLabel="Remove customer"
    />
  )
}
