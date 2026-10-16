/**
 * @fileoverview Shared (cross-instance) rate-limit arithmetic.
 *
 * Free of database and Next.js imports so it can be unit tested with a fake
 * store. lib/db/rate-limit.ts supplies the real Postgres query and decides
 * what to do when the store is unavailable.
 */
import { WINDOW_MS } from './request-security'

/** Runs one SQL statement; injectable so the logic can be tested without a database. */
export type Query = (text: string, values: unknown[]) => Promise<{ rows: Array<Record<string, unknown>> }>

export type LimitResult = { allowed: boolean; retryAfter: number }

/**
 * Unlike the per-instance limiter, which counts only the requests it allowed,
 * the shared counter also counts rejected ones (one atomic upsert, no read
 * before write). A client that keeps hammering while blocked therefore carries
 * a heavier previous window into the next minute and stays blocked a little
 * longer; a client that stops recovers on schedule.
 */

/** Share of calls that also delete counters too old to matter. */
const PRUNE_PROBABILITY = 0.01

/**
 * Counts this request in the shared store and returns the current window's
 * count together with the previous window's.
 */
const COUNT_SQL = `
  WITH current AS (
    INSERT INTO propauto_rate_limits (key, window_start, count)
    VALUES ($1, $2, 1)
    ON CONFLICT (key, window_start) DO UPDATE SET count = propauto_rate_limits.count + 1
    RETURNING count
  )
  SELECT
    (SELECT count FROM current) AS current,
    COALESCE((SELECT count FROM propauto_rate_limits WHERE key = $1 AND window_start = $3), 0) AS previous`

const PRUNE_SQL = 'DELETE FROM propauto_rate_limits WHERE window_start < $1'

/**
 * Sliding-window check against the shared store.
 *
 * @param query - Executes a SQL statement.
 * @param key - The client key from `getClientKey`.
 * @param limit - Maximum requests per trailing window.
 * @param now - Current time in milliseconds (injectable for tests).
 * @param random - Source of randomness for pruning (injectable for tests).
 * @returns Whether the request is within budget and, when it is not, how many
 *   seconds until the current window ends.
 * @throws Whatever `query` throws; callers decide whether to fail open.
 * @complexity O(1) statements per call, plus an occasional prune.
 */
export async function sharedRateLimit(
  query: Query,
  key: string,
  limit: number,
  now: number,
  random: () => number = Math.random,
): Promise<LimitResult> {
  const windowStart = now - (now % WINDOW_MS)
  const { rows } = await query(COUNT_SQL, [key, new Date(windowStart), new Date(windowStart - WINDOW_MS)])
  const current = Number(rows[0]?.current ?? 0)
  const previous = Number(rows[0]?.previous ?? 0)

  const overlap = (WINDOW_MS - (now - windowStart)) / WINDOW_MS
  const retryAfter = Math.max(1, Math.ceil((WINDOW_MS - (now - windowStart)) / 1000))

  if (random() < PRUNE_PROBABILITY) {
    // Housekeeping only: a failure here must never change the answer.
    await query(PRUNE_SQL, [new Date(windowStart - 2 * WINDOW_MS)]).catch(() => undefined)
  }
  // `current` already includes this request, so it is allowed up to the limit itself.
  return { allowed: previous * overlap + current <= limit, retryAfter }
}
