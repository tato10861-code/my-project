/**
 * @fileoverview Endpoint-level tests for POST /api/leads: origin, rate limit,
 * validation, storage (including the missing-column fallback) and the owner
 * notification outcomes, with the database and the email provider mocked.
 */
import assert from 'node:assert/strict'

const mockValues = jest.fn()
const mockSend = jest.fn()
const mockCheckRateLimit = jest.fn()
jest.mock('@/lib/db', () => ({ db: { insert: jest.fn(() => ({ values: (...args) => mockValues(...args) })) } }))
jest.mock('@/lib/db/rate-limit', () => ({ checkRateLimit: (...args) => mockCheckRateLimit(...args) }))
jest.mock('resend', () => ({ Resend: jest.fn(() => ({ emails: { send: (...args) => mockSend(...args) } })) }))

import { POST } from '../../app/api/leads/route'

const lead = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  intent: 'buyer',
  phone: '+15550100',
  message: 'Interested in the villa',
}

const post = (body, headers = {}) =>
  new Request('https://propauto.example/api/leads', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://propauto.example', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

/** Parses a response body into a plain object (a Next response is created in another realm). */
const body = async (response) => JSON.parse(await response.text())

const saved = { ...process.env }
beforeEach(() => {
  mockValues.mockReset().mockResolvedValue(undefined)
  mockSend.mockReset().mockResolvedValue({ error: null })
  mockCheckRateLimit.mockReset().mockResolvedValue({ allowed: true, retryAfter: 1 })
  process.env.RESEND_API_KEY = 're_test_key'
  delete process.env.RESEND_API_KEY_2
  jest.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => {
  jest.restoreAllMocks()
  process.env = { ...saved }
})

test('stores the lead and reports the owner email as delivered', async () => {
  const response = await POST(post(lead))
  assert.equal(response.status, 200)
  assert.deepEqual(await body(response), { ok: true, saved: true, delivered: true })
  assert.equal(mockValues.mock.calls[0][0].email, 'ada@example.com')
  assert.equal(mockSend.mock.calls.length, 1)
  assert.equal(mockSend.mock.calls[0][0].replyTo, 'ada@example.com')
})

test('the owner notification goes to the configured mailbox', async () => {
  assert.deepEqual(mockSend.mock.calls.length, 0)
  process.env.NOTIFY_EMAIL = 'ops@buyer.example'
  await POST(post(lead))
  assert.deepEqual(mockSend.mock.calls[0][0].to, ['ops@buyer.example'])
})

test('rejects another origin, an exhausted rate limit and invalid details', async () => {
  assert.equal((await POST(post(lead, { origin: 'https://evil.example' }))).status, 403)
  mockCheckRateLimit.mockResolvedValue({ allowed: false, retryAfter: 9 })
  const limited = await POST(post(lead))
  assert.equal(limited.status, 429)
  assert.equal(limited.headers.get('retry-after'), '9')
  mockCheckRateLimit.mockResolvedValue({ allowed: true, retryAfter: 1 })
  assert.equal((await POST(post({ ...lead, email: 'not-an-email' }))).status, 400)
  assert.equal((await POST(post({ ...lead, intent: 'thief' }))).status, 400)
  assert.equal(mockValues.mock.calls.length, 0)
})

test('answers 413 for an oversized body', async () => {
  assert.equal((await POST(post({ ...lead, message: 'x'.repeat(20_000) }))).status, 413)
})

test('answers 503 and retryable when storage fails, without emailing', async () => {
  mockValues.mockRejectedValue(new Error('connection refused'))
  const response = await POST(post(lead))
  assert.equal(response.status, 503)
  assert.equal((await response.json()).retryable, true)
  assert.equal(mockSend.mock.calls.length, 0)
})

test('falls back to the core fields when the detail columns are missing', async () => {
  const missing = Object.assign(new Error('column "phone" does not exist'), { code: '42703' })
  mockValues.mockRejectedValueOnce(missing).mockResolvedValueOnce(undefined)
  const response = await POST(post(lead))
  assert.equal(response.status, 200)
  assert.equal(mockValues.mock.calls.length, 2)
  assert.deepEqual(Object.keys(mockValues.mock.calls[1][0]).sort(), ['email', 'intent', 'name', 'source'])
})

test('accepts the lead but reports not delivered when email is not configured or fails', async () => {
  delete process.env.RESEND_API_KEY
  const unconfigured = await POST(post(lead))
  assert.equal(unconfigured.status, 202)
  assert.equal((await unconfigured.json()).delivered, false)

  process.env.RESEND_API_KEY = 're_test_key'
  mockSend.mockResolvedValue({ error: { message: 'provider down' } })
  const failed = await POST(post(lead))
  assert.equal(failed.status, 202)
  assert.deepEqual(await body(failed), { ok: true, saved: true, delivered: false })
})
