/**
 * @fileoverview Precise financial arithmetic for PropAuto AI.
 *
 * All monetary values are represented as integer cents backed by BigInt so that
 * ROI, yield, and liquidation calculations never accumulate floating-point
 * drift (0.1 + 0.2 !== 0.3 class of bugs). Every function in this module is a
 * pure function with O(1) time and O(1) space complexity and throws explicit
 * RangeError instances on malformed or out-of-bounds input instead of
 * silently returning NaN or Infinity.
 */

/** Number of decimal places used for all monetary values. */
export const MONEY_DECIMALS = 2

/** BigInt multiplier used to convert a decimal amount into integer cents. */
export const CENTS_PER_UNIT = 100n

/** Maximum absolute value, in cents, accepted by {@link toCents} (2^53-1). */
export const MAX_CENTS = BigInt(Number.MAX_SAFE_INTEGER)

/** Result of a return-on-investment computation. */
export interface RoiResult {
  /** Signed ratio in basis points (1 bp = 0.01%). */
  basisPoints: number
  /** Precisely formatted percentage string, e.g. "+18.60%" or "-3.14%". */
  percent: string
  /** True when the investment gained value, false when it lost value. */
  positive: boolean
}

/**
 * Converts a decimal amount (number or numeric string) into integer cents.
 *
 * @param amount - A finite number or a string matching `-?\d+(\.\d{1,2})?`.
 *   Trailing whitespace is tolerated; more than two decimals are rejected so
 *   that no rounding ambiguity can be introduced by the caller.
 * @returns The amount expressed as integer cents (BigInt).
 * @throws {RangeError} When the input is NaN, Infinity, empty, malformed, or
 *   exceeds {@link MAX_CENTS} in absolute value.
 * @complexity O(1) time, O(1) space.
 */
export function toCents(amount: number | string): bigint {
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) {
      throw new RangeError('toCents: amount must be a finite number')
    }
    // At 1e21 and above every double is an integer, and toFixed would switch to
    // exponent notation, so scale those exactly in BigInt instead.
    if (Math.abs(amount) >= 1e21) return assertWithinBounds(BigInt(amount) * CENTS_PER_UNIT)
    // toFixed rounds the double's exact binary value (ties away from zero), so
    // there is no floating-point multiply to lose precision or misplace a half.
    return toCents(amount.toFixed(MONEY_DECIMALS))
  }

  const normalized = amount.trim()
  if (normalized === '') {
    throw new RangeError('toCents: amount must not be empty')
  }
  const match = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(normalized)
  if (match === null) {
    throw new RangeError('toCents: invalid decimal format')
  }
  const sign = match[1] === '-' ? -1n : 1n
  const whole = BigInt(match[2])
  const fraction = BigInt((match[3] ?? '').padEnd(MONEY_DECIMALS, '0') || '0')
  return assertWithinBounds(sign * (whole * CENTS_PER_UNIT + fraction))
}

/**
 * Converts integer cents back into a decimal number (dollars).
 *
 * @param cents - The monetary value in cents.
 * @returns The equivalent decimal amount as a number.
 * @throws {RangeError} When cents exceeds {@link MAX_CENTS} in absolute value.
 * @complexity O(1) time, O(1) space.
 */
export function fromCents(cents: bigint): number {
  const bounded = assertWithinBounds(cents)
  const absolute = bounded < 0n ? -bounded : bounded
  const whole = absolute / CENTS_PER_UNIT
  const fraction = (absolute % CENTS_PER_UNIT).toString().padStart(MONEY_DECIMALS, '0')
  // Parsing the exact decimal string yields the closest double to the true value.
  return Number(`${bounded < 0n ? '-' : ''}${whole}.${fraction}`)
}

/**
 * Formats integer cents as a locale-aware amount prefixed with the currency
 * code. Grouping and decimal separators follow the locale; the integer part is
 * grouped from its exact decimal digits, never through a floating-point value,
 * so amounts up to {@link MAX_CENTS} keep every digit.
 *
 * @param cents - The monetary value in cents (may be negative).
 * @param currency - ISO 4217 currency code, defaults to "USD".
 * @param locale - BCP 47 locale tag, defaults to "en-US".
 * @returns A formatted string, e.g. "USD 4,900.00" or, for de-DE,
 *   "EUR 4.900,00".
 * @throws {RangeError} When cents exceeds {@link MAX_CENTS}.
 * @complexity O(d) time and space, where d is the number of digits.
 */
export function formatMoney(cents: bigint, currency = 'USD', locale = 'en-US'): string {
  const bounded = assertWithinBounds(cents)
  const absolute = bounded < 0n ? -bounded : bounded
  const whole = (absolute / CENTS_PER_UNIT).toString()
  const fraction = (absolute % CENTS_PER_UNIT).toString().padStart(MONEY_DECIMALS, '0')
  const { group, decimal } = localeSeparators(locale)
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, group)
  return `${bounded < 0n ? '-' : ''}${currency} ${grouped}${decimal}${fraction}`
}

function localeSeparators(locale: string): { group: string; decimal: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234567.5)
  return {
    group: parts.find((part) => part.type === 'group')?.value ?? ',',
    decimal: parts.find((part) => part.type === 'decimal')?.value ?? '.',
  }
}

/**
 * Integer division that rounds to the nearest whole number, with exact halves
 * rounded away from zero. BigInt `/` truncates toward zero, which understates a
 * gain or loss by up to one basis point.
 *
 * @param numerator - The dividend.
 * @param denominator - The divisor, which must be positive.
 */
function roundedQuotient(numerator: bigint, denominator: bigint): bigint {
  const negative = numerator < 0n
  const magnitude = negative ? -numerator : numerator
  const rounded = (2n * magnitude + denominator) / (2n * denominator)
  return negative ? -rounded : rounded
}

/**
 * Computes the return on investment between two precise cent values.
 *
 * @param initialCents - The starting value in cents (may be zero).
 * @param currentCents - The current value in cents.
 * @returns An {@link RoiResult} with basis points (rounded to the nearest, exact
 *   halves away from zero), a formatted percent string that is built from that
 *   same rounded value, and a positivity flag. The change is measured against the absolute
 *   value of the initial amount, so a move from -100 to -50 is a gain. A zero
 *   initial value, or no change, yields a neutral "0.00%" result.
 * @throws {RangeError} When either value exceeds {@link MAX_CENTS}.
 * @complexity O(1) time, O(1) space.
 */
export function computeRoi(initialCents: bigint, currentCents: bigint): RoiResult {
  const initial = assertWithinBounds(initialCents)
  const current = assertWithinBounds(currentCents)
  if (initial === 0n) {
    return { basisPoints: 0, percent: '0.00%', positive: false }
  }
  const delta = current - initial
  const base = initial < 0n ? -initial : initial
  const basisPoints = Number(roundedQuotient(delta * 10000n, base))
  const sign = basisPoints < 0 ? '-' : basisPoints > 0 ? '+' : ''
  const absoluteBp = Math.abs(basisPoints)
  const whole = Math.floor(absoluteBp / 100)
  const fraction = Math.abs(absoluteBp % 100)
  const percent = `${sign}${whole}.${fraction.toString().padStart(MONEY_DECIMALS, '0')}%`
  return { basisPoints, percent, positive: basisPoints > 0 }
}

/**
 * Adds two precise cent values.
 *
 * @param leftCents - First operand in cents.
 * @param rightCents - Second operand in cents.
 * @returns The sum in cents.
 * @throws {RangeError} When the result exceeds {@link MAX_CENTS}.
 * @complexity O(1) time, O(1) space.
 */
export function addCents(leftCents: bigint, rightCents: bigint): bigint {
  return assertWithinBounds(leftCents + rightCents)
}

/**
 * Subtracts two precise cent values.
 *
 * @param leftCents - Minuend in cents.
 * @param rightCents - Subtrahend in cents.
 * @returns The difference in cents.
 * @throws {RangeError} When the result exceeds {@link MAX_CENTS}.
 * @complexity O(1) time, O(1) space.
 */
export function subCents(leftCents: bigint, rightCents: bigint): bigint {
  return assertWithinBounds(leftCents - rightCents)
}

/**
 * Scales a precise cent value by an integer ratio.
 *
 * @param cents - The base value in cents.
 * @param numerator - Numerator of the scale ratio.
 * @param denominator - Denominator of the scale ratio; must be non-zero.
 * @returns The scaled value in cents, rounded to the nearest cent with
 *   halves rounded away from zero (so results are symmetric for negatives).
 * @throws {RangeError} When the denominator is zero or the result exceeds
 *   {@link MAX_CENTS}.
 * @complexity O(1) time, O(1) space.
 */
export function scaleCents(cents: bigint, numerator: bigint, denominator: bigint): bigint {
  if (denominator === 0n) {
    throw new RangeError('scaleCents: denominator must not be zero')
  }
  const product = cents * numerator
  const negative = product < 0n !== denominator < 0n
  const absProduct = product < 0n ? -product : product
  const absDenominator = denominator < 0n ? -denominator : denominator
  const quotient = absProduct / absDenominator
  const rounded = (absProduct % absDenominator) * 2n >= absDenominator ? quotient + 1n : quotient
  return assertWithinBounds(negative ? -rounded : rounded)
}

/**
 * Safely divides two integers, returning null when the divisor is zero.
 *
 * @param numerator - The dividend.
 * @param denominator - The divisor.
 * @returns The quotient as a number, or null when the divisor is zero or the
 *   quotient is not finite.
 * @complexity O(1) time, O(1) space.
 */
export function safeDivide(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null
  }
  const quotient = numerator / denominator
  return Number.isFinite(quotient) ? quotient : null
}

/**
 * Clamps an integer to the inclusive [min, max] range.
 *
 * @param value - The value to clamp. NaN clamps to `min`; infinities clamp
 *   to the nearest bound; fractions round to the nearest integer.
 * @param min - Lower bound (inclusive), an integer.
 * @param max - Upper bound (inclusive), an integer.
 * @returns The clamped integer.
 * @throws {RangeError} When a bound is not an integer or `min` exceeds `max`.
 * @complexity O(1) time, O(1) space.
 */
export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new RangeError('clampInt: bounds must be integers')
  }
  if (min > max) throw new RangeError('clampInt: min must not exceed max')
  if (Number.isNaN(value)) return min
  // `+ 0` turns a rounded -0 into 0.
  return Math.round(Math.min(Math.max(value, min), max)) + 0
}

function assertWithinBounds(cents: bigint): bigint {
  if (cents < -MAX_CENTS || cents > MAX_CENTS) {
    throw new RangeError('toCents: amount exceeds supported range')
  }
  return cents
}
