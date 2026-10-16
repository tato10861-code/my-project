/**
 * @fileoverview Readiness probe: 200 only when the database answers and
 * sign-in is configured; the payload never carries configuration detail.
 */
import assert from 'node:assert/strict'

const mockQuery = jest.fn()
jest.mock('@/lib/db', () => ({ pool: { query: (...args) => mockQuery(...args) } }))

import { GET } from '../../app/api/ready/route'
import { authConfigured, readinessReport } from '../../lib/health'

const body = async (response) => JSON.parse(await response.text())
const saved = { ...process.env }
beforeEach(() => {
  mockQuery.mockReset().mockResolvedValue({ rows: [{ '?column?': 1 }] })
  process.env.BETTER_AUTH_SECRET = 'a-secret-value'
})
afterEach(() => {
  process.env = { ...saved }
})

test('is ready when the database answers and auth is configured', async () => {
  const response = await GET()
  assert.equal(response.status, 200)
  const data = await body(response)
  assert.equal(data.status, 'ready')
  assert.deepEqual(data.checks, [{ name: 'database', ok: true }, { name: 'auth', ok: true }])
})

test('answers 503 when the database query fails', async () => {
  mockQuery.mockRejectedValue(new Error('connection refused'))
  const response = await GET()
  assert.equal(response.status, 503)
  const data = await body(response)
  assert.equal(data.status, 'degraded')
  assert.equal(data.checks[0].ok, false)
})

test('answers 503 when the sign-in secret is missing', async () => {
  delete process.env.BETTER_AUTH_SECRET
  const response = await GET()
  assert.equal(response.status, 503)
  assert.equal((await body(response)).checks[1].ok, false)
})

test('never leaks the secret or the error text', async () => {
  mockQuery.mockRejectedValue(new Error('password authentication failed for user x'))
  const text = await (await GET()).text()
  assert.ok(!text.includes('a-secret-value'))
  assert.ok(!text.includes('password authentication'))
})

test('readinessReport is degraded when any check fails; authConfigured ignores blanks', () => {
  assert.equal(readinessReport([{ name: 'a', ok: true }, { name: 'b', ok: false }]).status, 'degraded')
  assert.equal(readinessReport([]).status, 'ready')
  assert.equal(authConfigured({ BETTER_AUTH_SECRET: '   ' }), false)
  assert.equal(authConfigured({}), false)
})
