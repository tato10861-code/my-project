/**
 * @fileoverview Unit tests for the precise financial arithmetic module.
 *
 * Runs with the built-in Node test runner (no third-party dependencies):
 *   node --test tests/unit/
 *
 * The suite aggressively exercises boundary values, malformed input, currency
 * floating-point traps, and overflow limits to guarantee the financial math
 * never drifts or throws unexpected errors in production.
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  MONEY_DECIMALS,
  CENTS_PER_UNIT,
  MAX_CENTS,
  toCents,
  fromCents,
  formatMoney,
  computeRoi,
  addCents,
  subCents,
  scaleCents,
  safeDivide,
  clampInt,
} from '../../lib/math.ts'

test('toCents converts whole numbers exactly', () => {
  assert.equal(toCents(0), 0n)
  assert.equal(toCents(1), 100n)
  assert.equal(toCents(4900), 490000n)
  assert.equal(toCents(-25), -2500n)
})

test('toCents handles the classic floating-point trap 0.1 + 0.2', () => {
  assert.equal(toCents(0.1 + 0.2), 30n)
  assert.equal(toCents(0.1) + toCents(0.2), 30n)
})

test('toCents rounds to the nearest cent for numbers', () => {
  assert.equal(toCents(1.005), 100n)
  assert.equal(toCents(1.999), 200n)
  assert.equal(toCents(0.004), 0n)
})

test('toCents parses decimal strings without drift', () => {
  assert.equal(toCents('0'), 0n)
  assert.equal(toCents('12.3'), 1230n)
  assert.equal(toCents('12.34'), 1234n)
  assert.equal(toCents('0.01'), 1n)
  assert.equal(toCents('-7.50'), -750n)
  assert.equal(toCents(' 42 '), 4200n)
})

test('toCents rejects malformed and out-of-bounds input', () => {
  assert.throws(() => toCents(''), RangeError)
  assert.throws(() => toCents('abc'), RangeError)
  assert.throws(() => toCents('1.234'), RangeError)
  assert.throws(() => toCents('--1'), RangeError)
  assert.throws(() => toCents(Number.NaN), RangeError)
  assert.throws(() => toCents(Number.POSITIVE_INFINITY), RangeError)
  assert.throws(() => toCents(Number.NEGATIVE_INFINITY), RangeError)
})

test('fromCents round-trips exactly', () => {
  assert.equal(fromCents(0n), 0)
  assert.equal(fromCents(100n), 1)
  assert.equal(fromCents(1234n), 12.34)
  assert.equal(fromCents(-750n), -7.5)
})

test('formatMoney groups thousands and pads cents', () => {
  assert.equal(formatMoney(490000n), 'USD 4,900.00')
  assert.equal(formatMoney(1n), 'USD 0.01')
  assert.equal(formatMoney(0n), 'USD 0.00')
  assert.equal(formatMoney(-123456n), '-USD 1,234.56')
  assert.equal(formatMoney(999999999n, 'EUR', 'de-DE'), 'EUR 9,999,999.99')
})

test('computeRoi produces the +18.6% style signals precisely', () => {
  const roi = computeRoi(100000n, 118600n)
  assert.equal(roi.basisPoints, 1860)
  assert.equal(roi.percent, '+18.60%')
  assert.equal(roi.positive, true)
})

test('computeRoi handles losses, zero, and negative bases', () => {
  const loss = computeRoi(100000n, 80000n)
  assert.equal(loss.percent, '-20.00%')
  assert.equal(loss.positive, false)

  const flat = computeRoi(5000n, 5000n)
  assert.equal(flat.percent, '0.00%')
  assert.equal(flat.positive, false)

  const zeroBase = computeRoi(0n, 100n)
  assert.equal(zeroBase.percent, '0.00%')
  assert.equal(zeroBase.basisPoints, 0)
})

test('addCents and subCents are exact', () => {
  assert.equal(addCents(10n, 20n), 30n)
  assert.equal(subCents(20n, 10n), 10n)
  assert.equal(addCents(-5n, 5n), 0n)
  assert.throws(() => addCents(MAX_CENTS, 1n), RangeError)
  assert.throws(() => subCents(-MAX_CENTS, 1n), RangeError)
})

test('scaleCents rounds to the nearest cent', () => {
  assert.equal(scaleCents(100n, 1n, 3n), 33n)
  assert.equal(scaleCents(100n, 2n, 3n), 67n)
  assert.equal(scaleCents(100n, 3n, 3n), 100n)
  assert.throws(() => scaleCents(100n, 1n, 0n), RangeError)
})

test('safeDivide returns null instead of NaN/Infinity', () => {
  assert.equal(safeDivide(10, 4), 2.5)
  assert.equal(safeDivide(10, 0), null)
  assert.equal(safeDivide(Number.NaN, 2), null)
  assert.equal(safeDivide(10, Number.POSITIVE_INFINITY), null)
})

test('clampInt bounds values defensively', () => {
  assert.equal(clampInt(5, 0, 10), 5)
  assert.equal(clampInt(-5, 0, 10), 0)
  assert.equal(clampInt(15, 0, 10), 10)
  assert.equal(clampInt(Number.NaN, 0, 10), 0)
  assert.equal(clampInt(Number.POSITIVE_INFINITY, 0, 10), 10)
})

test('constants are stable', () => {
  assert.equal(MONEY_DECIMALS, 2)
  assert.equal(CENTS_PER_UNIT, 100n)
  assert.equal(MAX_CENTS, 9007199254740991n)
})