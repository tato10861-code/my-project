import Link from 'next/link'

const highlights = [
  [
    'Rare-asset marketplace',
    'A focused product for high-intent buyers across property, automotive, and private opportunities.',
  ],
  ['AI-assisted discovery', 'A concierge experience helps visitors move from curiosity to a qualified conversation.'],
  ['Built for expansion', 'The foundation supports listings, lead capture, analytics, and owner operations.'],
]

export default function InvestorsPage() {
  return (
    <main className="min-h-screen bg-[#071015] px-6 py-16 text-[#f4f1e9] md:px-12">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm text-[#d9b56f] hover:underline">
          ← Back to PropAuto AI
        </Link>
        <section className="mt-16 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.28em] text-[#d9b56f]">Investor & acquisition brief</p>
          <h1 className="mt-5 text-5xl font-semibold tracking-tight md:text-7xl">
            A premium marketplace ready for its next operator.
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/65">
            PropAuto AI combines a high-trust visual experience with lead capture, analytics, authentication, and an AI
            concierge. It is designed as a focused acquisition opportunity for an operator who wants to scale the
            category.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/contact" className="rounded-full bg-[#d9b56f] px-6 py-3 font-medium text-[#071015]">
              Request the brief
            </Link>
            <Link href="/" className="rounded-full border border-white/20 px-6 py-3">
              Explore the product
            </Link>
          </div>
        </section>
        <section className="mt-20 grid gap-5 md:grid-cols-3">
          {highlights.map(([title, description]) => (
            <article key={title} className="rounded-3xl border border-white/10 bg-white/[0.04] p-6">
              <h2 className="text-xl font-medium">{title}</h2>
              <p className="mt-4 leading-7 text-white/60">{description}</p>
            </article>
          ))}
        </section>
        <section className="mt-20 rounded-3xl border border-[#d9b56f]/30 bg-[#d9b56f]/10 p-8">
          <h2 className="text-2xl font-semibold">What transfers with the acquisition</h2>
          <p className="mt-4 max-w-3xl leading-7 text-white/70">
            The buyer receives the product codebase, deployment setup, analytics implementation, authentication
            foundation, lead capture flows, brand direction, and the operating opportunity to grow the marketplace.
          </p>
          <p className="mt-5 text-sm text-white/50">
            Traffic and revenue claims should be verified independently during due diligence.
          </p>
        </section>
      </div>
    </main>
  )
}
