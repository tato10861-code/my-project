# Changelog

All notable changes to PropAuto are documented here.

## Unreleased

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
