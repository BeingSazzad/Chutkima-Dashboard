import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike, Check, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Avatar } from '@/components/shared/Avatar'
import { Stars } from '@/components/shared/Stars'
import { REPORT_REASON_META, REPORT_STATUS_META } from '@/lib/constants'
import { timeAgo } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { useGetDriversQuery } from '@/services/endpoints/driversApi'
import {
  useGetReportsQuery,
  useGetReviewsQuery,
  useUpdateReportStatusMutation,
} from '@/services/endpoints/reviewsApi'
import type { Driver, DriverReport, DriverReview } from '@/types/common.types'

export default function ReportsPage() {
  const { data: reports = [] } = useGetReportsQuery()
  const { data: reviews = [] } = useGetReviewsQuery()
  const openCount = reports.filter((r) => r.status === 'open').length
  const [tab, setTab] = useState('reports')

  return (
    <>
      <PageHeader title="Reports & Reviews" description="Customer complaints and ratings about your riders." />
      <Card>
        <div className="px-3 pt-2">
          <Tabs
            items={[
              { label: 'Reports', value: 'reports', count: openCount },
              { label: 'Reviews', value: 'reviews', count: reviews.length },
            ]}
            value={tab}
            onChange={setTab}
          />
        </div>
        {tab === 'reports' ? <ReportsTable /> : <ReviewsTable />}
      </Card>
    </>
  )
}

/** Shared "Rider" cell — name is the first, most prominent column. */
function RiderCell({ driver, onOpen }: { driver?: Driver; onOpen: () => void }) {
  if (!driver) return <span className="text-slate-400">Unknown rider</span>
  return (
    <button onClick={onOpen} className="flex items-center gap-2.5 text-left hover:underline">
      <Avatar name={driver.name} src={driver.avatar} size="sm" />
      <div>
        <p className="font-semibold text-slate-800">{driver.name}</p>
        <p className="flex items-center gap-1 text-xs text-slate-400">
          <Bike className="h-3 w-3" /> {driver.zone}
        </p>
      </div>
    </button>
  )
}

function ReportsTable() {
  const navigate = useNavigate()
  const { data: reports = [], isLoading } = useGetReportsQuery()
  const { data: drivers = [] } = useGetDriversQuery()
  const [update, { isLoading: updating }] = useUpdateReportStatusMutation()
  const driver = (id: string) => drivers.find((d) => d.id === id)

  const columns: Column<DriverReport>[] = [
    {
      key: 'rider',
      header: 'Rider reported',
      cell: (r) => <RiderCell driver={driver(r.driverId)} onOpen={() => navigate(ROUTES.driverDetail(r.driverId))} />,
    },
    { key: 'reason', header: 'Reason', cell: (r) => <Badge tone="bg-red-50 text-red-700 ring-red-600/15">{REPORT_REASON_META[r.reason]}</Badge> },
    {
      key: 'details',
      header: 'What happened',
      className: 'max-w-xs whitespace-normal text-slate-600',
      cell: (r) => r.details,
    },
    {
      key: 'by',
      header: 'Reported by',
      cell: (r) => (
        <div>
          <p className="font-medium text-slate-700">{r.customerName}</p>
          <p className="text-xs text-slate-400">{r.orderId}</p>
        </div>
      ),
    },
    { key: 'status', header: 'Status', cell: (r) => <Badge tone={REPORT_STATUS_META[r.status].badge}>{REPORT_STATUS_META[r.status].label}</Badge> },
    { key: 'date', header: 'When', cell: (r) => <span className="text-slate-500">{timeAgo(r.createdAt)}</span> },
    {
      key: 'actions',
      header: 'Actions',
      headerClassName: 'text-right',
      className: 'text-right',
      cell: (r) =>
        r.status === 'open' ? (
          <div className="flex items-center justify-end gap-1">
            <Button size="sm" variant="secondary" loading={updating} leftIcon={<Check className="h-3.5 w-3.5" />} onClick={() => update({ id: r.id, status: 'reviewed' })}>
              Reviewed
            </Button>
            <Button size="sm" variant="ghost" leftIcon={<X className="h-3.5 w-3.5" />} onClick={() => update({ id: r.id, status: 'dismissed' })}>
              Dismiss
            </Button>
          </div>
        ) : (
          <span className="text-xs text-slate-400">Closed</span>
        ),
    },
  ]

  return (
    <DataTable
      columns={columns}
      data={reports}
      rowKey={(r) => r.id}
      loading={isLoading}
      emptyTitle="No reports"
      emptyDescription="No rider complaints filed by customers."
    />
  )
}

function ReviewsTable() {
  const navigate = useNavigate()
  const { data: reviews = [], isLoading } = useGetReviewsQuery()
  const { data: drivers = [] } = useGetDriversQuery()
  const driver = (id: string) => drivers.find((d) => d.id === id)

  const columns: Column<DriverReview>[] = [
    {
      key: 'rider',
      header: 'Rider',
      cell: (rv) => <RiderCell driver={driver(rv.driverId)} onOpen={() => navigate(ROUTES.driverDetail(rv.driverId))} />,
    },
    {
      key: 'rating',
      header: 'Rating',
      cell: (rv) => (
        <span className="flex items-center gap-1.5">
          <Stars value={rv.rating} />
          <span className="text-sm font-semibold text-slate-700">{rv.rating}.0</span>
        </span>
      ),
    },
    { key: 'comment', header: 'Review', className: 'max-w-sm whitespace-normal text-slate-600', cell: (rv) => `“${rv.comment}”` },
    {
      key: 'by',
      header: 'By',
      cell: (rv) => (
        <div>
          <p className="font-medium text-slate-700">{rv.customerName}</p>
          <p className="text-xs text-slate-400">{rv.orderId}</p>
        </div>
      ),
    },
    { key: 'date', header: 'When', cell: (rv) => <span className="text-slate-500">{timeAgo(rv.createdAt)}</span> },
  ]

  return (
    <DataTable
      columns={columns}
      data={reviews}
      rowKey={(rv) => rv.id}
      loading={isLoading}
      emptyTitle="No reviews yet"
      emptyDescription="Customer ratings will appear here."
    />
  )
}
