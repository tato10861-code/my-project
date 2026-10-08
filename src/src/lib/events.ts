/**
 * @fileoverview Visitor event vocabulary shared by the ingestion endpoint and
 * the reporting queries, so a name counted in a report is always a name the
 * ingestion endpoint accepts.
 */
import { z } from 'zod'

export const EVENT_NAMES = [
  'page_view',
  'asset_view',
  'cta_click',
  'lead_started',
  'lead_submitted',
  'checkout_started',
  'chat_started',
  'conversation_started',
] as const

export type EventName = (typeof EVENT_NAMES)[number]

/** Maximum accepted body size for an event beacon, in bytes. */
export const EVENT_MAX_BODY_BYTES = 16_384

export const eventSchema = z.object({
  sessionId: z.string().trim().regex(/^[A-Za-z0-9._:-]{8,120}$/),
  eventName: z.enum(EVENT_NAMES),
  path: z.string().trim().regex(/^\/[A-Za-z0-9/_?&=.%#-]{0,299}$/).default('/'),
  metadata: z.record(z.string(), z.string().max(200)).refine((value) => Object.keys(value).length <= 20).default({}),
})

export type VisitorEvent = z.infer<typeof eventSchema>
