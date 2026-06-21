import { useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Switch } from '@/components/ui/Switch'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatNPR } from '@/lib/utils'
import {
  useDeleteCouponMutation,
  useGetCouponsQuery,
  useSaveCouponMutation,
  useToggleCouponMutation,
} from '@/services/endpoints/couponsApi'
import type { Coupon, CouponType } from '@/types/common.types'

const TYPE_LABEL: Record<CouponType, string> = {
  percent: 'Percent off',
  flat: 'Flat amount',
  free_delivery: 'Free delivery',
}

function discountText(c: Coupon): string {
  if (c.type === 'free_delivery') return 'Free delivery'
  if (c.type === 'percent') return `${c.value}% off${c.maxDiscount ? ` (max ${formatNPR(c.maxDiscount)})` : ''}`
  return `${formatNPR(c.value)} off`
}

function isExpired(c: Coupon) {
  return new Date(c.validUntil).getTime() < Date.now()
}

export default function CouponsPage() {
  const { data: coupons = [], isLoading } = useGetCouponsQuery()
  const [toggle] = useToggleCouponMutation()
  const [formFor, setFormFor] = useState<Coupon | 'new' | null>(null)
  const [deleteFor, setDeleteFor] = useState<Coupon | null>(null)

  const columns: Column<Coupon>[] = [
    {
      key: 'code',
      header: 'Code',
      cell: (c) => (
        <div>
          <span className="rounded-md bg-slate-900 px-2 py-1 font-mono text-xs font-bold text-white">{c.code}</span>
          <p className="mt-1 text-xs text-slate-400">{c.description}</p>
        </div>
      ),
    },
    { key: 'discount', header: 'Discount', cell: (c) => <span className="font-semibold text-slate-700">{discountText(c)}</span> },
    { key: 'min', header: 'Min order', cell: (c) => <span className="text-slate-600">{c.minOrder ? formatNPR(c.minOrder) : '—'}</span> },
    {
      key: 'usage',
      header: 'Usage',
      cell: (c) => (
        <div className="w-28">
          <div className="flex justify-between text-xs text-slate-500">
            <span>{c.used}</span>
            <span>{c.usageLimit}</span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-brand-500" style={{ width: `${Math.min(100, (c.used / c.usageLimit) * 100)}%` }} />
          </div>
        </div>
      ),
    },
    {
      key: 'valid',
      header: 'Validity',
      cell: (c) =>
        isExpired(c) ? (
          <Badge tone="bg-red-50 text-red-700 ring-red-600/15">Expired</Badge>
        ) : (
          <span className="text-slate-600">till {new Date(c.validUntil).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
        ),
    },
    {
      key: 'active',
      header: 'Active',
      cell: (c) => <Switch checked={c.active} onChange={() => toggle(c.id)} size="sm" aria-label={`Toggle ${c.code}`} />,
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (c) => (
        <div className="flex items-center justify-end gap-0.5">
          <button onClick={() => setFormFor(c)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteFor(c)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Coupons"
        description="Promo codes customers enter at checkout."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormFor('new')}>
            Create coupon
          </Button>
        }
      />

      <Card>
        <DataTable columns={columns} data={coupons} rowKey={(c) => c.id} loading={isLoading} emptyTitle="No coupons yet" emptyDescription="Create your first promo code." />
      </Card>

      <CouponFormModal coupon={formFor} onClose={() => setFormFor(null)} />
      <DeleteCoupon coupon={deleteFor} onClose={() => setDeleteFor(null)} />
    </>
  )
}

function CouponFormModal({ coupon, onClose }: { coupon: Coupon | 'new' | null; onClose: () => void }) {
  const [save, { isLoading }] = useSaveCouponMutation()
  const isEdit = coupon && coupon !== 'new'
  const c = isEdit ? (coupon as Coupon) : null

  const empty = { code: '', description: '', type: 'percent' as CouponType, value: '', minOrder: '', maxDiscount: '', usageLimit: '1000', validUntil: '' }
  const [form, setForm] = useState(empty)
  const key = coupon === 'new' ? 'new' : c?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && coupon) {
    setLastKey(key)
    setForm(
      c
        ? {
            code: c.code,
            description: c.description,
            type: c.type,
            value: String(c.value),
            minOrder: String(c.minOrder),
            maxDiscount: String(c.maxDiscount),
            usageLimit: String(c.usageLimit),
            validUntil: c.validUntil.slice(0, 10),
          }
        : empty,
    )
  }
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    await save({
      id: c?.id,
      code: form.code.toUpperCase(),
      description: form.description,
      type: form.type,
      value: Number(form.value) || 0,
      minOrder: Number(form.minOrder) || 0,
      maxDiscount: Number(form.maxDiscount) || 0,
      usageLimit: Number(form.usageLimit) || 1000,
      validUntil: form.validUntil ? new Date(form.validUntil).toISOString() : undefined,
    }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!coupon}
      onClose={onClose}
      title={isEdit ? 'Edit coupon' : 'Create coupon'}
      description={isEdit ? c?.code : 'Set up a new promo code.'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!form.code.trim()}>
            {isEdit ? 'Save changes' : 'Create coupon'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Code" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} placeholder="WELCOME50" className="font-mono uppercase" autoFocus />
          <Select label="Type" value={form.type} onChange={(e) => set('type', e.target.value)} options={(Object.keys(TYPE_LABEL) as CouponType[]).map((t) => ({ label: TYPE_LABEL[t], value: t }))} />
        </div>
        <Input label="Description" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="50% off your first order" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {form.type !== 'free_delivery' && (
            <Input label={form.type === 'percent' ? 'Percent (%)' : 'Amount (NPR)'} type="number" value={form.value} onChange={(e) => set('value', e.target.value)} />
          )}
          <Input label="Min order" type="number" value={form.minOrder} onChange={(e) => set('minOrder', e.target.value)} />
          {form.type === 'percent' && <Input label="Max discount" type="number" value={form.maxDiscount} onChange={(e) => set('maxDiscount', e.target.value)} />}
          <Input label="Usage limit" type="number" value={form.usageLimit} onChange={(e) => set('usageLimit', e.target.value)} />
        </div>
        <Input label="Valid until" type="date" value={form.validUntil} onChange={(e) => set('validUntil', e.target.value)} />
      </div>
    </Modal>
  )
}

function DeleteCoupon({ coupon, onClose }: { coupon: Coupon | null; onClose: () => void }) {
  const [del, { isLoading }] = useDeleteCouponMutation()
  const confirm = async () => {
    if (!coupon) return
    await del(coupon.id).unwrap()
    onClose()
  }
  return (
    <ConfirmDialog
      open={!!coupon}
      onClose={onClose}
      onConfirm={confirm}
      loading={isLoading}
      title="Delete coupon?"
      description={coupon ? `Code "${coupon.code}" will stop working immediately.` : undefined}
      confirmLabel="Delete coupon"
    />
  )
}
