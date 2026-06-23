import { api, clone, mockDelay } from '@/services/api'
import { opsConfig, storeSetup, trustConfig } from '@/services/mock/data'
import type { TrustConfig } from '@/lib/trust'

export interface OpsConfig {
  multiRiderEnabled: boolean
  maxRiders: number
  fuelRatePerKm: number
}

/** Company details that print on every invoice (Store Setup). */
export interface StoreSetup {
  companyName: string
  address: string
  phone: string
  email: string
  taxNumber: string
  vatPercent: number
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
        opsConfig.fuelRatePerKm = payload.fuelRatePerKm
        return { data: clone(opsConfig) }
      },
      invalidatesTags: ['OpsConfig'],
    }),

    getTrustConfig: build.query<TrustConfig, void>({
      async queryFn() {
        await mockDelay(150)
        return { data: clone(trustConfig) }
      },
      providesTags: ['TrustConfig'],
    }),

    saveTrustConfig: build.mutation<TrustConfig, TrustConfig>({
      async queryFn(payload) {
        await mockDelay(250)
        Object.assign(trustConfig, payload)
        return { data: clone(trustConfig) }
      },
      invalidatesTags: ['TrustConfig'],
    }),

    getStoreSetup: build.query<StoreSetup, void>({
      async queryFn() {
        await mockDelay(150)
        return { data: clone(storeSetup) }
      },
      providesTags: ['StoreSetup'],
    }),

    saveStoreSetup: build.mutation<StoreSetup, StoreSetup>({
      async queryFn(payload) {
        await mockDelay(250)
        Object.assign(storeSetup, payload)
        return { data: clone(storeSetup) }
      },
      invalidatesTags: ['StoreSetup'],
    }),
  }),
})

export const {
  useGetOpsConfigQuery,
  useSaveOpsConfigMutation,
  useGetTrustConfigQuery,
  useSaveTrustConfigMutation,
  useGetStoreSetupQuery,
  useSaveStoreSetupMutation,
} = settingsApi
