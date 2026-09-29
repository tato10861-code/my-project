import { convertToModelMessages, streamText } from 'ai'

export async function POST(request: Request) {
  const { messages, locale = 'en' } = await request.json()
  const result = streamText({
    model: 'google/gemini-3.1-flash-lite',
    system: locale === 'ar'
      ? 'أنت مستشار PropAuto AI للعقارات الفاخرة والسيارات النادرة والاستثمار. كن واضحاً ومختصراً. لا تعد بعوائد مضمونة. اجمع هدف العميل وميزانيته ومدينته ثم اقترح خطوة تواصل.'
      : 'You are PropAuto AI concierge for luxury real estate, rare cars, and investing. Be concise and practical. Never promise guaranteed returns. Ask for intent, budget, and city, then recommend a next contact step.',
    messages: await convertToModelMessages(messages),
  })
  return result.toUIMessageStreamResponse()
}
