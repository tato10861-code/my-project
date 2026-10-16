/**
 * @fileoverview Byte-range aware proxy for the brand film stored in Blob
 * storage. Shared by the public and owner-only video endpoints.
 */

export const VIDEO_SOURCE =
  'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/d1f2fb50-a0ab-11f1-881d-6515b107900b%20%281%29-k9MtgLxwIC9J0FfT2EjdxeNpddGKsu.mp4'

/** Upper bound on waiting for the origin to start responding. */
export const UPSTREAM_TIMEOUT_MS = 10_000

type Visibility = 'public' | 'private'

/**
 * Builds the response headers for a proxied video response. Partial (206)
 * responses are never stored by shared caches, and every response varies on
 * Range so a cache cannot serve one client's byte range to another.
 */
export function videoResponseHeaders(upstream: Headers, status: number, visibility: Visibility) {
  const headers = new Headers({
    'Content-Type': upstream.get('content-type') ?? 'video/mp4',
    'Accept-Ranges': 'bytes',
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff',
    Vary: 'Range',
    'Cache-Control': visibility === 'public' && status === 200 ? 'public, max-age=3600' : 'private, no-store',
  })
  for (const name of ['content-length', 'content-range']) {
    const value = upstream.get(name)
    if (value) headers.set(name, value)
  }
  return headers
}

/**
 * Proxies the video, forwarding the Range header. The upstream request is
 * aborted when the client disconnects or the origin does not answer within
 * {@link UPSTREAM_TIMEOUT_MS}.
 */
export async function proxyVideo(request: Request, visibility: Visibility, fetchImpl: typeof fetch = fetch) {
  const range = request.headers.get('range')
  const signal = AbortSignal.any([request.signal, AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)])
  let response: Response
  try {
    response = await fetchImpl(VIDEO_SOURCE, { headers: range ? { range } : undefined, cache: 'no-store', signal })
  } catch {
    return Response.json({ error: 'Video unavailable' }, { status: 504, headers: { 'Cache-Control': 'no-store' } })
  }
  if (!response.ok) {
    return Response.json(
      { error: 'Video unavailable' },
      { status: response.status === 416 ? 416 : 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  return new Response(response.body, {
    status: response.status,
    headers: videoResponseHeaders(response.headers, response.status, visibility),
  })
}
