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

Tables are declared in `lib/db/schema.ts`. Schema changes ship as numbered SQL
files in `db/migrations/`, applied with the migration runner:

```bash
pnpm db:migrate            # apply pending migrations (use an unpooled DATABASE_URL_UNPOOLED)
pnpm db:migrate --status   # list applied and pending, change nothing
```

The runner applies each file once, inside a transaction, and records it in the
`propauto_migrations` table. It refuses to run if an applied file was edited or
removed, so add a new numbered file instead of changing an old one. CI builds a
fresh Postgres from these files on every pull request. Run it after deploying
code that ships a new migration; the app keeps working until then (rate limits
fall back to per-instance counting, Stripe deduplication to a lookup-only
check). See `db/migrations/README.md` for details.

## Payments

Checkout creates a Stripe Checkout session (`POST /api/checkout`). Paid sessions
are confirmed by the signed webhook `POST /api/webhooks/stripe`: create the
endpoint in Stripe for `checkout.session.completed` and
`checkout.session.async_payment_succeeded`, then set `STRIPE_WEBHOOK_SECRET`.
Each payment is recorded once (a unique index makes concurrent duplicate deliveries safe) and the owner is emailed.

## Environment

Use `.env.example` as the variable checklist. Keep production secrets in the deployment provider, never in Git. `RESEND_FROM_EMAIL` must be a verified sender for reliable production delivery. `NEXT_PUBLIC_VAPI_PUBLIC_KEY` must be a Vapi public key; private keys must remain server-side.

### Contact details

The public contact email, the WhatsApp number, the mailbox that receives lead, chat and payment notifications, and the owner login are environment variables, so a new operator sets them in the hosting dashboard without editing code: `NEXT_PUBLIC_CONTACT_EMAIL`, `NOTIFY_EMAIL`, `OWNER_EMAIL`, `NEXT_PUBLIC_WHATSAPP_NUMBER` and optionally `NEXT_PUBLIC_WHATSAPP_DISPLAY` (see `.env.example`). Unset values keep the built-in defaults, so an existing deployment is unchanged. The `NEXT_PUBLIC_` ones are baked into the build, so redeploy after changing them. The separate `agent/` configuration (`agent/instructions.md`) still names the owner's email and phone in plain text and must be edited by hand.

## Access

Only the owner account (`lib/owner.ts`) can be created or reach `/admin` and the analytics endpoints. Public endpoints are rate limited per client, with counters shared across server instances through Postgres (`propauto_rate_limits`), validate every input with Zod, and cap request bodies on the bytes actually received. State-changing `POST` routes reject requests from other origins. Booking confirmation links are signed, expire after 72 hours and confirm only through a same-origin `POST`, so mail scanners that open the link cannot confirm a booking.

## Deployment

Vercel builds the app from `main`. CI (`.github/workflows/ci.yml`) runs the checks above, a job that applies every migration to an empty Postgres 16 and confirms a second run is a no-op, and a secret scan, on every push and pull request.

## Security

Read [SECURITY.md](../../SECURITY.md) before handling credentials or customer information.
