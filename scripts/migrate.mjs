/**
 * Applies the SQL files in db/migrations/ in order, exactly once each, and
 * records them in the propauto_migrations ledger.
 *
 *   pnpm db:migrate            apply pending migrations
 *   pnpm db:migrate --status   list applied and pending, change nothing
 *
 * Exits non-zero when an applied file has been edited or has disappeared, or
 * when a migration fails (that migration is rolled back; earlier ones stay).
 * The first run on a database that was migrated by hand re-applies the files;
 * they are idempotent, so that is harmless.
 */
import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import { withExplicitSslMode } from '../lib/connection-string.ts'
import { migrationChecksum, planMigrations } from '../lib/migrations.ts'

const directoryUrl = new URL('../db/migrations/', import.meta.url)
const statusOnly = process.argv.includes('--status')
// Same variables as lib/db/index.ts; the unpooled URL first, since migrations
// take an advisory lock and run DDL, which a transaction pooler can break.
const connectionString = [
  process.env.DATABASE_URL_UNPOOLED,
  process.env.POSTGRES_URL_NON_POOLING,
  process.env.DATABASE_URL,
  process.env.POSTGRES_URL,
].find((value) => typeof value === 'string' && value.trim() !== '')

if (!connectionString) {
  console.error(
    '[migrate] No database URL set (DATABASE_URL_UNPOOLED, POSTGRES_URL_NON_POOLING, DATABASE_URL or POSTGRES_URL).',
  )
  process.exit(1)
}

const names = (await readdir(fileURLToPath(directoryUrl))).filter((name) => name.endsWith('.sql'))
const files = await Promise.all(
  names.map(async (name) => ({ name, sql: await readFile(new URL(name, directoryUrl), 'utf8') })),
)

const client = new pg.Client({ connectionString: withExplicitSslMode(connectionString) })
await client.connect()
let exitCode = 0
try {
  // One runner at a time, even if two deploys start together.
  await client.query('SELECT pg_advisory_lock(hashtext($1))', ['propauto_migrations'])
  await client.query(`CREATE TABLE IF NOT EXISTS propauto_migrations (
    name text PRIMARY KEY,
    checksum text NOT NULL,
    applied_at timestamptz NOT NULL DEFAULT now()
  )`)
  const { rows } = await client.query('SELECT name, checksum FROM propauto_migrations')
  const plan = planMigrations(files, new Map(rows.map((row) => [row.name, row.checksum])))

  for (const name of plan.drifted) console.error(`[migrate] CHANGED after it was applied: ${name}`)
  for (const name of plan.missing) console.error(`[migrate] MISSING from db/migrations: ${name}`)
  if (plan.drifted.length > 0 || plan.missing.length > 0) {
    console.error(
      '[migrate] Refusing to continue. Restore the file, or add a new migration instead of editing an applied one.',
    )
    exitCode = 1
  } else if (statusOnly) {
    console.log(`[migrate] applied: ${rows.length}, pending: ${plan.pending.length}`)
    for (const file of plan.pending) console.log(`  pending  ${file.name}`)
  } else {
    for (const file of plan.pending) {
      try {
        await client.query('BEGIN')
        await client.query(file.sql)
        await client.query('INSERT INTO propauto_migrations (name, checksum) VALUES ($1, $2)', [
          file.name,
          migrationChecksum(file.sql),
        ])
        await client.query('COMMIT')
        console.log(`[migrate] applied ${file.name}`)
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined)
        console.error(`[migrate] FAILED ${file.name}: ${error instanceof Error ? error.message : error}`)
        exitCode = 1
        break
      }
    }
    if (exitCode === 0) console.log(plan.pending.length === 0 ? '[migrate] up to date' : '[migrate] done')
  }
} finally {
  await client.end()
}
process.exit(exitCode)
