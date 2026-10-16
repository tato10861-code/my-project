/**
 * @fileoverview Unit tests for booking slots, confirmation tokens and the owner email.
 */
import assert from 'node:assert/strict'
import {
  CONFIRMATION_LINK_TTL_MS,
  bookingNotificationEmail,
  bookingRequestSchema,
  buildSlots,
  confirmationUrl,
  isBookableSlot,
  signBookingToken,
  verifyBookingToken,
} from '../../lib/bookings'

const SECRET = 'x'.repeat(40)
const NOW = new Date('2026-10-12T08:00:00Z')

test('buildSlots offers the open hours of each day, in order', () => {
  const slots = buildSlots(NOW, 2, new Set())
  assert.deepEqual(slots.slice(0, 4), [
    '2026-10-12T10:00:00.000Z',
    '2026-10-12T12:00:00.000Z',
    '2026-10-12T15:00:00.000Z',
    '2026-10-12T17:00:00.000Z',
  ])
  assert.equal(slots.length, 8)
})

test('buildSlots skips taken starts and past times', () => {
  const slots = buildSlots(NOW, 1, new Set(['2026-10-12T10:00:00.000Z']))
  assert.equal(slots.includes('2026-10-12T10:00:00.000Z'), false)
  assert.equal(buildSlots(new Date('2026-10-12T11:00:00Z'), 1, new Set()).includes('2026-10-12T10:00:00.000Z'), false)
})

test('isBookableSlot accepts only future, on-the-hour, open-hour times', () => {
  assert.equal(isBookableSlot('2026-10-12T12:00:00.000Z', NOW), true)
  assert.equal(isBookableSlot('2026-10-12T13:00:00.000Z', NOW), false)
  assert.equal(isBookableSlot('2026-10-12T12:30:00.000Z', NOW), false)
  assert.equal(isBookableSlot('2026-10-11T12:00:00.000Z', NOW), false)
  assert.equal(isBookableSlot('not-a-date', NOW), false)
})

const EXPIRES = NOW.getTime() + CONFIRMATION_LINK_TTL_MS

test('confirmation tokens verify only for their own booking, secret and expiry', () => {
  const token = signBookingToken('bk_1', SECRET, EXPIRES)
  assert.equal(verifyBookingToken('bk_1', token, SECRET, EXPIRES, NOW.getTime()), true)
  assert.equal(verifyBookingToken('bk_2', token, SECRET, EXPIRES, NOW.getTime()), false)
  assert.equal(verifyBookingToken('bk_1', token, 'y'.repeat(40), EXPIRES, NOW.getTime()), false)
  assert.equal(verifyBookingToken('bk_1', 'short', SECRET, EXPIRES, NOW.getTime()), false)
  // Extending the expiry in the URL invalidates the signature.
  assert.equal(verifyBookingToken('bk_1', token, SECRET, EXPIRES + 1, NOW.getTime()), false)
})

test('confirmation tokens stop verifying once the link has expired', () => {
  const token = signBookingToken('bk_1', SECRET, EXPIRES)
  assert.equal(verifyBookingToken('bk_1', token, SECRET, EXPIRES, EXPIRES - 1), true)
  assert.equal(verifyBookingToken('bk_1', token, SECRET, EXPIRES, EXPIRES), false)
  assert.equal(verifyBookingToken('bk_1', token, SECRET, EXPIRES, EXPIRES + 1), false)
})

test('a token without a usable expiry never verifies', () => {
  const legacy = signBookingToken('bk_1', SECRET)
  assert.equal(verifyBookingToken('bk_1', legacy, SECRET, Number.NaN, NOW.getTime()), false)
  assert.equal(verifyBookingToken('bk_1', legacy, SECRET, 0, NOW.getTime()), false)
})

test('confirmationUrl builds an absolute, expiring link with the token', () => {
  const url = confirmationUrl('https://propauto.example/', 'bk_1', SECRET, NOW.getTime())
  assert.equal(url.startsWith('https://propauto.example/api/bookings/bk_1/confirm?exp='), true)
  assert.equal(
    url,
    `https://propauto.example/api/bookings/bk_1/confirm?exp=${EXPIRES}&token=${signBookingToken('bk_1', SECRET, EXPIRES)}`,
  )
})

test('bookingRequestSchema rejects unknown kinds and short phones', () => {
  const base = {
    kind: 'viewing',
    startsAt: '2026-10-12T10:00:00.000Z',
    listingRef: 'Villa 4',
    name: 'Ada',
    phone: '+15550100',
  }
  assert.equal(bookingRequestSchema.safeParse(base).success, true)
  assert.equal(bookingRequestSchema.safeParse({ ...base, kind: 'lunch' }).success, false)
  assert.equal(bookingRequestSchema.safeParse({ ...base, phone: '12' }).success, false)
})

test('owner email is plain text and carries the confirmation link', () => {
  const mail = bookingNotificationEmail(
    {
      id: 'bk_1',
      kind: 'test_drive',
      startsAt: '2026-10-12T10:00:00.000Z',
      listingRef: 'Car 9',
      name: 'Ada <b>',
      phone: '+15550100',
    },
    'https://x/confirm',
  )
  assert.equal(mail.subject, '🔥 New test drive request via Sarah - Ada <b> (language not given)')
  assert.equal(mail.text.includes('Ada <b>'), true)
  assert.equal(mail.text.endsWith('Confirm this booking: https://x/confirm'), true)
})

test('owner email subject names the customer and language, and cannot carry extra headers', () => {
  const base = {
    id: 'bk_2',
    kind: 'viewing',
    startsAt: '2026-10-12T10:00:00.000Z',
    listingRef: 'Villa 4',
    phone: '+15550100',
  }
  const mail = bookingNotificationEmail(
    { ...base, name: 'Lina\r\nBcc: x@y.z', language: 'Arabic', notes: 'Wants a sea view' },
    'https://x/confirm',
  )
  assert.equal(mail.subject.includes('\n'), false)
  assert.equal(mail.subject.endsWith('(Arabic)'), true)
  assert.equal(mail.text.includes('Notes: Wants a sea view'), true)
})
