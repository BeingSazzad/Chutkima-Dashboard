import { useState } from 'react'
import { ClipboardList, Download, Plus, Search, Tag, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/shared/StatCard'
import { ProductThumb } from '@/components/shared/ProductThumb'
import { downloadCSV } from '@/lib/export'
import { formatDateTime, formatNPR } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import { useDebounce } from '@/hooks/useDebounce'
import { useGetProductsQuery } from '@/services/endpoints/productsApi'
import {
  useCreateInternalOrderMutation,
  useGetInternalOrdersQuery,
} from '@/services/endpoints/internalBillingApi'
import type { InternalOrder, InternalOrderItem } from '@/types/common.types'

export default function InternalBillingPage() {
  const { data: orders = [], isLoading } = useGetInternalOrdersQuery()
  const [createOpen, setCreateOpen] = useState(false)

  const totalDiscount = orders.reduce((s, o) => s + o.discount, 0)
  const totalSell = orders.reduce((s, o) => s + o.sellTotal, 0)

  const exportCsv = () => {
    downloadCSV(
      'chutkima-internal-billing.csv',
      orders.map((o) => ({
        reference: o.reference,
        staff: o.staffName,
        items: o.items.length,
        originalTotal: o.originalTotal,
        sellTotal: o.sellTotal,
        discount: o.discount,
        reason: o.reason,
        comments: o.comments,
        admin: o.adminName,
        date: formatDateTime(o.createdAt),
      })),
      [
        { key: 'reference', label: 'Internal #' },
        { key: 'staff', label: 'Staff' },
        { key: 'items', label: 'Items' },
        { key: 'originalTotal', label: 'Original (NPR)' },
        { key: 'sellTotal', label: 'Sold (NPR)' },
        { key: 'discount', label: 'Discount (NPR)' },
        { key: 'reason', label: 'Reason' },
        { key: 'comments', label: 'Comments' },
        { key: 'admin', label: 'Admin' },
        { key: 'date', label: 'Date' },
      ],
    )
  }

  const columns: Column<InternalOrder>[] = [
    {
      key: 'ref',
      header: 'Internal order',
      cell: (o) => (
        <div>
          <p className="font-semibold text-slate-800">{o.reference}</p>
          <p className="text-xs text-slate-400">{formatDateTime(o.createdAt)}</p>
        </div>
      ),
    },
    { key: 'staff', header: 'Staff', cell: (o) => <span className="text-slate-700">{o.staffName}</span> },
    { key: 'items', header: 'Items', cell: (o) => <span className="text-slate-600">{o.items.length}</span> },
    { key: 'original', header: 'Original', cell: (o) => <span className="text-slate-500 line-through">{formatNPR(o.originalTotal)}</span> },
    { key: 'sell', header: 'Sold', cell: (o) => <span className="font-bold text-slate-800">{formatNPR(o.sellTotal)}</span> },
    {
      key: 'discount',
      header: 'Discount',
      cell: (o) =>
        o.discount > 0 ? (
          <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/15">−{formatNPR(o.discount)}</Badge>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    { key: 'reason', header: 'Reason', className: 'max-w-[14rem] whitespace-normal text-slate-600', cell: (o) => o.reason || '—' },
    { key: 'admin', header: 'By', cell: (o) => <span className="text-slate-500">{o.adminName}</span> },
  ]

  return (
    <>
      <PageHeader
        title="Internal Billing"
        description="Staff purchases, damaged stock & clearance — separate from customer orders."
        actions={
          <>
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={orders.length === 0}>
              Export CSV
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setCreateOpen(true)}>
              New internal order
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Internal orders" value={orders.length} icon={<ClipboardList className="h-5 w-5" />} />
        <StatCard label="Sold value" value={formatNPR(totalSell)} icon={<Tag className="h-5 w-5" />} iconClass="bg-green-50 text-green-600" />
        <StatCard label="Total discount given" value={formatNPR(totalDiscount)} icon={<Tag className="h-5 w-5" />} iconClass="bg-amber-50 text-amber-600" />
      </div>

      <Card className="mt-4">
        <DataTable
          columns={columns}
          data={orders}
          rowKey={(o) => o.id}
          loading={isLoading}
          emptyTitle="No internal orders"
          emptyDescription="Create a staff / clearance order to get started."
        />
      </Card>

      <CreateInternalOrderModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  )
}

function CreateInternalOrderModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth()
  const [create, { isLoading }] = useCreateInternalOrderMutation()
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 250)
  const { data: products = [] } = useGetProductsQuery({ search: debounced || undefined })

  const [staffName, setStaffName] = useState('')
  const [items, setItems] = useState<InternalOrderItem[]>([])
  const [reason, setReason] = useState('')
  const [comments, setComments] = useState('')

  const addProduct = (p: (typeof products)[number]) => {
    setItems((prev) =>
      prev.some((it) => it.productId === p.id)
        ? prev
        : [...prev, { productId: p.id, sku: p.sku, name: p.name, quantity: 1, originalPrice: p.price, sellPrice: p.price }],
    )
  }
  const patch = (id: string, k: 'quantity' | 'sellPrice', v: number) =>
    setItems((prev) => prev.map((it) => (it.productId === id ? { ...it, [k]: v } : it)))
  const remove = (id: string) => setItems((prev) => prev.filter((it) => it.productId !== id))

  const originalTotal = items.reduce((s, it) => s + it.originalPrice * it.quantity, 0)
  const sellTotal = items.reduce((s, it) => s + it.sellPrice * it.quantity, 0)
  const discount = originalTotal - sellTotal
  const belowPrice = items.some((it) => it.sellPrice < it.originalPrice)
  // Reason + comments are mandatory whenever something is sold below price.
  const valid = staffName.trim() && items.length > 0 && (!belowPrice || (reason.trim() && comments.trim()))

  const reset = () => {
    setStaffName('')
    setItems([])
    setReason('')
    setComments('')
    setSearch('')
  }

  const submit = async () => {
    await create({
      staffName: staffName.trim(),
      items,
      reason: reason.trim(),
      comments: comments.trim(),
      adminName: user?.name ?? 'Admin',
    }).unwrap()
    reset()
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        reset()
        onClose()
      }}
      title="New internal order"
      description="Sell to staff / clear stock — gets its own INT-###### number."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => { reset(); onClose() }}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!valid}>Create internal order</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Staff name" value={staffName} onChange={(e) => setStaffName(e.target.value)} placeholder="e.g. Bimala Thapa" autoFocus />

        {/* Selected line items */}
        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((it) => {
              const below = it.sellPrice < it.originalPrice
              return (
                <div key={it.productId} className="flex items-center gap-2 rounded-xl border border-slate-100 p-2">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{it.name}</p>
                    <p className="text-xs text-slate-400">[{it.sku}] · MRP {formatNPR(it.originalPrice)}</p>
                  </div>
                  <label className="text-[11px] text-slate-400">
                    Qty
                    <input
                      type="number"
                      min={1}
                      value={it.quantity}
                      onChange={(e) => patch(it.productId, 'quantity', Math.max(1, Number(e.target.value) || 1))}
                      className="focus-ring ml-1 h-8 w-14 rounded-lg border border-slate-200 px-2 text-sm text-slate-700"
                    />
                  </label>
                  <label className="text-[11px] text-slate-400">
                    Sell
                    <input
                      type="number"
                      min={0}
                      value={it.sellPrice}
                      onChange={(e) => patch(it.productId, 'sellPrice', Math.max(0, Number(e.target.value) || 0))}
                      className={
                        'focus-ring ml-1 h-8 w-20 rounded-lg border px-2 text-sm ' +
                        (below ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 text-slate-700')
                      }
                    />
                  </label>
                  <button onClick={() => remove(it.productId)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Remove">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )
            })}
            <div className="flex items-center justify-end gap-4 px-1 text-sm">
              <span className="text-slate-400 line-through">{formatNPR(originalTotal)}</span>
              <span className="font-bold text-slate-800">{formatNPR(sellTotal)}</span>
              {discount > 0 && <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/15">−{formatNPR(discount)} off</Badge>}
            </div>
          </div>
        )}

        {/* Product search */}
        <div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products to add…"
              className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm"
            />
          </div>
          {debounced && (
            <div className="mt-2 max-h-52 space-y-1 overflow-y-auto rounded-xl border border-slate-100 p-1">
              {products.slice(0, 12).map((p) => (
                <button
                  key={p.id}
                  onClick={() => addProduct(p)}
                  className="flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors hover:bg-slate-50"
                >
                  <ProductThumb src={p.image} alt={p.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400">[{p.sku}] · {formatNPR(p.price)} · {p.stock} in stock</p>
                  </div>
                  <Plus className="h-4 w-4 text-brand-600" />
                </button>
              ))}
              {products.length === 0 && <p className="py-4 text-center text-sm text-slate-400">No products found.</p>}
            </div>
          )}
        </div>

        {/* Below-price justification (mandatory) */}
        {belowPrice && (
          <div className="space-y-3 rounded-xl bg-amber-50 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <Trash2 className="h-3.5 w-3.5" /> Selling below standard price — reason &amp; comments required.
            </p>
            <Input label="Reason (required)" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Near-expiry / damaged / staff purchase" />
            <Textarea label="Comments (required)" value={comments} onChange={(e) => setComments(e.target.value)} rows={2} />
          </div>
        )}
      </div>
    </Modal>
  )
}
