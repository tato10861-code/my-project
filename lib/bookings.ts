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
  /** Language the customer is writing in, in plain English (for example "Arabic"). */
  language: z.string().trim().max(40).optional(),
  /** One short line on what the customer wants, for the team's email. Not stored. */
  notes: z.string().trim().max(500).optional(),
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

/** How long a confirmation link stays valid after it is issued. */
export const CONFIRMATION_LINK_TTL_MS = 72 * 60 * 60 * 1000

/**
 * HMAC over the booking id and, when given, the link's expiry. Binding the
 * expiry into the signature means it cannot be extended by editing the URL.
 */
export function signBookingToken(bookingId: string, secret: string, expiresAt?: number): string {
  const payload = expiresAt === undefined ? bookingId : `${bookingId}.${expiresAt}`
  return createHmac('sha256', secret).update(payload).digest('hex')
}

/**
 * True when `token` was issued by this server for the booking and `expiresAt`
 * is still in the future. A link without a valid expiry never verifies, so an
 * old or leaked link stops working once its window has passed.
 */
export function verifyBookingToken(bookingId: string, token: string, secret: string, expiresAt: number, now: number = Date.now()): boolean {
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) return false
  const expected = Buffer.from(signBookingToken(bookingId, secret, expiresAt))
  const given = Buffer.from(token)
  return expected.length === given.length && timingSafeEqual(expected, given)
}

export function confirmationUrl(baseUrl: string, bookingId: string, secret: string, now: number = Date.now()): string {
  const base = baseUrl.replace(/\/$/, '')
  const expiresAt = now + CONFIRMATION_LINK_TTL_MS
  return `${base}/api/bookings/${encodeURIComponent(bookingId)}/confirm?exp=${expiresAt}&token=${signBookingToken(bookingId, secret, expiresAt)}`
}

/** Plain-text owner notification. Names and phones are plain text, never HTML. */
export function bookingNotificationEmail(booking: BookingRequest & { id: string }, link: string) {
  const when = new Date(booking.startsAt).toUTCString()
  // Customer-supplied text in a header: collapse line breaks so it cannot add headers.
  const header = (value: string) => value.replace(/[\r\n]+/g, ' ').trim()
  return {
    subject: `🔥 New ${booking.kind === 'viewing' ? 'viewing' : 'test drive'} request via Sarah - ${header(booking.name)} (${header(booking.language ?? 'language not given')})`,
    text: [
      `Customer: ${booking.name}`,
      `Phone: ${booking.phone}`,
      `Email: ${booking.email ?? 'not given'}`,
      `Language: ${booking.language ?? 'not given'}`,
      `Notes: ${booking.notes ?? 'none'}`,
      `Requested: ${booking.kind} for ${booking.listingRef} at ${when}`,
      '',
      `Confirm this booking: ${link}`,
    ].join('\n'),
  }
}
