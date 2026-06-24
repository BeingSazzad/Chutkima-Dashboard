import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bike, Check, History, X } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { DataTable, type Column } from '@/components/ui/Table'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs } from '@/components/ui/Tabs'
import { Modal } from '@/components/ui/Modal'
import { Textarea } from '@/components/ui/Textarea'
import { Avatar } from '@/components/shared/Avatar'
import { Stars } from '@/components/shared/Stars'
import { REPORT_REASON_META, REPORT_STATUS_META } from '@/lib/constants'
import { formatDateTime, timeAgo } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import { useAuth } from '@/hooks/useAuth'
import { useGetDriversQuery } from '@/services/endpoints/driversApi'
import {
  useAddReportNoteMutation,
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
  const { user } = useAuth()
  const { data: reports = [], isLoading } = useGetReportsQuery()
  const { data: drivers = [] } = useGetDriversQuery()
  const [update, { isLoading: updating }] = useUpdateReportStatusMutation()
  const [auditFor, setAuditFor] = useState<DriverReport | null>(null)
  const driver = (id: string) => drivers.find((d) => d.id === id)
  const adminName = user?.name ?? 'Admin'
  // Keep the open audit modal in sync with refetched data.
  const auditReport = auditFor ? reports.find((r) => r.id === auditFor.id) ?? auditFor : null

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
      cell: (r) => (
        <div className="flex items-center justify-end gap-1">
          {r.status === 'open' ? (
            <>
              <Button size="sm" variant="secondary" loading={updating} leftIcon={<Check className="h-3.5 w-3.5" />} onClick={() => update({ id: r.id, status: 'reviewed', adminName })}>
                Reviewed
              </Button>
              <Button size="sm" variant="ghost" leftIcon={<X className="h-3.5 w-3.5" />} onClick={() => update({ id: r.id, status: 'dismissed', adminName })}>
                Dismiss
              </Button>
            </>
          ) : (
            <Badge tone={REPORT_STATUS_META[r.status].badge}>{REPORT_STATUS_META[r.status].label}</Badge>
          )}
          <Button size="sm" variant="ghost" leftIcon={<History className="h-3.5 w-3.5" />} onClick={() => setAuditFor(r)}>
            Audit
          </Button>
        </div>
      ),
    },
  ]

  return (
    <>
      <DataTable
        columns={columns}
        data={reports}
        rowKey={(r) => r.id}
        loading={isLoading}
        emptyTitle="No reports"
        emptyDescription="No rider complaints filed by customers."
      />
      <ComplaintAuditModal report={auditReport} adminName={adminName} onClose={() => setAuditFor(null)} />
    </>
  )
}

/** Complaint detail with the full, append-only action history (feature: audit trail). */
function ComplaintAuditModal({ report, adminName, onClose }: { report: DriverReport | null; adminName: string; onClose: () => void }) {
  const [addNote, { isLoading }] = useAddReportNoteMutation()
  const [update, { isLoading: updating }] = useUpdateReportStatusMutation()
  const [note, setNote] = useState('')

  const submitNote = async () => {
    if (!report || !note.trim()) return
    await addNote({ id: report.id, note: note.trim(), adminName }).unwrap()
    setNote('')
  }

  // Latest action first.
  const history = report ? [...report.actions].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)) : []

  return (
    <Modal
      open={!!report}
      onClose={onClose}
      title="Complaint audit trail"
      description={report ? `${report.orderId} · ${REPORT_REASON_META[report.reason]}` : undefined}
      size="lg"
      footer={<Button variant="outline" onClick={onClose}>Close</Button>}
    >
      {report && (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <p className="font-semibold text-slate-800">Reported by {report.customerName}</p>
            <p className="mt-0.5 text-slate-600">{report.details}</p>
            <div className="mt-2"><Badge tone={REPORT_STATUS_META[report.status].badge}>{REPORT_STATUS_META[report.status].label}</Badge></div>
          </div>

          {report.status === 'open' && (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" loading={updating} leftIcon={<Check className="h-3.5 w-3.5" />} onClick={() => update({ id: report.id, status: 'reviewed', adminName })}>
                Mark reviewed
              </Button>
              <Button size="sm" variant="ghost" leftIcon={<X className="h-3.5 w-3.5" />} onClick={() => update({ id: report.id, status: 'dismissed', adminName })}>
                Dismiss
              </Button>
            </div>
          )}

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">History</p>
            <ol className="space-y-3">
              {history.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{a.action}</p>
                    {a.note && <p className="text-sm text-slate-600">{a.note}</p>}
                    <p className="text-xs text-slate-400">{a.adminName} · {formatDateTime(a.at)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="border-t border-slate-100 pt-3">
            <Textarea label="Add a note to the trail" value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="e.g. Called the rider — issued a warning." />
            <div className="mt-2 flex justify-end">
              <Button size="sm" onClick={submitNote} loading={isLoading} disabled={!note.trim()}>Add note</Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
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
