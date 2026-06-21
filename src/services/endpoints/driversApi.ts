import { api, clone, mockDelay } from '@/services/api'
import { drivers, orders } from '@/services/mock/data'
import { FUEL_RATE_PER_KM } from '@/lib/constants'
import type { Driver, DriverStatus, Order } from '@/types/common.types'

export interface RiderFinance {
  driverId: string
  name: string
  deliveriesToday: number
  kmToday: number
  fuel: number
  codExpected: number
  codCollected: number
  discrepancy: number
}

export const driversApi = api.injectEndpoints({
  endpoints: (build) => ({
    getDrivers: build.query<Driver[], { status?: DriverStatus | 'all'; search?: string } | void>({
      async queryFn(filters) {
        await mockDelay()
        let result = [...drivers]
        if (filters?.status && filters.status !== 'all') {
          result = result.filter((d) => d.status === filters.status)
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase()
          result = result.filter(
            (d) => d.name.toLowerCase().includes(q) || d.phone.includes(q),
          )
        }
        return { data: clone(result) }
      },
      providesTags: ['Driver'],
    }),

    getDriver: build.query<Driver, string>({
      async queryFn(id) {
        await mockDelay(200)
        const driver = drivers.find((d) => d.id === id)
        if (!driver) return { error: { status: 404, data: 'Not found' } as never }
        return { data: clone(driver) }
      },
      providesTags: (_r, _e, id) => [{ type: 'Driver', id }],
    }),

    /** Delivered orders for a rider (delivery history). */
    getDriverDeliveries: build.query<Order[], string>({
      async queryFn(driverId) {
        await mockDelay(250)
        const result = orders
          .filter((o) => o.driverId === driverId && o.status === 'delivered')
          .sort((a, b) => new Date(b.placedAt).getTime() - new Date(a.placedAt).getTime())
        return { data: clone(result) }
      },
      providesTags: ['Order'],
    }),

    /** Per-rider fuel + COD reconciliation for today. */
    getRiderFinance: build.query<RiderFinance[], void>({
      async queryFn() {
        await mockDelay(300)
        const rows = drivers.map((d) => {
          const codOrders = orders.filter(
            (o) => o.driverId === d.id && o.paymentMethod === 'cod' && o.status === 'delivered',
          )
          const codExpected = codOrders.reduce((s, o) => s + o.grandTotal, 0)
          const codCollected = codOrders.filter((o) => o.codCollected).reduce((s, o) => s + o.grandTotal, 0)
          return {
            driverId: d.id,
            name: d.name,
            deliveriesToday: d.deliveriesToday,
            kmToday: d.kmToday,
            fuel: d.kmToday * FUEL_RATE_PER_KM,
            codExpected,
            codCollected,
            discrepancy: codExpected - codCollected,
          }
        })
        return { data: clone(rows) }
      },
      providesTags: ['Driver', 'Order'],
    }),

    setDriverStatus: build.mutation<Driver, { id: string; status: DriverStatus }>({
      async queryFn({ id, status }) {
        await mockDelay(200)
        const driver = drivers.find((d) => d.id === id)
        if (!driver) return { error: { status: 404, data: 'Not found' } as never }
        driver.status = status
        if (status !== 'on_delivery') driver.activeOrderId = null
        return { data: clone(driver) }
      },
      invalidatesTags: ['Driver'],
    }),
  }),
})

export const {
  useGetDriversQuery,
  useGetDriverQuery,
  useGetDriverDeliveriesQuery,
  useGetRiderFinanceQuery,
  useSetDriverStatusMutation,
} = driversApi
