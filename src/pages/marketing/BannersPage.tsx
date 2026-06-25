import { useMemo, useState } from 'react'
import { ExternalLink, Image as ImageIcon, Pencil, Play, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/utils'
import {
  useDeleteBannerMutation,
  useGetBannersQuery,
  useSaveBannerMutation,
  useToggleBannerMutation,
} from '@/services/endpoints/bannersApi'
import type { Banner, BannerMedia, BannerPlacement } from '@/types/common.types'

const MEDIA_OPTIONS = [
  { label: 'Image', value: 'image' },
  { label: 'Video', value: 'video' },
]

const PLACEMENTS: { key: BannerPlacement; label: string; hint: string; wide: boolean }[] = [
  { key: 'hero', label: 'Hero — big horizontal banner', hint: 'Large carousel at the top of Home', wide: true },
  { key: 'grid_small', label: 'Small grid banners', hint: 'Compact promo tiles lower on Home', wide: false },
  { key: 'category_strip', label: 'Category strip', hint: 'Inline strip between category rows', wide: true },
  { key: 'vertical', label: 'Vertical banners', hint: 'Tall portrait banners (story / side rail)', wide: false },
]

const PLACEMENT_LABEL: Record<BannerPlacement, string> = {
  hero: 'Hero',
  grid_small: 'Small grid',
  category_strip: 'Category strip',
  vertical: 'Vertical',
}

const SIZE_HINT: Record<BannerPlacement, string> = {
  hero: 'Wide 21:9 · recommended 1200 × 515 px',
  grid_small: 'Recommended 600 × 400 px (3:2)',
  category_strip: 'Wide strip · recommended 1000 × 360 px',
  vertical: 'Portrait 3:4 · recommended 720 × 960 px',
}

/** Preview aspect ratio per placement. */
const aspectFor = (p: BannerPlacement) =>
  p === 'vertical' ? 'aspect-[3/4]' : p === 'grid_small' ? 'aspect-[16/9]' : 'aspect-[21/9]'

export default function BannersPage() {
  const { data: banners = [], isLoading } = useGetBannersQuery()
  const [toggle] = useToggleBannerMutation()
  const [formFor, setFormFor] = useState<Banner | 'new' | null>(null)
  const [deleteFor, setDeleteFor] = useState<Banner | null>(null)

  const byPlacement = useMemo(() => {
    const map = new Map<BannerPlacement, Banner[]>()
    for (const b of banners) map.set(b.placement, [...(map.get(b.placement) ?? []), b])
    return map
  }, [banners])

  return (
    <>
      <PageHeader
        title="Banners"
        description="Manage promotional banners shown on the customer app's home screen."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormFor('new')}>
            Add banner
          </Button>
        }
      />

      <PlacementGuide />

      {isLoading ? (
        <Spinner label="Loading banners…" className="py-24" />
      ) : (
        <div className="space-y-8">
          {PLACEMENTS.map(({ key, label, hint, wide }) => {
            const items = byPlacement.get(key) ?? []
            return (
              <section key={key}>
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-slate-800">{label}</h2>
                      <Badge>{items.length}</Badge>
                    </div>
                    <p className="text-xs text-slate-400">{hint}</p>
                  </div>
                  <Button variant="ghost" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setFormFor('new')}>
                    Add
                  </Button>
                </div>

                {items.length === 0 ? (
                  <Card className="border-dashed py-8">
                    <p className="text-center text-sm text-slate-400">No banners in this slot yet.</p>
                  </Card>
                ) : (
                  <div
                    className={cn(
                      'grid gap-4',
                      key === 'vertical'
                        ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5'
                        : wide
                          ? 'grid-cols-1 lg:grid-cols-2'
                          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
                    )}
                  >
                    {items.map((b) => (
                      <Card key={b.id} className={cn('overflow-hidden', !b.active && 'opacity-60')}>
                        <div className={cn('relative w-full overflow-hidden bg-mint-100', aspectFor(b.placement))}>
                          {b.image ? (
                            <img src={b.image} alt={b.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full items-center justify-center text-brand-300">
                              {b.mediaType === 'video' ? <Play className="h-8 w-8" /> : <ImageIcon className="h-8 w-8" />}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                          {b.mediaType === 'video' && (
                            <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-bold text-white">
                              <Play className="h-3 w-3" /> Video
                            </span>
                          )}
                          <div className="absolute bottom-0 left-0 p-3 text-white">
                            <p className="text-sm font-bold drop-shadow">{b.title}</p>
                            <p className="line-clamp-1 text-xs text-white/80 drop-shadow">{b.subtitle}</p>
                          </div>
                          <span className="absolute right-2 top-2">
                            <Badge tone="bg-white/90 text-slate-700 ring-black/5">#{b.position}</Badge>
                          </span>
                        </div>
                        <CardContent className="flex items-center justify-between gap-2 p-3">
                          <span className="flex min-w-0 items-center gap-1 text-xs text-slate-400">
                            <ExternalLink className="h-3 w-3 shrink-0" />
                            <span className="truncate">{b.ctaLabel} → {b.ctaLink}</span>
                          </span>
                          <div className="flex shrink-0 items-center gap-0.5">
                            <button onClick={() => setFormFor(b)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Edit">
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => setDeleteFor(b)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Delete">
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <Switch checked={b.active} onChange={() => toggle(b.id)} aria-label={`Toggle ${b.title}`} />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>
      )}

      <BannerFormModal banner={formFor} onClose={() => setFormFor(null)} />
      <DeleteBanner banner={deleteFor} onClose={() => setDeleteFor(null)} />
    </>
  )
}

/** Visual cheat-sheet: which placement shows where on the customer home screen. */
function PlacementGuide() {
  return (
    <Card className="mb-6">
      <CardContent className="grid grid-cols-1 gap-5 p-5 md:grid-cols-[200px_1fr]">
        {/* Mini phone wireframe */}
        <div className="mx-auto w-44 rounded-2xl border border-slate-200 bg-white p-2 shadow-sm">
          <div className="rounded-lg bg-brand-600 px-2 py-1.5 text-[8px] font-bold text-white">Search…</div>
          <div className="mt-1.5 flex gap-1">
            {['All', 'Dairy', 'Snacks'].map((t) => (
              <span key={t} className="rounded-full bg-mint-100 px-1.5 py-0.5 text-[7px] font-semibold text-brand-700">{t}</span>
            ))}
          </div>
          <div className="mt-1.5 flex h-12 items-center justify-center rounded-lg bg-brand-500 text-[8px] font-bold text-white ring-2 ring-brand-300">
            1 · HERO
          </div>
          <div className="mt-1.5 grid grid-cols-4 gap-1">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-square rounded bg-slate-100" />
            ))}
          </div>
          <div className="mt-1.5 flex h-7 items-center justify-center rounded-lg bg-amber-200 text-[8px] font-bold text-amber-800">
            3 · CATEGORY STRIP
          </div>
          <div className="mt-1.5 grid grid-cols-2 gap-1">
            <div className="flex h-9 items-center justify-center rounded bg-blue-200 text-[7px] font-bold text-blue-800">2 · SMALL</div>
            <div className="flex h-9 items-center justify-center rounded bg-blue-200 text-[7px] font-bold text-blue-800">2 · SMALL</div>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-800">Where each banner appears</h3>
          {[
            { n: '1', dot: 'bg-brand-500', label: 'Hero', desc: 'Big full-width carousel right under the search bar — your headline promotion.' },
            { n: '2', dot: 'bg-blue-400', label: 'Small grid', desc: 'Compact promo tiles lower on the home screen, shown two-per-row.' },
            { n: '3', dot: 'bg-amber-400', label: 'Category strip', desc: 'A wide strip slotted between category rows for a secondary offer.' },
          ].map((p) => (
            <div key={p.n} className="flex items-start gap-2.5">
              <span className={cn('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white', p.dot)}>{p.n}</span>
              <p className="text-sm text-slate-600">
                <span className="font-semibold text-slate-800">{p.label}</span> — {p.desc}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function BannerFormModal({ banner, onClose }: { banner: Banner | 'new' | null; onClose: () => void }) {
  const [save, { isLoading }] = useSaveBannerMutation()
  const isEdit = banner && banner !== 'new'
  const b = isEdit ? (banner as Banner) : null

  const empty = { title: '', subtitle: '', image: '', mediaType: 'image' as BannerMedia, video: '', placement: 'hero' as BannerPlacement, ctaLabel: 'Shop now', ctaLink: '/' }
  const [form, setForm] = useState(empty)
  const key = banner === 'new' ? 'new' : b?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && banner) {
    setLastKey(key)
    setForm(
      b
        ? { title: b.title, subtitle: b.subtitle, image: b.image, mediaType: b.mediaType ?? 'image', video: b.video ?? '', placement: b.placement, ctaLabel: b.ctaLabel, ctaLink: b.ctaLink }
        : empty,
    )
  }
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    await save({ id: b?.id, ...form }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!banner}
      onClose={onClose}
      title={isEdit ? 'Edit banner' : 'Add banner'}
      description={isEdit ? b?.title : 'Create a promotional banner.'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!form.title.trim()}>
            {isEdit ? 'Save changes' : 'Create banner'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Select label="Media type" value={form.mediaType} onChange={(e) => set('mediaType', e.target.value)} options={MEDIA_OPTIONS} />
          <Select
            label="Placement"
            value={form.placement}
            onChange={(e) => set('placement', e.target.value)}
            options={PLACEMENTS.map((p) => ({ label: PLACEMENT_LABEL[p.key], value: p.key }))}
          />
        </div>
        {form.mediaType === 'video' ? (
          <>
            <Input label="Video URL" value={form.video} onChange={(e) => set('video', e.target.value)} placeholder="https://…/banner.mp4" />
            <ImageUpload label="Poster image (optional)" value={form.image} onChange={(v) => set('image', v)} aspectClassName={aspectFor(form.placement)} hint="Shown before the video plays" />
          </>
        ) : (
          <ImageUpload label="Banner image" value={form.image} onChange={(v) => set('image', v)} aspectClassName={aspectFor(form.placement)} hint={SIZE_HINT[form.placement]} />
        )}
        <Input label="Title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Mother's Pride" autoFocus />
        <Textarea label="Subtitle" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} rows={2} placeholder="Short supporting line" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Button label" value={form.ctaLabel} onChange={(e) => set('ctaLabel', e.target.value)} placeholder="Shop now" />
          <Input label="Button link" value={form.ctaLink} onChange={(e) => set('ctaLink', e.target.value)} placeholder="/category/dairy" />
        </div>
      </div>
    </Modal>
  )
}

function DeleteBanner({ banner, onClose }: { banner: Banner | null; onClose: () => void }) {
  const [del, { isLoading }] = useDeleteBannerMutation()
  const confirm = async () => {
    if (!banner) return
    await del(banner.id).unwrap()
    onClose()
  }
  return (
    <ConfirmDialog
      open={!!banner}
      onClose={onClose}
      onConfirm={confirm}
      loading={isLoading}
      title="Delete banner?"
      description={banner ? `"${banner.title}" will stop showing on the app immediately.` : undefined}
      confirmLabel="Delete banner"
    />
  )
}
