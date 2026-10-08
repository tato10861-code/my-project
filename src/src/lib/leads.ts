/**
 * @fileoverview Lead intake validation and owner-notification helpers.
 *
 * Kept free of Next.js and database imports so the rules can be unit tested
 * directly under the Node test runner.
 */
import { createHash } from 'node:crypto'
import { z } from 'zod'

/** Maximum accepted body size for a lead submission, in bytes. */
export const LEAD_MAX_BODY_BYTES = 16_384

export const leadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160),
  phone: z.string().trim().min(7).max(30).optional(),
  intent: z.enum(['buyer', 'investor', 'seller']),
  message: z.string().trim().max(4000).optional(),
  budget: z.string().trim().max(120).optional(),
  language: z.string().trim().max(20).optional(),
})

export type Lead = z.infer<typeof leadSchema>

/** Escapes text for safe interpolation into an HTML email body. */
export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ?? character)
}

/**
 * Derives a deterministic idempotency key for the owner notification, so a
 * client retry of the same submission does not send a second email. The
 * provider keeps keys for 24 hours; the date component lets the same person
 * deliberately re-submit on a later day.
 */
export function leadIdempotencyKey(lead: Lead, now = new Date()) {
  const fingerprint = [lead.email.toLowerCase(), lead.name, lead.intent, lead.phone ?? '', lead.budget ?? '', lead.message ?? '', now.toISOString().slice(0, 10)].join('\u0000')
  return `propauto-lead/${createHash('sha256').update(fingerprint).digest('hex').slice(0, 40)}`
}

/** Builds the owner notification email for a lead. */
export function buildLeadEmail(lead: Lead) {
  const row = (label: string, value: string) => `<p><strong>${label}:</strong> ${escapeHtml(value)}</p>`
  return {
    subject: `New PropAuto lead: ${lead.name.replace(/[\r\n]+/g, ' ')} — ${lead.intent}`,
    html: [
      '<h2>New PropAuto lead</h2>',
      row('Name', lead.name),
      row('Email', lead.email),
      row('Phone', lead.phone ?? 'Not provided'),
      row('Budget', lead.budget ?? 'Not provided'),
      row('Interest', lead.intent),
      row('Language', lead.language ?? 'en'),
      row('Message', lead.message ?? ''),
    ].join(''),
  }
}
