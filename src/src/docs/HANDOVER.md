# Handover guide

Everything a new operator needs to take over and run PropAuto AI. For the architecture see `ARCHITECTURE.md`; for daily development see `DEVELOPMENT.md`.

## What it is

A Next.js 16 site for luxury real-estate and automotive lead generation: a landing page, a chat concierge ("Sarah") that qualifies leads and requests viewings, lead capture with email notifications, Stripe subscriptions and one-time payments, and an owner-only dashboard.

## Accounts the project depends on

Each of these is registered to the current owner and must be recreated or transferred.

| Service | Used for | What to do |
|---|---|---|
| GitHub | Source code, CI | Transfer the repository or fork it |
| Vercel | Hosting, deployments, env vars | Create a project from the repo; transfer or recreate |
| Neon | Postgres database | Create a database; the schema is in `db/migrations/` |
| Stripe | Payments and subscriptions | Create your own account; the current key is a sandbox key |
| Resend | Transactional email | Create an account and verify a sending domain |
| Google AI Studio (Gemini) | Sarah's model | Create an API key (optional; otherwise Vercel AI Gateway is used) |
| Vapi | Voice concierge | Optional; needs a public key |
| Domain / DNS | Public address | Point it at the Vercel project |

## Configuration

Set these in Vercel (Project > Settings > Environment Variables). `.env.example` is the authoritative list with comments; this table groups them.

| Group | Variables | Notes |
|---|---|---|
| Site | `NEXT_PUBLIC_SITE_URL`, `PUBLIC_APP_URL`, `BETTER_AUTH_URL` | The public https origin of your deployment |
| Database | `DATABASE_URL`, `DATABASE_URL_UNPOOLED` | The Vercel Neon integration sets these; the unpooled URL is for migrations |
| Auth | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| Your identity | `NEXT_PUBLIC_CONTACT_EMAIL`, `NOTIFY_EMAIL`, `OWNER_EMAIL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`, `NEXT_PUBLIC_WHATSAPP_DISPLAY` | **Set all of these before launch.** Unset values fall back to the previous owner's details |
| Email | `RESEND_API_KEY`, `RESEND_FROM_EMAIL` | The from address must be on a verified domain |
| Payments | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_AUTOMATIC_TAX`, `NEXT_PUBLIC_STRIPE_PORTAL_URL` | See "Payments" below |
| Sarah | `GOOGLE_GENERATIVE_AI_API_KEY`, `SARAH_MODEL`, `SARAH_FALLBACK_MODELS` | Optional |
| Booking | `BOOKING_SECRET`, `BOOKING_NOTIFY_EMAIL`, `GMAIL_APP_PASSWORD` | Booking stays off until the required ones are set; `BOOKING_SECRET` must be 32+ random characters |
| Market data | `MARKET_DATA_API_URL`, `MARKET_DATA_API_KEY` | Without them the market-prices endpoint answers 503 |
| Voice | `NEXT_PUBLIC_VAPI_PUBLIC_KEY` | Optional |

Variables starting with `NEXT_PUBLIC_` are baked into the build: redeploy after changing them.

## Database

```bash
cd src/src
export DATABASE_URL_UNPOOLED="<direct, unpooled Neon connection string>"
pnpm db:migrate --status   # what is applied / pending
pnpm db:migrate            # apply pending migrations
```

The runner creates the tables in `db/migrations/`, records each applied file in `propauto_migrations`, and refuses to run if an applied file was edited. The better-auth tables (`user`, `session`, ...) are not part of these files; create them with the better-auth CLI (`npx @better-auth/cli migrate`) against the same database.

## Owner account

Sign-up is restricted to the email in `OWNER_EMAIL`. Open `/sign-up`, register that address, then sign in at `/sign-in` and use `/admin`. Anyone else is refused.

## Payments

1. Use your own Stripe account and a live secret key in `STRIPE_SECRET_KEY` when you are ready to take real payments.
2. Create products/prices whose lookup keys match the plans in `lib/plans.ts`.
3. Add a webhook endpoint `https://<your-domain>/api/webhooks/stripe` for `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted` and `invoice.payment_failed`, and put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. The dashboard shows recurring revenue (MRR, trial pipeline, failed renewals, pending cancellations) from the synced subscriptions; only live-mode subscriptions count, so sandbox checkouts never inflate it. `lib/revenue.ts` also holds `entitlementFor`, which decides access per subscription: active and trialing grant it, `past_due` keeps it for a 7-day grace period, everything else does not.

## Things that are not environment variables

- `agent/instructions.md` (the separate agent configuration) names the previous owner's email and phone in plain text. Edit it by hand.
- The brand name "PropAuto", the footer links (YouTube, LinkedIn), the video, the stock images and the legal pages (`app/privacy`, `app/terms`) are content. Replace or have them reviewed for your business and jurisdiction.
- `LICENSE` is proprietary ("all rights reserved"). Ownership, licensing and trademark questions need a lawyer, not this document.

## Before the transfer (current owner)

- Rotate or revoke every secret listed above: the database password, Stripe, Resend, Gemini and Vapi keys, `BETTER_AUTH_SECRET` and `BOOKING_SECRET`.
- Decide what happens to existing data (leads, events, subscriptions, bookings): export it or delete it.
- Remove your accounts from the Vercel project, the Neon project and the Stripe account, or hand them over.
- Confirm the new operator can deploy from a clean clone.

## Verifying a fresh deployment

1. `pnpm check` passes locally (smoke test, unit tests, lint, typecheck, audit, build).
2. `/api/health` answers `{"status":"ok"}`.
3. Submit the contact form: a row appears in `propauto_leads` and the email arrives at `NOTIFY_EMAIL`.
4. Load the home page twice: rows appear in `propauto_events` and `propauto_rate_limits`.
5. In Stripe, send a test webhook: one row in `propauto_operator_logs`, one email; sending the same event again adds nothing.
6. Runtime logs show no `not-configured.invalid` or `does not exist` errors.

## Known limitations

Be aware of these before you rely on or value the project:

- Payments have only been exercised in Stripe's sandbox; there is no live revenue history in the repository.
- There are no browser (end-to-end) tests and no load tests; the API routes are covered by unit-level route tests with the database mocked.
- No error-tracking service is wired in; failures are visible only in the hosting provider's logs.
- The page and chat widget are Arabic and English; the chat widget also has French and Spanish. The rest of the page is not translated into other languages.
- `agents/sara-closer` is a separate app inside this repository with its own copy of the booking-confirmation route; it has not had the same hardening as `src/src`.
- The project layout is nested (`src/src`) and the root build copies `.next` into place; it works, but it is more complicated than it needs to be.
