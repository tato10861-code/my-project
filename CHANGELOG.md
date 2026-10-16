# Changelog

All notable changes to PropAuto are documented here.

## [Unreleased]

### Added
- `GET /api/ready` readiness probe: 200 when the database answers and sign-in is configured, 503 otherwise, with generic check names only.
- Owner dashboard shows monthly recurring revenue, trial pipeline, failed renewals and pending cancellations (`GET /api/admin/revenue`, `lib/revenue.ts`).
- Migration `0006_auth_tables.sql` creates the sign-in tables.

### Changed
- The app now lives at the repository root instead of `src/src`.
- Source is formatted with Prettier (`pnpm format`, checked in CI): several files had single lines of thousands of characters. The landing page's content and its tracking, chat and lead-form logic moved out of `app/page.tsx` into `lib/`.
- `package.json` now carries the product description, author, homepage and repository.

## [1.1.0] - 2026-10-09

### Added
- Monthly subscriptions: Starter ($49), Growth ($149) and Scale ($399) with a 14-day free trial (card collected up front), sold through Stripe-hosted Checkout from a new pricing section. Prices are resolved from Stripe lookup keys, so test and live accounts need no code change.
- Subscription state synced to `propauto_subscriptions` (`db/migrations/0002_subscriptions.sql`) from `customer.subscription.*` webhooks; out-of-order events never overwrite newer state.
- Owner emails for new subscriptions and failed renewal payments (`invoice.payment_failed`).
- Optional Stripe Tax (`STRIPE_AUTOMATIC_TAX=true`), business tax-id collection and a customer-portal link (`NEXT_PUBLIC_STRIPE_PORTAL_URL`).

### Fixed
- A paid subscription checkout is no longer also reported as a one-time payment.

## [1.0.1] - 2026-10-09

### Changed
- Dependencies: Stripe SDK 23, `@vercel/analytics` 2, and current minor and patch releases of the AI SDK, Better Auth, Drizzle, Zod, Resend, `pg` and UI packages. `pnpm audit` remains clean.
- CI: `actions/checkout` v7, `actions/setup-node` v6, `pnpm/action-setup` v6, Datadog synthetics v4.1.1.

### Security
- `@vercel/connect` stays on 0.4.x: 2.x depends on `@modelcontextprotocol/sdk` < 1.31 and `proxy-addr` < 2.0.8, both with published advisories.

## [1.0.0] - 2026-10-09

### Security
- Account creation is limited to the owner's email: the public sign-up endpoint can no longer be used to create arbitrary accounts.
- Business analytics (`/api/analytics`) now require the owner session, like `/api/admin/analytics`.
- Rate limiting uses a sliding window keyed on platform-set client IP headers; a caller can no longer double its budget at a window boundary or rotate `x-forwarded-for` to bypass it.
- Request body limits are enforced on the bytes actually received, so chunked requests without `Content-Length` cannot bypass them.
- Plain-http origins are accepted only in development.
- Sign-in and sign-up no longer prefill or display the owner's email address; auth and admin pages are `noindex`.
- Added `X-Frame-Options`, a `frame-ancestors` CSP and `includeSubDomains` HSTS; the microphone is allowed only for this origin (voice concierge).
- Root `next` upgraded 16.3.0 → 16.3.8 with patched `sharp` and `source-map-js`: `pnpm audit` is clean at both package roots.
- `.env` and `.env.*` are now gitignored at the repository root.

### Added
- `GET /api/health` liveness endpoint for uptime monitors; it reports the deployed commit and never touches the database.
- Coverage floors enforced in CI (lines 95%, statements 95%, functions 90%, branches 85%).
- Repository-level README with architecture overview, issue templates and contribution conventions.
- Signed Stripe webhook (`/api/webhooks/stripe`): each paid checkout is verified, recorded once and emailed to the owner.
- Leads keep phone, budget, message and language (`db/migrations/0001_lead_details.sql`); until the migration is applied, intake falls back to the core fields instead of failing.
- Generated 1200×630 PNG share image for social networks.
- Full terms of use and a privacy policy that lists what is collected and who processes it.

### Fixed
- Market prices are rate limited and cached at the edge for a minute instead of calling the provider on every visit.
- Checkout: removed the `integration_identifier` field Stripe rejects, and the contact-section payment link now POSTs instead of a GET that answered 405.
- Leads: a storage outage answers 503 instead of 400; a stored lead whose email notification fails answers 202 so the visitor is not invited to submit twice; notification retries are deduplicated with a stable idempotency key; chatbot transcripts over 1000 characters are accepted.
- Events: the ingestion vocabulary now includes `asset_view` and `conversation_started`, which the reports count.
- Video proxy: upstream timeout and client-abort propagation; partial responses are never publicly cached and vary on `Range`.
- Money math: locale-correct formatting without floating-point digit loss, exact `fromCents`, symmetric rounding for negative values, correct ROI sign for negative bases, neutral `0.00%` for no change, `clampInt` with infinities.
- Local development can use a `localhost` database again.
- `test:unit` ran nothing in CI (directory argument); it now runs every suite.

### Tooling
- Unit tests run on Jest with coverage (58 tests, about 98% of statements in `lib/`); CI runs them with the coverage report.
- The incomplete static-site workspace and the archive zip snapshots moved to the `archive/static-site-and-snapshots` branch (see `ARCHIVE.md`).
- CI runs smoke tests, unit tests, lint, typecheck, dependency audit and build as separate named steps, so a failure names its stage.
- CI moved to the repository root, where GitHub actually runs it; pnpm is set up before Node's pnpm cache; secret scanning covers all tracked files and common key formats.
- Repaired the corrupted Dependabot, Datadog Synthetics and devcontainer configuration files.
- Added `.nvmrc` (Node 24) and unit suites for leads, events and the video proxy (50 tests).

### Earlier unreleased work
- Added SEO routes for robots and sitemap generation.
- Added privacy and terms pages for production trust and compliance.
- Continued hardening checkout, API validation, secret handling, and security headers.

## 2026-10-02 — Reliability hardening

- Moved checkout initiation to POST with server-side product validation.
- Added production dependency auditing to CI.
- Upgraded Next.js and patched dependency resolutions.
- Added explicit error states for AI and API failures.

## 2026-10-01 — Platform polish

- Improved optimized image delivery with `next/image`.
- Added CI checks for linting, TypeScript, builds, and tracked secret patterns.
- Added loading, error, and not-found application states.
- Added project security, contribution, and environment documentation.

## Development history

The repository history contains the corresponding feature branches and merge commits. Dates and entries describe changes that are actually present in Git; no historical dates are fabricated.
