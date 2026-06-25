import type {
  AdminUser,
  Banner,
  Category,
  CategoryGroup,
  ContentPage,
  DarkStore,
  Packer,
  Coupon,
  Customer,
  CustomerTier,
  DeliveryConfig,
  Driver,
  DriverReport,
  DriverReview,
  DriverWarning,
  FaqItem,
  FaqSection,
  HomeSection,
  InternalOrder,
  OnboardingSlide,
  Order,
  OrderStatus,
  Product,
  RiderDeposit,
  SearchKeyword,
  Transaction,
  Zone,
} from '@/types/common.types'
import { allStoreFeaturesOn } from '@/lib/constants'

/**
 * In-memory seeded dataset for the Chutkima admin dashboard.
 * Acts as a mutable store so demo mutations (assign driver, update status,
 * toggle product) persist for the session. Replace with real API later.
 */

const img = (seed: string) => `https://picsum.photos/seed/chutkima-${seed}/200/200`
const avatar = (seed: string) => `https://i.pravatar.cc/120?u=chutkima-${seed}`
const minsAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString()
const daysAgo = (d: number) => new Date(Date.now() - d * 86_400_000).toISOString()
const daysAhead = (d: number) => new Date(Date.now() + d * 86_400_000).toISOString()

// ── Categories ──────────────────────────────────────────────────────────────
const catImg = (seed: string) => `https://picsum.photos/seed/chutkima-cat-${seed}/200/200`
export const categories: Category[] = [
  { id: 'c1', name: 'Fruits & Vegetables', group: 'Grocery & Kitchen', emoji: '🥬', image: catImg('veg'), productCount: 84, position: 1, active: true },
  { id: 'c2', name: 'Daal & Pulses', group: 'Grocery & Kitchen', emoji: '🫘', image: catImg('daal'), productCount: 36, position: 2, active: true },
  { id: 'c3', name: 'Cooking Oil', group: 'Grocery & Kitchen', emoji: '🛢️', image: catImg('oil'), productCount: 22, position: 3, active: true },
  { id: 'c4', name: 'Tea & Coffee', group: 'Grocery & Kitchen', emoji: '☕', image: catImg('tea'), productCount: 41, position: 4, active: true },
  { id: 'c5', name: 'Rice', group: 'Grocery & Kitchen', emoji: '🍚', image: catImg('rice'), productCount: 28, position: 5, active: true },
  { id: 'c6', name: 'Frozen & Canned', group: 'Grocery & Kitchen', emoji: '🥫', image: catImg('frozen'), productCount: 33, position: 6, active: true },
  { id: 'c7', name: 'Chips & Snacks', group: 'Snacks & Drinks', emoji: '🍿', image: catImg('chips'), productCount: 67, position: 1, active: true },
  { id: 'c8', name: 'Chocolates & Sweets', group: 'Snacks & Drinks', emoji: '🍫', image: catImg('choco'), productCount: 52, position: 2, active: true },
  { id: 'c9', name: 'Soft Drinks & Juices', group: 'Snacks & Drinks', emoji: '🥤', image: catImg('drinks'), productCount: 44, position: 3, active: true },
  { id: 'c10', name: 'Milk & Health Drinks', group: 'Snacks & Drinks', emoji: '🥛', image: catImg('milk'), productCount: 30, position: 4, active: true },
  { id: 'c11', name: 'Biscuits & Cookies', group: 'Snacks & Drinks', emoji: '🍪', image: catImg('biscuit'), productCount: 48, position: 5, active: true },
  { id: 'c12', name: 'Ice-cream & Popsicles', group: 'Snacks & Drinks', emoji: '🍦', image: catImg('icecream'), productCount: 19, position: 6, active: false },
  { id: 'c13', name: 'Baby Care', group: 'Beauty & Personal Care', emoji: '🍼', image: catImg('baby'), productCount: 25, position: 1, active: true },
  { id: 'c14', name: 'Hair Care', group: 'Beauty & Personal Care', emoji: '🧴', image: catImg('hair'), productCount: 38, position: 2, active: true },
  { id: 'c15', name: 'Oral Care', group: 'Beauty & Personal Care', emoji: '🪥', image: catImg('oral'), productCount: 21, position: 3, active: true },
  { id: 'c16', name: "Men's Grooming", group: 'Beauty & Personal Care', emoji: '🧔', image: catImg('grooming'), productCount: 17, position: 4, active: true },
]

// ── Products ────────────────────────────────────────────────────────────────
export const products: Product[] = [
  { id: 'p1', sku: 'WW-001', name: 'Wai Wai Vegetable Instant Noodles', brand: 'Wai Wai', category: 'Chips & Snacks', categoryGroup: 'Snacks & Drinks', image: img('noodles'), price: 35, mrp: 40, unit: '84g', stock: 320, lowStockThreshold: 30, shelfNo: 'A-3', onClearance: false, active: true, status: 'active', deliveryMins: 15, sold: 1240 },
  { id: 'p2', sku: 'NO-101', name: "Nature's Pure Sunflower Oil 1L", brand: "Nature's", category: 'Cooking Oil', categoryGroup: 'Grocery & Kitchen', image: img('oil'), price: 385, mrp: 420, unit: '1L', stock: 96, lowStockThreshold: 15, shelfNo: 'C-1', onClearance: false, active: true, status: 'active', deliveryMins: 12, sold: 540 },
  { id: 'p3', sku: 'HR-201', name: 'Heritage Select Premium Basmati Rice 1kg', brand: 'Heritage', category: 'Rice', categoryGroup: 'Grocery & Kitchen', image: img('rice'), price: 249, mrp: 280, unit: '1kg', stock: 58, lowStockThreshold: 15, shelfNo: 'C-2', onClearance: false, active: true, status: 'active', deliveryMins: 12, sold: 410 },
  { id: 'p4', sku: 'NU-310', name: 'Choco Delight Chocolate Drink Powder 500g', brand: 'Nutri', category: 'Milk & Health Drinks', categoryGroup: 'Snacks & Drinks', image: img('choco'), price: 495, mrp: 550, unit: '500g', stock: 12, lowStockThreshold: 15, shelfNo: 'D-4', onClearance: false, active: true, status: 'low_stock', deliveryMins: 15, sold: 220 },
  { id: 'p5', sku: 'HB-205', name: 'Heritage Select Digestive Biscuits 400g', brand: 'Heritage', category: 'Biscuits & Cookies', categoryGroup: 'Snacks & Drinks', image: img('biscuit'), price: 185, mrp: 200, unit: '400g', stock: 140, lowStockThreshold: 20, shelfNo: 'B-5', onClearance: false, active: true, status: 'active', deliveryMins: 15, sold: 360 },
  { id: 'p6', sku: 'NJ-410', name: "Nature's Pride Mixed Fruit Juice 1L", brand: "Nature's", category: 'Soft Drinks & Juices', categoryGroup: 'Snacks & Drinks', image: img('juice'), price: 225, mrp: 250, unit: '1L', stock: 0, lowStockThreshold: 15, shelfNo: 'D-1', onClearance: false, active: false, status: 'out_of_stock', deliveryMins: 12, sold: 180 },
  { id: 'p7', sku: 'GM-150', name: 'Gokul Full Cream Milk 500ml', brand: 'Gokul', category: 'Milk & Health Drinks', categoryGroup: 'Snacks & Drinks', image: img('milk'), price: 35, mrp: 38, unit: '500ml', stock: 210, lowStockThreshold: 40, shelfNo: 'F-2', onClearance: false, active: true, status: 'active', deliveryMins: 10, sold: 980 },
  { id: 'p8', sku: 'TK-220', name: 'Tokla Premium Tea 200g', brand: 'Tokla', category: 'Tea & Coffee', categoryGroup: 'Grocery & Kitchen', image: img('tea'), price: 145, mrp: 160, unit: '200g', stock: 74, lowStockThreshold: 15, shelfNo: 'B-1', onClearance: true, active: true, status: 'active', deliveryMins: 12, sold: 300 },
  { id: 'p9', sku: 'MD-130', name: 'Mustang Daal Masino 1kg', brand: 'Mustang', category: 'Daal & Pulses', categoryGroup: 'Grocery & Kitchen', image: img('daal'), price: 175, mrp: 190, unit: '1kg', stock: 41, lowStockThreshold: 15, shelfNo: 'C-3', onClearance: false, active: true, status: 'active', deliveryMins: 12, sold: 260 },
  { id: 'p10', sku: 'CK-330', name: 'Current Tomato Ketchup 500g', brand: 'Current', category: 'Frozen & Canned', categoryGroup: 'Grocery & Kitchen', image: img('ketchup'), price: 165, mrp: 180, unit: '500g', stock: 9, lowStockThreshold: 15, shelfNo: 'B-7', onClearance: false, active: true, status: 'low_stock', deliveryMins: 15, sold: 150 },
  { id: 'p11', sku: 'LY-140', name: 'Lays Classic Salted Chips 52g', brand: 'Lays', category: 'Chips & Snacks', categoryGroup: 'Snacks & Drinks', image: img('chips'), price: 65, mrp: 70, unit: '52g', stock: 188, lowStockThreshold: 30, shelfNo: 'A-1', onClearance: false, active: true, status: 'active', deliveryMins: 10, sold: 720 },
  { id: 'p12', sku: 'CC-160', name: 'Coca-Cola 1.25L', brand: 'Coca-Cola', category: 'Soft Drinks & Juices', categoryGroup: 'Snacks & Drinks', image: img('coke'), price: 130, mrp: 140, unit: '1.25L', stock: 132, lowStockThreshold: 24, shelfNo: 'F-1', onClearance: false, active: true, status: 'active', deliveryMins: 10, sold: 610 },
]

// ── Drivers ─────────────────────────────────────────────────────────────────
export const drivers: Driver[] = [
  { id: 'd1', name: 'Manoj Thapa', phone: '+977 9841000001', avatar: avatar('d1'), vehicle: 'Scooter · BA 24 PA 1290', status: 'on_delivery', zone: 'Traffic Chowk', rating: 4.9, activeOrderId: 'o1', deliveriesToday: 11, totalDeliveries: 1820, onTimeRate: 97, kmToday: 38, lat: 27.7010, lng: 83.4486 },
  { id: 'd2', name: 'Suresh Gurung', phone: '+977 9841000002', avatar: avatar('d2'), vehicle: 'Bike · LU 1 CHA 4421', status: 'available', zone: 'Amarpath', rating: 4.8, activeOrderId: null, deliveriesToday: 8, totalDeliveries: 1340, onTimeRate: 95, kmToday: 26, lat: 27.6962, lng: 83.4521 },
  { id: 'd3', name: 'Bikash Tamang', phone: '+977 9841000003', avatar: avatar('d3'), vehicle: 'Scooter · LU 2 PA 0098', status: 'available', zone: 'Milanchowk', rating: 4.7, activeOrderId: null, deliveriesToday: 6, totalDeliveries: 920, onTimeRate: 93, kmToday: 19, lat: 27.7052, lng: 83.4402 },
  { id: 'd4', name: 'Ramesh Bhandari', phone: '+977 9841000004', avatar: avatar('d4'), vehicle: 'Bike · LU 5 CHA 7711', status: 'on_delivery', zone: 'Golpark', rating: 4.6, activeOrderId: 'o4', deliveriesToday: 9, totalDeliveries: 1110, onTimeRate: 91, kmToday: 31, lat: 27.6906, lng: 83.4617 },
  { id: 'd5', name: 'Dipesh Shrestha', phone: '+977 9841000005', avatar: avatar('d5'), vehicle: 'Scooter · BA 31 PA 2200', status: 'available', zone: 'Traffic Chowk', rating: 4.9, activeOrderId: null, deliveriesToday: 12, totalDeliveries: 2050, onTimeRate: 98, kmToday: 44, lat: 27.7001, lng: 83.4472 },
  { id: 'd6', name: 'Anil Karki', phone: '+977 9841000006', avatar: avatar('d6'), vehicle: 'Bike · LU 3 CHA 5532', status: 'offline', zone: 'Sukkhanagar', rating: 4.5, activeOrderId: null, deliveriesToday: 0, totalDeliveries: 640, onTimeRate: 88, kmToday: 0, lat: 27.6852, lng: 83.4701 },
  { id: 'd7', name: 'Kiran Magar', phone: '+977 9841000007', avatar: avatar('d7'), vehicle: 'Scooter · LU 1 PA 9087', status: 'available', zone: 'Buddhanagar', rating: 4.8, activeOrderId: null, deliveriesToday: 7, totalDeliveries: 1005, onTimeRate: 94, kmToday: 23, lat: 27.6981, lng: 83.4662 },
  { id: 'd8', name: 'Sanjay Bk', phone: '+977 9841000008', avatar: avatar('d8'), vehicle: 'Bike · BA 12 PA 6543', status: 'offline', zone: 'Amarpath', rating: 4.4, activeOrderId: null, deliveriesToday: 0, totalDeliveries: 480, onTimeRate: 86, kmToday: 0, lat: 27.6942, lng: 83.4556 },
]

// ── Customers ───────────────────────────────────────────────────────────────
const cust = (
  id: string, name: string, phone: string, address: string, zone: string,
  totalOrders: number, totalSpent: number, joined: number, last: string,
  banned: boolean, codCancellations: number,
  notRespondingCount: number, ref: string, referredCount: number, walletBalance: number,
): Customer => ({
  id, name, phone, address, zone, totalOrders, totalSpent,
  joinedAt: daysAgo(joined), lastOrderAt: last, banned,
  tier: totalSpent > 25000 ? 'vip' : totalOrders > 15 ? 'loyal' : 'new',
  codCancellations, notRespondingCount, completedOrders: totalOrders,
  trustOverride: 'auto',
  referralCode: ref, referredCount, creditsEarned: referredCount * 50,
  creditsRedeemed: Math.max(0, referredCount * 50 - walletBalance), walletBalance,
  credits: [],
})

export const customers: Customer[] = [
  cust('u1', 'Ram Sharma', '+977 9844000001', 'Amarpath-4, near Buddha Marg, Butwal', 'Amarpath', 42, 28450, 210, minsAgo(18), false, 0, 0, 'RAM4821', 6, 130),
  cust('u2', 'Sita Pandey', '+977 9844000002', 'Traffic Chowk-7, Butwal', 'Traffic Chowk', 31, 19980, 160, minsAgo(46), false, 1, 0, 'SITA7720', 3, 50),
  cust('u3', 'Hari Adhikari', '+977 9844000003', 'Milanchowk-11, Butwal', 'Milanchowk', 18, 9120, 95, minsAgo(120), false, 3, 1, 'HARI3310', 1, 0),
  cust('u4', 'Gita Khadka', '+977 9844000004', 'Golpark-9, Butwal', 'Golpark', 56, 41200, 300, minsAgo(8), false, 0, 0, 'GITA9051', 9, 220),
  cust('u5', 'Bishnu Pokharel', '+977 9844000005', 'Sukkhanagar-13, Butwal', 'Sukkhanagar', 7, 3380, 40, daysAgo(2), true, 5, 4, 'BISH4400', 0, 0),
  cust('u6', 'Anita Rana', '+977 9844000006', 'Buddhanagar-2, Butwal', 'Buddhanagar', 24, 15600, 130, minsAgo(75), false, 0, 0, 'ANITA612', 2, 60),
  cust('u7', 'Krishna Bhattarai', '+977 9844000007', 'Traffic Chowk-5, Butwal', 'Traffic Chowk', 12, 6740, 60, daysAgo(1), false, 2, 2, 'KRIS1208', 0, 0),
  cust('u8', 'Sarita Joshi', '+977 9844000008', 'Amarpath-8, Butwal', 'Amarpath', 38, 24310, 240, minsAgo(200), false, 1, 0, 'SARI8830', 4, 90),
]

// Seed a demo wallet credit so the credit-history audit trail isn't empty.
{
  const u3 = customers.find((c) => c.id === 'u3')
  if (u3) {
    u3.credits = [
      { id: 'cc-u3-1', amount: 100, type: 'compensation', reason: 'Late delivery', orderId: '#GF-48203-NP', note: 'Order took 40 min — goodwill compensation.', adminName: 'Kiran Chetri', at: daysAgo(4) },
    ]
  }
}

// ── Category groups ─────────────────────────────────────────────────────────
export const categoryGroups: CategoryGroup[] = [
  { id: 'g1', name: 'Grocery & Kitchen', position: 1, active: true },
  { id: 'g2', name: 'Snacks & Drinks', position: 2, active: true },
  { id: 'g3', name: 'Beauty & Personal Care', position: 3, active: true },
]

// ── Orders ──────────────────────────────────────────────────────────────────
function lineItem(p: Product, qty: number) {
  return { productId: p.id, name: p.name, image: p.image, quantity: qty, price: p.price }
}

function makeOrder(
  id: string,
  ref: string,
  cust: Customer,
  items: { p: Product; qty: number }[],
  status: OrderStatus,
  payment: Order['paymentMethod'],
  driverId: string | null,
  placedMinsAgo: number,
  etaMinutes: number,
  note = '',
  scheduledFor: string | null = null,
): Order {
  const lineItems = items.map((it) => lineItem(it.p, it.qty))
  const subtotal = lineItems.reduce((s, it) => s + it.price * it.quantity, 0)
  // VIP customers always get free delivery (feature: VIP = 0 delivery fee).
  const deliveryFee =
    cust.tier === 'vip'
      ? 0
      : subtotal >= 800 ? 0 : subtotal >= 600 ? 20 : subtotal >= 400 ? 40 : subtotal >= 200 ? 60 : 80

  // Per-stage timestamps (placed → … → current), spread from placedAt to now/delivery.
  const STAGES: OrderStatus[] = ['placed', 'packing', 'picked_up', 'on_the_way', 'arrived', 'delivered']
  const placedAtIso = minsAgo(placedMinsAgo)
  const placedMs = Date.parse(placedAtIso)
  const reached = status === 'cancelled' ? 0 : STAGES.indexOf(status)
  const slaMin = etaMinutes > 0 ? etaMinutes : 12
  const variance = ([...id].reduce((a, c) => a + c.charCodeAt(0), 0) % 11) - 4 // -4 … +6
  const elapsedMin = status === 'delivered' ? Math.max(5, slaMin + variance) : placedMinsAgo
  const stageTimestamps: Partial<Record<OrderStatus, string>> = {}
  for (let i = 0; i <= reached; i++) {
    const offset = reached === 0 ? 0 : (elapsedMin * i) / reached
    stageTimestamps[STAGES[i]] = new Date(placedMs + offset * 60_000).toISOString()
  }

  return {
    id,
    reference: ref,
    customerId: cust.id,
    customerName: cust.name,
    customerPhone: cust.phone,
    address: cust.address,
    zone: cust.zone,
    items: lineItems,
    subtotal,
    deliveryFee,
    grandTotal: subtotal + deliveryFee,
    paymentMethod: payment,
    paymentStatus: payment === 'cod' ? 'pending' : 'paid',
    status,
    driverId,
    assignments: driverId
      ? [{ driverId, note: '', confirmed: ['arrived', 'delivered'].includes(status) }]
      : [],
    storeId: ['Golpark', 'Sukkhanagar', 'Buddhanagar'].includes(cust.zone) ? 's2' : 's1',
    packerId: null,
    packed: ['picked_up', 'on_the_way', 'arrived', 'delivered'].includes(status),
    etaMinutes,
    placedAt: placedAtIso,
    note,
    cancelReason: status === 'cancelled' ? 'Customer not reachable' : '',
    codCollected: status === 'delivered' && payment === 'cod',
    stageTimestamps,
    adminNote: '',
    notes: [],
    refunds: [],
    scheduledFor,
  }
}

const P = (id: string) => products.find((p) => p.id === id)!

export const orders: Order[] = [
  makeOrder('o1', '#GF-48202-NP', customers[3], [{ p: P('p1'), qty: 3 }, { p: P('p7'), qty: 2 }], 'on_the_way', 'esewa', 'd1', 9, 6, 'Call on arrival — 3rd floor, blue gate.'),
  makeOrder('o2', '#GF-48203-NP', customers[0], [{ p: P('p2'), qty: 1 }, { p: P('p3'), qty: 1 }, { p: P('p9'), qty: 1 }], 'packing', 'khalti', null, 4, 14, 'Leave at the door if no answer.'),
  makeOrder('o3', '#GF-48204-NP', customers[1], [{ p: P('p11'), qty: 2 }, { p: P('p12'), qty: 1 }], 'placed', 'cod', null, 2, 15),
  makeOrder('o4', '#GF-48205-NP', customers[5], [{ p: P('p5'), qty: 2 }, { p: P('p8'), qty: 1 }], 'picked_up', 'connectips', 'd4', 7, 8),
  makeOrder('o5', '#GF-48206-NP', customers[2], [{ p: P('p1'), qty: 5 }], 'delivered', 'esewa', 'd5', 55, 0),
  makeOrder('o6', '#GF-48207-NP', customers[7], [{ p: P('p4'), qty: 1 }, { p: P('p5'), qty: 1 }], 'delivered', 'khalti', 'd2', 80, 0),
  makeOrder('o7', '#GF-48208-NP', customers[6], [{ p: P('p12'), qty: 2 }, { p: P('p11'), qty: 3 }], 'placed', 'cod', null, 1, 15),
  makeOrder('o8', '#GF-48209-NP', customers[4], [{ p: P('p7'), qty: 4 }, { p: P('p1'), qty: 2 }], 'packing', 'esewa', null, 3, 13),
  makeOrder('o9', '#GF-48210-NP', customers[3], [{ p: P('p2'), qty: 1 }, { p: P('p10'), qty: 2 }], 'delivered', 'esewa', 'd5', 140, 0),
  makeOrder('o10', '#GF-48211-NP', customers[0], [{ p: P('p3'), qty: 2 }, { p: P('p8'), qty: 2 }, { p: P('p1'), qty: 4 }], 'arrived', 'connectips', 'd1', 12, 1),
  makeOrder('o11', '#GF-48212-NP', customers[1], [{ p: P('p6'), qty: 1 }], 'cancelled', 'khalti', null, 200, 0),
  makeOrder('o12', '#GF-48213-NP', customers[5], [{ p: P('p11'), qty: 6 }], 'delivered', 'cod', 'd2', 320, 0),
  // Scheduled (after-hours pre-booked) orders — feature 113 / 105.
  makeOrder('o13', '#GF-48214-NP', customers[2], [{ p: P('p7'), qty: 2 }, { p: P('p1'), qty: 1 }], 'placed', 'esewa', null, 30, 15, 'Pre-booked for tomorrow morning.', daysAhead(1)),
  makeOrder('o14', '#GF-48215-NP', customers[6], [{ p: P('p12'), qty: 1 }, { p: P('p5'), qty: 2 }], 'placed', 'cod', null, 45, 15, '', daysAhead(1)),
]

// Seed a couple of demo admin notes + a refund so the audit trails aren't empty.
{
  const o5 = orders.find((o) => o.id === 'o5')
  if (o5) {
    o5.notes = [
      { id: 'on5-1', content: 'Customer called — one item looked crushed on arrival.', adminName: 'Kiran Chetri', adminId: 'a1', at: minsAgo(50) },
      { id: 'on5-2', content: 'Issued NPR 35 partial refund as goodwill. Customer happy.', adminName: 'Kiran Chetri', adminId: 'a1', at: minsAgo(44) },
    ]
    o5.adminNote = o5.notes[o5.notes.length - 1].content
    o5.refunds = [
      { id: 'rf5-1', type: 'partial', amount: 35, reason: 'Damaged item', comments: 'One pack of noodles crushed on arrival.', adminName: 'Kiran Chetri', at: minsAgo(44), status: 'processed' },
    ]
  }
}

// ── Analytics ───────────────────────────────────────────────────────────────
export const revenueSeries = [
  { label: 'Mon', revenue: 42100, orders: 138 },
  { label: 'Tue', revenue: 38600, orders: 121 },
  { label: 'Wed', revenue: 51200, orders: 167 },
  { label: 'Thu', revenue: 47800, orders: 152 },
  { label: 'Fri', revenue: 63400, orders: 201 },
  { label: 'Sat', revenue: 78900, orders: 248 },
  { label: 'Sun', revenue: 71200, orders: 223 },
]

export const categorySales = [
  { name: 'Snacks & Drinks', value: 38 },
  { name: 'Grocery & Kitchen', value: 34 },
  { name: 'Beauty & Personal Care', value: 16 },
  { name: 'Dairy & Breads', value: 12 },
]

export const hourlyOrders = Array.from({ length: 12 }, (_, i) => {
  const hour = 8 + i
  const base = [12, 18, 34, 41, 28, 22, 19, 26, 38, 52, 47, 31][i]
  return { label: `${hour}:00`, orders: base }
})

// ── Banners ─────────────────────────────────────────────────────────────────
const banner = (seed: string) => `https://picsum.photos/seed/chutkima-banner-${seed}/800/360`
export const banners: Banner[] = [
  { id: 'b1', title: "Mother's Pride", subtitle: 'Dairy Pride milk powder · up to 15% off', image: banner('dairy'), placement: 'hero', position: 1, ctaLabel: 'Shop now', ctaLink: '/category/dairy', active: true },
  { id: 'b2', title: 'Fresh Veggies Daily', subtitle: 'Farm-fresh fruits & vegetables', image: banner('veggies'), placement: 'hero', position: 2, ctaLabel: 'Order fresh', ctaLink: '/category/fruits-vegetables', active: true },
  { id: 'b3', title: 'Midnight Cravings?', subtitle: 'Snacks delivered in 10 mins', image: banner('snacks'), placement: 'hero', position: 3, ctaLabel: 'Explore', ctaLink: '/category/snacks', active: false },
  { id: 'b4', title: 'Free Delivery', subtitle: 'On orders above NPR 800', image: banner('free'), placement: 'grid_small', position: 1, ctaLabel: 'Learn more', ctaLink: '/offers', active: true },
  { id: 'b5', title: 'Refer & Earn', subtitle: 'Get NPR 100 per friend', image: banner('refer'), placement: 'grid_small', position: 2, ctaLabel: 'Invite', ctaLink: '/refer', active: true },
  { id: 'b6', title: 'New in Beauty', subtitle: 'Personal care essentials', image: banner('beauty'), placement: 'grid_small', position: 3, ctaLabel: 'Discover', ctaLink: '/category/beauty', active: true },
  { id: 'b7', title: 'Weekend Combo', subtitle: 'Save big on staples', image: banner('combo'), placement: 'category_strip', position: 1, ctaLabel: 'Grab deal', ctaLink: '/offers/combo', active: true },
]

// ── Onboarding slides ───────────────────────────────────────────────────────
const onboardImg = (seed: string) => `https://picsum.photos/seed/chutkima-onboard-${seed}/600/900`
export const onboardingSlides: OnboardingSlide[] = [
  { id: 'ob1', title: 'Groceries in minutes, not hours', subtitle: "Tap, snap, delivered. Butwal's fastest dark-store gets daily essentials to your door in 10–15 minutes.", image: onboardImg('rider'), position: 1, active: true },
  { id: 'ob2', title: 'The more you add, the less you pay', subtitle: "No minimum order ever. Your delivery fee drops as your cart grows, and it's free over NPR 800.", image: onboardImg('cart'), position: 2, active: true },
  { id: 'ob3', title: 'Your zone, tracked to the door', subtitle: 'We auto-detect your area with GPS or you pick it manually. Watch your rider move on the map in real time.', image: onboardImg('map'), position: 3, active: true },
]

// ── CMS content pages ───────────────────────────────────────────────────────
export const contentPages: ContentPage[] = [
  {
    id: 'cp1',
    key: 'terms',
    title: 'Terms & Conditions',
    updatedAt: daysAgo(12),
    body: `Welcome to Chutkima. By using our app and services you agree to these terms.\n\n1. Orders & Delivery\nWe aim to deliver within 10–15 minutes inside our Butwal service zones. Delivery times may vary during peak hours or bad weather.\n\n2. Pricing\nAll prices are in NPR and inclusive of applicable taxes. Prices may change without prior notice.\n\n3. Cancellations\nOrders cannot be cancelled once packed for delivery. Refunds are processed per our Refund Policy.\n\n4. Conduct\nMisuse of promo codes or fraudulent activity may lead to account suspension.`,
  },
  {
    id: 'cp2',
    key: 'privacy',
    title: 'Privacy Policy',
    updatedAt: daysAgo(20),
    body: `Your privacy matters to Chutkima.\n\nWhat we collect: name, phone number, delivery address, and order history.\n\nHow we use it: to fulfil orders, assign riders, and improve our service.\n\nSharing: we share delivery details only with the rider assigned to your order. We never sell your data.\n\nContact: privacy@chutkima.com`,
  },
  {
    id: 'cp3',
    key: 'refund',
    title: 'Refund Policy',
    updatedAt: daysAgo(8),
    body: `We want you to be happy with every order.\n\nDamaged or missing items: report within 24 hours for a full refund or replacement.\n\nRefund method: refunds are credited to your original payment method (eSewa/Khalti/ConnectIPS) within 3–5 business days. COD orders are refunded to Chutkima wallet or bank transfer.\n\nNon-refundable: opened perishable goods unless damaged on arrival.`,
  },
  {
    id: 'cp4',
    key: 'shipping',
    title: 'Delivery & Shipping',
    updatedAt: daysAgo(30),
    body: `Chutkima delivers across Butwal: Traffic Chowk, Amarpath, Milanchowk, Golpark, Sukkhanagar and Buddhanagar.\n\nDelivery fee: NPR 40, dropping as your cart grows. Free above NPR 800.\n\nHours: 7:00 AM – 10:00 PM, all days.`,
  },
]

// ── FAQs ────────────────────────────────────────────────────────────────────
export const faqSections: FaqSection[] = [
  { id: 'fs1', name: 'General', position: 1 },
  { id: 'fs2', name: 'Delivery Times', position: 2 },
  { id: 'fs3', name: 'Refunds', position: 3 },
  { id: 'fs4', name: 'Orders & Cancellation', position: 4 },
  { id: 'fs5', name: 'Payments', position: 5 },
]

export const faqs: FaqItem[] = [
  { id: 'f1', question: 'How fast is delivery?', answer: 'Most orders arrive in 10–15 minutes inside our Butwal service zones.', section: 'Delivery Times', position: 1, active: true },
  { id: 'f2', question: 'What payment methods do you accept?', answer: 'eSewa, Khalti, ConnectIPS, and Cash on Delivery (COD).', section: 'Payments', position: 2, active: true },
  { id: 'f3', question: 'Is there a minimum order value?', answer: 'No minimum order. A small delivery fee applies and becomes free above NPR 800.', section: 'Delivery Times', position: 3, active: true },
  { id: 'f4', question: 'Can I cancel my order?', answer: 'Orders can be cancelled before they are packed. Once packed, cancellation is not possible.', section: 'Orders & Cancellation', position: 4, active: true },
  { id: 'f5', question: 'How do I track my order?', answer: 'Open the order and watch your rider move on the live map in real time.', section: 'Orders & Cancellation', position: 5, active: false },
  { id: 'f6', question: 'How do refunds work?', answer: 'Damaged or missing items are refunded within 3–5 business days to your original payment method. COD orders are refunded to your Chutkima wallet.', section: 'Refunds', position: 6, active: true },
  { id: 'f7', question: 'When will I be refunded for a cancelled order?', answer: 'Prepaid cancellations are auto-refunded within 24 hours. COD cancellations need no refund.', section: 'Refunds', position: 7, active: true },
]

// ── Dark stores (master admin manages many) ─────────────────────────────────
export const darkStores: DarkStore[] = [
  { id: 's1', name: 'Traffic Chowk Hub', address: 'Traffic Chowk, Butwal', phone: '+977 071 540001', whatsapp: '+977 9847000001', openTime: '7:00 AM', closeTime: '11:00 PM', lat: 27.7006, lng: 83.4480, active: true, offline: false, features: allStoreFeaturesOn(), createdAt: daysAgo(400) },
  { id: 's2', name: 'Golpark Hub', address: 'Golpark, Butwal', phone: '+977 071 540002', whatsapp: '+977 9847000002', openTime: '7:00 AM', closeTime: '10:30 PM', lat: 27.6900, lng: 83.4620, active: true, offline: false, features: { ...allStoreFeaturesOn(), returns: false, promotions: false }, createdAt: daysAgo(120) },
]

// ── Admin / staff users ─────────────────────────────────────────────────────
export const admins: AdminUser[] = [
  { id: 'a1', name: 'Kiran Chetri', email: 'admin@chutkima.com', phone: '+977 9800000001', role: 'admin', avatar: avatar('admin'), active: true, storeId: null, lastActiveAt: minsAgo(3), createdAt: daysAgo(320) },
  { id: 'a2', name: 'Prakash Thapa', email: 'prakash@chutkima.com', phone: '+977 9800000002', role: 'manager', avatar: avatar('a2'), active: true, storeId: 's1', lastActiveAt: minsAgo(40), createdAt: daysAgo(180) },
  { id: 'a3', name: 'Nisha Gurung', email: 'nisha@chutkima.com', phone: '+977 9800000003', role: 'dispatcher', avatar: avatar('a3'), active: true, storeId: 's1', lastActiveAt: minsAgo(12), createdAt: daysAgo(90) },
  { id: 'a4', name: 'Rojan Shrestha', email: 'rojan@chutkima.com', phone: '+977 9800000004', role: 'dispatcher', avatar: avatar('a4'), active: false, storeId: 's2', lastActiveAt: daysAgo(6), createdAt: daysAgo(60) },
]

// ── Home feed sections ──────────────────────────────────────────────────────
export const homeSections: HomeSection[] = [
  { id: 'hs1', title: 'Best Seller', type: 'best_seller', categoryGroup: '', productIds: [], showViewAll: true, position: 1, active: true },
  { id: 'hs2', title: 'Grocery & Kitchen', type: 'category_grid', categoryGroup: 'Grocery & Kitchen', productIds: [], showViewAll: true, position: 2, active: true },
  { id: 'hs3', title: 'Snacks & Drinks', type: 'category_grid', categoryGroup: 'Snacks & Drinks', productIds: [], showViewAll: true, position: 3, active: true },
  { id: 'hs4', title: 'Beauty & Personal Care', type: 'category_grid', categoryGroup: 'Beauty & Personal Care', productIds: [], showViewAll: true, position: 4, active: true },
  { id: 'hs5', title: 'Daily Staples', type: 'manual_products', categoryGroup: '', productIds: ['p2', 'p3', 'p7', 'p9'], showViewAll: false, position: 5, active: true },
  { id: 'hs6', title: 'Trending in Snacks', type: 'category_products', categoryGroup: 'Snacks & Drinks', productIds: [], showViewAll: true, position: 6, active: false },
]

// ── Coupons / promo codes ───────────────────────────────────────────────────
export const coupons: Coupon[] = [
  { id: 'cp1', code: 'WELCOME50', description: '50% off your first order', type: 'percent', value: 50, minOrder: 300, maxDiscount: 150, usageLimit: 1000, used: 412, validUntil: daysAhead(30), active: true },
  { id: 'cp2', code: 'FREEDEL', description: 'Free delivery, no minimum', type: 'free_delivery', value: 0, minOrder: 0, maxDiscount: 0, usageLimit: 5000, used: 1840, validUntil: daysAhead(60), active: true },
  { id: 'cp3', code: 'FLAT100', description: 'NPR 100 off above NPR 700', type: 'flat', value: 100, minOrder: 700, maxDiscount: 100, usageLimit: 2000, used: 967, validUntil: daysAhead(15), active: true },
  { id: 'cp4', code: 'CHUTKIMA20', description: '20% off snacks weekend', type: 'percent', value: 20, minOrder: 200, maxDiscount: 80, usageLimit: 800, used: 800, validUntil: daysAgo(2), active: false },
]

// ── Delivery zones & fee config ─────────────────────────────────────────────
export const zones: Zone[] = [
  { id: 'z1', name: 'Traffic Chowk', etaMins: 10, areas: ['Traffic Chowk', 'Yogikuti', 'Hospital Line'], mapLink: 'https://maps.google.com/?q=Traffic+Chowk+Butwal', geofence: [[27.7075, 83.4445], [27.7095, 83.4525], [27.7025, 83.4565], [27.6965, 83.4515], [27.6985, 83.4435]], active: true },
  { id: 'z2', name: 'Amarpath', etaMins: 12, areas: ['Amarpath', 'Buddha Marg', 'Devinagar'], mapLink: 'https://maps.google.com/?q=Amarpath+Butwal', geofence: [], active: true },
  { id: 'z3', name: 'Milanchowk', etaMins: 14, areas: ['Milanchowk', 'Kalikanagar'], mapLink: '', geofence: [], active: true },
  { id: 'z4', name: 'Golpark', etaMins: 13, areas: ['Golpark', 'Tinkune', 'Ramnagar'], mapLink: '', geofence: [], active: true },
  { id: 'z5', name: 'Sukkhanagar', etaMins: 16, areas: ['Sukkhanagar', 'Fulbari'], mapLink: '', geofence: [], active: true },
  { id: 'z6', name: 'Buddhanagar', etaMins: 18, areas: ['Buddhanagar', 'Manglapur'], mapLink: '', geofence: [], active: false },
]

/** Dispatch / operations config. */
export const opsConfig = {
  multiRiderEnabled: true,
  maxRiders: 3,
  /** NPR paid to riders per km (fuel allowance) — feature 91, configurable. */
  fuelRatePerKm: 4,
}

/** Company details for invoices (Store Setup) — appears on every printed invoice. */
export const storeSetup = {
  companyName: 'Chutkima Pvt. Ltd.',
  address: 'Traffic Chowk, Butwal-8, Rupandehi, Nepal',
  phone: '+977 9800000000',
  email: 'hello@chutkima.com',
  taxNumber: '601234567',
  vatPercent: 13,
}

// ── Internal billing (staff purchases / damaged / clearance) ────────────────
export const internalOrders: InternalOrder[] = [
  {
    id: 'int1',
    reference: 'INT-000001',
    staffName: 'Bimala Thapa',
    items: [
      { productId: 'p8', sku: 'TK-220', name: 'Tokla Premium Tea 200g', quantity: 2, originalPrice: 145, sellPrice: 100 },
      { productId: 'p5', sku: 'HB-205', name: 'Heritage Select Digestive Biscuits 400g', quantity: 1, originalPrice: 185, sellPrice: 150 },
    ],
    originalTotal: 475,
    sellTotal: 350,
    discount: 125,
    reason: 'Near-expiry clearance',
    comments: 'Tea expires in 3 weeks — sold to staff at discount.',
    adminName: 'Kiran Chetri',
    createdAt: daysAgo(2),
  },
]

/** Next internal-order number in the INT-###### series. */
export const internalCounter = { next: internalOrders.length + 1 }

// ── Packers (pick & pack staff) ─────────────────────────────────────────────
export const packers: Packer[] = [
  { id: 'pk1', name: 'Bimala Thapa', phone: '+977 9845000001', active: true, packedToday: 14, createdAt: daysAgo(120) },
  { id: 'pk2', name: 'Gokul Magar', phone: '+977 9845000002', active: true, packedToday: 9, createdAt: daysAgo(80) },
  { id: 'pk3', name: 'Sabina Rai', phone: '+977 9845000003', active: false, packedToday: 0, createdAt: daysAgo(40) },
]

/** Social + app-store links shown in the customer app / website footer. */
export const linksConfig = {
  facebook: 'https://facebook.com/chutkima',
  instagram: 'https://instagram.com/chutkima',
  tiktok: 'https://www.tiktok.com/@chutkima',
  youtube: '',
  whatsapp: 'https://wa.me/9779800000000',
  playStore: 'https://play.google.com/store/apps/details?id=com.chutkima.app',
  appStore: '',
}

/** Operating hours + scheduled delivery (section 2.1 / feature 113). */
export const operatingConfig = {
  openTime: '07:00',
  lastOrderCutoff: '22:30',
  closeTime: '23:00',
  firstSlotNextDay: '07:15',
  slotIntervalMin: 15,
  scheduledDeliveryEnabled: true,
  afterHoursMessage:
    'हाम्रो आजको सेवा बन्द भयो। Operating hours: 7:00 AM – 11:00 PM। तपाईंको अर्डर भोलि बिहान deliver गर्न schedule गर्नुहुन्छ?',
}

/** System controls (section 3.10) — master switches. */
export const systemControls = {
  serviceOffline: false,
  offlineMessage: 'हामी अहिले बन्द छौं। बिहान ७ बजे फेरि सेवा सुरु हुनेछ।',
  trainingMode: false,
  forceUpdate: false,
  minAppVersion: '1.0.0',
  /** Notify admins on WhatsApp for every new order (feature 110). */
  whatsappAdminAlert: true,
  /** Master admin number that receives new-order alerts. */
  adminWhatsappNumber: '+977 9800000001',
}

/** Referral programme config (feature 35) — all values admin-editable. */
export const referralConfig = {
  enabled: true,
  refereeDiscountPct: 5,
  refereeMaxDiscount: 50,
  refereeMinCart: 500,
  referrerCreditPct: 5,
  referrerMaxCredit: 50,
}

/** Customer trust / COD-restriction config (feature 94). */
export const trustConfig = {
  enabled: true,
  codMode: 'manual' as 'alert' | 'hidden' | 'manual',
  grayCod: 3,
  redCod: 5,
  grayNoResp: 2,
  redNoResp: 4,
}

export const deliveryConfig: DeliveryConfig = {
  freeAbove: 800,
  // SOW Strategy-B tiers (NPR cart value → fee).
  tiers: [
    { minOrder: 0, fee: 80 },
    { minOrder: 200, fee: 60 },
    { minOrder: 400, fee: 40 },
    { minOrder: 600, fee: 20 },
  ],
}

/**
 * Delivery fee for a cart value, from the tiered config (highest match wins).
 * VIP customers always ship free (feature: VIP badge = 0 delivery fee).
 */
export function deliveryFeeFor(subtotal: number, tier?: CustomerTier): number {
  if (tier === 'vip') return 0
  if (subtotal >= deliveryConfig.freeAbove) return 0
  return [...deliveryConfig.tiers].sort((a, b) => b.minOrder - a.minOrder).find((t) => subtotal >= t.minOrder)?.fee ?? 0
}

// ── Driver reviews ──────────────────────────────────────────────────────────
export const driverReviews: DriverReview[] = [
  { id: 'rv1', driverId: 'd1', customerName: 'Gita Khadka', orderId: '#GF-48202-NP', rating: 5, comment: 'Super fast and very polite. Carried bags upstairs!', createdAt: minsAgo(30) },
  { id: 'rv2', driverId: 'd1', customerName: 'Ram Sharma', orderId: '#GF-48210-NP', rating: 5, comment: 'Always on time.', createdAt: daysAgo(1) },
  { id: 'rv3', driverId: 'd2', customerName: 'Sarita Joshi', orderId: '#GF-48207-NP', rating: 4, comment: 'Good service, slightly late.', createdAt: daysAgo(1) },
  { id: 'rv4', driverId: 'd4', customerName: 'Anita Rana', orderId: '#GF-48205-NP', rating: 3, comment: 'Order was fine but he seemed in a rush.', createdAt: daysAgo(2) },
  { id: 'rv5', driverId: 'd5', customerName: 'Hari Adhikari', orderId: '#GF-48206-NP', rating: 5, comment: 'Excellent, handled the cold items carefully.', createdAt: daysAgo(2) },
  { id: 'rv6', driverId: 'd5', customerName: 'Ram Sharma', orderId: '#GF-48211-NP', rating: 5, comment: 'Best rider in Butwal.', createdAt: daysAgo(3) },
  { id: 'rv7', driverId: 'd2', customerName: 'Bishnu Pokharel', orderId: '#GF-48213-NP', rating: 2, comment: 'Items were shaken up. Not happy.', createdAt: daysAgo(4) },
]

// ── Driver reports (customer → rider complaints) ────────────────────────────
export const driverReports: DriverReport[] = [
  { id: 'rp1', driverId: 'd4', customerName: 'Anita Rana', orderId: '#GF-48205-NP', reason: 'rude', details: 'Rider was rude when I asked to wait 2 minutes at the gate.', status: 'open', createdAt: minsAgo(90), actions: [{ id: 'ra1-1', action: 'Complaint filed', adminName: 'System', at: minsAgo(90) }] },
  { id: 'rp2', driverId: 'd2', customerName: 'Bishnu Pokharel', orderId: '#GF-48213-NP', reason: 'wrong_items', details: 'One pack of noodles was missing from the bag.', status: 'open', createdAt: daysAgo(1), actions: [{ id: 'ra2-1', action: 'Complaint filed', adminName: 'System', at: daysAgo(1) }] },
  { id: 'rp3', driverId: 'd6', customerName: 'Krishna Bhattarai', orderId: '#GF-48204-NP', reason: 'extra_charge', details: 'Asked for NPR 50 extra for "fuel". I paid COD already.', status: 'reviewed', createdAt: daysAgo(3), actions: [{ id: 'ra3-1', action: 'Complaint filed', adminName: 'System', at: daysAgo(3) }, { id: 'ra3-2', action: 'Note added', adminName: 'Kiran Chetri', note: 'Called the rider — warned about extra charges.', at: daysAgo(2) }, { id: 'ra3-3', action: 'Marked reviewed', adminName: 'Kiran Chetri', at: daysAgo(2) }] },
  { id: 'rp4', driverId: 'd4', customerName: 'Sita Pandey', orderId: '#GF-48203-NP', reason: 'late', details: 'Delivery took 40 minutes instead of 15.', status: 'dismissed', createdAt: daysAgo(5), actions: [{ id: 'ra4-1', action: 'Complaint filed', adminName: 'System', at: daysAgo(5) }, { id: 'ra4-2', action: 'Marked dismissed', adminName: 'Prakash Thapa', note: 'Heavy rain that evening — genuine delay.', at: daysAgo(4) }] },
]

// ── Driver warnings (admin → rider, often after a complaint) ─────────────────
export const driverWarnings: DriverWarning[] = [
  { id: 'dw1', driverId: 'd6', severity: 'warning', message: 'Do not ask customers for extra cash. Any fuel allowance is settled by the company, not the customer.', reportId: 'rp3', issuedBy: 'Kiran Chetri', createdAt: daysAgo(2) },
]

// ── Transactions ────────────────────────────────────────────────────────────
export const transactions: Transaction[] = [
  { id: 't1', type: 'order_payment', reference: '#GF-48202-NP', party: 'Gita Khadka', amount: 145, method: 'eSewa', status: 'success', orderId: 'o1', createdAt: minsAgo(9) },
  { id: 't2', type: 'order_payment', reference: '#GF-48205-NP', party: 'Anita Rana', amount: 535, method: 'ConnectIPS', status: 'success', orderId: 'o4', createdAt: minsAgo(7) },
  { id: 't3', type: 'cod_collection', reference: '#GF-48204-NP', party: 'Sita Pandey', amount: 235, method: 'Cash', status: 'pending', orderId: 'o3', createdAt: minsAgo(2) },
  { id: 't4', type: 'order_payment', reference: '#GF-48206-NP', party: 'Hari Adhikari', amount: 175, method: 'eSewa', status: 'success', orderId: 'o5', createdAt: minsAgo(55) },
  { id: 't5', type: 'refund', reference: '#GF-48212-NP', party: 'Sita Pandey', amount: 225, method: 'Khalti', status: 'success', orderId: 'o11', createdAt: daysAgo(1) },
  { id: 't6', type: 'order_payment', reference: '#GF-48207-NP', party: 'Sarita Joshi', amount: 680, method: 'Khalti', status: 'success', orderId: 'o6', createdAt: minsAgo(80) },
  { id: 't7', type: 'payout', reference: 'PO-2026-031', party: 'Manoj Thapa', amount: 2400, method: 'Bank transfer', status: 'success', orderId: null, createdAt: daysAgo(1) },
  { id: 't8', type: 'payout', reference: 'PO-2026-032', party: 'Dipesh Shrestha', amount: 2750, method: 'Bank transfer', status: 'pending', orderId: null, createdAt: minsAgo(120) },
  { id: 't9', type: 'cod_collection', reference: '#GF-48213-NP', party: 'Bishnu Pokharel', amount: 390, method: 'Cash', status: 'failed', orderId: 'o12', createdAt: daysAgo(2) },
  { id: 't10', type: 'order_payment', reference: '#GF-48210-NP', party: 'Ram Sharma', amount: 1085, method: 'ConnectIPS', status: 'success', orderId: 'o10', createdAt: minsAgo(12) },
  { id: 't11', type: 'order_payment', reference: '#GF-48209-NP', party: 'Bishnu Pokharel', amount: 210, method: 'eSewa', status: 'success', orderId: 'o8', createdAt: minsAgo(3) },
  { id: 't12', type: 'refund', reference: '#GF-48209-NP', party: 'Bishnu Pokharel', amount: 70, method: 'eSewa', status: 'pending', orderId: 'o8', createdAt: minsAgo(40) },
]

// ── Rider cash deposits (rider hands collected COD cash to the store/admin) ───
export const riderDeposits: RiderDeposit[] = [
  { id: 'dep1', driverId: 'd1', driverName: 'Manoj Thapa', amount: 1200, note: 'Morning shift COD handover', collectedBy: 'Kiran Chetri', createdAt: daysAgo(1) },
]

// ── Search analytics (what customers searched) ──────────────────────────────
export const searchAnalytics = [
  { term: 'wai wai', count: 412, results: 8 },
  { term: 'milk', count: 388, results: 12 },
  { term: 'eggs', count: 271, results: 0 },
  { term: 'coke', count: 240, results: 5 },
  { term: 'rice', count: 205, results: 9 },
  { term: 'bread', count: 188, results: 0 },
  { term: 'cooking oil', count: 156, results: 6 },
  { term: 'maggi', count: 142, results: 0 },
  { term: 'chips', count: 130, results: 14 },
  { term: 'paracetamol', count: 96, results: 0 },
]

// ── Outside-zone demand (GPS attempts beyond service area) ───────────────────
export const outsideZoneAttempts = [
  { area: 'Bhairahawa', attempts: 64 },
  { area: 'Tilottama (south)', attempts: 41 },
  { area: 'Manigram', attempts: 33 },
  { area: 'Sainamaina', attempts: 22 },
  { area: 'Devdaha', attempts: 17 },
]

// ── Popular search keywords ─────────────────────────────────────────────────
export const searchKeywords: SearchKeyword[] = [
  { id: 'sk1', term: 'Milk', position: 1 },
  { id: 'sk2', term: 'Wai Wai', position: 2 },
  { id: 'sk3', term: 'Eggs', position: 3 },
  { id: 'sk4', term: 'Coke', position: 4 },
  { id: 'sk5', term: 'Rice', position: 5 },
  { id: 'sk6', term: 'Oil', position: 6 },
]
