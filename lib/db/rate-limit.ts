/**
 * @fileoverview Rate limiting that holds across server instances.
 *
 * `rateLimit` in lib/request-security.ts counts in process memory, so each
 * instance enforces the limit on its own. This module checks that counter
 * first (a cheap rejection for an abusive client on a warm instance) and then
 * a Postgres counter shared by every instance, using the same sliding-window
 * arithmetic. If the shared store is unreachable, or the table from
 * db/migrations/0005_rate_limits.sql does not exist yet, it fails open to the
 * per-instance answer rather than refusing legitimate visitors.
 */
import { pool } from '@/lib/db'
import { rateLimit } from '@/lib/request-security'
import { sharedRateLimit, type LimitResult } from '@/lib/rate-limit-shared'
import { errorMessage, log } from '@/lib/log'

/** Longest the shared check may delay a request before the per-instance answer is used. */
const SHARED_TIMEOUT_MS = 750

let warned = false

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`shared rate limit timed out after ${ms} ms`)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer))
}

/**
 * The rate limit every API route uses: per-instance first, then shared.
 *
 * @param key - The client key from `getClientKey`.
 * @param limit - Maximum requests per trailing window.
 */
export async function checkRateLimit(key: string, limit: number, now: number = Date.now()): Promise<LimitResult> {
  const local = rateLimit(key, limit, now)
  if (!local.allowed) return local
  try {
    return await withTimeout(
      sharedRateLimit((text, values) => pool.query(text, values), key, limit, now),
      SHARED_TIMEOUT_MS,
    )
  } catch (error) {
    if (!warned) {
      warned = true
      log('error', 'rate-limit.shared_store_unavailable', {
        fallback: 'per-instance limits',
        error: errorMessage(error),
      })
    }
    return local
  }
}
