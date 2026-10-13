import { verifyBookingToken } from '@/lib/bookings'
import { confirmBooking } from '@/lib/db/bookings'

// Opened from the team's notification email. The HMAC token in the link is the
// only authorization, so an unsigned or altered link cannot confirm a booking.
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const token = new URL(request.url).searchParams.get('token') ?? ''
  const secret = process.env.BOOKING_SECRET

  if (!secret || secret.length < 32) {
    return text('Booking confirmation is not configured.', 503)
  }
  if (!verifyBookingToken(id, token, secret)) {
    return text('Invalid confirmation link.', 403)
  }

  const result = await confirmBooking(id)
  const messages: Record<typeof result, [string, number]> = {
    confirmed: ['Booking confirmed. The customer can be told the time is set.', 200],
    already_confirmed: ['This booking was already confirmed.', 200],
    cancelled: ['This booking was cancelled and cannot be confirmed.', 409],
    not_found: ['Booking not found.', 404],
  }
  const [message, status] = messages[result]
  return text(message, status)
}

function text(body: string, status: number) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } })
}
