import type { Order } from '@/types/common.types'
import { ORDER_STATUS_META } from './constants'

export interface StageBadge {
  label: string
  badge: string
}

/**
 * Admin-facing fulfilment stage — richer than the customer journey status.
 * Surfaces the operational sub-states between "Confirmed" and "Picked Up":
 * Packer Assigned → Ready to Collect → Rider Assigned → Rider Accepted.
 * Once the rider picks up, the normal journey status takes over.
 */
export function adminOrderStage(order: Order): StageBadge {
  const meta = ORDER_STATUS_META[order.status]
  // In-transit / closed journey states win outright.
  if (['picked_up', 'on_the_way', 'arrived', 'delivered', 'cancelled'].includes(order.status)) {
    return { label: meta.label, badge: meta.badge }
  }
  // Pre-pickup operational sub-states (order is still placed / packing).
  if (order.driverId && order.riderAccepted) {
    return { label: 'Rider Accepted', badge: 'bg-teal-50 text-teal-700 ring-teal-600/15' }
  }
  if (order.driverId) {
    return { label: 'Rider Assigned', badge: 'bg-violet-50 text-violet-700 ring-violet-600/15' }
  }
  if (order.packed) {
    return { label: 'Ready to Collect', badge: 'bg-brand-50 text-brand-700 ring-brand-600/15' }
  }
  if (order.packerId) {
    return { label: 'Packer Assigned', badge: 'bg-amber-50 text-amber-700 ring-amber-600/15' }
  }
  return { label: meta.label, badge: meta.badge }
}

/** True when a rider is assigned but hasn't accepted yet (pre-pickup) — needs admin attention. */
export function awaitingRiderAcceptance(order: Order): boolean {
  return (
    !!order.driverId &&
    !order.riderAccepted &&
    !['picked_up', 'on_the_way', 'arrived', 'delivered', 'cancelled'].includes(order.status)
  )
}
