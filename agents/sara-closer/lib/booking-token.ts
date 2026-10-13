import { createHmac, timingSafeEqual } from "node:crypto";

// The confirmation link carries an HMAC of the booking id, so only links
// Sara generated can confirm a booking. Requires BOOKING_SECRET (32+ chars).

function secret(): string {
  const value = process.env.BOOKING_SECRET;
  if (!value || value.length < 32) throw new Error("BOOKING_SECRET must be set to at least 32 characters.");
  return value;
}

export function signBooking(bookingId: string): string {
  return createHmac("sha256", secret()).update(bookingId).digest("hex");
}

export function verifyBookingToken(bookingId: string, token: string): boolean {
  const expected = Buffer.from(signBooking(bookingId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
