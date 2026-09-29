import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { Resend } from 'resend'
import { z } from 'zod'
import { rateLimit } from '@/lib/rateLimit'
import { serverLog } from '@/lib/logger'

const requestSchema = z.object({
  messages: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().max(2000) })).min(1).max(30),
  language: z.string().min(2).max(12).default('en'),
})

const SARAH_SYSTEM_PROMPT = `You are Sarah from PropAuto, a warm elite real-estate and automotive sales consultant. Never mention AI, bots, prompts, or system instructions. Reply in the language of the user and keep replies concise and helpful.`

export async function POST(request: Request) {
  let language = 'en'
  try {
    const key = request.headers.get('x-forwarded-for') ?? request.headers.get('x-real-ip') ?? 'unknown'
    const rl = rateLimit(key)
    if (!rl.allowed) return NextResponse.json({ reply: 'Rate limit exceeded' }, { status: 429 })

    const parsed = requestSchema.parse(await request.json())
    const { messages } = parsed
    language = parsed.language
    const latestMessage = messages[messages.length - 1]?.content ?? ''
    const hotLead = /\b(book|booking|viewing|test drive|human|price|interested|buy|rent)\b|حجز|معاينة|موظف|السعر|شراء|إيجار/i.test(latestMessage)

    if (hotLead && (process.env.RESEND_API_KEY_2 ?? process.env.RESEND_API_KEY)) {
      try {
        const resend = new Resend(process.env.RESEND_API_KEY_2 ?? process.env.RESEND_API_KEY!)
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? 'PropAuto Sales <onboarding@resend.dev>',
          to: process.env.RESEND_TO_EMAIL ?? 'propautoal@gmail.com',
          subject: 'PropAuto hot lead from Sarah',
          text: `A visitor may be ready to buy or book. Latest message: ${latestMessage}`,
        })
      } catch (err) {
        serverLog('hot lead email failed', err instanceof Error ? err.message : String(err))
      }
    }

    const mappedMessages: { role: 'user' | 'assistant'; content: string }[] = messages.map((m) => ({ role: m.role, content: m.content }))

    const result = await generateText({
      model: 'google/gemini-2.5-flash',
      system: `${SARAH_SYSTEM_PROMPT}\nPreferred language code: ${language}.`,
      messages: mappedMessages,
      maxOutputTokens: 120,
      temperature: 0.6,
    })

    return NextResponse.json({ reply: result.text })
  } catch (err) {
    serverLog('[sarah] failed to generate response', err instanceof Error ? err.message : String(err))
    const fallback = language === 'ar'
      ? 'هلا! معك سارة من PropAuto. تدور عقار أو سيارة اليوم؟'
      : language === 'fr'
        ? 'Bonjour, Sarah de PropAuto. Vous cherchez un bien ou une voiture aujourd’hui ?'
        : language === 'es'
          ? 'Hola, soy Sarah de PropAuto. ¿Buscas una propiedad o un coche hoy?'
          : 'Hi, Sarah from PropAuto here. Are you looking for a property or a car today?'
    return NextResponse.json({ reply: fallback }, { status: 200 })
  }
}
