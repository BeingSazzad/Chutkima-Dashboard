import { lazy, Suspense, useEffect, useState } from 'react'
import { Check, Clock, ExternalLink, Hexagon, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react'

// Leaflet is heavy — load the map editor only when a geo-fence modal is opened.
const ZoneMapEditor = lazy(() =>
  import('@/components/zones/ZoneMapEditor').then((m) => ({ default: m.ZoneMapEditor })),
)
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Modal } from '@/components/ui/Modal'
import { Switch } from '@/components/ui/Switch'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import {
  useDeleteZoneMutation,
  useGetDeliveryConfigQuery,
  useGetZonesQuery,
  useSaveDeliveryConfigMutation,
  useSaveZoneMutation,
  useToggleZoneMutation,
} from '@/services/endpoints/deliveryApi'
import { useGetStoresQuery } from '@/services/endpoints/storesApi'
import type { DeliveryTier, Zone } from '@/types/common.types'

export default function DeliveryZonesPage() {
  const [formFor, setFormFor] = useState<Zone | 'new' | null>(null)
  const [deleteFor, setDeleteFor] = useState<Zone | null>(null)
  const [fenceFor, setFenceFor] = useState<Zone | null>(null)

  return (
    <>
      <PageHeader title="Delivery & Zones" description="Control delivery fees, the free-delivery threshold and which areas you serve." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FeeConfigCard />
        <ZonesCard onAdd={() => setFormFor('new')} onEdit={setFormFor} onDelete={setDeleteFor} onFence={setFenceFor} />
      </div>

      <ZoneFormModal zone={formFor} onClose={() => setFormFor(null)} />
      <GeofenceModal zone={fenceFor} onClose={() => setFenceFor(null)} />
      <DeleteZone zone={deleteFor} onClose={() => setDeleteFor(null)} />
    </>
  )
}

// ── Fee config ────────────────────────────────────────────────────────────────
function FeeConfigCard() {
  const { data: config, isLoading } = useGetDeliveryConfigQuery()
  const [save, { isLoading: saving }] = useSaveDeliveryConfigMutation()
  const [freeAbove, setFreeAbove] = useState('')
  const [tiers, setTiers] = useState<DeliveryTier[]>([])
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (config) {
      setFreeAbove(String(config.freeAbove))
      setTiers(config.tiers)
    }
  }, [config])

  const setTier = (i: number, key: keyof DeliveryTier, v: string) =>
    setTiers((t) => t.map((row, idx) => (idx === i ? { ...row, [key]: Number(v) || 0 } : row)))
  const addTier = () => setTiers((t) => [...t, { minOrder: 0, fee: 0 }])
  const removeTier = (i: number) => setTiers((t) => t.filter((_, idx) => idx !== i))

  const onSave = async () => {
    await save({ freeAbove: Number(freeAbove) || 0, tiers }).unwrap()
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <Card>
      <CardHeader title="Delivery fee" subtitle="Tiered fee by cart value — higher tiers override lower ones." />
      <CardContent className="space-y-4 pt-2">
        {isLoading ? (
          <Spinner label="Loading…" className="py-10" />
        ) : (
          <>
            <Input
              label="Free delivery above (NPR)"
              type="number"
              value={freeAbove}
              onChange={(e) => setFreeAbove(e.target.value)}
              hint="Orders at or above this value ship free."
            />

            <div>
              <p className="mb-2 text-sm font-medium text-slate-700">Fee tiers</p>
              <div className="space-y-2">
                {tiers.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2 text-sm">
                      <span className="text-slate-400">Order ≥</span>
                      <input
                        type="number"
                        value={t.minOrder}
                        onChange={(e) => setTier(i, 'minOrder', e.target.value)}
                        className="focus-ring w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                      />
                      <span className="text-slate-400">→ fee</span>
                      <input
                        type="number"
                        value={t.fee}
                        onChange={(e) => setTier(i, 'fee', e.target.value)}
                        className="focus-ring w-20 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm"
                      />
                      <span className="text-slate-400">NPR</span>
                    </div>
                    <button onClick={() => removeTier(i)} className="focus-ring rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Remove tier">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <Button variant="ghost" size="sm" className="mt-2" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={addTier}>
                Add tier
              </Button>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
              {saved && (
                <span className="flex items-center gap-1 text-xs font-semibold text-success">
                  <Check className="h-3.5 w-3.5" /> Saved
                </span>
              )}
              <Button onClick={onSave} loading={saving}>Save fees</Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

// ── Zones ─────────────────────────────────────────────────────────────────────
function ZonesCard({
  onAdd,
  onEdit,
  onDelete,
  onFence,
}: {
  onAdd: () => void
  onEdit: (z: Zone) => void
  onDelete: (z: Zone) => void
  onFence: (z: Zone) => void
}) {
  const { data: zones = [], isLoading } = useGetZonesQuery()
  const { data: stores = [] } = useGetStoresQuery()
  const [toggle] = useToggleZoneMutation()
  const storeName = (id?: string) => stores.find((s) => s.id === id)?.name

  return (
    <Card>
      <CardHeader
        title="Service zones"
        subtitle={`${zones.filter((z) => z.active).length} active areas · auto-routed to dark stores`}
        action={
          <Button variant="secondary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={onAdd}>
            Add zone
          </Button>
        }
      />
      <CardContent className="space-y-2 pt-2">
        {isLoading ? (
          <Spinner label="Loading zones…" className="py-10" />
        ) : (
          zones.map((z) => (
            <div key={z.id} className="flex items-start gap-3 rounded-xl border border-slate-100 px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-mint-100 text-brand-600">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-800">{z.name}</p>
                  {z.mapLink && (
                    <a href={z.mapLink} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="shrink-0 text-slate-400 hover:text-brand-600" title="Open map" aria-label="Open map">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
                <p className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {z.etaMins} min ETA</span>
                </p>
                {z.areas.length > 0 && <p className="mt-0.5 truncate text-xs text-slate-400">Covers: {z.areas.join(', ')}</p>}
                {/* Badges wrap under the meta so a paused/geo-fenced row never crushes the name column. */}
                <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                  {storeName(z.storeId) ? (
                    <Badge tone="bg-violet-50 text-violet-700 ring-violet-600/15">{storeName(z.storeId)}</Badge>
                  ) : (
                    <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/15">No store</Badge>
                  )}
                  {z.geofence.length >= 3 && <Badge tone="bg-brand-50 text-brand-700 ring-brand-600/15">Geo-fenced</Badge>}
                  {!z.active && <Badge>Paused</Badge>}
                </div>
              </div>
              {/* Action controls — fixed width, never shrink. */}
              <div className="flex shrink-0 items-center gap-0.5">
                <Switch checked={z.active} onChange={() => toggle(z.id)} size="sm" aria-label={`Toggle ${z.name}`} />
                <button onClick={() => onFence(z)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Geo-fence" title="Draw geo-fence">
                  <Hexagon className="h-4 w-4" />
                </button>
                <button onClick={() => onEdit(z)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Edit">
                  <Pencil className="h-4 w-4" />
                </button>
                <button onClick={() => onDelete(z)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Delete">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}

function ZoneFormModal({ zone, onClose }: { zone: Zone | 'new' | null; onClose: () => void }) {
  const [save, { isLoading }] = useSaveZoneMutation()
  const { data: stores = [] } = useGetStoresQuery()
  const isEdit = zone && zone !== 'new'
  const z = isEdit ? (zone as Zone) : null

  const empty = { name: '', etaMins: '12', areas: '', mapLink: '', storeId: '' }
  const [form, setForm] = useState(empty)
  const key = zone === 'new' ? 'new' : z?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && zone) {
    setLastKey(key)
    setForm(z ? { name: z.name, etaMins: String(z.etaMins), areas: z.areas.join(', '), mapLink: z.mapLink, storeId: z.storeId ?? '' } : empty)
  }
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    await save({
      id: z?.id,
      name: form.name,
      etaMins: Number(form.etaMins) || 12,
      areas: form.areas.split(',').map((a) => a.trim()).filter(Boolean),
      mapLink: form.mapLink.trim(),
      storeId: form.storeId || undefined,
    }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!zone}
      onClose={onClose}
      title={isEdit ? 'Edit zone' : 'Add zone'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!form.name.trim()}>
            {isEdit ? 'Save changes' : 'Add zone'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Zone name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Traffic Chowk" autoFocus />
        <div>
          <Select
            label="Dark store (order routing)"
            value={form.storeId}
            onChange={(e) => set('storeId', e.target.value)}
            placeholder="Select a dark store"
            options={stores.map((s) => ({ label: s.name, value: s.id }))}
          />
          <p className="mt-1 text-xs text-slate-400">Orders placed in this zone are automatically routed to this dark store.</p>
        </div>
        <Input label="Avg. ETA (min)" type="number" value={form.etaMins} onChange={(e) => set('etaMins', e.target.value)} hint="Delivery fee is set globally by cart-value tiers (left panel)." />
        <Input
          label="Covered areas"
          value={form.areas}
          onChange={(e) => set('areas', e.target.value)}
          placeholder="Traffic Chowk, Yogikuti, Hospital Line"
          hint="Comma-separated localities this zone serves."
        />
        <Input
          label="Map link (optional)"
          value={form.mapLink}
          onChange={(e) => set('mapLink', e.target.value)}
          placeholder="https://maps.google.com/?q=…"
          hint="Optional reference link. Draw the actual boundary with the geo-fence (hexagon) button."
        />
      </div>
    </Modal>
  )
}

function GeofenceModal({ zone, onClose }: { zone: Zone | null; onClose: () => void }) {
  const [save, { isLoading }] = useSaveZoneMutation()
  const [pts, setPts] = useState<[number, number][]>([])
  const key = zone?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && zone) {
    setLastKey(key)
    setPts(zone.geofence ?? [])
  }

  const submit = async () => {
    if (!zone) return
    await save({ id: zone.id, geofence: pts }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!zone}
      onClose={onClose}
      title={zone ? `Geo-fence — ${zone.name}` : 'Geo-fence'}
      description="Draw the delivery boundary on the map."
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={pts.length > 0 && pts.length < 3}>
            Save geo-fence
          </Button>
        </>
      }
    >
      <Suspense fallback={<Spinner label="Loading map…" className="py-16" />}>
        <ZoneMapEditor value={pts} onChange={setPts} />
      </Suspense>
    </Modal>
  )
}

function DeleteZone({ zone, onClose }: { zone: Zone | null; onClose: () => void }) {
  const [del, { isLoading }] = useDeleteZoneMutation()
  const confirm = async () => {
    if (!zone) return
    await del(zone.id).unwrap()
    onClose()
  }
  return (
    <ConfirmDialog
      open={!!zone}
      onClose={onClose}
      onConfirm={confirm}
      loading={isLoading}
      title="Delete zone?"
      description={zone ? `"${zone.name}" will no longer be serviceable.` : undefined}
      confirmLabel="Delete zone"
    />
  )
}
