import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { withExplicitSslMode } from '@/lib/connection-string'
import * as schema from './schema'

const globalForDb = globalThis as unknown as { propautoPool?: Pool }
const connectionCandidates = [
  process.env.DATABASE_URL,
  process.env.DATABASE_URL_UNPOOLED,
  process.env.POSTGRES_PRISMA_URL,
  process.env.POSTGRES_URL_NON_POOLING,
  process.env.POSTGRES_URL,
  process.env.POSTGRES_URL_NO_SSL,
].filter((value): value is string => typeof value === 'string' && value.trim() !== '')
const connectionString = connectionCandidates[0]

const safeConnectionString = connectionString
  ? withExplicitSslMode(connectionString)
  : 'postgresql://not-configured.invalid/propauto'

/**
 * Shared Postgres connection pool (cached on globalThis to survive HMR).
 * Falls back to an invalid placeholder URL so the module never crashes at
 * import time when the environment is not configured.
 */
export const pool =
  globalForDb.propautoPool ??
  new Pool({ connectionString: safeConnectionString, max: 5, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 })
globalForDb.propautoPool = pool

/** Drizzle ORM instance bound to the shared pool and schema. */
export const db = drizzle(pool, { schema })
