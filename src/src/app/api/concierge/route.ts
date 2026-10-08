import { convertToModelMessages, streamText } from 'ai'
import type { UIMessage } from 'ai'
import { z } from 'zod'
import { getClientKey, hasOversizedBody, rateLimit, tooManyRequests } from '@/lib/request-security'

const requestSchema = z.object({
  messages: z.array(z.custom<Omit<UIMessage, 'id'>>()).min(1).max(30),
  locale: z.enum(['ar', 'en']).default('en'),
})

/** Streams a bounded concierge conversation after validating and rate-limiting the request. */
export async function POST(request: Request) {
  const limit = rateLimit(getClientKey(request, 'concierge'), 10)
  if (!limit.allowed) return tooManyRequests(limit.retryAfter)
  if (hasOversizedBody(request, 96_000)) return Response.json({ error: 'Request too large' }, { status: 413 })
  let input: z.infer<typeof requestSchema>
  try {
    input = requestSchema.parse(await request.json())
  } catch {
    return Response.json({ error: 'Invalid conversation payload' }, { status: 400 })
  }
  const { messages, locale } = input
  const safeMessages = await convertToModelMessages(messages)
  const result = streamText({
    model: 'google/gemini-3.1-flash-lite',
    system: locale === 'ar'
      ? 'أنت مستشار PropAuto AI للعقارات الفاخرة والسيارات النادرة والاستثمار. كن واضحاً ومختصراً. لا تعد بعوائد مضمونة. اجمع هدف العميل وميزانيته ومدينته ثم اقترح خطوة تواصل.'
      : 'You are PropAuto AI concierge for luxury real estate, rare cars, and investing. Be concise and practical. Never promise guaranteed returns. Ask for intent, budget, and city, then recommend a next contact step.',
    messages: safeMessages,
  })
  return result.toUIMessageStreamResponse()
}
