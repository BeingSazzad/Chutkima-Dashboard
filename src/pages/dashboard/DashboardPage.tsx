import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Bike, Clock, IndianRupee, ShoppingBag, TrendingUp } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { StatCard } from '@/components/shared/StatCard'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Spinner } from '@/components/ui/Spinner'
import { ProductThumb } from '@/components/shared/ProductThumb'
import { Avatar } from '@/components/shared/Avatar'
import { OrderStatusBadge } from '@/components/shared/StatusBadge'
import { formatCompact, formatNPR, timeAgo } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { useGetOrdersQuery } from '@/services/endpoints/ordersApi'
import { useGetDriversQuery } from '@/services/endpoints/driversApi'
import {
  useGetCategorySalesQuery,
  useGetKpisQuery,
  useGetRevenueSeriesQuery,
  useGetTopProductsQuery,
  type StatsPeriod,
} from '@/services/endpoints/analyticsApi'

const DONUT_COLORS = ['#0c7d60', '#2eaf85', '#94dcc1', '#c8ecdd']

export default function DashboardPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<StatsPeriod>('week')
  const { data: kpis } = useGetKpisQuery()
  const { data: revenue = [] } = useGetRevenueSeriesQuery({ period, year: 2026 })
  const { data: catSales = [] } = useGetCategorySalesQuery()
  const { data: topProducts = [] } = useGetTopProductsQuery()
  const { data: orders = [], isLoading: ordersLoading } = useGetOrdersQuery()
  const { data: drivers = [] } = useGetDriversQuery()

  const liveOrders = orders.filter((o) => !['delivered', 'cancelled'].includes(o.status))
  const recentOrders = orders.slice(0, 6)
  const onDelivery = drivers.filter((d) => d.status === 'on_delivery')

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live snapshot of your Butwal dark store."
        actions={
          <Button leftIcon={<TrendingUp className="h-4 w-4" />} onClick={() => navigate(ROUTES.analytics)}>
            View analytics
          </Button>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Revenue today"
          value={kpis ? formatNPR(kpis.revenueToday) : '—'}
          change={kpis?.revenueChange}
          icon={<IndianRupee className="h-5 w-5" />}
        />
        <StatCard
          label="Orders today"
          value={kpis ? formatCompact(kpis.ordersToday) : '—'}
          change={kpis?.ordersChange}
          icon={<ShoppingBag className="h-5 w-5" />}
        />
        <StatCard
          label="Avg. delivery time"
          value={kpis ? `${kpis.avgDeliveryMins} min` : '—'}
          change={kpis?.deliveryChange}
          changeSuffix="faster"
          icon={<Clock className="h-5 w-5" />}
        />
        <StatCard
          label="Active riders"
          value={kpis ? `${kpis.activeDrivers}/${kpis.totalDrivers}` : '—'}
          icon={<Bike className="h-5 w-5" />}
        />
      </div>

      {/* Charts */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Revenue & orders"
            subtitle={period === 'week' ? 'Last 7 days' : period === 'month' ? 'This month' : 'This year'}
            action={
              <div className="w-32">
                <Select
                  value={period}
                  onChange={(e) => setPeriod(e.target.value as StatsPeriod)}
                  options={[
                    { label: 'This week', value: 'week' },
                    { label: 'This month', value: 'month' },
                    { label: 'This year', value: 'year' },
                  ]}
                />
              </div>
            }
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenue} margin={{ left: -16, right: 8, top: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f9270" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#0f9270" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" tickFormatter={(v) => formatCompact(v as number)} />
                <Tooltip
                  cursor={{ stroke: '#0f9270', strokeWidth: 1, strokeDasharray: 4 }}
                  contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}
                  formatter={(v: number) => [formatNPR(v), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#0c7d60" strokeWidth={2.5} fill="url(#rev)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Sales by category" subtitle="Share of revenue" />
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={catSales} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {catSales.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [`${v}%`, 'Share']} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-2">
              {catSales.map((c, i) => (
                <div key={c.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    {c.name}
                  </span>
                  <span className="font-semibold text-slate-800">{c.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live ops + lists */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Recent / live orders */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Recent orders"
            subtitle={`${liveOrders.length} in progress`}
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.orders)}>
                View all
              </Button>
            }
          />
          <CardContent className="pt-2">
            {ordersLoading ? (
              <Spinner label="Loading orders…" className="py-10" />
            ) : (
              <div className="divide-y divide-slate-50">
                {recentOrders.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => navigate(ROUTES.orderDetail(o.id))}
                    className="flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-mint-50"
                  >
                    <div className="flex -space-x-3">
                      {o.items.slice(0, 3).map((it) => (
                        <ProductThumb key={it.productId} src={it.image} alt={it.name} size="sm" className="ring-2 ring-white" />
                      ))}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {o.reference} · {o.customerName}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {o.items.length} items · {o.zone} · {timeAgo(o.placedAt)}
                      </p>
                    </div>
                    <span className="hidden text-sm font-bold text-slate-800 sm:block">
                      {formatNPR(o.grandTotal)}
                    </span>
                    <OrderStatusBadge status={o.status} />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Riders on delivery */}
        <Card>
          <CardHeader
            title="Riders on delivery"
            subtitle={`${onDelivery.length} active now`}
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate(ROUTES.drivers)}>
                Manage
              </Button>
            }
          />
          <CardContent className="space-y-3 pt-2">
            {onDelivery.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">All riders idle.</p>
            )}
            {onDelivery.map((d) => (
              <div key={d.id} className="flex items-center gap-3 rounded-xl bg-mint-50 p-3">
                <div className="relative">
                  <Avatar name={d.name} src={d.avatar} />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-brand-500 ring-2 ring-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{d.name}</p>
                  <p className="truncate text-xs text-slate-400">{d.zone} · {d.vehicle.split('·')[0]}</p>
                </div>
                <Bike className="h-4 w-4 text-brand-500" />
              </div>
            ))}

            <div className="!mt-4 border-t border-slate-100 pt-4">
              <p className="mb-3 text-sm font-bold text-slate-800">Top sellers today</p>
              <div className="space-y-2.5">
                {topProducts.slice(0, 4).map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2.5">
                    <span className="w-4 text-sm font-bold text-slate-300">{i + 1}</span>
                    <ProductThumb src={p.image} alt={p.name} size="sm" />
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-600">{p.name}</span>
                    <span className="text-xs font-semibold text-brand-700">{p.sold} sold</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
