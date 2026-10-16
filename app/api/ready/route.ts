import { NextResponse } from 'next/server'
import { pool } from '@/lib/db'
import { authConfigured, readinessReport, type ReadinessCheck } from '@/lib/health'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const DATABASE_TIMEOUT_MS = 2_000

/** True when a trivial query succeeds within the timeout. */
async function databaseReachable(): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    await Promise.race([
      pool.query('select 1'),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), DATABASE_TIMEOUT_MS)
      }),
    ])
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Readiness probe: 200 when the database answers and sign-in is configured,
 * 503 otherwise. Unlike /api/health (liveness, never touches the database),
 * this is for deploy checks and monitors that must know the app can serve.
 */
export async function GET() {
  const checks: ReadinessCheck[] = [
    { name: 'database', ok: await databaseReachable() },
    { name: 'auth', ok: authConfigured() },
  ]
  const report = readinessReport(checks)
  return NextResponse.json(report, {
    status: report.status === 'ready' ? 200 : 503,
    headers: { 'Cache-Control': 'no-store' },
  })
}
