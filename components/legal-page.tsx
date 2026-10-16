import type { ReactNode } from 'react'

export type LegalSection = { heading: string; body: ReactNode }

/** Shared layout for the legal pages. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string
  updated: string
  intro: ReactNode
  sections: LegalSection[]
}) {
  return (
    <main className="min-h-screen bg-[#071014] px-6 py-20 text-[#f5f1e8]">
      <article className="mx-auto max-w-3xl space-y-6">
        <p className="text-sm text-[#d5b77b]">PropAuto AI</p>
        <h1 className="text-4xl font-semibold">{title}</h1>
        <p className="text-sm text-white/50">Last updated: {updated}</p>
        <p className="text-white/70">{intro}</p>
        {sections.map((section) => (
          <section key={section.heading} className="space-y-3">
            <h2 className="text-2xl font-semibold">{section.heading}</h2>
            <div className="space-y-3 text-white/70">{section.body}</div>
          </section>
        ))}
      </article>
    </main>
  )
}
