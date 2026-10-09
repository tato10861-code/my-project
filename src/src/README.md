# PropAuto AI

PropAuto is a multilingual real-estate and automotive lead platform with an on-site Sarah concierge, visitor analytics, lead capture, and owner notifications.

## Features

- Multilingual buyer and investor qualification
- On-site text concierge backed by a server route
- Optional in-page voice concierge with microphone permission
- Lead persistence and owner email notifications
- Session-based visitor analytics and admin dashboard
- Better Auth, Neon/Postgres, Drizzle, Resend, and Vercel AI Gateway integrations

## Stack

Next.js 16, React 19, TypeScript, Tailwind CSS, Drizzle ORM, Neon Postgres, Better Auth, AI SDK, Resend, and Vapi Web.

## Quick start

Requires Node 24 (see `.nvmrc`) and pnpm 10.

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local   # fill in the values you need
pnpm dev
```

## Checks

`pnpm check` runs everything CI runs, in order:

| Step | Command |
|---|---|
| Smoke test | `pnpm test:smoke` |
| Unit tests (Jest) | `pnpm test` (`pnpm test:coverage` adds a coverage report) |
| Lint | `pnpm lint` |
| Typecheck | `pnpm typecheck` |
| Dependency audit | `pnpm audit --prod --audit-level high` |
| Production build | `pnpm build` |

## Database

Tables are declared in `lib/db/schema.ts`. Schema changes ship as idempotent SQL
in `db/migrations/`; see its README for how to apply them.

## Payments

Checkout creates a Stripe Checkout session (`POST /api/checkout`). Paid sessions
are confirmed by the signed webhook `POST /api/webhooks/stripe`: create the
endpoint in Stripe for `checkout.session.completed` and
`checkout.session.async_payment_succeeded`, then set `STRIPE_WEBHOOK_SECRET`.
Each payment is recorded once and the owner is emailed.

## Environment

Use `.env.example` as the variable checklist. Keep production secrets in the deployment provider, never in Git. `RESEND_FROM_EMAIL` must be a verified sender for reliable production delivery. `NEXT_PUBLIC_VAPI_PUBLIC_KEY` must be a Vapi public key; private keys must remain server-side.

## Access

Only the owner account (`lib/owner.ts`) can be created or reach `/admin` and the analytics endpoints. Public endpoints are rate limited per client, validate every input with Zod, and cap request bodies on the bytes actually received.

## Deployment

Vercel builds the app from `main`. CI (`.github/workflows/ci.yml`) runs the checks above plus a secret scan on every push and pull request.

## Security

Read [SECURITY.md](SECURITY.md) before handling credentials or customer information.
