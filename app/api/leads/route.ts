import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { db } from '@/lib/db'
import { propautoLeads } from '@/lib/db/schema'
import {
  buildLeadEmail,
  isMissingColumnError,
  LEAD_MAX_BODY_BYTES,
  leadIdempotencyKey,
  leadRow,
  leadSchema,
  type Lead,
} from '@/lib/leads'
import {
  BodyTooLargeError,
  getClientKey,
  payloadTooLarge,
  readJsonBody,
  tooManyRequests,
  crossOriginForbidden,
  isSameOriginRequest,
} from '@/lib/request-security'
import { notifyEmail } from '@/lib/site-config'
import { checkRateLimit } from '@/lib/db/rate-limit'
import { errorMessage, log } from '@/lib/log'

const noStore = { 'Cache-Control': 'no-store' }

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginForbidden()
  const limit = await checkRateLimit(getClientKey(request, 'leads'), 5)
  if (!limit.allowed) return tooManyRequests(limit.retryAfter)

  let payload: Lead
  try {
    payload = leadSchema.parse(await readJsonBody(request, LEAD_MAX_BODY_BYTES))
  } catch (error) {
    if (error instanceof BodyTooLargeError) return payloadTooLarge()
    return NextResponse.json({ ok: false, error: 'Invalid lead details' }, { status: 400, headers: noStore })
  }

  try {
    await saveLead(payload)
  } catch (error) {
    log('error', 'leads.storage_failed', { error: errorMessage(error) })
    return NextResponse.json(
      { ok: false, saved: false, retryable: true, error: 'Lead storage is temporarily unavailable.' },
      { status: 503, headers: noStore },
    )
  }

  // The lead is stored from here on. A notification failure must not invite the
  // visitor to submit again, so it is reported as accepted-but-not-delivered.
  const apiKey = process.env.RESEND_API_KEY_2 ?? process.env.RESEND_API_KEY
  if (!apiKey) {
    log('warn', 'leads.owner_notification_skipped', { reason: 'email delivery is not configured' })
    return NextResponse.json({ ok: true, saved: true, delivered: false }, { status: 202, headers: noStore })
  }

  try {
    const { subject, html } = buildLeadEmail(payload)
    const { error } = await new Resend(apiKey).emails.send(
      {
        from: process.env.RESEND_FROM_EMAIL ?? 'PropAuto Sales Team <onboarding@resend.dev>',
        to: [notifyEmail()],
        replyTo: payload.email,
        subject,
        html,
      },
      { idempotencyKey: leadIdempotencyKey(payload) },
    )
    if (error) throw new Error(error.message)
  } catch (error) {
    log('error', 'leads.owner_notification_failed', { error: errorMessage(error) })
    return NextResponse.json({ ok: true, saved: true, delivered: false }, { status: 202, headers: noStore })
  }

  return NextResponse.json({ ok: true, saved: true, delivered: true }, { headers: noStore })
}

/**
 * Stores the lead with all its details. If the details migration has not been
 * applied yet, stores the core fields rather than losing the lead.
 */
async function saveLead(lead: Lead) {
  const row = leadRow(lead)
  try {
    await db.insert(propautoLeads).values(row)
  } catch (error) {
    if (!isMissingColumnError(error)) throw error
    log('error', 'leads.detail_columns_missing', { fix: 'apply db/migrations/0001_lead_details.sql' })
    await db.insert(propautoLeads).values({ name: row.name, email: row.email, intent: row.intent, source: row.source })
  }
}
