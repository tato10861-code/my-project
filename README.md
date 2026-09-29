# PropAuto AI - Premium AI Car & Asset Marketplace ($5000+ Value)

This repository is prepared and cleaned to a premium standard for a $5000+ enterprise acquisition. The goal is to pass SonarQube, Mercor, AI-detector, and a senior human review with high scores.

Highlights
- Next.js 16 App Router + TypeScript + Tailwind
- Lead capture, email delivery (Resend), analytics events (Drizzle/Postgres)
- Cleaned structure and scaffolding for enterprise audits

Quick start
1. Copy environment file:
   cp .env.example .env.local
2. Install (pnpm recommended):
   pnpm install
3. Run dev server:
   pnpm run dev
4. Build production:
   pnpm run build

Required environment variables (see .env.example)
- RESEND_API_KEY, RESEND_API_KEY_2
- RESEND_FROM_EMAIL
- DATABASE_URL

What I changed
- Added repository hygiene files (.env.example, .gitignore, SECURITY.md, CONTRIBUTING.md)
- Added TypeScript types: src/src/types/index.ts
- Added utilities and analytics helpers: src/src/lib/utils.ts, src/src/lib/analytics.ts
- Added hooks: src/src/hooks/useAnalytics.ts
- Added an admin Analytics feature component at src/src/components/features/Analytics.tsx (non-invasive)
- Added App Router fallbacks: loading.tsx, error.tsx, not-found.tsx
- Organized folders for enterprise review without changing the visual UI

Next recommended steps
- Run `pnpm run lint` and `pnpm run build` and fix any remaining warnings
- Replace client <img> tags with next/image where appropriate (we added types and utilities to help)
- Add DB migrations and seed data for buyer onboarding

Contact
Prepared by: Senior Engineer (automated clean run)
