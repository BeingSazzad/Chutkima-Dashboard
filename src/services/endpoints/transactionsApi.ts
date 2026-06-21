import { api, clone, mockDelay } from '@/services/api'
import { transactions } from '@/services/mock/data'
import type { Transaction, TransactionType } from '@/types/common.types'

export const transactionsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTransactions: build.query<Transaction[], { type?: TransactionType | 'all'; search?: string } | void>({
      async queryFn(filters) {
        await mockDelay()
        let result = [...transactions].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        if (filters?.type && filters.type !== 'all') {
          result = result.filter((t) => t.type === filters.type)
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase()
          result = result.filter(
            (t) =>
              t.reference.toLowerCase().includes(q) ||
              t.party.toLowerCase().includes(q) ||
              t.method.toLowerCase().includes(q),
          )
        }
        return { data: clone(result) }
      },
      providesTags: ['Transaction'],
    }),
  }),
})

export const { useGetTransactionsQuery } = transactionsApi
