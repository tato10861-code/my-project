/**
 * @fileoverview Booking flow used by Sarah's tools: list free slots, then take
 * a request, email the team a confirmation link, and release the slot if the
 * email cannot be sent. Kept in lib/db because it touches the database.
 */
import { Resend } from 'resend'
import { bookingNotificationEmail, buildSlots, confirmationUrl, isBookableSlot, type BookingRequest } from '@/lib/bookings'
import { cancelBooking, createPendingBooking, takenStarts } from '@/lib/db/bookings'

const DAY_MS = 24 * 60 * 60 * 1000
const DEFAULT_FROM = 'PropAuto Sales <onboarding@resend.dev>'

type Config = { secret: string; baseUrl: string; notifyTo: string; apiKey: string; from: string }

/** Reads the booking settings. Returns null until every required value is set. */
export function bookingConfig(): Config | null {
  const secret = process.env.BOOKING_SECRET
  const baseUrl = process.env.PUBLIC_APP_URL
  const notifyTo = process.env.BOOKING_NOTIFY_EMAIL
  const apiKey = process.env.RESEND_API_KEY_2 ?? process.env.RESEND_API_KEY
  if (!secret || secret.length < 32 || !baseUrl || !notifyTo || !apiKey) return null
  return { secret, baseUrl, notifyTo, apiKey, from: process.env.RESEND_FROM_EMAIL ?? DEFAULT_FROM }
}

export async function freeSlots(now: Date, days: number): Promise<string[]> {
  const taken = await takenStarts(now, new Date(now.getTime() + (days + 1) * DAY_MS))
  return buildSlots(now, days, taken)
}

export type RequestResult = { ok: true; bookingId: string; status: 'pending' } | { ok: false; error: string }

export async function requestBooking(input: BookingRequest, now: Date = new Date()): Promise<RequestResult> {
  const config = bookingConfig()
  if (!config) {
    return { ok: false, error: 'Booking requests are not configured yet. Tell the customer a PropAuto advisor will call them to confirm.' }
  }
  if (!isBookableSlot(input.startsAt, now)) {
    return { ok: false, error: 'That time is not a bookable slot. Check availability and offer one of the returned times.' }
  }

  const created = await createPendingBooking(input)
  if (!created.ok) {
    return { ok: false, error: 'That slot was just taken. Check availability and offer another.' }
  }

  const link = confirmationUrl(config.baseUrl, created.id, config.secret)
  const mail = bookingNotificationEmail({ ...input, id: created.id }, link)
  const { error } = await new Resend(config.apiKey).emails.send({
    from: config.from,
    to: config.notifyTo,
    subject: mail.subject,
    text: mail.text,
  })
  if (error) {
    // Nothing is held without the team seeing it: release the slot and say so.
    await cancelBooking(created.id)
    return { ok: false, error: 'Could not send the confirmation request. Offer another time or ask the customer to wait for a call.' }
  }
  return { ok: true, bookingId: created.id, status: 'pending' }
}
