/**
 * @fileoverview Planning rules for the SQL migration runner (scripts/migrate.mjs).
 *
 * Kept free of database and file-system access so the rules can be unit tested
 * directly. The runner reads the files and the ledger, asks {@link planMigrations}
 * what to do, and applies only what it returns. Uses erasable TypeScript syntax
 * only, because the runner imports this file under Node's type stripping.
 */
import { createHash } from 'node:crypto'

/** A migration file: its name (for example `0004_stripe_event_dedupe.sql`) and its SQL. */
export type MigrationFile = { name: string; sql: string }

/** What the ledger says about files already applied: file name -> checksum. */
export type AppliedMigrations = ReadonlyMap<string, string>

export type MigrationPlan = {
  /** Files not yet applied, in the order they must run. */
  pending: MigrationFile[]
  /** Applied files whose content has changed since they were applied. */
  drifted: string[]
  /** Applied files that no longer exist on disk. */
  missing: string[]
}

const NAME_PATTERN = /^(\d{4})_[a-z0-9_]+\.sql$/

/** SHA-256 of the file content, recorded in the ledger when a file is applied. */
export function migrationChecksum(sql: string): string {
  return createHash('sha256').update(sql).digest('hex')
}

/**
 * Decides what the runner must do.
 *
 * A file already in the ledger is never run again. If its content has changed
 * since, or the file has gone, the plan reports it so the runner can stop
 * instead of silently continuing on a schema nobody can account for.
 *
 * @param files - Every migration file on disk, in any order.
 * @param applied - The ledger contents.
 * @returns The pending files in order, plus any drifted or missing ones.
 * @throws {Error} When a file name does not match `NNNN_name.sql` or two files
 *   share a number, because the order would then be ambiguous.
 * @complexity O(n log n) time for n files.
 */
export function planMigrations(files: readonly MigrationFile[], applied: AppliedMigrations): MigrationPlan {
  const seen = new Map<string, string>()
  for (const file of files) {
    const match = NAME_PATTERN.exec(file.name)
    if (!match) throw new Error(`Invalid migration file name: ${file.name} (expected NNNN_name.sql)`)
    const clash = seen.get(match[1])
    if (clash) throw new Error(`Migrations ${clash} and ${file.name} share the number ${match[1]}`)
    seen.set(match[1], file.name)
  }

  const ordered = [...files].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
  const onDisk = new Set(ordered.map((file) => file.name))
  const pending: MigrationFile[] = []
  const drifted: string[] = []
  for (const file of ordered) {
    const checksum = applied.get(file.name)
    if (checksum === undefined) pending.push(file)
    else if (checksum !== migrationChecksum(file.sql)) drifted.push(file.name)
  }
  const missing = [...applied.keys()].filter((name) => !onDisk.has(name)).sort()
  return { pending, drifted, missing }
}
