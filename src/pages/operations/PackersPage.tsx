import { useState } from 'react'
import { Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Avatar } from '@/components/shared/Avatar'
import {
  useDeletePackerMutation,
  useGetPackersQuery,
  useSavePackerMutation,
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
              <Phone className="h-3 w-3" /> {p.phone}
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
        description="Pick-and-pack staff at the dark store. No app login needed."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormFor('new')}>
            Add packer
          </Button>
        }
      />

      <Card>
        <DataTable columns={columns} data={packers} rowKey={(p) => p.id} loading={isLoading} emptyTitle="No packers yet" emptyDescription="Add a packer to assign orders for packing." />
      </Card>

      <PackerFormModal packer={formFor} onClose={() => setFormFor(null)} />
      <DeletePacker packer={deleteFor} onClose={() => setDeleteFor(null)} />
    </>
  )
}

function PackerFormModal({ packer, onClose }: { packer: Packer | 'new' | null; onClose: () => void }) {
  const [save, { isLoading }] = useSavePackerMutation()
  const isEdit = packer && packer !== 'new'
  const p = isEdit ? (packer as Packer) : null

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const key = packer === 'new' ? 'new' : p?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && packer) {
    setLastKey(key)
    setName(p?.name ?? '')
    setPhone(p?.phone ?? '')
  }

  const submit = async () => {
    await save({ id: p?.id, name, phone }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!packer}
      onClose={onClose}
      title={isEdit ? 'Edit packer' : 'Add packer'}
      description="Packers only need a name and phone number — no login."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!name.trim() || !phone.trim()}>
            {isEdit ? 'Save changes' : 'Add packer'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bimala Thapa" autoFocus />
        <Input label="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+977 98…" leftIcon={<Phone className="h-4 w-4" />} />
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
      description={packer ? `"${packer.name}" will be removed.` : undefined}
      confirmLabel="Remove packer"
    />
  )
}
