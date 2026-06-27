import { useState } from 'react'
import { Check, PackageCheck, Search } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/shared/Avatar'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { packerBusyOrder } from '@/lib/packerStatus'
import { useGetPackersQuery } from '@/services/endpoints/packersApi'
import { useAssignPackerMutation, useGetOrdersQuery } from '@/services/endpoints/ordersApi'
import type { Order } from '@/types/common.types'

interface Props {
  order: Order | null
  open: boolean
  onClose: () => void
}

/** Pick an active packer and assign them to an order — mirrors the rider assignment screen. */
export function AssignPackerModal({ order, open, onClose }: Props) {
  const { data: packers = [], isLoading } = useGetPackersQuery()
  const { data: orders = [] } = useGetOrdersQuery()
  const [assign, { isLoading: assigning }] = useAssignPackerMutation()
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Only packers at this order's dark store; free packers first, busy ones at the bottom.
  const available = packers
    .filter((p) => p.active)
    .filter((p) => !order || p.storeId === order.storeId)
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .map((p) => ({ p, busy: packerBusyOrder(p, orders) }))
    .sort((a, b) => Number(!!a.busy) - Number(!!b.busy))

  const handleAssign = async () => {
    if (!order || !selected) return
    await assign({ orderId: order.id, packerId: selected }).unwrap()
    setSelected(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={order?.packerId ? 'Reassign packer' : 'Assign a packer'}
      description={order ? `Order ${order.reference} · ${order.zone}` : undefined}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selected} loading={assigning} leftIcon={<PackageCheck className="h-4 w-4" />}>
            {order?.packerId ? 'Reassign packer' : 'Assign packer'}
          </Button>
        </>
      }
    >
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search packers…"
          className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm"
        />
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <p className="py-6 text-center text-sm text-slate-400">Loading packers…</p>
        ) : (
          available.map(({ p, busy }) => {
            const isSelected = selected === p.id
            const isCurrent = order?.packerId === p.id
            return (
              <button
                key={p.id}
                onClick={() => setSelected(p.id)}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors',
                  isSelected
                    ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                    : 'border-slate-200 hover:border-brand-300 hover:bg-mint-50',
                  busy && !isSelected && 'opacity-70',
                )}
              >
                <Avatar name={p.name} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-800">{p.name}</p>
                    {isCurrent && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">Current</span>}
                  </div>
                  <p className="truncate text-xs text-slate-400">{busy ? `Busy on ${busy.reference}` : 'Free — ready to pack'}</p>
                </div>
                {busy ? (
                  <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/15" dot="bg-amber-500">Busy</Badge>
                ) : (
                  <Badge tone="bg-green-50 text-green-700 ring-green-600/15" dot="bg-green-500">Free</Badge>
                )}
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
          <p className="py-6 text-center text-sm text-slate-400">No active packers match your search.</p>
        )}
      </div>
    </Modal>
  )
}
