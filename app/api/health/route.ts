import { NextResponse } from 'next/server'
import { healthReport } from '@/lib/health'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export function GET() {
  return NextResponse.json(healthReport(), { headers: { 'Cache-Control': 'no-store' } })
}
