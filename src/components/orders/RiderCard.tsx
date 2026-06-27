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
  const rider = order.driverId ? drivers.find((d) => d.id === order.driverId) : undefined

  // Diagram step "Rider notified — order ready for pickup" (admin-side WhatsApp).
  const notifyPickup = () => rider?.phone && openWhatsApp(rider.phone, buildRiderPickupMessage(order))

  return (
    <Card>
      <CardHeader
        title="Rider"
        action={
          !closed ? (
            <Button variant="secondary" size="sm" leftIcon={<UserPlus className="h-3.5 w-3.5" />} onClick={onAssignPrimary}>
              {order.driverId ? 'Reassign' : 'Assign'}
            </Button>
          ) : undefined
        }
      />
      <CardContent className="space-y-3 pt-2">
        {!order.driverId ? (
          <p className="rounded-xl bg-amber-50 px-3 py-3 text-sm font-medium text-amber-700">No rider assigned yet.</p>
        ) : (
          <div className="rounded-xl border border-slate-100 p-3">
            <div className="flex items-center gap-3">
              <Avatar name={rider?.name ?? 'Rider'} src={rider?.avatar} />
              <div className="min-w-0 flex-1">
                <EntityLink kind="driver" id={order.driverId} className="block font-semibold text-slate-800">{rider?.name ?? 'Rider'}</EntityLink>
                <p className="truncate text-xs text-slate-400">{rider?.vehicle}</p>
              </div>
              {order.riderAccepted ? (
                <Badge tone="bg-green-50 text-green-700 ring-green-600/15"><Check className="h-3 w-3" /> Accepted</Badge>
              ) : (
                <Badge tone="bg-brand-50 text-brand-700 ring-brand-600/15"><Bike className="h-3 w-3" /> ETA <EtaCountdown placedAt={order.placedAt} etaMinutes={order.etaMinutes} /></Badge>
              )}
              {!closed && (
                <button
                  onClick={() => removeRider({ orderId: order.id, driverId: order.driverId! })}
                  className="focus-ring rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-danger"
                  aria-label="Remove rider"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Packed + rider assigned → notify the rider it's ready for pickup. */}
        {!closed && order.status === 'packed' && rider && (
          <Button variant="primary" className="w-full" leftIcon={<MessageCircle className="h-4 w-4" />} onClick={notifyPickup}>
            Notify rider — ready for pickup
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
