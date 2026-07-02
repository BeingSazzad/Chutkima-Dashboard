import { useState } from 'react'
import { Mail, Pencil, Phone, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Tabs, type TabItem } from '@/components/ui/Tabs'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Switch } from '@/components/ui/Switch'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Avatar } from '@/components/shared/Avatar'
import { SearchableMultiSelect } from '@/components/ui/SearchableMultiSelect'
import { timeAgo } from '@/lib/utils'
import {
  useDeleteAdminMutation,
  useGetAdminsQuery,
  useSaveAdminMutation,
  useToggleAdminMutation,
} from '@/services/endpoints/adminsApi'
import { useGetStoresQuery } from '@/services/endpoints/storesApi'
import { useGetRolesQuery } from '@/services/endpoints/rolesApi'
import { RolesPanel } from './RolesPanel'
import type { AdminUser } from '@/types/common.types'

/** Badge tones for built-in roles; custom roles fall back to slate. */
const ROLE_TONE: Record<string, string> = {
  admin: 'bg-brand-50 text-brand-700 ring-brand-600/15',
  manager: 'bg-blue-50 text-blue-700 ring-blue-600/15',
  dispatcher: 'bg-amber-50 text-amber-700 ring-amber-600/15',
}
const roleTone = (id: string) => ROLE_TONE[id] ?? 'bg-slate-100 text-slate-600 ring-slate-500/15'

export default function AdminsPage() {
  const { data: admins = [], isLoading } = useGetAdminsQuery()
  const { data: stores = [] } = useGetStoresQuery()
  const { data: roles = [] } = useGetRolesQuery()
  const roleName = (id: string) => roles.find((r) => r.id === id)?.name ?? id
  const [toggle] = useToggleAdminMutation()
  const [tab, setTab] = useState<'team' | 'roles'>('team')
  const [formFor, setFormFor] = useState<AdminUser | 'new' | null>(null)
  const [deleteFor, setDeleteFor] = useState<AdminUser | null>(null)
  const [roleAddOpen, setRoleAddOpen] = useState(false)
  const storeNames = (a: AdminUser) => {
    const ids = a.storeIds ?? (a.storeId ? [a.storeId] : [])
    if (ids.length === 0) return 'All stores (master)'
    return ids.map((id) => stores.find((s) => s.id === id)?.name ?? '—').join(', ')
  }

  const tabs: TabItem[] = [
    { label: 'Team', value: 'team', count: admins.length },
    { label: 'Roles & Permissions', value: 'roles', count: roles.length },
  ]

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'Member',
      cell: (a) => (
        <div className="flex items-center gap-3">
          <Avatar name={a.name} src={a.avatar} />
          <div className="min-w-0">
            <p className="font-semibold text-slate-800">{a.name}</p>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Mail className="h-3 w-3" /> {a.email}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      cell: (a) => <Badge tone={roleTone(a.role)}>{roleName(a.role)}</Badge>,
    },
    { key: 'store', header: 'Store', cell: (a) => <span className="text-slate-600">{storeNames(a)}</span> },
    {
      key: 'phone',
      header: 'Phone',
      cell: (a) => (
        <span className="flex items-center gap-1 text-slate-600">
          <Phone className="h-3 w-3 text-slate-400" /> {a.phone || '—'}
        </span>
      ),
    },
    { key: 'last', header: 'Last active', cell: (a) => <span className="text-slate-500">{timeAgo(a.lastActiveAt)}</span> },
    {
      key: 'active',
      header: 'Active',
      cell: (a) => <Switch checked={a.active} onChange={() => toggle(a.id)} size="sm" aria-label={`Toggle ${a.name}`} />,
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (a) => (
        <div className="flex items-center justify-end gap-0.5">
          <button onClick={() => setFormFor(a)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteFor(a)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Remove">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Admins & Roles"
        description="Manage who can access this dashboard and what each role can do."
        actions={
          tab === 'team' ? (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormFor('new')}>
              Add admin
            </Button>
          ) : (
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setRoleAddOpen(true)}>
              Add role
            </Button>
          )
        }
      />

      <div className="mb-4">
        <Tabs items={tabs} value={tab} onChange={(v) => setTab(v as 'team' | 'roles')} />
      </div>

      {tab === 'team' ? (
        <Card>
          <DataTable columns={columns} data={admins} rowKey={(a) => a.id} loading={isLoading} emptyTitle="No team members yet" />
        </Card>
      ) : (
        <RolesPanel addOpen={roleAddOpen} onAddClose={() => setRoleAddOpen(false)} />
      )}

      <AdminFormModal admin={formFor} stores={stores} onClose={() => setFormFor(null)} />
      <DeleteAdmin admin={deleteFor} onClose={() => setDeleteFor(null)} />
    </>
  )
}

function AdminFormModal({ admin, stores, onClose }: { admin: AdminUser | 'new' | null; stores: { id: string; name: string }[]; onClose: () => void }) {
  const [save, { isLoading }] = useSaveAdminMutation()
  const { data: roles = [] } = useGetRolesQuery()
  const isEdit = admin && admin !== 'new'
  const a = isEdit ? (admin as AdminUser) : null

  const empty = { name: '', email: '', phone: '', role: 'dispatcher', storeIds: [] as string[] }
  const [form, setForm] = useState(empty)
  const key = admin === 'new' ? 'new' : a?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && admin) {
    setLastKey(key)
    setForm(a ? { name: a.name, email: a.email, phone: a.phone, role: a.role, storeIds: a.storeIds ?? (a.storeId ? [a.storeId] : []) } : empty)
  }
  const set = (k: keyof Omit<typeof form, 'storeIds'>, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    await save({ id: a?.id, name: form.name, email: form.email, phone: form.phone, role: form.role, storeIds: form.storeIds }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!admin}
      onClose={onClose}
      title={isEdit ? 'Edit member' : 'Add admin'}
      description={isEdit ? a?.email : 'Invite a new team member to the dashboard.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!form.name.trim() || !form.email.trim()}>
            {isEdit ? 'Save changes' : 'Add admin'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Full name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Prakash Thapa" autoFocus />
        <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="name@chutkima.com" leftIcon={<Mail className="h-4 w-4" />} />
        <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+977 98…" leftIcon={<Phone className="h-4 w-4" />} />
        <Select label="Role" value={form.role} onChange={(e) => set('role', e.target.value)} options={roles.map((r) => ({ label: r.name, value: r.id }))} />
        <SearchableMultiSelect
          label="Dark stores"
          placeholder="Select dark stores (master if empty)..."
          options={stores.map((s) => ({ label: s.name, value: s.id }))}
          selectedValues={form.storeIds}
          onChange={(vals) => setForm((f) => ({ ...f, storeIds: vals }))}
        />
        {roles.find((r) => r.id === form.role)?.description && (
          <p className="rounded-xl bg-mint-50 px-3 py-2.5 text-xs text-slate-500">
            {roles.find((r) => r.id === form.role)!.description}
          </p>
        )}
      </div>
    </Modal>
  )
}

function DeleteAdmin({ admin, onClose }: { admin: AdminUser | null; onClose: () => void }) {
  const [del, { isLoading }] = useDeleteAdminMutation()
  const confirm = async () => {
    if (!admin) return
    await del(admin.id).unwrap()
    onClose()
  }
  return (
    <ConfirmDialog
      open={!!admin}
      onClose={onClose}
      onConfirm={confirm}
      loading={isLoading}
      title="Remove team member?"
      description={admin ? `"${admin.name}" will lose access to the dashboard immediately.` : undefined}
      confirmLabel="Remove access"
    />
  )
}
