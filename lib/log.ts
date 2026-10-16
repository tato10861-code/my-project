/**
 * @fileoverview Structured logging: one JSON object per line, so a log drain or
 * `vercel logs | jq` can filter by level, event or field instead of grepping
 * free text. Callers pass an event name and plain fields; errors are reduced to
 * their message so a stack, a connection string or a request body is never
 * written by accident.
 */

export type LogLevel = 'info' | 'warn' | 'error'

export type LogFields = Record<string, string | number | boolean | null | undefined>

/** The message of an error-like value, or "unknown error". */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  if (typeof error === 'string') return error
  return 'unknown error'
}

/**
 * Writes one structured log line.
 *
 * @param level - Severity; routed to the matching console method.
 * @param event - Stable dotted name such as "stripe-webhook.recording_failed".
 * @param fields - Extra scalar fields to include.
 */
export function log(level: LogLevel, event: string, fields: LogFields = {}): void {
  const line = JSON.stringify({ level, event, time: new Date().toISOString(), ...fields })
  if (level === 'error') console.error(line)
  else if (level === 'warn') console.warn(line)
  else console.info(line)
}
