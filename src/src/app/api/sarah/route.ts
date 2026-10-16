import { createHash } from 'node:crypto'
import { google } from '@ai-sdk/google'
import { generateText, stepCountIs, tool } from 'ai'
import { Resend } from 'resend'
import { z } from 'zod'
import { bookingRequestSchema } from '@/lib/bookings'
import { bookingConfig, freeSlots, requestBooking } from '@/lib/db/booking-service'
import { BodyTooLargeError, getClientKey, payloadTooLarge, readJsonBody, tooManyRequests, crossOriginForbidden, isSameOriginRequest } from '@/lib/request-security'
import { checkRateLimit } from '@/lib/db/rate-limit'
import { runWithModelFallback } from '@/lib/sarah-fallback'
import { sarahModelNames } from '@/lib/sarah-models'
import { fallbackReply, sarahSystem } from '@/lib/sarah-prompt'

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(2000),
  })).min(1).max(30).refine((messages) => messages.some((message) => message.role === 'user')),
  language: z.string().trim().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).default('en'),
})

const MAX_BODY_BYTES = 96_000

const sarahTools = {
  check_availability: tool({
    description: 'List the free viewing or test-drive start times (ISO, UTC) for the next few days. Call this before offering any time.',
    inputSchema: z.object({ days: z.number().int().min(1).max(7).default(3) }),
    execute: async ({ days }) => {
      if (!bookingConfig()) return { slots: [], note: 'Booking is not configured; offer an advisor call instead.' }
      try {
        return { slots: await freeSlots(new Date(), days) }
      } catch (error) {
        console.error('[sarah] availability lookup failed:', error instanceof Error ? error.message : error)
        return { slots: [], note: 'Availability is unavailable right now; offer an advisor call instead.' }
      }
    },
  }),
  request_booking: tool({
    description: 'Request a viewing or test drive at a slot from check_availability. Needs the customer name and phone. The booking stays pending until the team confirms it.',
    inputSchema: bookingRequestSchema,
    execute: async (input) => {
      try {
        return await requestBooking(input)
      } catch (error) {
        console.error('[sarah] booking request failed:', error instanceof Error ? error.message : error)
        return { ok: false, error: 'Booking is unavailable right now. Tell the customer an advisor will call them to confirm.' }
      }
    },
  }),
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginForbidden()
  const clientKey = getClientKey(request, 'sarah')
  const limit = await checkRateLimit(clientKey, 10)
  if (!limit.allowed) return tooManyRequests(limit.retryAfter)

  let parsed: z.infer<typeof requestSchema>
  try {
    parsed = requestSchema.parse(await readJsonBody(request, MAX_BODY_BYTES))
  } catch (error) {
    if (error instanceof BodyTooLargeError) return payloadTooLarge()
    return Response.json({ error: 'Invalid chat request' }, { status: 400, headers: { 'Cache-Control': 'no-store' } })
  }

  const { messages, language } = parsed
  try {
    const latestMessage = messages[messages.length - 1]?.content ?? ''
    const hotLead = /\b(book|booking|viewing|test drive|human|price|interested|buy|rent)\b|حجز|معاينة|موظف|السعر|شراء|إيجار/i.test(latestMessage)
    const resendKey = process.env.RESEND_API_KEY_2 ?? process.env.RESEND_API_KEY
    if (hotLead && resendKey) {
      // The alert is a courtesy to the team: a bad key or a provider outage must
      // never take the customer's conversation down with it.
      try {
        const resend = new Resend(resendKey)
        // Keyed on visitor + message so a retried request does not alert twice,
        // while the same words from a different visitor still do.
        const alertKey = createHash('sha256').update(`${clientKey}\u0000${latestMessage}`).digest('hex').slice(0, 32)
        const { error } = await resend.emails.send(
          {
            from: process.env.RESEND_FROM_EMAIL ?? 'PropAuto Sales <onboarding@resend.dev>',
            to: 'propautoal@gmail.com',
            subject: 'PropAuto hot lead from Sarah',
            text: `A visitor may be ready to buy or book. Latest message: ${latestMessage}`,
          },
          { idempotencyKey: `sarah-alert/${alertKey}` },
        )
        if (error) console.error('[sarah] owner alert failed:', error.message)
      } catch (error) {
        console.error('[sarah] owner alert failed:', error instanceof Error ? error.message : 'unknown error')
      }
    }
    // A Gemini key from Google AI Studio calls Google directly and needs no card
    // on file. Without it the request goes through Vercel AI Gateway.
    const direct = Boolean(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
    // Each free-tier model has its own daily allowance, so when one is spent (or
    // overloaded) the next listed model answers instead of the visitor seeing an error.
    const names = sarahModelNames()
    let toolRan = false
    const attempt = (name: string) =>
      generateText({
        model: direct ? google(name) : `google/${name}`,
        system: sarahSystem(language),
        messages,
        maxOutputTokens: 240,
        temperature: 0.6,
        tools: sarahTools,
        stopWhen: stepCountIs(4),
        // With a spare model, moving on beats retrying the one that just refused:
        // retries on a spent allowance only burn more of it.
        maxRetries: names.length > 1 ? 0 : 1,
        onStepFinish: (step) => {
          if (step.toolCalls?.length) toolRan = true
        },
      })
    const { result, model: used } = await runWithModelFallback(names, attempt, {
      onFailure: (name, error) =>
        console.error('[sarah] model failed:', name, error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error'),
      // A booking may already be stored: never replay the turn on another model.
      stopAfterFailure: () => toolRan,
    })
    // One line per answered turn so a healthy chat is visible in the logs: which
    // provider answered and which tools ran. Never the customer's text.
    const toolsUsed = (result.steps ?? []).flatMap((step) => (step.toolCalls ?? []).map((call) => call.toolName))
    console.info('[sarah] ok', { provider: direct ? 'google' : 'gateway', model: used, tools: toolsUsed })
    return Response.json({ reply: result.text })
  } catch (error) {
    // Only the error class and message: never the customer's text or any key.
    console.error('[sarah] chat failed:', error instanceof Error ? `${error.name}: ${error.message}` : 'unknown error')
    return Response.json({ reply: fallbackReply(language), retryable: true }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
