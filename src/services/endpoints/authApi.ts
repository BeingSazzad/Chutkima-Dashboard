import { api, mockDelay } from '@/services/api'
import type { LoginResponse } from '@/types/api.types'

/** Demo sign-in details — admin logs in via OTP on their phone (feature 109). */
export const DEMO_EMAIL = 'admin@chutkima.com'
export const DEMO_PHONE = '+977 9800000001'
/** Fixed OTP used in mock mode (a real backend would SMS a random code). */
export const DEMO_OTP = '123456'

const ADMIN_SESSION: LoginResponse = {
  token: 'mock-jwt-token.chutkima.admin',
  user: {
    id: 'admin-1',
    name: 'Kiran Chetri',
    email: DEMO_EMAIL,
    role: 'admin',
    avatar: 'https://i.pravatar.cc/120?u=chutkima-admin',
    phone: DEMO_PHONE,
  },
}

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** Step 1 — send a one-time code to the admin's phone. */
    requestOtp: build.mutation<{ phone: string; devOtp: string }, { phone: string }>({
      async queryFn({ phone }) {
        await mockDelay(600)
        if (!phone.trim()) {
          return { error: { status: 400, data: 'Enter your phone number.' } as never }
        }
        // Mock mode returns the code so the demo can sign in without an SMS.
        return { data: { phone: phone.trim(), devOtp: DEMO_OTP } }
      },
    }),

    /** Step 2 — verify the OTP and start the admin session. No password. */
    verifyOtp: build.mutation<LoginResponse, { phone: string; otp: string }>({
      async queryFn({ otp }) {
        await mockDelay(600)
        if (otp.trim() !== DEMO_OTP) {
          return { error: { status: 401, data: 'Invalid or expired code.' } as never }
        }
        return { data: ADMIN_SESSION }
      },
    }),
  }),
})

export const { useRequestOtpMutation, useVerifyOtpMutation } = authApi
