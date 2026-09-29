'use client'

import { useEffect, useState } from 'react'
import { fetchWithRetry } from '@/lib/utils'
import type { AnalyticsVisit } from '@/types'

// small dashboard component used by buyers to preview traffic
export function Analytics() {
  const [visits, setVisits] = useState<AnalyticsVisit[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        const res = await fetchWithRetry('/api/admin/analytics')
        if (!res.ok) throw new Error('Failed to fetch analytics')
        const data = await res.json()
        if (mounted) setVisits(data.visits ?? [])
      } catch (err) {
        if (mounted) setError((err as Error).message)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    void load()
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="p-4">Loading analytics...</div>
  if (error) return <div className="p-4 text-red-400">{error}</div>
  if (!visits || visits.length === 0) return <div className="p-4">No visits yet</div>

  return (
    <div className="p-4">
      <h3 className="font-semibold mb-2">Site visits (top paths)</h3>
      <ul className="space-y-2">
        {visits.map((v) => (
          <li key={v.path} className="flex justify-between">
            <span className="text-sm text-slate-300">{v.path}</span>
            <span className="text-sm font-medium">{v.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default Analytics
