// shared utilities used across the app

export function escapeHtml(value: string) {
  return value.replace(/[&<>"]+/g, (s) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[s] ?? s))
}

export async function fetchWithRetry(input: RequestInfo, init?: RequestInit, retries = 2, backoff = 300): Promise<Response> {
  // handles transient failures with exponential backoff
  try {
    const res = await fetch(input, init)
    if (!res.ok && retries > 0) {
      await new Promise((r) => setTimeout(r, backoff))
      return fetchWithRetry(input, init, retries - 1, backoff * 2)
    }
    return res
  } catch (err) {
    if (retries > 0) {
      await new Promise((r) => setTimeout(r, backoff))
      return fetchWithRetry(input, init, retries - 1, backoff * 2)
    }
    throw err
  }
}
