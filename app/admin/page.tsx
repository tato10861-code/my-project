'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from '@/lib/auth-client'

type Analytics = { visitors: number; leads: number; botActions: number; source: string; recent: Array<{ id: number; eventName: string; path: string; createdAt: string }> }

type Revenue = { mrrCents: number; trialMrrCents: number; atRiskMrrCents: number; activeCount: number; trialingCount: number; pastDueCount: number; cancelingCount: number }

const usd = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(cents / 100)

export default function AdminPage() {
  const router = useRouter()
  const { data: session, isPending } = useSession()
  const [data, setData] = useState<Analytics | null>(null)
  const [error, setError] = useState(false)
  const [revenue, setRevenue] = useState<Revenue | null>(null)

  useEffect(() => {
    if (!isPending && !session?.user) router.replace('/sign-in')
  }, [isPending, router, session])

  useEffect(() => {
    if (!session?.user) return
    let active = true
    const loadAnalytics = () => fetch('/api/admin/analytics', { cache: 'no-store' }).then((response) => response.ok ? response.json() : Promise.reject()).then((nextData) => { if (active) { setData(nextData); setError(false) } }).catch(() => { if (active) setError(true) })
    void loadAnalytics()
    void fetch('/api/admin/revenue', { cache: 'no-store' }).then((response) => response.ok ? response.json() : Promise.reject()).then((next) => { if (active) setRevenue(next) }).catch(() => undefined)
    const interval = window.setInterval(loadAnalytics, 10000)
    return () => { active = false; window.clearInterval(interval) }
  }, [session?.user])

  if (isPending || !session?.user) return <main className="flex min-h-screen items-center justify-center bg-[#071014] text-[#f5f1e8]">جارٍ التحقق من صلاحية المالك...</main>

  return <main className="min-h-screen bg-[#071014] px-5 py-10 text-[#f5f1e8] lg:px-12"><div className="mx-auto max-w-[1440px]"><div className="flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs uppercase tracking-[0.2em] text-[#d5b77b]">PropAuto AI / Control room</p><h1 className="mt-3 font-serif text-4xl sm:text-6xl">Live business intelligence</h1><p className="mt-4 max-w-2xl text-[#b4c1bf]">Neon-backed activity, lead growth, and operator telemetry from your platform.</p></div><div className="flex gap-3"><button onClick={() => signOut().then(() => router.replace('/sign-in'))} className="rounded-full border border-[#f5f1e8]/15 px-5 py-3 text-sm">تسجيل الخروج</button><Link href="/" className="rounded-full border border-[#f5f1e8]/15 px-5 py-3 text-sm">Back to platform</Link></div></div>{error && <p className="mt-8 rounded-2xl border border-red-300/30 bg-red-300/10 p-4 text-red-100">Analytics are unavailable. Check the Neon connection.</p>}<div className="mt-10 grid gap-4 sm:grid-cols-3">{[['Visitors', data?.visitors ?? '—'], ['Qualified leads', data?.leads ?? '—'], ['Bot actions', data?.botActions ?? '—']].map(([label, value]) => <div key={label} className="rounded-3xl border border-[#f5f1e8]/10 bg-[#112127] p-6"><p className="text-sm text-[#80908d]">{label}</p><p className="mt-3 font-serif text-5xl text-[#d5b77b]">{value}</p><p className="mt-3 text-xs text-[#80908d]">Source: {data?.source ?? 'loading'}</p></div>)}</div><section className="mt-4 grid gap-4 sm:grid-cols-4">{[['MRR', revenue ? usd(revenue.mrrCents) : '—', `${revenue?.activeCount ?? 0} paying`], ['Trial pipeline', revenue ? usd(revenue.trialMrrCents) : '—', `${revenue?.trialingCount ?? 0} trialing`], ['At risk', revenue ? usd(revenue.atRiskMrrCents) : '—', `${revenue?.pastDueCount ?? 0} failed renewals`], ['Ending', revenue?.cancelingCount ?? '—', 'cancel at period end']].map(([label, value, note]) => <div key={label} className="rounded-3xl border border-[#f5f1e8]/10 bg-[#112127] p-6"><p className="text-sm text-[#80908d]">{label}</p><p className="mt-3 font-serif text-4xl text-[#d5b77b]">{value}</p><p className="mt-3 text-xs text-[#80908d]">{note}</p></div>)}</section><section className="mt-8 rounded-3xl border border-[#f5f1e8]/10 bg-[#112127] p-6"><h2 className="font-serif text-3xl">Recent activity</h2><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[620px] text-start text-sm"><thead className="border-b border-[#f5f1e8]/10 text-[#80908d]"><tr><th className="py-3 text-start font-normal">Event</th><th className="py-3 text-start font-normal">Path</th><th className="py-3 text-start font-normal">Time</th></tr></thead><tbody>{data?.recent.map((event) => <tr key={event.id} className="border-b border-[#f5f1e8]/5"><td className="py-4 text-[#d5b77b]">{event.eventName}</td><td className="py-4">{event.path}</td><td className="py-4 text-[#80908d]">{new Date(event.createdAt).toLocaleString()}</td></tr>) ?? <tr><td colSpan={3} className="py-8 text-[#80908d]">Loading live events…</td></tr>}</tbody></table></div></section></div></main>
}
