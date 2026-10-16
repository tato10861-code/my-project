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
