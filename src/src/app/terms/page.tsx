import type { Metadata } from 'next'
import { LegalPage } from '@/components/legal-page'
import { contactEmail } from '@/lib/site-config'

export const metadata: Metadata = { title: 'Terms of Use', description: 'Terms governing use of the PropAuto AI platform.' }

const CONTACT = contactEmail()

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Use"
      updated="October 2026"
      intro="These terms govern your use of PropAuto AI. By using the site you agree to them; if you do not agree, please do not use the service."
      sections={[
        { heading: 'The service', body: <p>PropAuto AI presents luxury real estate and collector cars, market signals, investment tools and a conversational concierge. Listings, prices, estimates and projected returns are indicative. Nothing on the site is an offer, a solicitation, or financial, legal or tax advice.</p> },
        { heading: 'AI-generated responses', body: <p>The concierge and voice assistant generate answers automatically. They can be wrong or incomplete and never commit PropAuto AI to a price, availability or appointment. Confirm every detail with our team in writing before you rely on it.</p> },
        { heading: 'Your information and enquiries', body: <p>When you submit an enquiry you confirm the details are accurate and that you may share them. We use them to respond as described in our <a className="text-[#d5b77b] underline" href="/privacy">Privacy Policy</a>.</p> },
        { heading: 'Payments', body: <><p>Premium access is a one-time digital purchase processed by Stripe. Prices are shown before you pay; card details go directly to Stripe and are never stored by PropAuto AI.</p><p>For billing questions or refund requests, write to {CONTACT} with your receipt. Requests are handled in line with the consumer law that applies to you.</p></> },
        { heading: 'Acceptable use', body: <p>Do not misuse the site: no automated scraping or flooding of forms and chat, no attempts to access accounts or data that are not yours, no unlawful, misleading or abusive content. We may limit or block access that breaks these rules.</p> },
        { heading: 'Intellectual property', body: <p>The site, its design, text and software belong to PropAuto AI or its licensors. Listing photos and marks belong to their respective owners.</p> },
        { heading: 'Liability', body: <p>The service is provided as it is. To the extent the law allows, PropAuto AI is not liable for decisions made on the basis of indicative information or automated responses. Nothing in these terms limits liability that cannot be limited by law.</p> },
        { heading: 'Changes', body: <p>We may update these terms. The date above shows the latest version; continued use after a change means you accept it.</p> },
        { heading: 'Contact', body: <p>Questions about these terms: <a className="text-[#d5b77b] underline" href={`mailto:${CONTACT}`}>{CONTACT}</a>.</p> },
      ]}
    />
  )
}
