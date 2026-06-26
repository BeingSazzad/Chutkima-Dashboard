import type { Order } from '@/types/common.types'

/** True when a rider is assigned but hasn't accepted yet (pre-pickup) — needs admin attention. */
export function awaitingRiderAcceptance(order: Order): boolean {
  return (
    !!order.driverId &&
    !order.riderAccepted &&
    !['picked_up', 'on_the_way', 'arrived', 'delivered', 'cancelled'].includes(order.status)
  )
}
