/**
 * @fileoverview Unit tests for the shared (cross-instance) rate limit, run
 * against an in-memory fake of the counter table.
 */
import assert from 'node:assert/strict'
import { sharedRateLimit } from '../../lib/rate-limit-shared'
import { WINDOW_MS } from '../../lib/request-security'

/** Fakes propauto_rate_limits: `INSERT ... RETURNING` plus the previous-window read, and the prune. */
function fakeStore() {
  const rows = new Map()
  const calls = []
  const query = async (text, values) => {
    calls.push(text.trim().split(/\s+/)[0])
    if (text.includes('DELETE')) {
      for (const [id] of rows) if (new Date(id.split('|')[1]) < values[0]) rows.delete(id)
      return { rows: [] }
    }
    const [key, windowStart, previousStart] = values
    const id = `${key}|${windowStart.toISOString()}`
    rows.set(id, (rows.get(id) ?? 0) + 1)
    return { rows: [{ current: rows.get(id), previous: rows.get(`${key}|${previousStart.toISOString()}`) ?? 0 }] }
  }
  return { rows, calls, query }
}

const NEVER_PRUNE = () => 1
const T0 = 10 * WINDOW_MS

test('allows requests up to the limit and rejects the next one', async () => {
  const store = fakeStore()
  const results = []
  for (let i = 0; i < 6; i++) results.push((await sharedRateLimit(store.query, 'leads:1.2.3.4', 5, T0 + 1000, NEVER_PRUNE)).allowed)
  assert.deepEqual(results, [true, true, true, true, true, false])
})

test('counters are shared by every caller of the same store, so instances cannot each spend the budget', async () => {
  const store = fakeStore()
  // Two "instances" with their own memory but one store: 3 + 3 requests against a limit of 5.
  const instanceA = () => sharedRateLimit(store.query, 'leads:ip', 5, T0 + 1000, NEVER_PRUNE)
  const instanceB = () => sharedRateLimit(store.query, 'leads:ip', 5, T0 + 2000, NEVER_PRUNE)
  const allowed = []
  for (let i = 0; i < 3; i++) { allowed.push((await instanceA()).allowed); allowed.push((await instanceB()).allowed) }
  assert.equal(allowed.filter(Boolean).length, 5)
})

test('keys are independent', async () => {
  const store = fakeStore()
  for (let i = 0; i < 5; i++) await sharedRateLimit(store.query, 'a', 5, T0, NEVER_PRUNE)
  assert.equal((await sharedRateLimit(store.query, 'b', 5, T0, NEVER_PRUNE)).allowed, true)
})

test('the previous window counts in proportion to how much of it still overlaps', async () => {
  const store = fakeStore()
  for (let i = 0; i < 10; i++) await sharedRateLimit(store.query, 'k', 10, T0, NEVER_PRUNE)
  // Halfway into the next window the previous 10 weigh 5, so 5 more fit and the 6th does not.
  const halfway = T0 + WINDOW_MS + WINDOW_MS / 2
  const results = []
  for (let i = 0; i < 6; i++) results.push((await sharedRateLimit(store.query, 'k', 10, halfway, NEVER_PRUNE)).allowed)
  assert.deepEqual(results, [true, true, true, true, true, false])
})

test('retryAfter is the whole seconds left in the window, at least 1', async () => {
  const store = fakeStore()
  assert.equal((await sharedRateLimit(store.query, 'k', 1, T0 + 15_000, NEVER_PRUNE)).retryAfter, 45)
  assert.equal((await sharedRateLimit(store.query, 'k', 1, T0 + WINDOW_MS - 1, NEVER_PRUNE)).retryAfter, 1)
})

test('occasionally prunes old windows, and a failing prune does not change the answer', async () => {
  const store = fakeStore()
  await sharedRateLimit(store.query, 'old', 5, T0, NEVER_PRUNE)
  const later = T0 + 5 * WINDOW_MS
  const result = await sharedRateLimit(store.query, 'new', 5, later, () => 0)
  assert.equal(result.allowed, true)
  assert.equal(store.calls.includes('DELETE'), true)
  assert.equal([...store.rows.keys()].some((id) => id.startsWith('old|')), false)

  const failingPrune = async (text, values) => {
    if (text.includes('DELETE')) throw new Error('boom')
    return store.query(text, values)
  }
  assert.equal((await sharedRateLimit(failingPrune, 'x', 5, later, () => 0)).allowed, true)
})

test('a store error propagates so the caller can fail open', async () => {
  const broken = async () => { throw new Error('connection refused') }
  await assert.rejects(sharedRateLimit(broken, 'k', 5, T0, NEVER_PRUNE), /connection refused/)
})
