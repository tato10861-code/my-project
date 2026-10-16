export default function Loading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#071014] px-6 text-white">
      <div className="text-center" role="status" aria-live="polite">
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[#d5b77b]/25 border-t-[#d5b77b]" />
        <p className="text-sm text-white/70">Loading PropAuto...</p>
      </div>
    </main>
  )
}
