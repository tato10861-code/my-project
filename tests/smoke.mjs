import { access } from 'node:fs/promises'

const requiredFiles = [
  'app/page.tsx',
  'app/layout.tsx',
  'app/api/leads/route.ts',
  'app/api/sarah/route.ts',
  'app/api/checkout/route.ts',
  'app/robots.ts',
  'app/sitemap.ts',
  'lib/request-security.ts',
  'lib/leads.ts',
  'lib/events.ts',
  'lib/video-proxy.ts',
  'lib/payments.ts',
  'lib/owner.ts',
  'app/api/webhooks/stripe/route.ts',
  'db/migrations/0001_lead_details.sql',
  'scripts/migrate.mjs',
  'db/migrations/0000_base_schema.sql',
  'lib/migrations.ts',
  'lib/connection-string.ts',
  'lib/site-config.ts',
  'lib/db/rate-limit.ts',
  'lib/rate-limit-shared.ts',
  'app/api/health/route.ts',
  'lib/billing.ts',
  'lib/plans.ts',
  'db/migrations/0002_subscriptions.sql',
]

for (const file of requiredFiles) {
  await access(file)
}

console.log(`Smoke check passed: ${requiredFiles.length} required files found.`)
