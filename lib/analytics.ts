/**
 * @fileoverview Pure helpers for the visitor analytics endpoints, kept free of
 * Next.js and database imports so they can be unit tested directly.
 */

/**
 * Period-over-period change as a whole percent, rounded to nearest.
 *
 * @param current - Count for the recent period.
 * @param previous - Count for the period just before it.
 * @returns The signed percent change, 0 when both periods are empty, or null
 *   when there is no earlier period to compare against (a change from zero is
 *   undefined, not infinite).
 * @complexity O(1) time, O(1) space.
 */
export function percentChange(current: number, previous: number): number | null {
  if (previous === 0) return current === 0 ? 0 : null
  return Math.round(((current - previous) / previous) * 100)
}

const AUTOMATED_AGENT =
  /bot|crawl|spider|slurp|headless|lighthouse|preview|monitor|uptime|curl\/|wget|python-requests|node-fetch|axios|go-http-client|okhttp|java\//i

/**
 * Whether a User-Agent looks like automated traffic. A missing agent counts as
 * automated: every real browser sends one. This is a coarse filter against
 * crawlers and scripts, not a defence against a client that fakes its agent.
 *
 * @param userAgent - The `User-Agent` header value, if any.
 * @complexity O(n) in the header length.
 */
export function isAutomatedTraffic(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.trim() === '') return true
  return AUTOMATED_AGENT.test(userAgent)
}
