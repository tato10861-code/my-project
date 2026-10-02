import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Terms of Use | PropAuto AI', description: 'Terms governing use of the PropAuto AI platform.' }

export default function TermsPage() {
  return <main className="min-h-screen bg-[#071014] px-6 py-20 text-[#f5f1e8]"><article className="mx-auto max-w-3xl space-y-6"><p className="text-sm text-[#d5b77b]">PropAuto AI</p><h1 className="text-4xl font-semibold">Terms of Use</h1><p className="text-white/70">By using PropAuto AI, you agree to use the platform lawfully and provide accurate information when submitting an inquiry.</p><h2 className="text-2xl font-semibold">Listings and AI responses</h2><p className="text-white/70">Listings, estimates, and AI-generated responses are informational and should be independently verified before making a purchase or investment decision.</p><h2 className="text-2xl font-semibold">Contact</h2><p className="text-white/70">Questions about these terms can be sent to propautoal@gmail.com.</p></article></main>
}
