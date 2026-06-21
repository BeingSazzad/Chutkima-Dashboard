import { api, clone, mockDelay } from '@/services/api'
import { darkStores, drivers, orders } from '@/services/mock/data'
import type { DarkStore } from '@/types/common.types'

export interface StoreOverview {
  store: DarkStore
  orders: number
  revenue: number
  pending: number
  ridersOnline: number
}

export const storesApi = api.injectEndpoints({
  endpoints: (build) => ({
    getStores: build.query<DarkStore[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone(darkStores) }
      },
      providesTags: ['Store'],
    }),

    /** Consolidated per-store metrics for the master dashboard. */
    getStoreOverview: build.query<StoreOverview[], void>({
      async queryFn() {
        await mockDelay(300)
        const rows = darkStores.map((store) => {
          const storeOrders = orders.filter((o) => o.storeId === store.id)
          return {
            store: clone(store),
            orders: storeOrders.length,
            revenue: storeOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.grandTotal, 0),
            pending: storeOrders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length,
            ridersOnline: drivers.filter((d) => d.status !== 'offline').length,
          }
        })
        return { data: rows }
      },
      providesTags: ['Store', 'Order'],
    }),

    saveStore: build.mutation<DarkStore, Partial<DarkStore> & { id?: string }>({
      async queryFn(payload) {
        await mockDelay(300)
        if (payload.id) {
          const s = darkStores.find((x) => x.id === payload.id)
          if (!s) return { error: { status: 404, data: 'Not found' } as never }
          Object.assign(s, payload)
          return { data: clone(s) }
        }
        const created: DarkStore = {
          id: `s${Date.now()}`,
          name: payload.name ?? 'New Store',
          address: payload.address ?? '',
          phone: payload.phone ?? '',
          whatsapp: payload.whatsapp ?? '',
          openTime: payload.openTime ?? '7:00 AM',
          closeTime: payload.closeTime ?? '11:00 PM',
          active: payload.active ?? true,
          createdAt: new Date().toISOString(),
        }
        darkStores.push(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['Store'],
    }),

    toggleStore: build.mutation<DarkStore, string>({
      async queryFn(id) {
        await mockDelay(150)
        const s = darkStores.find((x) => x.id === id)
        if (!s) return { error: { status: 404, data: 'Not found' } as never }
        s.active = !s.active
        return { data: clone(s) }
      },
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          storesApi.util.updateQueryData('getStores', undefined, (draft) => {
            const s = draft.find((x) => x.id === id)
            if (s) s.active = !s.active
          }),
        )
        try {
          await queryFulfilled
        } catch {
          patch.undo()
        }
      },
    }),

    deleteStore: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const idx = darkStores.findIndex((s) => s.id === id)
        if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
        darkStores.splice(idx, 1)
        return { data: { id } }
      },
      invalidatesTags: ['Store'],
    }),
  }),
})

export const {
  useGetStoresQuery,
  useGetStoreOverviewQuery,
  useSaveStoreMutation,
  useToggleStoreMutation,
  useDeleteStoreMutation,
} = storesApi
