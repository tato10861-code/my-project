/**
 * @fileoverview Who the site's contact details point at.
 *
 * The public contact email, the WhatsApp number, the mailbox that receives
 * lead, chat and payment notifications, and the owner login used to be written
 * into the code. They are read from the environment now, so whoever deploys the
 * site sets them in the hosting dashboard without touching the source. When a
 * variable is unset the previous value is used, so an existing deployment keeps
 * working unchanged.
 *
 * Free of Next.js and database imports so it can be unit tested directly. The
 * `NEXT_PUBLIC_` variables are public by design (they are shown on the page) and
 * are read with literal names so the bundler can inline them into client code.
 */

const DEFAULT_CONTACT_EMAIL = 'propautoal@gmail.com'
/** Built-in owner login; deployments override it with OWNER_EMAIL. */
export const DEFAULT_OWNER_EMAIL = 'tato10861@gmail.com'
const DEFAULT_WHATSAPP_DIGITS = '967733393884'
const DEFAULT_WHATSAPP_DISPLAY = '+967 733 393 884'

const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** A trimmed, non-empty value, or undefined. */
function present(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/** A usable email address, or undefined (so a typo falls back to the default instead of breaking mail). */
function validEmail(value: string | undefined): string | undefined {
  const candidate = present(value)
  return candidate && EMAIL_SHAPE.test(candidate) ? candidate : undefined
}

/**
 * The public contact email shown on the site and in legal pages.
 * Set `NEXT_PUBLIC_CONTACT_EMAIL`.
 */
export function contactEmail(): string {
  return validEmail(process.env.NEXT_PUBLIC_CONTACT_EMAIL) ?? DEFAULT_CONTACT_EMAIL
}

/**
 * The mailbox that receives lead, chat and payment notifications. Set
 * `NOTIFY_EMAIL`; it falls back to the public contact email.
 */
export function notifyEmail(): string {
  return validEmail(process.env.NOTIFY_EMAIL) ?? contactEmail()
}

/**
 * The only email allowed to create the owner account and open /admin. Set
 * `OWNER_EMAIL`. Lower-cased, because the comparison is case-insensitive.
 */
export function ownerEmail(): string {
  return (validEmail(process.env.OWNER_EMAIL) ?? DEFAULT_OWNER_EMAIL).toLowerCase()
}

/**
 * The WhatsApp number as digits only, in international format without the
 * leading plus (the form `wa.me` links need). Set `NEXT_PUBLIC_WHATSAPP_NUMBER`.
 */
export function whatsappNumber(): string {
  const digits = present(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER)?.replace(/\D/g, '')
  return digits && digits.length >= 7 && digits.length <= 15 ? digits : DEFAULT_WHATSAPP_DIGITS
}

/**
 * The WhatsApp number as people read it. Set `NEXT_PUBLIC_WHATSAPP_DISPLAY` to
 * control spacing; otherwise it is the digits with a leading plus.
 */
export function whatsappDisplay(): string {
  const configured = present(process.env.NEXT_PUBLIC_WHATSAPP_DISPLAY)
  if (configured) return configured
  const digits = whatsappNumber()
  return digits === DEFAULT_WHATSAPP_DIGITS ? DEFAULT_WHATSAPP_DISPLAY : `+${digits}`
}
