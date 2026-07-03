import { formatDateTime, formatNPR } from './utils'
import { BRAND, PAYMENT_META } from './constants'
import type { InvoiceSize, Order } from '@/types/common.types'

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

export interface InvoiceCompany {
  companyName: string
  address: string
  phone: string
  email: string
  taxNumber: string
  vatPercent: number
}

/** Compact thermal-receipt invoice (80mm or 57mm roll printers). */
function thermalInvoiceHtml(order: Order, co: InvoiceCompany, driverName: string | undefined, vatIncl: number, size: InvoiceSize): string {
  const widthMm = size === 'thermal58' ? 58 : 80
  const base = size === 'thermal58' ? 10 : 11
  const items = order.items
    .map(
      (it) => `<div class="it">
        <div class="nm">${it.name}</div>
        <div class="ln"><span>${it.quantity} × ${formatNPR(it.price)}</span><span>${formatNPR(it.price * it.quantity)}</span></div>
      </div>`,
    )
    .join('')
  return `<!doctype html><html><head><meta charset="utf-8" /><title>Invoice ${order.reference}</title>
    <style>
      @page { size: ${widthMm}mm auto; margin: 3mm; }
      * { font-family: 'Courier New', ui-monospace, monospace; color: #000; }
      body { width: ${widthMm - 6}mm; margin: 0 auto; font-size: ${base}px; line-height: 1.35; }
      .center { text-align: center; }
      .b { font-weight: 700; }
      .sep { border-top: 1px dashed #000; margin: 6px 0; }
      .ln { display: flex; justify-content: space-between; gap: 8px; }
      .nm { font-weight: 600; }
      .it { margin-bottom: 3px; }
      .grand { font-weight: 800; font-size: ${base + 2}px; }
      @media print { body { width: ${widthMm - 6}mm; } }
    </style></head>
    <body>
      <div class="center b" style="font-size:${base + 4}px">${co.companyName}</div>
      ${co.address ? `<div class="center">${co.address}</div>` : ''}
      ${co.phone ? `<div class="center">${co.phone}</div>` : ''}
      ${co.taxNumber ? `<div class="center">PAN/VAT: ${co.taxNumber}</div>` : ''}
      <div class="sep"></div>
      <div class="ln"><span class="b">${order.reference}</span><span>${formatDateTime(order.placedAt)}</span></div>
      <div>${order.customerName} · ${order.customerPhone}</div>
      <div>${order.address}</div>
      ${driverName ? `<div>Rider: ${driverName}</div>` : ''}
      <div class="sep"></div>
      ${items}
      <div class="sep"></div>
      <div class="ln"><span>Subtotal</span><span>${formatNPR(order.subtotal)}</span></div>
      <div class="ln"><span>Delivery</span><span>${order.deliveryFee === 0 ? 'FREE' : formatNPR(order.deliveryFee)}</span></div>
      <div class="ln grand"><span>TOTAL</span><span>${formatNPR(order.grandTotal)}</span></div>
      ${vatIncl > 0 ? `<div class="ln"><span>Incl. VAT ${co.vatPercent}%</span><span>${formatNPR(vatIncl)}</span></div>` : ''}
      <div class="ln"><span>Payment</span><span>${PAYMENT_META[order.paymentMethod].label}</span></div>
      <div class="sep"></div>
      <div class="center">Thank you for ordering with ${co.companyName}!</div>
    </body></html>`
}

/** Open a clean, printable invoice for an order in a new window (A4 or thermal). */
export function printOrderInvoice(order: Order, driverName?: string, company?: InvoiceCompany, size: InvoiceSize = 'a4') {
  const co: InvoiceCompany = company ?? {
    companyName: BRAND.name,
    address: BRAND.city,
    phone: '',
    email: '',
    taxNumber: '',
    vatPercent: 0,
  }
  const vatIncl = co.vatPercent > 0 ? Math.round(order.grandTotal - order.grandTotal / (1 + co.vatPercent / 100)) : 0

  if (size !== 'a4') {
    openPrintWindow(thermalInvoiceHtml(order, co, driverName, vatIncl, size), size)
    return
  }

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
      @page { size: A4; margin: 14mm; }
      @media print { body { padding: 0; } }
    </style></head>
    <body>
      <div class="row">
        <div>
          <div class="brand">${co.companyName}</div>
          ${co.address ? `<div class="muted">${co.address}</div>` : ''}
          ${[co.phone, co.email].filter(Boolean).length ? `<div class="muted">${[co.phone, co.email].filter(Boolean).join(' · ')}</div>` : ''}
          ${co.taxNumber ? `<div class="muted">PAN/VAT: ${co.taxNumber}</div>` : ''}
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
        ${vatIncl > 0 ? `<div class="muted"><span>Incl. VAT (${co.vatPercent}%)</span><span>${formatNPR(vatIncl)}</span></div>` : ''}
      </div>

      <p class="muted" style="margin-top:32px;text-align:center">Thank you for ordering with ${co.companyName}!</p>
    </body></html>`

  openPrintWindow(html, 'a4')
}

/** Open an invoice HTML doc in a new window sized for the chosen paper and print it. */
function openPrintWindow(html: string, size: InvoiceSize) {
  const width = size === 'a4' ? 820 : size === 'thermal58' ? 320 : 400
  const win = window.open('', '_blank', `width=${width},height=900`)
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  // Give the new document a tick to render before printing.
  setTimeout(() => win.print(), 300)
}

/** Open a clean, printable Return Note for supplier returns. */
export function printSupplierReturn(ret: any) {
  const reasonLabel = {
    expired: 'Expired Stock',
    slow_moving: 'Slow Moving Stock',
    damaged: 'Damaged / Broken Product',
  }[ret.reason as 'expired' | 'slow_moving' | 'damaged'] || ret.reason

  const html = `<!doctype html><html><head><meta charset="utf-8" />
    <title>Supplier Return ${ret.reference}</title>
    <style>
      * { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #1e293b; }
      body { padding: 32px; max-width: 720px; margin: auto; }
      .brand { color: #dc2626; font-size: 24px; font-weight: 800; }
      .muted { color: #64748b; font-size: 13px; }
      .title { font-size: 20px; font-weight: 700; margin-top: 16px; text-transform: uppercase; letter-spacing: 0.5px; }
      table { width: 100%; border-collapse: collapse; margin-top: 24px; font-size: 14px; }
      th, td { padding: 10px 8px; border-bottom: 1px solid #e2e8f0; }
      th { text-align: left; color: #64748b; font-size: 12px; text-transform: uppercase; background: #f8fafc; }
      .row { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 24px; gap: 24px; }
      .box { background: #f1f5f9; border-radius: 12px; padding: 12px 14px; font-size: 13px; flex: 1; }
      .notes-box { margin-top: 20px; background: #fdf2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 12px 14px; font-size: 13px; color: #991b1b; }
      @page { size: A4; margin: 14mm; }
      @media print { body { padding: 0; } }
    </style></head>
    <body>
      <div class="row">
        <div>
          <div class="brand">CHUTKIMA</div>
          <div class="title">Supplier Return Note</div>
          <div class="muted" style="margin-top:4px">Reference: <strong>${ret.reference}</strong></div>
        </div>
        <div style="text-align:right">
          <div class="muted">Date Issued</div>
          <div style="font-weight:700;font-size:14px;margin-top:2px">${new Date(ret.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      <div class="row">
        <div class="box">
          <div class="muted" style="font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:0.5px">Return To (Supplier)</div>
          <div style="font-weight:700;font-size:15px;margin-top:4px;color:#0f172a">${ret.supplierName}</div>
          <div class="muted" style="margin-top:2px">ID: ${ret.supplierId || 'N/A'}</div>
        </div>
        <div class="box">
          <div class="muted" style="font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:0.5px">Authorized By</div>
          <div style="font-weight:700;font-size:15px;margin-top:4px;color:#0f172a">${ret.adminName}</div>
          <div class="muted" style="margin-top:2px">Dark Store Administrator</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Product Name</th>
            <th>SKU Code</th>
            <th>Return Qty</th>
            <th>Reason</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="font-weight:600;color:#0f172a">${ret.productName}</td>
            <td style="font-family:monospace">${ret.sku}</td>
            <td style="font-weight:700;font-size:15px">${ret.quantity}</td>
            <td><span style="display:inline-block;padding:2px 8px;border-radius:6px;font-size:11px;font-weight:700;text-transform:uppercase;background:#fee2e2;color:#991b1b">${reasonLabel}</span></td>
          </tr>
        </tbody>
      </table>

      ${ret.comments ? `
      <div class="notes-box">
        <div style="font-weight:700;text-transform:uppercase;font-size:10px;letter-spacing:0.5px;margin-bottom:4px">Return Comments</div>
        <div>${ret.comments}</div>
      </div>
      ` : ''}

      <div style="margin-top:80px;border-top:1px dashed #cbd5e1;padding-top:16px;display:flex;justify-content:space-between;font-size:12px;color:#64748b">
        <div>System Record: ${ret.id}</div>
        <div>Signature: __________________________</div>
      </div>
    </body></html>`

  const win = window.open('', '_blank', 'width=820,height=900')
  if (!win) return
  win.document.write(html)
  win.document.close()
  win.focus()
  setTimeout(() => win.print(), 300)
}
