import { useState } from 'react'
import { Bike, Check, Search, Star } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/shared/Avatar'
import { DriverStatusBadge } from '@/components/shared/StatusBadge'
import { cn } from '@/lib/utils'
import { useGetDriversQuery } from '@/services/endpoints/driversApi'
import { useAddRiderMutation, useAssignDriverMutation } from '@/services/endpoints/ordersApi'
import type { Order } from '@/types/common.types'

interface Props {
  order: Order | null
  open: boolean
  onClose: () => void
  /** 'primary' replaces the rider; 'add' appends a second/third rider. */
  mode?: 'primary' | 'add'
  /** Driver ids to hide (already assigned). */
  excludeIds?: string[]
}

/** Pick an available rider and assign them to an order. */
export function AssignDriverModal({ order, open, onClose, mode = 'primary', excludeIds = [] }: Props) {
  const { data: drivers = [], isLoading } = useGetDriversQuery()
  const [assignDriver, { isLoading: assigning }] = useAssignDriverMutation()
  const [addRider, { isLoading: adding }] = useAddRiderMutation()
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const available = drivers
    .filter((d) => d.status !== 'offline')
    .filter((d) => !excludeIds.includes(d.id))
    .filter((d) => d.name.toLowerCase().includes(search.toLowerCase()))
    // Prefer drivers in the same zone as the order, then available ones.
    .sort((a, b) => {
      if (order && a.zone === order.zone && b.zone !== order.zone) return -1
      if (order && b.zone === order.zone && a.zone !== order.zone) return 1
      return a.status === 'available' ? -1 : 1
    })

  const handleAssign = async () => {
    if (!order || !selected) return
    if (mode === 'add') {
      await addRider({ orderId: order.id, driverId: selected }).unwrap()
    } else {
      await assignDriver({ orderId: order.id, driverId: selected }).unwrap()
    }
    setSelected(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'add' ? 'Add another rider' : 'Assign a rider'}
      description={order ? `Order ${order.reference} · ${order.zone}` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selected} loading={assigning || adding} leftIcon={<Bike className="h-4 w-4" />}>
            {mode === 'add' ? 'Add rider' : 'Assign rider'}
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
          available.map((d) => {
            const isSelected = selected === d.id
            const sameZone = order && d.zone === order.zone
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
                    {sameZone && (
                      <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700">
                        Same zone
                      </span>
                    )}
                  </div>
                  <p className="truncate text-xs text-slate-400">
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
          <p className="py-6 text-center text-sm text-slate-400">No riders match your search.</p>
        )}
      </div>
    </Modal>
  )
}
