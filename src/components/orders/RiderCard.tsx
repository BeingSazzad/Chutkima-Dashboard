import { useState } from 'react'
import { Bike, Check, UserPlus, X } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/shared/Avatar'
import { AssignDriverModal } from './AssignDriverModal'
import { cn } from '@/lib/utils'
import { useGetDriversQuery } from '@/services/endpoints/driversApi'
import { useGetOpsConfigQuery } from '@/services/endpoints/settingsApi'
import {
  useConfirmRiderMutation,
  useRemoveRiderMutation,
  useSetRiderNoteMutation,
} from '@/services/endpoints/ordersApi'
import type { Order } from '@/types/common.types'

/** Rider assignment card — supports single or multi-rider per ops config. */
export function RiderCard({ order, onAssignPrimary }: { order: Order; onAssignPrimary: () => void }) {
  const { data: drivers = [] } = useGetDriversQuery()
  const { data: ops } = useGetOpsConfigQuery()
  const [removeRider] = useRemoveRiderMutation()
  const [confirmRider] = useConfirmRiderMutation()
  const [setNote] = useSetRiderNoteMutation()
  const [addOpen, setAddOpen] = useState(false)

  const closed = order.status === 'delivered' || order.status === 'cancelled'
  const multi = ops?.multiRiderEnabled ?? false
  const max = ops?.maxRiders ?? 1
  const driver = (id: string) => drivers.find((d) => d.id === id)

  return (
    <Card>
      <CardHeader
        title={multi ? `Riders (${order.assignments.length})` : 'Rider'}
        action={
          !closed && order.assignments.length === 0 ? (
            <Button variant="secondary" size="sm" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={onAssignPrimary}>
              Assign
            </Button>
          ) : !closed && !multi ? (
            <Button variant="secondary" size="sm" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={onAssignPrimary}>
              Reassign
            </Button>
          ) : undefined
        }
      />
      <CardContent className="space-y-3 pt-2">
        {order.assignments.length === 0 ? (
          <p className="rounded-xl bg-amber-50 px-3 py-3 text-sm font-medium text-amber-700">No rider assigned yet.</p>
        ) : (
          order.assignments.map((a) => {
            const d = driver(a.driverId)
            return (
              <div key={a.driverId} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center gap-3">
                  <Avatar name={d?.name ?? 'Rider'} src={d?.avatar} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">{d?.name ?? 'Rider'}</p>
                    <p className="truncate text-xs text-slate-400">{d?.vehicle}</p>
                  </div>
                  {a.confirmed ? (
                    <Badge tone="bg-green-50 text-green-700 ring-green-600/15"><Check className="h-3 w-3" /> Confirmed</Badge>
                  ) : (
                    <Badge tone="bg-brand-50 text-brand-700 ring-brand-600/15"><Bike className="h-3 w-3" /> ETA {order.etaMinutes}m</Badge>
                  )}
                  {!closed && (
                    <button onClick={() => removeRider({ orderId: order.id, driverId: a.driverId })} className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger" aria-label="Remove rider">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {multi && (
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      defaultValue={a.note}
                      onBlur={(e) => e.target.value !== a.note && setNote({ orderId: order.id, driverId: a.driverId, note: e.target.value })}
                      placeholder="Portion note, e.g. beverages"
                      disabled={closed}
                      className="focus-ring h-8 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-xs"
                    />
                    {!closed && (
                      <button
                        onClick={() => confirmRider({ orderId: order.id, driverId: a.driverId })}
                        className={cn('rounded-lg px-2 py-1 text-xs font-semibold', a.confirmed ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
                      >
                        {a.confirmed ? 'Confirmed' : 'Mark confirmed'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}

        {!closed && multi && order.assignments.length > 0 && order.assignments.length < max && (
          <Button variant="outline" size="sm" className="w-full" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setAddOpen(true)}>
            Add rider ({order.assignments.length}/{max})
          </Button>
        )}

        {multi && order.assignments.length > 1 && (
          <p className="text-xs text-slate-400">Order is marked delivered only when all riders confirm.</p>
        )}
      </CardContent>

      <AssignDriverModal
        order={order}
        open={addOpen}
        onClose={() => setAddOpen(false)}
        mode="add"
        excludeIds={order.assignments.map((a) => a.driverId)}
      />
    </Card>
  )
}
