import { useEffect, useState } from 'react'
import { Check, MessageCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Avatar } from '@/components/shared/Avatar'
import {
  useDeletePackerMutation,
  useGetPackerTemplateQuery,
  useGetPackersQuery,
  useSavePackerMutation,
  useSavePackerTemplateMutation,
  useTogglePackerMutation,
} from '@/services/endpoints/packersApi'
import type { Packer } from '@/types/common.types'

export default function PackersPage() {
  const { data: packers = [], isLoading } = useGetPackersQuery()
  const [toggle] = useTogglePackerMutation()
  const [formFor, setFormFor] = useState<Packer | 'new' | null>(null)
  const [deleteFor, setDeleteFor] = useState<Packer | null>(null)

  const columns: Column<Packer>[] = [
    {
      key: 'name',
      header: 'Packer',
      cell: (p) => (
        <div className="flex items-center gap-3">
          <Avatar name={p.name} />
          <div>
            <p className="font-semibold text-slate-800">{p.name}</p>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <MessageCircle className="h-3 w-3" /> {p.whatsapp}
            </p>
          </div>
        </div>
      ),
    },
    { key: 'today', header: 'Packed today', cell: (p) => <span className="font-semibold text-slate-700">{p.packedToday}</span> },
    { key: 'active', header: 'Active', cell: (p) => <Switch checked={p.active} onChange={() => toggle(p.id)} size="sm" aria-label={`Toggle ${p.name}`} /> },
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
        title="Packers"
        description="Pick-and-pack staff. No app login — they get order pick-lists on WhatsApp."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormFor('new')}>
            Add packer
          </Button>
        }
      />

      <Card className="mb-4">
        <DataTable columns={columns} data={packers} rowKey={(p) => p.id} loading={isLoading} emptyTitle="No packers yet" emptyDescription="Add a packer to assign orders for packing." />
      </Card>

      <TemplateEditor />

      <PackerFormModal packer={formFor} onClose={() => setFormFor(null)} />
      <DeletePacker packer={deleteFor} onClose={() => setDeleteFor(null)} />
    </>
  )
}

function TemplateEditor() {
  const { data } = useGetPackerTemplateQuery()
  const [save, { isLoading }] = useSavePackerTemplateMutation()
  const [value, setValue] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) setValue(data.value)
  }, [data])

  const onSave = async () => {
    await save(value).unwrap()
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <Card>
      <CardHeader title="WhatsApp pick-list template" subtitle="Sent to the packer when an order is assigned." />
      <CardContent className="space-y-3 pt-2">
        <Textarea value={value} onChange={(e) => setValue(e.target.value)} rows={6} className="font-mono text-xs" />
        <p className="text-xs text-slate-400">
          Placeholders: <span className="font-mono">{'{orderNo} {customer} {address} {items} {skuCount} {unitCount}'}</span>. Each item line includes SKU, name, shelf, qty and unit price.
        </p>
        <div className="flex items-center justify-end gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-success">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <Button onClick={onSave} loading={isLoading} disabled={!value.trim()}>Save template</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PackerFormModal({ packer, onClose }: { packer: Packer | 'new' | null; onClose: () => void }) {
  const [save, { isLoading }] = useSavePackerMutation()
  const isEdit = packer && packer !== 'new'
  const p = isEdit ? (packer as Packer) : null

  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const key = packer === 'new' ? 'new' : p?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && packer) {
    setLastKey(key)
    setName(p?.name ?? '')
    setWhatsapp(p?.whatsapp ?? '')
  }

  const submit = async () => {
    await save({ id: p?.id, name, whatsapp }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!packer}
      onClose={onClose}
      title={isEdit ? 'Edit packer' : 'Add packer'}
      description="Packers need only a name and WhatsApp number — no login."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!name.trim() || !whatsapp.trim()}>
            {isEdit ? 'Save changes' : 'Add packer'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bimala Thapa" autoFocus />
        <Input label="WhatsApp number" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="+977 98…" leftIcon={<MessageCircle className="h-4 w-4" />} />
      </div>
    </Modal>
  )
}

function DeletePacker({ packer, onClose }: { packer: Packer | null; onClose: () => void }) {
  const [del, { isLoading }] = useDeletePackerMutation()
  const confirm = async () => {
    if (!packer) return
    await del(packer.id).unwrap()
    onClose()
  }
  return (
    <ConfirmDialog
      open={!!packer}
      onClose={onClose}
      onConfirm={confirm}
      loading={isLoading}
      title="Remove packer?"
      description={packer ? `"${packer.name}" will no longer receive pick-lists.` : undefined}
      confirmLabel="Remove packer"
    />
  )
}
