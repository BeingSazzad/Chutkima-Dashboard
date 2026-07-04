import { useState } from 'react'
import { Bike, Check, MapPin, Search, Star } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/shared/Avatar'
import { DriverStatusBadge } from '@/components/shared/StatusBadge'
import { cn, distanceKm } from '@/lib/utils'
import { useGetDriversQuery } from '@/services/endpoints/driversApi'
import { useGetStoresQuery } from '@/services/endpoints/storesApi'
import { useAssignDriverMutation } from '@/services/endpoints/ordersApi'
import type { Order } from '@/types/common.types'

interface Props {
  order: Order | null
  open: boolean
  onClose: () => void
}

/** Pick an available rider and assign (or reassign) them to an order. */
export function AssignDriverModal({ order, open, onClose }: Props) {
  const { data: drivers = [], isLoading } = useGetDriversQuery()
  const { data: stores = [] } = useGetStoresQuery()
  const [assignDriver, { isLoading: assigning }] = useAssignDriverMutation()
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Distance of each rider from the dark store fulfilling this order.
  const store = order ? stores.find((s) => s.id === order.storeId) : undefined
  const distanceFor = (d: { lat?: number; lng?: number }) =>
    store ? distanceKm(store, d) : null

  const available = drivers
    .filter((d) => d.status !== 'offline')
    // Suspended / terminated riders cannot take new orders.
    .filter((d) => (d.accountStatus ?? 'active') === 'active')
    // Only riders that serve this order's dark store (matches the packer rule).
    .filter((d) => !order?.storeId || (d.storeIds?.includes(order.storeId) ?? false))
    .filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    // Nearest available rider first: sort by distance to the dark store
    // (riders with no GPS fix sink to the bottom), then availability.
    .sort((a, b) => {
      // 1. Available/active (status === 'available') riders appear first.
      if (a.status === 'available' && b.status !== 'available') return -1
      if (a.status !== 'available' && b.status === 'available') return 1

      // 2. Then sort by distance (nearest to store first).
      const da = distanceFor(a)
      const db = distanceFor(b)
      if (da != null && db != null && da !== db) return da - db
      if (da != null && db == null) return -1
      if (da == null && db != null) return 1
      return 0
    })

  const handleAssign = async () => {
    if (!order || !selected) return
    await assignDriver({ orderId: order.id, driverId: selected }).unwrap()
    setSelected(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign a rider"
      description={order ? `Order ${order.reference} · ${order.zone}` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selected} loading={assigning} leftIcon={<Bike className="h-4 w-4" />}>
            Assign rider
          </Button>
        </>
      }
    >
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search riders…"
          className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm"
        />
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading riders…</p>
        ) : (
          available.map((d, idx) => {
            const isSelected = selected === d.id
            const sameZone = order && d.zone === order.zone
            const dist = distanceFor(d)
            return (
              <button
                key={d.id}
                onClick={() => setSelected(d.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                  isSelected
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                    : 'border-slate-200 hover:border-brand-300 hover:bg-mint-50',
                )}
              >
                <Avatar name={d.name} src={d.avatar} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-800">{d.name}</p>
                    {idx === 0 && dist != null && (
                      <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        Nearest
                      </span>
                    )}
                    {sameZone && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                        Same zone
                      </span>
                    )}
                  </div>
                  <p className="flex items-center gap-1 truncate text-xs text-slate-400">
                    {dist != null && (
                      <span className="flex items-center gap-0.5 font-semibold text-slate-500">
                        <MapPin className="h-3 w-3" /> {dist.toFixed(1)} km
                      </span>
                    )}
                    {dist != null && <span>·</span>}
                    {d.zone} · {d.deliveriesToday} today
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <DriverStatusBadge status={d.status} />
                  <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-500">
                    <Star className="h-3 w-3 fill-amber-400" /> {d.rating}
                  </span>
                </div>
                {isSelected && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </button>
            )
          })
        )}
        {!isLoading && available.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">
            {search ? 'No riders match your search.' : 'No available riders serving this store right now.'}
          </p>
        )}
      </div>
    </Modal>
  )
}
