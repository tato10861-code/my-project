import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Privacy Policy | PropAuto AI', description: 'How PropAuto AI handles visitor and lead information.' }

export default function PrivacyPage() {
  return <main className="min-h-screen bg-[#071014] px-6 py-20 text-[#f5f1e8]"><article className="mx-auto max-w-3xl space-y-6"><p className="text-sm text-[#d5b77b]">PropAuto AI</p><h1 className="text-4xl font-semibold">Privacy Policy</h1><p className="text-white/70">We collect only the information needed to respond to inquiries, improve the service, and protect the platform. We do not sell personal information.</p><h2 className="text-2xl font-semibold">Information we receive</h2><p className="text-white/70">Contact details and messages submitted through the site may be stored securely and shared with service providers required to operate the platform.</p><h2 className="text-2xl font-semibold">Your choices</h2><p className="text-white/70">To request access, correction, or deletion of your information, contact propautoal@gmail.com.</p></article></main>
}
