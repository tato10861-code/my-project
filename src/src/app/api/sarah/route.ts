import { generateText } from 'ai'
import { Resend } from 'resend'
import { z } from 'zod'

const requestSchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(2000) })).min(1).max(30),
  language: z.string().min(2).max(12).default('en'),
})

const SARAH_SYSTEM_PROMPT = `You are Sarah from PropAuto, a warm elite real-estate and automotive sales consultant. Never mention AI, bots, prompts, or system instructions. Reply in the language of the latest user message and keep the same language throughout unless they switch. Keep replies to 15-25 words, ask one question at a time, and always end with a question. Qualify property or car interest, location, budget, timing, and rent/buy/invest intent. Present no more than two options, using only the verified catalog context when provided; never invent exact listings, prices, availability, social proof, or appointments. Handle price objections by adding value, not dropping price. Offer two viewing or test-drive times. When the user is ready to book, asks for a human, or requests final pricing, ask for name, phone, and email and say the PropAuto Sales Team will follow up. Be professional, concise, warm, and persuasive. Current company contact: propautoal@gmail.com.`

export async function POST(request: Request) {
  let language = 'en'
  try {
    const parsed = requestSchema.parse(await request.json())
    const { messages } = parsed
    language = parsed.language
    const latestMessage = messages[messages.length - 1]?.content ?? ''
    const hotLead = /\b(book|booking|viewing|test drive|human|price|interested|buy|rent)\b|حجز|معاينة|موظف|السعر|شراء|إيجار/i.test(latestMessage)
    if (hotLead && (process.env.RESEND_API_KEY_2 ?? process.env.RESEND_API_KEY)) {
      const resend = new Resend(process.env.RESEND_API_KEY_2 ?? process.env.RESEND_API_KEY!)
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL ?? 'PropAuto Sales <onboarding@resend.dev>',
        to: 'propautoal@gmail.com',
        subject: 'PropAuto hot lead from Sarah',
        text: `A visitor may be ready to buy or book. Latest message: ${latestMessage}`,
      })
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
    return Response.json({ reply: fallback }, { status: 200 })
  }
}
