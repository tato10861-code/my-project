'use client'
import { useEffect } from 'react'
import { recordEvent } from '@/lib/analytics'

// client hook to record a page view on mount
export function useAnalytics() {
  useEffect(() => {
    try {
      const cookieName = 'propauto_session_id'
      const existingCookie = document.cookie.split('; ').find((c) => c.startsWith(`${cookieName}=`))?.split('=')[1]
      const sessionId = existingCookie || (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
      if (!existingCookie) document.cookie = `${cookieName}=${sessionId}; Max-Age=31536000; Path=/; SameSite=Lax`
      void recordEvent({ sessionId, eventName: 'page_view', path: window.location.pathname, metadata: { language: document.documentElement.lang } })
    } catch (err) {
      // swallow analytics errors so they don't affect UX
    }
  }, [])
}
