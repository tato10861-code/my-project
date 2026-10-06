const buckets = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000

export function getClientKey(request: Request, scope: string) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = request.headers.get('x-real-ip')?.trim()
  return `${scope}:${forwarded || realIp || 'unknown'}`
}

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

export function tooManyRequests(retryAfter: number) {
  return Response.json(
    { error: 'Too many requests. Please try again shortly.', retryable: true },
    { status: 429, headers: { 'Cache-Control': 'no-store', 'Retry-After': String(retryAfter) } },
  )
}

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

export function hasOversizedBody(request: Request, maxBytes: number) {
  const value = request.headers.get('content-length')
  if (value === null) return false
  const length = Number(value)
  return !Number.isFinite(length) || length < 0 || length > maxBytes
}

export function trimBuckets() {
  if (buckets.size < 5000) return
  const now = Date.now()
  for (const [key, value] of buckets) {
    if (value.resetAt <= now) buckets.delete(key)
  }
}

trimBuckets()
setInterval(trimBuckets, WINDOW_MS).unref()
