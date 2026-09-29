import { NextRequest, NextResponse } from 'next/server'
import { requireOwner } from '@/lib/auth'

const VIDEO_SOURCE = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/d1f2fb50-a0ab-11f1-881d-6515b107900b%20%281%29-k9MtgLxwIC9J0FfT2EjdxeNpddGKsu.mp4'

export async function GET(request: NextRequest) {
  const session = await requireOwner(request.headers)

  if (!session) {
    return NextResponse.json({ error: 'Owner access required' }, { status: 401 })
  }

  const range = request.headers.get('range')
  const response = await fetch(VIDEO_SOURCE, {
    headers: range ? { range } : undefined,
    cache: 'no-store',
  })

  if (!response.ok && response.status !== 206) {
    return NextResponse.json({ error: 'Video unavailable' }, { status: response.status })
  }

  const headers = new Headers()
  headers.set('Content-Type', response.headers.get('content-type') ?? 'video/mp4')
  headers.set('Cache-Control', 'private, no-store')
  headers.set('Accept-Ranges', 'bytes')

  for (const name of ['content-length', 'content-range']) {
    const value = response.headers.get(name)
    if (value) headers.set(name, value)
  }

  return new NextResponse(response.body, {
    status: response.status,
    headers,
  })
}
