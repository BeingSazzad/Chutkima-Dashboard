import { useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, Banknote, Download, RotateCcw, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { StatCard } from '@/components/shared/StatCard'
import { TXN_STATUS_META, TXN_TYPE_META } from '@/lib/constants'
import { cn, formatDateTime, formatNPR } from '@/lib/utils'
import { downloadCSV } from '@/lib/export'
import { useDebounce } from '@/hooks/useDebounce'
import { useGetTransactionsQuery } from '@/services/endpoints/transactionsApi'
import type { Transaction, TransactionStatus, TransactionType } from '@/types/common.types'

export default function TransactionsPage() {
  const [type, setType] = useState<TransactionType | 'all'>('all')
  const [method, setMethod] = useState<string>('all')
  const [status, setStatus] = useState<TransactionStatus | 'all'>('all')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [search, setSearch] = useState('')
  const debounced = useDebounce(search, 300)

  const { data: raw = [], isLoading } = useGetTransactionsQuery({ type, search: debounced || undefined })
  const { data: all = [] } = useGetTransactionsQuery()

  const methods = Array.from(new Set(all.map((t) => t.method)))
  const txns = raw.filter((t) => {
    const day = t.createdAt.slice(0, 10)
    return (
      (method === 'all' || t.method === method) &&
      (status === 'all' || t.status === status) &&
      (!from || day >= from) &&
      (!to || day <= to)
    )
  })

  const moneyIn = all
    .filter((t) => t.status === 'success' && TXN_TYPE_META[t.type].sign === 1)
    .reduce((s, t) => s + t.amount, 0)
  const refunds = all.filter((t) => t.type === 'refund' && t.status === 'success').reduce((s, t) => s + t.amount, 0)
  const payouts = all.filter((t) => t.type === 'payout' && t.status === 'success').reduce((s, t) => s + t.amount, 0)

  const exportCsv = () => {
    downloadCSV(
      'chutkima-transactions.csv',
      txns.map((t) => ({
        reference: t.reference,
        type: TXN_TYPE_META[t.type].label,
        party: t.party,
        method: t.method,
        amount: (TXN_TYPE_META[t.type].sign === -1 ? -t.amount : t.amount).toString(),
        status: TXN_STATUS_META[t.status].label,
        date: formatDateTime(t.createdAt),
      })),
      [
        { key: 'reference', label: 'Reference' },
        { key: 'type', label: 'Type' },
        { key: 'party', label: 'Party' },
        { key: 'method', label: 'Method' },
        { key: 'amount', label: 'Amount (NPR)' },
        { key: 'status', label: 'Status' },
        { key: 'date', label: 'Date' },
      ],
    )
  }

  const columns: Column<Transaction>[] = [
    {
      key: 'ref',
      header: 'Reference',
      cell: (t) => (
        <div>
          <p className="font-semibold text-slate-800">{t.reference}</p>
          <p className="text-xs text-slate-400">{formatDateTime(t.createdAt)}</p>
        </div>
      ),
    },
    { key: 'type', header: 'Type', cell: (t) => <Badge tone={TXN_TYPE_META[t.type].badge}>{TXN_TYPE_META[t.type].label}</Badge> },
    { key: 'party', header: 'Party', cell: (t) => <span className="text-slate-700">{t.party}</span> },
    { key: 'method', header: 'Method', cell: (t) => <span className="text-slate-500">{t.method}</span> },
    {
      key: 'amount',
      header: 'Amount',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (t) => {
        const out = TXN_TYPE_META[t.type].sign === -1
        return (
          <span className={cn('font-bold', out ? 'text-danger' : 'text-success')}>
            {out ? '−' : '+'}
            {formatNPR(t.amount, false)}
          </span>
        )
      },
    },
    { key: 'status', header: 'Status', cell: (t) => <Badge tone={TXN_STATUS_META[t.status].badge}>{TXN_STATUS_META[t.status].label}</Badge> },
  ]

  return (
    <>
      <PageHeader
        title="Transactions"
        description="Every payment, COD collection, refund and rider payout."
        actions={
          <Button variant="outline" leftIcon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={txns.length === 0}>
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Money in" value={formatNPR(moneyIn)} icon={<ArrowDownLeft className="h-5 w-5" />} iconClass="bg-green-50 text-green-600" />
        <StatCard label="Refunds" value={formatNPR(refunds)} icon={<RotateCcw className="h-5 w-5" />} iconClass="bg-amber-50 text-amber-600" />
        <StatCard label="Rider payouts" value={formatNPR(payouts)} icon={<ArrowUpRight className="h-5 w-5" />} iconClass="bg-violet-50 text-violet-600" />
      </div>

      <Card className="mt-4">
        <div className="flex flex-col gap-3 p-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, party or method…"
              className="focus-ring h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Select
              value={type}
              onChange={(e) => setType(e.target.value as TransactionType | 'all')}
              options={[
                { label: 'All types', value: 'all' },
                ...(Object.keys(TXN_TYPE_META) as TransactionType[]).map((t) => ({ label: TXN_TYPE_META[t].label, value: t })),
              ]}
            />
            <Select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              options={[{ label: 'All methods', value: 'all' }, ...methods.map((m) => ({ label: m, value: m }))]}
            />
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as TransactionStatus | 'all')}
              options={[
                { label: 'All statuses', value: 'all' },
                ...(Object.keys(TXN_STATUS_META) as TransactionStatus[]).map((s) => ({ label: TXN_STATUS_META[s].label, value: s })),
              ]}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500">Date range</span>
            <input
              type="date"
              value={from}
              max={to || undefined}
              onChange={(e) => {
                const v = e.target.value
                setFrom(v)
                if (v && to && v > to) setTo(v)
              }}
              aria-label="From date"
              className="focus-ring h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
            />
            <span className="text-slate-400">–</span>
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              aria-label="To date"
              className="focus-ring h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700"
            />
            {(from || to) && (
              <button
                onClick={() => {
                  setFrom('')
                  setTo('')
                }}
                className="focus-ring rounded-lg px-2 py-1 text-xs font-semibold text-brand-600 hover:bg-brand-50"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        <DataTable columns={columns} data={txns} rowKey={(t) => t.id} loading={isLoading} emptyTitle="No transactions found" />
      </Card>

      <p className="mt-3 flex items-center gap-1.5 px-1 text-xs text-slate-400">
        <Banknote className="h-3.5 w-3.5" /> COD collections are marked pending until the rider deposits the cash.
      </p>
    </>
  )
}
