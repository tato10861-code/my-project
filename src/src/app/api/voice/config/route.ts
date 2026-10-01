import { NextResponse } from 'next/server'

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY

  if (!publicKey) {
    return NextResponse.json({ enabled: false }, { status: 503 })
  }

  return NextResponse.json({ enabled: true, publicKey, assistantId: '161586da-d430-4469-bfd9-eb0d9c4f5a0e' }, {
    headers: { 'Cache-Control': 'private, max-age=300' },
  })
}
