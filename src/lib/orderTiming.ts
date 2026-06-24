import type { Order, OrderStatus } from '@/types/common.types'

export interface DeliveryTiming {
  label: string
  /** 'green' = on time / early, 'red' = delayed. */
  tone: 'green' | 'red'
  diff: number
}

/** Turn a signed minute difference into an On time / Ahead / Delayed label. */
export function timingLabel(diff: number): DeliveryTiming {
  if (diff <= -3) return { label: `Ahead of schedule (${diff} min)`, tone: 'green', diff }
  if (diff <= 2) return { label: `On time (${diff >= 0 ? '+' : ''}${diff} min)`, tone: 'green', diff }
  return { label: `Delayed (+${diff} min)`, tone: 'red', diff }
}

/**
 * Compare a delivered order's actual time against its expected SLA.
 * Returns null while the order is still in progress.
 */
export function deliveryTiming(order: Order): DeliveryTiming | null {
  const delivered = order.stageTimestamps?.delivered
  if (!delivered) return null
  const sla = order.etaMinutes > 0 ? order.etaMinutes : 12
  const actual = Math.round((Date.parse(delivered) - Date.parse(order.placedAt)) / 60_000)
  return timingLabel(actual - sla)
}

/**
 * Fraction of the delivery SLA each journey stage is expected to be reached by.
 * Used to flag a stage as on-time / ahead / delayed against its own schedule.
 */
const STAGE_SCHEDULE_FRACTION: Partial<Record<OrderStatus, number>> = {
  placed: 0,
  packing: 0.15,
  picked_up: 0.35,
  on_the_way: 0.5,
  arrived: 0.85,
  delivered: 1,
}

/**
 * Per-stage timing: how the actual time a stage was reached compares with its
 * expected point on the SLA. Returns null if the stage hasn't been reached.
 */
export function stageTiming(order: Order, stage: OrderStatus): DeliveryTiming | null {
  const reachedAt = order.stageTimestamps?.[stage]
  const fraction = STAGE_SCHEDULE_FRACTION[stage]
  if (!reachedAt || fraction == null) return null
  const sla = order.etaMinutes > 0 ? order.etaMinutes : 12
  const expectedMs = Date.parse(order.placedAt) + fraction * sla * 60_000
  const diff = Math.round((Date.parse(reachedAt) - expectedMs) / 60_000)
  return timingLabel(diff)
}
