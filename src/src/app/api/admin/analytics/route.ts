import { NextResponse } from 'next/server'
import { count, desc, sql } from 'drizzle-orm'
import { requireOwner } from '@/lib/auth'
import { db } from '@/lib/db'
import { propautoEvents, propautoLeads, propautoOperatorLogs } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: Request) {
  if (!(await requireOwner(request.headers))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
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
    console.error('[admin-analytics] query failed:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Analytics unavailable' }, { status: 503 })
  }
}
