import { api, clone, mockDelay } from '@/services/api'
import { opsConfig } from '@/services/mock/data'

export interface OpsConfig {
  multiRiderEnabled: boolean
  maxRiders: number
}

export const settingsApi = api.injectEndpoints({
  endpoints: (build) => ({
    getOpsConfig: build.query<OpsConfig, void>({
      async queryFn() {
        await mockDelay(150)
        return { data: clone(opsConfig) }
      },
      providesTags: ['OpsConfig'],
    }),

    saveOpsConfig: build.mutation<OpsConfig, OpsConfig>({
      async queryFn(payload) {
        await mockDelay(250)
        opsConfig.multiRiderEnabled = payload.multiRiderEnabled
        opsConfig.maxRiders = payload.maxRiders
        return { data: clone(opsConfig) }
      },
      invalidatesTags: ['OpsConfig'],
    }),
  }),
})

export const { useGetOpsConfigQuery, useSaveOpsConfigMutation } = settingsApi
