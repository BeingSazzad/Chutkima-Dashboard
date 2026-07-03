import { useMemo, useState } from 'react'
import { Mail, Pencil, Phone, Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { SearchableMultiSelect } from '@/components/ui/SearchableMultiSelect'
import { useGetCategoriesQuery } from '@/services/endpoints/categoriesApi'
import { useAuth } from '@/hooks/useAuth'
import { useGetProductsQuery } from '@/services/endpoints/productsApi'
import {
  useCreateSupplierReturnMutation,
  useDeleteSupplierMutation,
  useGetSuppliersQuery,
  useGetSupplierReturnsQuery,
  useSaveSupplierMutation,
  useToggleSupplierMutation,
} from '@/services/endpoints/suppliersApi'
import type { Product, ReturnReason, Supplier, SupplierReturn } from '@/types/common.types'

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

const REASONS: { label: string; value: ReturnReason; tone: string }[] = [
  { label: 'Expired', value: 'expired', tone: 'bg-amber-50 text-amber-700 ring-amber-600/15' },
  { label: 'Slow-moving', value: 'slow_moving', tone: 'bg-sky-50 text-sky-700 ring-sky-600/15' },
  { label: 'Damaged', value: 'damaged', tone: 'bg-red-50 text-red-700 ring-red-600/15' },
]
const reasonMeta = (r: ReturnReason) => REASONS.find((x) => x.value === r) ?? REASONS[0]

export default function SuppliersPage() {
  const [tab, setTab] = useState('suppliers')
  const [formFor, setFormFor] = useState<Supplier | 'new' | null>(null)
  const [deleteFor, setDeleteFor] = useState<Supplier | null>(null)
  const [returnOpen, setReturnOpen] = useState(false)

  const { data: suppliers = [] } = useGetSuppliersQuery()
  const { data: returns = [] } = useGetSupplierReturnsQuery()

  return (
    <>
      <PageHeader
        title="Suppliers"
        description="Manage vendors you buy stock from, and return expired, slow-moving or damaged goods."
        actions={
          <>
            <Button variant="outline" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={() => setReturnOpen(true)}>
              Return to supplier
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormFor('new')}>
              Add supplier
            </Button>
          </>
        }
      />

      <div className="mb-4">
        <Tabs
          items={[
            { label: 'Suppliers', value: 'suppliers', count: suppliers.length },
            { label: 'Returns to supplier', value: 'returns', count: returns.length },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'suppliers' ? (
        <SuppliersTab suppliers={suppliers} onEdit={setFormFor} onDelete={setDeleteFor} />
      ) : (
        <ReturnsTab returns={returns} onNew={() => setReturnOpen(true)} />
      )}

      <SupplierFormModal supplier={formFor} onClose={() => setFormFor(null)} />
      <DeleteSupplier supplier={deleteFor} onClose={() => setDeleteFor(null)} />
      <ReturnModal open={returnOpen} onClose={() => setReturnOpen(false)} suppliers={suppliers} />
    </>
  )
}

// ── Suppliers tab ───────────────────────────────────────────────────────────
function SuppliersTab({
  suppliers,
  onEdit,
  onDelete,
}: {
  suppliers: Supplier[]
  onEdit: (s: Supplier) => void
  onDelete: (s: Supplier) => void
}) {
  const { isLoading } = useGetSuppliersQuery()
  const [toggle] = useToggleSupplierMutation()
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return suppliers
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q),
    )
  }, [suppliers, search])

  const columns: Column<Supplier>[] = [
    {
      key: 'supplier',
      header: 'Supplier',
      cell: (s) => (
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-slate-800">{s.name}</p>
            <Badge tone="bg-brand-50 text-brand-700 ring-brand-600/15">{s.code}</Badge>
            {!s.active && <Badge tone="bg-slate-100 text-slate-500 ring-slate-500/15">Inactive</Badge>}
          </div>
          {s.contactPerson && <p className="text-xs text-slate-400">Contact: {s.contactPerson}</p>}
        </div>
      ),
    },
    {
      key: 'contact',
      header: 'Contact',
      cell: (s) => (
        <div className="space-y-0.5 text-sm">
          {s.phone && (
            <p className="flex items-center gap-1.5 text-slate-600">
              <Phone className="h-3.5 w-3.5 text-slate-400" /> {s.phone}
            </p>
          )}
          {s.email && (
            <p className="flex items-center gap-1.5 text-slate-500">
              <Mail className="h-3.5 w-3.5 text-slate-400" /> {s.email}
            </p>
          )}
        </div>
      ),
    },
    { key: 'pan', header: 'PAN / VAT', cell: (s) => <span className="font-mono text-sm text-slate-600">{s.panNo || '—'}</span> },
    {
      key: 'supplies',
      header: 'Supplies',
      cell: (s) => <span className="line-clamp-2 max-w-[16rem] text-sm text-slate-600">{s.productsSupplied || '—'}</span>,
    },
    { key: 'active', header: 'Active', cell: (s) => <Switch checked={s.active} onChange={() => toggle(s.id)} size="sm" aria-label={`Toggle ${s.name}`} /> },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (s) => (
        <div className="flex items-center justify-end gap-0.5">
          <button onClick={() => onEdit(s)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete(s)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <Card className="mb-4">
        <div className="p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, code, contact or phone…"
              className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm"
            />
          </div>
        </div>
      </Card>
      <Card>
        <DataTable
          columns={columns}
          data={filtered}
          rowKey={(s) => s.id}
          loading={isLoading}
          emptyTitle="No suppliers yet"
          emptyDescription="Add a supplier with their full company details to start tracking stock sources."
        />
      </Card>
    </>
  )
}

// ── Returns tab ─────────────────────────────────────────────────────────────
function ReturnsTab({ returns, onNew }: { returns: SupplierReturn[]; onNew: () => void }) {
  const { isLoading } = useGetSupplierReturnsQuery()

  const columns: Column<SupplierReturn>[] = [
    {
      key: 'ref',
      header: 'Return',
      cell: (r) => (
        <div>
          <p className="font-mono font-semibold text-slate-800">{r.reference}</p>
          <p className="text-xs text-slate-400">{fmtDate(r.createdAt)}</p>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product',
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-700">{r.productName}</p>
          <p className="font-mono text-xs text-slate-400">{r.sku}</p>
        </div>
      ),
    },
    { key: 'supplier', header: 'Supplier', cell: (r) => <span className="text-slate-600">{r.supplierName}</span> },
    { key: 'qty', header: 'Qty', cell: (r) => <span className="font-semibold text-slate-800">{r.quantity}</span> },
    {
      key: 'reason',
      header: 'Reason',
      cell: (r) => {
        const m = reasonMeta(r.reason)
        return <Badge tone={m.tone}>{m.label}</Badge>
      },
    },
    { key: 'by', header: 'By', cell: (r) => <span className="text-sm text-slate-500">{r.adminName}</span> },
  ]

  return (
    <Card>
      <div className="flex justify-end p-4 pb-0">
        <Button variant="outline" size="sm" leftIcon={<RotateCcw className="h-4 w-4" />} onClick={onNew}>
          New return
        </Button>
      </div>
      <DataTable
        columns={columns}
        data={returns}
        rowKey={(r) => r.id}
        loading={isLoading}
        emptyTitle="No returns yet"
        emptyDescription="Return expired, slow-moving or damaged stock to a supplier — inventory updates automatically."
      />
    </Card>
  )
}

// ── Supplier create / edit ──────────────────────────────────────────────────
function SupplierFormModal({ supplier, onClose }: { supplier: Supplier | 'new' | null; onClose: () => void }) {
  const [save, { isLoading }] = useSaveSupplierMutation()
  const { data: categories = [] } = useGetCategoriesQuery()
  const isEdit = supplier && supplier !== 'new'
  const s = isEdit ? (supplier as Supplier) : null

  const empty = { code: '', name: '', contactPerson: '', phone: '', email: '', address: '', panNo: '', productsSupplied: '', notes: '' }
  const [form, setForm] = useState(empty)

  const key = supplier === 'new' ? 'new' : s?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && supplier) {
    setLastKey(key)
    setForm(
      s
        ? { code: s.code, name: s.name, contactPerson: s.contactPerson, phone: s.phone, email: s.email, address: s.address, panNo: s.panNo, productsSupplied: s.productsSupplied, notes: s.notes }
        : empty,
    )
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    await save({ id: s?.id, ...form }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!supplier}
      onClose={onClose}
      title={isEdit ? 'Edit supplier' : 'Add supplier'}
      description={isEdit ? s?.name : 'Create a supplier with their full company details.'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!form.name.trim()}>
            {isEdit ? 'Save changes' : 'Add supplier'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Company / supplier name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Chaudhary Group Distribution" autoFocus />
          <Input label="Supplier code" value={form.code} onChange={(e) => set('code', e.target.value)} placeholder="Auto — e.g. SUP-005" className="font-mono" hint="Leave blank to auto-generate." />
          <Input label="Contact person" value={form.contactPerson} onChange={(e) => set('contactPerson', e.target.value)} placeholder="e.g. Rajan Chaudhary" />
          <Input label="PAN / VAT number" value={form.panNo} onChange={(e) => set('panNo', e.target.value)} placeholder="e.g. 301245678" className="font-mono" />
          <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+977 98…" />
          <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="orders@company.com.np" />
        </div>
        <Input label="Address" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="e.g. Butwal Industrial Area" />
        <SearchableMultiSelect
          label="Products / goods supplied"
          placeholder="Select category(ies) supplied"
          options={categories.map((c) => ({ label: c.name, value: c.name }))}
          selectedValues={form.productsSupplied.split(',').map((x) => x.trim()).filter(Boolean)}
          onChange={(vals) => set('productsSupplied', vals.join(', '))}
        />
        <Textarea
          label="Notes"
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={2}
          placeholder="Delivery schedule, credit terms, anything to remember…"
          hint="Optional — internal only."
        />
      </div>
    </Modal>
  )
}

function DeleteSupplier({ supplier, onClose }: { supplier: Supplier | null; onClose: () => void }) {
  const [del, { isLoading }] = useDeleteSupplierMutation()
  const confirm = async () => {
    if (!supplier) return
    await del(supplier.id).unwrap()
    onClose()
  }
  return (
    <ConfirmDialog
      open={!!supplier}
      onClose={onClose}
      onConfirm={confirm}
      loading={isLoading}
      title="Delete supplier?"
      description={supplier ? `"${supplier.name}" will be removed. Products linked to it will be left without a supplier.` : undefined}
      confirmLabel="Delete supplier"
    />
  )
}

// ── Return to supplier ──────────────────────────────────────────────────────
function ReturnModal({ open, onClose, suppliers }: { open: boolean; onClose: () => void; suppliers: Supplier[] }) {
  const { user } = useAuth()
  const { data: products = [] } = useGetProductsQuery()
  const [create, { isLoading }] = useCreateSupplierReturnMutation()

  const [productId, setProductId] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState<ReturnReason | ''>('')
  const [comments, setComments] = useState('')

  // Reset every time the modal opens.
  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setProductId('')
      setSupplierId('')
      setQuantity('')
      setReason('')
      setComments('')
    }
  }

  const product = products.find((p: Product) => p.id === productId)
  const maxQty = product?.stock ?? 0
  const qtyNum = Math.max(0, Math.min(Number(quantity) || 0, maxQty))
  const resultingStock = Math.max(0, maxQty - qtyNum)

  const pickProduct = (id: string) => {
    setProductId(id)
    const p = products.find((x: Product) => x.id === id)
    // Pre-fill the supplier from the product's own linked supplier.
    if (p?.supplierId) setSupplierId(p.supplierId)
  }

  const canSubmit = !!product && qtyNum > 0 && !!reason
  const submit = async () => {
    if (!canSubmit) return
    await create({
      productId,
      supplierId: supplierId || null,
      quantity: qtyNum,
      reason: reason as ReturnReason,
      comments,
      adminName: user?.name,
    }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Return to supplier"
      description="Send expired, slow-moving or damaged stock back. Inventory is updated automatically."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!canSubmit}>
            Confirm return
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Select
          label="Product"
          value={productId}
          onChange={(e) => pickProduct(e.target.value)}
          placeholder="Select a product to return"
          options={products.map((p: Product) => ({ label: `${p.name} · ${p.sku} — ${p.stock} in stock`, value: p.id }))}
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="Supplier"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            placeholder="Select a supplier"
            options={suppliers.map((s) => ({ label: `${s.name} (${s.code})`, value: s.id }))}
          />
          <Select
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as ReturnReason)}
            placeholder="Select a reason"
            options={REASONS.map((r) => ({ label: r.label, value: r.value }))}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input
            label="Quantity to return"
            type="number"
            min={1}
            max={maxQty}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0"
            hint={product ? `${maxQty} available · in stock after return: ${resultingStock}` : 'Pick a product first'}
          />
          <div className="flex items-end">
            {product && (
              <div className="w-full rounded-xl bg-mint-50 px-3.5 py-2.5 text-sm text-slate-600">
                <span className="text-slate-500">Stock </span>
                <span className="font-semibold text-slate-800">{maxQty}</span>
                <span className="mx-1.5 text-slate-400">→</span>
                <span className="font-semibold text-brand-700">{resultingStock}</span>
              </div>
            )}
          </div>
        </div>

        <Textarea
          label="Comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={2}
          placeholder="Optional note — batch number, condition, consignment date…"
        />

        <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs text-slate-500">
          On confirm, {qtyNum || 0} unit(s) will be deducted from inventory and recorded as <span className="font-semibold text-slate-600">Returned to Supplier</span> with the reason, quantity, date and supplier for reporting.
        </p>
      </div>
    </Modal>
  )
}
