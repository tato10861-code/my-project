/**
 * @fileoverview Unit tests for the request security layer (rate limiting,
 * oversized-body detection, and origin validation).
 *
 * The module under test has no Next.js imports, so it runs directly under the
 * Node test runner:
 *   node --test tests/unit/
 */
import assert from 'node:assert/strict'
import {
  getClientKey,
  isSameOriginRequest,
  crossOriginForbidden,
  rateLimit,
  tooManyRequests,
  getConfiguredOrigin,
  hasOversizedBody,
  readJsonBody,
  readFormBody,
  BodyTooLargeError,
  InvalidJsonError,
  bucketCount,
  WINDOW_MS,
} from '../../lib/request-security'

test('getClientKey falls back to unknown when no IP headers exist', () => {
  const request = new Request('https://example.com')
  assert.equal(getClientKey(request, 'leads'), 'leads:unknown')
})

test('getClientKey prefers the first x-forwarded-for entry', () => {
  const request = new Request('https://example.com', {
    headers: { 'x-forwarded-for': '203.0.113.7, 10.0.0.1' },
  })
  assert.equal(getClientKey(request, 'leads'), 'leads:203.0.113.7')
})

test('getClientKey prefers platform headers over client-supplied x-forwarded-for', () => {
  const request = new Request('https://example.com', {
    headers: { 'x-forwarded-for': '1.2.3.4', 'x-real-ip': '198.51.100.4' },
  })
  assert.equal(getClientKey(request, 'leads'), 'leads:198.51.100.4')

  const vercel = new Request('https://example.com', {
    headers: { 'x-forwarded-for': '1.2.3.4', 'x-vercel-forwarded-for': '203.0.113.9' },
  })
  assert.equal(getClientKey(vercel, 'leads'), 'leads:203.0.113.9')
})

test('getClientKey uses x-real-ip when forwarded header is absent', () => {
  const request = new Request('https://example.com', {
    headers: { 'x-real-ip': '198.51.100.4' },
  })
  assert.equal(getClientKey(request, 'events'), 'events:198.51.100.4')
})

test('rateLimit allows the first request and blocks past the limit', () => {
  const key = 'test:first'
  assert.equal(rateLimit(key, 2).allowed, true)
  assert.equal(rateLimit(key, 2).allowed, true)
  const blocked = rateLimit(key, 2)
  assert.equal(blocked.allowed, false)
  assert.ok(blocked.retryAfter >= 1)
})

test('rateLimit keeps independent keys independent', () => {
  const keyA = 'test:a'
  const keyB = 'test:b'
  rateLimit(keyA, 1)
  assert.equal(rateLimit(keyA, 1).allowed, false)
  assert.equal(rateLimit(keyB, 1).allowed, true)
})

test('rateLimit cannot be doubled by straddling a window boundary', () => {
  const key = 'test:straddle'
  const boundary = 10 * WINDOW_MS
  let allowed = 0
  for (let i = 0; i < 5; i++) if (rateLimit(key, 5, boundary - 10).allowed) allowed++
  for (let i = 0; i < 5; i++) if (rateLimit(key, 5, boundary + 10).allowed) allowed++
  // A fixed window would allow 10 here; the sliding estimate allows the budget
  // plus at most the fraction of the old window that has already slid out.
  assert.ok(allowed <= 6, `allowed ${allowed}`)
})

test('rateLimit recovers once the previous window has slid out', () => {
  const key = 'test:recover'
  const start = 20 * WINDOW_MS
  for (let i = 0; i < 3; i++) rateLimit(key, 3, start)
  assert.equal(rateLimit(key, 3, start).allowed, false)
  assert.equal(rateLimit(key, 3, start + 2 * WINDOW_MS).allowed, true)
})

test('rateLimit prunes stale buckets lazily', () => {
  const old = 30 * WINDOW_MS
  for (let i = 0; i < 1100; i++) rateLimit(`test:prune:${i}`, 1, old)
  assert.ok(bucketCount() >= 1100)
  rateLimit('test:prune:trigger', 1, old + 3 * WINDOW_MS)
  assert.ok(bucketCount() < 100)
})

test('tooManyRequests returns a 429 with retry headers', () => {
  const response = tooManyRequests(42)
  assert.equal(response.status, 429)
  assert.equal(response.headers.get('retry-after'), '42')
  assert.equal(response.headers.get('cache-control'), 'no-store')
})

test('hasOversizedBody rejects invalid content-length values', () => {
  const noHeader = new Request('https://example.com')
  assert.equal(hasOversizedBody(noHeader, 1024), false)

  const negative = new Request('https://example.com', {
    headers: { 'content-length': '-5' },
  })
  assert.equal(hasOversizedBody(negative, 1024), true)

  const notANumber = new Request('https://example.com', {
    headers: { 'content-length': 'abc' },
  })
  assert.equal(hasOversizedBody(notANumber, 1024), true)
})

test('hasOversizedBody flags bodies above the byte limit', () => {
  const large = new Request('https://example.com', {
    method: 'POST',
    headers: { 'content-length': '2048' },
  })
  assert.equal(hasOversizedBody(large, 1024), true)
  assert.equal(hasOversizedBody(large, 4096), false)
})

test('getConfiguredOrigin returns null without configuration', () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.BETTER_AUTH_URL
  assert.equal(getConfiguredOrigin(), null)
  if (previous !== undefined) process.env.NEXT_PUBLIC_SITE_URL = previous
})

test('getConfiguredOrigin normalizes a configured https origin', () => {
  const previous = process.env.NEXT_PUBLIC_SITE_URL
  process.env.NEXT_PUBLIC_SITE_URL = 'https://propauto-ai-al-closer-saas.vercel.app'
  assert.equal(getConfiguredOrigin(), 'https://propauto-ai-al-closer-saas.vercel.app')
  if (previous !== undefined) process.env.NEXT_PUBLIC_SITE_URL = previous
  else delete process.env.NEXT_PUBLIC_SITE_URL
})

test('getConfiguredOrigin rejects plain http in production', () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousUrl = process.env.NEXT_PUBLIC_SITE_URL
  process.env.NODE_ENV = 'production'
  process.env.NEXT_PUBLIC_SITE_URL = 'http://insecure.example.com'
  assert.equal(getConfiguredOrigin(), null)
  if (previousNodeEnv !== undefined) process.env.NODE_ENV = previousNodeEnv
  else delete process.env.NODE_ENV
  if (previousUrl !== undefined) process.env.NEXT_PUBLIC_SITE_URL = previousUrl
  else delete process.env.NEXT_PUBLIC_SITE_URL
})

function chunkedRequest(text) {
  const bytes = new TextEncoder().encode(text)
  const body = new ReadableStream({
    start(controller) {
      for (let i = 0; i < bytes.length; i += 16) controller.enqueue(bytes.slice(i, i + 16))
      controller.close()
    },
  })
  return new Request('https://example.com', { method: 'POST', body, duplex: 'half' })
}

test('readJsonBody parses a body within the limit', async () => {
  const request = new Request('https://example.com', { method: 'POST', body: JSON.stringify({ a: 1 }) })
  assert.deepEqual(await readJsonBody(request, 1024), { a: 1 })
})

test('readJsonBody enforces the cap on chunked bodies without content-length', async () => {
  const request = chunkedRequest(JSON.stringify({ text: 'x'.repeat(4096) }))
  assert.equal(request.headers.get('content-length'), null)
  await assert.rejects(readJsonBody(request, 1024), BodyTooLargeError)
})

test('readJsonBody rejects a declared oversized body before reading', async () => {
  const request = new Request('https://example.com', {
    method: 'POST',
    body: '{}',
    headers: { 'content-length': '999999' },
  })
  await assert.rejects(readJsonBody(request, 1024), BodyTooLargeError)
})

test('readJsonBody rejects malformed or empty JSON', async () => {
  await assert.rejects(
    readJsonBody(new Request('https://example.com', { method: 'POST', body: '{nope' }), 1024),
    InvalidJsonError,
  )
  await assert.rejects(readJsonBody(new Request('https://example.com', { method: 'POST' }), 1024), InvalidJsonError)
})

test('getConfiguredOrigin rejects plain http outside development', () => {
  const previousNodeEnv = process.env.NODE_ENV
  const previousUrl = process.env.NEXT_PUBLIC_SITE_URL
  process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
  process.env.NODE_ENV = 'test'
  assert.equal(getConfiguredOrigin(), null)
  process.env.NODE_ENV = 'development'
  assert.equal(getConfiguredOrigin(), 'http://localhost:3000')
  if (previousNodeEnv !== undefined) process.env.NODE_ENV = previousNodeEnv
  else delete process.env.NODE_ENV
  if (previousUrl !== undefined) process.env.NEXT_PUBLIC_SITE_URL = previousUrl
  else delete process.env.NEXT_PUBLIC_SITE_URL
})

describe('isSameOriginRequest', () => {
  const post = (headers = {}, url = 'https://propauto.example/api/leads') =>
    new Request(url, { method: 'POST', headers })
  const saved = { site: process.env.NEXT_PUBLIC_SITE_URL, auth: process.env.BETTER_AUTH_URL }
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SITE_URL = 'https://www.propauto.example'
    delete process.env.BETTER_AUTH_URL
  })
  afterAll(() => {
    for (const [key, value] of [
      ['NEXT_PUBLIC_SITE_URL', saved.site],
      ['BETTER_AUTH_URL', saved.auth],
    ]) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  })

  test('accepts the configured origin and the origin the request arrived on', () => {
    assert.equal(isSameOriginRequest(post({ origin: 'https://www.propauto.example' })), true)
    assert.equal(isSameOriginRequest(post({ origin: 'https://propauto.example' })), true)
  })

  test('rejects another site, a lookalike host and the null origin', () => {
    assert.equal(isSameOriginRequest(post({ origin: 'https://evil.example' })), false)
    assert.equal(isSameOriginRequest(post({ origin: 'https://propauto.example.evil.example' })), false)
    assert.equal(isSameOriginRequest(post({ origin: 'http://propauto.example' })), false)
    assert.equal(isSameOriginRequest(post({ origin: 'null' })), false)
  })

  test('without Origin it relies on Sec-Fetch-Site', () => {
    assert.equal(isSameOriginRequest(post({ 'sec-fetch-site': 'cross-site' })), false)
    assert.equal(isSameOriginRequest(post({ 'sec-fetch-site': 'same-origin' })), true)
    assert.equal(isSameOriginRequest(post()), true)
  })

  test('crossOriginForbidden answers 403 with no-store', async () => {
    const response = crossOriginForbidden()
    assert.equal(response.status, 403)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal((await response.json()).error, 'Cross-origin request rejected')
  })
})

describe('readFormBody', () => {
  const form = (body, headers = {}) =>
    new Request('https://example.com/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded', ...headers },
      body,
    })

  test('decodes the fields of a form submission', async () => {
    const fields = await readFormBody(form('plan=growth&product=a%20b'), 1024)
    assert.equal(fields.get('plan'), 'growth')
    assert.equal(fields.get('product'), 'a b')
    assert.equal(fields.get('missing'), null)
  })

  test('an empty body yields no fields', async () => {
    const fields = await readFormBody(new Request('https://example.com', { method: 'POST' }), 1024)
    assert.equal([...fields].length, 0)
  })

  test('caps the bytes actually received, not just the declared length', async () => {
    const chunks = [new TextEncoder().encode('plan='), new TextEncoder().encode('x'.repeat(64))]
    const stream = new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(chunk)
        controller.close()
      },
    })
    const chunked = new Request('https://example.com/api/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: stream,
      duplex: 'half',
    })
    await assert.rejects(readFormBody(chunked, 32), BodyTooLargeError)
  })

  test('rejects a declared length over the cap without reading', async () => {
    await assert.rejects(readFormBody(form('plan=growth', { 'content-length': '999999' }), 1024), BodyTooLargeError)
  })
})
