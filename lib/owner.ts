import { DEFAULT_OWNER_EMAIL, ownerEmail } from '@/lib/site-config'

/**
 * The built-in owner email, the platform owner's login when OWNER_EMAIL is not
 * set. The only account allowed into /admin is the configured owner (see
 * lib/site-config.ts).
 */
export const OWNER_EMAIL = DEFAULT_OWNER_EMAIL

/** Case- and whitespace-insensitive comparison against the configured owner email. */
export function isOwnerEmail(email: string | null | undefined) {
  return typeof email === 'string' && email.trim().toLowerCase() === ownerEmail()
}
