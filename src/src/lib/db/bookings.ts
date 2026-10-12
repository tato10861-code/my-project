/**
 * @fileoverview Storage for viewing and test-drive bookings. Uses the shared
 * Postgres pool; the partial unique index in db/migrations/0003_bookings.sql
 * is what prevents two live requests for the same slot.
 */
import { randomUUID } from 'node:crypto'
import { pool } from '@/lib/db'
import type { BookingRequest } from '@/lib/bookings'
import { ensureBookingSchema } from '@/lib/db/bookings-schema'

export type CreateResult = { ok: true; id: string } | { ok: false; reason: 'slot_taken' }

/** Start times (ISO) already held by a live booking in [from, to). */
export async function takenStarts(from: Date, to: Date): Promise<Set<string>> {
  await ensureBookingSchema()
  const { rows } = await pool.query<{ starts_at: Date }>(
    `SELECT starts_at FROM propauto_bookings
     WHERE status <> 'cancelled' AND starts_at >= $1 AND starts_at < $2`,
    [from, to],
  )
  return new Set(rows.map((row) => row.starts_at.toISOString()))
}

export async function createPendingBooking(input: BookingRequest): Promise<CreateResult> {
  const id = `bk_${randomUUID()}`
  await ensureBookingSchema()
  try {
    await pool.query(
      `INSERT INTO propauto_bookings
         (id, kind, starts_at, listing_ref, customer_name, customer_phone, customer_email, language, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')`,
      [id, input.kind, input.startsAt, input.listingRef, input.name, input.phone, input.email ?? null, input.language ?? null],
    )
    return { ok: true, id }
  } catch (error) {
    if (typeof error === 'object' && error !== null && (error as { code?: string }).code === '23505') {
      return { ok: false, reason: 'slot_taken' }
    }
    throw error
  }
}

/** Cancels a request that could not be announced, so the slot is released. */
export async function cancelBooking(id: string): Promise<void> {
  await ensureBookingSchema()
  await pool.query(`UPDATE propauto_bookings SET status = 'cancelled' WHERE id = $1`, [id])
}

export type ConfirmResult = 'confirmed' | 'already_confirmed' | 'cancelled' | 'not_found'

export async function confirmBooking(id: string): Promise<ConfirmResult> {
  await ensureBookingSchema()
  const updated = await pool.query<{ status: string }>(
    `UPDATE propauto_bookings SET status = 'confirmed', confirmed_at = now()
     WHERE id = $1 AND status = 'pending' RETURNING status`,
    [id],
  )
  if (updated.rowCount) return 'confirmed'
  const current = await pool.query<{ status: string }>(`SELECT status FROM propauto_bookings WHERE id = $1`, [id])
  if (!current.rowCount) return 'not_found'
  return current.rows[0].status === 'confirmed' ? 'already_confirmed' : 'cancelled'
}
