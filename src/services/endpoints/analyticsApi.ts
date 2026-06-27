import { api, clone, mockDelay } from '@/services/api'
import {
  drivers,
  hourlyOrders,
  orders,
  outsideZoneAttempts,
  products,
  searchAnalytics,
} from '@/services/mock/data'
import { PAYMENT_META } from '@/lib/constants'
import type {
  CategorySalesPoint,
  KpiSummary,
  Product,
  RevenuePoint,
} from '@/types/common.types'

export interface ZoneStat {
  zone: string
  orders: number
  revenue: number
}
export interface NamedValue {
  name: string
  value: number
}
export interface SearchStat {
  term: string
  count: number
  results: number
}

export type StatsPeriod = 'week' | 'month' | 'year'
export interface StatsRange {
  period: StatsPeriod
  year: number
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Deterministic mock revenue/orders series for the selected period + year. */
function buildSeries({ period, year }: StatsRange): RevenuePoint[] {
  const growth = 1 + (year - 2024) * 0.16 // older years earn less
  const make = (labels: string[], bases: number[]): RevenuePoint[] =>
    labels.map((label, i) => {
      const revenue = Math.round(bases[i % bases.length] * growth)
      return { label, revenue, orders: Math.round(revenue / 315) }
    })

  if (period === 'week') {
    return make(WEEKDAYS, [42100, 38600, 51200, 47800, 63400, 78900, 71200])
  }
  if (period === 'month') {
    return make(['Week 1', 'Week 2', 'Week 3', 'Week 4'], [318000, 296000, 402000, 357000])
  }
  return make(MONTHS, [1180000, 1090000, 1320000, 1255000, 1410000, 1620000, 1585000, 1498000, 1402000, 1365000, 1720000, 1890000])
}

export const analyticsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getKpis: build.query<KpiSummary, void>({
      async queryFn() {
        await mockDelay(300)
        // Everything derived from the same orders the Orders page shows — no fabrication.
        const day = (iso: string) => iso.slice(0, 10)
        const today = new Date().toISOString().slice(0, 10)
        const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10)
        const pct = (now: number, prev: number) => (prev > 0 ? Math.round(((now - prev) / prev) * 1000) / 10 : 0)

        // Revenue = delivered orders placed on the day; Orders = non-cancelled placed that day.
        const revenueOn = (d: string) =>
          orders.filter((o) => o.status === 'delivered' && day(o.placedAt) === d).reduce((s, o) => s + o.grandTotal, 0)
        const ordersOn = (d: string) => orders.filter((o) => o.status !== 'cancelled' && day(o.placedAt) === d).length

        const revenueToday = revenueOn(today)
        const ordersToday = ordersOn(today)

        // Avg delivery time from real placed→delivered stamps.
        const deliveredMins = orders
          .filter((o) => o.status === 'delivered' && o.stageTimestamps.delivered)
          .map((o) => (Date.parse(o.stageTimestamps.delivered!) - Date.parse(o.placedAt)) / 60000)
        const avgDeliveryMins = deliveredMins.length
          ? Math.round((deliveredMins.reduce((s, m) => s + m, 0) / deliveredMins.length) * 10) / 10
          : 0

        const activeDrivers = drivers.filter((d) => d.status !== 'offline').length
        return {
          data: {
            revenueToday,
            revenueChange: pct(revenueToday, revenueOn(yesterday)),
            ordersToday,
            ordersChange: pct(ordersToday, ordersOn(yesterday)),
            avgDeliveryMins,
            deliveryChange: 0,
            activeDrivers,
            totalDrivers: drivers.length,
          },
        }
      },
      providesTags: ['Kpi'],
    }),

    getRevenueSeries: build.query<RevenuePoint[], StatsRange | void>({
      async queryFn(range) {
        await mockDelay()
        return { data: buildSeries(range || { period: 'week', year: 2026 }) }
      },
    }),

    getCategorySales: build.query<CategorySalesPoint[], void>({
      async queryFn() {
        await mockDelay()
        // Derive the split from the catalog's real category groups + units sold —
        // no phantom groups that don't exist in the product catalogue.
        const byGroup = new Map<string, number>()
        for (const p of products) byGroup.set(p.categoryGroup, (byGroup.get(p.categoryGroup) ?? 0) + p.sold)
        const total = [...byGroup.values()].reduce((s, v) => s + v, 0) || 1
        const data: CategorySalesPoint[] = [...byGroup.entries()]
          .map(([name, sold]) => ({ name, value: Math.round((sold / total) * 100) }))
          .sort((a, b) => b.value - a.value)
        return { data }
      },
      providesTags: ['Product'],
    }),

    getHourlyOrders: build.query<{ label: string; orders: number }[], void>({
      async queryFn() {
        await mockDelay()
        return { data: hourlyOrders }
      },
    }),

    getTopProducts: build.query<Product[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone([...products].sort((a, b) => b.sold - a.sold).slice(0, 5)) }
      },
      providesTags: ['Product'],
    }),

    /** Fulfillment rate = delivered / (delivered + cancelled) from real orders. */
    getFulfillment: build.query<{ rate: number; delivered: number; cancelled: number }, void>({
      async queryFn() {
        await mockDelay(200)
        const delivered = orders.filter((o) => o.status === 'delivered').length
        const cancelled = orders.filter((o) => o.status === 'cancelled').length
        const total = delivered + cancelled
        const rate = total ? Math.round((delivered / total) * 1000) / 10 : 100
        return { data: { rate, delivered, cancelled } }
      },
      providesTags: ['Order'],
    }),

    /** Orders + revenue per delivery zone. */
    getZoneStats: build.query<ZoneStat[], void>({
      async queryFn() {
        await mockDelay()
        const map = new Map<string, ZoneStat>()
        for (const o of orders) {
          // Mirror KPI/store rules: skip cancelled; revenue counts delivered only.
          if (o.status === 'cancelled') continue
          const z = map.get(o.zone) ?? { zone: o.zone, orders: 0, revenue: 0 }
          z.orders += 1
          if (o.status === 'delivered') z.revenue += o.grandTotal
          map.set(o.zone, z)
        }
        return { data: clone([...map.values()].sort((a, b) => b.revenue - a.revenue)) }
      },
      providesTags: ['Order'],
    }),

    /** Payment method split (by order count). */
    getPaymentBreakdown: build.query<NamedValue[], void>({
      async queryFn() {
        await mockDelay()
        const counts: Record<string, number> = {}
        for (const o of orders) counts[o.paymentMethod] = (counts[o.paymentMethod] ?? 0) + 1
        const data = Object.entries(counts).map(([k, v]) => ({
          name: PAYMENT_META[k as keyof typeof PAYMENT_META].label,
          value: v,
        }))
        return { data: clone(data) }
      },
      providesTags: ['Order'],
    }),

    getSearchAnalytics: build.query<SearchStat[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone(searchAnalytics) }
      },
    }),

    getOutsideZoneDemand: build.query<{ area: string; attempts: number }[], void>({
      async queryFn() {
        await mockDelay()
        return { data: clone(outsideZoneAttempts) }
      },
    }),
  }),
})

export const {
  useGetKpisQuery,
  useGetRevenueSeriesQuery,
  useGetCategorySalesQuery,
  useGetHourlyOrdersQuery,
  useGetTopProductsQuery,
  useGetFulfillmentQuery,
  useGetZoneStatsQuery,
  useGetPaymentBreakdownQuery,
  useGetSearchAnalyticsQuery,
  useGetOutsideZoneDemandQuery,
} = analyticsApi
