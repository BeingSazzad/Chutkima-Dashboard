import type {
  CreditType,
  DriverStatus,
  OrderStatus,
  PaymentMethod,
  ProductStatus,
  ReportReason,
  ReportStatus,
  StoreFeatureKey,
  TransactionStatus,
  TransactionType,
} from '@/types/common.types'

/** Brand metadata. */
export const BRAND = {
  name: 'Chutkima',
  tagline: 'Tap · Snap · Deliver',
  city: 'Butwal',
  currency: 'NPR',
} as const

/** Order status -> display label + Tailwind color tokens (badge styling). */
export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; dot: string; badge: string }
> = {
  placed: { label: 'Confirmed', dot: 'bg-info', badge: 'bg-blue-50 text-blue-700 ring-blue-600/15' },
  packing: {
    label: 'Packing',
    dot: 'bg-warning',
    badge: 'bg-amber-50 text-amber-700 ring-amber-600/15',
  },
  picked_up: {
    label: 'Picked Up',
    dot: 'bg-violet-500',
    badge: 'bg-violet-50 text-violet-700 ring-violet-600/15',
  },
  on_the_way: {
    label: 'Out for Delivery',
    dot: 'bg-brand-500',
    badge: 'bg-brand-50 text-brand-700 ring-brand-600/15',
  },
  arrived: {
    label: 'Arrived',
    dot: 'bg-teal-500',
    badge: 'bg-teal-50 text-teal-700 ring-teal-600/15',
  },
  delivered: {
    label: 'Delivered',
    dot: 'bg-success',
    badge: 'bg-green-50 text-green-700 ring-green-600/15',
  },
  cancelled: {
    label: 'Cancelled',
    dot: 'bg-danger',
    badge: 'bg-red-50 text-red-700 ring-red-600/15',
  },
}

/** The forward order of the live "Order Journey" (excludes cancelled). */
export const ORDER_JOURNEY: OrderStatus[] = [
  'placed',
  'packing',
  'picked_up',
  'on_the_way',
  'arrived',
  'delivered',
]

/**
 * Who normally performs each status transition (Blinkit-style flow):
 * - system: automatic when the customer places/pays
 * - store:  dark-store staff / admin accept & pack
 * - rider:  the delivery rider updates from their app
 * The admin dashboard can override rider stages when needed.
 */
export type StageActor = 'system' | 'store' | 'rider'

export const ORDER_STAGE_ACTOR: Record<OrderStatus, StageActor> = {
  placed: 'system',
  packing: 'store',
  picked_up: 'rider',
  on_the_way: 'rider',
  arrived: 'rider',
  delivered: 'rider',
  cancelled: 'store',
}

export const ACTOR_META: Record<StageActor, { label: string; badge: string }> = {
  system: { label: 'Automatic', badge: 'bg-slate-100 text-slate-600 ring-slate-500/15' },
  store: { label: 'Store / Admin', badge: 'bg-brand-50 text-brand-700 ring-brand-600/15' },
  rider: { label: 'Rider', badge: 'bg-violet-50 text-violet-700 ring-violet-600/15' },
}

export const DRIVER_STATUS_META: Record<
  DriverStatus,
  { label: string; dot: string; badge: string }
> = {
  available: {
    label: 'Available',
    dot: 'bg-success',
    badge: 'bg-green-50 text-green-700 ring-green-600/15',
  },
  on_delivery: {
    label: 'On Delivery',
    dot: 'bg-brand-500',
    badge: 'bg-brand-50 text-brand-700 ring-brand-600/15',
  },
  offline: {
    label: 'Offline',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 ring-slate-500/15',
  },
}

export const PRODUCT_STATUS_META: Record<
  ProductStatus,
  { label: string; badge: string }
> = {
  active: { label: 'In Stock', badge: 'bg-green-50 text-green-700 ring-green-600/15' },
  low_stock: { label: 'Low Stock', badge: 'bg-amber-50 text-amber-700 ring-amber-600/15' },
  out_of_stock: { label: 'Out of Stock', badge: 'bg-red-50 text-red-700 ring-red-600/15' },
}

export const PAYMENT_META: Record<PaymentMethod, { label: string; abbr: string }> = {
  esewa: { label: 'eSewa', abbr: 'eS' },
  khalti: { label: 'Khalti', abbr: 'Kh' },
  connectips: { label: 'ConnectIPS', abbr: 'CI' },
  cod: { label: 'Cash on Delivery', abbr: 'CD' },
}

/** Driver report reasons + status styling. */
export const REPORT_REASON_META: Record<ReportReason, string> = {
  rude: 'Rude behaviour',
  late: 'Late delivery',
  wrong_items: 'Wrong / missing items',
  extra_charge: 'Asked for extra money',
  unprofessional: 'Unprofessional conduct',
  other: 'Other',
}

export const REPORT_STATUS_META: Record<ReportStatus, { label: string; badge: string }> = {
  open: { label: 'Open', badge: 'bg-red-50 text-red-700 ring-red-600/15' },
  reviewed: { label: 'Reviewed', badge: 'bg-green-50 text-green-700 ring-green-600/15' },
  dismissed: { label: 'Dismissed', badge: 'bg-slate-100 text-slate-600 ring-slate-500/15' },
}

/** Transaction type/status styling. `sign` shows money in (+) vs out (−). */
export const TXN_TYPE_META: Record<
  TransactionType,
  { label: string; sign: 1 | -1; badge: string }
> = {
  order_payment: { label: 'Order payment', sign: 1, badge: 'bg-green-50 text-green-700 ring-green-600/15' },
  cod_collection: { label: 'COD collection', sign: 1, badge: 'bg-brand-50 text-brand-700 ring-brand-600/15' },
  refund: { label: 'Refund', sign: -1, badge: 'bg-amber-50 text-amber-700 ring-amber-600/15' },
  payout: { label: 'Rider payout', sign: -1, badge: 'bg-violet-50 text-violet-700 ring-violet-600/15' },
}

export const TXN_STATUS_META: Record<TransactionStatus, { label: string; badge: string }> = {
  success: { label: 'Success', badge: 'bg-green-50 text-green-700 ring-green-600/15' },
  pending: { label: 'Pending', badge: 'bg-amber-50 text-amber-700 ring-amber-600/15' },
  failed: { label: 'Failed', badge: 'bg-red-50 text-red-700 ring-red-600/15' },
}

/** Rider fuel reimbursement rate (NPR per km) — configurable in production. */
export const FUEL_RATE_PER_KM = 4

/** Customer wallet-credit reasons (manual admin credits). */
export const CREDIT_TYPE_META: Record<CreditType, string> = {
  refund: 'Refund',
  partial_refund: 'Partial refund',
  compensation: 'Compensation',
  dispute: 'Dispute resolution',
  goodwill: 'Goodwill credit',
  other: 'Other adjustment',
}

/** Configurable modules per dark store (feature toggles). */
export const STORE_FEATURES: { key: StoreFeatureKey; label: string }[] = [
  { key: 'orders', label: 'Order Management' },
  { key: 'inventory', label: 'Inventory Management' },
  { key: 'products', label: 'Product Management' },
  { key: 'customers', label: 'Customer Management' },
  { key: 'delivery', label: 'Delivery Management' },
  { key: 'reports', label: 'Reports & Analytics' },
  { key: 'promotions', label: 'Promotions & Discounts' },
  { key: 'returns', label: 'Returns & Refunds' },
  { key: 'settings', label: 'Store Settings' },
  { key: 'staff', label: 'Staff Management' },
  { key: 'cash', label: 'Cash Management' },
  { key: 'invoices', label: 'Invoice Printing' },
  { key: 'notifications', label: 'Notifications' },
]

/** All store features enabled (default for a new store). */
export const allStoreFeaturesOn = (): Record<StoreFeatureKey, boolean> =>
  Object.fromEntries(STORE_FEATURES.map((f) => [f.key, true])) as Record<StoreFeatureKey, boolean>

/** Service zones in Butwal (used for filtering / dispatch). */
export const ZONES = [
  'Traffic Chowk',
  'Amarpath',
  'Milanchowk',
  'Golpark',
  'Sukkhanagar',
  'Buddhanagar',
] as const
