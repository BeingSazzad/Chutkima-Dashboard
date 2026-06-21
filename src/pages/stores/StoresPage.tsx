import { useState } from 'react'
import { Bike, Clock, MapPin, Pencil, Plus, Store, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { StatCard } from '@/components/shared/StatCard'
import { cn, formatNPR } from '@/lib/utils'
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

      {isLoading ? (
        <Spinner label="Loading stores…" className="py-24" />
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {stores.map((s) => {
            const stat = overview.find((o) => o.store.id === s.id)
            return (
              <Card key={s.id} className={cn(!s.active && 'opacity-60')}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
                        <Store className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{s.name}</p>
                        <p className="flex items-center gap-1 text-xs text-slate-400"><MapPin className="h-3 w-3" /> {s.address}</p>
                      </div>
                    </div>
                    {!s.active && <Badge>Paused</Badge>}
                  </div>

                  <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {s.openTime}–{s.closeTime}</span>
                    <span className="flex items-center gap-1"><Bike className="h-3 w-3" /> {stat?.ridersOnline ?? 0} riders online</span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
                    <div>
                      <p className="text-base font-extrabold text-slate-800">{stat?.orders ?? 0}</p>
                      <p className="text-[11px] text-slate-400">Orders</p>
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-slate-800">{formatNPR(stat?.revenue ?? 0)}</p>
                      <p className="text-[11px] text-slate-400">Revenue</p>
                    </div>
                    <div>
                      <p className="text-base font-extrabold text-amber-600">{stat?.pending ?? 0}</p>
                      <p className="text-[11px] text-slate-400">Pending</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    <Switch checked={s.active} onChange={() => toggle(s.id)} aria-label={`Toggle ${s.name}`} />
                    <span className="text-xs text-slate-500">{s.active ? 'Active' : 'Paused'}</span>
                    <div className="ml-auto flex gap-0.5">
                      <button onClick={() => setFormFor(s)} className="focus-ring rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button onClick={() => setDeleteFor(s)} className="focus-ring rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Delete">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

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
