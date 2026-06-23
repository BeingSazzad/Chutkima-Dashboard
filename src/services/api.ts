import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '@/store'
import { env } from '@/config/env'

/**
 * Base RTK Query API.
 *
 * `fetchBaseQuery` is configured for the real backend (JWT bearer header is
 * attached automatically from the auth slice). While `VITE_USE_MOCKS=true`,
 * the individual endpoints in `services/endpoints/*` override `query` with a
 * `queryFn` that returns seeded mock data — so the dashboard runs end-to-end
 * with no server. Flip the endpoints from `queryFn` to `query` to go live.
 */
export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: env.VITE_API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token
      if (token) headers.set('authorization', `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: [
    'Order',
    'Product',
    'Category',
    'Driver',
    'Customer',
    'Kpi',
    'Banner',
    'Onboarding',
    'Content',
    'Faq',
    'FaqSection',
    'Links',
    'Admin',
    'HomeSection',
    'Coupon',
    'Zone',
    'Delivery',
    'Search',
    'Review',
    'Report',
    'Transaction',
    'OpsConfig',
    'TrustConfig',
    'StoreSetup',
    'ReferralConfig',
    'SystemControls',
    'Store',
  ],
  endpoints: () => ({}),
})

/** Simulate network latency for mock endpoints. */
export const mockDelay = (ms = 350) => new Promise((r) => setTimeout(r, ms))

/**
 * Deep-clone mock data before returning it from an endpoint.
 *
 * RTK Query deep-freezes whatever a query returns (immer auto-freeze). If we
 * returned references to the in-memory mock store, those objects would freeze
 * and later in-place mutations (assign driver, toggle category, edit stock)
 * would throw. Cloning keeps the mock store mutable and the cache immutable.
 */
export const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
