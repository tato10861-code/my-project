import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'
import { isOwnerEmail } from '@/lib/owner'

export { OWNER_EMAIL, isOwnerEmail } from '@/lib/owner'

const PRODUCTION_URL = 'https://propauto-ai-al-closer-saas.vercel.app'
const baseURL =
  process.env.BETTER_AUTH_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : (process.env.V0_RUNTIME_URL ?? PRODUCTION_URL))

const authSecret = process.env.BETTER_AUTH_SECRET
const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build'

if (!authSecret && !isProductionBuild) {
  throw new Error('BETTER_AUTH_SECRET is not configured')
}

const effectiveAuthSecret = authSecret ?? 'build-only-secret-not-used-at-runtime'
const runtimeOrigins = [
  process.env.V0_RUNTIME_URL,
  process.env.V0_DEV_APP_URL,
  process.env.V0_BUILD_URL,
  process.env.V0_SANDBOX_URL,
].filter((origin): origin is string => Boolean(origin))
const productionOrigins = [
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
  PRODUCTION_URL,
].filter((origin): origin is string => Boolean(origin))

export const auth = betterAuth({
  database: pool,
  secret: effectiveAuthSecret,
  baseURL,
  emailAndPassword: { enabled: true, autoSignIn: true },
  trustedOrigins:
    process.env.NODE_ENV === 'development' ? ['http://localhost:3000', ...runtimeOrigins] : productionOrigins,
  session: { expiresIn: 60 * 60 * 24 * 7, updateAge: 60 * 60 * 24 },
  databaseHooks: {
    user: {
      create: {
        // Only the owner has a use for an account; refuse every other sign-up
        // so the public endpoint cannot be used to fill the user table.
        before: async (user) => isOwnerEmail(user.email),
      },
    },
  },
  ...(process.env.NODE_ENV === 'development'
    ? {
        advanced: {
          defaultCookieAttributes: { sameSite: 'none' as const, secure: true },
        },
      }
    : {}),
})

/**
 * Resolves the current session and verifies the caller is the platform owner.
 *
 * @param headers - The incoming request headers used to read the session
 *   cookie.
 * @returns The authenticated session when the user matches
 *   {@link OWNER_EMAIL}, otherwise null.
 * @complexity O(1) database lookup via the better-auth session store.
 */
export async function requireOwner(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  if (!session?.user || !isOwnerEmail(session.user.email)) return null
  return session
}
