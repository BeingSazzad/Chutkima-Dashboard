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
import { DateRangeFilter } from '@/components/shared/DateRangeFilter'
import { Avatar } from '@/components/shared/Avatar'
import { EntityLink } from '@/components/shared/EntityLink'
import { FUEL_RATE_PER_KM } from '@/lib/constants'
import { cn, formatDateTime, formatNPR } from '@/lib/utils'
import { downloadCSV } from '@/lib/export'
import { useAuth } from '@/hooks/useAuth'
import {
  useCollectRiderCashMutation,
  useConfirmRiderDepositMutation,
  useGetRiderDepositsQuery,
  useGetRiderFinanceQuery,
  type RiderFinance,
} from '@/services/endpoints/driversApi'
import { useGetOpsConfigQuery, useGetSystemControlsQuery } from '@/services/endpoints/settingsApi'

/**
 * The rider must deposit the FULL COD cash they collected — fuel is NOT deducted
 * here; it's reimbursed separately. outstanding = COD collected − already deposited.
 */
const outstanding = (r: RiderFinance) => Math.max(0, r.codCollected - r.deposited)

export default function RiderFinancePage() {
  const { data: controls } = useGetSystemControlsQuery()
  const riderEarningsEnabled = controls?.riderEarningsEnabled ?? true

  if (!riderEarningsEnabled) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 max-w-md shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <Fuel className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">Rider Finance System Disabled</h2>
          <p className="mt-2 text-sm text-slate-500">
            Rider earnings and fuel tracking are currently disabled by the administrator in settings.
          </p>
        </div>
      </div>
    )
  }

  const today = new Date().toISOString().slice(0, 10)
  const { user } = useAuth()
  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const { data: rows = [], isLoading } = useGetRiderFinanceQuery({ from, to })
  const { data: deposits = [] } = useGetRiderDepositsQuery({ from, to })
  const { data: ops } = useGetOpsConfigQuery()
  const [collectCash, { isLoading: collecting }] = useCollectRiderCashMutation()
  const [confirmDeposit] = useConfirmRiderDepositMutation()
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
      amountDue: outstanding(collectFor),
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
        fuelReimburse: formatNPR(r.fuel, false),
        codCollected: formatNPR(r.codCollected, false),
        pendingCod: formatNPR(r.discrepancy, false),
        deposited: formatNPR(r.deposited, false),
        outstanding: formatNPR(outstanding(r), false),
      })),
      [
        { key: 'rider', label: 'Rider' },
        { key: 'deliveries', label: 'Deliveries' },
        { key: 'km', label: 'KM' },
        { key: 'fuelReimburse', label: 'Fuel reimbursement (NPR)' },
        { key: 'codCollected', label: 'COD collected (NPR)' },
        { key: 'pendingCod', label: 'Pending COD (NPR)' },
        { key: 'deposited', label: 'Deposited (NPR)' },
        { key: 'outstanding', label: 'Outstanding to deposit (NPR)' },
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
            <EntityLink kind="driver" id={r.driverId} className="font-semibold text-slate-800">{r.name}</EntityLink>
            <p className="text-xs text-slate-400">{r.deliveriesToday} deliveries</p>
          </div>
        </div>
      ),
    },
    { key: 'km', header: 'KM', cell: (r) => <span className="text-slate-700">{r.kmToday} km</span> },
    {
      key: 'fuel',
      header: `Fuel reimburse (×${fuelRate})`,
      cell: (r) => <span className="font-semibold text-amber-600">{formatNPR(r.fuel)}</span>,
    },
    { key: 'hand', header: 'COD collected', cell: (r) => <span className="font-semibold text-slate-800">{formatNPR(r.codCollected)}</span> },
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
        return r.codCollected > 0 ? (
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
        description="COD reconciliation per rider · fuel reimbursed separately (not deducted)."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <DateRangeFilter
              from={from}
              to={to}
              max={today}
              clearable={false}
              onChange={(r) => {
                setFrom(r.from || today)
                setTo(r.to || today)
              }}
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
        <StatCard label="Fuel to reimburse (separate)" value={formatNPR(totalFuel)} icon={<Fuel className="h-5 w-5" />} iconClass="bg-amber-50 text-amber-600" />
        <StatCard label="COD collected" value={formatNPR(totalInHand)} icon={<HandCoins className="h-5 w-5" />} iconClass="bg-brand-50 text-brand-600" />
        <StatCard label="Cash deposited" value={formatNPR(totalDeposited)} icon={<Wallet className="h-5 w-5" />} iconClass="bg-green-50 text-green-600" />
        <StatCard label="Outstanding to collect" value={formatNPR(totalOutstanding)} icon={<Banknote className="h-5 w-5" />} iconClass={cn(totalOutstanding > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500')} />
      </div>

      <Card className="mt-4">
        <DataTable columns={columns} data={rows} rowKey={(r) => r.driverId} loading={isLoading} emptyTitle="No rider data" />
      </Card>

      {/* Cash deposit audit trail — rider → store handovers with two-party confirmation. */}
      <Card className="mt-4">
        <div className="border-b border-slate-100 px-4 py-3">
          <p className="font-semibold text-slate-800">Cash deposits</p>
          <p className="text-xs text-slate-400">Rider → store handovers · amount due, collected, by whom & when · rider sign-off</p>
        </div>
        {deposits.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-slate-400">No deposits recorded in this range.</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {deposits.map((d) => (
              <div key={d.id} className="flex flex-wrap items-start gap-3 px-4 py-3">
                <Avatar name={d.driverName} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-slate-800">{d.driverName}</p>
                    {d.confirmedByRider ? (
                      <Badge tone="bg-green-50 text-green-700 ring-green-600/15" dot="bg-success">Settled</Badge>
                    ) : (
                      <Badge tone="bg-amber-50 text-amber-700 ring-amber-600/15">Awaiting rider</Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    Due {formatNPR(d.amountDue)} · Collected {formatNPR(d.amount)} · Remaining {formatNPR(Math.max(0, d.amountDue - d.amount))}
                  </p>
                  <p className="text-xs text-slate-400">
                    By {d.collectedBy} · {formatDateTime(d.createdAt)}
                    {d.confirmedByRider && d.confirmedAt ? ` · rider confirmed ${formatDateTime(d.confirmedAt)}` : ''}
                    {d.note ? ` · ${d.note}` : ''}
                  </p>
                </div>
                {!d.confirmedByRider && (
                  <Button size="sm" variant="outline" onClick={() => confirmDeposit(d.id)}>
                    Mark rider-confirmed
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <p className="mt-3 px-1 text-xs text-slate-400">
        Riders deposit the <strong>full COD</strong> they collected — fuel is <strong>not</strong> deducted; it's reimbursed separately. Use “Collect” to record each handover, then the rider confirms it.
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
                <p className="text-xs text-slate-400">COD collected</p>
                <p className="font-bold text-slate-800">{formatNPR(collectFor.codCollected, false)}</p>
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
