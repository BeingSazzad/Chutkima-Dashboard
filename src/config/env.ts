import { z } from 'zod'

/**
 * Centralised, validated access to environment variables.
 * Fails fast (in dev) if a required variable is missing or malformed.
 */
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url(),
  VITE_APP_NAME: z.string().min(1).default('Chutkima Admin'),
  VITE_USE_MOCKS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  // Surface a clear message during development instead of a cryptic runtime crash.
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors)
  throw new Error('Invalid environment configuration. Check your .env file.')
}

export const env = parsed.data
