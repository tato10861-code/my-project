/** Email address of the platform owner; the only account allowed into /admin. */
export const OWNER_EMAIL = 'tato10861@gmail.com'

/** Case- and whitespace-insensitive comparison against {@link OWNER_EMAIL}. */
export function isOwnerEmail(email: string | null | undefined) {
  return typeof email === 'string' && email.trim().toLowerCase() === OWNER_EMAIL
}
