import { useEffect, useState } from 'react'
import { Check, Download, Pencil, Plus, Search, Trash2, Upload } from 'lucide-react'
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
import { MultiImageUpload } from '@/components/ui/MultiImageUpload'
import { ProductThumb } from '@/components/shared/ProductThumb'
import { ProductStatusBadge } from '@/components/shared/StatusBadge'
import { cn, formatNPR } from '@/lib/utils'
import { parseCSV, readFileText } from '@/lib/csv'
import { downloadCSV } from '@/lib/export'
import { useDebounce } from '@/hooks/useDebounce'
import {
  useBulkImportProductsMutation,
  useBulkUpdateStockMutation,
  useDeleteProductMutation,
  useGetProductsQuery,
  useSaveProductMutation,
  useToggleProductMutation,
  useUpdateStockMutation,
} from '@/services/endpoints/productsApi'
import { useGetCategoriesQuery, useGetCategoryGroupsQuery } from '@/services/endpoints/categoriesApi'
import { useGetSuppliersQuery } from '@/services/endpoints/suppliersApi'
import type { Product } from '@/types/common.types'

export default function ProductsPage() {
  const [group, setGroup] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)
  const [formFor, setFormFor] = useState<Product | 'new' | null>(null)
  const [deleteFor, setDeleteFor] = useState<Product | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  const { data: groups = [] } = useGetCategoryGroupsQuery()
  const groupNames = groups.map((g) => g.name)
  const [toggleProduct] = useToggleProductMutation()

  const { data: products = [], isLoading } = useGetProductsQuery({
    group: group || undefined,
    status: (status as Product['status']) || undefined,
    search: debounced || undefined,
  })

  const { data: suppliers = [] } = useGetSuppliersQuery()

  const exportAllProducts = () => {
    const rows = products.map((p) => {
      const supplier = suppliers.find((s) => s.id === p.supplierId)
      return {
        sku: p.sku,
        name: p.name,
        description: p.description || '',
        brand: p.brand || '',
        category: p.category,
        categoryGroup: p.categoryGroup || '',
        price: String(p.price),
        mrp: String(p.mrp),
        stock: String(p.stock),
        unit: p.unit || '',
        shelfNo: p.shelfNo || '',
        image: p.image || '',
        supplierCode: supplier?.code || '',
      }
    })

    downloadCSV(
      'chutkima-all-products.csv',
      rows,
      [
        { key: 'sku', label: 'sku' },
        { key: 'name', label: 'name' },
        { key: 'description', label: 'description' },
        { key: 'brand', label: 'brand' },
        { key: 'category', label: 'category' },
        { key: 'categoryGroup', label: 'categoryGroup' },
        { key: 'price', label: 'price' },
        { key: 'mrp', label: 'mrp' },
        { key: 'stock', label: 'stock' },
        { key: 'unit', label: 'unit' },
        { key: 'shelfNo', label: 'shelfNo' },
        { key: 'image', label: 'image' },
        { key: 'supplierCode', label: 'supplierCode' },
      ],
    )
  }

  const columns: Column<Product>[] = [
    {
      key: 'product',
      header: 'Product',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <ProductThumb src={p.image} alt={p.name} contain />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <p className="truncate font-semibold text-slate-800">{p.name}</p>
              {!p.active && <Badge>Hidden</Badge>}
            </div>
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
      cell: (p) => {
        const off = p.mrp > p.price ? Math.round((1 - p.price / p.mrp) * 100) : 0
        return (
          <div className="flex items-center gap-1.5">
            <span className={cn('font-bold', p.onClearance && off > 0 ? 'text-pink-600' : 'text-slate-800')}>{formatNPR(p.price)}</span>
            {off > 0 && <span className="text-xs text-slate-400 line-through">{formatNPR(p.mrp)}</span>}
            {off > 0 && <span className="text-xs font-semibold text-green-600">{off}% off</span>}
            {p.onClearance && off > 0 && <Badge tone="bg-pink-50 text-pink-700 ring-pink-600/15">Clearance</Badge>}
          </div>
        )
      },
    },
    {
      key: 'stock',
      header: 'Stock',
      cell: (p) => <InlineStock product={p} />,
    },
    { key: 'visible', header: 'Visible', cell: (p) => <Switch checked={p.active} onChange={() => toggleProduct(p.id)} size="sm" aria-label={`Toggle ${p.name}`} /> },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (p) => (
        <div className="flex items-center justify-end gap-0.5">
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
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportAllProducts}>
              Export CSV
            </Button>
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

      <ProductFormModal product={formFor} onClose={() => setFormFor(null)} />
      <DeleteProduct product={deleteFor} onClose={() => setDeleteFor(null)} />
      <BulkImportModal open={bulkOpen} onClose={() => setBulkOpen(false)} />
    </>
  )
}

function ProductFormModal({ product, onClose }: { product: Product | 'new' | null; onClose: () => void }) {
  const [save, { isLoading }] = useSaveProductMutation()
  const { data: categories = [] } = useGetCategoriesQuery()
  const { data: suppliers = [] } = useGetSuppliersQuery()
  const isEdit = product && product !== 'new'
  const p = isEdit ? (product as Product) : null

  const empty = {
    sku: '', name: '', description: '', brand: '', category: '',
    price: '', mrp: '', stock: '', unit: '', shelfNo: '', lowStockThreshold: '15',
    onClearance: false, supplierId: '',
  }
  const [form, setForm] = useState(empty)
  const [images, setImages] = useState<string[]>([])

  const key = product === 'new' ? 'new' : p?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && product) {
    setLastKey(key)
    setForm(
      p
        ? {
            sku: p.sku, name: p.name, description: p.description ?? '', brand: p.brand, category: p.category,
            price: String(p.price), mrp: p.mrp ? String(p.mrp) : '', stock: String(p.stock), unit: p.unit,
            shelfNo: p.shelfNo, lowStockThreshold: String(p.lowStockThreshold), onClearance: p.onClearance,
            supplierId: p.supplierId ?? '',
          }
        : empty,
    )
    setImages(p?.images?.length ? p.images : p?.image ? [p.image] : [])
  }

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    const cat = categories.find((c) => c.name === form.category)
    await save({
      id: p?.id,
      sku: form.sku,
      name: form.name,
      description: form.description.trim(),
      brand: form.brand,
      category: form.category,
      categoryGroup: cat?.group ?? '',
      price: Number(form.price) || 0,
      mrp: Number(form.mrp) || 0,
      stock: Number(form.stock) || 0,
      unit: form.unit || '1 pc',
      shelfNo: form.shelfNo,
      lowStockThreshold: Number(form.lowStockThreshold) || 15,
      images,
      onClearance: form.onClearance,
      supplierId: form.supplierId || null,
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
          <Button onClick={submit} loading={isLoading} disabled={!form.name.trim() || !form.category}>
            {isEdit ? 'Save changes' : 'Save product'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <MultiImageUpload label="Product images" images={images} onChange={setImages} hint="First image is the cover. Recommended 800 × 800 px on a white background." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Product name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Wai Wai Noodles" autoFocus />
          <Input label="Brand" value={form.brand} onChange={(e) => set('brand', e.target.value)} placeholder="e.g. Wai Wai" />
          <Select
            label="Category"
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            placeholder="Select a category"
            options={categories.map((c) => ({ label: `${c.name}  ·  ${c.group}`, value: c.name }))}
          />
          <Input label="Unit / size" value={form.unit} onChange={(e) => set('unit', e.target.value)} placeholder="e.g. 84g, 1L" />
          <Input label="SKU" value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="e.g. WW-001" className="font-mono" />
          <Input label="Shelf number" value={form.shelfNo} onChange={(e) => set('shelfNo', e.target.value)} placeholder="e.g. A-3" />
          <Select
            label="Supplier"
            value={form.supplierId}
            onChange={(e) => set('supplierId', e.target.value)}
            placeholder="Select a supplier"
            options={suppliers.map((s) => ({ label: `${s.name} (${s.code})`, value: s.id }))}
          />
        </div>
        <Textarea
          label="Description"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={3}
          placeholder="Short description shown on the product page in the app — key features, size, flavour, usage…"
          hint="Optional, but recommended. Appears under the product name in the customer app."
        />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Input label="Selling price (NPR)" type="number" value={form.price} onChange={(e) => set('price', e.target.value)} />
          <Input label="Original price" type="number" value={form.mrp} onChange={(e) => set('mrp', e.target.value)} hint="Optional" />
          <Input label="Stock" type="number" value={form.stock} onChange={(e) => set('stock', e.target.value)} />
          <Input label="Low-stock at" type="number" value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', e.target.value)} />
        </div>
      </div>
    </Modal>
  )
}

/** Inline-editable stock cell — edit the number right in the table. */
function InlineStock({ product }: { product: Product }) {
  const [update] = useUpdateStockMutation()
  const [val, setVal] = useState(String(product.stock))

  useEffect(() => {
    setVal(String(product.stock))
  }, [product.stock])

  const save = () => {
    const n = Number(val)
    if (!Number.isNaN(n) && n !== product.stock) update({ id: product.id, stock: n })
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className="focus-ring h-8 w-16 rounded-lg border border-slate-200 bg-white px-2 text-sm font-semibold text-slate-700"
        title={`Low-stock threshold: ${product.lowStockThreshold}`}
      />
      <ProductStatusBadge status={product.status} />
    </div>
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
        [{ sku: 'WW-001', name: 'Wai Wai Noodles', description: 'Classic instant noodles with veg masala', brand: 'Wai Wai', category: 'Chips & Snacks', categoryGroup: 'Snacks & Drinks', price: '35', mrp: '40', stock: '100', unit: '84g', shelfNo: 'A-3', image: '' }],
        ['sku', 'name', 'description', 'brand', 'category', 'categoryGroup', 'price', 'mrp', 'stock', 'unit', 'shelfNo', 'image'].map((k) => ({ key: k, label: k })),
      )
    } else {
      downloadCSV(
        'chutkima-stock-template.csv',
        [{ sku: 'WW-001', name: 'Wai Wai Noodles', stock: '120' }],
        [
          { key: 'sku', label: 'sku' },
          { key: 'name', label: 'name' },
          { key: 'stock', label: 'stock' },
        ],
      )
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
            sku: r.sku, name: r.name, description: r.description, brand: r.brand, category: r.category, categoryGroup: r.categoryGroup,
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
            <p>Columns: <span className="font-mono text-xs">sku, name, description, brand, category, categoryGroup, price, mrp, stock, unit, shelfNo, image</span>. Rows are matched by <strong>SKU</strong> — existing SKUs update, new ones are added.</p>
          ) : (
            <p>Columns: <span className="font-mono text-xs">sku, name, stock</span>. Updates stock for matching SKUs only (name is ignored but helps identify products) — no other fields touched. Great for daily restock.</p>
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
