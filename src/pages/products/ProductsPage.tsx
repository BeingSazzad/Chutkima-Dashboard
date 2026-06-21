import { useState } from 'react'
import { Check, Download, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { Tabs } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { ProductThumb } from '@/components/shared/ProductThumb'
import { ProductStatusBadge } from '@/components/shared/StatusBadge'
import { formatNPR } from '@/lib/utils'
import { parseCSV, readFileText } from '@/lib/csv'
import { downloadCSV } from '@/lib/export'
import { useDebounce } from '@/hooks/useDebounce'
import {
  useBulkImportProductsMutation,
  useBulkUpdateStockMutation,
  useDeleteProductMutation,
  useGetProductsQuery,
  useSaveProductMutation,
  useUpdateStockMutation,
} from '@/services/endpoints/productsApi'
import { useGetCategoryGroupsQuery } from '@/services/endpoints/categoriesApi'
import type { Product } from '@/types/common.types'

export default function ProductsPage() {
  const [group, setGroup] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)
  const [formFor, setFormFor] = useState<Product | 'new' | null>(null)
  const [stockFor, setStockFor] = useState<Product | null>(null)
  const [deleteFor, setDeleteFor] = useState<Product | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const { data: groups = [] } = useGetCategoryGroupsQuery()
  const groupNames = groups.map((g) => g.name)

  const { data: products = [], isLoading } = useGetProductsQuery({
    group: group || undefined,
    status: (status as Product['status']) || undefined,
    search: debounced || undefined,
  })

  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: 'Product',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <ProductThumb src={p.image} alt={p.name} contain />
          <div className="min-w-0">
            <p className="truncate font-semibold text-slate-800">{p.name}</p>
            <p className="text-xs text-slate-400">
              {p.brand} · <span className="font-mono">{p.sku}</span>
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      cell: (p) => (
        <div>
          <p className="text-slate-700">{p.category}</p>
          <p className="text-xs text-slate-400">{p.categoryGroup}</p>
        </div>
      ),
    },
    { key: 'shelf', header: 'Shelf', cell: (p) => <span className="text-slate-600">{p.shelfNo || '—'}</span> },
    {
      key: 'price',
      header: 'Price',
      cell: (p) =>
        p.onClearance && p.clearancePrice > 0 ? (
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-pink-600">{formatNPR(p.clearancePrice)}</span>
            <span className="text-xs text-slate-400 line-through">{formatNPR(p.price)}</span>
            <Badge tone="bg-pink-50 text-pink-700 ring-pink-600/15">Clearance</Badge>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-800">{formatNPR(p.price)}</span>
            {p.mrp > p.price && <span className="text-xs text-slate-400 line-through">{formatNPR(p.mrp)}</span>}
          </div>
        ),
    },
    {
      key: 'stock',
      header: 'Stock',
      cell: (p) => (
        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-700">{p.stock}</span>
          <ProductStatusBadge status={p.status} />
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (p) => (
        <div className="flex items-center justify-end gap-0.5">
          <button onClick={() => setStockFor(p)} className="focus-ring rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50">
            Stock
          </button>
          <button onClick={() => setFormFor(p)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteFor(p)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Products"
        description="Upload, edit, restock or remove items from your catalog."
        actions={
          <>
            <Button variant="outline" leftIcon={<Upload className="h-4 w-4" />} onClick={() => setBulkOpen(true)}>
              Bulk import
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormFor('new')}>
              Add product
            </Button>
          </>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, brand or SKU…"
              className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 md:flex">
            <div className="w-full md:w-48">
              <Select value={group} onChange={(e) => setGroup(e.target.value)} placeholder="All groups" options={groupNames.map((g) => ({ label: g, value: g }))} />
            </div>
            <div className="w-full md:w-40">
              <Select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="All status"
                options={[
                  { label: 'In stock', value: 'active' },
                  { label: 'Low stock', value: 'low_stock' },
                  { label: 'Out of stock', value: 'out_of_stock' },
                ]}
              />
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={products}
          rowKey={(p) => p.id}
          loading={isLoading}
          emptyTitle="No products found"
          emptyDescription="Adjust your filters or add a new product."
        />
      </Card>

      <ProductFormModal product={formFor} groups={groupNames} onClose={() => setFormFor(null)} />
      <EditStockModal product={stockFor} onClose={() => setStockFor(null)} />
      <DeleteProduct product={deleteFor} onClose={() => setDeleteFor(null)} />
      <BulkImportModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </>
  )
}

function ProductFormModal({ product, groups, onClose }: { product: Product | 'new' | null; groups: string[]; onClose: () => void }) {
  const [save, { isLoading }] = useSaveProductMutation()
  const isEdit = product && product !== 'new'
  const p = isEdit ? (product as Product) : null

  const empty = {
    sku: '', name: '', brand: '', categoryGroup: groups[0] ?? '', category: '',
    price: '', mrp: '', stock: '', unit: '', shelfNo: '', lowStockThreshold: '15',
    image: '', clearancePrice: '', onClearance: false,
  }
  const [form, setForm] = useState(empty)

  const key = product === 'new' ? 'new' : p?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && product) {
    setLastKey(key)
    setForm(
      p
        ? {
            sku: p.sku, name: p.name, brand: p.brand, categoryGroup: p.categoryGroup, category: p.category,
            price: String(p.price), mrp: String(p.mrp), stock: String(p.stock), unit: p.unit,
            shelfNo: p.shelfNo, lowStockThreshold: String(p.lowStockThreshold), image: p.image,
            clearancePrice: p.clearancePrice ? String(p.clearancePrice) : '', onClearance: p.onClearance,
          }
        : empty,
    )
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    await save({
      id: p?.id,
      sku: form.sku,
      name: form.name,
      brand: form.brand,
      categoryGroup: form.categoryGroup,
      category: form.category || form.categoryGroup,
      price: Number(form.price) || 0,
      mrp: Number(form.mrp) || Number(form.price) || 0,
      stock: Number(form.stock) || 0,
      unit: form.unit || '1 pc',
      shelfNo: form.shelfNo,
      lowStockThreshold: Number(form.lowStockThreshold) || 15,
      image: form.image,
      onClearance: form.onClearance,
      clearancePrice: form.onClearance ? Number(form.clearancePrice) || 0 : 0,
    }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title={isEdit ? 'Edit product' : 'Add product'}
      description={isEdit ? p?.name : 'Create a new catalog item.'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!form.name.trim()}>
            {isEdit ? 'Save changes' : 'Save product'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <ImageUpload label="Product image" value={form.image} onChange={(v) => set('image', v)} aspectClassName="aspect-square w-44 mx-auto" hint="Square image · recommended 800 × 800 px (PNG/JPG)." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="SKU" value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="e.g. WW-001" className="font-mono" />
          <Input label="Shelf number" value={form.shelfNo} onChange={(e) => set('shelfNo', e.target.value)} placeholder="e.g. A-3" />
          <Input label="Product name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Wai Wai Noodles" autoFocus />
          <Input label="Brand" value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="e.g. Wai Wai" />
          <Select label="Group" value={form.categoryGroup} onChange={(e) => set('categoryGroup', e.target.value)} placeholder="Select group" options={groups.map((g) => ({ label: g, value: g }))} />
          <Input label="Category" value={form.category} onChange={(e) => set('category', e.target.value)} placeholder="e.g. Chips & Snacks" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Input label="Price (NPR)" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} />
          <Input label="MRP (NPR)" type="number" value={form.mrp} onChange={(e) => set('mrp', e.target.value)} />
          <Input label="Stock" type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
          <Input label="Unit" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="84g" />
        </div>
        <Input label="Low-stock alert threshold" type="number" value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} hint="Flag as low stock when quantity drops to this level." />

        <div className="rounded-xl border border-slate-200 p-3">
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Stock clearance discount</span>
            <Switch checked={form.onClearance} onChange={(v) => set('onClearance', v)} />
          </label>
          {form.onClearance && (
            <Input className="mt-3" label="Clearance price (NPR)" type="number" value={form.clearancePrice} onChange={(e) => set('clearancePrice', e.target.value)} hint="Shown to customers as the discounted price." />
          )}
        </div>
      </div>
    </Modal>
  )
}

function EditStockModal({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [update, { isLoading }] = useUpdateStockMutation()
  const [stock, setStock] = useState('')

  const submit = async () => {
    if (!product) return
    await update({ id: product.id, stock: stock === '' ? product.stock : Number(stock) }).unwrap()
    setStock('')
    onClose()
  }

  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title="Update stock"
      description={product?.name}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading}>Save</Button>
        </>
      }
    >
      <Input label="New stock quantity" type="number" defaultValue={product?.stock} onChange={(e) => setStock(e.target.value)} hint={product ? `Low-stock threshold for this item is ${product.lowStockThreshold}.` : undefined} autoFocus />
    </Modal>
  )
}

function DeleteProduct({ product, onClose }: { product: Product | null; onClose: () => void }) {
  const [del, { isLoading }] = useDeleteProductMutation()
  const confirm = async () => {
    if (!product) return
    await del(product.id).unwrap()
    onClose()
  }
  return (
    <ConfirmDialog
      open={!!product}
      onClose={onClose}
      onConfirm={confirm}
      loading={isLoading}
      title="Delete product?"
      description={product ? `"${product.name}" will be permanently removed from the catalog.` : undefined}
      confirmLabel="Delete product"
    />
  )
}

function BulkImportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState('products')
  const [importProducts, { isLoading: importing }] = useBulkImportProductsMutation()
  const [updateStock, { isLoading: stocking }] = useBulkUpdateStockMutation()
  const [result, setResult] = useState<string>('')
  const [error, setError] = useState('')

  const downloadTemplate = () => {
    if (mode === 'products') {
      downloadCSV(
        'chutkima-products-template.csv',
        [{ sku: 'WW-001', name: 'Wai Wai Noodles', brand: 'Wai Wai', category: 'Chips & Snacks', categoryGroup: 'Snacks & Drinks', price: '35', mrp: '40', stock: '100', unit: '84g', shelfNo: 'A-3', image: '' }],
        ['sku', 'name', 'brand', 'category', 'categoryGroup', 'price', 'mrp', 'stock', 'unit', 'shelfNo', 'image'].map((k) => ({ key: k, label: k })),
      )
    } else {
      downloadCSV('chutkima-stock-template.csv', [{ sku: 'WW-001', stock: '120' }], [{ key: 'sku', label: 'sku' }, { key: 'stock', label: 'stock' }])
    }
  }

  const onFile = async (file?: File | null) => {
    if (!file) return
    setError('')
    setResult('')
    try {
      const text = await readFileText(file)
      const rows = parseCSV(text)
      if (rows.length === 0) {
        setError('No data rows found. Use the template format.')
        return
      }
      if (mode === 'products') {
        const payload = rows
          .filter((r) => r.sku && r.name)
          .map((r) => ({
            sku: r.sku, name: r.name, brand: r.brand, category: r.category, categoryGroup: r.categoryGroup,
            price: r.price ? Number(r.price) : undefined, mrp: r.mrp ? Number(r.mrp) : undefined,
            stock: r.stock ? Number(r.stock) : undefined, unit: r.unit, shelfNo: r.shelfNo, image: r.image,
          }))
        const res = await importProducts(payload).unwrap()
        setResult(`✓ ${res.added} added, ${res.updated} updated.`)
      } else {
        const payload = rows.filter((r) => r.sku).map((r) => ({ sku: r.sku, stock: Number(r.stock) || 0 }))
        const res = await updateStock(payload).unwrap()
        setResult(`✓ ${res.updated} updated.${res.missing.length ? ` Missing SKUs: ${res.missing.join(', ')}` : ''}`)
      }
    } catch {
      setError('Could not parse that file.')
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Bulk import" description="Upload a CSV to add/update many products at once." size="lg">
      <div className="space-y-4">
        <Tabs
          items={[
            { label: 'Products (add/update)', value: 'products' },
            { label: 'Stock only', value: 'stock' },
          ]}
          value={mode}
          onChange={(v) => { setMode(v); setResult(''); setError('') }}
        />

        <div className="rounded-xl bg-mint-50 p-4 text-sm text-slate-600">
          {mode === 'products' ? (
            <p>Columns: <span className="font-mono text-xs">sku, name, brand, category, categoryGroup, price, mrp, stock, unit, shelfNo, image</span>. Rows are matched by <strong>SKU</strong> — existing SKUs update, new ones are added.</p>
          ) : (
            <p>Columns: <span className="font-mono text-xs">sku, stock</span>. Updates stock for matching SKUs only — no other fields touched. Great for daily restock.</p>
          )}
          <Button variant="outline" size="sm" className="mt-3" leftIcon={<Download className="h-3.5 w-3.5" />} onClick={downloadTemplate}>
            Download template
          </Button>
        </div>

        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-center hover:border-brand-300 hover:bg-mint-50">
          <Upload className="h-6 w-6 text-brand-500" />
          <span className="text-sm font-semibold text-slate-700">{importing || stocking ? 'Importing…' : 'Click to choose a CSV file'}</span>
          <input type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>

        {result && (
          <p className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5 text-sm font-medium text-green-700">
            <Check className="h-4 w-4" /> {result}
          </p>
        )}
        {error && <p className="rounded-xl bg-red-50 px-3 py-2.5 text-sm font-medium text-danger">{error}</p>}
      </div>
    </Modal>
  )
}
