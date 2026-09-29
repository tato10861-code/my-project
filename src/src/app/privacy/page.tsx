import Link from 'next/link'

export const metadata = { title: 'Privacy Policy | PropAuto AI', description: 'Privacy policy for PropAuto AI.' }

export default function PrivacyPage() {
  return <main className="min-h-screen bg-[#071015] px-6 py-16 text-[#f4f1e9] md:px-12"><article className="mx-auto max-w-3xl"><Link href="/" className="text-sm text-[#d9b56f]">← Back to PropAuto AI</Link><h1 className="mt-16 text-5xl font-semibold">Privacy Policy</h1><p className="mt-8 leading-8 text-white/70">PropAuto AI collects information you submit through contact and lead forms to respond to requests and improve the service. We do not sell submitted personal information. Analytics may collect technical usage data such as pages viewed, device information, and session identifiers.</p><p className="mt-5 leading-8 text-white/70">For privacy questions or data requests, contact <a className="text-[#d9b56f]" href="mailto:tato10861@gmail.com">tato10861@gmail.com</a>.</p></article></main>
}
