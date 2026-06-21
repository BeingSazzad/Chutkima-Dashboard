import { api, clone, mockDelay } from '@/services/api'
import { driverReports, driverReviews } from '@/services/mock/data'
import type { DriverReport, DriverReview, ReportStatus } from '@/types/common.types'

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

    updateReportStatus: build.mutation<DriverReport, { id: string; status: ReportStatus }>({
      async queryFn({ id, status }) {
        await mockDelay(250)
        const report = driverReports.find((r) => r.id === id)
        if (!report) return { error: { status: 404, data: 'Not found' } as never }
        report.status = status
        return { data: clone(report) }
      },
      invalidatesTags: ['Report'],
    }),
  }),
})

export const { useGetReviewsQuery, useGetReportsQuery, useUpdateReportStatusMutation } = reviewsApi
