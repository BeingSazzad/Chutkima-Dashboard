import { useState } from 'react'
import { Bell, MapPin, Store, Zap } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Switch } from '@/components/ui/Switch'
import { Select } from '@/components/ui/Select'
import { Avatar } from '@/components/shared/Avatar'
import { BRAND } from '@/lib/constants'
import { useAuth } from '@/hooks/useAuth'
import { useGetOpsConfigQuery, useSaveOpsConfigMutation } from '@/services/endpoints/settingsApi'

function DispatchCard() {
  const { data: ops } = useGetOpsConfigQuery()
  const [save] = useSaveOpsConfigMutation()
  if (!ops) return null
  return (
    <Card>
      <CardHeader title="Dispatch" subtitle="Multi-rider assignment" />
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

export default function SettingsPage() {
  const { user } = useAuth()

  return (
    <>
      <PageHeader title="Settings" description="Manage your profile and store configuration." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Profile" subtitle="Your admin account details" />
            <CardContent className="space-y-4 pt-2">
              <div className="flex items-center gap-4">
                <Avatar name={user?.name ?? 'Admin'} src={user?.avatar} size="lg" />
                <div>
                  <p className="font-bold text-slate-800">{user?.name}</p>
                  <p className="text-sm capitalize text-slate-400">{user?.role}</p>
                </div>
                <Button variant="outline" size="sm" className="ml-auto">Change photo</Button>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Full name" defaultValue={user?.name} />
                <Input label="Email" type="email" defaultValue={user?.email} />
                <Input label="Phone" defaultValue="+977 9800000000" />
                <Input label="Role" defaultValue={user?.role} disabled />
              </div>
              <div className="flex justify-end">
                <Button>Save changes</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Store configuration" subtitle="Dark store delivery settings" />
            <CardContent className="space-y-4 pt-2">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Input label="Store name" defaultValue={`${BRAND.name} · ${BRAND.city}`} leftIcon={<Store className="h-4 w-4" />} />
                <Input label="Service area" defaultValue="Traffic Chowk, Butwal" leftIcon={<MapPin className="h-4 w-4" />} />
                <Input label="Target delivery (mins)" type="number" defaultValue={10} leftIcon={<Zap className="h-4 w-4" />} />
                <Input label="Free delivery above (NPR)" type="number" defaultValue={800} />
              </div>
              <div className="flex justify-end">
                <Button>Update store</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <DispatchCard />

          <Card>
            <CardHeader title="Notifications" subtitle="What you get alerted about" />
            <CardContent className="divide-y divide-slate-50 pt-1">
              <Toggle label="New orders" description="Ping on every incoming order" />
              <Toggle label="Low stock alerts" description="When a product drops below 15" />
              <Toggle label="Driver offline" description="When a rider goes offline mid-shift" defaultOn={false} />
              <Toggle label="Daily summary" description="End-of-day performance email" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader title="Payments" subtitle="Accepted methods" />
            <CardContent className="space-y-2 pt-2">
              {['eSewa', 'Khalti', 'ConnectIPS', 'Cash on Delivery'].map((m) => (
                <div key={m} className="flex items-center justify-between rounded-xl bg-mint-50 px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <Bell className="h-4 w-4 text-brand-500" /> {m}
                  </span>
                  <span className="text-xs font-semibold text-success">Active</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
