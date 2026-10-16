/**
 * @fileoverview Server-side request security primitives for PropAuto AI.
 *
 * Provides sliding-window rate limiting, body-size enforcement (declared and
 * actual), and origin validation so every API route can defend against abuse,
 * resource-exhaustion, and open-redirect classes of attacks without
 * duplicating logic. The limiter is in-memory and therefore per instance; it
 * bounds abuse from a single client on a warm instance, not globally.
 */

/** Duration of a rate-limit window in milliseconds. */
export const WINDOW_MS = 60_000

/** Bucket count above which expired buckets are pruned. */
const PRUNE_THRESHOLD = 1_000

type Bucket = { windowStart: number; count: number; previousCount: number }

/** In-memory bucket store: scope:key -> sliding-window counters. */
const buckets = new Map<string, Bucket>()

/**
 * Derives a stable, scope-prefixed client key from the request headers.
 *
 * Headers written by the hosting platform are preferred over the
 * client-controllable `x-forwarded-for`: on Vercel `x-real-ip` and
 * `x-vercel-forwarded-for` are set by the edge and cannot be spoofed by the
 * caller. `x-forwarded-for` is only used when neither is present (local
 * development and other hosts).
 *
 * @param request - The incoming request to inspect.
 * @param scope - A route-scoped namespace (e.g. "leads", "checkout") so that
 *   limits are applied independently per endpoint.
 * @returns A string key of the form `scope:ip`, or `scope:unknown` when no IP
 *   header is present.
 * @complexity O(1) time, O(1) space.
 */
export function getClientKey(request: Request, scope: string) {
  const firstEntry = (value: string | null) => value?.split(',')[0]?.trim() || undefined
  const ip =
    firstEntry(request.headers.get('x-vercel-forwarded-for')) ??
    firstEntry(request.headers.get('x-real-ip')) ??
    firstEntry(request.headers.get('x-forwarded-for')) ??
    'unknown'
  return `${scope}:${ip}`
}

/**
 * Checks whether a request is still within its rate-limit budget using a
 * sliding-window counter: the previous window's count is weighted by how much
 * of it still overlaps the trailing 60 seconds. Unlike a fixed window, a
 * caller cannot spend twice the budget by straddling a window boundary.
 *
 * @param key - The client key produced by {@link getClientKey}.
 * @param limit - Maximum number of requests allowed per trailing window.
 * @param now - Current time in milliseconds (injectable for tests).
 * @returns An object with an `allowed` flag and the number of seconds the
 *   client should wait before retrying (for the Retry-After header).
 * @complexity O(1) amortized time, O(1) space per key.
 */
export function rateLimit(key: string, limit: number, now = Date.now()) {
  pruneBuckets(now)
  const bucket = advance(buckets.get(key), now)
  buckets.set(key, bucket)

  const elapsed = now - bucket.windowStart
  const overlap = (WINDOW_MS - elapsed) / WINDOW_MS
  const estimate = bucket.previousCount * overlap + bucket.count
  const retryAfter = Math.max(1, Math.ceil((WINDOW_MS - elapsed) / 1000))

  if (estimate >= limit) return { allowed: false, retryAfter }
  bucket.count += 1
  return { allowed: true, retryAfter }
}

function advance(bucket: Bucket | undefined, now: number): Bucket {
  const windowStart = now - (now % WINDOW_MS)
  if (!bucket) return { windowStart, count: 0, previousCount: 0 }
  if (bucket.windowStart === windowStart) return bucket
  const previousCount = bucket.windowStart === windowStart - WINDOW_MS ? bucket.count : 0
  return { windowStart, count: 0, previousCount }
}

/**
 * Drops buckets that can no longer affect a decision (older than two
 * windows). Runs lazily from {@link rateLimit} instead of on a timer, so the
 * module has no side effects at import time in any runtime.
 *
 * @complexity O(n) time when the store exceeds the threshold, else O(1).
 */
function pruneBuckets(now: number) {
  if (buckets.size < PRUNE_THRESHOLD) return
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart >= 2 * WINDOW_MS) buckets.delete(key)
  }
}

/** Number of tracked rate-limit buckets (exposed for tests). */
export function bucketCount() {
  return buckets.size
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
 * @returns The normalized origin, or null when unconfigured or malformed.
 *   Plain http is accepted only when NODE_ENV is "development"; production,
 *   preview and test builds require https.
 * @complexity O(1) time, O(1) space.
 */
export function getConfiguredOrigin() {
  const configured = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.BETTER_AUTH_URL
  if (!configured) return null
  try {
    const url = new URL(configured)
    const allowHttp = process.env.NODE_ENV === 'development'
    if (url.protocol !== 'https:' && !(allowHttp && url.protocol === 'http:')) return null
    return url.origin
  } catch {
    return null
  }
}

/**
 * Decides whether a state-changing request was made by this site's own pages.
 *
 * Browsers attach `Origin` to every cross-site POST, so a form hosted on
 * another site is rejected here before it can start a purchase or write a
 * record. The allowed origins are the configured public origin and the origin
 * the request itself arrived on. When `Origin` is absent (older browsers,
 * non-browser clients) `Sec-Fetch-Site` is consulted; a request with neither
 * header cannot be a cross-site browser submission and is allowed.
 *
 * @param request - The incoming request.
 * @returns True when the request may proceed.
 * @complexity O(1) time, O(1) space.
 */
export function isSameOriginRequest(request: Request) {
  const origin = request.headers.get('origin')
  if (origin === null) return request.headers.get('sec-fetch-site') !== 'cross-site'
  let requestOrigin: string | null = null
  try {
    requestOrigin = new URL(request.url).origin
  } catch {
    requestOrigin = null
  }
  const allowed = [getConfiguredOrigin(), requestOrigin]
  return allowed.some((candidate) => candidate !== null && candidate === origin)
}

/** Standard 403 response for a request from another origin. */
export function crossOriginForbidden() {
  return Response.json({ error: 'Cross-origin request rejected' }, { status: 403, headers: { 'Cache-Control': 'no-store' } })
}

/**
 * Detects whether a request declares a body above the byte limit using the
 * Content-Length header, without reading the body. A missing header is not a
 * verdict: use {@link readJsonBody} to enforce the limit on the actual bytes.
 *
 * @param request - The incoming request.
 * @param maxBytes - Maximum acceptable body size in bytes.
 * @returns True when the declared length is negative, non-numeric, or above
 *   the limit; false when it is absent or within the limit.
 * @complexity O(1) time, O(1) space.
 */
export function hasOversizedBody(request: Request | Response, maxBytes: number) {
  const value = request.headers.get('content-length')
  if (value === null) return false
  const length = Number(value)
  return !Number.isFinite(length) || length < 0 || length > maxBytes
}

/** Thrown by {@link readJsonBody} when the body exceeds its byte limit. */
export class BodyTooLargeError extends Error {
  constructor() {
    super('Request body too large')
    this.name = 'BodyTooLargeError'
  }
}

/** Thrown by {@link readJsonBody} when the body is not valid JSON. */
export class InvalidJsonError extends Error {
  constructor() {
    super('Request body is not valid JSON')
    this.name = 'InvalidJsonError'
  }
}

/**
 * Reads the raw body of a request (or of an upstream response) as text while
 * enforcing a byte cap on the bytes actually received, so a chunked request with no Content-Length cannot bypass the
 * limit. Reading stops as soon as the cap is crossed.
 *
 * @param request - The incoming request.
 * @param maxBytes - Maximum acceptable body size in bytes.
 * @returns The body decoded as UTF-8 ("" when there is no body).
 * @throws {BodyTooLargeError} When the declared or actual size exceeds the cap.
 * @complexity O(n) time and space in the body size, bounded by maxBytes.
 */
export async function readTextBody(request: Request | Response, maxBytes: number): Promise<string> {
  if (hasOversizedBody(request, maxBytes)) throw new BodyTooLargeError()
  if (!request.body) return ''

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > maxBytes) {
      await reader.cancel().catch(() => undefined)
      throw new BodyTooLargeError()
    }
    chunks.push(value)
  }

  const bytes = new Uint8Array(received)
  let offset = 0
  for (const chunk of chunks) {
    bytes.set(chunk, offset)
    offset += chunk.byteLength
  }
  return new TextDecoder().decode(bytes)
}

/**
 * Reads and parses a JSON body under the same byte cap as {@link readTextBody}.
 *
 * @throws {BodyTooLargeError} When the declared or actual size exceeds the cap.
 * @throws {InvalidJsonError} When the body is empty or not valid JSON.
 */
export async function readJsonBody(request: Request, maxBytes: number): Promise<unknown> {
  const text = await readTextBody(request, maxBytes)
  if (text === '') throw new InvalidJsonError()
  try {
    return JSON.parse(text)
  } catch {
    throw new InvalidJsonError()
  }
}

/**
 * Reads a form-encoded body (`application/x-www-form-urlencoded`) under the
 * same byte cap as {@link readTextBody}, so a chunked submission with no
 * Content-Length cannot slip past the limit the way `request.formData()` would
 * allow.
 *
 * @throws {BodyTooLargeError} When the declared or actual size exceeds the cap.
 * @returns The decoded fields (empty when there is no body).
 */
export async function readFormBody(request: Request, maxBytes: number): Promise<URLSearchParams> {
  return new URLSearchParams(await readTextBody(request, maxBytes))
}

/** Standard 413 response for oversized bodies. */
export function payloadTooLarge() {
  return Response.json({ error: 'Request too large' }, { status: 413, headers: { 'Cache-Control': 'no-store' } })
}
