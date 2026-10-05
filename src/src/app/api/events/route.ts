import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
import { z } from 'zod'
import { db } from '@/lib/db'
import { propautoEvents } from '@/lib/db/schema'

const eventSchema = z.object({
  sessionId: z.string().trim().regex(/^[A-Za-z0-9._:-]{8,120}$/),
  eventName: z.enum(['page_view', 'cta_click', 'lead_started', 'lead_submitted', 'checkout_started', 'chat_started']),
  path: z.string().trim().regex(/^\/[A-Za-z0-9/_?&=.%#-]{0,299}$/).default('/'),
  metadata: z.record(z.string(), z.string().max(200)).refine((value) => Object.keys(value).length <= 20).default({}),
})

const MAX_BODY_BYTES = 16_384

function isBodyTooLarge(request: Request) {
  const length = request.headers.get('content-length')
  return length !== null && Number(length) > MAX_BODY_BYTES
}

export async function POST(request: Request) {
  if (request.method !== 'POST' || isBodyTooLarge(request)) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413, headers: { 'Cache-Control': 'no-store' } })
  }

  let payload: z.infer<typeof eventSchema>
  try {
    payload = eventSchema.parse(await request.json())
  } catch {
    return NextResponse.json({ error: 'Invalid event details' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  try {
    await db.insert(propautoEvents).values(payload)
    return NextResponse.json({ ok: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[v0] event tracking failed:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Event tracking temporarily unavailable', retryable: true }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
