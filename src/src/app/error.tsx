'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071014] px-6 text-white">
      <section className="max-w-md text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#d5b77b]">PropAuto</p>
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="mt-3 text-sm text-white/65">The page could not be loaded. Please try again.</p>
        <button type="button" onClick={reset} className="mt-6 rounded-full bg-[#d5b77b] px-5 py-3 text-sm font-semibold text-[#071014]">Try again</button>
      </section>
    </main>
  )
}
