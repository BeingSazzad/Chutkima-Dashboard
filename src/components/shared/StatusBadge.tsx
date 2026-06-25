import { Banknote, CreditCard } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import {
  DRIVER_STATUS_META,
  ORDER_STATUS_META,
  PAYMENT_META,
  PRODUCT_STATUS_META,
} from '@/lib/constants'
import type {
  DriverStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductStatus,
  TrustBadge,
} from '@/types/common.types'

const TRUST_META: Record<TrustBadge, { label: string; tone: string }> = {
  green: { label: 'Trusted', tone: 'bg-green-50 text-green-700 ring-green-600/15' },
  gray: { label: 'Watch', tone: 'bg-slate-100 text-slate-600 ring-slate-500/15' },
  red: { label: 'High risk', tone: 'bg-red-50 text-red-700 ring-red-600/15' },
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status]
  return (
    <Badge tone={meta.badge} dot={meta.dot}>
      {meta.label}
    </Badge>
  )
}

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  const meta = DRIVER_STATUS_META[status]
  return (
    <Badge tone={meta.badge} dot={meta.dot}>
      {meta.label}
    </Badge>
  )
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const meta = PRODUCT_STATUS_META[status]
  return <Badge tone={meta.badge}>{meta.label}</Badge>
}

export function CustomerTrustBadge({ badge }: { badge: TrustBadge }) {
  const meta = TRUST_META[badge]
  return <Badge tone={meta.tone}>{meta.label}</Badge>
}

/**
 * Clearly distinguishes Cash-on-Delivery (rider must collect) from prepaid
 * online payments — the core "cash naki paid?" question for dispatch.
 */
export function PaymentBadge({
  method,
  status,
}: {
  method: PaymentMethod
  status: PaymentStatus
}) {
  // Compact: COD shows just "COD" (amber = collect, green = collected); prepaid
  // shows the wallet name (eSewa / Khalti / ConnectIPS) — no "Paid" prefix.
  if (method === 'cod') {
    return status === 'paid' ? (
      <Badge tone="bg-green-50 text-green-700 ring-green-600/15">
        <Banknote className="h-3 w-3" /> COD
      </Badge>
    ) : (
      <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/15">
        <Banknote className="h-3 w-3" /> COD
      </Badge>
    )
  }
  if (status === 'refunded') {
    return <Badge tone="bg-slate-100 text-slate-600 ring-slate-500/15">Refunded</Badge>
  }
  return (
    <Badge tone="bg-green-50 text-green-700 ring-green-600/15">
      <CreditCard className="h-3 w-3" /> {PAYMENT_META[method].label}
    </Badge>
  )
}
