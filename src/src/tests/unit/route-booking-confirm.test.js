/**
 * @fileoverview Endpoint-level tests for the booking confirmation link:
 * GET only shows a page, POST confirms, links expire, and a cross-origin POST
 * is refused. The booking store is mocked at its boundary.
 */
import assert from 'node:assert/strict'

const mockConfirm = jest.fn()
jest.mock('@/lib/db/bookings', () => ({ confirmBooking: (...args) => mockConfirm(...args) }))

import { GET, POST } from '../../app/api/bookings/[id]/confirm/route'
import { CONFIRMATION_LINK_TTL_MS, confirmationUrl } from '../../lib/bookings'

const SECRET = 's'.repeat(40)
const ORIGIN = 'https://propauto.example'
const params = (id) => ({ params: Promise.resolve({ id }) })
const link = (id = 'bk_1', now = Date.now()) => confirmationUrl(ORIGIN, id, SECRET, now)
const request = (url, method, headers = {}) => new Request(url, { method, headers: { origin: ORIGIN, ...headers } })

const saved = { ...process.env }
beforeEach(() => {
  mockConfirm.mockReset().mockResolvedValue('confirmed')
  process.env.BOOKING_SECRET = SECRET
})
afterEach(() => {
  process.env = { ...saved }
})

test('GET shows a confirmation page and never changes the booking', async () => {
  const response = await GET(request(link(), 'GET'), params('bk_1'))
  assert.equal(response.status, 200)
  assert.match(response.headers.get('content-type'), /text\/html/)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.match(await response.text(), /<form method="post">/)
  assert.equal(mockConfirm.mock.calls.length, 0)
})

test('POST with a valid link confirms the booking', async () => {
  const response = await POST(request(link(), 'POST'), params('bk_1'))
  assert.equal(response.status, 200)
  assert.equal(mockConfirm.mock.calls.length, 1)
  assert.equal(mockConfirm.mock.calls[0][0], 'bk_1')
})

test('a link is refused once it has expired, for both GET and POST', async () => {
  const issued = Date.now() - CONFIRMATION_LINK_TTL_MS - 1000
  const expired = link('bk_1', issued)
  assert.equal((await GET(request(expired, 'GET'), params('bk_1'))).status, 403)
  assert.equal((await POST(request(expired, 'POST'), params('bk_1'))).status, 403)
  assert.equal(mockConfirm.mock.calls.length, 0)
})

test('a link for another booking, a missing token or a tampered expiry is refused', async () => {
  assert.equal((await POST(request(link('bk_1'), 'POST'), params('bk_2'))).status, 403)
  assert.equal((await POST(request(`${ORIGIN}/api/bookings/bk_1/confirm`, 'POST'), params('bk_1'))).status, 403)
  const tampered = link().replace(/exp=\d+/, `exp=${Date.now() + 10 * CONFIRMATION_LINK_TTL_MS}`)
  assert.equal((await POST(request(tampered, 'POST'), params('bk_1'))).status, 403)
  assert.equal(mockConfirm.mock.calls.length, 0)
})

test('a cross-origin POST is refused before anything is checked', async () => {
  const response = await POST(request(link(), 'POST', { origin: 'https://evil.example' }), params('bk_1'))
  assert.equal(response.status, 403)
  assert.equal(mockConfirm.mock.calls.length, 0)
})

test('answers 503 when the booking secret is missing or too short', async () => {
  delete process.env.BOOKING_SECRET
  assert.equal((await GET(request(link(), 'GET'), params('bk_1'))).status, 503)
  process.env.BOOKING_SECRET = 'short'
  assert.equal((await POST(request(link(), 'POST'), params('bk_1'))).status, 503)
})

test('maps each store outcome to its status', async () => {
  const outcomes = { confirmed: 200, already_confirmed: 200, cancelled: 409, not_found: 404 }
  for (const [outcome, status] of Object.entries(outcomes)) {
    mockConfirm.mockResolvedValue(outcome)
    assert.equal((await POST(request(link(), 'POST'), params('bk_1'))).status, status, outcome)
  }
})
