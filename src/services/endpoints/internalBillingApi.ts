import { api, clone, mockDelay } from '@/services/api'
import { internalCounter, internalOrders } from '@/services/mock/data'
import type { InternalOrder, InternalOrderItem } from '@/types/common.types'

export interface CreateInternalOrder {
  staffName: string
  items: InternalOrderItem[]
  reason: string
  comments: string
  adminName: string
}

export const internalBillingApi = api.injectEndpoints({
  endpoints: (build) => ({
    getInternalOrders: build.query<InternalOrder[], void>({
      async queryFn() {
        await mockDelay()
        const result = [...internalOrders].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        return { data: clone(result) }
      },
      providesTags: ['InternalOrder'],
    }),

    createInternalOrder: build.mutation<InternalOrder, CreateInternalOrder>({
      async queryFn({ staffName, items, reason, comments, adminName }) {
        await mockDelay(350)
        if (items.length === 0) return { error: { status: 400, data: 'Add at least one item' } as never }
        const originalTotal = items.reduce((s, it) => s + it.originalPrice * it.quantity, 0)
        const sellTotal = items.reduce((s, it) => s + it.sellPrice * it.quantity, 0)
        const ref = `INT-${String(internalCounter.next).padStart(6, '0')}`
        internalCounter.next += 1
        const order: InternalOrder = {
          id: `int${Date.now().toString(36)}`,
          reference: ref,
          staffName,
          items,
          originalTotal,
          sellTotal,
          discount: originalTotal - sellTotal,
          reason,
          comments,
          adminName,
          createdAt: new Date().toISOString(),
        }
        internalOrders.unshift(order)
        return { data: clone(order) }
      },
      invalidatesTags: ['InternalOrder'],
    }),
  }),
})

export const { useGetInternalOrdersQuery, useCreateInternalOrderMutation } = internalBillingApi
