import { NextResponse } from 'next/server'
import { count, eq, sql } from 'drizzle-orm'
import { percentChange } from '@/lib/analytics'
import { requireOwner } from '@/lib/auth'
import { db } from '@/lib/db'
import { propautoEvents, propautoLeads } from '@/lib/db/schema'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const noStoreHeaders = { 'Cache-Control': 'no-store, max-age=0' }

export async function GET(request: Request) {
  // Business aggregates are owner-only, like /api/admin/analytics.
  if (!(await requireOwner(request.headers)))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: noStoreHeaders })
  try {
    const [
      visitors,
      recentVisitors,
      previousVisitors,
      recentLeads,
      previousLeads,
      assetViews,
      leads,
      conversations,
      sources,
    ] = await Promise.all([
      db
        .select({ total: sql<number>`count(distinct ${propautoEvents.sessionId})` })
        .from(propautoEvents)
        .where(eq(propautoEvents.eventName, 'page_view')),
      db
        .select({ total: sql<number>`count(distinct ${propautoEvents.sessionId})` })
        .from(propautoEvents)
        .where(
          sql`${propautoEvents.eventName} = 'page_view' and ${propautoEvents.createdAt} >= now() - interval '24 hours'`,
        ),
      db
        .select({ total: sql<number>`count(distinct ${propautoEvents.sessionId})` })
        .from(propautoEvents)
        .where(
          sql`${propautoEvents.eventName} = 'page_view' and ${propautoEvents.createdAt} >= now() - interval '48 hours' and ${propautoEvents.createdAt} < now() - interval '24 hours'`,
        ),
      db
        .select({ total: count() })
        .from(propautoLeads)
        .where(sql`${propautoLeads.createdAt} >= now() - interval '24 hours'`),
      db
        .select({ total: count() })
        .from(propautoLeads)
        .where(
          sql`${propautoLeads.createdAt} >= now() - interval '48 hours' and ${propautoLeads.createdAt} < now() - interval '24 hours'`,
        ),
      db.select({ total: count() }).from(propautoEvents).where(eq(propautoEvents.eventName, 'asset_view')),
      db.select({ total: count() }).from(propautoLeads),
      db.select({ total: count() }).from(propautoEvents).where(eq(propautoEvents.eventName, 'conversation_started')),
      db
        .select({
          source: sql<string>`coalesce(${propautoEvents.metadata}->>'source', 'Direct')`,
          total: sql<number>`count(distinct ${propautoEvents.sessionId})`,
        })
        .from(propautoEvents)
        .where(eq(propautoEvents.eventName, 'page_view'))
        .groupBy(sql`coalesce(${propautoEvents.metadata}->>'source', 'Direct')`)
        .orderBy(sql`count(distinct ${propautoEvents.sessionId}) desc`),
    ])
    const totalVisitors = Number(visitors[0]?.total ?? 0)
    const recentVisitorCount = Number(recentVisitors[0]?.total ?? 0)
    const totalLeads = Number(leads[0]?.total ?? 0)
    const totalSources = sources.reduce((sum, item) => sum + Number(item.total), 0)
    return NextResponse.json(
      {
        source: 'database',
        updatedAt: new Date().toISOString(),
        visitors: {
          total: totalVisitors,
          change: percentChange(recentVisitorCount, Number(previousVisitors[0]?.total ?? 0)),
          qualified: totalLeads,
          qualifiedChange: percentChange(Number(recentLeads[0]?.total ?? 0), Number(previousLeads[0]?.total ?? 0)),
        },
        funnel: [
          { label: 'Landing visits', value: totalVisitors },
          { label: 'Asset views', value: Number(assetViews[0]?.total ?? 0) },
          { label: 'Qualified leads', value: totalLeads },
          { label: 'Executive conversations', value: Number(conversations[0]?.total ?? 0) },
        ],
        sources: sources.map((item) => ({
          label: item.source,
          value: totalSources ? Math.round((Number(item.total) / totalSources) * 100) : 0,
        })),
      },
      { headers: noStoreHeaders },
    )
  } catch (error) {
    console.error('[analytics] query failed:', error instanceof Error ? error.message : 'unknown error')
    return NextResponse.json({ error: 'Analytics unavailable' }, { status: 503, headers: noStoreHeaders })
  }
}
