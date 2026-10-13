/**
 * @fileoverview Viewing and test-drive booking rules for Sarah.
 *
 * Kept free of Next.js and database imports so the rules can be unit tested
 * directly. Storage lives in lib/db/bookings.ts.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

/** Hours (UTC) at which viewings and test drives can start. */
export const BOOKING_SLOT_HOURS = [10, 12, 15, 17] as const

export const bookingRequestSchema = z.object({
  kind: z.enum(['viewing', 'test_drive']),
  startsAt: z.string().datetime(),
  listingRef: z.string().trim().min(1).max(160),
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(7).max(30),
  email: z.string().trim().email().max(160).optional(),
  language: z.string().trim().max(20).optional(),
})

export type BookingRequest = z.infer<typeof bookingRequestSchema>

/**
 * Lists the open slots in the next `days` days, skipping past times and any
 * start time already in `taken`.
 */
export function buildSlots(from: Date, days: number, taken: ReadonlySet<string>): string[] {
  const slots: string[] = []
  for (let day = 0; day < days; day++) {
    for (const hour of BOOKING_SLOT_HOURS) {
      const slot = new Date(from)
      slot.setUTCDate(from.getUTCDate() + day)
      slot.setUTCHours(hour, 0, 0, 0)
      const iso = slot.toISOString()
      if (slot.getTime() <= from.getTime() || taken.has(iso)) continue
      slots.push(iso)
    }
  }
  return slots
}

/** True when `startsAt` is one of the bookable slots (on the hour, in range). */
export function isBookableSlot(startsAt: string, now: Date): boolean {
  const slot = new Date(startsAt)
  if (Number.isNaN(slot.getTime()) || slot.getTime() <= now.getTime()) return false
  return slot.getUTCMinutes() === 0 && BOOKING_SLOT_HOURS.includes(slot.getUTCHours() as (typeof BOOKING_SLOT_HOURS)[number])
}

/** HMAC of the booking id. Only links issued by this server can confirm a booking. */
export function signBookingToken(bookingId: string, secret: string): string {
  return createHmac('sha256', secret).update(bookingId).digest('hex')
}

export function verifyBookingToken(bookingId: string, token: string, secret: string): boolean {
  const expected = Buffer.from(signBookingToken(bookingId, secret))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

export function confirmationUrl(baseUrl: string, bookingId: string, secret: string): string {
  const base = baseUrl.replace(/\/$/, '')
  return `${base}/api/bookings/${encodeURIComponent(bookingId)}/confirm?token=${signBookingToken(bookingId, secret)}`
}

/** Plain-text owner notification. Names and phones are plain text, never HTML. */
export function bookingNotificationEmail(booking: BookingRequest & { id: string }, link: string) {
  const when = new Date(booking.startsAt).toUTCString()
  return {
    subject: `Confirm ${booking.kind === 'viewing' ? 'viewing' : 'test drive'}: ${booking.listingRef}`,
    text: [
      `Customer: ${booking.name}`,
      `Phone: ${booking.phone}`,
      `Email: ${booking.email ?? 'not given'}`,
      `Language: ${booking.language ?? 'not given'}`,
      `Requested: ${booking.kind} for ${booking.listingRef} at ${when}`,
      '',
      `Confirm this booking: ${link}`,
    ].join('\n'),
  }
}
