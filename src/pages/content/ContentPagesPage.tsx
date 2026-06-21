import { useEffect, useState } from 'react'
import { Check, FileText, Pencil, Plus, Settings2, Trash2, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { Tabs } from '@/components/ui/Tabs'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { cn, timeAgo } from '@/lib/utils'
import {
  useAddFaqSectionMutation,
  useDeleteFaqMutation,
  useDeleteFaqSectionMutation,
  useGetContentPagesQuery,
  useGetFaqSectionsQuery,
  useGetFaqsQuery,
  useSaveContentPageMutation,
  useSaveFaqMutation,
  useToggleFaqMutation,
} from '@/services/endpoints/cmsApi'
import type { ContentPage, FaqItem } from '@/types/common.types'

export default function ContentPagesPage() {
  const [tab, setTab] = useState('pages')

  return (
    <>
      <PageHeader title="Content" description="Edit legal pages and FAQs shown across the customer app." />
      <Card>
        <div className="px-3 pt-2">
          <Tabs
            items={[
              { label: 'Pages', value: 'pages' },
              { label: 'FAQ', value: 'faq' },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        <CardContent>{tab === 'pages' ? <PagesEditor /> : <FaqManager />}</CardContent>
      </Card>
    </>
  )
}

// ── Content pages editor ──────────────────────────────────────────────────────
function PagesEditor() {
  const { data: pages = [], isLoading } = useGetContentPagesQuery()
  const [save, { isLoading: saving }] = useSaveContentPageMutation()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [saved, setSaved] = useState(false)

  const active: ContentPage | undefined = pages.find((p) => p.id === selectedId) ?? pages[0]

  useEffect(() => {
    if (active) {
      setSelectedId(active.id)
      setTitle(active.title)
      setBody(active.body)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.id])

  if (isLoading) return <Spinner label="Loading pages…" className="py-16" />

  const dirty = active && (title !== active.title || body !== active.body)

  const onSave = async () => {
    if (!active) return
    await save({ id: active.id, title, body }).unwrap()
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr]">
      <ul className="space-y-1">
        {pages.map((p) => (
          <li key={p.id}>
            <button
              onClick={() => setSelectedId(p.id)}
              className={cn(
                'flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors',
                active?.id === p.id ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span className="truncate">{p.title}</span>
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div className="space-y-3">
          <Input label="Page title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Textarea label="Content" value={body} onChange={(e) => setBody(e.target.value)} rows={14} hint="Plain text / markdown. Line breaks are preserved on the app." />
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Last updated {timeAgo(active.updatedAt)}</span>
            <div className="flex items-center gap-2">
              {saved && (
                <span className="flex items-center gap-1 text-xs font-semibold text-success">
                  <Check className="h-3.5 w-3.5" /> Saved
                </span>
              )}
              <Button onClick={onSave} loading={saving} disabled={!dirty}>Save changes</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── FAQ manager ───────────────────────────────────────────────────────────────
function FaqManager() {
  const { data: faqs = [], isLoading } = useGetFaqsQuery()
  const { data: sections = [] } = useGetFaqSectionsQuery()
  const [toggle] = useToggleFaqMutation()
  const [formFor, setFormFor] = useState<FaqItem | 'new' | null>(null)
  const [deleteFor, setDeleteFor] = useState<FaqItem | null>(null)
  const [sectionsOpen, setSectionsOpen] = useState(false)
  const [filter, setFilter] = useState<string>('all')

  if (isLoading) return <Spinner label="Loading FAQs…" className="py-16" />

  const shown = filter === 'all' ? faqs : faqs.filter((f) => f.section === filter)
  const filterTabs = [
    { label: 'All Questions', value: 'all', count: faqs.length },
    ...sections.map((s) => ({ label: s.name, value: s.name, count: faqs.filter((f) => f.section === s.name).length })),
  ]

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm text-slate-500">{shown.length} questions</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" leftIcon={<Settings2 className="h-3.5 w-3.5" />} onClick={() => setSectionsOpen(true)}>
            Manage sections
          </Button>
          <Button size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setFormFor('new')}>
            Add FAQ
          </Button>
        </div>
      </div>

      <Tabs items={filterTabs} value={filter} onChange={setFilter} className="mb-3" />

      <div className="space-y-2">
        {shown.map((f) => (
          <div key={f.id} className={cn('rounded-xl border border-slate-100 p-4', !f.active && 'opacity-60')}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-slate-800">{f.question}</p>
                  <Badge tone="bg-brand-50 text-brand-700 ring-brand-600/15">{f.section}</Badge>
                  {!f.active && <Badge>Hidden</Badge>}
                </div>
                <p className="mt-1 text-sm text-slate-500">{f.answer}</p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button onClick={() => setFormFor(f)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => setDeleteFor(f)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
                <Switch checked={f.active} onChange={() => toggle(f.id)} size="sm" aria-label={`Toggle ${f.question}`} />
              </div>
            </div>
          </div>
        ))}
        {shown.length === 0 && <p className="py-8 text-center text-sm text-slate-400">No questions in this section yet.</p>}
      </div>

      <FaqFormModal faq={formFor} sections={sections.map((s) => s.name)} onClose={() => setFormFor(null)} />
      <DeleteFaq faq={deleteFor} onClose={() => setDeleteFor(null)} />
      <SectionsModal open={sectionsOpen} onClose={() => setSectionsOpen(false)} />
    </div>
  )
}

function FaqFormModal({ faq, sections, onClose }: { faq: FaqItem | 'new' | null; sections: string[]; onClose: () => void }) {
  const [save, { isLoading }] = useSaveFaqMutation()
  const isEdit = faq && faq !== 'new'
  const f = isEdit ? (faq as FaqItem) : null

  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [section, setSection] = useState('')
  const key = faq === 'new' ? 'new' : f?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && faq) {
    setLastKey(key)
    setQuestion(f?.question ?? '')
    setAnswer(f?.answer ?? '')
    setSection(f?.section ?? sections[0] ?? 'General')
  }

  const submit = async () => {
    await save({ id: f?.id, question, answer, section }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!faq}
      onClose={onClose}
      title={isEdit ? 'Edit FAQ' : 'Add FAQ'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!question.trim() || !section}>
            {isEdit ? 'Save changes' : 'Add FAQ'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="e.g. How fast is delivery?" autoFocus />
        <Textarea label="Answer" value={answer} onChange={(e) => setAnswer(e.target.value)} rows={4} placeholder="Write a clear answer…" />
        <Select
          label="Section"
          value={section}
          onChange={(e) => setSection(e.target.value)}
          placeholder="Select a section"
          options={sections.map((s) => ({ label: s, value: s }))}
        />
        <p className="text-xs text-slate-400">Need a new section? Use “Manage sections”.</p>
      </div>
    </Modal>
  )
}

function SectionsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: sections = [] } = useGetFaqSectionsQuery()
  const { data: faqs = [] } = useGetFaqsQuery()
  const [add, { isLoading: adding }] = useAddFaqSectionMutation()
  const [del] = useDeleteFaqSectionMutation()
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    try {
      await add(trimmed).unwrap()
      setName('')
      setError('')
    } catch {
      setError('That section already exists.')
    }
  }

  const remove = async (id: string, used: number) => {
    if (used > 0) return
    await del(id).unwrap()
  }

  return (
    <Modal open={open} onClose={onClose} title="FAQ sections" description="Add or remove the sections customers filter FAQs by.">
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input value={name} onChange={(e) => { setName(e.target.value); setError('') }} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="New section name, e.g. Account" error={error} />
          </div>
          <Button onClick={submit} loading={adding} disabled={!name.trim()} leftIcon={<Plus className="h-4 w-4" />}>
            Add
          </Button>
        </div>

        <div className="space-y-1.5">
          {sections.map((s) => {
            const used = faqs.filter((f) => f.section === s.name).length
            return (
              <div key={s.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5">
                <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  {s.name}
                  <Badge>{used}</Badge>
                </span>
                <button
                  onClick={() => remove(s.id, used)}
                  disabled={used > 0}
                  title={used > 0 ? 'Move its FAQs first' : 'Delete section'}
                  className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label={`Delete ${s.name}`}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </Modal>
  )
}

function DeleteFaq({ faq, onClose }: { faq: FaqItem | null; onClose: () => void }) {
  const [del, { isLoading }] = useDeleteFaqMutation()
  const confirm = async () => {
    if (!faq) return
    await del(faq.id).unwrap()
    onClose()
  }
  return (
    <ConfirmDialog
      open={!!faq}
      onClose={onClose}
      onConfirm={confirm}
      loading={isLoading}
      title="Delete FAQ?"
      description={faq ? `"${faq.question}" will be removed.` : undefined}
      confirmLabel="Delete FAQ"
    />
  )
}
