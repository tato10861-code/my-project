import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const globalForDb = globalThis as unknown as { propautoPool?: Pool }
const connectionCandidates = [
  process.env.DATABASE_URL,
  process.env.DATABASE_URL_UNPOOLED,
  process.env.POSTGRES_PRISMA_URL,
  process.env.POSTGRES_URL_NON_POOLING,
  process.env.POSTGRES_URL,
  process.env.POSTGRES_URL_NO_SSL,
].filter((value): value is string => typeof value === 'string' && !/localhost|127\.0\.0\.1/.test(value))
const connectionString = connectionCandidates[0]

const safeConnectionString = connectionString ?? 'postgresql://not-configured.invalid/propauto'

export const pool = globalForDb.propautoPool ?? new Pool({ connectionString: safeConnectionString, max: 5, idleTimeoutMillis: 10000, connectionTimeoutMillis: 10000 })
globalForDb.propautoPool = pool

export const db = drizzle(pool, { schema })
