/**
 * @fileoverview Makes the TLS mode of a Postgres connection string explicit.
 *
 * `pg` currently treats `sslmode=require`, `prefer` and `verify-ca` as aliases
 * for `verify-full` and prints a security warning on every start, because a
 * future major version will switch them to libpq's weaker semantics. Writing
 * `verify-full` ourselves keeps today's behavior exactly (certificates and host
 * names are verified), removes the warning, and means a later `pg` upgrade
 * cannot silently weaken the connection. Free of database and Next.js imports
 * so it can be unit tested directly; it uses erasable TypeScript only, because
 * scripts/migrate.mjs imports it under Node's type stripping.
 */

const LEGACY_ALIASES = new Set(['require', 'prefer', 'verify-ca'])

/**
 * Rewrites a legacy `sslmode` to `verify-full`.
 *
 * Left untouched: strings with no `sslmode`, with `verify-full`, `disable`,
 * `no-verify` or `allow`, strings that opt into libpq semantics with
 * `uselibpqcompat`, and anything that is not a parseable URL.
 *
 * @param connectionString - A `postgres://` or `postgresql://` URL.
 * @returns The same URL with only the `sslmode` value changed, when it applies.
 * @complexity O(n) in the length of the string.
 */
export function withExplicitSslMode(connectionString: string): string {
  let url: URL
  try {
    url = new URL(connectionString)
  } catch {
    return connectionString
  }
  if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:') return connectionString
  const mode = url.searchParams.get('sslmode')
  if (mode === null || !LEGACY_ALIASES.has(mode) || url.searchParams.has('uselibpqcompat')) return connectionString
  url.searchParams.set('sslmode', 'verify-full')
  return url.toString()
}
