import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike, CheckCircle2, Phone, PowerOff, Search, Star, Truck } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { Avatar } from '@/components/shared/Avatar'
import { StatCard } from '@/components/shared/StatCard'
import { DriverStatusBadge } from '@/components/shared/StatusBadge'
import { useDebounce } from '@/hooks/useDebounce'
import {
  useGetDriversQuery,
  useSetDriverStatusMutation,
} from '@/services/endpoints/driversApi'
import { useGetOrdersQuery } from '@/services/endpoints/ordersApi'
import { ROUTES } from '@/constants/routes'
import type { DriverStatus } from '@/types/common.types'

export default function DriversPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)

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

  return (
    <>
      <PageHeader
        title="Drivers"
        description="Your delivery fleet across Butwal. Assign riders from the Orders board."
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

      {isLoading ? (
        <Spinner label="Loading riders…" className="py-24" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {drivers.map((d) => (
            <Card key={d.id} className="cursor-pointer transition-shadow hover:shadow-card-hover" onClick={() => navigate(ROUTES.driverDetail(d.id))}>
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <Avatar name={d.name} src={d.avatar} size="lg" />
                    {d.status === 'on_delivery' && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-brand-500 ring-2 ring-white" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-bold text-slate-800">{d.name}</p>
                      <span className="flex items-center gap-0.5 text-sm font-bold text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-400" /> {d.rating}
                      </span>
                    </div>
                    <p className="flex items-center gap-1 text-xs text-slate-400">
                      <Phone className="h-3 w-3" /> {d.phone}
                    </p>
                    <div className="mt-1.5">
                      <DriverStatusBadge status={d.status} />
                    </div>
                  </div>
                </div>

                <p className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
                  <Bike className="h-3.5 w-3.5 text-brand-500" /> {d.vehicle}
                </p>

                {d.activeOrderId && (
                  <div className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
                    Delivering {orderRef(d.activeOrderId) ?? 'an order'} →
                  </div>
                )}

                <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
                  <div>
                    <p className="text-base font-extrabold text-slate-800">{d.deliveriesToday}</p>
                    <p className="text-[11px] text-slate-400">Today</p>
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-slate-800">{d.totalDeliveries.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400">Total</p>
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-slate-800">{d.onTimeRate}%</p>
                    <p className="text-[11px] text-slate-400">On-time</p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {d.status === 'offline' ? (
                    <Button size="sm" className="flex-1" onClick={() => setDriverStatus({ id: d.id, status: 'available' })}>
                      Set available
                    </Button>
                  ) : d.status === 'available' ? (
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => setDriverStatus({ id: d.id, status: 'offline' })}>
                      Set offline
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1" disabled>
                      On a delivery
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => navigate(ROUTES.driverDetail(d.id))}>
                    View
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}
