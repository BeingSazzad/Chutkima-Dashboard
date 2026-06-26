import { formatNPR } from './utils'
import type { Order, Packer, Product } from '@/types/common.types'

/**
 * Build a click-to-chat WhatsApp link. Strips non-digits from the phone and
 * URL-encodes the message. In a real deployment a backend would send these
 * automatically; here the admin taps to open WhatsApp with the message ready.
 */
export function waLink(phone: string, message: string): string {
  const digits = phone.replace(/[^0-9]/g, '')
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
}

/** Open a WhatsApp chat in a new tab. */
export function openWhatsApp(phone: string, message: string) {
  window.open(waLink(phone, message), '_blank', 'noopener')
}

/**
 * Packer pick-list message (feature 77): order number, customer, address, and
 * per item SKU, description, shelf, qty, unit price — plus a total item count.
 */
export function buildPackerMessage(order: Order, packer: Packer, byProductId: Map<string, Product>): string {
  const lines = [
    `🧺 *Chutkima — Pack order ${order.reference}*`,
    `Packer: ${packer.name}`,
    ``,
    `Customer: ${order.customerName}`,
    `Deliver to: ${order.address}`,
    ``,
    `*Items to pack:*`,
  ]
  order.items.forEach((it, i) => {
    const p = byProductId.get(it.productId)
    const sku = p?.sku ?? '—'
    const shelf = p?.shelfNo ?? '—'
    lines.push(
      `${i + 1}. [${sku}] ${it.name}`,
      `   Shelf ${shelf} · Qty ${it.quantity} · ${formatNPR(it.price)} each`,
    )
  })
  const totalItems = order.items.reduce((s, it) => s + it.quantity, 0)
  lines.push(``, `Total items: ${totalItems}`)
  return lines.join('\n')
}

/** "Order ready for pickup" alert to the assigned rider (diagram: Rider notified). */
export function buildRiderPickupMessage(order: Order): string {
  const cod =
    order.paymentMethod === 'cod'
      ? `Collect COD: ${formatNPR(order.grandTotal)}`
      : 'Prepaid — no cash to collect'
  return [
    `🛵 *Chutkima — Order ${order.reference} is ready for pickup*`,
    `Please collect it from the dark store now.`,
    ``,
    `Customer: ${order.customerName} (${order.customerPhone})`,
    `Deliver to: ${order.address}`,
    `Items: ${order.items.reduce((s, it) => s + it.quantity, 0)}`,
    cod,
  ].join('\n')
}

/** New-order alert for admins (feature 110): order, customer, amount, payment. */
export function buildAdminOrderAlert(order: Order): string {
  return [
    `🔔 *New Chutkima order ${order.reference}*`,
    `Customer: ${order.customerName} (${order.customerPhone})`,
    `Zone: ${order.zone}`,
    `Items: ${order.items.reduce((s, it) => s + it.quantity, 0)}`,
    `Amount: ${formatNPR(order.grandTotal)} · ${order.paymentMethod.toUpperCase()}`,
    `Address: ${order.address}`,
  ].join('\n')
}
