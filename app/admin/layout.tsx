import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { requireOwner } from '@/lib/auth'

export const metadata: Metadata = { title: 'Control room', robots: { index: false, follow: false } }

// Read the session cookie on every request; the owner check must never be cached.
export const dynamic = 'force-dynamic'

/**
 * Checks the owner session on the server before anything under /admin renders,
 * so a visitor without it is redirected without receiving the dashboard shell
 * or its client bundle's markup. The page keeps its own client-side session
 * handling for sign-out, and /api/admin/* still enforces the owner check.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!(await requireOwner(await headers()))) redirect('/sign-in')
  return children
}
