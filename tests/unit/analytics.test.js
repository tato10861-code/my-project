/**
 * @fileoverview Unit tests for the analytics helpers.
 */
import assert from 'node:assert/strict'
import { isAutomatedTraffic, percentChange } from '../../lib/analytics'

test('percentChange compares the recent period with the one before it', () => {
  assert.equal(percentChange(150, 100), 50)
  assert.equal(percentChange(50, 100), -50)
  assert.equal(percentChange(100, 100), 0)
  assert.equal(percentChange(2, 3), -33)
  assert.equal(percentChange(0, 4), -100)
})

test('percentChange has no value for a change from zero', () => {
  assert.equal(percentChange(0, 0), 0)
  assert.equal(percentChange(5, 0), null)
})

test('isAutomatedTraffic flags crawlers, scripts and missing agents', () => {
  for (const agent of [
    'Googlebot/2.1 (+http://www.google.com/bot.html)',
    'Mozilla/5.0 HeadlessChrome/120',
    'curl/8.4.0',
    'python-requests/2.31',
    'Vercel-Screenshot preview',
    '',
    null,
    undefined,
  ]) {
    assert.equal(isAutomatedTraffic(agent), true, String(agent))
  }
})

test('isAutomatedTraffic lets real browsers through', () => {
  assert.equal(
    isAutomatedTraffic(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    ),
    false,
  )
  assert.equal(
    isAutomatedTraffic(
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1',
    ),
    false,
  )
})
