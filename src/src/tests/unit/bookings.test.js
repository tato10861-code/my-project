/**
 * @fileoverview Unit tests for booking slots, confirmation tokens and the owner email.
 */
import assert from 'node:assert/strict'
import { bookingNotificationEmail, bookingRequestSchema, buildSlots, confirmationUrl, isBookableSlot, signBookingToken, verifyBookingToken } from '../../lib/bookings'

const SECRET = 'x'.repeat(40)
const NOW = new Date('2026-10-12T08:00:00Z')

test('buildSlots offers the open hours of each day, in order', () => {
  const slots = buildSlots(NOW, 2, new Set())
  assert.deepEqual(slots.slice(0, 4), ['2026-10-12T10:00:00.000Z', '2026-10-12T12:00:00.000Z', '2026-10-12T15:00:00.000Z', '2026-10-12T17:00:00.000Z'])
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

test('confirmation tokens verify only for their own booking and secret', () => {
  const token = signBookingToken('bk_1', SECRET)
  assert.equal(verifyBookingToken('bk_1', token, SECRET), true)
  assert.equal(verifyBookingToken('bk_2', token, SECRET), false)
  assert.equal(verifyBookingToken('bk_1', token, 'y'.repeat(40)), false)
  assert.equal(verifyBookingToken('bk_1', 'short', SECRET), false)
})

test('confirmationUrl builds an absolute link with the token', () => {
  const url = confirmationUrl('https://propauto.example/', 'bk_1', SECRET)
  assert.equal(url.startsWith('https://propauto.example/api/bookings/bk_1/confirm?token='), true)
  assert.equal(url.endsWith(signBookingToken('bk_1', SECRET)), true)
})

test('bookingRequestSchema rejects unknown kinds and short phones', () => {
  const base = { kind: 'viewing', startsAt: '2026-10-12T10:00:00.000Z', listingRef: 'Villa 4', name: 'Ada', phone: '+15550100' }
  assert.equal(bookingRequestSchema.safeParse(base).success, true)
  assert.equal(bookingRequestSchema.safeParse({ ...base, kind: 'lunch' }).success, false)
  assert.equal(bookingRequestSchema.safeParse({ ...base, phone: '12' }).success, false)
})

test('owner email is plain text and carries the confirmation link', () => {
  const mail = bookingNotificationEmail({ id: 'bk_1', kind: 'test_drive', startsAt: '2026-10-12T10:00:00.000Z', listingRef: 'Car 9', name: 'Ada <b>', phone: '+15550100' }, 'https://x/confirm')
  assert.equal(mail.subject, 'Confirm test drive: Car 9')
  assert.equal(mail.text.includes('Ada <b>'), true)
  assert.equal(mail.text.endsWith('Confirm this booking: https://x/confirm'), true)
})
