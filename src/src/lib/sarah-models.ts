/**
 * @fileoverview Which Gemini models Sarah may use, in the order she tries them.
 *
 * Google's free tier gives every model its own daily request allowance, so a
 * second model is a second allowance. Names are settings, never code: Google
 * retires versions for new accounts without notice.
 */

/** Used when SARAH_MODEL is not set. */
export const DEFAULT_SARAH_MODEL = 'gemini-3.8-flash'

/**
 * Model names in the order to try them: SARAH_MODEL (or the default) first, then
 * each name in SARAH_FALLBACK_MODELS (comma separated). Blank entries and
 * repeats are dropped, so a typo cannot make Sarah retry the same model.
 */
export function sarahModelNames(env: Record<string, string | undefined> = process.env): string[] {
  const primary = env.SARAH_MODEL?.trim() || DEFAULT_SARAH_MODEL
  const fallbacks = (env.SARAH_FALLBACK_MODELS ?? '')
    .split(',')
    .map((name) => name.trim())
    .filter((name) => name !== '')
  return [...new Set([primary, ...fallbacks])]
}
