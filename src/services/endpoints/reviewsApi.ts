import { api, clone, mockDelay } from '@/services/api'
import { driverReports, driverReviews } from '@/services/mock/data'
import type { DriverReport, DriverReview, ReportStatus } from '@/types/common.types'

const STATUS_ACTION: Record<ReportStatus, string> = {
  open: 'Reopened',
  reviewed: 'Marked reviewed',
  dismissed: 'Marked dismissed',
}

const actionId = () => `ra${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)}`

export const reviewsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getReviews: build.query<DriverReview[], { driverId?: string } | void>({
      async queryFn(filters) {
        await mockDelay()
        let result = [...driverReviews].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        if (filters?.driverId) result = result.filter((r) => r.driverId === filters.driverId)
        return { data: clone(result) }
      },
      providesTags: ['Review'],
    }),

    getReports: build.query<DriverReport[], { driverId?: string; status?: ReportStatus } | void>({
      async queryFn(filters) {
        await mockDelay()
        let result = [...driverReports].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        if (filters?.driverId) result = result.filter((r) => r.driverId === filters.driverId)
        if (filters?.status) result = result.filter((r) => r.status === filters.status)
        return { data: clone(result) }
      },
      providesTags: ['Report'],
    }),

    updateReportStatus: build.mutation<DriverReport, { id: string; status: ReportStatus; adminName?: string }>({
      async queryFn({ id, status, adminName }) {
        await mockDelay(250)
        const report = driverReports.find((r) => r.id === id)
        if (!report) return { error: { status: 404, data: 'Not found' } as never }
        report.status = status
        // Append (never overwrite) an audit-trail entry for this action.
        report.actions.push({
          id: actionId(),
          action: STATUS_ACTION[status],
          adminName: adminName || 'Admin',
          at: new Date().toISOString(),
        })
        return { data: clone(report) }
      },
      invalidatesTags: ['Report'],
    }),

    /** Append a free-text note to a complaint's audit trail. */
    addReportNote: build.mutation<DriverReport, { id: string; note: string; adminName?: string }>({
      async queryFn({ id, note, adminName }) {
        await mockDelay(250)
        const report = driverReports.find((r) => r.id === id)
        if (!report) return { error: { status: 404, data: 'Not found' } as never }
        report.actions.push({
          id: actionId(),
          action: 'Note added',
          adminName: adminName || 'Admin',
          note,
          at: new Date().toISOString(),
        })
        return { data: clone(report) }
      },
      invalidatesTags: ['Report'],
    }),
  }),
})

export const {
  useGetReviewsQuery,
  useGetReportsQuery,
  useUpdateReportStatusMutation,
  useAddReportNoteMutation,
} = reviewsApi
