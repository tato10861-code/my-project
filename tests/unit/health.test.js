/**
 * @fileoverview The liveness payload monitors poll; it must stay shallow.
 */
import assert from 'node:assert/strict'
import { healthReport } from '../../lib/health'

test('healthReport names the short deployed commit and the current time', () => {
  const now = new Date('2026-10-09T12:00:00.000Z')
  assert.deepEqual(healthReport({ VERCEL_GIT_COMMIT_SHA: '603101cabcdef' }, now), {
    status: 'ok',
    version: '603101c',
    time: '2026-10-09T12:00:00.000Z',
  })
})

test('healthReport reports "dev" when no commit is known', () => {
  for (const env of [{}, { VERCEL_GIT_COMMIT_SHA: '' }, { VERCEL_GIT_COMMIT_SHA: '   ' }]) {
    assert.equal(healthReport(env).version, 'dev')
  }
})

test('healthReport exposes nothing beyond status, version and time', () => {
  assert.deepEqual(Object.keys(healthReport({ DATABASE_URL: 'postgres://secret' })).sort(), [
    'status',
    'time',
    'version',
  ])
})
