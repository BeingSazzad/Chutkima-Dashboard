import { api, clone, mockDelay } from '@/services/api'
import { drivers, opsConfig, orders } from '@/services/mock/data'
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

/** Today's delivered count for a rider, derived from real orders. */
const deliveredToday = (driverId: string) =>
  orders.filter((o) => o.driverId === driverId && o.status === 'delivered').length

/** Attach the derived deliveriesToday so the stat matches the order data. */
const withToday = (d: Driver): Driver => ({ ...d, deliveriesToday: deliveredToday(d.id) })

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
        return { data: clone(result.map(withToday)) }
      },
      providesTags: ['Driver'],
    }),

    getDriver: build.query<Driver, string>({
      async queryFn(id) {
        await mockDelay(200)
        const driver = drivers.find((d) => d.id === id)
        if (!driver) return { error: { status: 404, data: 'Not found' } as never }
        return { data: clone(withToday(driver)) }
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

    /**
     * Per-rider fuel + COD reconciliation for a date range (defaults to today).
     * A single day (from === to) shows that day; a wider range accumulates every
     * day in between so the finance totals reflect the whole period.
     */
    getRiderFinance: build.query<RiderFinance[], { from?: string; to?: string } | void>({
      async queryFn(range) {
        await mockDelay(300)
        const today = new Date().toISOString().slice(0, 10)
        const from = range?.from || today
        const to = range?.to || from
        // Build the inclusive list of day strings (capped to keep the loop bounded).
        const days: string[] = []
        for (
          let d = new Date(`${from}T00:00:00`);
          d <= new Date(`${to}T00:00:00`) && days.length < 92;
          d = new Date(d.getTime() + 86_400_000)
        ) {
          days.push(d.toISOString().slice(0, 10))
        }
        if (days.length === 0) days.push(today)
        // Demo only has live data for today; past dates get a stable derived factor.
        const factorFor = (date: string) => {
          if (date === today) return 1
          const seed = [...date].reduce((s, c) => s + c.charCodeAt(0), 0)
          return 0.5 + (seed % 80) / 100
        }
        const rows = drivers.map((d) => {
          const codOrders = orders.filter(
            (o) => o.driverId === d.id && o.paymentMethod === 'cod' && o.status === 'delivered',
          )
          const codBase = codOrders.reduce((s, o) => s + o.grandTotal, 0)
          const codCollectedBase = codOrders.filter((o) => o.codCollected).reduce((s, o) => s + o.grandTotal, 0)
          let km = 0
          let codExpected = 0
          let codCollected = 0
          let deliveries = 0
          for (const date of days) {
            const factor = factorFor(date)
            km += Math.round(d.kmToday * factor)
            codExpected += Math.round(codBase * factor)
            codCollected += Math.round(codCollectedBase * factor)
            deliveries += Math.round(deliveredToday(d.id) * factor)
          }
          return {
            driverId: d.id,
            name: d.name,
            deliveriesToday: deliveries,
            kmToday: km,
            fuel: km * opsConfig.fuelRatePerKm,
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

    saveDriver: build.mutation<Driver, Partial<Driver> & { id?: string }>({
      async queryFn(payload) {
        await mockDelay(300)
        if (payload.id) {
          const idx = drivers.findIndex((d) => d.id === payload.id)
          if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
          drivers[idx] = { ...drivers[idx], ...payload } as Driver
          return { data: clone(drivers[idx]) }
        }
        const created: Driver = {
          id: `d${Date.now()}`,
          name: payload.name ?? 'New Rider',
          phone: payload.phone ?? '',
          avatar: payload.avatar || `https://i.pravatar.cc/120?u=chutkima-${Date.now()}`,
          licenseNo: payload.licenseNo ?? '',
          licenseDoc: payload.licenseDoc ?? '',
          vehicleRegDoc: payload.vehicleRegDoc ?? '',
          vehicle: payload.vehicle ?? 'Scooter',
          status: 'offline',
          zone: payload.zone ?? 'Traffic Chowk',
          rating: 5,
          activeOrderId: null,
          deliveriesToday: 0,
          totalDeliveries: 0,
          onTimeRate: 100,
          kmToday: 0,
        }
        drivers.unshift(created)
        return { data: clone(created) }
      },
      invalidatesTags: ['Driver'],
    }),

    deleteDriver: build.mutation<{ id: string }, string>({
      async queryFn(id) {
        await mockDelay(250)
        const idx = drivers.findIndex((d) => d.id === id)
        if (idx === -1) return { error: { status: 404, data: 'Not found' } as never }
        drivers.splice(idx, 1)
        return { data: { id } }
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
  useSaveDriverMutation,
  useDeleteDriverMutation,
} = driversApi
