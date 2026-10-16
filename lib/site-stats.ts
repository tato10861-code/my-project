/**
 * Public audience figures shown on the home page. Update from the Vercel
 * Analytics dashboard; never show a number that is not measured.
 */
export const SITE_STATS = {
  /** Visitors reported by Vercel Analytics. */
  visitors: 500,
  /** When the figure was last read from the dashboard (YYYY-MM). */
  asOf: '2026-10',
  source: 'Vercel Analytics',
} as const
