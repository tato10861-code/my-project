import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071014] px-6 text-white">
      <section className="max-w-md text-center">
        <p className="mb-3 text-xs uppercase tracking-[0.25em] text-[#d5b77b]">404</p>
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="mt-3 text-sm text-white/65">The PropAuto page you requested does not exist.</p>
        <Link
          href="/"
          className="mt-6 inline-flex rounded-full bg-[#d5b77b] px-5 py-3 text-sm font-semibold text-[#071014]"
        >
          Return home
        </Link>
      </section>
    </main>
  )
}
