import { useState } from 'react'
import { Banknote, Download, Fuel, HandCoins, Wallet } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { StatCard } from '@/components/shared/StatCard'
import { Avatar } from '@/components/shared/Avatar'
import { FUEL_RATE_PER_KM } from '@/lib/constants'
import { cn, formatNPR } from '@/lib/utils'
import { downloadCSV } from '@/lib/export'
import { useAuth } from '@/hooks/useAuth'
import {
  useCollectRiderCashMutation,
  useGetRiderFinanceQuery,
  type RiderFinance,
} from '@/services/endpoints/driversApi'
import { useGetOpsConfigQuery } from '@/services/endpoints/settingsApi'

/** netToDeposit = cash the rider should hand over after keeping their fuel allowance. */
const net = (r: RiderFinance) => Math.max(0, r.codCollected - r.fuel)
/** outstanding = net still owed after subtracting what the rider already deposited. */
const outstanding = (r: RiderFinance) => Math.max(0, net(r) - r.deposited)

export default function RiderFinancePage() {
  const today = new Date().toISOString().slice(0, 10)
  const { user } = useAuth()
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const { data: rows = [], isLoading } = useGetRiderFinanceQuery({ from, to })
  const { data: ops } = useGetOpsConfigQuery()
  const [collectCash, { isLoading: collecting }] = useCollectRiderCashMutation()
  const fuelRate = ops?.fuelRatePerKm ?? FUEL_RATE_PER_KM
  const isRange = from !== today || to !== today

  // Cash-collection modal state.
  const [collectFor, setCollectFor] = useState<RiderFinance | null>(null)
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')

  const totalFuel = rows.reduce((s, r) => s + r.fuel, 0)
  const totalInHand = rows.reduce((s, r) => s + r.codCollected, 0)
  const totalDeposited = rows.reduce((s, r) => s + r.deposited, 0)
  const totalOutstanding = rows.reduce((s, r) => s + outstanding(r), 0)

  const openCollect = (r: RiderFinance) => {
    setCollectFor(r)
    setAmount(String(outstanding(r) || ''))
    setNote('')
  }
  const closeCollect = () => {
    setCollectFor(null)
    setAmount('')
    setNote('')
  }

  const amountNum = Number(amount) || 0
  const validAmount = amountNum > 0
  const confirmCollect = async () => {
    if (!collectFor || !validAmount) return
    await collectCash({
      driverId: collectFor.driverId,
      amount: amountNum,
      note,
      collectedBy: user?.name ?? 'Admin',
    }).unwrap()
    closeCollect()
  }

  const exportCsv = () => {
    downloadCSV(
      `chutkima-rider-finance-${from}_to_${to}.csv`,
      rows.map((r) => ({
        rider: r.name,
        deliveries: r.deliveriesToday.toString(),
        km: r.kmToday.toString(),
        fuel: formatNPR(r.fuel, false),
        codInHand: formatNPR(r.codCollected, false),
        pendingCod: formatNPR(r.discrepancy, false),
        netToDeposit: formatNPR(net(r), false),
        deposited: formatNPR(r.deposited, false),
        outstanding: formatNPR(outstanding(r), false),
      })),
      [
        { key: 'rider', label: 'Rider' },
        { key: 'deliveries', label: 'Deliveries' },
        { key: 'km', label: 'KM' },
        { key: 'fuel', label: 'Fuel due (NPR)' },
        { key: 'codInHand', label: 'COD in hand (NPR)' },
        { key: 'pendingCod', label: 'Pending COD (NPR)' },
        { key: 'netToDeposit', label: 'Net to deposit (NPR)' },
        { key: 'deposited', label: 'Deposited (NPR)' },
        { key: 'outstanding', label: 'Outstanding (NPR)' },
      ],
    )
  }

  const columns: Column<RiderFinance>[] = [
    {
      key: 'rider',
      header: 'Rider',
      cell: (r) => (
        <div className="flex items-center gap-3">
          <Avatar name={r.name} />
          <div>
            <p className="font-semibold text-slate-800">{r.name}</p>
            <p className="text-xs text-slate-400">{r.deliveriesToday} deliveries</p>
          </div>
        </div>
      ),
    },
    { key: 'km', header: 'KM', cell: (r) => <span className="text-slate-700">{r.kmToday} km</span> },
    {
      key: 'fuel',
      header: `Fuel due (×${fuelRate})`,
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
    { key: 'net', header: 'Net to deposit', cell: (r) => <span className="font-semibold text-slate-700">{formatNPR(net(r))}</span> },
    {
      key: 'deposited',
      header: 'Deposited',
      cell: (r) =>
        r.deposited > 0 ? (
          <span className="font-semibold text-success">{formatNPR(r.deposited)}</span>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        ),
    },
    {
      key: 'action',
      header: 'Cash collection',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (r) => {
        const due = outstanding(r)
        if (due > 0) {
          return (
            <Button size="sm" variant="secondary" leftIcon={<HandCoins className="h-3.5 w-3.5" />} onClick={() => openCollect(r)}>
              Collect {formatNPR(due)}
            </Button>
          )
        }
        return net(r) > 0 ? (
          <Badge tone="bg-green-50 text-green-700 ring-green-600/15" dot="bg-success">
            Settled
          </Badge>
        ) : (
          <span className="text-xs text-slate-400">—</span>
        )
      },
    },
  ]

  return (
    <>
      <PageHeader
        title="Rider Finance"
        description="Fuel allowance and cash-on-delivery reconciliation per rider."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden text-xs font-medium text-slate-500 sm:block">From</span>
            <input
              type="date"
              value={from}
              max={to || today}
              onChange={(e) => {
                const v = e.target.value || today
                setFrom(v)
                if (v > to) setTo(v)
              }}
              aria-label="From date"
              className="focus-ring h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
            />
            <span className="text-slate-400">–</span>
            <input
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={(e) => setTo(e.target.value || today)}
              aria-label="To date"
              className="focus-ring h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700"
            />
            <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={rows.length === 0}>
              Export CSV
            </Button>
          </div>
        }
      />
      {isRange && (
        <p className="mb-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
          {from === to ? `Showing the snapshot for ${from}.` : `Accumulated totals from ${from} to ${to}.`}
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Fuel due to riders" value={formatNPR(totalFuel)} icon={<Fuel className="h-5 w-5" />} iconClass="bg-amber-50 text-amber-600" />
        <StatCard label="COD in riders' hands" value={formatNPR(totalInHand)} icon={<HandCoins className="h-5 w-5" />} iconClass="bg-brand-50 text-brand-600" />
        <StatCard label="Cash deposited" value={formatNPR(totalDeposited)} icon={<Wallet className="h-5 w-5" />} iconClass="bg-green-50 text-green-600" />
        <StatCard label="Outstanding to collect" value={formatNPR(totalOutstanding)} icon={<Banknote className="h-5 w-5" />} iconClass={cn(totalOutstanding > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500')} />
      </div>

      <Card className="mt-4">
        <DataTable columns={columns} data={rows} rowKey={(r) => r.driverId} loading={isLoading} emptyTitle="No rider data" />
      </Card>

      <p className="mt-3 px-1 text-xs text-slate-400">
        Net to deposit = COD cash in hand − fuel allowance. Riders keep their fuel and deposit the rest; use “Collect” to record each cash handover.
      </p>

      <Modal
        open={!!collectFor}
        onClose={closeCollect}
        title="Collect cash from rider"
        description={collectFor ? collectFor.name : undefined}
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={closeCollect}>
              Cancel
            </Button>
            <Button loading={collecting} disabled={!validAmount} onClick={confirmCollect} leftIcon={<HandCoins className="h-4 w-4" />}>
              Record deposit
            </Button>
          </>
        }
      >
        {collectFor && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-center text-sm">
              <div className="rounded-xl border border-slate-100 px-2 py-2">
                <p className="text-xs text-slate-400">Net to deposit</p>
                <p className="font-bold text-slate-800">{formatNPR(net(collectFor), false)}</p>
              </div>
              <div className="rounded-xl border border-slate-100 px-2 py-2">
                <p className="text-xs text-slate-400">Deposited</p>
                <p className="font-bold text-success">{formatNPR(collectFor.deposited, false)}</p>
              </div>
              <div className="rounded-xl border border-slate-100 px-2 py-2">
                <p className="text-xs text-slate-400">Outstanding</p>
                <p className="font-bold text-amber-600">{formatNPR(outstanding(collectFor), false)}</p>
              </div>
            </div>
            <Input
              label="Amount received (NPR)"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
            />
            <Textarea
              label="Note (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder="e.g. Evening shift COD handover"
            />
            <p className="text-xs text-slate-400">Recorded as a cash deposit in Transactions, received by {user?.name ?? 'Admin'}.</p>
          </div>
        )}
      </Modal>
    </>
  )
}
