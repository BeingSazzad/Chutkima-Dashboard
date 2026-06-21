import { formatDateTime, formatNPR } from './utils'
import { BRAND, PAYMENT_META } from './constants'
import type { Order } from '@/types/common.types'

/** Escape a value for CSV (wrap in quotes, double internal quotes). */
function csvCell(value: unknown): string {
  const s = value == null ? '' : String(value)
  return `"${s.replace(/"/g, '""')}"`
}

/**
 * Build a CSV from an array of row objects and trigger a browser download.
 * `columns` controls order + headers; defaults to the keys of the first row.
 */
export function downloadCSV(
  filename: string,
  rows: Record<string, unknown>[],
  columns?: { key: string; label: string }[],
) {
  if (rows.length === 0) return
  const cols = columns ?? Object.keys(rows[0]).map((k) => ({ key: k, label: k }))
  const header = cols.map((c) => csvCell(c.label)).join(',')
  const body = rows.map((row) => cols.map((c) => csvCell(row[c.key])).join(',')).join('\n')
  const csv = `${header}\n${body}`

  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/** Open a clean, printable invoice for an order in a new window. */
export function printOrderInvoice(order: Order, driverName?: string) {
  const rows = order.items
    .map(
      (it) => `<tr>
        <td>${it.name}</td>
        <td style="text-align:center">${it.quantity}</td>
        <td style="text-align:right">${formatNPR(it.price)}</td>
        <td style="text-align:right">${formatNPR(it.price * it.quantity)}</td>
      </tr>`,
    )
    .join('')

  const html = `<!doctype html><html><head><meta charset="utf-8" />
    <title>Invoice ${order.reference}</title>
    <style>
      * { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #1e293b; }
      body { padding: 32px; max-width: 720px; margin: auto; }
      .brand { color: #0c7d60; font-size: 24px; font-weight: 800; }
      .muted { color: #64748b; font-size: 13px; }
      table { width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px; }
      th, td { padding: 8px 6px; border-bottom: 1px solid #e2e8f0; }
      th { text-align: left; color: #64748b; font-size: 12px; text-transform: uppercase; }
      .totals { margin-top: 12px; margin-left: auto; width: 240px; font-size: 14px; }
      .totals div { display: flex; justify-content: space-between; padding: 4px 0; }
      .grand { font-weight: 800; font-size: 16px; border-top: 2px solid #0f172a; padding-top: 8px; }
      .row { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px; gap: 24px; }
      .box { background: #f1f5f9; border-radius: 12px; padding: 12px 14px; font-size: 13px; flex: 1; }
      @media print { body { padding: 0; } }
    </style></head>
    <body>
      <div class="row">
        <div>
          <div class="brand">${BRAND.name}</div>
          <div class="muted">${BRAND.tagline} · ${BRAND.city}</div>
        </div>
        <div style="text-align:right">
          <div style="font-weight:700">Invoice</div>
          <div class="muted">${order.reference}</div>
          <div class="muted">${formatDateTime(order.placedAt)}</div>
        </div>
      </div>

      <div class="row">
        <div class="box">
          <strong>Deliver to</strong><br/>
          ${order.customerName}<br/>${order.customerPhone}<br/>${order.address}
          ${order.note ? `<br/><em>Note: ${order.note}</em>` : ''}
        </div>
        <div class="box">
          <strong>Order</strong><br/>
          Status: ${order.status.replace(/_/g, ' ')}<br/>
          Payment: ${PAYMENT_META[order.paymentMethod].label} (${order.paymentStatus})<br/>
          ${driverName ? `Rider: ${driverName}` : 'Rider: unassigned'}
        </div>
      </div>

      <table>
        <thead><tr><th>Item</th><th style="text-align:center">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>

      <div class="totals">
        <div><span>Subtotal</span><span>${formatNPR(order.subtotal)}</span></div>
        <div><span>Delivery fee</span><span>${order.deliveryFee === 0 ? 'FREE' : formatNPR(order.deliveryFee)}</span></div>
        <div class="grand"><span>Grand total</span><span>${formatNPR(order.grandTotal)}</span></div>
      </div>

      <p class="muted" style="margin-top:32px;text-align:center">Thank you for ordering with ${BRAND.name}!</p>
    </body></html>`

  const win = window.open('', '_blank', 'width=820,height=900')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  // Give the new document a tick to render before printing.
  setTimeout(() => win.print(), 300)
}
