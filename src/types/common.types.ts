/** Domain types shared across the Chutkima admin dashboard. */

export type ID = string

/** Order lifecycle — mirrors the customer app's "Order Journey". */
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'packing'
  | 'packed'
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

/** One immutable admin note in an order's notes audit trail. */
export interface OrderNote {
  id: ID
  content: string
  adminName: string
  adminId?: ID
  at: string
}

/** Refund type — full or partial. */
export type RefundType = 'full' | 'partial'

/** One refund record against an order (audit trail). */
export interface OrderRefund {
  id: ID
  type: RefundType
  amount: number
  reason: string
  comments: string
  adminName: string
  at: string
  status: 'processed'
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
  /** Optional packer assigned to pick & pack this order. */
  packerId: ID | null
  /** Admin has confirmed packing is complete (order is "Ready to Collect"). */
  packed: boolean
  /** The assigned rider has accepted the job (false right after assignment). */
  riderAccepted: boolean
  etaMinutes: number
  placedAt: string
  /** Customer delivery instructions / note from checkout. */
  note: string
  /** Reason captured when an order is cancelled (mandatory). */
  cancelReason: string
  /** Whether the rider's COD cash has been confirmed collected. */
  codCollected: boolean
  /** ISO timestamp each journey stage was reached. */
  stageTimestamps: Partial<Record<OrderStatus, string>>
  /** Internal admin note for disputes / follow-ups (not shown to customer). */
  adminNote: string
  /** Append-only audit trail of admin notes (multiple, never overwritten). */
  notes: OrderNote[]
  /** Refund records against this order (full / partial). */
  refunds: OrderRefund[]
  /** Pre-booked delivery time (after-hours scheduled order); null = deliver now. */
  scheduledFor: string | null
  /** Delivery destination coordinates (for live rider tracking on the map). */
  lat?: number
  lng?: number
}

export interface Product {
  id: ID
  /** Stock-keeping unit code. */
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
  /** Warehouse shelf location. */
  shelfNo: string
  /** Flagged for clearance — shows a "Clearance" badge in the app. */
  onClearance: boolean
  /** Visible in the customer catalog (hide without deleting). */
  active: boolean
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
  /** Driving license number (rider KYC). */
  licenseNo?: string
  /** Scanned driving-license document (data URL). */
  licenseDoc?: string
  /** Scanned vehicle-registration document (data URL). */
  vehicleRegDoc?: string
  vehicle: string
  status: DriverStatus
  /** Employment standing — defaults to active when unset. */
  accountStatus?: DriverAccountStatus
  zone: string
  rating: number
  activeOrderId: ID | null
  deliveriesToday: number
  totalDeliveries: number
  onTimeRate: number
  /** Distance driven today (km) — drives the fuel calculation. */
  kmToday: number
  /** Live GPS position — used to rank riders by distance to the dark store. */
  lat?: number
  lng?: number
}

/** Customer reliability badge (COD trust system). */
export type TrustBadge = 'green' | 'gray' | 'red'
export type CustomerTier = 'new' | 'loyal' | 'vip'

/** Why a manual wallet credit was issued. */
export type CreditType =
  | 'refund'
  | 'partial_refund'
  | 'compensation'
  | 'dispute'
  | 'goodwill'
  | 'other'

/** One manual wallet credit (audit trail) — added by an admin. */
export interface CustomerCredit {
  id: ID
  amount: number
  type: CreditType
  reason: string
  /** Related order, where applicable. */
  orderId?: string
  note?: string
  adminName: string
  at: string
}

/** Packer staff — pick & pack orders; no app login. */
export interface Packer {
  id: ID
  name: string
  phone: string
  active: boolean
  packedToday: number
  createdAt: string
}

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
  /** Loyalty tier — VIP customers get free delivery. */
  tier: CustomerTier
  // Trust system (badge is derived from these counts via lib/trust)
  codCancellations: number
  notRespondingCount: number
  completedOrders: number
  /** Manual trust-badge override; 'auto' = derive from the counts above. */
  trustOverride: TrustBadge | 'auto'
  // Referral + wallet
  referralCode: string
  referredCount: number
  creditsEarned: number
  creditsRedeemed: number
  walletBalance: number
  /** Manual admin wallet credits (refunds, compensation…) — audit trail. */
  credits: CustomerCredit[]
}

/** Banner placement on the customer app. */
export type BannerPlacement = 'hero' | 'grid_small' | 'category_strip' | 'vertical'

/** Banner media — a still image or a short video. */
export type BannerMedia = 'image' | 'video'

export interface Banner {
  id: ID
  title: string
  subtitle: string
  image: string
  /** Whether this banner shows an image or a video (defaults to image). */
  mediaType?: BannerMedia
  /** Video source URL (used when mediaType === 'video'). */
  video?: string
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
  /** Localities/areas this zone covers (shown to customers, used for serviceability). */
  areas: string[]
  /** Optional Google Maps link to the zone area. */
  mapLink: string
  /** Geo-fence polygon as [lat, lng] vertices (empty = not drawn yet). */
  geofence: [number, number][]
  /** Dark store that fulfils orders in this zone (order auto-routing). */
  storeId?: ID
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

/** A dark store (fulfilment hub). Master admin manages many. */
export type StoreFeatureKey =
  | 'orders'
  | 'inventory'
  | 'products'
  | 'customers'
  | 'delivery'
  | 'reports'
  | 'promotions'
  | 'returns'
  | 'settings'
  | 'staff'
  | 'cash'
  | 'invoices'
  | 'notifications'

export interface DarkStore {
  id: ID
  name: string
  address: string
  phone: string
  whatsapp: string
  openTime: string
  closeTime: string
  /** Store location — used to rank riders by distance for assignment. */
  lat?: number
  lng?: number
  active: boolean
  /** Temporarily stop taking orders at this store (customers see a closure message). */
  offline: boolean
  /** Per-store module access — disabled modules are hidden for that store's admin. */
  features: Record<StoreFeatureKey, boolean>
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

/** One immutable entry in a complaint's audit trail (never overwritten). */
export interface ComplaintAction {
  id: ID
  /** What happened, e.g. "Complaint filed", "Marked reviewed", "Note added". */
  action: string
  /** Admin who took the action ("System" for the original filing). */
  adminName: string
  /** Optional free-text note attached to this action. */
  note?: string
  at: string
}

export interface DriverReport {
  id: ID
  driverId: ID
  customerName: string
  orderId: string
  reason: ReportReason
  details: string
  status: ReportStatus
  createdAt: string
  /** Append-only history of every admin action on this complaint. */
  actions: ComplaintAction[]
}

/** A rider's employment/account standing (separate from on-shift availability). */
export type DriverAccountStatus = 'active' | 'suspended' | 'terminated'
export type DriverAccountAction = 'suspended' | 'terminated' | 'reinstated'

/** A suspension / termination / reinstatement record for a rider (audit trail). */
export interface DriverAccountEvent {
  id: ID
  driverId: ID
  action: DriverAccountAction
  reason: string
  by: string
  at: string
}

/** Escalation level of a warning issued to a rider. */
export type WarningSeverity = 'notice' | 'warning' | 'final'

/** A formal warning an admin issues to a rider (often after a complaint). */
export interface DriverWarning {
  id: ID
  driverId: ID
  severity: WarningSeverity
  message: string
  /** The complaint that triggered this warning, if any. */
  reportId?: ID
  issuedBy: string
  createdAt: string
}

// ── Transactions ────────────────────────────────────────────────────────────
export type TransactionType = 'order_payment' | 'refund' | 'cod_collection' | 'payout' | 'rider_deposit'
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

/** A rider handing their collected COD cash (minus fuel) over to the store/admin. */
export interface RiderDeposit {
  id: ID
  driverId: ID
  driverName: string
  /** Cash that was owed (net to deposit) at the time of collection. */
  amountDue: number
  /** Cash actually handed over / collected. */
  amount: number
  note: string
  /** Admin who received the cash. */
  collectedBy: string
  /** The rider has confirmed this handover (two-party sign-off). */
  confirmedByRider: boolean
  confirmedAt?: string
  createdAt: string
}

// ── Internal billing (staff purchases / damaged / near-expiry / clearance) ───
export interface InternalOrderItem {
  productId: ID
  sku: string
  name: string
  quantity: number
  /** Regular selling price. */
  originalPrice: number
  /** Price actually charged (may be below original). */
  sellPrice: number
}

export interface InternalOrder {
  id: ID
  /** Separate series from customer orders, e.g. "INT-000001". */
  reference: string
  staffName: string
  items: InternalOrderItem[]
  /** Sum at original prices. */
  originalTotal: number
  /** Sum at the charged prices. */
  sellTotal: number
  /** originalTotal − sellTotal. */
  discount: number
  /** Mandatory when selling below the standard price. */
  reason: string
  comments: string
  adminName: string
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
