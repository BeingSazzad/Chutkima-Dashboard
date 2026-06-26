import { useMemo, useState } from 'react'
import { Bike, CheckCircle2, Download, Eye, Pencil, Phone, Plus, PowerOff, Search, Star, Trash2, Truck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { Modal } from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ImageUpload } from '@/components/ui/ImageUpload'
import { Avatar } from '@/components/shared/Avatar'
import { StatCard } from '@/components/shared/StatCard'
import { DriverStatusBadge } from '@/components/shared/StatusBadge'
import { openInNewTab } from '@/lib/utils'
import { downloadCSV } from '@/lib/export'
import { DRIVER_ACCOUNT_META, DRIVER_STATUS_META } from '@/lib/constants'
import { useDebounce } from '@/hooks/useDebounce'
import {
  useDeleteDriverMutation,
  useGetDriversQuery,
  useSaveDriverMutation,
  useSetDriverStatusMutation,
} from '@/services/endpoints/driversApi'
import { useGetOrdersQuery } from '@/services/endpoints/ordersApi'
import { ROUTES } from '@/constants/routes'
import { ZONES } from '@/lib/constants'
import type { Driver, DriverStatus } from '@/types/common.types'

export default function DriversPage() {
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)
  const [formFor, setFormFor] = useState<Driver | 'new' | null>(null)
  const [deleteFor, setDeleteFor] = useState<Driver | null>(null)

  const { data: drivers = [], isLoading } = useGetDriversQuery({
    status: (status as DriverStatus) || undefined,
    search: debounced || undefined,
  })
  const { data: allDrivers = [] } = useGetDriversQuery()
  const { data: orders = [] } = useGetOrdersQuery()
  const [setDriverStatus] = useSetDriverStatusMutation()

  const counts = useMemo(
    () => ({
      available: allDrivers.filter((d) => d.status === 'available').length,
      onDelivery: allDrivers.filter((d) => d.status === 'on_delivery').length,
      offline: allDrivers.filter((d) => d.status === 'offline').length,
    }),
    [allDrivers],
  )

  const orderRef = (id: string | null) => orders.find((o) => o.id === id)?.reference

  const exportCsv = () => {
    downloadCSV(
      'chutkima-riders.csv',
      drivers.map((d) => ({
        name: d.name,
        phone: d.phone,
        vehicle: d.vehicle,
        zone: d.zone,
        status: DRIVER_STATUS_META[d.status].label,
        account: DRIVER_ACCOUNT_META[d.accountStatus ?? 'active'].label,
        rating: d.rating.toString(),
        today: d.deliveriesToday.toString(),
        total: d.totalDeliveries.toString(),
        onTime: `${d.onTimeRate}%`,
        km: d.kmToday.toString(),
      })),
      [
        { key: 'name', label: 'Rider' },
        { key: 'phone', label: 'Phone' },
        { key: 'vehicle', label: 'Vehicle' },
        { key: 'zone', label: 'Zone' },
        { key: 'status', label: 'Status' },
        { key: 'account', label: 'Account' },
        { key: 'rating', label: 'Rating' },
        { key: 'today', label: 'Deliveries today' },
        { key: 'total', label: 'Total deliveries' },
        { key: 'onTime', label: 'On-time %' },
        { key: 'km', label: 'KM today' },
      ],
    )
  }

  const columns: Column<Driver>[] = [
    {
      key: 'rider',
      header: 'Rider',
      className: 'whitespace-nowrap',
      cell: (d) => (
        <div className="flex items-center gap-3">
          <Avatar name={d.name} src={d.avatar} />
          <div className="min-w-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                openInNewTab(ROUTES.driverDetail(d.id))
              }}
              className="focus-ring rounded font-semibold text-slate-800 hover:text-brand-700 hover:underline"
              title="Open rider details"
            >
              {d.name}
            </button>
            <p className="flex items-center gap-1 text-xs text-slate-400">
              <Phone className="h-3 w-3" /> {d.phone}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'vehicle',
      header: 'Vehicle',
      cell: (d) => (
        <span className="flex items-center gap-1.5 text-sm text-slate-600">
          <Bike className="h-3.5 w-3.5 text-brand-500" /> {d.vehicle}
        </span>
      ),
    },
    { key: 'status', header: 'Status', cell: (d) => <DriverStatusBadge status={d.status} /> },
    {
      key: 'active',
      header: 'Active order',
      cell: (d) =>
        d.activeOrderId ? (
          <button onClick={(e) => { e.stopPropagation(); openInNewTab(ROUTES.orderDetail(d.activeOrderId!)) }} className="text-sm font-semibold text-brand-600 hover:underline">
            {orderRef(d.activeOrderId) ?? 'On order'}
          </button>
        ) : (
          <span className="text-xs text-slate-300">—</span>
        ),
    },
    {
      key: 'rating',
      header: 'Rating',
      cell: (d) => (
        <span className="flex items-center gap-0.5 text-sm font-bold text-amber-500">
          <Star className="h-3.5 w-3.5 fill-amber-400" /> {d.rating}
        </span>
      ),
    },
    { key: 'today', header: 'Today', cell: (d) => <span className="font-semibold text-slate-700">{d.deliveriesToday}</span> },
    {
      key: 'ontime',
      header: 'On-time',
      cell: (d) => <Badge tone={d.onTimeRate >= 95 ? 'bg-green-50 text-green-700 ring-green-600/15' : 'bg-amber-50 text-amber-700 ring-amber-600/15'}>{d.onTimeRate}%</Badge>,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (d) => (
        <div className="flex items-center justify-end gap-0.5" onClick={(e) => e.stopPropagation()}>
          {d.status === 'offline' ? (
            <Button size="sm" variant="secondary" onClick={() => setDriverStatus({ id: d.id, status: 'available' })}>Set available</Button>
          ) : d.status === 'available' ? (
            <Button size="sm" variant="outline" onClick={() => setDriverStatus({ id: d.id, status: 'offline' })}>Set offline</Button>
          ) : null}
          <button onClick={() => openInNewTab(ROUTES.driverDetail(d.id))} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="View info">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => setFormFor(d)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-brand-600" aria-label="Edit">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => setDeleteFor(d)} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Delete">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Drivers"
        description="Your delivery fleet across Butwal. Assign riders from the Orders board."
        actions={
          <>
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={drivers.length === 0}>
              Export CSV
            </Button>
            <Button leftIcon={<Plus className="h-4 w-4" />} onClick={() => setFormFor('new')}>
              Add rider
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Available" value={counts.available} icon={<CheckCircle2 className="h-5 w-5" />} iconClass="bg-green-50 text-green-600" />
        <StatCard label="On delivery" value={counts.onDelivery} icon={<Truck className="h-5 w-5" />} iconClass="bg-brand-50 text-brand-600" />
        <StatCard label="Offline" value={counts.offline} icon={<PowerOff className="h-5 w-5" />} iconClass="bg-slate-100 text-slate-500" />
      </div>

      <Card className="my-4">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search riders by name or phone…"
              className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm"
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              placeholder="All statuses"
              options={[
                { label: 'Available', value: 'available' },
                { label: 'On delivery', value: 'on_delivery' },
                { label: 'Offline', value: 'offline' },
              ]}
            />
          </div>
        </div>
      </Card>

      <Card>
        <DataTable
          columns={columns}
          data={drivers}
          rowKey={(d) => d.id}
          onRowClick={(d) => openInNewTab(ROUTES.driverDetail(d.id))}
          loading={isLoading}
          emptyTitle="No riders found"
        />
      </Card>

      <DriverFormModal driver={formFor} onClose={() => setFormFor(null)} />
      <DeleteDriver driver={deleteFor} onClose={() => setDeleteFor(null)} />
    </>
  )
}

const VEHICLE_TYPES = ['Scooter', 'Bike', 'Bicycle', 'EV Scooter']

function DriverFormModal({ driver, onClose }: { driver: Driver | 'new' | null; onClose: () => void }) {
  const [save, { isLoading }] = useSaveDriverMutation()
  const isEdit = driver && driver !== 'new'
  const d = isEdit ? (driver as Driver) : null

  const empty = { name: '', phone: '', vehicleType: 'Scooter', plate: '', zone: ZONES[0] as string, licenseNo: '' }
  const [form, setForm] = useState(empty)
  const [photo, setPhoto] = useState('')
  const [licenseDoc, setLicenseDoc] = useState('')
  const [vehicleRegDoc, setVehicleRegDoc] = useState('')
  const key = driver === 'new' ? 'new' : d?.id ?? 'closed'
  const [lastKey, setLastKey] = useState('')
  if (key !== lastKey && driver) {
    setLastKey(key)
    if (d) {
      const [type, plate] = d.vehicle.split(' · ')
      setForm({ name: d.name, phone: d.phone, vehicleType: type || 'Scooter', plate: plate || '', zone: d.zone, licenseNo: d.licenseNo ?? '' })
      setPhoto(d.avatar && !d.avatar.startsWith('https://i.pravatar') ? d.avatar : '')
      setLicenseDoc(d.licenseDoc ?? '')
      setVehicleRegDoc(d.vehicleRegDoc ?? '')
    } else {
      setForm(empty)
      setPhoto('')
      setLicenseDoc('')
      setVehicleRegDoc('')
    }
  }
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    const vehicle = form.plate.trim() ? `${form.vehicleType} · ${form.plate.trim()}` : form.vehicleType
    await save({
      id: d?.id,
      name: form.name,
      phone: form.phone,
      vehicle,
      zone: form.zone,
      licenseNo: form.licenseNo,
      licenseDoc,
      vehicleRegDoc,
      ...(photo ? { avatar: photo } : {}),
    }).unwrap()
    onClose()
  }

  return (
    <Modal
      open={!!driver}
      onClose={onClose}
      title={isEdit ? 'Edit rider' : 'Add rider'}
      description={isEdit ? d?.name : 'Add a new delivery rider to the fleet.'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading} disabled={!form.name.trim() || !form.phone.trim()}>
            {isEdit ? 'Save changes' : 'Add rider'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <ImageUpload label="Rider photo" value={photo} onChange={setPhoto} compact aspectClassName="aspect-square w-32 mx-auto" hint="Square photo · for the rider's profile & verification." />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Input label="Full name" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Manoj Thapa" autoFocus />
          <Input label="Phone (login number)" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+977 98…" leftIcon={<Phone className="h-4 w-4" />} />
          <Select label="Vehicle type" value={form.vehicleType} onChange={(e) => set('vehicleType', e.target.value)} options={VEHICLE_TYPES.map((v) => ({ label: v, value: v }))} />
          <Input label="Vehicle number (plate)" value={form.plate} onChange={(e) => set('plate', e.target.value)} placeholder="e.g. BA 24 PA 1290" />
          <Input label="License number" value={form.licenseNo} onChange={(e) => set('licenseNo', e.target.value)} placeholder="e.g. 03-06-074521" />
          <Select label="Zone" value={form.zone} onChange={(e) => set('zone', e.target.value)} options={ZONES.map((z) => ({ label: z, value: z }))} />
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold text-slate-700">Documents (KYC)</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ImageUpload label="Driving license" value={licenseDoc} onChange={setLicenseDoc} aspectClassName="aspect-[16/10]" hint="Photo/scan of the license." />
            <ImageUpload label="Vehicle registration" value={vehicleRegDoc} onChange={setVehicleRegDoc} aspectClassName="aspect-[16/10]" hint="Photo/scan of the bluebook." />
          </div>
        </div>
        <p className="rounded-xl bg-mint-50 px-3 py-2.5 text-xs text-slate-500">
          The rider logs into the Rider App with this phone number + OTP — the account is created here by you.
        </p>
      </div>
    </Modal>
  )
}

function DeleteDriver({ driver, onClose }: { driver: Driver | null; onClose: () => void }) {
  const [del, { isLoading }] = useDeleteDriverMutation()
  const confirm = async () => {
    if (!driver) return
    await del(driver.id).unwrap()
    onClose()
  }
  return (
    <ConfirmDialog
      open={!!driver}
      onClose={onClose}
      onConfirm={confirm}
      loading={isLoading}
      title="Delete rider?"
      description={driver ? `"${driver.name}" will be removed from the fleet.` : undefined}
      confirmLabel="Delete rider"
    />
  )
}
