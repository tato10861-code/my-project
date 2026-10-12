/**
 * @fileoverview Creates the booking table on first use. Mirrors
 * db/migrations/0003_bookings.sql; both are idempotent, so applying the file
 * by hand and this runtime check can run in either order.
 */
import { pool } from '@/lib/db'

export const BOOKINGS_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS propauto_bookings (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('viewing', 'test_drive')),
  starts_at timestamptz NOT NULL,
  listing_ref text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  language text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);
CREATE UNIQUE INDEX IF NOT EXISTS propauto_bookings_live_slot
  ON propauto_bookings (starts_at)
  WHERE status <> 'cancelled';
`

let ready: Promise<void> | null = null

/** Runs the schema once per server instance. A failure is retried on the next call. */
export function ensureBookingSchema(): Promise<void> {
  ready ??= pool.query(BOOKINGS_SCHEMA_SQL).then(
    () => undefined,
    (error: unknown) => {
      ready = null
      throw error
    },
  )
  return ready
}
