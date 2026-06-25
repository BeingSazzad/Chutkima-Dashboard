import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { DateRangeFilter } from '@/components/shared/DateRangeFilter'
import { StatCard } from '@/components/shared/StatCard'
import { ProductThumb } from '@/components/shared/ProductThumb'
import { Banknote, CheckCircle2, Download, MapPinned, Receipt, TrendingUp, Users } from 'lucide-react'
import { formatCompact, formatNPR } from '@/lib/utils'
import { downloadCSV } from '@/lib/export'
import {
  useGetFulfillmentQuery,
  useGetHourlyOrdersQuery,
  useGetOutsideZoneDemandQuery,
  useGetPaymentBreakdownQuery,
  useGetRevenueSeriesQuery,
  useGetSearchAnalyticsQuery,
  useGetTopProductsQuery,
  useGetZoneStatsQuery,
  type StatsPeriod,
} from '@/services/endpoints/analyticsApi'

const DONUT_COLORS = ['#0c7d60', '#2eaf85', '#94dcc1', '#c8ecdd']

const PERIOD_LABEL: Record<StatsPeriod, string> = {
  week: 'This week',
  month: 'This month',
  year: 'This year',
}

const todayStr = () => new Date().toISOString().slice(0, 10)
const daysAgoStr = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10)

export default function AnalyticsPage() {
  const [from, setFrom] = useState(daysAgoStr(6))
  const [to, setTo] = useState(todayStr())

  // Derive chart granularity + year from the chosen range (mock series are per-period).
  const spanDays = Math.max(1, Math.round((Date.parse(to) - Date.parse(from)) / 86_400_000) + 1)
  const period: StatsPeriod = spanDays <= 14 ? 'week' : spanDays <= 92 ? 'month' : 'year'
  const year = Number(to.slice(0, 4)) || new Date().getFullYear()

  const { data: revenue = [] } = useGetRevenueSeriesQuery({ period, year })
  const { data: hourly = [] } = useGetHourlyOrdersQuery()
  const { data: topProducts = [] } = useGetTopProductsQuery()
  const { data: fulfillment } = useGetFulfillmentQuery()
  const { data: zoneStats = [] } = useGetZoneStatsQuery()
  const { data: paymentBreakdown = [] } = useGetPaymentBreakdownQuery()
  const { data: searchStats = [] } = useGetSearchAnalyticsQuery()
  const { data: outsideZone = [] } = useGetOutsideZoneDemandQuery()

  const totalRevenue = revenue.reduce((s, r) => s + r.revenue, 0)
  const totalOrders = revenue.reduce((s, r) => s + r.orders, 0)
  const avgOrderValue = totalOrders ? Math.round(totalRevenue / totalOrders) : 0
  const peak = hourly.reduce((max, h) => (h.orders > max.orders ? h : max), hourly[0] ?? { label: '—', orders: 0 })
  const suffix = `${from} → ${to}`

  const exportCsv = () => {
    downloadCSV(
      `chutkima-analytics-${from}_to_${to}.csv`,
      revenue.map((r) => ({ period: r.label, revenue: r.revenue.toString(), orders: r.orders.toString() })),
      [
        { key: 'period', label: 'Period' },
        { key: 'revenue', label: 'Revenue (NPR)' },
        { key: 'orders', label: 'Orders' },
      ],
    )
  }

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Revenue & order performance for your dark store."
        breadcrumbs={[{ label: 'Dashboard', to: '/' }, { label: 'Analytics' }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter from={from} to={to} max={todayStr()} clearable={false} onChange={(r) => { setFrom(r.from || from); setTo(r.to || to) }} />
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={revenue.length === 0}>
              Export CSV
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label={`${PERIOD_LABEL[period]} revenue`} value={formatNPR(totalRevenue)} change={12.4} icon={<Banknote className="h-5 w-5" />} changeSuffix={suffix} />
        <StatCard label={`${PERIOD_LABEL[period]} orders`} value={formatCompact(totalOrders)} change={8.1} icon={<Receipt className="h-5 w-5" />} changeSuffix={suffix} />
        <StatCard label="Avg. order value" value={formatNPR(avgOrderValue)} change={3.2} icon={<TrendingUp className="h-5 w-5" />} changeSuffix={suffix} />
        <StatCard label="Peak hour" value={peak.label} icon={<Users className="h-5 w-5" />} changeSuffix={`${peak.orders} orders today`} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Revenue trend" subtitle={`${PERIOD_LABEL[period]} · ${year}`} />
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={revenue} margin={{ left: -12, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" tickFormatter={(v) => formatCompact(v as number)} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} formatter={(v: number) => [formatNPR(v), 'Revenue']} />
                <Line type="monotone" dataKey="revenue" stroke="#0c7d60" strokeWidth={3} dot={{ r: 4, fill: '#0c7d60' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Orders by hour" subtitle="Today's demand curve" />
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={hourly} margin={{ left: -16, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={11} stroke="#94a3b8" interval={1} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" />
                <Tooltip cursor={{ fill: '#f0fdf9' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} formatter={(v: number) => [`${v} orders`, 'Orders']} />
                <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                  {hourly.map((h, i) => (
                    <Cell key={i} fill={h.label === peak.label ? '#0c7d60' : '#94dcc1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader title="Top performing products" subtitle="By units sold" />
        <CardContent className="space-y-1 pt-2">
          {topProducts.map((p, i) => {
            const max = topProducts[0]?.sold || 1
            return (
              <div key={p.id} className="flex items-center gap-3 py-2">
                <span className="w-5 text-center text-sm font-extrabold text-slate-300">{i + 1}</span>
                <ProductThumb src={p.image} alt={p.name} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-slate-800">{p.name}</p>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(p.sold / max) * 100}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-slate-800">{p.sold.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{formatNPR(p.price)}</p>
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Payment + zone */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Payment methods" subtitle="Share of orders" />
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={paymentBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {paymentBreakdown.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, n) => [`${v} orders`, n as string]} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1.5">
              {paymentBreakdown.map((p, i) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-slate-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    {p.name}
                  </span>
                  <span className="font-semibold text-slate-800">{p.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Orders & revenue by zone"
            subtitle="Per delivery zone"
            action={fulfillment ? <Badge tone="bg-green-50 text-green-700 ring-green-600/15"><CheckCircle2 className="h-3 w-3" /> {fulfillment.rate}% fulfilled</Badge> : undefined}
          />
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={zoneStats} margin={{ left: -10, right: 8, top: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="zone" tickLine={false} axisLine={false} fontSize={10} stroke="#94a3b8" interval={0} angle={-12} textAnchor="end" height={50} />
                <YAxis tickLine={false} axisLine={false} fontSize={12} stroke="#94a3b8" tickFormatter={(v) => formatCompact(v as number)} />
                <Tooltip cursor={{ fill: '#f0fdf9' }} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} formatter={(v: number, n) => (n === 'revenue' ? [formatNPR(v), 'Revenue'] : [v, 'Orders'])} />
                <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="#0c7d60" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Search + outside-zone demand */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Top searches" subtitle="Zero-result terms are expansion signals" />
          <CardContent className="space-y-1 pt-2">
            {searchStats.map((s) => (
              <div key={s.term} className="flex items-center justify-between border-b border-slate-50 py-2 last:border-0">
                <span className="text-sm font-medium capitalize text-slate-700">{s.term}</span>
                <div className="flex items-center gap-3">
                  {s.results === 0 ? (
                    <Badge tone="bg-red-50 text-red-700 ring-red-600/15">0 results</Badge>
                  ) : (
                    <span className="text-xs text-slate-400">{s.results} results</span>
                  )}
                  <span className="w-12 text-right text-sm font-bold text-slate-800">{s.count}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader title="Outside-zone demand" subtitle="GPS attempts from beyond service area" />
          <CardContent className="space-y-2 pt-2">
            {outsideZone.map((o) => {
              const max = outsideZone[0]?.attempts || 1
              return (
                <div key={o.area} className="flex items-center gap-3">
                  <MapPinned className="h-4 w-4 shrink-0 text-brand-400" />
                  <span className="w-32 shrink-0 truncate text-sm text-slate-700">{o.area}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${(o.attempts / max) * 100}%` }} />
                  </div>
                  <span className="w-8 text-right text-sm font-bold text-slate-800">{o.attempts}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
