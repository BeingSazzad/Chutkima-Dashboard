import { useState } from 'react'
import {
  ArrowDown,
  ArrowUp,
  Check,
  Eye,
  LayoutGrid,
  Package,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ProductThumb } from '@/components/shared/ProductThumb'
import { cn, formatNPR } from '@/lib/utils'
import { useDebounce } from '@/hooks/useDebounce'
import {
  useDeleteHomeSectionMutation,
  useGetHomeSectionsQuery,
  useMoveHomeSectionMutation,
  useSaveHomeSectionMutation,
  useToggleHomeSectionMutation,
} from '@/services/endpoints/homeFeedApi'
import { useGetProductsQuery } from '@/services/endpoints/productsApi'
import { useGetCategoryGroupsQuery } from '@/services/endpoints/categoriesApi'
import type { HomeSection, HomeSectionType } from '@/types/common.types'

const TYPE_META: Record<HomeSectionType, { label: string; icon: typeof Sparkles; tone: string }> = {
  best_seller: { label: 'Best sellers (auto)', icon: Sparkles, tone: 'bg-amber-50 text-amber-700 ring-amber-600/15' },
  category_products: { label: 'Products from category', icon: Package, tone: 'bg-brand-50 text-brand-700 ring-brand-600/15' },
  manual_products: { label: 'Hand-picked products', icon: Check, tone: 'bg-blue-50 text-blue-700 ring-blue-600/15' },
  category_grid: { label: 'Category tiles', icon: LayoutGrid, tone: 'bg-violet-50 text-violet-700 ring-violet-600/15' },
}

function sourceLabel(s: HomeSection): string {
  switch (s.type) {
    case 'best_seller':
      return 'Auto — top-selling products'
    case 'category_products':
      return `Products from ${s.categoryGroup || '—'}`
    case 'category_grid':
      return `Category tiles · ${s.categoryGroup || '—'}`
    case 'manual_products':
      return `${s.productIds.length} hand-picked products`
  }
}

export default function HomeFeedPage() {
  const { data: sections = [], isLoading } = useGetHomeSectionsQuery()
  const [toggle] = useToggleHomeSectionMutation()
  const [move] = useMoveHomeSectionMutation()
  const [formFor, setFormFor] = useState<HomeSection | 'new' | null>(null)
  const [deleteFor, setDeleteFor] = useState<HomeSection | null>(null)

  return (
    <>
      <PageHeader
        title="Home Feed"
        description="Arrange the sections shown on the app & website home screen. Reorder, rename and pick what each shows."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormFor('new')}>
            Add section
          </Button>
        }
      />

      {isLoading ? (
        <Spinner label="Loading feed…" className="py-24" />
      ) : (
        <div className="space-y-3">
          {sections.map((s, i) => {
            const meta = TYPE_META[s.type]
            return (
              <Card key={s.id} className={cn(!s.active && 'opacity-60')}>
                <CardContent className="flex items-center gap-3 p-4">
                  {/* Reorder */}
                  <div className="flex flex-col">
                    <button
                      disabled={i === 0}
                      onClick={() => move({ id: s.id, direction: 'up' })}
                      className="focus-ring rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                      aria-label="Move up"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button
                      disabled={i === sections.length - 1}
                      onClick={() => move({ id: s.id, direction: 'down' })}
                      className="focus-ring rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
                      aria-label="Move down"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>

                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-400">
                    {s.position}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-bold text-slate-800">{s.title}</p>
                      <Badge tone={meta.tone}>
                        <meta.icon className="h-3 w-3" /> {meta.label}
                      </Badge>
                      {s.showViewAll && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                          <Eye className="h-3 w-3" /> View all
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-slate-400">{sourceLabel(s)}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <button onClick={() => setFormFor(s)} className="focus-ring rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button onClick={() => setDeleteFor(s)} className="focus-ring rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Delete">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    <Switch checked={s.active} onChange={() => toggle(s.id)} aria-label={`Toggle ${s.title}`} />
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <SectionFormModal section={formFor} onClose={() => setFormFor(null)} />
      <DeleteSection section={deleteFor} onClose={() => setDeleteFor(null)} />
    </>
  )
}

function SectionFormModal({ section, onClose }: { section: HomeSection | 'new' | null; onClose: () => void }) {
  const [save, { isLoading }] = useSaveHomeSectionMutation()
  const isEdit = section && section !== 'new'
  const s = isEdit ? (section as HomeSection) : null

  const { data: groups = [] } = useGetCategoryGroupsQuery()
  const groupNames = groups.map((g) => g.name)

  const empty = {
    title: '',
    type: 'best_seller' as HomeSectionType,
    categoryGroup: '',
    showViewAll: true,
  }
  const [form, setForm] = useState(empty)
  const [productIds, setProductIds] = useState<string[]>([])
  const key = section === 'new' ? 'new' : s?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && section) {
    setLastKey(key)
    setForm(s ? { title: s.title, type: s.type, categoryGroup: s.categoryGroup || groupNames[0] || '', showViewAll: s.showViewAll } : empty)
    setProductIds(s?.productIds ?? [])
  }
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    await save({
      id: s?.id,
      title: form.title,
      type: form.type,
      categoryGroup: form.type === 'category_products' || form.type === 'category_grid' ? form.categoryGroup : '',
      productIds: form.type === 'manual_products' ? productIds : [],
      showViewAll: form.showViewAll,
    }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!section}
      onClose={onClose}
      title={isEdit ? 'Edit section' : 'Add section'}
      description={isEdit ? s?.title : 'Add a new row to the home feed.'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!form.title.trim()}>
            {isEdit ? 'Save changes' : 'Create section'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Section name" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Best Seller" autoFocus />
        <Select
          label="What it shows"
          value={form.type}
          onChange={(e) => set('type', e.target.value as HomeSectionType)}
          options={(Object.keys(TYPE_META) as HomeSectionType[]).map((t) => ({ label: TYPE_META[t].label, value: t }))}
        />

        {(form.type === 'category_products' || form.type === 'category_grid') && (
          <Select label="Category group" value={form.categoryGroup} onChange={(e) => set('categoryGroup', e.target.value)} placeholder="Select a group" options={groupNames.map((g) => ({ label: g, value: g }))} />
        )}

        {form.type === 'manual_products' && <ProductPicker selected={productIds} onChange={setProductIds} />}

        {form.type === 'best_seller' && (
          <p className="rounded-xl bg-mint-50 px-3 py-2.5 text-xs text-slate-500">
            Automatically shows your top-selling products. No manual selection needed.
          </p>
        )}

        <label className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2.5">
          <span className="text-sm font-medium text-slate-700">Show “View all” link</span>
          <Switch checked={form.showViewAll} onChange={(v) => set('showViewAll', v)} />
        </label>
      </div>
    </Modal>
  )
}

/** Searchable multi-select list of products for manual sections. */
function ProductPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 250)
  const { data: products = [], isLoading } = useGetProductsQuery({ search: debounced || undefined })

  const toggle = (id: string) =>
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id])

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">Pick products</label>
        <span className="text-xs font-semibold text-brand-600">{selected.length} selected</span>
      </div>
      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products…"
          className="focus-ring h-9 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm"
        />
      </div>
      <div className="max-h-60 space-y-1 overflow-y-auto rounded-xl border border-slate-100 p-1.5">
        {isLoading ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading…</p>
        ) : (
          products.map((p) => {
            const on = selected.includes(p.id)
            return (
              <button
                key={p.id}
                onClick={() => toggle(p.id)}
                className={cn('flex w-full items-center gap-2.5 rounded-lg p-2 text-left transition-colors', on ? 'bg-brand-50' : 'hover:bg-slate-50')}
              >
                <ProductThumb src={p.image} alt={p.name} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-700">{p.name}</p>
                  <p className="text-xs text-slate-400">{formatNPR(p.price)}</p>
                </div>
                <span className={cn('flex h-5 w-5 items-center justify-center rounded-md border', on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300')}>
                  {on && <Check className="h-3.5 w-3.5" />}
                </span>
              </button>
            )
          })
        )}
      </div>
    </div>
  )
}

function DeleteSection({ section, onClose }: { section: HomeSection | null; onClose: () => void }) {
  const [del, { isLoading }] = useDeleteHomeSectionMutation()
  const confirm = async () => {
    if (!section) return
    await del(section.id).unwrap()
    onClose()
  }
  return (
    <ConfirmDialog
      open={!!section}
      onClose={onClose}
      onConfirm={confirm}
      loading={isLoading}
      title="Delete section?"
      description={section ? `"${section.title}" will be removed from the home feed.` : undefined}
      confirmLabel="Delete section"
    />
  )
}
