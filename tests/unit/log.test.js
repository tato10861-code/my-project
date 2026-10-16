/**
 * @fileoverview Structured logger: one JSON line per event, scalar fields only.
 */
import assert from 'node:assert/strict'
import { errorMessage, log } from '../../lib/log'

afterEach(() => jest.restoreAllMocks())

test('writes one JSON line with level, event, time and the given fields', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => undefined)
  log('error', 'stripe-webhook.recording_failed', { error: 'db down', attempt: 2 })
  assert.equal(spy.mock.calls.length, 1)
  const line = JSON.parse(spy.mock.calls[0][0])
  assert.equal(line.level, 'error')
  assert.equal(line.event, 'stripe-webhook.recording_failed')
  assert.equal(line.error, 'db down')
  assert.equal(line.attempt, 2)
  assert.ok(!Number.isNaN(Date.parse(line.time)))
})

test('routes each level to its console method', () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  const info = jest.spyOn(console, 'info').mockImplementation(() => undefined)
  log('warn', 'a.b')
  log('info', 'c.d')
  assert.equal(warn.mock.calls.length, 1)
  assert.equal(info.mock.calls.length, 1)
  assert.equal(JSON.parse(info.mock.calls[0][0]).event, 'c.d')
})

test('errorMessage keeps only the message, never a stack', () => {
  assert.equal(errorMessage(new Error('boom')), 'boom')
  assert.equal(errorMessage('plain'), 'plain')
  assert.equal(errorMessage({ secret: 'x' }), 'unknown error')
  assert.equal(errorMessage(undefined), 'unknown error')
})
