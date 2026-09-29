import Link from 'next/link'

export const metadata = { title: 'Terms | PropAuto AI', description: 'Terms of use for PropAuto AI.' }

export default function TermsPage() {
  return <main className="min-h-screen bg-[#071015] px-6 py-16 text-[#f4f1e9] md:px-12"><article className="mx-auto max-w-3xl"><Link href="/" className="text-sm text-[#d9b56f]">← Back to PropAuto AI</Link><h1 className="mt-16 text-5xl font-semibold">Terms of Use</h1><p className="mt-8 leading-8 text-white/70">PropAuto AI provides an informational marketplace and lead-introduction experience. Listings, estimates, market commentary, and AI-generated responses are not financial, legal, valuation, or investment advice.</p><p className="mt-5 leading-8 text-white/70">Users are responsible for verifying opportunities independently. Contact <a className="text-[#d9b56f]" href="mailto:tato10861@gmail.com">tato10861@gmail.com</a> for questions about these terms.</p></article></main>
}
