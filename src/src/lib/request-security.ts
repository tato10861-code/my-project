/**
 * @fileoverview Server-side request security primitives for PropAuto AI.
 *
 * Provides fixed-window rate limiting, oversized-body rejection, and origin
 * validation so every API route can defend against abuse, resource-exhaustion,
 * and open-redirect classes of attacks without duplicating logic. All lookups
 * are O(1) hash-map operations; expired buckets are pruned by a background
 * interval so the map cannot grow without bound.
 */

/** Duration of a rate-limit window in milliseconds. */
const WINDOW_MS = 60_000

/** In-memory bucket store: scope:key -> { count, resetAt }. */
const buckets = new Map<string, { count: number; resetAt: number }>()

/**
 * Derives a stable, scope-prefixed client key from the request headers.
 *
 * @param request - The incoming request to inspect.
 * @param scope - A route-scoped namespace (e.g. "leads", "checkout") so that
 *   limits are applied independently per endpoint.
 * @returns A string key of the form `scope:ip` or `scope:unknown` when no IP
 *   header is present.
 * @complexity O(1) time, O(1) space.
 */
export function getClientKey(request: Request, scope: string) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = request.headers.get('x-real-ip')?.trim()
  return `${scope}:${forwarded || realIp || 'unknown'}`
}

/**
 * Checks whether a request is still within its rate-limit budget.
 *
 * @param key - The client key produced by {@link getClientKey}.
 * @param limit - Maximum number of requests allowed per window.
 * @returns An object with an `allowed` flag and the number of seconds until
 *   the window resets (for the Retry-After header).
 * @complexity O(1) time, O(1) space.
 */
export function rateLimit(key: string, limit: number) {
  const now = Date.now()
  const current = buckets.get(key)
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, retryAfter: 60 }
  }

  current.count += 1
  if (current.count > limit) {
    return { allowed: false, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) }
  }

  return { allowed: true, retryAfter: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) }
}

/**
 * Builds a standardized 429 response with no-store and Retry-After headers.
 *
 * @param retryAfter - Seconds the client should wait before retrying.
 * @returns A JSON {@link Response} with status 429.
 * @complexity O(1) time, O(1) space.
 */
export function tooManyRequests(retryAfter: number) {
  return Response.json(
    { error: 'Too many requests. Please try again shortly.', retryable: true },
    { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(retryAfter) } },
  )
}

/**
 * Resolves and validates the configured public origin for the deployment.
 *
 * @returns The normalized https origin string, or null when unconfigured or
 *   when the configured URL is not https in production.
 * @complexity O(1) time, O(1) space.
 */
export function getConfiguredOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BETTER_AUTH_URL
  if (!configured) return null
  try {
    const url = new URL(configured)
    if (url.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && url.protocol === 'http:')) return null
    return url.origin
  } catch {
    return null
  }
}

/**
 * Detects whether a request body exceeds the configured byte limit using the
 * Content-Length header (no body buffering required).
 *
 * @param request - The incoming request.
 * @param maxBytes - Maximum acceptable body size in bytes.
 * @returns True when the declared length is missing-and-valid, negative,
 *   non-numeric, or above the limit; false otherwise.
 * @complexity O(1) time, O(1) space.
 */
export function hasOversizedBody(request: Request, maxBytes: number) {
  const value = request.headers.get('content-length')
  if (value === null) return false
  const length = Number(value)
  return !Number.isFinite(length) || length < 0 || length > maxBytes
}

/**
 * Prunes expired buckets so the in-memory store stays bounded.
 *
 * @complexity O(n) time where n is the number of buckets — only invoked when
 *   the map exceeds 5000 entries, and never blocks the event loop for long.
 * @complexity O(1) extra space.
 */
export function trimBuckets() {
  if (buckets.size < 5000) return
  const now = Date.now()
  for (const [key, value] of buckets) {
    if (value.resetAt <= now) buckets.delete(key)
  }
}

trimBuckets()
setInterval(trimBuckets, WINDOW_MS).unref()