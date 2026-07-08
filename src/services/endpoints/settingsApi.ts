import { api, clone, mockDelay } from '@/services/api'
import {
  operatingConfig,
  opsConfig,
  referralConfig,
  storeSetup,
  systemControls,
  trustConfig,
} from '@/services/mock/data'
import type { TrustConfig } from '@/lib/trust'
import type { InvoiceSize } from '@/types/common.types'

/** Operating hours + scheduled delivery (section 2.1 / feature 113). */
export interface OperatingConfig {
  openTime: string
  lastOrderCutoff: string
  closeTime: string
  firstSlotNextDay: string
  slotIntervalMin: number
  scheduledDeliveryEnabled: boolean
  afterHoursMessage: string
}

/** Master system switches (section 3.10). */
export interface SystemControls {
  serviceOffline: boolean
  offlineMessage: string
  trainingMode: boolean
  forceUpdate: boolean
  minAppVersion: string
  whatsappAdminAlert: boolean
  adminWhatsappNumber: string
  riderEarningsEnabled: boolean
}

/** Referral programme config (feature 35). */
export interface ReferralConfig {
  enabled: boolean
  refereeDiscountPct: number
  refereeMaxDiscount: number
  refereeMinCart: number
  referrerCreditPct: number
  referrerMaxCredit: number
}

export interface OpsConfig {
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
  /** Default paper size for printed invoices. */
  invoiceSize: InvoiceSize
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

    getReferralConfig: build.query<ReferralConfig, void>({
      async queryFn() {
        await mockDelay(150)
        return { data: clone(referralConfig) }
      },
      providesTags: ['ReferralConfig'],
    }),

    saveReferralConfig: build.mutation<ReferralConfig, ReferralConfig>({
      async queryFn(payload) {
        await mockDelay(250)
        Object.assign(referralConfig, payload)
        return { data: clone(referralConfig) }
      },
      invalidatesTags: ['ReferralConfig'],
    }),

    getSystemControls: build.query<SystemControls, void>({
      async queryFn() {
        await mockDelay(150)
        return { data: clone(systemControls) }
      },
      providesTags: ['SystemControls'],
    }),

    saveSystemControls: build.mutation<SystemControls, SystemControls>({
      async queryFn(payload) {
        await mockDelay(250)
        Object.assign(systemControls, payload)
        try {
          localStorage.setItem('chutkima_rider_earnings_enabled', JSON.stringify(payload.riderEarningsEnabled))
        } catch (e) {
          console.error('LocalStorage write failed:', e)
        }
        return { data: clone(systemControls) }
      },
      invalidatesTags: ['SystemControls'],
    }),

    getOperatingConfig: build.query<OperatingConfig, void>({
      async queryFn() {
        await mockDelay(150)
        return { data: clone(operatingConfig) }
      },
      providesTags: ['OperatingConfig'],
    }),

    saveOperatingConfig: build.mutation<OperatingConfig, OperatingConfig>({
      async queryFn(payload) {
        await mockDelay(250)
        Object.assign(operatingConfig, payload)
        return { data: clone(operatingConfig) }
      },
      invalidatesTags: ['OperatingConfig'],
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
  useGetReferralConfigQuery,
  useSaveReferralConfigMutation,
  useGetSystemControlsQuery,
  useSaveSystemControlsMutation,
  useGetOperatingConfigQuery,
  useSaveOperatingConfigMutation,
} = settingsApi
