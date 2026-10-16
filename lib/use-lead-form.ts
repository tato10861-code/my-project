import { useState } from 'react'

/** State and submit handler for the lead-capture form. */
export function useLeadForm() {
  const [leadIntent, setLeadIntent] = useState<'buyer' | 'investor' | 'seller'>('buyer')
  const [leadName, setLeadName] = useState('')
  const [leadEmail, setLeadEmail] = useState('')
  const [leadStatus, setLeadStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  async function submitLead(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLeadStatus('sending')
    const response = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: leadName, email: leadEmail, intent: leadIntent }),
    })
    setLeadStatus(response.ok ? 'sent' : 'error')
  }
  return { leadIntent, setLeadIntent, leadName, setLeadName, leadEmail, setLeadEmail, leadStatus, submitLead }
}
