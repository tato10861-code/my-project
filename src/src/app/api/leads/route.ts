import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'
import { db } from '@/lib/db'
import { propautoLeads } from '@/lib/db/schema'
import { escapeHtml } from '@/lib/utils'

const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(7).max(30).optional(),
  intent: z.enum(['buyer', 'investor', 'seller']),
  message: z.string().trim().max(1000).optional(),
  budget: z.string().trim().max(120).optional(),
  language: z.string().trim().max(20).optional(),
})

const COMPANY_EMAIL = process.env.RESEND_TO_EMAIL ?? 'propautoal@gmail.com'

export async function POST(request: Request) {
  try {
    const payload = leadSchema.parse(await request.json())
    // Save lead to DB (minimal fields to avoid PII over-log)
    await db.insert(propautoLeads).values({ name: payload.name, email: payload.email, intent: payload.intent, source: 'web' })

    const apiKey = process.env.RESEND_API_KEY_2 ?? process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json({ ok: false, delivered: false, message: 'Email delivery is not configured.' }, { status: 503 })
    }

    const resend = new Resend(apiKey)
    const from = process.env.RESEND_FROM_EMAIL ?? 'PropAuto Sales Team <onboarding@resend.dev>'
    const { error } = await resend.emails.send(
      {
        from,
        to: [COMPANY_EMAIL],
        subject: `New PropAuto lead: ${payload.name} — ${payload.intent}`,
        html: `<h2>New PropAuto lead</h2><p><strong>Name:</strong> ${escapeHtml(payload.name)}</p><p><strong>Email:</strong> ${escapeHtml(payload.email)}</p><p><strong>Phone:</strong> ${escapeHtml(payload.phone ?? '')}</p><p><strong>Message:</strong> ${escapeHtml(payload.message ?? '')}</p>`,
      },
      { idempotencyKey: `propauto-lead/${crypto.randomUUID()}` },
    )
    if (error) {
      console.error('[v0] lead email failed', error.message)
      return NextResponse.json({ ok: false, delivered: false, message: 'Lead saved, but the owner email could not be delivered.' }, { status: 502 })
    }
    return NextResponse.json({ ok: true, delivered: true, next: 'company-contact' })
  } catch (error) {
    console.error('[v0] lead submission failed', error instanceof Error ? error.message : String(error))
    return NextResponse.json({ ok: false, error: 'Invalid lead details' }, { status: 400 })
  }
}
