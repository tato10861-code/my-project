import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
import { z } from 'zod'
import { db } from '@/lib/db'
import { propautoEvents } from '@/lib/db/schema'

const eventSchema = z.object({
  sessionId: z.string().min(8).max(120),
  eventName: z.string().min(1).max(80),
  path: z.string().max(300).default('/'),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export async function POST(request: Request) {
  try {
    const payload = eventSchema.parse(await request.json())
    await db.insert(propautoEvents).values(payload)
    return NextResponse.json({ ok: true }, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    console.error('[v0] event tracking failed:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Event tracking temporarily unavailable', retryable: true }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
