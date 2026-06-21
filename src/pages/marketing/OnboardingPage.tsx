import { useState } from 'react'
import { Image as ImageIcon, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn } from '@/lib/utils'
import {
  useDeleteOnboardingSlideMutation,
  useGetOnboardingSlidesQuery,
  useSaveOnboardingSlideMutation,
  useToggleOnboardingSlideMutation,
} from '@/services/endpoints/onboardingApi'
import type { OnboardingSlide } from '@/types/common.types'

export default function OnboardingPage() {
  const { data: slides = [], isLoading } = useGetOnboardingSlidesQuery()
  const [toggle] = useToggleOnboardingSlideMutation()
  const [formFor, setFormFor] = useState<OnboardingSlide | 'new' | null>(null)
  const [deleteFor, setDeleteFor] = useState<OnboardingSlide | null>(null)

  return (
    <>
      <PageHeader
        title="Onboarding"
        description="Edit the intro slides new users see — image, title and subtitle."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormFor('new')}>
            Add slide
          </Button>
        }
      />

      {isLoading ? (
        <Spinner label="Loading slides…" className="py-24" />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {slides.map((s) => (
            <Card key={s.id} className={cn('overflow-hidden', !s.active && 'opacity-60')}>
              {/* Phone-style preview */}
              <div className="relative mx-auto mt-4 aspect-[9/16] w-40 overflow-hidden rounded-2xl bg-brand-800 ring-4 ring-slate-100">
                {s.image ? (
                  <img src={s.image} alt={s.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-white/40">
                    <ImageIcon className="h-8 w-8" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 text-center text-white">
                  <p className="text-[13px] font-extrabold leading-tight drop-shadow">{s.title}</p>
                  <p className="mt-1 line-clamp-3 text-[10px] leading-snug text-white/80 drop-shadow">{s.subtitle}</p>
                  <div className="mt-2 flex justify-center gap-1">
                    {slides.map((d) => (
                      <span key={d.id} className={cn('h-1 rounded-full', d.id === s.id ? 'w-3 bg-brand-400' : 'w-1 bg-white/50')} />
                    ))}
                  </div>
                </div>
                <span className="absolute left-2 top-2">
                  <Badge tone="bg-white/90 text-slate-700 ring-black/5">Slide {s.position}</Badge>
                </span>
              </div>

              <CardContent className="flex items-center justify-between gap-2 p-3">
                <span className="text-xs font-medium text-slate-500">{s.active ? 'Shown' : 'Hidden'}</span>
                <div className="flex items-center gap-0.5">
                  <button onClick={() => setFormFor(s)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => setDeleteFor(s)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Delete">
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <Switch checked={s.active} onChange={() => toggle(s.id)} aria-label={`Toggle slide ${s.position}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <SlideFormModal slide={formFor} onClose={() => setFormFor(null)} />
      <DeleteSlide slide={deleteFor} onClose={() => setDeleteFor(null)} />
    </>
  )
}

function SlideFormModal({ slide, onClose }: { slide: OnboardingSlide | 'new' | null; onClose: () => void }) {
  const [save, { isLoading }] = useSaveOnboardingSlideMutation()
  const isEdit = slide && slide !== 'new'
  const s = isEdit ? (slide as OnboardingSlide) : null

  const empty = { title: '', subtitle: '', image: '' }
  const [form, setForm] = useState(empty)
  const key = slide === 'new' ? 'new' : s?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && slide) {
    setLastKey(key)
    setForm(s ? { title: s.title, subtitle: s.subtitle, image: s.image } : empty)
  }
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    await save({ id: s?.id, ...form }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!slide}
      onClose={onClose}
      title={isEdit ? 'Edit slide' : 'Add slide'}
      description={isEdit ? `Slide ${s?.position}` : 'Create a new onboarding slide.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!form.title.trim()}>
            {isEdit ? 'Save changes' : 'Create slide'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <ImageUpload label="Background image" value={form.image} onChange={(v) => set('image', v)} aspectClassName="aspect-[9/16] w-40 mx-auto" hint="Full-screen portrait 9:16 · recommended 1080 × 1920 px." />
        <Input label="Title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Groceries in minutes, not hours" autoFocus />
        <Textarea label="Subtitle" value={form.subtitle} onChange={(e) => set('subtitle', e.target.value)} rows={3} placeholder="Supporting description shown under the title" />
      </div>
    </Modal>
  )
}

function DeleteSlide({ slide, onClose }: { slide: OnboardingSlide | null; onClose: () => void }) {
  const [del, { isLoading }] = useDeleteOnboardingSlideMutation()
  const confirm = async () => {
    if (!slide) return
    await del(slide.id).unwrap()
    onClose()
  }
  return (
    <ConfirmDialog
      open={!!slide}
      onClose={onClose}
      onConfirm={confirm}
      loading={isLoading}
      title="Delete slide?"
      description={slide ? `Slide "${slide.title}" will be removed from onboarding.` : undefined}
      confirmLabel="Delete slide"
    />
  )
}
