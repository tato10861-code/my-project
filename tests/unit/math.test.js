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
} from '../../lib/math'

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

test('toCents keeps precision for large numbers and exact halves', () => {
  // 9007199254740.99 * 100 does not land on an integer in floating point.
  assert.equal(toCents(9007199254740.99), 900719925474099n)
  assert.equal(toCents(4503599627370.5), 450359962737050n)
  // Exact binary halves round away from zero instead of toward +infinity.
  assert.equal(toCents(0.125), 13n)
  assert.equal(toCents(-0.125), -13n)
  assert.equal(toCents(-2.675), -267n)
  assert.equal(toCents(-0.004), 0n)
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
  assert.equal(fromCents(MAX_CENTS), 90071992547409.91)
  for (const cents of [1n, 7n, 10n, 99n, 123456789n, -5n]) {
    assert.equal(toCents(String(fromCents(cents))), cents)
  }
})

test('formatMoney groups thousands and pads cents', () => {
  assert.equal(formatMoney(490000n), 'USD 4,900.00')
  assert.equal(formatMoney(1n), 'USD 0.01')
  assert.equal(formatMoney(0n), 'USD 0.00')
  assert.equal(formatMoney(-123456n), '-USD 1,234.56')
  assert.equal(formatMoney(999999999n, 'EUR', 'de-DE'), 'EUR 9.999.999,99')
})

test('formatMoney keeps every digit near the supported maximum', () => {
  assert.equal(formatMoney(MAX_CENTS), 'USD 90,071,992,547,409.91')
  assert.equal(formatMoney(-MAX_CENTS), '-USD 90,071,992,547,409.91')
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

test('computeRoi reports gains as gains when the base is negative', () => {
  const recovery = computeRoi(-10000n, -5000n)
  assert.equal(recovery.basisPoints, 5000)
  assert.equal(recovery.percent, '+50.00%')
  assert.equal(recovery.positive, true)

  const deeper = computeRoi(-10000n, -15000n)
  assert.equal(deeper.percent, '-50.00%')
  assert.equal(deeper.positive, false)
})

test('computeRoi rounds basis points to the nearest instead of truncating', () => {
  // 1/3 = 33.33...% -> 3333 bp; 2/3 = 66.66...% -> 6667 bp (truncation gave 6666).
  assert.equal(computeRoi(30000n, 40000n).basisPoints, 3333)
  assert.equal(computeRoi(30000n, 50000n).basisPoints, 6667)
  assert.equal(computeRoi(30000n, 50000n).percent, '+66.67%')
  // The percent string and the number always agree.
  assert.equal(computeRoi(30000n, 10000n).basisPoints, -6667)
  assert.equal(computeRoi(30000n, 10000n).percent, '-66.67%')
})

test('computeRoi rounds an exact half away from zero, for gains and losses', () => {
  // 1/20000 * 10000 = 0.5 bp
  assert.equal(computeRoi(20000n, 20001n).basisPoints, 1)
  assert.equal(computeRoi(20000n, 19999n).basisPoints, -1)
  assert.equal(computeRoi(20000n, 20001n).positive, true)
  // Below half a basis point is no change at all.
  assert.equal(computeRoi(30000n, 30001n).basisPoints, 0)
  assert.equal(computeRoi(30000n, 30001n).percent, '0.00%')
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

test('scaleCents rounds negatives symmetrically, half away from zero', () => {
  assert.equal(scaleCents(-100n, 1n, 3n), -33n)
  assert.equal(scaleCents(-100n, 2n, 3n), -67n)
  assert.equal(scaleCents(100n, 1n, -3n), -33n)
  assert.equal(scaleCents(-100n, 1n, -3n), 33n)
  assert.equal(scaleCents(5n, 1n, 2n), 3n)
  assert.equal(scaleCents(-5n, 1n, 2n), -3n)
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
  assert.equal(clampInt(Number.NEGATIVE_INFINITY, 0, 10), 0)
})

test('clampInt always returns an integer', () => {
  assert.equal(clampInt(2.4, 0, 10), 2)
  assert.equal(clampInt(2.5, 0, 10), 3)
  assert.equal(clampInt(-0.2, -5, 5), 0)
  assert.equal(Object.is(clampInt(-0.2, -5, 5), 0), true)
  assert.equal(clampInt(10.4, 0, 10), 10)
})

test('clampInt rejects inverted or fractional bounds', () => {
  assert.throws(() => clampInt(5, 10, 0), RangeError)
  assert.throws(() => clampInt(5, 0.5, 10), RangeError)
  assert.throws(() => clampInt(5, 0, Number.POSITIVE_INFINITY), RangeError)
})

test('constants are stable', () => {
  assert.equal(MONEY_DECIMALS, 2)
  assert.equal(CENTS_PER_UNIT, 100n)
  assert.equal(MAX_CENTS, 9007199254740991n)
})
