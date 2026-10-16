/**
 * @fileoverview Endpoint-level tests for POST /api/events: origin check, rate
 * limit, validation, the byte cap, the automated-traffic filter and storage
 * failure, with the database mocked at its boundary.
 */
import assert from 'node:assert/strict'

const mockValues = jest.fn()
const mockCheckRateLimit = jest.fn()
jest.mock('@/lib/db', () => ({ db: { insert: jest.fn(() => ({ values: (...args) => mockValues(...args) })) } }))
jest.mock('@/lib/db/rate-limit', () => ({ checkRateLimit: (...args) => mockCheckRateLimit(...args) }))

import { POST } from '../../app/api/events/route'

const BROWSER =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'
const valid = { sessionId: 'session-12345', eventName: 'page_view', path: '/', metadata: { language: 'en' } }

const post = (body, headers = {}) =>
  new Request('https://propauto.example/api/events', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'user-agent': BROWSER,
      origin: 'https://propauto.example',
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

beforeEach(() => {
  mockValues.mockReset().mockResolvedValue(undefined)
  mockCheckRateLimit.mockReset().mockResolvedValue({ allowed: true, retryAfter: 1 })
})

test('stores a valid event from a browser', async () => {
  const response = await POST(post(valid))
  assert.equal(response.status, 201)
  assert.equal(mockValues.mock.calls.length, 1)
  assert.equal(mockValues.mock.calls[0][0].eventName, 'page_view')
})

test('rejects a request from another origin before touching the store', async () => {
  const response = await POST(post(valid, { origin: 'https://evil.example' }))
  assert.equal(response.status, 403)
  assert.equal(mockCheckRateLimit.mock.calls.length, 0)
  assert.equal(mockValues.mock.calls.length, 0)
})

test('answers 429 with Retry-After when the rate limit is exhausted', async () => {
  mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfter: 17 })
  const response = await POST(post(valid))
  assert.equal(response.status, 429)
  assert.equal(response.headers.get('retry-after'), '17')
  assert.equal(mockValues.mock.calls.length, 0)
})

test('answers 400 for an unknown event name or malformed JSON', async () => {
  assert.equal((await POST(post({ ...valid, eventName: 'drop_tables' }))).status, 400)
  assert.equal((await POST(post('{not json'))).status, 400)
  assert.equal(mockValues.mock.calls.length, 0)
})

test('answers 413 for a body over the cap', async () => {
  const response = await POST(post({ ...valid, metadata: { a: 'x'.repeat(200) }, padding: 'y'.repeat(20_000) }))
  assert.equal(response.status, 413)
})

test('acknowledges but does not store automated traffic', async () => {
  for (const agent of ['Googlebot/2.1', 'curl/8.4.0', '']) {
    const response = await POST(post(valid, { 'user-agent': agent }))
    assert.equal(response.status, 202, agent)
  }
  assert.equal(mockValues.mock.calls.length, 0)
})

test('answers 503 and marks it retryable when storage fails', async () => {
  mockValues.mockRejectedValue(new Error('connection refused'))
  const response = await POST(post(valid))
  assert.equal(response.status, 503)
  assert.equal((await response.json()).retryable, true)
})
