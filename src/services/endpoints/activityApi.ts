import { api, clone, mockDelay } from '@/services/api'
import { activityFeed } from '@/services/mock/data'
import type { ActivityEvent } from '@/types/common.types'

export const activityApi = api.injectEndpoints({
  endpoints: (build) => ({
    getActivity: build.query<ActivityEvent[], void>({
      async queryFn() {
        await mockDelay()
        // Newest first.
        const sorted = [...activityFeed].sort((a, b) => +new Date(b.at) - +new Date(a.at))
        return { data: clone(sorted) }
      },
      providesTags: ['Activity'],
    }),
  }),
})

export const { useGetActivityQuery } = activityApi
