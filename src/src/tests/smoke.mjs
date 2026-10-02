import { access } from 'node:fs/promises'

const requiredFiles = [
  'app/page.tsx',
  'app/layout.tsx',
  'app/api/leads/route.ts',
  'app/api/sarah/route.ts',
  'app/api/checkout/route.ts',
  'app/robots.ts',
  'app/sitemap.ts',
]

for (const file of requiredFiles) {
  await access(file)
}

console.log(`Smoke check passed: ${requiredFiles.length} required files found.`)
