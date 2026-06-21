import { api, clone, mockDelay } from '@/services/api'
import { customers, orders } from '@/services/mock/data'
import type { Customer, Order } from '@/types/common.types'

export const customersApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCustomers: build.query<Customer[], { search?: string } | void>({
      async queryFn(filters) {
        await mockDelay()
        let result = [...customers].sort((a, b) => b.totalSpent - a.totalSpent)
        if (filters?.search) {
          const q = filters.search.toLowerCase()
          result = result.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q))
        }
        return { data: clone(result) }
      },
      providesTags: ['Customer'],
    }),

    getCustomer: build.query<Customer, string>({
      async queryFn(id) {
        await mockDelay(200)
        const customer = customers.find((c) => c.id === id)
        if (!customer) return { error: { status: 404, data: 'Not found' } as never }
        return { data: clone(customer) }
      },
      providesTags: (_r, _e, id) => [{ type: 'Customer', id }],
    }),

    getCustomerOrders: build.query<Order[], string>({
      async queryFn(customerId) {
        await mockDelay(250)
        const result = orders
          .filter((o) => o.customerId === customerId)
          .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
        return { data: clone(result) }
      },
      providesTags: ['Order'],
    }),

    banCustomer: build.mutation<Customer, string>({
      async queryFn(id) {
        await mockDelay(200)
        const customer = customers.find((c) => c.id === id)
        if (!customer) return { error: { status: 404, data: 'Not found' } as never }
        customer.banned = !customer.banned
        return { data: clone(customer) }
      },
      // Refetch the list AND any open customer detail (type-only invalidation
      // matches both the plain 'Customer' list tag and id-specific tags).
      invalidatesTags: ['Customer'],
    }),

    deleteCustomer: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const idx = customers.findIndex((c) => c.id === id)
        if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
        customers.splice(idx, 1)
        return { data: { id } }
      },
      invalidatesTags: ['Customer'],
    }),

    /** Count recipients for a broadcast segment (live preview). */
    getSegmentCount: build.query<number, string>({
      async queryFn(segment) {
        await mockDelay(150)
        return { data: segmentCustomers(segment).length }
      },
      providesTags: ['Customer'],
    }),

    sendBroadcast: build.mutation<{ recipients: number }, { title: string; message: string; segment: string }>({
      async queryFn({ segment }) {
        await mockDelay(600)
        return { data: { recipients: segmentCustomers(segment).length } }
      },
    }),
  }),
})

/** Resolve a broadcast segment to its matching customers. */
function segmentCustomers(segment: string) {
  switch (segment) {
    case 'trusted':
      return customers.filter((c) => c.trustBadge === 'green' && !c.banned)
    case 'vip':
      return customers.filter((c) => c.totalSpent > 25000)
    case 'wallet':
      return customers.filter((c) => c.walletBalance > 0)
    case 'inactive':
      return customers.filter((c) => Date.now() - new Date(c.lastOrderAt).getTime() > 7 * 86_400_000)
    default:
      return customers.filter((c) => !c.banned)
  }
}

export const {
  useGetCustomersQuery,
  useGetCustomerQuery,
  useGetCustomerOrdersQuery,
  useBanCustomerMutation,
  useDeleteCustomerMutation,
  useGetSegmentCountQuery,
  useSendBroadcastMutation,
} = customersApi
