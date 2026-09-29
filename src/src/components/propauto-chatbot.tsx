'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { fetchWithRetry } from '@/lib/utils'
import type { Lead } from '@/types'

// handles conversational retries and graceful degradation

type Locale = 'en' | 'ar' | 'fr' | 'es'

type ChatMessage = { role: 'user' | 'assistant'; text: string }

const copy: Record<Locale, { label: string; welcome: string; placeholder: string; prompt: string; name: string; phone: string; budget: string; interest: string; property: string; car: string; send: string; thanks: string }> = {
  en: { label: 'English', welcome: 'Welcome to PropAuto! 🏠🚗 Looking for luxury property or supercar?', placeholder: 'Ask about a property, car, or appointment...', prompt: 'Tell me your name and what you are looking for', name: 'Name', phone: 'Phone', budget: 'Budget', interest: 'Interest', property: 'Property', car: 'Car', send: 'Send', thanks: 'Thanks!' },
  ar: { label: 'العربية', welcome: 'أهلاً! أنا فريق مبيعات PropAuto. هل تبحث عن عقار فاخر أم سيارة خارقة؟', placeholder: 'اسأل عن عقار أو سيارة...', prompt: 'أدخل اسمك ورقم هاتفك', name: 'الاسم', phone: 'الهاتف', budget: 'الميزانية', interest: 'الاهتمام', property: 'عقار', car: 'سيارة', send: 'أرسل', thanks: 'شكراً!' },
  fr: { label: 'Français', welcome: 'Bienvenue chez PropAuto. Vous cherchez une propriété de luxe ou une supercar ?', placeholder: 'Parlez-nous de votre recherche...', prompt: 'Partagez votre nom', name: 'Nom', phone: 'Téléphone', budget: 'Budget', interest: 'Intérêt', property: 'Propriété', car: 'Voiture', send: 'Envoyer', thanks: 'Merci!' },
  es: { label: 'Español', welcome: 'Bienvenido a PropAuto. ¿Buscas una propiedad de lujo o un superdeportivo?', placeholder: 'Cuéntanos qué buscas...', prompt: 'Comparte tu nombre', name: 'Nombre', phone: 'Teléfono', budget: 'Presupuesto', interest: 'Interés', property: 'Propiedad', car: 'Coche', send: 'Enviar', thanks: '¡Gracias!' },
}

export function PropAutoChatbot() {
  const [open, setOpen] = useState(false)
  const [locale, setLocale] = useState<Locale>('en')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [lead, setLead] = useState<Partial<Lead>>({ name: '', email: '', phone: '', budget: '', intent: 'buyer' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const t = copy[locale]

  useEffect(() => {
    const openChat = () => {
      setOpen(true)
      setMessages((current) => current.length ? current : [{ role: 'assistant', text: t.welcome }])
    }
    window.addEventListener('propauto:open-chat', openChat)
    return () => window.removeEventListener('propauto:open-chat', openChat)
  }, [t.welcome])

  function changeLocale(next: Locale) { setLocale(next); setMessages([{ role: 'assistant', text: copy[next].welcome }]) }
  async function sendMessage() {
    const value = input.trim()
    if (!value) return
    const nextMessages = [...messages, { role: 'user' as const, text: value }]
    setMessages(nextMessages)
    setInput('')
    try {
      const response = await fetchWithRetry('/api/sarah', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: locale, messages: nextMessages.map((m) => `${m.role}: ${m.text}`) }) })
      const data = await response.json()
      setMessages((current) => [...current, { role: 'assistant', text: data.reply || t.prompt }])
    } catch (err) {
      setMessages((current) => [...current, { role: 'assistant', text: t.prompt }])
    }
  }
  async function sendLead(event: React.FormEvent) {
    event.preventDefault()
    setSending(true)
    setError('')
    try {
      const response = await fetchWithRetry('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lead, intent: 'buyer', language: locale, message: messages.map((m) => `${m.role}: ${m.text}`).join('\n') }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.delivered) throw new Error(result?.message || 'lead submission failed')
      setSent(true)
    } catch (err) {
      setError(locale === 'ar' ? 'تعذر الإرسال. يرجى المحاولة مرة أخرى.' : 'Unable to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return <>
    <button onClick={() => { setOpen(true); if (!messages.length) setMessages([{ role: 'assistant', text: t.welcome }]) }} className="fixed bottom-5 end-3 z-50 flex size-12 items-center justify-center rounded-full bg-[#d5b77b] p-3 shadow-lg" aria-label="Open chat">
      <MessageCircle />
    </button>
    {open && <section className="fixed bottom-5 end-5 z-[60] w-[min(92vw,390px)] overflow-hidden rounded-3xl border border-[#D4AF37]/40 bg-black text-white shadow-2xl" dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <header className="flex items-center justify-between border-b border-white/10 bg-[#101010] p-4"><div><p className="font-semibold">PropAuto AI Closer</p><p className="text-xs text-[#D4AF37]">{t.welcome}</p></div><button onClick={() => setOpen(false)} className="p-2"><X /></button></header>
      <div className="flex gap-1 border-b border-white/10 p-2">{(Object.keys(copy) as Locale[]).map((key) => <button key={key} onClick={() => changeLocale(key)} className={`rounded-full px-2.5 py-1 text-xs ${key === locale ? 'bg-[#D4AF37] text-black' : 'text-white/70'}`}>{copy[key].label}</button>)}</div>
      <div className="max-h-52 space-y-2 overflow-y-auto p-3 text-sm">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`rounded-2xl px-3 py-2 ${message.role === 'assistant' ? 'bg-[#0f1724]' : 'bg-[#1f2937]'} text-white`}>{message.text}</div>)}</div>
      <form onSubmit={(e) => { e.preventDefault(); void sendMessage() }} className="flex gap-2 border-t border-white/10 p-3"><input value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 rounded-md p-2 bg-[#0b1214] text-white" placeholder={t.placeholder} /><button disabled={!input.trim()} className="p-2 bg-[#d5b77b] text-black rounded-md"><Send /></button></form>
      <form onSubmit={sendLead} className="space-y-2 border-t border-white/10 p-3"><p className="text-xs text-white/60">{sent ? t.thanks : error || t.prompt}</p>{!sent && <><input required value={lead.name ?? ''} onChange={(e) => setLead((s) => ({ ...s, name: e.target.value }))} placeholder={t.name} className="w-full p-2 rounded-md bg-[#0b1214] text-white" /><input required value={lead.phone ?? ''} onChange={(e) => setLead((s) => ({ ...s, phone: e.target.value }))} placeholder={t.phone} className="w-full p-2 rounded-md bg-[#0b1214] text-white" /><div className="flex gap-2"><button disabled={sending} type="submit" className="flex-1 p-2 rounded-md bg-[#d5b77b] text-black">{t.send}</button></div></>}</form>
    </section>}
  </>
}

export default PropAutoChatbot
