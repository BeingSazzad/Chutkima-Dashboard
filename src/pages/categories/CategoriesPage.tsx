import { useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, FolderPlus, Layers, Pencil, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Spinner } from '@/components/ui/Spinner'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { Switch } from '@/components/ui/Switch'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ImageUpload } from '@/components/ui/ImageUpload'
import {
  useDeleteCategoryGroupMutation,
  useDeleteCategoryMutation,
  useGetCategoriesQuery,
  useGetCategoryGroupsQuery,
  useMoveCategoryMutation,
  useSaveCategoryGroupMutation,
  useSaveCategoryMutation,
  useToggleCategoryMutation,
} from '@/services/endpoints/categoriesApi'
import type { Category, CategoryGroup } from '@/types/common.types'

interface NewCat {
  group: string
}

export default function CategoriesPage() {
  const { data: categories = [], isLoading } = useGetCategoriesQuery()
  const { data: groups = [] } = useGetCategoryGroupsQuery()
  const [toggle] = useToggleCategoryMutation()
  const [move] = useMoveCategoryMutation()
  const [editing, setEditing] = useState<Category | NewCat | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [groupForm, setGroupForm] = useState<CategoryGroup | 'new' | null>(null)
  const [groupDelete, setGroupDelete] = useState<CategoryGroup | null>(null)

  const groupNames = groups.map((g) => g.name)
  const buckets = useMemo(() => {
    const map = new Map<string, Category[]>()
    for (const c of categories) map.set(c.group, [...(map.get(c.group) ?? []), c])
    for (const [g, list] of map) map.set(g, [...list].sort((a, b) => a.position - b.position))
    return map
  }, [categories])

  const columns: Column<Category>[] = [
    {
      key: 'order',
      header: '',
      cell: (c) => {
        const siblings = buckets.get(c.group) ?? []
        const i = siblings.findIndex((x) => x.id === c.id)
        return (
          <div className="flex flex-col">
            <button
              disabled={i <= 0}
              onClick={() => move({ id: c.id, direction: 'up' })}
              className="focus-ring rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
              aria-label="Move up"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </button>
            <button
              disabled={i === siblings.length - 1}
              onClick={() => move({ id: c.id, direction: 'down' })}
              className="focus-ring rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-30"
              aria-label="Move down"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </button>
          </div>
        )
      },
    },
    {
      key: 'name',
      header: 'Category',
      cell: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-mint-100 text-lg">
            {c.image ? <img src={c.image} alt={c.name} className="h-full w-full object-cover" /> : c.emoji}
          </div>
          <span className="font-semibold text-slate-800">{c.name}</span>
        </div>
      ),
    },
    { key: 'products', header: 'Products', cell: (c) => <span className="text-slate-600">{c.productCount}</span> },
    {
      key: 'status',
      header: 'Visible',
      cell: (c) => <Switch checked={c.active} onChange={() => toggle(c.id)} size="sm" aria-label={`Toggle ${c.name}`} />,
    },
    {
      key: 'actions',
      header: '',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (c) => (
        <div className="flex items-center justify-end gap-0.5">
          <button onClick={() => setEditing(c)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label={`Edit ${c.name}`}>
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleting(c)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label={`Delete ${c.name}`}>
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Categories"
        description="Create a group first, then add categories inside it. Step 1 → Add group · Step 2 → Add category."
        actions={
          <>
            <Button variant="outline" leftIcon={<FolderPlus className="h-4 w-4" />} onClick={() => setGroupForm('new')}>
              Add group
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setEditing({ group: groupNames[0] ?? '' })} disabled={groupNames.length === 0}>
              Add category
            </Button>
          </>
        }
      />

      {isLoading ? (
        <Spinner label="Loading categories…" className="py-24" />
      ) : groups.length === 0 ? (
        <Card className="py-12">
          <EmptyState
            title="No category groups yet"
            description="Groups are the top-level sections (e.g. Grocery & Kitchen). Create one, then add categories inside it."
            icon={<Layers className="h-6 w-6" />}
            action={<Button leftIcon={<FolderPlus className="h-4 w-4" />} onClick={() => setGroupForm('new')}>Add your first group</Button>}
          />
        </Card>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => {
            const items = buckets.get(group.name) ?? []
            return (
              <Card key={group.id}>
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800">{group.name}</h2>
                    <Badge>{items.length}</Badge>
                    {!group.active && <Badge tone="bg-slate-100 text-slate-500 ring-slate-500/15">Hidden</Badge>}
                    <button onClick={() => setGroupForm(group)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label={`Edit ${group.name}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => setGroupDelete(group)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label={`Delete ${group.name}`}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Button variant="secondary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setEditing({ group: group.name })}>
                    Add category
                  </Button>
                </div>
                <DataTable
                  columns={columns}
                  data={items}
                  rowKey={(c) => c.id}
                  emptyTitle="No categories in this group"
                  emptyDescription="Use “Add category” to put one here."
                />
              </Card>
            )
          })}
        </div>
      )}

      <CategoryFormModal editing={editing} groups={groupNames} onClose={() => setEditing(null)} />
      <DeleteCategory category={deleting} onClose={() => setDeleting(null)} />
      <GroupFormModal group={groupForm} onClose={() => setGroupForm(null)} />
      <DeleteGroup group={groupDelete} count={groupDelete ? (buckets.get(groupDelete.name)?.length ?? 0) : 0} onClose={() => setGroupDelete(null)} />
    </>
  )
}

function isExistingCategory(v: Category | NewCat | null): v is Category {
  return !!v && 'id' in v
}

function CategoryFormModal({
  editing,
  groups,
  onClose,
}: {
  editing: Category | NewCat | null
  groups: string[]
  onClose: () => void
}) {
  const [save, { isLoading }] = useSaveCategoryMutation()
  const isEdit = isExistingCategory(editing)
  const c = isEdit ? editing : null

  const [name, setName] = useState('')
  const [group, setGroup] = useState('')
  const [emoji, setEmoji] = useState('📦')
  const [image, setImage] = useState('')

  const key = isEdit ? c!.id : editing ? `new:${(editing as NewCat).group}` : 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && editing) {
    setLastKey(key)
    setName(c?.name ?? '')
    setGroup(c?.group ?? (editing as NewCat).group ?? groups[0] ?? '')
    setEmoji(c?.emoji ?? '📦')
    setImage(c?.image ?? '')
  }

  const submit = async () => {
    await save({ id: c?.id, name, group, emoji: image ? '' : emoji, image }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!editing}
      onClose={onClose}
      title={isEdit ? 'Edit category' : 'Add category'}
      description={isEdit ? c?.name : group ? `New category in "${group}"` : 'Create a new category.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!name.trim() || !group}>
            {isEdit ? 'Save changes' : 'Create category'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <ImageUpload label="Category image" value={image} onChange={setImage} aspectClassName="aspect-square w-36 mx-auto" hint="Square image · recommended 400 × 400 px." />
        {image ? (
          <p className="rounded-lg bg-mint-50 px-3 py-2 text-xs text-slate-500">Image set — emoji is hidden when an image is used.</p>
        ) : (
          <Input label="Emoji (used when no image)" value={emoji} onChange={(e) => setEmoji(e.target.value)} className="w-24 text-center text-xl" maxLength={2} />
        )}
        <Input label="Category name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Fruits & Vegetables" autoFocus />
        <Select label="Group" value={group} onChange={(e) => setGroup(e.target.value)} placeholder="Select a group" options={groups.map((g) => ({ label: g, value: g }))} />
      </div>
    </Modal>
  )
}

function DeleteCategory({ category, onClose }: { category: Category | null; onClose: () => void }) {
  const [del, { isLoading }] = useDeleteCategoryMutation()
  const confirm = async () => {
    if (!category) return
    await del(category.id).unwrap()
    onClose()
  }
  return (
    <ConfirmDialog
      open={!!category}
      onClose={onClose}
      onConfirm={confirm}
      loading={isLoading}
      title="Delete category?"
      description={category ? `"${category.name}" will be removed from the storefront. Products are not deleted.` : undefined}
      confirmLabel="Delete category"
    />
  )
}

function GroupFormModal({ group, onClose }: { group: CategoryGroup | 'new' | null; onClose: () => void }) {
  const [save, { isLoading }] = useSaveCategoryGroupMutation()
  const isEdit = group && group !== 'new'
  const g = isEdit ? (group as CategoryGroup) : null

  const [name, setName] = useState('')
  const key = group === 'new' ? 'new' : g?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && group) {
    setLastKey(key)
    setName(g?.name ?? '')
  }

  const submit = async () => {
    await save({ id: g?.id, name }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!group}
      onClose={onClose}
      title={isEdit ? 'Edit group' : 'Add group'}
      description={isEdit ? 'Renaming updates every category in this group.' : 'A top-level section shown on the category screen (e.g. Grocery & Kitchen).'}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!name.trim()}>
            {isEdit ? 'Save changes' : 'Create group'}
          </Button>
        </>
      }
    >
      <Input label="Group name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grocery & Kitchen" autoFocus />
    </Modal>
  )
}

function DeleteGroup({ group, count, onClose }: { group: CategoryGroup | null; count: number; onClose: () => void }) {
  const [del, { isLoading }] = useDeleteCategoryGroupMutation()
  const blocked = count > 0
  const confirm = async () => {
    if (!group) return
    if (blocked) {
      onClose()
      return
    }
    await del(group.id).unwrap()
    onClose()
  }
  return (
    <ConfirmDialog
      open={!!group}
      onClose={onClose}
      onConfirm={confirm}
      loading={isLoading}
      title={blocked ? 'Move categories first' : 'Delete group?'}
      description={
        group
          ? blocked
            ? `"${group.name}" still has ${count} categor${count === 1 ? 'y' : 'ies'}. Move or delete them before removing the group.`
            : `"${group.name}" will be removed.`
          : undefined
      }
      confirmLabel={blocked ? 'OK' : 'Delete group'}
      destructive={!blocked}
    />
  )
}
