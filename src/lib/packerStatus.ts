import type { Order, Packer } from '@/types/common.types'

/**
 * The order a packer is actively packing right now — assigned to them and still
 * in the "packing" stage. Once the order is packed (or beyond), the packer is free.
 */
export function packerBusyOrder(packer: Packer, orders: Order[]): Order | undefined {
  return orders.find((o) => o.packerId === packer.id && o.status === 'packing')
}
