import { useMemo, useState } from 'react'
import { Mail, Pencil, Phone, Plus, Printer, RotateCcw, Search, Trash2 } from 'lucide-react'
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
import { printSupplierReturn } from '@/lib/export'

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
  const [viewReturn, setViewReturn] = useState<SupplierReturn | null>(null)

  const columns: Column<SupplierReturn>[] = [
    {
      key: 'ref',
      header: 'Return',
      cell: (r) => (
        <div>
          <button
            onClick={() => setViewReturn(r)}
            className="font-mono font-bold text-brand-600 hover:text-brand-850 hover:underline text-left focus:outline-none"
          >
            {r.reference}
          </button>
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

      <ReturnDetailModal ret={viewReturn} onClose={() => setViewReturn(null)} />
    </Card>
  )
}

function ReturnDetailModal({ ret, onClose }: { ret: SupplierReturn | null; onClose: () => void }) {
  if (!ret) return null
  const m = reasonMeta(ret.reason)

  return (
    <Modal
      open={!!ret}
      onClose={onClose}
      title={`Return ${ret.reference}`}
      description="Details of returned inventory goods"
      size="md"
      footer={
        <div className="flex justify-between w-full">
          <Button
            variant="outline"
            leftIcon={<Printer className="h-4 w-4" />}
            onClick={() => printSupplierReturn(ret)}
          >
            Print Return Note
          </Button>
          <Button onClick={onClose}>Close</Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4 rounded-2xl bg-slate-50 p-4 text-sm">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Supplier</p>
            <p className="font-bold text-slate-800 mt-1">{ret.supplierName}</p>
            <p className="text-xs text-slate-500 mt-0.5">ID: {ret.supplierId || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Processed By</p>
            <p className="font-bold text-slate-800 mt-1">{ret.adminName}</p>
            <p className="text-xs text-slate-500 mt-0.5">Date: {fmtDate(ret.createdAt)}</p>
          </div>
        </div>

        {ret.items && ret.items.length > 0 ? (
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-3 w-16 text-center">S.N</th>
                  <th className="p-3 w-28">SKU</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 w-20 text-center">QTY</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {ret.items.map((item, idx) => (
                  <tr key={item.productId} className="hover:bg-slate-50/50">
                    <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                    <td className="p-3 font-mono text-xs text-slate-600">{item.sku}</td>
                    <td className="p-3 font-medium text-slate-800">{item.productName}</td>
                    <td className="p-3 text-center font-bold text-slate-850">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-slate-50 px-4 py-2 text-right border-t border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider flex justify-between">
              <span>Total Units</span>
              <span className="text-slate-800 font-extrabold text-sm">{ret.quantity}</span>
            </div>
          </div>
        ) : (
          <div className="border border-slate-100 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Product</span>
              <span className="font-semibold text-slate-800">{ret.productName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">SKU</span>
              <span className="font-mono text-slate-800">{ret.sku}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Quantity</span>
              <span className="font-extrabold text-slate-900 text-base">{ret.quantity}</span>
            </div>
          </div>
        )}

        <div className="border border-slate-100 rounded-2xl p-4 space-y-3">
          <div className="flex justify-between text-sm items-center">
            <span className="text-slate-500">Reason</span>
            <Badge tone={m.tone}>{m.label}</Badge>
          </div>
        </div>

        {ret.comments && (
          <div className="bg-red-50/50 border border-red-100 rounded-2xl p-4">
            <p className="text-xs font-bold text-red-800 uppercase tracking-wide">Comments / Return Reason Note</p>
            <p className="text-sm text-red-700 mt-1.5 leading-relaxed">{ret.comments}</p>
          </div>
        )}
      </div>
    </Modal>
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

  const [supplierId, setSupplierId] = useState('')
  const [reason, setReason] = useState<ReturnReason | ''>('')
  const [comments, setComments] = useState('')

  // Local state for items list: { productId, quantity }
  const [items, setItems] = useState<{ productId: string; quantity: number }[]>([])

  // Reset every time the modal opens.
  const [wasOpen, setWasOpen] = useState(false)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) {
      setSupplierId('')
      setReason('')
      setComments('')
      setItems([])
    }
  }

  const supplierProducts = products.filter((p: Product) => p.supplierId === supplierId)

  // Options for products dropdown that aren't already selected
  const availableProducts = supplierProducts.filter(
    (p) => !items.some((it) => it.productId === p.id)
  )

  const handleAddProduct = (prodId: string) => {
    if (!prodId) return
    setItems((prev) => [...prev, { productId: prodId, quantity: 1 }])
  }

  const updateItemQty = (prodId: string, qty: number) => {
    const p = products.find((x) => x.id === prodId)
    const max = p?.stock ?? 9999
    const val = Math.max(1, Math.min(max, qty))
    setItems((prev) =>
      prev.map((it) => (it.productId === prodId ? { ...it, quantity: val } : it))
    )
  }

  const removeItem = (prodId: string) => {
    setItems((prev) => prev.filter((it) => it.productId !== prodId))
  }

  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)
  const canSubmit = items.length > 0 && !!reason
  const submit = async () => {
    if (!canSubmit) return
    await create({
      supplierId: supplierId || null,
      reason: reason as ReturnReason,
      comments,
      adminName: user?.name,
      items,
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
          <Button onClick={submit} loading={isLoading} disabled={!canSubmit} className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-4 py-2 rounded-xl">
            Confirm return
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Supplier & Code Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="Supplier Name"
            value={supplierId}
            onChange={(e) => {
              setSupplierId(e.target.value)
              setItems([]) // Reset items on supplier change
            }}
            placeholder="Select a supplier"
            options={suppliers.map((s) => ({ label: s.name, value: s.id }))}
          />
          <div className="flex flex-col">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Supplier Code</label>
            <div className="flex items-center h-10 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 text-sm text-slate-500 font-medium">
              {supplierId ? (
                <>
                  <span>{suppliers.find((s) => s.id === supplierId)?.code}</span>
                  <span className="ml-1.5 text-xs text-red-500 font-bold">(automatic)</span>
                </>
              ) : (
                <span className="text-slate-400 italic">Select a supplier</span>
              )}
            </div>
          </div>
        </div>

        {/* Products & Reason Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select
            label="Select Products"
            value=""
            disabled={!supplierId}
            onChange={(e) => handleAddProduct(e.target.value)}
            placeholder={supplierId ? (availableProducts.length > 0 ? "Choose products to return" : "All supplier products added") : "Select supplier first"}
            options={availableProducts.map((p) => ({
              label: `${p.name} (${p.sku})`,
              value: p.id,
            }))}
          />
          <Select
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value as ReturnReason)}
            placeholder="Select a reason"
            options={REASONS.map((r) => ({ label: r.label, value: r.value }))}
          />
        </div>

        {/* Selected Products Table */}
        {items.length > 0 && (
          <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-indigo-100 bg-indigo-50/50 text-xs font-bold text-indigo-900 uppercase tracking-wider">
                  <th className="p-3 w-16 text-center">S.N</th>
                  <th className="p-3 w-28">SKU</th>
                  <th className="p-3">Product Name</th>
                  <th className="p-3 w-36 text-center">QTY</th>
                  <th className="p-3 w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-50 text-sm">
                {items.map((item, idx) => {
                  const p = products.find((x) => x.id === item.productId)
                  return (
                    <tr key={item.productId} className="even:bg-indigo-50/20 hover:bg-indigo-50/40 transition-colors">
                      <td className="p-3 text-center font-medium text-slate-400">{idx + 1}</td>
                      <td className="p-3 font-mono text-xs text-slate-600">{p?.sku || '—'}</td>
                      <td className="p-3 font-medium text-slate-800">{p?.name || 'Unknown'}</td>
                      <td className="p-3">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => updateItemQty(item.productId, item.quantity - 1)}
                            className="focus-ring h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={p?.stock || undefined}
                            value={item.quantity}
                            onChange={(e) => updateItemQty(item.productId, parseInt(e.target.value) || 1)}
                            className="w-12 h-7 rounded-lg border border-slate-200 text-center text-sm font-semibold tabular-nums focus:ring-brand-500"
                          />
                          <button
                            type="button"
                            onClick={() => updateItemQty(item.productId, item.quantity + 1)}
                            className="focus-ring h-7 w-7 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          className="text-xs font-bold text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Comments Textarea */}
        <Textarea
          label="Comments"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          placeholder="Optional note — batch number, condition, consignment date.."
        />

        {/* Inventory deduction hint card */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-xs text-slate-500 leading-relaxed">
          On confirm, <span className="font-bold text-slate-700">{totalUnits}</span> unit(s) will be deducted from inventory and recorded as <span className="font-semibold text-slate-800">Returned to Supplier</span> with the reason, quantity, date and supplier for reporting.
        </div>
      </div>
    </Modal>
  )
}
