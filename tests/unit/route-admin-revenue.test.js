/**
 * @fileoverview Endpoint-level tests for the owner-only revenue endpoint.
 */
import assert from 'node:assert/strict'

const mockRequireOwner = jest.fn()
const mockRows = { value: [] }
jest.mock('@/lib/auth', () => ({ requireOwner: (...args) => mockRequireOwner(...args) }))
jest.mock('@/lib/db', () => ({
  db: {
    select: () => ({
      from: () => (mockRows.value instanceof Error ? Promise.reject(mockRows.value) : Promise.resolve(mockRows.value)),
    }),
  },
}))

import { GET } from '../../app/api/admin/revenue/route'

const body = async (response) => JSON.parse(await response.text())
const request = () => new Request('https://propauto.example/api/admin/revenue')

beforeEach(() => {
  mockRows.value = []
  mockRequireOwner.mockReset().mockResolvedValue({ user: { email: 'owner@example.com' } })
  jest.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => jest.restoreAllMocks())

test('answers 401 to a caller who is not the owner', async () => {
  mockRequireOwner.mockResolvedValue(null)
  assert.equal((await GET(request())).status, 401)
})

test('returns the recurring-revenue summary for the owner', async () => {
  mockRows.value = [
    {
      id: 'sub_1',
      plan: 'growth',
      status: 'active',
      cancelAtPeriodEnd: false,
      trialEnd: null,
      currentPeriodEnd: null,
      livemode: true,
    },
  ]
  const response = await GET(request())
  assert.equal(response.status, 200)
  const data = await body(response)
  assert.equal(data.mrrCents, 14_900)
  assert.equal(data.activeCount, 1)
})

test('answers 503 when the database fails', async () => {
  mockRows.value = new Error('down')
  assert.equal((await GET(request())).status, 503)
})
