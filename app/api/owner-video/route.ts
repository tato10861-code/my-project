import { NextResponse } from 'next/server'
import { requireOwner } from '@/lib/auth'
import { proxyVideo } from '@/lib/video-proxy'

export async function GET(request: Request) {
  const session = await requireOwner(request.headers)
  if (!session) return NextResponse.json({ error: 'Owner access required' }, { status: 401, headers: { 'Cache-Control': 'no-store' } })
  return proxyVideo(request, 'private')
}
