'use client'

import Vapi from '@vapi-ai/web'
import { Phone, Square, X } from 'lucide-react'
import { FormEvent, useEffect, useRef, useState } from 'react'

export function PropAutoVoiceConcierge() {
  const vapiRef = useRef<Vapi | null>(null)
  const [open, setOpen] = useState(false)
  const [calling, setCalling] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [micReady, setMicReady] = useState(false)
  const assistantIdRef = useRef<string | null>(null)

  useEffect(() => {
    let active = true
    fetch('/api/voice/config')
      .then((response) => (response.ok ? response.json() : { enabled: false }))
      .then((config) => {
        if (!active) return
        setAvailable(Boolean(config.enabled))
        assistantIdRef.current = typeof config.assistantId === 'string' ? config.assistantId : null
        if (config.enabled && assistantIdRef.current) {
          const vapi = new Vapi(config.publicKey)
          vapi.on('call-start', () => setCalling(true))
          vapi.on('call-end', () => setCalling(false))
          vapi.on('error', () => {
            setCalling(false)
            setError('The voice session ended. Please request a callback.')
          })
          vapiRef.current = vapi
        }
      })
      .catch(() => active && setAvailable(false))
    return () => {
      active = false
      void vapiRef.current?.stop()
      vapiRef.current = null
    }
  }, [])

  async function startCall() {
    setError('')
    if (!vapiRef.current || available !== true || !assistantIdRef.current) {
      setError('Voice is not connected in this deployment. Please request a callback below.')
      return
    }
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('microphone_unavailable')
      const microphone = await navigator.mediaDevices.getUserMedia({ audio: true })
      microphone.getTracks().forEach((track) => track.stop())
      setMicReady(true)
      await vapiRef.current.start(assistantIdRef.current)
    } catch {
      setMicReady(false)
      setCalling(false)
      setError('Please allow microphone access in your browser, then press Talk to Sarah again.')
    }
  }

  async function requestCallback(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSending(true)
    setError('')
    const form = new FormData(event.currentTarget)
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.get('name'),
          email: form.get('email'),
          phone: form.get('phone'),
          intent: 'buyer',
          language: 'en',
          message: 'Requested a voice callback from PropAuto Voice Concierge.',
        }),
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.saved) throw new Error(result?.message || 'callback request failed')
      setSubmitted(true)
    } catch {
      setError('Unable to send your request. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-5 start-3 z-50 sm:start-6">
      {open && (
        <div
          id="propauto-voice-concierge"
          className="mb-3 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-[#D4AF37]/35 bg-[#090909] p-4 text-white shadow-2xl shadow-black/50"
          role="dialog"
          aria-label="PropAuto Voice Concierge"
        >
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-[#D4AF37]">PropAuto Voice Concierge</p>
              <p className="mt-1 text-xs leading-5 text-white/65">
                Sarah is available inside this site for property and car enquiries.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-white/60 hover:bg-white/10"
              aria-label="Close voice concierge"
            >
              <X size={16} />
            </button>
          </div>
          {calling ? (
            <button
              type="button"
              onClick={() => {
                void vapiRef.current?.stop()
                setCalling(false)
              }}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-500 px-4 py-3 text-sm font-bold text-white"
            >
              <Square size={15} /> End voice session
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void startCall()}
              disabled={available === false}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#D4AF37] px-4 py-3 text-sm font-bold text-black disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Phone size={16} /> {available === false ? 'Voice setup pending' : 'Talk to Sarah now'}
            </button>
          )}
          <p className="mt-2 text-center text-[10px] text-white/40">
            {micReady
              ? 'Microphone ready. Sarah can hear you in this page.'
              : 'Press Talk to Sarah and allow microphone access when your browser asks.'}
          </p>
          {submitted ? (
            <p className="mt-3 rounded-xl bg-emerald-400/10 p-3 text-center text-xs text-emerald-200">
              Thank you. PropAuto Sales Team will contact you shortly.
            </p>
          ) : (
            <form onSubmit={requestCallback} className="mt-4 space-y-2" aria-label="Request a callback">
              <p className="text-xs font-semibold text-[#D4AF37]">Prefer a callback?</p>
              <input
                name="name"
                required
                minLength={2}
                placeholder="Your name"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none placeholder:text-white/40"
              />
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none placeholder:text-white/40"
              />
              <input
                name="phone"
                required
                minLength={7}
                placeholder="Phone / WhatsApp"
                className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-white outline-none placeholder:text-white/40"
              />
              <button
                disabled={sending}
                type="submit"
                className="w-full rounded-lg border border-[#D4AF37]/60 px-3 py-2 text-xs font-semibold text-[#D4AF37] disabled:opacity-50"
              >
                {sending ? 'Sending...' : error || 'Request a callback'}
              </button>
            </form>
          )}
        </div>
      )}
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex size-12 items-center justify-center gap-2 rounded-full border border-[#D4AF37]/60 bg-black text-xs font-bold text-[#D4AF37] shadow-xl shadow-black/30 transition hover:bg-[#171717] sm:size-auto sm:px-4 sm:py-3"
        aria-expanded={open}
        aria-controls="propauto-voice-concierge"
      >
        <Phone size={17} /> <span className="hidden sm:inline">Talk to PropAuto</span>
      </button>
    </div>
  )
}
