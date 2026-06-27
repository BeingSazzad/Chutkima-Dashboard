import { useState } from 'react'
import { Check, Plus, ShieldCheck, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Spinner } from '@/components/ui/Spinner'
import { NAV_SECTIONS } from '@/components/layout/navConfig'
import { useDeleteRoleMutation, useGetRolesQuery, useSaveRoleMutation } from '@/services/endpoints/rolesApi'
import { cn } from '@/lib/utils'
import type { Role } from '@/types/common.types'

const MODULES = NAV_SECTIONS.flatMap((s) => s.items.map((i) => ({ key: i.to, label: i.label, section: s.title })))

export default function RolesPage() {
  const { data: roles = [], isLoading } = useGetRolesQuery()
  const [saveRole] = useSaveRoleMutation()
  const [deleteRole] = useDeleteRoleMutation()
  const [addOpen, setAddOpen] = useState(false)
  const [newName, setNewName] = useState('')
  const [deleteFor, setDeleteFor] = useState<Role | null>(null)

  const isFull = (r: Role) => r.modules.includes('*')
  const has = (r: Role, key: string) => isFull(r) || r.modules.includes(key)

  const toggle = (r: Role, key: string) => {
    if (isFull(r)) return
    const modules = has(r, key) ? r.modules.filter((m) => m !== key) : [...r.modules, key]
    saveRole({ id: r.id, modules })
  }
  const toggleField = (r: Role, field: 'canExport' | 'canExportCustomers') => {
    if (isFull(r)) return
    saveRole({ id: r.id, [field]: !r[field] })
  }
  const addRole = async () => {
    if (!newName.trim()) return
    await saveRole({ name: newName.trim(), modules: ['/'], canExport: false, canExportCustomers: false }).unwrap()
    setNewName('')
    setAddOpen(false)
  }
  const confirmDelete = async () => {
    if (deleteFor) await deleteRole(deleteFor.id).unwrap()
    setDeleteFor(null)
  }

  const Cell = ({ on, locked, onClick }: { on: boolean; locked?: boolean; onClick: () => void }) => (
    <td className="px-2 py-1.5 text-center">
      <button
        onClick={onClick}
        disabled={locked}
        className={cn(
          'inline-flex h-5 w-5 items-center justify-center rounded-md border transition-colors',
          on ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 bg-white hover:border-brand-400',
          locked && 'opacity-60',
        )}
        aria-label={on ? 'Allowed' : 'Denied'}
      >
        {on && <Check className="h-3.5 w-3.5" />}
      </button>
    </td>
  )

  let lastSection = ''

  return (
    <>
      <PageHeader
        title="Roles & Permissions"
        description="Create roles and control which modules and exports each role can access."
        actions={
          <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>
            Add role
          </Button>
        }
      />

      <Card className="overflow-x-auto">
        {isLoading ? (
          <Spinner label="Loading roles…" className="py-16" />
        ) : (
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="sticky left-0 z-10 bg-white px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">Module</th>
                {roles.map((r) => (
                  <th key={r.id} className="px-2 py-3 text-center align-bottom">
                    <div className="flex flex-col items-center gap-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        {r.system && <ShieldCheck className="h-3.5 w-3.5 text-brand-500" />}
                        {r.name}
                      </span>
                      {r.system ? (
                        <span className="text-[10px] font-medium uppercase text-slate-300">built-in</span>
                      ) : (
                        <button onClick={() => setDeleteFor(r)} className="focus-ring rounded p-0.5 text-slate-300 hover:text-danger" aria-label={`Delete ${r.name}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {MODULES.map((m) => {
                const showSection = m.section !== lastSection
                lastSection = m.section
                return (
                  <tr key={m.key} className="border-b border-slate-50 hover:bg-slate-50/60">
                    <td className="sticky left-0 z-10 bg-white px-4 py-1.5">
                      {showSection && <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-300">{m.section}</p>}
                      <span className="font-medium text-slate-700">{m.label}</span>
                    </td>
                    {roles.map((r) => (
                      <Cell key={r.id} on={has(r, m.key)} locked={isFull(r)} onClick={() => toggle(r, m.key)} />
                    ))}
                  </tr>
                )
              })}
              <tr className="border-t-2 border-slate-200 bg-mint-50/40">
                <td className="sticky left-0 z-10 bg-mint-50/40 px-4 py-2 font-semibold text-slate-700">Export data (CSV)</td>
                {roles.map((r) => (
                  <Cell key={r.id} on={isFull(r) || r.canExport} locked={isFull(r)} onClick={() => toggleField(r, 'canExport')} />
                ))}
              </tr>
              <tr className="bg-mint-50/40">
                <td className="sticky left-0 z-10 bg-mint-50/40 px-4 py-2 font-semibold text-slate-700">
                  Export customer data <span className="text-xs font-normal text-slate-400">(PII)</span>
                </td>
                {roles.map((r) => (
                  <Cell key={r.id} on={isFull(r) || r.canExportCustomers} locked={isFull(r)} onClick={() => toggleField(r, 'canExportCustomers')} />
                ))}
              </tr>
            </tbody>
          </table>
        )}
      </Card>

      <p className="mt-3 text-xs text-slate-400">
        Super Admin always has full access. Changes apply immediately — a role only sees the modules ticked here, and export
        buttons appear only where the role is allowed.
      </p>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add role"
        description="Create a custom role, then tick the modules it can access."
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button onClick={addRole} disabled={!newName.trim()}>Create role</Button>
          </>
        }
      >
        <Input label="Role name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Customer Support" autoFocus />
      </Modal>

      <ConfirmDialog
        open={!!deleteFor}
        onClose={() => setDeleteFor(null)}
        onConfirm={confirmDelete}
        title="Delete role?"
        description={deleteFor ? `"${deleteFor.name}" will be removed. Admins with this role should be reassigned.` : undefined}
        confirmLabel="Delete role"
      />
    </>
  )
}
