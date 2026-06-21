import { useState } from 'react'
import { Clock, Pencil, Plus, Store, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatCard } from '@/components/shared/StatCard'
import { formatNPR } from '@/lib/utils'
import {
  useDeleteStoreMutation,
  useGetStoreOverviewQuery,
  useGetStoresQuery,
  useSaveStoreMutation,
  useToggleStoreMutation,
} from '@/services/endpoints/storesApi'
import type { DarkStore } from '@/types/common.types'

export default function StoresPage() {
  const { data: stores = [], isLoading } = useGetStoresQuery()
  const { data: overview = [] } = useGetStoreOverviewQuery()
  const [toggle] = useToggleStoreMutation()
  const [formFor, setFormFor] = useState<DarkStore | 'new' | null>(null)
  const [deleteFor, setDeleteFor] = useState<DarkStore | null>(null)

  const totals = overview.reduce(
    (acc, o) => ({ orders: acc.orders + o.orders, revenue: acc.revenue + o.revenue, pending: acc.pending + o.pending }),
    { orders: 0, revenue: 0, pending: 0 },
  )
  const statFor = (id: string) => overview.find((o) => o.store.id === id)

  const columns: Column<DarkStore>[] = [
    {
      key: 'store',
      header: 'Store',
      cell: (s) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
            <Store className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800">{s.name}</p>
            <p className="truncate text-xs text-slate-400">{s.address}</p>
          </div>
        </div>
      ),
    },
    { key: 'hours', header: 'Hours', cell: (s) => <span className="text-slate-600">{s.openTime}–{s.closeTime}</span> },
    { key: 'orders', header: 'Orders', cell: (s) => <span className="font-semibold text-slate-700">{statFor(s.id)?.orders ?? 0}</span> },
    { key: 'revenue', header: 'Revenue', cell: (s) => <span className="font-semibold text-slate-800">{formatNPR(statFor(s.id)?.revenue ?? 0)}</span> },
    {
      key: 'pending',
      header: 'Pending',
      cell: (s) => {
        const n = statFor(s.id)?.pending ?? 0
        return n > 0 ? <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/15">{n}</Badge> : <span className="text-xs text-slate-400">0</span>
      },
    },
    { key: 'active', header: 'Active', cell: (s) => <Switch checked={s.active} onChange={() => toggle(s.id)} size="sm" aria-label={`Toggle ${s.name}`} /> },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (s) => (
        <div className="flex items-center justify-end gap-0.5">
          <button onClick={() => setFormFor(s)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteFor(s)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Dark Stores"
        description="Master view of every fulfilment hub. Create stores and manage them without a developer."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormFor('new')}>
            Add dark store
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Total orders (all stores)" value={totals.orders} icon={<Store className="h-5 w-5" />} />
        <StatCard label="Revenue (all stores)" value={formatNPR(totals.revenue)} icon={<Store className="h-5 w-5" />} iconClass="bg-green-50 text-green-600" />
        <StatCard label="Pending now" value={totals.pending} icon={<Clock className="h-5 w-5" />} iconClass="bg-amber-50 text-amber-600" />
      </div>

      <Card className="mt-4">
        <DataTable columns={columns} data={stores} rowKey={(s) => s.id} loading={isLoading} emptyTitle="No dark stores yet" />
      </Card>

      <StoreFormModal store={formFor} onClose={() => setFormFor(null)} />
      <DeleteStore store={deleteFor} onClose={() => setDeleteFor(null)} />
    </>
  )
}

function StoreFormModal({ store, onClose }: { store: DarkStore | 'new' | null; onClose: () => void }) {
  const [save, { isLoading }] = useSaveStoreMutation()
  const isEdit = store && store !== 'new'
  const s = isEdit ? (store as DarkStore) : null

  const empty = { name: '', address: '', phone: '', whatsapp: '', openTime: '7:00 AM', closeTime: '11:00 PM' }
  const [form, setForm] = useState(empty)
  const key = store === 'new' ? 'new' : s?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && store) {
    setLastKey(key)
    setForm(s ? { name: s.name, address: s.address, phone: s.phone, whatsapp: s.whatsapp, openTime: s.openTime, closeTime: s.closeTime } : empty)
  }
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    await save({ id: s?.id, ...form }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!store}
      onClose={onClose}
      title={isEdit ? 'Edit dark store' : 'Add dark store'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!form.name.trim()}>
            {isEdit ? 'Save changes' : 'Create store'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Store name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Traffic Chowk Hub" autoFocus />
        <Input label="Address" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Area, Butwal" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <Input label="WhatsApp" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} />
          <Input label="Open time" value={form.openTime} onChange={(e) => set('openTime', e.target.value)} />
          <Input label="Close time" value={form.closeTime} onChange={(e) => set('closeTime', e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

function DeleteStore({ store, onClose }: { store: DarkStore | null; onClose: () => void }) {
  const [del, { isLoading }] = useDeleteStoreMutation()
  const confirm = async () => {
    if (!store) return
    await del(store.id).unwrap()
    onClose()
  }
  return (
    <ConfirmDialog
      open={!!store}
      onClose={onClose}
      onConfirm={confirm}
      loading={isLoading}
      title="Delete dark store?"
      description={store ? `"${store.name}" will be removed. Reassign its orders and staff first.` : undefined}
      confirmLabel="Delete store"
    />
  )
}
