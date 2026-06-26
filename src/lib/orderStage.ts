import type { Order } from '@/types/common.types'
import { ORDER_STATUS_META } from './constants'

export interface StageBadge {
  label: string
  badge: string
}

/**
 * Admin-facing fulfilment stage — follows the canonical order flow:
 * Confirmed → Packing → Packed → Picked Up → Out for Delivery → Arrived → Delivered
 * (Cancelled is the alternate end). Rider assignment / acceptance is shown
 * separately in the Rider column, since it happens in parallel with packing.
 */
export function adminOrderStage(order: Order): StageBadge {
  const meta = ORDER_STATUS_META[order.status]
  // In-transit / closed journey states map straight through.
  if (['picked_up', 'on_the_way', 'arrived', 'delivered', 'cancelled'].includes(order.status)) {
    return { label: meta.label, badge: meta.badge }
  }
  // Pre-pickup: Confirmed → Packing → Packed (packing complete, ready for pickup).
  if (order.packed) {
    return { label: 'Packed', badge: 'bg-brand-50 text-brand-700 ring-brand-600/15' }
  }
  if (order.packerId || order.status === 'packing') {
    return { label: 'Packing', badge: ORDER_STATUS_META.packing.badge }
  }
  return { label: 'Confirmed', badge: ORDER_STATUS_META.placed.badge }
}

/** True when a rider is assigned but hasn't accepted yet (pre-pickup) — needs admin attention. */
export function awaitingRiderAcceptance(order: Order): boolean {
  return (
    !!order.driverId &&
    !order.riderAccepted &&
    !['picked_up', 'on_the_way', 'arrived', 'delivered', 'cancelled'].includes(order.status)
  )
}
