import { verifyBookingToken } from '@/lib/bookings'
import { confirmBooking } from '@/lib/db/bookings'
import { crossOriginForbidden, isSameOriginRequest } from '@/lib/request-security'

// Opened from the team's notification email. The HMAC token in the link is the
// only authorization, and it carries an expiry. GET only shows a page: mail
// scanners and link previews fetch URLs automatically, so a GET must never
// change a booking. The state change is a POST from the button on that page,
// and it is single-use because only a 'pending' booking can be confirmed.

type Params = { params: Promise<{ id: string }> }

type Link = { ok: true; id: string } | { ok: false; response: Response }

async function checkLink(request: Request, { params }: Params): Promise<Link> {
  const { id } = await params
  const url = new URL(request.url)
  const token = url.searchParams.get('token') ?? ''
  const expiresAt = Number(url.searchParams.get('exp'))
  const secret = process.env.BOOKING_SECRET

  if (!secret || secret.length < 32) {
    return { ok: false, response: text('Booking confirmation is not configured.', 503) }
  }
  if (!verifyBookingToken(id, token, secret, expiresAt)) {
    return { ok: false, response: text('Invalid or expired confirmation link.', 403) }
  }
  return { ok: true, id }
}

export async function GET(request: Request, context: Params) {
  const link = await checkLink(request, context)
  if (!link.ok) return link.response
  return html(
    'Confirm booking',
    `<p>Confirm booking <code>${escapeHtml(link.id)}</code>? The customer can then be told the time is set.</p>
<form method="post"><button type="submit">Confirm booking</button></form>`,
    200,
  )
}

export async function POST(request: Request, context: Params) {
  if (!isSameOriginRequest(request)) return crossOriginForbidden()
  const link = await checkLink(request, context)
  if (!link.ok) return link.response

  const result = await confirmBooking(link.id)
  const messages: Record<typeof result, [string, number]> = {
    confirmed: ['Booking confirmed. The customer can be told the time is set.', 200],
    already_confirmed: ['This booking was already confirmed.', 200],
    cancelled: ['This booking was cancelled and cannot be confirmed.', 409],
    not_found: ['Booking not found.', 404],
  }
  const [message, status] = messages[result]
  return text(message, status)
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char] as string)

const headers = (contentType: string) => ({
  'Content-Type': contentType,
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex',
  'Referrer-Policy': 'no-referrer',
})

function html(title: string, body: string, status: number) {
  return new Response(`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>${body}`, {
    status,
    headers: headers('text/html; charset=utf-8'),
  })
}

function text(body: string, status: number) {
  return new Response(body, { status, headers: headers('text/plain; charset=utf-8') })
}
