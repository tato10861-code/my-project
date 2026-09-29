// analytics helper for client and server event recording

export async function recordEvent(event: { sessionId: string; eventName: string; path?: string; metadata?: Record<string, unknown> }) {
  // send via navigator.sendBeacon when possible, otherwise fallback to fetch
  try {
    const payload = JSON.stringify({ sessionId: event.sessionId, eventName: event.eventName, path: event.path ?? '/', metadata: event.metadata ?? {} })
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([payload], { type: 'application/json' })
      navigator.sendBeacon('/api/events', blob)
      return { ok: true }
    }
    const res = await fetch('/api/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload })
    return { ok: res.ok }
  } catch (err) {
    return { ok: false }
  }
}
