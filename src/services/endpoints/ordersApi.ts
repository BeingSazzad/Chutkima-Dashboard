import { api, clone, mockDelay } from '@/services/api'
import { orders, drivers, products, transactions } from '@/services/mock/data'
import { PAYMENT_META, SUBSTITUTABLE_STATUSES } from '@/lib/constants'
import type { Order, OrderStatus, PaymentMethod, RefundItem, RefundType } from '@/types/common.types'

const uid = (prefix: string) => `${prefix}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`

/** Forward order of the journey stages (cancelled is handled separately). */
const STAGE_ORDER: OrderStatus[] = ['pending', 'confirmed', 'packing', 'packed', 'picked_up', 'on_the_way', 'arrived', 'delivered']

/**
 * Stamp the reached stage (and backfill any skipped earlier stages) so the
 * Order Journey + timing chips reflect every in-app transition, not just seeds.
 */
function stampStage(order: Order, status: OrderStatus) {
  const idx = STAGE_ORDER.indexOf(status)
  if (idx === -1) return // 'cancelled' — not part of the linear journey
  const now = new Date().toISOString()
  for (let i = 0; i <= idx; i++) {
    if (!order.stageTimestamps[STAGE_ORDER[i]]) order.stageTimestamps[STAGE_ORDER[i]] = now
  }
}

interface OrderFilters {
  status?: OrderStatus | 'all'
  zone?: string
  search?: string
  payment?: PaymentMethod | 'all'
  /** Restrict to orders placed within the last N days. */
  days?: number
  /** Inclusive placed-date range (YYYY-MM-DD). */
  from?: string
  to?: string
  storeId?: string
}

export const ordersApi = api.injectEndpoints({
  endpoints: (build) => ({
    getOrders: build.query<Order[], OrderFilters | void>({
      async queryFn(filters) {
        await mockDelay()
        let result = [...orders].sort(
          (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
        )
        if (filters?.status && filters.status !== 'all') {
          result = result.filter((o) => o.status === filters.status)
        }
        if (filters?.zone) result = result.filter((o) => o.zone === filters.zone)
        if (filters?.storeId) result = result.filter((o) => o.storeId === filters.storeId)
        if (filters?.payment && filters.payment !== 'all') {
          result = result.filter((o) => o.paymentMethod === filters.payment)
        }
        if (filters?.days) {
          const cutoff = Date.now() - filters.days * 86_400_000
          result = result.filter((o) => new Date(o.placedAt).getTime() >= cutoff)
        }
        if (filters?.from) result = result.filter((o) => o.placedAt.slice(0, 10) >= filters.from!)
        if (filters?.to) result = result.filter((o) => o.placedAt.slice(0, 10) <= filters.to!)
        if (filters?.search) {
          const q = filters.search.toLowerCase()
          result = result.filter(
            (o) =>
              o.reference.toLowerCase().includes(q) ||
              o.customerName.toLowerCase().includes(q) ||
              o.customerPhone.includes(q),
          )
        }
        return { data: clone(result) }
      },
      providesTags: ['Order'],
    }),

    getOrder: build.query<Order, string>({
      async queryFn(id) {
        await mockDelay(200)
        const order = orders.find((o) => o.id === id)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        return { data: clone(order) }
      },
      providesTags: (_r, _e, id) => [{ type: 'Order', id }],
    }),

    assignDriver: build.mutation<Order, { orderId: string; driverId: string }>({
      async queryFn({ orderId, driverId }) {
        await mockDelay(300)
        const order = orders.find((o) => o.id === orderId)
        const driver = drivers.find((d) => d.id === driverId)
        if (!order || !driver) return { error: { status: 404, data: 'Not found' } as never }
        // Free any previous driver
        if (order.driverId) {
          const prev = drivers.find((d) => d.id === order.driverId)
          if (prev) {
            prev.status = 'available'
            prev.activeOrderId = null
          }
        }
        order.driverId = driverId
        order.assignments = [{ driverId, note: '', confirmed: false }]
        // Newly assigned → status becomes "Rider Assigned" until the rider accepts.
        order.riderAccepted = false
        // Assigning ≠ picked up. The rider marks "Picked Up" (or admin overrides).
        driver.status = 'on_delivery'
        driver.activeOrderId = orderId
        return { data: clone(order) }
      },
      invalidatesTags: ['Order', 'Driver'],
    }),

    /** The assigned rider accepts the job → status moves to "Rider Accepted". */
    acceptRider: build.mutation<Order, { orderId: string }>({
      async queryFn({ orderId }) {
        await mockDelay(200)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        if (!order.driverId) return { error: { status: 400, data: 'No rider assigned' } as never }
        order.riderAccepted = true
        return { data: clone(order) }
      },
      invalidatesTags: ['Order'],
    }),

    removeRider: build.mutation<Order, { orderId: string; driverId: string }>({
      async queryFn({ orderId, driverId }) {
        await mockDelay(200)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        // Removing a rider after pickup would strand an in-transit order — reassign instead.
        if (['picked_up', 'on_the_way', 'arrived', 'delivered'].includes(order.status))
          return { error: { status: 409, data: 'Cannot unassign a rider after pickup — reassign instead.' } as never }
        order.assignments = order.assignments.filter((a) => a.driverId !== driverId)
        const driver = drivers.find((d) => d.id === driverId)
        if (driver && driver.activeOrderId === orderId) {
          driver.status = 'available'
          driver.activeOrderId = null
        }
        order.driverId = order.assignments[0]?.driverId ?? null
        return { data: clone(order) }
      },
      invalidatesTags: ['Order', 'Driver'],
    }),

    updateOrderStatus: build.mutation<Order, { orderId: string; status: OrderStatus; reason?: string }>({
      async queryFn({ orderId, status, reason }) {
        await mockDelay(250)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        order.status = status
        // Record the stage timestamp (and backfill skips) for the journey/timing UI.
        stampStage(order, status)
        // Keep the packed flag in sync once an order reaches "Packed" or beyond.
        if (['packed', 'picked_up', 'on_the_way', 'arrived', 'delivered'].includes(status)) order.packed = true
        if (status === 'cancelled') {
          order.cancelReason = reason ?? order.cancelReason
          // Auto-refund a prepaid order — fulfils the cancel dialog's promise so the
          // payment state, refund history and ledger all reflect the reversal.
          const alreadyRefunded = order.refunds.reduce((s, r) => s + r.amount, 0)
          if (order.paymentMethod !== 'cod' && order.paymentStatus === 'paid' && alreadyRefunded < order.grandTotal) {
            const refundAmount = order.grandTotal - alreadyRefunded
            const at = new Date().toISOString()
            order.refunds.push({
              id: uid('rf'),
              type: 'full',
              amount: refundAmount,
              reason: 'Order cancelled',
              comments: order.cancelReason || 'Auto-refund on cancellation.',
              adminName: 'System',
              at,
              status: 'processed',
            })
            order.paymentStatus = 'refunded'
            transactions.unshift({
              id: uid('t'),
              type: 'refund',
              reference: order.reference,
              party: order.customerName,
              amount: refundAmount,
              method: PAYMENT_META[order.paymentMethod].label,
              status: 'success',
              orderId: order.id,
              createdAt: at,
            })
          }
        }
        if (status === 'delivered' || status === 'cancelled') {
          order.etaMinutes = 0
          if (order.driverId) {
            const driver = drivers.find((d) => d.id === order.driverId)
            if (driver) {
              driver.status = 'available'
              driver.activeOrderId = null
              if (status === 'delivered') driver.deliveriesToday += 1
            }
          }
        }
        return { data: clone(order) }
      },
      invalidatesTags: ['Order', 'Driver', 'Kpi', 'Transaction'],
    }),

    markCodCollected: build.mutation<Order, string>({
      async queryFn(orderId) {
        await mockDelay(200)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        order.codCollected = true
        order.paymentStatus = 'paid'
        return { data: clone(order) }
      },
      invalidatesTags: ['Order', 'Transaction'],
    }),

    assignPacker: build.mutation<Order, { orderId: string; packerId: string }>({
      async queryFn({ orderId, packerId }) {
        await mockDelay(250)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        order.packerId = packerId
        // Sending to a packer moves a confirmed order into packing (confirm must happen first).
        if (order.status === 'confirmed') {
          order.status = 'packing'
          stampStage(order, 'packing')
        }
        return { data: clone(order) }
      },
      invalidatesTags: ['Order'],
    }),

    markPacked: build.mutation<Order, string>({
      async queryFn(orderId) {
        await mockDelay(200)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        // Packing complete → status "Packed" (triggers the rider "ready for pickup" alert).
        order.packed = true
        if (['confirmed', 'packing'].includes(order.status)) {
          order.status = 'packed'
          stampStage(order, 'packed')
        }
        return { data: clone(order) }
      },
      invalidatesTags: ['Order'],
    }),

    setAdminNote: build.mutation<Order, { orderId: string; note: string }>({
      async queryFn({ orderId, note }) {
        await mockDelay(200)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        order.adminNote = note
        return { data: clone(order) }
      },
      invalidatesTags: ['Order'],
    }),

    /** Append an admin note to the order's notes audit trail (never overwrites). */
    addOrderNote: build.mutation<Order, { orderId: string; content: string; adminName: string; adminId?: string }>({
      async queryFn({ orderId, content, adminName, adminId }) {
        await mockDelay(200)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        order.notes.push({ id: uid('on'), content, adminName, adminId, at: new Date().toISOString() })
        // Keep the legacy single-note field pointing at the latest note.
        order.adminNote = content
        return { data: clone(order) }
      },
      invalidatesTags: ['Order'],
    }),

    /** Process a full / partial refund, append to the order's refund history. */
    addRefund: build.mutation<
      Order,
      { orderId: string; type: RefundType; amount: number; reason: string; comments: string; adminName: string; items?: RefundItem[] }
    >({
      async queryFn({ orderId, type, amount, reason, comments, adminName, items }) {
        await mockDelay(300)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        const alreadyRefunded = order.refunds.reduce((s, r) => s + r.amount, 0)
        const refundAmount =
          type === 'full'
            ? order.grandTotal - alreadyRefunded
            : type === 'item'
              ? (items ?? []).reduce((s, it) => s + it.amount, 0)
              : amount
        const at = new Date().toISOString()
        // Item-level refund → restock the returned units (inventory auto-adjust).
        if (type === 'item' && items) {
          for (const ri of items) {
            const p = products.find((x) => x.id === ri.productId)
            if (p) {
              p.stock += ri.quantity
              p.status = p.stock === 0 ? 'out_of_stock' : p.stock <= p.lowStockThreshold ? 'low_stock' : 'active'
            }
          }
        }
        order.refunds.push({ id: uid('rf'), type, amount: refundAmount, reason, comments, adminName, at, status: 'processed', items })
        // Mark fully refunded when the whole grand total is covered.
        if (alreadyRefunded + refundAmount >= order.grandTotal) order.paymentStatus = 'refunded'
        // Mirror into the finance transaction ledger.
        transactions.unshift({
          id: uid('t'),
          type: 'refund',
          reference: order.reference,
          party: order.customerName,
          amount: refundAmount,
          method: PAYMENT_META[order.paymentMethod].label,
          status: 'success',
          orderId: order.id,
          createdAt: at,
        })
        return { data: clone(order) }
      },
      invalidatesTags: ['Order', 'Transaction', 'Product'],
    }),

    substituteItem: build.mutation<Order, { orderId: string; productId: string; newProductId: string }>({
      async queryFn({ orderId, productId, newProductId }) {
        await mockDelay(300)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        if (!SUBSTITUTABLE_STATUSES.includes(order.status))
          return { error: { status: 409, data: 'Substitution is only allowed before the order is picked up' } as never }
        const item = order.items.find((it) => it.productId === productId)
        const replacement = products.find((p) => p.id === newProductId)
        if (!item || !replacement) return { error: { status: 404, data: 'Not found' } as never }
        item.originalName = item.name
        item.substituted = true
        item.productId = replacement.id
        item.name = replacement.name
        item.image = replacement.image
        item.price = replacement.price
        // Recompute totals.
        order.subtotal = order.items.reduce((s, it) => s + it.price * it.quantity, 0)
        order.grandTotal = order.subtotal + order.deliveryFee
        return { data: clone(order) }
      },
      invalidatesTags: ['Order'],
    }),

    holdOrder: build.mutation<Order, { orderId: string; minutes: number }>({
      async queryFn({ orderId, minutes }) {
        await mockDelay(200)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        order.holdUntil = new Date(Date.now() + minutes * 60_000).toISOString()
        return { data: clone(order) }
      },
      invalidatesTags: ['Order'],
    }),

    releaseHold: build.mutation<Order, { orderId: string }>({
      async queryFn({ orderId }) {
        await mockDelay(150)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        order.holdUntil = null
        return { data: clone(order) }
      },
      invalidatesTags: ['Order'],
    }),
  }),
})

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useAssignDriverMutation,
  useAcceptRiderMutation,
  useRemoveRiderMutation,
  useUpdateOrderStatusMutation,
  useMarkCodCollectedMutation,
  useAssignPackerMutation,
  useMarkPackedMutation,
  useSetAdminNoteMutation,
  useAddOrderNoteMutation,
  useAddRefundMutation,
  useSubstituteItemMutation,
  useHoldOrderMutation,
  useReleaseHoldMutation,
} = ordersApi
