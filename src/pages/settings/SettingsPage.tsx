import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import { Tabs } from '@/components/ui/Tabs'
import { Avatar } from '@/components/shared/Avatar'
import { useAuth } from '@/hooks/useAuth'
import {
  useGetOperatingConfigQuery,
  useGetOpsConfigQuery,
  useGetReferralConfigQuery,
  useGetStoreSetupQuery,
  useGetSystemControlsQuery,
  useGetTrustConfigQuery,
  useSaveOperatingConfigMutation,
  useSaveOpsConfigMutation,
  useSaveReferralConfigMutation,
  useSaveStoreSetupMutation,
  useSaveSystemControlsMutation,
  useSaveTrustConfigMutation,
  type StoreSetup,
  type ReferralConfig,
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

function ReferralCard() {
  const { data } = useGetReferralConfigQuery()
  const [save, { isLoading }] = useSaveReferralConfigMutation()
  const [form, setForm] = useState<ReferralConfig | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) setForm(data)
  }, [data])

  if (!form) return null
  const set = (k: keyof ReferralConfig, v: number | boolean) => setForm((f) => (f ? { ...f, [k]: v } : f))
  const dirty = data ? JSON.stringify(form) !== JSON.stringify(data) : false
  const num = (k: keyof ReferralConfig, label: string) => (
    <Input label={label} type="number" value={form[k] as number} onChange={(e) => set(k, Number(e.target.value) || 0)} />
  )

  const onSave = async () => {
    await save(form).unwrap()
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <Card>
      <CardHeader title="Referral programme" subtitle="Reward existing & new customers" />
      <CardContent className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Enable referrals</p>
            <p className="text-xs text-slate-400">Customers can share their code</p>
          </div>
          <Switch checked={form.enabled} onChange={(v) => set('enabled', v)} aria-label="Referrals" />
        </div>
        {form.enabled && (
          <>
            <p className="pt-1 text-xs font-bold uppercase tracking-wide text-slate-400">New customer (referee)</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {num('refereeDiscountPct', 'Discount %')}
              {num('refereeMaxDiscount', 'Max NPR')}
              {num('refereeMinCart', 'Min cart NPR')}
            </div>
            <p className="pt-1 text-xs font-bold uppercase tracking-wide text-slate-400">Referrer (existing)</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {num('referrerCreditPct', 'Wallet credit %')}
              {num('referrerMaxCredit', 'Max NPR')}
            </div>
          </>
        )}
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

function OperatingHoursCard() {
  const { data } = useGetOperatingConfigQuery()
  const [save] = useSaveOperatingConfigMutation()
  if (!data) return null
  const set = (patch: Partial<typeof data>) => save({ ...data, ...patch })
  const timeField = (label: string, key: 'openTime' | 'lastOrderCutoff' | 'closeTime' | 'firstSlotNextDay') => (
    <div>
      <label className="mb-1 block text-xs font-medium text-slate-500">{label}</label>
      <input
        type="time"
        value={data[key]}
        onChange={(e) => set({ [key]: e.target.value } as Partial<typeof data>)}
        className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
      />
    </div>
  )
  return (
    <Card>
      <CardHeader title="Operating hours" subtitle="Service window + scheduled delivery" />
      <CardContent className="space-y-3 pt-2">
        <div className="grid grid-cols-2 gap-3">
          {timeField('Open time', 'openTime')}
          {timeField('Last order cutoff', 'lastOrderCutoff')}
          {timeField('Close time', 'closeTime')}
          {timeField('First slot next day', 'firstSlotNextDay')}
        </div>
        <Select
          label="Scheduled slot interval"
          value={String(data.slotIntervalMin)}
          onChange={(e) => set({ slotIntervalMin: Number(e.target.value) })}
          options={[10, 15, 30].map((n) => ({ label: `${n} min`, value: String(n) }))}
        />
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Scheduled delivery</p>
            <p className="text-xs text-slate-400">Let customers pre-book after-hours orders</p>
          </div>
          <Switch checked={data.scheduledDeliveryEnabled} onChange={(v) => set({ scheduledDeliveryEnabled: v })} aria-label="Scheduled delivery" />
        </div>
        <Textarea
          label="After-hours popup message (Nepali)"
          defaultValue={data.afterHoursMessage}
          rows={3}
          onBlur={(e) => set({ afterHoursMessage: e.target.value })}
        />
      </CardContent>
    </Card>
  )
}

function SystemControlsCard() {
  const { data } = useGetSystemControlsQuery()
  const [save] = useSaveSystemControlsMutation()
  if (!data) return null
  const set = (patch: Partial<typeof data>) => save({ ...data, ...patch })
  return (
    <Card>
      <CardHeader title="System controls" subtitle="Master switches for the whole service" />
      <CardContent className="space-y-3 pt-2">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-slate-800">Service offline</p>
            <p className="text-xs text-slate-400">Stop taking orders; customers see a closure message</p>
          </div>
          <Switch checked={data.serviceOffline} onChange={(v) => set({ serviceOffline: v })} aria-label="Service offline" />
        </div>
        {data.serviceOffline && (
          <Textarea label="Closure message (shown to customers)" defaultValue={data.offlineMessage} rows={2} onBlur={(e) => set({ offlineMessage: e.target.value })} />
        )}
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Training mode</p>
            <p className="text-xs text-slate-400">Test orders & flows without real transactions</p>
          </div>
          <Switch checked={data.trainingMode} onChange={(v) => set({ trainingMode: v })} aria-label="Training mode" />
        </div>
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">Force app update</p>
            <p className="text-xs text-slate-400">Require the minimum version before ordering</p>
          </div>
          <Switch checked={data.forceUpdate} onChange={(v) => set({ forceUpdate: v })} aria-label="Force update" />
        </div>
        {data.forceUpdate && (
          <Input label="Minimum app version" defaultValue={data.minAppVersion} onBlur={(e) => set({ minAppVersion: e.target.value })} placeholder="e.g. 1.2.0" />
        )}
        <div className="flex items-center justify-between gap-4 border-t border-slate-100 pt-3">
          <div>
            <p className="text-sm font-semibold text-slate-800">WhatsApp admin alert</p>
            <p className="text-xs text-slate-400">Notify admins on WhatsApp for every new order</p>
          </div>
          <Switch checked={data.whatsappAdminAlert} onChange={(v) => set({ whatsappAdminAlert: v })} aria-label="WhatsApp admin alert" />
        </div>
        {data.whatsappAdminAlert && (
          <Input label="Admin WhatsApp number" defaultValue={data.adminWhatsappNumber} onBlur={(e) => set({ adminWhatsappNumber: e.target.value })} placeholder="+977 98XXXXXXXX" />
        )}
      </CardContent>
    </Card>
  )
}

function ProfileCard() {
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
  )
}

function NotificationsCard() {
  return (
    <Card>
      <CardHeader title="Notifications" subtitle="What you get alerted about" />
      <CardContent className="divide-y divide-slate-50 pt-1">
        <Toggle label="New orders" description="Ping on every incoming order" />
        <Toggle label="Low stock alerts" description="When a product drops below its threshold" />
        <Toggle label="Driver offline" description="When a rider goes offline mid-shift" defaultOn={false} />
        <Toggle label="Daily summary" description="End-of-day performance email" />
      </CardContent>
    </Card>
  )
}

const SETTINGS_TABS = [
  { label: 'Profile', value: 'profile' },
  { label: 'Operations', value: 'operations' },
  { label: 'Store & Billing', value: 'billing' },
  { label: 'Customers', value: 'customers' },
  { label: 'System', value: 'system' },
]

export default function SettingsPage() {
  const [tab, setTab] = useState('profile')

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and store configuration." />

      <Card className="mb-4">
        <div className="overflow-x-auto px-3 pt-2">
          <Tabs items={SETTINGS_TABS} value={tab} onChange={setTab} />
        </div>
      </Card>

      {tab === 'profile' && (
        <div className="max-w-2xl">
          <ProfileCard />
        </div>
      )}

      {tab === 'operations' && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <DispatchCard />
          <OperatingHoursCard />
        </div>
      )}

      {tab === 'billing' && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <StoreSetupCard />
          <ReferralCard />
        </div>
      )}

      {tab === 'customers' && (
        <div className="max-w-2xl">
          <TrustCard />
        </div>
      )}

      {tab === 'system' && (
        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          <SystemControlsCard />
          <NotificationsCard />
        </div>
      )}
    </>
  )
}
