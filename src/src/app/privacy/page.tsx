import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'

export const metadata: Metadata = { title: 'Privacy Policy', description: 'How PropAuto AI handles visitor and lead information.' }

const CONTACT = 'propautoal@gmail.com'

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 2026"
      intro="We collect only what we need to answer enquiries, run the service and keep it secure. We do not sell personal information."
      sections={[
        { heading: 'What we collect', body: <ul className="list-disc space-y-2 ps-5"><li><strong>Enquiries:</strong> the name, email, phone, budget, interest and message you submit through forms, the chat or a callback request.</li><li><strong>Conversations:</strong> messages you send to the concierge, so it can answer you.</li><li><strong>Visits:</strong> a random session identifier stored in a first-party cookie, the pages you view and your interface language. We do not use it to identify you across other sites.</li><li><strong>Payments:</strong> Stripe processes card payments; we receive the purchase, amount and the email you gave Stripe, never your card details.</li></ul> },
        { heading: 'Who processes it', body: <p>We rely on service providers that act on our behalf: Vercel (hosting and aggregate analytics), Neon (database), Resend (email delivery), Stripe (payments), Vapi (voice calls you start) and the AI model provider that generates concierge replies. They receive only what their part of the service needs.</p> },
        { heading: 'How long we keep it', body: <p>Enquiries are kept while we are in contact with you and for a reasonable period afterwards for follow-up and record keeping. Visit records are kept in aggregate form for analytics. You can ask us to delete your data at any time.</p> },
        { heading: 'Your rights', body: <p>You can ask to access, correct, export or delete your information, or object to its use, by writing to <a className="text-[#d5b77b] underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>. We answer within 30 days.</p> },
        { heading: 'Security', body: <p>Data travels over HTTPS, account access is limited to the platform owner, and our endpoints are rate limited and validate every input. No system is perfectly secure; tell us at {CONTACT} if you believe your data is at risk.</p> },
        { heading: 'Changes', body: <p>We may update this policy; the date above shows the latest version.</p> },
      ]}
    />
  )
}
