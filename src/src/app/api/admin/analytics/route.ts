import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0
import { count, desc, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { propautoEvents, propautoLeads, propautoOperatorLogs } from '@/lib/db/schema'
import { auth, OWNER_EMAIL } from '@/lib/auth'
import { headers } from 'next/headers'

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user || session.user.email.toLowerCase() !== OWNER_EMAIL) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const [events, leads, operators, recent] = await Promise.all([
      db.select({ total: sql<number>`count(distinct case when ${propautoEvents.eventName} = 'page_view' then ${propautoEvents.sessionId} end)` }).from(propautoEvents),
      db.select({ total: count() }).from(propautoLeads),
      db.select({ total: count() }).from(propautoOperatorLogs),
      db.select().from(propautoEvents).orderBy(desc(propautoEvents.createdAt)).limit(12),
    ])
    return NextResponse.json({
      visitors: Number(events[0]?.total ?? 0),
      liveVisitors: Number(events[0]?.total ?? 0),
      leads: Number(leads[0]?.total ?? 0),
      botActions: Number(operators[0]?.total ?? 0),
      recent,
      source: 'neon',
    })
  } catch (error) {
    console.error('[v0] admin analytics query failed', error)
    return NextResponse.json({ error: 'Analytics unavailable' }, { status: 503 })
  }
}
