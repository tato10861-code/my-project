import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' }
import { count, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { propautoEvents, propautoLeads } from '@/lib/db/schema'

export async function GET() {
  try {
    const [visitors, recentVisitors, assetViews, leads, conversations, sources] = await Promise.all([
      db.select({ total: sql<number>`count(distinct ${propautoEvents.sessionId})` }).from(propautoEvents).where(eq(propautoEvents.eventName, 'page_view')),
      db.select({ total: sql<number>`count(distinct ${propautoEvents.sessionId})` }).from(propautoEvents).where(sql`${propautoEvents.eventName} = 'page_view' and ${propautoEvents.createdAt} >= now() - interval '24 hours'`),
      db.select({ total: count() }).from(propautoEvents).where(eq(propautoEvents.eventName, 'asset_view')),
      db.select({ total: count() }).from(propautoLeads),
      db.select({ total: count() }).from(propautoEvents).where(eq(propautoEvents.eventName, 'conversation_started')),
      db.select({ source: sql<string>`coalesce(${propautoEvents.metadata}->>'source', 'Direct')`, total: sql<number>`count(distinct ${propautoEvents.sessionId})` }).from(propautoEvents).where(eq(propautoEvents.eventName, 'page_view')).groupBy(sql`coalesce(${propautoEvents.metadata}->>'source', 'Direct')`).orderBy(sql`count(distinct ${propautoEvents.sessionId}) desc`),
    ])
    const liveVisitors = Number(visitors[0]?.total ?? 0)
    const totalVisitors = liveVisitors
    const recentVisitorCount = Number(recentVisitors[0]?.total ?? 0)
    const totalLeads = Number(leads[0]?.total ?? 0)
    const totalSources = sources.reduce((sum, item) => sum + Number(item.total), 0)
    return NextResponse.json({
      source: 'database',
      updatedAt: new Date().toISOString(),
      visitors: { total: totalVisitors, change: recentVisitorCount, qualified: totalLeads, qualifiedChange: 0 },
      funnel: [
        { label: 'Landing visits', value: totalVisitors },
        { label: 'Asset views', value: Number(assetViews[0]?.total ?? 0) },
        { label: 'Qualified leads', value: totalLeads },
        { label: 'Executive conversations', value: Number(conversations[0]?.total ?? 0) },
      ],
      sources: sources.map((item) => ({ label: item.source, value: totalSources ? Math.round((Number(item.total) / totalSources) * 100) : 0 })),
    }, { headers: noStoreHeaders })
  } catch (error) {
    console.error('[v0] public analytics query failed', error)
    return NextResponse.json({ error: 'Analytics unavailable' }, { status: 503 })
  }
}
