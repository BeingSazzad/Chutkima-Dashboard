import type { Order } from '@/types/common.types'

export interface DeliveryTiming {
  label: string
  /** 'green' = on time / early, 'red' = delayed. */
  tone: 'green' | 'red'
  diff: number
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
  const diff = actual - sla
  if (diff <= -3) return { label: `Ahead of schedule (${diff} min)`, tone: 'green', diff }
  if (diff <= 2) return { label: `On time (${diff >= 0 ? '+' : ''}${diff} min)`, tone: 'green', diff }
  return { label: `Delayed (+${diff} min)`, tone: 'red', diff }
}
