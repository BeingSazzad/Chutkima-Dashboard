import { api, mockDelay } from '@/services/api'
import type { LoginResponse } from '@/types/api.types'

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** Step 1: request an OTP for a phone number (Sparrow SMS in production). */
    requestOtp: build.mutation<{ sent: true }, { phone: string }>({
      async queryFn({ phone }) {
        await mockDelay(600)
        if (!/^(\+?977)?9\d{9}$/.test(phone.replace(/\s/g, ''))) {
          return { error: { status: 400, data: 'Enter a valid Nepali mobile number' } as never }
        }
        return { data: { sent: true } }
      },
    }),

    /** Step 2: verify the OTP. Mock accepts demo code 123456. */
    verifyOtp: build.mutation<LoginResponse, { phone: string; code: string }>({
      async queryFn({ phone, code }) {
        await mockDelay(600)
        if (code !== '123456') {
          return { error: { status: 401, data: 'Invalid OTP. Use 123456 in demo mode.' } as never }
        }
        return {
          data: {
            token: 'mock-jwt-token.chutkima.admin',
            user: {
              id: 'admin-1',
              name: 'Aarav Pradhan',
              email: 'admin@chutkima.com',
              role: 'admin',
              avatar: 'https://i.pravatar.cc/120?u=chutkima-admin',
              phone,
            },
          },
        }
      },
    }),
  }),
})

export const { useRequestOtpMutation, useVerifyOtpMutation } = authApi
