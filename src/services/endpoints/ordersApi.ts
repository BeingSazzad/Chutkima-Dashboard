import { api, clone, mockDelay } from '@/services/api'
import { orders, drivers, products, transactions, customers, zones, packers } from '@/services/mock/data'
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

function autoProgressOrders() {
  const now = Date.now()
  orders.forEach((o) => {
    // Only auto-progress if current status is 'pending' and not on hold
    if (o.status !== 'pending' || o.holdUntil) return

    const elapsedMs = now - new Date(o.placedAt).getTime()
    const elapsedSec = elapsedMs / 1000

    if (elapsedSec >= 10) {
      o.status = 'confirmed'
      stampStage(o, 'confirmed')
      o.notes.push({
        id: uid('on'),
        content: `System auto-confirmed order: 10-second customer cancellation window elapsed.`,
        adminName: 'System',
        adminId: 'system',
        at: new Date().toISOString(),
      })
    }
  })
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

        // Auto-progress order statuses based on time elapsed
        autoProgressOrders()
        
        // Auto-release expired holds
        const now = Date.now()
        orders.forEach((o) => {
          if (o.holdUntil && new Date(o.holdUntil).getTime() <= now) {
            o.holdUntil = null
            o.holdReleasedAlert = true
            o.notes.push({
              id: uid('on'),
              content: `System auto-released hold: duration expired. State transitioned.`,
              adminName: 'System',
              adminId: 'system',
              at: new Date().toISOString(),
            })
          }
        })

        let result = [...orders].sort(
          (a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime(),
        )
        // Hide orders that are 'pending' (they are still in the 10-second customer cancellation window)
        result = result.filter((o) => o.status !== 'pending')
        if (filters?.status && filters.status !== 'all') {
          result = result.filter((o) => o.status === filters.status)
        }
        if (filters?.zone) result = result.filter((o) => o.zone === filters.zone)
        if (filters?.storeId) {
          const storeId = filters.storeId
          result = result.filter((o) => {
            if (o.storeId === storeId) return true
            if (o.storeId) return false // Claimed by another store
            const zone = zones.find((z) => z.name === o.zone)
            const servedStores = zone?.storeIds && zone.storeIds.length > 0 ? zone.storeIds : (zone?.storeId ? [zone.storeId] : [])
            return servedStores.includes(storeId)
          })
        }
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
        autoProgressOrders()
        const order = orders.find((o) => o.id === id)
        if (!order || order.status === 'pending') return { error: { status: 404, data: 'Order not found or still in customer cancellation window' } as never }
        
        // Clear hold released alert seen flag on load of the detail page
        if (order.holdReleasedAlert) {
          order.holdReleasedAlert = false
        }
        
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
        if (!order.assignments.some((a) => a.driverId === driverId)) {
          order.assignments.push({ driverId, note: '', confirmed: false })
        }
        if (!order.driverId) {
          order.driverId = driverId
        }
        if (!order.storeId && driver.storeIds && driver.storeIds.length > 0) {
          order.storeId = driver.storeIds[0]
        }
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

    updateOrderStatus: build.mutation<Order, { orderId: string; status: OrderStatus; reason?: string; storeId?: string }>({
      async queryFn({ orderId, status, reason, storeId }) {
        await mockDelay(250)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        order.status = status
        if (storeId) {
          order.storeId = storeId
        }
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
        const packer = packers.find((p) => p.id === packerId)
        if (packer) {
          order.storeId = packer.storeId
        }
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
      { orderId: string; type: RefundType; amount: number; reason: string; comments: string; adminName: string; adminId?: string; items?: RefundItem[]; method: 'qr' | 'wallet' }
    >({
      async queryFn({ orderId, type, amount, reason, comments, adminName, adminId, items, method }) {
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
        order.refunds.push({ id: uid('rf'), type, amount: refundAmount, reason, comments, adminName, at, status: 'processed', items, method })
        // Mark fully refunded when the whole grand total is covered.
        if (alreadyRefunded + refundAmount >= order.grandTotal) order.paymentStatus = 'refunded'
        
        const refundMethodLabel = method === 'qr' ? 'QR Refund' : 'Wallet Credit'
        
        // 1. Create a complete refund log in the Order's activity notes timeline
        const refundLogContent = `Refund processed: NPR ${refundAmount} via ${refundMethodLabel} (${type} refund). Reason: ${reason}. Notes: ${comments}. Order: ${order.reference}.`
        order.notes.push({
          id: uid('on'),
          content: refundLogContent,
          adminName,
          adminId: adminId || 'system',
          at,
        })
        order.adminNote = refundLogContent

        // 2. If refund method is wallet, credit the customer & sync to localStorage
        if (method === 'wallet') {
          const customer = customers.find((c) => c.id === order.customerId)
          if (customer) {
            customer.walletBalance += refundAmount
            customer.credits.push({
              id: uid('cc'),
              amount: refundAmount,
              type: type === 'full' ? 'refund' : 'partial_refund',
              reason: reason || 'Order refund',
              orderId: order.id,
              adminName,
              at,
            })

            // Sync with local storage for cross-origin customer-app
            if (order.customerId === 'u1') {
              try {
                const balanceKey = 'chutkima_wallet_balance'
                const txsKey = 'chutkima_wallet_transactions'
                const currentBal = parseFloat(localStorage.getItem(balanceKey) || '100')
                const newBal = currentBal + refundAmount
                localStorage.setItem(balanceKey, newBal.toString())
                
                const txs = JSON.parse(localStorage.getItem(txsKey) || '[]')
                txs.unshift({
                  id: uid('cc'),
                  amount: refundAmount,
                  type: type === 'full' ? 'refund' : 'partial_refund',
                  reason: reason || 'Order refund',
                  orderId: order.reference,
                  at,
                })
                localStorage.setItem(txsKey, JSON.stringify(txs))

                // Instant receipt event
                localStorage.setItem('chutkima_wallet_refund_received', JSON.stringify({
                  amount: refundAmount,
                  orderId: order.reference,
                  reason,
                  at,
                  timestamp: Date.now()
                }))
              } catch (e) {
                console.error('LocalStorage write failed:', e)
              }
            }
          }
        }

        // Mirror into the finance transaction ledger.
        transactions.unshift({
          id: uid('t'),
          type: 'refund',
          reference: order.reference,
          party: order.customerName,
          amount: refundAmount,
          method: refundMethodLabel,
          status: 'success',
          orderId: order.id,
          createdAt: at,
        })
        return { data: clone(order) }
      },
      invalidatesTags: ['Order', 'Transaction', 'Product', 'Customer'],
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
        item.originalPrice = item.price
        item.substituted = true
        item.productId = replacement.id
        item.name = replacement.name
        item.image = replacement.image
        item.price = replacement.price

        // Recompute totals.
        order.subtotal = order.items.reduce((s, it) => s + it.price * it.quantity, 0)
        order.grandTotal = order.subtotal + order.deliveryFee

        // Calculate the cash difference for prepaid orders
        if (order.paymentMethod !== 'cod') {
          const diff = (replacement.price - item.originalPrice) * item.quantity
          if (diff !== 0) {
            order.substitutionAdjustment = {
              type: diff < 0 ? 'excess' : 'short',
              amount: Math.abs(diff),
              status: 'pending',
            }
          } else {
            order.substitutionAdjustment = undefined
          }
        }

        return { data: clone(order) }
      },
      invalidatesTags: ['Order'],
    }),

    resolveSubstitutionAdjustment: build.mutation<Order, { orderId: string; option: string; adminName: string }>({
      async queryFn({ orderId, option, adminName }) {
        await mockDelay(250)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        if (!order.substitutionAdjustment) return { error: { status: 400, data: 'No adjustment needed' } as never }

        const adj = order.substitutionAdjustment
        adj.option = option
        adj.status = 'resolved'

        const now = new Date().toISOString()
        
        // If option is wallet credit / wallet charge
        if (option === 'wallet') {
          // Excess Cash -> Credit Wallet
          const customer = customers.find((c) => c.id === order.customerId)
          if (customer) {
            customer.walletBalance += adj.amount
            customer.credits.push({
              id: uid('cc'),
              amount: adj.amount,
              type: 'refund',
              reason: 'Substitution excess cash credit',
              orderId: order.id,
              adminName,
              at: now,
            })
          }
          // Mirror in transactions
          transactions.unshift({
            id: uid('t'),
            type: 'refund',
            reference: order.reference,
            party: order.customerName,
            amount: adj.amount,
            method: 'Wallet Credit',
            status: 'success',
            orderId: order.id,
            createdAt: now,
          })
        } else if (option === 'charge_wallet') {
          // Short Cash -> Charge Wallet
          const customer = customers.find((c) => c.id === order.customerId)
          if (customer) {
            customer.walletBalance = Math.max(0, customer.walletBalance - adj.amount)
            customer.credits.push({
              id: uid('cc'),
              amount: -adj.amount,
              type: 'compensation',
              reason: 'Substitution short cash charge',
              orderId: order.id,
              adminName,
              at: now,
            })
          }
          // Mirror in transactions
          transactions.unshift({
            id: uid('t'),
            type: 'order_payment',
            reference: order.reference,
            party: order.customerName,
            amount: adj.amount,
            method: 'Wallet Charge',
            status: 'success',
            orderId: order.id,
            createdAt: now,
          })
        } else if (option === 'cash_rider' || option === 'collect_cash') {
          // Cash handled physically by rider
          transactions.unshift({
            id: uid('t'),
            type: option === 'cash_rider' ? 'refund' : 'order_payment',
            reference: order.reference,
            party: order.customerName,
            amount: adj.amount,
            method: 'Cash',
            status: 'success',
            orderId: order.id,
            createdAt: now,
          })
        } else if (option === 'qr_admin' || option === 'collect_qr') {
          // QR handled by admin / rider digitally
          transactions.unshift({
            id: uid('t'),
            type: option === 'qr_admin' ? 'refund' : 'order_payment',
            reference: order.reference,
            party: order.customerName,
            amount: adj.amount,
            method: 'QR',
            status: 'success',
            orderId: order.id,
            createdAt: now,
          })
        }

        return { data: clone(order) }
      },
      invalidatesTags: ['Order', 'Customer', 'Transaction'],
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
  useResolveSubstitutionAdjustmentMutation,
  useHoldOrderMutation,
  useReleaseHoldMutation,
} = ordersApi
