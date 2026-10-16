/**
 * @fileoverview Behaviour tests for the less-travelled branches of the pure
 * modules: optional fields left out, malformed input, provider failures and
 * hostile configuration. Every case asserts an outcome a caller depends on.
 */
import assert from 'node:assert/strict'
import { bookingNotificationEmail } from '../../lib/bookings'
import { healthReport } from '../../lib/health'
import { buildLeadEmail, isMissingColumnError, leadIdempotencyKey, leadRow, leadSchema } from '../../lib/leads'
import { safeDivide, toCents } from '../../lib/math'
import { paymentRecord } from '../../lib/payments'
import {
  BodyTooLargeError,
  InvalidJsonError,
  getConfiguredOrigin,
  payloadTooLarge,
  readJsonBody,
} from '../../lib/request-security'
import { proxyVideo } from '../../lib/video-proxy'

const minimalLead = leadSchema.parse({ name: 'Ada Lovelace', email: 'ADA@Example.com', intent: 'buyer' })

describe('leads without optional details', () => {
  test('the owner email says what is missing instead of printing "undefined"', () => {
    const { html } = buildLeadEmail(minimalLead)
    assert.equal(html.includes('undefined'), false)
    assert.equal(html.split('Not provided').length - 1, 2)
    assert.equal(html.includes('<strong>Language:</strong> en</p>'), true)
  })

  test('the stored row uses null, not empty strings, for what was not sent', () => {
    const row = leadRow(minimalLead)
    assert.deepEqual([row.phone, row.budget, row.message, row.language], [null, null, null, null])
    assert.equal(row.source, 'web')
  })

  test('the idempotency key ignores email case but changes on the next day', () => {
    const day = new Date('2026-10-12T09:00:00Z')
    const sameLeadUpper = leadSchema.parse({ name: 'Ada Lovelace', email: 'ada@example.com', intent: 'buyer' })
    assert.equal(leadIdempotencyKey(minimalLead, day), leadIdempotencyKey(sameLeadUpper, day))
    assert.notEqual(
      leadIdempotencyKey(minimalLead, day),
      leadIdempotencyKey(minimalLead, new Date('2026-10-13T09:00:00Z')),
    )
  })
})

describe('isMissingColumnError', () => {
  test('is false for values that are not errors or carry another code', () => {
    for (const value of [undefined, null, 'boom', 42, new Error('x'), { code: '23505' }])
      assert.equal(isMissingColumnError(value), false)
  })

  test('finds the code several causes deep but stops on a cyclic or very deep chain', () => {
    assert.equal(isMissingColumnError({ cause: { cause: { code: '42703' } } }), true)
    const cyclic = { cause: undefined }
    cyclic.cause = cyclic
    assert.equal(isMissingColumnError(cyclic), false)
    let deep = { code: '42703' }
    for (let level = 0; level < 8; level++) deep = { cause: deep }
    assert.equal(isMissingColumnError(deep), false)
  })
})

describe('paymentRecord', () => {
  const session = (overrides) => ({ id: 'cs_1', mode: 'payment', payment_status: 'paid', ...overrides })
  const event = (type, object) => ({ id: 'evt_1', type, livemode: false, data: { object } })

  test('accepts a payment that succeeded asynchronously after checkout', () => {
    const record = paymentRecord(
      event('checkout.session.async_payment_succeeded', session({ amount_total: 500, currency: 'usd' })),
    )
    assert.equal(record?.sessionId, 'cs_1')
    assert.equal(record?.amountTotal, 500)
  })

  test('leaves unknown details null rather than inventing them', () => {
    const record = paymentRecord(event('checkout.session.completed', session({})))
    assert.deepEqual(
      [record?.productId, record?.amountTotal, record?.currency, record?.customerEmail],
      [null, null, null, null],
    )
  })

  test('does not store a paid subscription checkout as a one-time payment', () => {
    assert.equal(paymentRecord(event('checkout.session.completed', session({ mode: 'subscription' }))), null)
  })
})

describe('healthReport', () => {
  const now = new Date('2026-10-12T10:00:00Z')

  test('treats a blank commit variable as unknown', () => {
    assert.equal(healthReport({ VERCEL_GIT_COMMIT_SHA: '   ' }, now).version, 'dev')
  })

  test('trims and shortens a full commit hash to seven characters', () => {
    assert.equal(
      healthReport({ VERCEL_GIT_COMMIT_SHA: ' ce19e48f41b9d427d4acbd74f4f4fdf19a8af14f ' }, now).version,
      'ce19e48',
    )
  })
})

describe('getConfiguredOrigin', () => {
  const saved = {
    site: process.env.NEXT_PUBLIC_SITE_URL,
    auth: process.env.BETTER_AUTH_URL,
    node: process.env.NODE_ENV,
  }
  const restore = (key, value) => (value === undefined ? delete process.env[key] : (process.env[key] = value))

  afterEach(() => {
    restore('NEXT_PUBLIC_SITE_URL', saved.site)
    restore('BETTER_AUTH_URL', saved.auth)
    restore('NODE_ENV', saved.node)
  })

  test('returns null when nothing is configured or the value is not a URL', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    delete process.env.BETTER_AUTH_URL
    assert.equal(getConfiguredOrigin(), null)
    process.env.NEXT_PUBLIC_SITE_URL = 'not a url'
    assert.equal(getConfiguredOrigin(), null)
  })

  test('falls back to the auth URL and reduces it to its origin', () => {
    delete process.env.NEXT_PUBLIC_SITE_URL
    process.env.BETTER_AUTH_URL = 'https://app.example.com/some/path?x=1'
    assert.equal(getConfiguredOrigin(), 'https://app.example.com')
  })

  test('accepts plain http only in development', () => {
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3000'
    process.env.NODE_ENV = 'production'
    assert.equal(getConfiguredOrigin(), null)
    process.env.NODE_ENV = 'development'
    assert.equal(getConfiguredOrigin(), 'http://localhost:3000')
  })
})

describe('readJsonBody', () => {
  const post = (body) => new Request('https://example.com/api', { method: 'POST', body })

  test('parses a valid body', async () => {
    assert.deepEqual(await readJsonBody(post('{"a":1}'), 100), { a: 1 })
  })

  test('rejects an empty body and malformed JSON as invalid, not as a crash', async () => {
    await assert.rejects(readJsonBody(post(''), 100), InvalidJsonError)
    await assert.rejects(readJsonBody(post('{nope'), 100), InvalidJsonError)
  })

  test('rejects a body larger than the cap while it is being read', async () => {
    await assert.rejects(readJsonBody(post('{"a":"' + 'x'.repeat(50) + '"}'), 10), BodyTooLargeError)
  })

  test('payloadTooLarge answers 413 and forbids caching', () => {
    const response = payloadTooLarge()
    assert.equal(response.status, 413)
    assert.equal(response.headers.get('cache-control'), 'no-store')
  })
})

describe('proxyVideo upstream failures', () => {
  const request = () => new Request('https://example.com/api/video')

  test('answers 504 when the origin cannot be reached', async () => {
    const response = await proxyVideo(request(), 'public', async () => {
      throw new Error('network down')
    })
    assert.equal(response.status, 504)
  })

  test('passes a 416 through and turns any other origin error into 502', async () => {
    const answer = (status) => proxyVideo(request(), 'public', async () => new Response(null, { status }))
    assert.equal((await answer(416)).status, 416)
    assert.equal((await answer(500)).status, 502)
    assert.equal((await answer(404)).status, 502)
  })
})

describe('numbers and bookings at the edges', () => {
  test('toCents reads whole-number strings and negative values exactly', () => {
    assert.equal(toCents('12'), 1200n)
    assert.equal(toCents('-0.5'), -50n)
    assert.throws(() => toCents('1.234'), RangeError)
  })

  test('safeDivide refuses results that are not finite numbers', () => {
    assert.equal(safeDivide(1, 0), null)
    assert.equal(safeDivide(Number.NaN, 2), null)
    assert.equal(safeDivide(1e308, 1e-308), null)
    assert.equal(safeDivide(9, 3), 3)
  })

  test('the owner email for a viewing without an email says so', () => {
    const mail = bookingNotificationEmail(
      {
        id: 'bk_2',
        kind: 'viewing',
        startsAt: '2026-10-12T10:00:00.000Z',
        listingRef: 'Villa 3',
        name: 'Omar',
        phone: '+15550111',
      },
      'https://x/c',
    )
    assert.equal(mail.subject, '🔥 New viewing request via Sarah - Omar (language not given)')
    assert.equal(mail.text.includes('Email: not given'), true)
  })
})
