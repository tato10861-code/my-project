/**
 * @fileoverview The reporting queries may only count event names that the
 * ingestion endpoint accepts.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { EVENT_NAMES, eventSchema } from '../../lib/events.ts'

test('every event name counted by analytics is accepted by ingestion', async () => {
  for (const file of ['app/api/analytics/route.ts', 'app/api/admin/analytics/route.ts']) {
    const source = await readFile(new URL(`../../${file}`, import.meta.url), 'utf8')
    const counted = [...source.matchAll(/'([a-z_]+)'/g)].map((match) => match[1]).filter((name) => /_(view|started|click|submitted)$/.test(name))
    for (const name of counted) assert.ok(EVENT_NAMES.includes(name), `${file} counts "${name}" which ingestion rejects`)
  }
})

test('eventSchema validates the beacon the home page sends', () => {
  const parsed = eventSchema.parse({ sessionId: '6f1c2a9e-1b2c-4d5e-8f90-123456789abc', eventName: 'page_view', path: '/', metadata: { language: 'en' } })
  assert.equal(parsed.eventName, 'page_view')
})

test('eventSchema rejects unknown names and unsafe paths', () => {
  assert.equal(eventSchema.safeParse({ sessionId: 'abcdefgh', eventName: 'drop_table' }).success, false)
  assert.equal(eventSchema.safeParse({ sessionId: 'abcdefgh', eventName: 'page_view', path: 'javascript:alert(1)' }).success, false)
  assert.equal(eventSchema.safeParse({ sessionId: 'short', eventName: 'page_view' }).success, false)
})
