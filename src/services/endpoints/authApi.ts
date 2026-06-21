import { api, mockDelay } from '@/services/api'
import type { LoginResponse } from '@/types/api.types'

/** Demo credentials (replace with a real auth API later). */
export const DEMO_EMAIL = 'admin@chutkima.com'
export const DEMO_PASSWORD = 'chutkima123'

export const authApi = api.injectEndpoints({
  endpoints: (build) => ({
    /** Email + password sign-in. Mock accepts the demo credentials above. */
    login: build.mutation<LoginResponse, { email: string; password: string }>({
      async queryFn({ email, password }) {
        await mockDelay(600)
        if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
          return { error: { status: 401, data: 'Invalid email or password.' } as never }
        }
        return {
          data: {
            token: 'mock-jwt-token.chutkima.admin',
            user: {
              id: 'admin-1',
              name: 'Kiran Chetri',
              email: DEMO_EMAIL,
              role: 'admin',
              avatar: 'https://i.pravatar.cc/120?u=chutkima-admin',
              phone: '+977 9800000001',
            },
          },
        }
      },
    }),
  }),
})

export const { useLoginMutation } = authApi
