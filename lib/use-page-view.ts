import { useEffect } from 'react'

/** Records one page_view event per mount, keyed by a long-lived first-party session cookie. */
export function usePageView() {
  useEffect(() => {
    const cookieName = 'propauto_session_id'
    const existingCookie = document.cookie
      .split('; ')
      .find((cookie) => cookie.startsWith(`${cookieName}=`))
      ?.split('=')[1]
    const sessionId =
      existingCookie ||
      (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`)
    if (!existingCookie) document.cookie = `${cookieName}=${sessionId}; Max-Age=31536000; Path=/; SameSite=Lax`
    const payload = JSON.stringify({
      sessionId,
      eventName: 'page_view',
      path: window.location.pathname,
      metadata: { language: document.documentElement.lang },
    })
    const sent = navigator.sendBeacon('/api/events', new Blob([payload], { type: 'application/json' }))
    if (!sent)
      void fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      })
  }, [])
}
