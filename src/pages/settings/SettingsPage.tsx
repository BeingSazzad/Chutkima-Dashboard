import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/shared/Avatar'
import { useAuth } from '@/hooks/useAuth'
import {
  useGetOpsConfigQuery,
  useGetStoreSetupQuery,
  useGetTrustConfigQuery,
  useSaveOpsConfigMutation,
  useSaveStoreSetupMutation,
  useSaveTrustConfigMutation,
  type StoreSetup,
} from '@/services/endpoints/settingsApi'
import { COD_MODE_LABEL, type CodMode } from '@/lib/trust'

function DispatchCard() {
  const { data: ops } = useGetOpsConfigQuery()
  const [save] = useSaveOpsConfigMutation()
  if (!ops) return null
  return (
    <Card>
      <CardHeader title="Dispatch & finance" subtitle="Multi-rider assignment · fuel allowance" />
      <CardContent className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Allow multiple riders</p>
            <p className="text-xs text-slate-400">Split one order across several riders</p>
          </div>
          <Switch checked={ops.multiRiderEnabled} onChange={(v) => save({ ...ops, multiRiderEnabled: v })} aria-label="Multi-rider" />
        </div>
        {ops.multiRiderEnabled && (
          <Select
            label="Max riders per order"
            value={String(ops.maxRiders)}
            onChange={(e) => save({ ...ops, maxRiders: Number(e.target.value) })}
            options={[2, 3, 4].map((n) => ({ label: String(n), value: String(n) }))}
          />
        )}
        <div className="border-t border-slate-100 pt-3">
          <Input
            label="Rider fuel rate (NPR per km)"
            type="number"
            defaultValue={ops.fuelRatePerKm}
            onBlur={(e) => save({ ...ops, fuelRatePerKm: Number(e.target.value) || 0 })}
            hint="Used to auto-calculate each rider's fuel allowance."
          />
        </div>
      </CardContent>
    </Card>
  )
}

function Toggle({ label, description, defaultOn = true }: { label: string; description: string; defaultOn?: boolean }) {
  const [on, setOn] = useState(defaultOn)
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
      <Switch checked={on} onChange={setOn} aria-label={label} />
    </div>
  )
}

function SaveButton({ label }: { label: string }) {
  const [saved, setSaved] = useState(false)
  return (
    <div className="flex items-center gap-2">
      {saved && (
        <span className="flex items-center gap-1 text-xs font-semibold text-success">
          <Check className="h-3.5 w-3.5" /> Saved
        </span>
      )}
      <Button
        onClick={() => {
          setSaved(true)
          setTimeout(() => setSaved(false), 1800)
        }}
      >
        {label}
      </Button>
    </div>
  )
}

function TrustCard() {
  const { data } = useGetTrustConfigQuery()
  const [save] = useSaveTrustConfigMutation()
  if (!data) return null
  const set = (patch: Partial<typeof data>) => save({ ...data, ...patch })
  return (
    <Card>
      <CardHeader title="Customer Trust" subtitle="COD reliability badges & restriction" />
      <CardContent className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Trust badge system</p>
            <p className="text-xs text-slate-400">Flag risky COD customers automatically</p>
          </div>
          <Switch checked={data.enabled} onChange={(v) => set({ enabled: v })} aria-label="Trust system" />
        </div>
        {data.enabled && (
          <>
            <Select
              label="COD restriction for flagged customers"
              value={data.codMode}
              onChange={(e) => set({ codMode: e.target.value as CodMode })}
              options={(Object.keys(COD_MODE_LABEL) as CodMode[]).map((m) => ({ label: COD_MODE_LABEL[m], value: m }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Gray: COD cancels ≥" type="number" defaultValue={data.grayCod} onBlur={(e) => set({ grayCod: Number(e.target.value) || 0 })} />
              <Input label="Red: COD cancels ≥" type="number" defaultValue={data.redCod} onBlur={(e) => set({ redCod: Number(e.target.value) || 0 })} />
              <Input label="Gray: no-response ≥" type="number" defaultValue={data.grayNoResp} onBlur={(e) => set({ grayNoResp: Number(e.target.value) || 0 })} />
              <Input label="Red: no-response ≥" type="number" defaultValue={data.redNoResp} onBlur={(e) => set({ redNoResp: Number(e.target.value) || 0 })} />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

function StoreSetupCard() {
  const { data } = useGetStoreSetupQuery()
  const [save, { isLoading }] = useSaveStoreSetupMutation()
  const [form, setForm] = useState<StoreSetup | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  if (!form) return null
  const set = (k: keyof StoreSetup, v: string | number) => setForm((f) => (f ? { ...f, [k]: v } : f))
  const dirty = data ? JSON.stringify(form) !== JSON.stringify(data) : false

  const onSave = async () => {
    await save(form).unwrap()
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <Card>
      <CardHeader title="Store setup" subtitle="Company details printed on every invoice" />
      <CardContent className="space-y-3 pt-2">
        <Input label="Company name" value={form.companyName} onChange={(e) => set('companyName', e.target.value)} />
        <Input label="Address" value={form.address} onChange={(e) => set('address', e.target.value)} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Phone" value={form.phone} onChange={(e) => set('phone', e.target.value)} />
          <Input label="Email" type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
          <Input label="PAN / VAT / TRN number" value={form.taxNumber} onChange={(e) => set('taxNumber', e.target.value)} />
          <Input label="VAT / Tax %" type="number" value={form.vatPercent} onChange={(e) => set('vatPercent', Number(e.target.value) || 0)} />
        </div>
        <div className="flex items-center justify-end gap-2">
          {saved && (
            <span className="flex items-center gap-1 text-xs font-semibold text-success">
              <Check className="h-3.5 w-3.5" /> Saved
            </span>
          )}
          <Button onClick={onSave} loading={isLoading} disabled={!dirty}>Save changes</Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [avatar, setAvatar] = useState<string | undefined>(undefined)
  const fileRef = useRef<HTMLInputElement>(null)

  const pickPhoto = (file?: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and store configuration." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Profile" subtitle="Your admin account details" />
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <Avatar name={user?.name ?? 'Admin'} src={avatar ?? user?.avatar} size="lg" />
                <div>
                  <p className="font-bold text-slate-800">{user?.name}</p>
                  <p className="text-sm capitalize text-slate-400">{user?.role}</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
                <Button variant="outline" size="sm" className="ml-auto" onClick={() => fileRef.current?.click()}>Change photo</Button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Full name" defaultValue={user?.name} />
                <Input label="Email" type="email" defaultValue={user?.email} />
                <Input label="Phone" defaultValue="+977 9800000000" />
                <Input label="Role" defaultValue={user?.role} disabled />
              </div>
              <div className="flex justify-end">
                <SaveButton label="Save changes" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <DispatchCard />
          <StoreSetupCard />
          <TrustCard />

          <Card>
            <CardHeader title="Notifications" subtitle="What you get alerted about" />
            <CardContent className="divide-y divide-slate-50 pt-1">
              <Toggle label="New orders" description="Ping on every incoming order" />
              <Toggle label="Low stock alerts" description="When a product drops below its threshold" />
              <Toggle label="Driver offline" description="When a rider goes offline mid-shift" defaultOn={false} />
              <Toggle label="Daily summary" description="End-of-day performance email" />
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
