import { NextResponse } from 'next/server'

export async function GET() {
  const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY
  const assistantId = process.env.VAPI_ASSISTANT_ID ?? '161586da-d430-4469-bfd9-eb0d9c4f5a0e'

  if (!publicKey) {
    return NextResponse.json({ enabled: false }, { status: 503 })
  }

  return NextResponse.json(
    { enabled: true, publicKey, assistantId },
    {
      headers: { 'Cache-Control': 'private, max-age=300' },
    },
  )
}
