import { convertToModelMessages, streamText, type UIMessage } from 'ai'
import { z } from 'zod'
import {
  BodyTooLargeError,
  getClientKey,
  payloadTooLarge,
  readJsonBody,
  tooManyRequests,
  crossOriginForbidden,
  isSameOriginRequest,
} from '@/lib/request-security'
import { checkRateLimit } from '@/lib/db/rate-limit'

const MAX_BODY_BYTES = 96_000

const requestSchema = z.object({
  messages: z
    .array(z.custom<UIMessage>((value) => typeof value === 'object' && value !== null))
    .min(1)
    .max(30),
  locale: z.enum(['en', 'ar']).default('en'),
})

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginForbidden()
  const limit = await checkRateLimit(getClientKey(request, 'concierge'), 10)
  if (!limit.allowed) return tooManyRequests(limit.retryAfter)

  let parsed: z.infer<typeof requestSchema>
  try {
    parsed = requestSchema.parse(await readJsonBody(request, MAX_BODY_BYTES))
  } catch (error) {
    if (error instanceof BodyTooLargeError) return payloadTooLarge()
    return Response.json(
      { error: 'Invalid concierge request' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  let messages: Awaited<ReturnType<typeof convertToModelMessages>>
  try {
    messages = await convertToModelMessages(parsed.messages)
  } catch {
    // The schema only checks that each entry is an object; malformed message parts are the caller's error, not ours.
    return Response.json(
      { error: 'Invalid concierge request' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const result = streamText({
    model: 'google/gemini-3.1-flash-lite',
    system:
      parsed.locale === 'ar'
        ? 'أنت مستشار PropAuto AI للعقارات الفاخرة والسيارات النادرة والاستثمار. كن واضحاً ومختصراً. لا تعد بعوائد مضمونة. اجمع هدف العميل وميزانيته ومدينته ثم اقترح خطوة تواصل.'
        : 'You are PropAuto AI concierge for luxury real estate, rare cars, and investing. Be concise and practical. Never promise guaranteed returns. Ask for intent, budget, and city, then recommend a next contact step.',
    messages,
    abortSignal: request.signal,
  })
  return result.toUIMessageStreamResponse()
}
