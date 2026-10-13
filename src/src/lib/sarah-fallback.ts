/**
 * @fileoverview Tries Sarah's models in order until one answers. Generic over
 * the call, so the order and stop rules can be unit tested without a network.
 */

export type FallbackOptions = {
  /** Called for every model that failed, before the next one is tried. */
  onFailure?: (name: string, error: unknown) => void
  /** When true after a failure, stop instead of trying the next model. */
  stopAfterFailure?: () => boolean
}

/**
 * Runs `attempt` for each name in order and returns the first success with the
 * name that produced it. Throws the last error when none answers, or the
 * failure that made `stopAfterFailure` return true.
 */
export async function runWithModelFallback<T>(
  names: readonly string[],
  attempt: (name: string) => Promise<T>,
  options: FallbackOptions = {},
): Promise<{ result: T; model: string }> {
  let lastError: unknown = new Error('No model configured')
  for (const name of names) {
    try {
      return { result: await attempt(name), model: name }
    } catch (error) {
      lastError = error
      options.onFailure?.(name, error)
      if (options.stopAfterFailure?.()) break
    }
  }
  throw lastError
}
