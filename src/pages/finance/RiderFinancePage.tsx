import { Banknote, Fuel, HandCoins, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/shared/StatCard'
import { Avatar } from '@/components/shared/Avatar'
import { FUEL_RATE_PER_KM } from '@/lib/constants'
import { cn, formatNPR } from '@/lib/utils'
import { useGetRiderFinanceQuery, type RiderFinance } from '@/services/endpoints/driversApi'

/** netToDeposit = cash the rider hands to the store after keeping their fuel allowance. */
const net = (r: RiderFinance) => r.codCollected - r.fuel

export default function RiderFinancePage() {
  const { data: rows = [], isLoading } = useGetRiderFinanceQuery()

  const totalFuel = rows.reduce((s, r) => s + r.fuel, 0)
  const totalInHand = rows.reduce((s, r) => s + r.codCollected, 0)
  const totalPending = rows.reduce((s, r) => s + r.discrepancy, 0)
  const totalNet = rows.reduce((s, r) => s + net(r), 0)

  const columns: Column<RiderFinance>[] = [
    {
      key: 'rider',
      header: 'Rider',
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} />
          <div>
            <p className="font-semibold text-slate-800">{r.name}</p>
            <p className="text-xs text-slate-400">{r.deliveriesToday} deliveries today</p>
          </div>
        </div>
      ),
    },
    { key: 'km', header: 'KM', cell: (r) => <span className="text-slate-700">{r.kmToday} km</span> },
    {
      key: 'fuel',
      header: `Fuel due (×${FUEL_RATE_PER_KM})`,
      cell: (r) => <span className="font-semibold text-amber-600">{formatNPR(r.fuel)}</span>,
    },
    { key: 'hand', header: 'COD in hand', cell: (r) => <span className="text-slate-700">{formatNPR(r.codCollected)}</span> },
    {
      key: 'pending',
      header: 'Pending COD',
      cell: (r) =>
        r.discrepancy > 0 ? (
          <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/15">{formatNPR(r.discrepancy)}</Badge>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: 'net',
      header: 'Net to deposit',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (r) => <span className="font-bold text-slate-800">{formatNPR(Math.max(0, net(r)))}</span>,
    },
  ]

  return (
    <>
      <PageHeader title="Rider Finance" description="Daily fuel allowance and cash-on-delivery reconciliation per rider." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Fuel due to riders" value={formatNPR(totalFuel)} icon={<Fuel className="h-5 w-5" />} iconClass="bg-amber-50 text-amber-600" />
        <StatCard label="COD in riders' hands" value={formatNPR(totalInHand)} icon={<HandCoins className="h-5 w-5" />} iconClass="bg-brand-50 text-brand-600" />
        <StatCard label="Net to deposit" value={formatNPR(Math.max(0, totalNet))} icon={<Wallet className="h-5 w-5" />} iconClass="bg-green-50 text-green-600" />
        <StatCard label="Pending COD" value={formatNPR(totalPending)} icon={<Banknote className="h-5 w-5" />} iconClass={cn(totalPending > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500')} />
      </div>

      <Card className="mt-4">
        <DataTable columns={columns} data={rows} rowKey={(r) => r.driverId} loading={isLoading} emptyTitle="No rider data" />
      </Card>

      <p className="mt-3 px-1 text-xs text-slate-400">
        Net to deposit = COD cash in hand − fuel allowance. Riders keep their fuel and deposit the rest to the store.
      </p>
    </>
  )
}
