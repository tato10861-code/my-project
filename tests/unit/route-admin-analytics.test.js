/**
 * @fileoverview Endpoint-level tests for the owner-only analytics endpoints.
 */
import assert from 'node:assert/strict'

const mockRequireOwner = jest.fn()
const mockResults = []
/** A thenable query builder: every method returns it, awaiting it yields the next canned result. */
const builder = () => {
  const node = {}
  for (const method of ['from', 'where', 'orderBy', 'groupBy', 'limit']) node[method] = () => node
  node.then = (resolve, reject) => Promise.resolve(mockResults.shift()).then(resolve, reject)
  return node
}
jest.mock('@/lib/auth', () => ({ requireOwner: (...args) => mockRequireOwner(...args) }))
jest.mock('@/lib/db', () => ({ db: { select: () => builder() } }))

import { GET as adminGet } from '../../app/api/admin/analytics/route'
import { GET as publicGet } from '../../app/api/analytics/route'

const body = async (response) => JSON.parse(await response.text())
const get = (url) => new Request(url)

beforeEach(() => {
  mockResults.length = 0
  mockRequireOwner.mockReset().mockResolvedValue({ user: { email: 'owner@example.com' } })
  jest.spyOn(console, 'error').mockImplementation(() => undefined)
})
afterEach(() => jest.restoreAllMocks())

test('both endpoints answer 401 to a caller who is not the owner', async () => {
  mockRequireOwner.mockResolvedValue(null)
  assert.equal((await adminGet(get('https://propauto.example/api/admin/analytics'))).status, 401)
  assert.equal((await publicGet(get('https://propauto.example/api/analytics'))).status, 401)
})

test('admin analytics reports lifetime visitors and live visitors separately', async () => {
  // Query order: lifetime visitors, live (last 5 minutes), leads, operator logs, recent events.
  mockResults.push([{ total: 120 }], [{ total: 3 }], [{ total: 9 }], [{ total: 40 }], [{ id: 1, eventName: 'page_view' }])
  const response = await adminGet(get('https://propauto.example/api/admin/analytics'))
  assert.equal(response.status, 200)
  const data = await body(response)
  assert.equal(data.visitors, 120)
  assert.equal(data.liveVisitors, 3)
  assert.equal(data.leads, 9)
  assert.equal(data.botActions, 40)
})

test('admin analytics answers 503 when the database fails', async () => {
  mockResults.push(Promise.reject(new Error('down')))
  assert.equal((await adminGet(get('https://propauto.example/api/admin/analytics'))).status, 503)
})

test('public analytics reports a true period-over-period change', async () => {
  // Order: visitors, last 24h, previous 24h, leads last 24h, leads previous 24h, asset views, leads, conversations, sources.
  mockResults.push([{ total: 500 }], [{ total: 150 }], [{ total: 100 }], [{ total: 3 }], [{ total: 6 }], [{ total: 70 }], [{ total: 20 }], [{ total: 11 }], [{ source: 'Direct', total: 3 }, { source: 'Ads', total: 1 }])
  const response = await publicGet(get('https://propauto.example/api/analytics'))
  assert.equal(response.status, 200)
  const data = await body(response)
  assert.equal(data.visitors.total, 500)
  assert.equal(data.visitors.change, 50)
  assert.equal(data.visitors.qualifiedChange, -50)
  assert.deepEqual(data.sources, [{ label: 'Direct', value: 75 }, { label: 'Ads', value: 25 }])
})

test('public analytics has no change figure when there is no earlier period', async () => {
  mockResults.push([{ total: 5 }], [{ total: 5 }], [{ total: 0 }], [{ total: 1 }], [{ total: 0 }], [{ total: 0 }], [{ total: 1 }], [{ total: 0 }], [])
  const data = await body(await publicGet(get('https://propauto.example/api/analytics')))
  assert.equal(data.visitors.change, null)
  assert.equal(data.visitors.qualifiedChange, null)
  assert.deepEqual(data.sources, [])
})
