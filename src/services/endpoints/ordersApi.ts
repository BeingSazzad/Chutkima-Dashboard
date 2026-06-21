import { api, clone, mockDelay } from '@/services/api'
import { orders, drivers, products } from '@/services/mock/data'
import type { Order, OrderStatus, PaymentMethod } from '@/types/common.types'

interface OrderFilters {
  status?: OrderStatus | 'all'
  zone?: string
  search?: string
  payment?: PaymentMethod | 'all'
  /** Restrict to orders placed within the last N days. */
  days?: number
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
        if (order.status === 'placed' || order.status === 'packing') order.status = 'picked_up'
        driver.status = 'on_delivery'
        driver.activeOrderId = orderId
        return { data: clone(order) }
      },
      invalidatesTags: ['Order', 'Driver'],
    }),

    addRider: build.mutation<Order, { orderId: string; driverId: string; note?: string }>({
      async queryFn({ orderId, driverId, note }) {
        await mockDelay(250)
        const order = orders.find((o) => o.id === orderId)
        const driver = drivers.find((d) => d.id === driverId)
        if (!order || !driver) return { error: { status: 404, data: 'Not found' } as never }
        if (order.assignments.some((a) => a.driverId === driverId)) return { data: clone(order) }
        order.assignments.push({ driverId, note: note ?? '', confirmed: false })
        if (!order.driverId) order.driverId = driverId
        driver.status = 'on_delivery'
        driver.activeOrderId = orderId
        return { data: clone(order) }
      },
      invalidatesTags: ['Order', 'Driver'],
    }),

    removeRider: build.mutation<Order, { orderId: string; driverId: string }>({
      async queryFn({ orderId, driverId }) {
        await mockDelay(200)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
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

    setRiderNote: build.mutation<Order, { orderId: string; driverId: string; note: string }>({
      async queryFn({ orderId, driverId, note }) {
        await mockDelay(150)
        const order = orders.find((o) => o.id === orderId)
        const a = order?.assignments.find((x) => x.driverId === driverId)
        if (!order || !a) return { error: { status: 404, data: 'Not found' } as never }
        a.note = note
        return { data: clone(order) }
      },
      invalidatesTags: ['Order'],
    }),

    confirmRider: build.mutation<Order, { orderId: string; driverId: string }>({
      async queryFn({ orderId, driverId }) {
        await mockDelay(200)
        const order = orders.find((o) => o.id === orderId)
        const a = order?.assignments.find((x) => x.driverId === driverId)
        if (!order || !a) return { error: { status: 404, data: 'Not found' } as never }
        a.confirmed = !a.confirmed
        // Order is delivered only when every assigned rider confirms.
        if (order.assignments.length > 0 && order.assignments.every((x) => x.confirmed)) {
          order.status = 'delivered'
          order.assignments.forEach((x) => {
            const d = drivers.find((dr) => dr.id === x.driverId)
            if (d) {
              d.status = 'available'
              d.activeOrderId = null
            }
          })
        }
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
        if (status === 'cancelled') order.cancelReason = reason ?? order.cancelReason
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
      invalidatesTags: ['Order', 'Driver', 'Kpi'],
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
        if (order.status === 'placed') order.status = 'packing'
        return { data: clone(order) }
      },
      invalidatesTags: ['Order'],
    }),

    markPacked: build.mutation<Order, string>({
      async queryFn(orderId) {
        await mockDelay(200)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
        order.packed = true
        return { data: clone(order) }
      },
      invalidatesTags: ['Order'],
    }),

    substituteItem: build.mutation<Order, { orderId: string; productId: string; newProductId: string }>({
      async queryFn({ orderId, productId, newProductId }) {
        await mockDelay(300)
        const order = orders.find((o) => o.id === orderId)
        if (!order) return { error: { status: 404, data: 'Order not found' } as never }
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
  }),
})

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useAssignDriverMutation,
  useAddRiderMutation,
  useRemoveRiderMutation,
  useSetRiderNoteMutation,
  useConfirmRiderMutation,
  useUpdateOrderStatusMutation,
  useMarkCodCollectedMutation,
  useAssignPackerMutation,
  useMarkPackedMutation,
  useSubstituteItemMutation,
} = ordersApi
