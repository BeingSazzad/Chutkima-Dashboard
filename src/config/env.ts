import { z } from 'zod'

/**
 * Centralised, validated access to environment variables.
 * Every field has a safe default so the app never crashes when a variable is
 * missing (e.g. a fresh Vercel deploy with no env vars). Invalid values fall
 * back to defaults with a console warning instead of throwing.
 */
const envSchema = z.object({
  VITE_API_BASE_URL: z.string().url().default('https://api.chutkima.com'),
  VITE_APP_NAME: z.string().min(1).default('Chutkima Admin'),
  VITE_USE_MOCKS: z
    .enum(['true', 'false'])
    .default('true')
    .transform((v) => v === 'true'),
})

const parsed = envSchema.safeParse(import.meta.env)

if (!parsed.success) {
  console.warn('⚠️ Invalid environment variables — falling back to defaults:', parsed.error.flatten().fieldErrors)
}

export const env = parsed.success ? parsed.data : envSchema.parse({})
