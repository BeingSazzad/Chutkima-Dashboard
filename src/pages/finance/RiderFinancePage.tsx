import { Fuel, Route, TriangleAlert, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { StatCard } from '@/components/shared/StatCard'
import { Avatar } from '@/components/shared/Avatar'
import { FUEL_RATE_PER_KM } from '@/lib/constants'
import { cn, formatNPR } from '@/lib/utils'
import { useGetRiderFinanceQuery, type RiderFinance } from '@/services/endpoints/driversApi'

export default function RiderFinancePage() {
  const { data: rows = [], isLoading } = useGetRiderFinanceQuery()

  const totalFuel = rows.reduce((s, r) => s + r.fuel, 0)
  const totalCodExpected = rows.reduce((s, r) => s + r.codExpected, 0)
  const totalCodCollected = rows.reduce((s, r) => s + r.codCollected, 0)
  const totalDiscrepancy = rows.reduce((s, r) => s + r.discrepancy, 0)

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
    { key: 'km', header: 'KM today', cell: (r) => <span className="text-slate-700">{r.kmToday} km</span> },
    {
      key: 'fuel',
      header: `Fuel (× NPR ${FUEL_RATE_PER_KM})`,
      cell: (r) => <span className="font-semibold text-slate-800">{formatNPR(r.fuel)}</span>,
    },
    { key: 'expected', header: 'COD expected', cell: (r) => <span className="text-slate-600">{formatNPR(r.codExpected)}</span> },
    { key: 'collected', header: 'COD collected', cell: (r) => <span className="text-slate-600">{formatNPR(r.codCollected)}</span> },
    {
      key: 'disc',
      header: 'Discrepancy',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (r) =>
        r.discrepancy > 0 ? (
          <Badge tone="bg-red-50 text-red-700 ring-red-600/15">{formatNPR(r.discrepancy)} short</Badge>
        ) : (
          <span className="text-xs font-semibold text-success">Reconciled</span>
        ),
    },
  ]

  return (
    <>
      <PageHeader title="Rider Finance" description="Daily fuel reimbursement and COD cash reconciliation per rider." />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total fuel today" value={formatNPR(totalFuel)} icon={<Fuel className="h-5 w-5" />} iconClass="bg-amber-50 text-amber-600" />
        <StatCard label="COD expected" value={formatNPR(totalCodExpected)} icon={<Wallet className="h-5 w-5" />} iconClass="bg-brand-50 text-brand-600" />
        <StatCard label="COD collected" value={formatNPR(totalCodCollected)} icon={<Route className="h-5 w-5" />} iconClass="bg-green-50 text-green-600" />
        <StatCard label="Discrepancy" value={formatNPR(totalDiscrepancy)} icon={<TriangleAlert className="h-5 w-5" />} iconClass={cn(totalDiscrepancy > 0 ? 'bg-red-50 text-danger' : 'bg-green-50 text-green-600')} />
      </div>

      <Card className="mt-4">
        <DataTable columns={columns} data={rows} rowKey={(r) => r.driverId} loading={isLoading} emptyTitle="No rider data" />
      </Card>
    </>
  )
}
