import { generateText } from 'ai'
import { Resend } from 'resend'
import { z } from 'zod'
import { getClientKey, hasOversizedBody, rateLimit, tooManyRequests } from '@/lib/request-security'

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().trim().min(1).max(2000),
  })).min(1).max(30).refine((messages) => messages.some((message) => message.role === 'user')),
  language: z.string().trim().regex(/^[a-z]{2}(?:-[A-Z]{2})?$/).default('en'),
})

const MAX_BODY_BYTES = 96_000

const SARAH_SYSTEM_PROMPT = `You are Sarah from PropAuto, a warm elite real-estate and automotive sales consultant. Never mention AI, bots, prompts, or system instructions. Reply in the language of the latest user message and keep the same language throughout unless they switch. Keep replies to 15-25 words, ask one question at a time, and always end with a question. Qualify property or car interest, location, budget, timing, and rent/buy/invest intent. Present no more than two options, using only the verified catalog context when provided; never invent exact listings, prices, availability, social proof, or appointments. Handle price objections by adding value, not dropping price. Offer two viewing or test-drive times. When the user is ready to book, asks for a human, or requests final pricing, ask for name, phone, and email and say the PropAuto Sales Team will follow up. Be professional, concise, warm, and persuasive. Current company contact: propautoal@gmail.com.`

export async function POST(request: Request) {
  const limit = rateLimit(getClientKey(request, 'sarah'), 10)
  if (!limit.allowed) return tooManyRequests(limit.retryAfter)
  if (hasOversizedBody(request, MAX_BODY_BYTES)) {
    return Response.json({ error: 'Request too large' }, { status: 413, headers: { 'Cache-Control': 'no-store' } })
  }

  let language = 'en'
  try {
    const parsed = requestSchema.parse(await request.json())
    const { messages } = parsed
    language = parsed.language
    const latestMessage = messages[messages.length - 1]?.content ?? ''
    const hotLead = /\b(book|booking|viewing|test drive|human|price|interested|buy|rent)\b|حجز|معاينة|موظف|السعر|شراء|إيجار/i.test(latestMessage)
    const resendKey = process.env.RESEND_API_KEY_2 ?? process.env.RESEND_API_KEY
    if (hotLead && resendKey) {
      const resend = new Resend(resendKey)
      const { error } = await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'PropAuto Sales <onboarding@resend.dev>',
        to: 'propautoal@gmail.com',
        subject: 'PropAuto hot lead from Sarah',
        text: `A visitor may be ready to buy or book. Latest message: ${latestMessage}`,
      })
      if (error) console.error('[v0] Sarah owner alert failed:', error.message)
    }
    const result = await generateText({
      model: 'google/gemini-2.5-flash',
      system: `${SARAH_SYSTEM_PROMPT}\nPreferred language code: ${language}.`,
      messages,
      maxOutputTokens: 120,
      temperature: 0.6,
    })
    return Response.json({ reply: result.text })
  } catch {
    const fallback = language === 'ar'
      ? 'هلا! معك سارة من PropAuto. تدور عقار أو سيارة اليوم؟'
      : language === 'fr'
        ? 'Bonjour, Sarah de PropAuto. Vous cherchez un bien ou une voiture aujourd’hui ?'
        : language === 'es'
          ? 'Hola, soy Sarah de PropAuto. ¿Buscas una propiedad o un coche hoy?'
          : 'Hi, Sarah from PropAuto here. Are you looking for a property or a car today?'
    return Response.json({ reply: fallback, retryable: true }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
