import { useState } from 'react'

/** State and sender for the on-page Sarah concierge chat. */
export function useSarahChat(locale: string) {
  const [messages, setMessages] = useState<
    { id: string; role: 'user' | 'assistant'; parts: { type: 'text'; text: string }[] }[]
  >([])
  const [chatInput, setChatInput] = useState('')
  const [chatStatus, setChatStatus] = useState<'ready' | 'streaming'>('ready')
  async function sendMessage({ text }: { text: string }) {
    const userMessage = { id: `${Date.now()}-user`, role: 'user' as const, parts: [{ type: 'text' as const, text }] }
    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setChatStatus('streaming')
    try {
      const response = await fetch('/api/sarah', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: locale,
          messages: nextMessages.map((message) => ({
            role: message.role,
            content: message.parts.map((part) => part.text).join(''),
          })),
        }),
      })
      const data = await response.json()
      if (!response.ok || !data.reply) throw new Error('Sarah unavailable')
      setMessages((current) => [
        ...current,
        { id: `${Date.now()}-assistant`, role: 'assistant', parts: [{ type: 'text', text: data.reply }] },
      ])
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          parts: [
            {
              type: 'text',
              text:
                locale === 'ar'
                  ? 'أعتذر، تعذر الاتصال الآن. اترك رقمك وسيتواصل معك فريق PropAuto.'
                  : 'I’m sorry, Sarah is temporarily unavailable. Leave your number and the PropAuto team will contact you.',
            },
          ],
        },
      ])
    } finally {
      setChatStatus('ready')
    }
  }
  return { messages, chatInput, setChatInput, chatStatus, sendMessage }
}
