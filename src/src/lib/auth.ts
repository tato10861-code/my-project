import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

export const OWNER_EMAIL = 'tato10861@gmail.com'
const PRODUCTION_URL = 'https://propauto-ai-al-closer-saas.vercel.app'
const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.V0_RUNTIME_URL ?? PRODUCTION_URL)

const authSecret = process.env.BETTER_AUTH_SECRET
const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build'

if (!authSecret && !isProductionBuild) {
  throw new Error('BETTER_AUTH_SECRET is not configured')
}

const effectiveAuthSecret = authSecret ?? 'build-only-secret-not-used-at-runtime'

export const auth = betterAuth({
  database: pool,
  secret: effectiveAuthSecret,
  baseURL,
  emailAndPassword: { enabled: true, autoSignIn: true },
  trustedOrigins: [
    ...(process.env.NODE_ENV === 'development' && process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.NODE_ENV === 'production'
      ? [
          ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
          ...(process.env.VERCEL_PROJECT_PRODUCTION_URL ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`] : []),
          PRODUCTION_URL,
        ]
      : []),
  ],
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  advanced: {
    defaultCookieAttributes: { sameSite: 'none', secure: true },
  },
})

export async function requireOwner(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session?.user || session.user.email.toLowerCase() !== OWNER_EMAIL) return null
  return session
}
