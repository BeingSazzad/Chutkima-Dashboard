import { api, clone, mockDelay } from '@/services/api'
import { orders, transactions } from '@/services/mock/data'
import { PAYMENT_META } from '@/lib/constants'
import type { Transaction, TransactionType } from '@/types/common.types'

/** Build the money ledger from real orders so amounts/refs always match. */
function buildTransactions(): Transaction[] {
  const fromOrders: Transaction[] = orders.map((o) => {
    const base = {
      reference: o.reference,
      party: o.customerName,
      orderId: o.id,
      createdAt: o.placedAt,
      amount: o.grandTotal,
    }
    if (o.status === 'cancelled' && o.paymentMethod !== 'cod') {
      return { ...base, id: `tx-${o.id}`, type: 'refund', method: PAYMENT_META[o.paymentMethod].label, status: 'success' }
    }
    if (o.paymentMethod === 'cod') {
      return {
        ...base,
        id: `tx-${o.id}`,
        type: 'cod_collection',
        method: 'Cash',
        status: o.codCollected ? 'success' : o.status === 'cancelled' ? 'failed' : 'pending',
      }
    }
    return { ...base, id: `tx-${o.id}`, type: 'order_payment', method: PAYMENT_META[o.paymentMethod].label, status: 'success' }
  })
  // Keep rider payouts (not order-derived).
  const payouts = transactions.filter((t) => t.type === 'payout')
  return [...fromOrders, ...payouts]
}

export const transactionsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTransactions: build.query<Transaction[], { type?: TransactionType | 'all'; search?: string } | void>({
      async queryFn(filters) {
        await mockDelay()
        let result = buildTransactions().sort(
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
