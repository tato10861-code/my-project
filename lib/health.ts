/**
 * @fileoverview Liveness report for uptime monitors and load balancers.
 *
 * Deliberately shallow: it never touches the database or a provider, so a
 * monitor polling it cannot exhaust connections or leak which integrations are
 * configured. It answers whether this deployment is serving requests.
 */

/** Shape returned by GET /api/health. */
export type HealthReport = { status: 'ok'; version: string; time: string }

/**
 * Builds the liveness payload.
 *
 * @param env - Environment to read the deployed commit from (injectable for tests).
 * @param now - Current time (injectable for tests).
 * @returns The status, the short commit the deployment was built from
 *   ("dev" outside Vercel) and an ISO-8601 timestamp.
 */
export function healthReport(env: Record<string, string | undefined> = process.env, now = new Date()): HealthReport {
  const commit = env.VERCEL_GIT_COMMIT_SHA?.trim()
  return { status: 'ok', version: commit ? commit.slice(0, 7) : 'dev', time: now.toISOString() }
}

/** One readiness check: a short public name and whether it passed. */
export type ReadinessCheck = { name: string; ok: boolean }

/** Shape returned by GET /api/ready. */
export type ReadinessReport = { status: 'ready' | 'degraded'; checks: ReadinessCheck[]; time: string }

/**
 * Builds the readiness payload from completed checks. The deployment is
 * "ready" only when every check passed. Check names are generic ("database",
 * "auth") and carry no detail, so a public caller learns whether the service
 * can take traffic but not how it is configured.
 */
export function readinessReport(checks: ReadinessCheck[], now = new Date()): ReadinessReport {
  return { status: checks.every((check) => check.ok) ? 'ready' : 'degraded', checks, time: now.toISOString() }
}

/** True when the sign-in secret is configured (never reveals the value). */
export function authConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(env.BETTER_AUTH_SECRET?.trim())
}
