import Link from 'next/link'
import { contactEmail } from '@/lib/site-config'

export const metadata = { title: 'Contact | PropAuto AI', description: 'Contact PropAuto AI for acquisition, investment, and marketplace opportunities.' }

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#071015] px-6 py-16 text-[#f4f1e9] md:px-12">
      <div className="mx-auto max-w-3xl">
        <Link href="/" className="text-sm text-[#d9b56f] hover:underline">← Back to PropAuto AI</Link>
        <p className="mt-16 text-xs uppercase tracking-[0.28em] text-[#d9b56f]">Private introductions</p>
        <h1 className="mt-5 text-5xl font-semibold tracking-tight">Start a serious conversation.</h1>
        <p className="mt-6 text-lg leading-8 text-white/65">For acquisition discussions, investor interest, partnership proposals, or premium listings, email the PropAuto company team directly.</p>
        <a className="mt-10 inline-flex rounded-full bg-[#d9b56f] px-6 py-3 font-medium text-[#071015]" href={`mailto:${contactEmail()}?subject=PropAuto%20AI%20inquiry`}>Email the owner</a>
        <p className="mt-8 text-sm text-white/45">Please include your name, company, interest, and preferred next step.</p><div className="mt-8 flex flex-wrap gap-3"><a href="https://youtube.com/shorts/eQIl3gwuR0o?si=Z4xixie-Ljvpe-JP" target="_blank" rel="noreferrer" className="rounded-full border border-white/15 px-4 py-2 text-sm text-[#d9b56f] hover:border-[#d9b56f]">Watch on YouTube</a><a href="https://www.linkedin.com/posts/propauto-al-9a3928437_propauto-ai-intelligent-luxury-assets-activity-7506090199572205569-cbmM" target="_blank" rel="noreferrer" className="rounded-full border border-white/15 px-4 py-2 text-sm text-[#d9b56f] hover:border-[#d9b56f]">Follow on LinkedIn</a></div>
      </div>
    </main>
  )
}
