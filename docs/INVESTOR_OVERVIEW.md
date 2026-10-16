# PropAuto AI: technical and commercial overview

PropAuto AI is a multilingual sales platform for luxury real estate and collector-car dealers. An AI concierge
("Sarah") qualifies buyers and investors on the dealer's site, captures the lead, books viewings and test drives,
and gives the owner a private dashboard. Dealers pay a monthly subscription.

This page states what the repository contains and how it was verified. Every figure below can be reproduced from the
code; nothing here is an estimate of customers, revenue or market size.

## What is built

| Area | What exists |
|---|---|
| Public site | Bilingual (English and Arabic) landing page, pricing, contact, privacy and terms pages |
| AI concierge | Chat that qualifies a lead, answers from listing data, falls back across several models, and books viewings through tool calls; optional voice concierge |
| Lead capture | Validated intake with owner email alerts and delivery-failure handling that never invites a double submit |
| Bookings | Slot listing, database-enforced exclusivity, signed time-limited confirmation links, confirmation by explicit POST |
| Billing | Three monthly plans (Starter $49, Growth $149, Scale $399) with a 14-day trial through Stripe Checkout, signed webhooks, subscription state kept in the database |
| Owner dashboard | Visitors, qualified leads, bot actions, and recurring revenue (MRR, trial pipeline, failed renewals, pending cancellations) |
| Operations | Liveness (`/api/health`) and readiness (`/api/ready`) probes, structured JSON logs (`lib/log.ts`), versioned SQL migrations with a checksum-verified ledger |

## Engineering evidence

- **224 automated tests in 29 suites** (unit and route-level). CI enforces coverage floors on the business logic
  (95% lines and statements, 90% functions, 85% branches).
- **CI on every pull request:** tests with coverage, formatting, lint, type check, dependency audit, production
  build, a secret scan, and a job that builds a brand-new Postgres database from the migrations alone.
- **17 API routes**, **7 migrations**, about 5,800 lines of application TypeScript, formatted with Prettier.
- **Exact money arithmetic.** Amounts are integer cents on `BigInt`, with explicit rounding rules and bounds checks,
  so returns and totals do not drift as floating-point values do.
- **Defended public endpoints.** Sliding-window rate limits (in memory plus a shared Postgres store that fails open),
  body-size caps enforced on the bytes actually received, origin checks on state-changing requests, and a
  server-side owner check on the admin area.
- **Payments handled safely.** Webhook signatures are verified, each event is recorded at most once under a unique
  index, and an older event never overwrites newer subscription state.

## Honest status

- Billing, bookings, lead capture, analytics and the owner dashboard are implemented and deployed. The deployment
  runs against test-mode Stripe keys until live keys are set; no live revenue is claimed here.
- Voice (Vapi) and the language models (Gemini) are external services configured per deployment. WhatsApp is a link
  to a number, not an integrated channel.
- Visitor session ids are issued by the browser, and booking and chat state are not yet time-zone aware per advisor.

## Roadmap (not yet built)

1. Enforce plan entitlements in the product (`lib/revenue.ts` already decides access per subscription, including a
   grace period for failed renewals).
2. Outbox for owner notifications, so a failed email is retried instead of lost.
3. Server-persisted chat conversations and per-advisor, time-zone-aware calendars with reminders.
4. Error tracking (for example Sentry, which needs an account) and an end-to-end browser test.
5. Data retention and roll-ups for the events table.

## Ownership and reuse

All rights are reserved by the owner (see `LICENSE`). The hand-over checklist in [`HANDOVER.md`](HANDOVER.md)
lists every external account, secret and contact detail a new owner must replace. The project's origin and its
August 2026 start on v0 and Vercel are recorded in [`../evidence/PROJECT_ORIGIN.md`](../evidence/PROJECT_ORIGIN.md).
