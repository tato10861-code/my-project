import { NextRequest, NextResponse } from 'next/server'

const VIDEO_SOURCE = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/d1f2fb50-a0ab-11f1-881d-6515b107900b%20%281%29-k9MtgLxwIC9J0FfT2EjdxeNpddGKsu.mp4'

export async function GET(request: NextRequest) {
  const range = request.headers.get('range')
  const response = await fetch(VIDEO_SOURCE, {
    headers: range ? { range } : undefined,
    cache: 'no-store',
  })

  if (!response.ok && response.status !== 206) {
    return NextResponse.json({ error: 'Video unavailable' }, { status: response.status })
  }

  const headers = new Headers({
    'Content-Type': response.headers.get('content-type') ?? 'video/mp4',
    'Cache-Control': 'public, max-age=3600',
    'Accept-Ranges': 'bytes',
    'Content-Disposition': 'inline',
    'X-Content-Type-Options': 'nosniff',
  })

  for (const name of ['content-length', 'content-range']) {
    const value = response.headers.get(name)
    if (value) headers.set(name, value)
  }

  return new NextResponse(response.body, { status: response.status, headers })
}
