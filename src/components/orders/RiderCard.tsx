import { Bike, Check, MessageCircle, UserPlus, X } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/shared/Avatar'
import { EntityLink } from '@/components/shared/EntityLink'
import { EtaCountdown } from './EtaCountdown'
import { buildRiderPickupMessage, openWhatsApp } from '@/lib/whatsapp'
import { useGetDriversQuery } from '@/services/endpoints/driversApi'
import { useRemoveRiderMutation } from '@/services/endpoints/ordersApi'
import type { Order } from '@/types/common.types'

/** Single rider assigned to an order — assign / reassign / unassign + notify pickup. */
export function RiderCard({ order, onAssignPrimary }: { order: Order; onAssignPrimary: () => void }) {
  const { data: drivers = [] } = useGetDriversQuery()
  const [removeRider] = useRemoveRiderMutation()

  const closed = order.status === 'delivered' || order.status === 'cancelled'
  // Once the rider has picked up, "remove" would strand the order with no rider —
  // only allow unassign before pickup. Reassign (header button) stays available.
  const preTransit = !['picked_up', 'on_the_way', 'arrived', 'delivered'].includes(order.status)
  const rider = order.driverId ? drivers.find((d) => d.id === order.driverId) : undefined

  // Diagram step "Rider notified — order ready for pickup" (admin-side WhatsApp).
  const notifyPickup = () => rider?.phone && openWhatsApp(rider.phone, buildRiderPickupMessage(order))

  const hasAssignments = order.assignments && order.assignments.length > 0

  return (
    <Card>
      <CardHeader
        title={order.assignments.length > 1 ? 'Riders' : 'Rider'}
        action={
          !closed ? (
            <Button variant="secondary" size="sm" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={onAssignPrimary}>
              {hasAssignments ? 'Add Rider' : 'Assign'}
            </Button>
          ) : undefined
        }
      />
      <CardContent className="space-y-3 pt-2">
        {!hasAssignments ? (
          <p className="rounded-xl bg-amber-50 px-3 py-3 text-sm font-medium text-amber-700">No rider assigned yet.</p>
        ) : (
          <div className="space-y-2">
            {order.assignments.map((asg) => {
              const r = drivers.find((d) => d.id === asg.driverId)
              if (!r) return null
              return (
                <div key={asg.driverId} className="rounded-xl border border-slate-100 p-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={r.name} src={r.avatar} />
                    <div className="min-w-0 flex-1">
                      <EntityLink kind="driver" id={r.id} className="block font-semibold text-slate-800">
                        {r.name}
                      </EntityLink>
                      <p className="truncate text-xs text-slate-400">{r.vehicle}</p>
                    </div>
                    {order.riderAccepted ? (
                      <Badge tone="bg-green-50 text-green-700 ring-green-600/15">
                        <Check className="h-3 w-3" /> Accepted
                      </Badge>
                    ) : (
                      <Badge tone="bg-brand-50 text-brand-700 ring-brand-600/15">
                        <Bike className="h-3 w-3" /> ETA{' '}
                        <EtaCountdown placedAt={order.placedAt} etaMinutes={order.etaMinutes} />
                      </Badge>
                    )}
                    {preTransit && (
                      <button
                        onClick={() => removeRider({ orderId: order.id, driverId: r.id })}
                        className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger"
                        aria-label="Remove rider"
                        title="Unassign rider"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Packed + rider assigned → notify primary rider ready for pickup. */}
        {!closed && order.status === 'packed' && rider && (
          <Button variant="primary" className="w-full" leftIcon={<MessageCircle className="h-4 w-4" />} onClick={notifyPickup}>
            Notify rider — ready for pickup
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
