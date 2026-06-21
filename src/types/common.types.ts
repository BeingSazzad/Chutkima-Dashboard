/** Domain types shared across the Chutkima admin dashboard. */

export type ID = string

/** Order lifecycle — mirrors the customer app's "Order Journey". */
export type OrderStatus =
  | 'placed'
  | 'packing'
  | 'picked_up'
  | 'on_the_way'
  | 'arrived'
  | 'delivered'
  | 'cancelled'

export type PaymentMethod = 'esewa' | 'khalti' | 'connectips' | 'cod'
export type PaymentStatus = 'paid' | 'pending' | 'refunded'

export type DriverStatus = 'available' | 'on_delivery' | 'offline'

export type ProductStatus = 'active' | 'low_stock' | 'out_of_stock'

export interface OrderItem {
  productId: ID
  name: string
  image: string
  quantity: number
  price: number
  /** Set when admin swapped this for an out-of-stock item. */
  substituted?: boolean
  originalName?: string
}

/** One rider assigned to an order (multi-rider supports up to 3). */
export interface OrderAssignment {
  driverId: ID
  /** Portion note, e.g. "beverages" / "vegetables". */
  note: string
  confirmed: boolean
}

export interface Order {
  id: ID
  reference: string
  customerId: ID
  customerName: string
  customerPhone: string
  address: string
  zone: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  grandTotal: number
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  status: OrderStatus
  /** Primary rider (first assignment) — kept for list/badge convenience. */
  driverId: ID | null
  /** All riders on this order (multi-rider). */
  assignments: OrderAssignment[]
  /** Dark store fulfilling this order. */
  storeId: ID
  /** Packer assigned to pick & pack this order (optional role). */
  packerId: ID | null
  /** Admin has confirmed packing is complete. */
  packed: boolean
  etaMinutes: number
  placedAt: string
  /** Customer delivery instructions / note from checkout. */
  note: string
  /** Reason captured when an order is cancelled (mandatory). */
  cancelReason: string
  /** Whether the rider's COD cash has been confirmed collected. */
  codCollected: boolean
}

export interface Product {
  id: ID
  /** Stock-keeping unit code (used in packer messages). */
  sku: string
  name: string
  brand: string
  category: string
  categoryGroup: string
  /** Primary image (= images[0]). */
  image: string
  /** Full image gallery. */
  images?: string[]
  /** Selling price the customer pays. */
  price: number
  /** Original price; shown struck-through when higher than price (0 = none). */
  mrp: number
  unit: string
  stock: number
  /** Per-product low-stock alert threshold. */
  lowStockThreshold: number
  /** Warehouse shelf location (used in packer messages). */
  shelfNo: string
  /** Flagged for clearance — shows a "Clearance" badge in the app. */
  onClearance: boolean
  status: ProductStatus
  deliveryMins: number
  sold: number
}

/** A top-level grouping of categories (e.g. "Grocery & Kitchen"). */
export interface CategoryGroup {
  id: ID
  name: string
  position: number
  active: boolean
}

export interface Category {
  id: ID
  name: string
  group: string
  emoji: string
  /** Uploaded category image (data URL or hosted URL). Falls back to emoji. */
  image: string
  productCount: number
  /** Display order within its group. */
  position: number
  active: boolean
}

export interface Driver {
  id: ID
  name: string
  phone: string
  avatar: string
  vehicle: string
  status: DriverStatus
  zone: string
  rating: number
  activeOrderId: ID | null
  deliveriesToday: number
  totalDeliveries: number
  onTimeRate: number
  /** Distance driven today (km) — drives the fuel calculation. */
  kmToday: number
}

/** Customer reliability badge (COD trust system). */
export type TrustBadge = 'green' | 'gray' | 'red'

export interface Customer {
  id: ID
  name: string
  phone: string
  address: string
  zone: string
  totalOrders: number
  totalSpent: number
  joinedAt: string
  lastOrderAt: string
  banned: boolean
  // Trust system
  trustBadge: TrustBadge
  codCancellations: number
  notRespondingCount: number
  completedOrders: number
  // Referral + wallet
  referralCode: string
  referredCount: number
  creditsEarned: number
  creditsRedeemed: number
  walletBalance: number
}

/** Banner placement on the customer app. */
export type BannerPlacement = 'hero' | 'grid_small' | 'category_strip'

export interface Banner {
  id: ID
  title: string
  subtitle: string
  image: string
  placement: BannerPlacement
  /** Sort order within its placement (lower = first). */
  position: number
  ctaLabel: string
  ctaLink: string
  active: boolean
}

export interface OnboardingSlide {
  id: ID
  title: string
  subtitle: string
  image: string
  position: number
  active: boolean
}

/** Editable static content pages (CMS). */
export type ContentPageKey = 'terms' | 'privacy' | 'refund' | 'about' | 'shipping'

export interface ContentPage {
  id: ID
  key: ContentPageKey
  title: string
  body: string
  updatedAt: string
}

/** A managed FAQ section (e.g. "Delivery Times"). Admins can add/remove these. */
export interface FaqSection {
  id: ID
  name: string
  position: number
}

export interface FaqItem {
  id: ID
  question: string
  answer: string
  /** Section name this FAQ belongs to (managed via FaqSection). */
  section: string
  position: number
  active: boolean
}

/**
 * A configurable section of the customer app's home feed.
 * - best_seller: auto top-selling products
 * - category_products: products from a chosen category group
 * - manual_products: hand-picked products
 * - category_grid: shows the category tiles of a group (not products)
 */
export type HomeSectionType =
  | 'best_seller'
  | 'category_products'
  | 'manual_products'
  | 'category_grid'

export interface HomeSection {
  id: ID
  title: string
  type: HomeSectionType
  /** Used by category_products / category_grid. */
  categoryGroup: string
  /** Used by manual_products. */
  productIds: ID[]
  showViewAll: boolean
  position: number
  active: boolean
}

export type CouponType = 'percent' | 'flat' | 'free_delivery'

export interface Coupon {
  id: ID
  code: string
  description: string
  type: CouponType
  /** % for percent, NPR for flat, ignored for free_delivery. */
  value: number
  minOrder: number
  maxDiscount: number
  usageLimit: number
  used: number
  validUntil: string
  active: boolean
}

export interface Zone {
  id: ID
  name: string
  etaMins: number
  deliveryFee: number
  /** Localities/areas this zone covers (shown to customers, used for serviceability). */
  areas: string[]
  /** Optional Google Maps link to the zone area (real geofencing needs a maps SDK). */
  mapLink: string
  active: boolean
}

/** Tiered delivery fee: fee applies when order >= minOrder (highest match wins). */
export interface DeliveryTier {
  minOrder: number
  fee: number
}

export interface DeliveryConfig {
  freeAbove: number
  tiers: DeliveryTier[]
}

export interface SearchKeyword {
  id: ID
  term: string
  position: number
}

/** Packer staff — no app login; receive pick-lists via WhatsApp. */
export interface Packer {
  id: ID
  name: string
  whatsapp: string
  active: boolean
  packedToday: number
  createdAt: string
}

/** A dark store (fulfilment hub). Master admin manages many. */
export interface DarkStore {
  id: ID
  name: string
  address: string
  phone: string
  whatsapp: string
  openTime: string
  closeTime: string
  active: boolean
  createdAt: string
}

export type AdminRole = 'admin' | 'manager' | 'dispatcher'

export interface AdminUser {
  id: ID
  name: string
  email: string
  phone: string
  role: AdminRole
  avatar: string
  active: boolean
  /** Assigned dark store; null = master admin (all stores). */
  storeId: ID | null
  lastActiveAt: string
  createdAt: string
}

// ── Driver reviews & reports ────────────────────────────────────────────────
export interface DriverReview {
  id: ID
  driverId: ID
  customerName: string
  orderId: string
  rating: number
  comment: string
  createdAt: string
}

export type ReportReason =
  | 'rude'
  | 'late'
  | 'wrong_items'
  | 'extra_charge'
  | 'unprofessional'
  | 'other'

export type ReportStatus = 'open' | 'reviewed' | 'dismissed'

export interface DriverReport {
  id: ID
  driverId: ID
  customerName: string
  orderId: string
  reason: ReportReason
  details: string
  status: ReportStatus
  createdAt: string
}

// ── Transactions ────────────────────────────────────────────────────────────
export type TransactionType = 'order_payment' | 'refund' | 'cod_collection' | 'payout'
export type TransactionStatus = 'success' | 'pending' | 'failed'

export interface Transaction {
  id: ID
  type: TransactionType
  reference: string
  /** Counterparty — customer or driver name. */
  party: string
  amount: number
  method: string
  status: TransactionStatus
  orderId: ID | null
  createdAt: string
}

export interface KpiSummary {
  revenueToday: number
  revenueChange: number
  ordersToday: number
  ordersChange: number
  avgDeliveryMins: number
  deliveryChange: number
  activeDrivers: number
  totalDrivers: number
}

export interface RevenuePoint {
  label: string
  revenue: number
  orders: number
}

export interface CategorySalesPoint {
  name: string
  value: number
}
