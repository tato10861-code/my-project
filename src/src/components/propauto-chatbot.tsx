'use client'

import { useEffect, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'

type Locale = 'en' | 'ar' | 'fr' | 'es'

type ChatMessage = { role: 'user' | 'assistant'; text: string }

const copy: Record<Locale, { label: string; welcome: string; placeholder: string; prompt: string; name: string; phone: string; budget: string; interest: string; property: string; car: string; send: string; thanks: string }> = {
  en: { label: 'English', welcome: 'Welcome to PropAuto! 🏠🚗 Looking for luxury property or supercar?', placeholder: 'Ask about a property, car, or appointment...', prompt: 'Tell me your name, phone, budget, and whether you prefer property or cars.', name: 'Name', phone: 'Phone / WhatsApp', budget: 'Budget', interest: 'Interest', property: 'Property', car: 'Car', send: 'Send enquiry', thanks: 'Thank you. Our sales team will contact you shortly.' },
  ar: { label: 'العربية', welcome: 'أهلاً! أنا فريق مبيعات PropAuto. هل تبحث عن عقار فاخر أم سيارة خارقة؟', placeholder: 'اسأل عن عقار أو سيارة أو موعد...', prompt: 'أرسل اسمك ورقمك وميزانيتك وما تفضله: عقار أم سيارات.', name: 'الاسم', phone: 'الهاتف / واتساب', budget: 'الميزانية', interest: 'الاهتمام', property: 'عقار', car: 'سيارة', send: 'إرسال الطلب', thanks: 'شكرًا. سيتواصل معك فريق المبيعات قريبًا.' },
  fr: { label: 'Français', welcome: 'Bienvenue chez PropAuto. Vous cherchez une propriété de luxe ou une supercar ?', placeholder: 'Parlez-nous de votre recherche...', prompt: 'Partagez votre nom, téléphone, budget et votre intérêt.', name: 'Nom', phone: 'Téléphone / WhatsApp', budget: 'Budget', interest: 'Intérêt', property: 'Propriété', car: 'Voiture', send: 'Envoyer la demande', thanks: 'Merci. Notre équipe vous contactera bientôt.' },
  es: { label: 'Español', welcome: 'Bienvenido a PropAuto. ¿Buscas una propiedad de lujo o un superdeportivo?', placeholder: 'Cuéntanos qué buscas...', prompt: 'Comparte tu nombre, teléfono, presupuesto e interés.', name: 'Nombre', phone: 'Teléfono / WhatsApp', budget: 'Presupuesto', interest: 'Interés', property: 'Propiedad', car: 'Coche', send: 'Enviar consulta', thanks: 'Gracias. Nuestro equipo te contactará pronto.' },
}

export function PropAutoChatbot() {
  const [open, setOpen] = useState(false)
  const [locale, setLocale] = useState<Locale>('en')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [lead, setLead] = useState({ name: '', email: '', phone: '', budget: '', interest: 'Property' })
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
      const response = await fetch('/api/sarah', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: locale, messages: nextMessages.map((message) => ({ role: message.role, content: message.text })) }) })
      const data = await response.json()
      setMessages((current) => [...current, { role: 'assistant', text: data.reply || t.prompt }])
    } catch {
      setMessages((current) => [...current, { role: 'assistant', text: t.prompt }])
    }
  }
  async function sendLead(event: React.FormEvent) {
    event.preventDefault()
    setSending(true)
    setError('')
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lead, intent: 'buyer', language: locale, message: messages.map((message) => `${message.role}: ${message.text}`).join('\n') }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.saved) throw new Error(result?.message || 'lead submission failed')
      setSent(true)
    } catch {
      setError(locale === 'ar' ? 'تعذر الإرسال. يرجى المحاولة مرة أخرى.' : 'Unable to send. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return <>
    <button onClick={() => { setOpen(true); if (!messages.length) setMessages([{ role: 'assistant', text: t.welcome }]) }} className="fixed bottom-5 end-3 z-50 flex size-12 items-center justify-center gap-2 rounded-full bg-[#D4AF37] text-black shadow-2xl shadow-black/40 transition hover:scale-105 sm:end-6 sm:size-auto sm:px-4 sm:py-3" aria-label="Open PropAuto Sales Team chat"><MessageCircle size={22} /><span className="hidden text-xs font-bold sm:inline sm:text-sm">Chat with PropAuto Sales Team</span></button>
    {open && <section className="fixed bottom-5 end-5 z-[60] w-[min(92vw,390px)] overflow-hidden rounded-3xl border border-[#D4AF37]/40 bg-black text-white shadow-2xl" dir={locale === 'ar' ? 'rtl' : 'ltr'} aria-label="PropAuto AI Closer">
      <header className="flex items-center justify-between border-b border-white/10 bg-[#101010] p-4"><div><p className="font-semibold">PropAuto AI Closer</p><p className="text-xs text-[#D4AF37]">PropAuto Sales Team</p></div><button onClick={() => setOpen(false)} aria-label="Close chat"><X size={18} /></button></header>
      <div className="flex gap-1 border-b border-white/10 p-2">{(Object.keys(copy) as Locale[]).map((key) => <button key={key} onClick={() => changeLocale(key)} className={`rounded-full px-2.5 py-1 text-[11px] ${locale === key ? 'bg-[#D4AF37] text-black' : 'text-white/60'}`}>{copy[key].label}</button>)}</div>
      <div className="max-h-52 space-y-2 overflow-y-auto p-3 text-sm">{messages.map((message, index) => <div key={`${message.role}-${index}`} className={`rounded-2xl px-3 py-2 ${message.role === 'assistant' ? 'bg-white/10' : 'ms-8 bg-[#D4AF37] text-black'}`}>{message.text}</div>)}</div>
      <form onSubmit={(event) => { event.preventDefault(); void sendMessage() }} className="flex gap-2 border-t border-white/10 p-3"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder={t.placeholder} className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/40" /><button className="grid size-9 place-items-center rounded-xl bg-[#D4AF37] text-black" aria-label="Send message"><Send size={16} /></button></form>
      <form onSubmit={sendLead} className="space-y-2 border-t border-white/10 p-3"><p className="text-xs text-white/60">{sent ? t.thanks : error || t.prompt}</p>{!sent && <><input required value={lead.name} onChange={(event) => setLead({ ...lead, name: event.target.value })} placeholder={t.name} className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none" /><input required type="email" value={lead.email} onChange={(event) => setLead({ ...lead, email: event.target.value })} placeholder="Email" className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none" /><input required value={lead.phone} onChange={(event) => setLead({ ...lead, phone: event.target.value })} placeholder={t.phone} className="w-full rounded-xl bg-white/10 px-3 py-2 text-sm outline-none" /><div className="flex gap-2"><input value={lead.budget} onChange={(event) => setLead({ ...lead, budget: event.target.value })} placeholder={t.budget} className="min-w-0 flex-1 rounded-xl bg-white/10 px-3 py-2 text-sm outline-none" /><select value={lead.interest} onChange={(event) => setLead({ ...lead, interest: event.target.value })} className="rounded-xl bg-white/10 px-2 text-sm"><option className="text-black">{t.property}</option><option className="text-black">{t.car}</option></select></div><button disabled={sending} className="w-full rounded-xl bg-[#D4AF37] px-3 py-2 text-sm font-semibold text-black disabled:cursor-wait disabled:opacity-60">{sending ? 'Sending...' : t.send}</button></>}</form>
    </section>}
  </>
}

export default PropAutoChatbot
