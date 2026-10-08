# Changelog — PropAuto AI

All notable changes to this project are documented here. The project's
deployment history (127 production deployments between 2026-09-07 and
2026-10-07 across 25 development branches) is preserved in
`recovery/vercel-deployment-history.md` and `recovery/deployments-raw.json`.

The format follows [Keep a Changelog](https://keepachangelog.com/) semantics:
each entry records what a visitor or investor-facing build actually changed.

## [Unreleased] — static shell rebuild + global upgrade (current workspace)

### Added
- **Production CSS + fonts recovered verbatim** (`recovery/production-css-original.css`,
  51KB chunk `0sq4gstocyqmo.css`): exact shadcn theme tokens
  (`--background:#071014` · `--foreground:#f5f1e8` · `--card:#112127` ·
  `--secondary:#183036` · `--muted-foreground:#9aaba7` · `--primary:#d5b77b` ·
  `--border:#f5f1e824` · `--radius:.75rem`), original keyframes
  (`propauto-pulse`, `rise`, `reveal`, `spin`) and `.hero-copy`/`.hero-image`
  entrance classes. The ten original woff2 fonts (Geist + Noto Sans Arabic)
  now ship in `assets/fonts/` — `styles.css` v1.4.0 uses them with the exact
  production unicode-ranges.
- **Original dashboard numbers applied**: audience snapshot now matches the
  production homepage RSC payload — **12,840 visitors (+18.6%)** and
  **2,140 qualified leads (+24.8%)**, sources 42/26/19/13
  (`assets/js/data.js` AUDIENCE + tests).
- **SQLite storage backend** (`lib/storage.js`, zero-dependency via
  `node:sqlite`): real SQL persistence for leads/calls/webhooks/analytics/
  users/checkouts in `data/propauto.db`, with automatic one-time migration
  of the previous JSON store (nothing lost) and a JSON fallback.
  `/api/health` now reports the active backend.
- **Checkout sessions** (`POST/GET /api/checkout`): Stripe-ready session
  creation with a safe demo mode when `STRIPE_SECRET_KEY` is absent.
- **Sarah call intent**: the concierge detects call requests in six
  languages and queues `POST /api/v1/call` when a phone number is present
  (`chat.reply.call` key — 188 keys per locale).
- 12-page dependency-free static build with the original brand palette
  recovered from the production RSC payload (`#071014` base, `#d5b77b` gold,
  Geist + Noto Sans Arabic): `index.html` (hero, pulse, marketplace,
  calculator, ownership-intelligence dashboards, Sarah concierge, automation,
  investors, pricing, contact), `properties.html` / `cars.html` (pre-filtered
  marketplace via `data-market-default`), `investors.html` (original
  acquisition brief), `contact.html`, `sign-in.html` / `sign-up.html` /
  `reset-password.html` (forms wired to `/api/auth/*`), `privacy.html`,
  `terms.html`, `about.html`, `404.html` (original literal 404 copy).
- **Six-locale engine** (`assets/js/locales.js` + `assets/js/i18n.js`):
  English source of truth, Arabic (RTL), French, Spanish, **German,
  Turkish** — **188 keys per locale**, parity-enforced by
  `scripts/verify.js` and `PropAutoI18n.parity()`. Locale catalogue is built
  dynamically from `PropAutoLocales.supported`, so the switcher and
  auto-detection (`?lang=`, navigator, stored) always match the dictionaries.
  New locales are managed in `scripts/repair-locales.js` +
  `scripts/i18n-de.js` / `scripts/i18n-tr.js` (via `scripts/add-locales.js`).
- **Backend server** (`server.js`, zero dependencies): serves the site and
  implements `GET/POST /api/v1/leads`, `POST /api/v1/call`,
  `POST /api/v1/webhook` (CRM forwarding via `CRM_WEBHOOK_URL`),
  `POST /api/analytics`, `POST /api/auth/{signup,signin,reset}`,
  `GET /api/auth/me`. JSON persistence under `data/store/`; leads are
  mirrored to Nhost Postgres when `NHOST_GRAPHQL_URL` + `NHOST_ADMIN_SECRET`
  are set. `scripts/nhost-schema.sql` holds the full production schema
  (leads/calls/webhooks/api_keys/analytics + Hasura permission notes).
- **Global competitive upgrade**: `lib/global-upgrade.ts` (Stripe checkout,
  six locales, `GLOBAL_VAPI_PROMPT`, `getGlobalAnalytics`, global SEO
  metadata) + Next.js API routes (`app/api/checkout`, `app/api/voice/config`,
  `app/api/v1/*`) + `app/dashboard` + `app/api-docs` pages — kept as the
  production deployment path.
- Analytics: `assets/js/analytics.js` forwards to Vercel/GA4 and posts
  batches to `/api/analytics`; dashboard shows operations cards (500 AI
  calls, 18 deals, 23% conversion, $2k–5k MRR) from `Data.OPERATIONS`.
- Offline resilience: failed form submissions queue in localStorage
  (`propauto.leads.queue`) and are replayed on boot / `online` event.
- Quality gates: `scripts/verify.js` (all 12 pages ↔ dictionaries ↔ CSS),
  `scripts/test.js` (25 unit tests), `scripts/api-test.js` (end-to-end API
  smoke test on an isolated port). `npm test` runs all three.

### Fixed
- i18n lookup resolves flat dictionary keys before nested paths; dictionary
  resolution reads `PropAutoLocales.dictionaries.<code>` (actual shape).
- `package.json` scripts pointed at a non-existent `src/src` tree — now
  `dev`/`start` = `node server.js`, `build` = `node scripts/bundle.js`.
- `vercel.json` gained `buildCommand` so Vercel deploys the static build
  instead of failing the Next build.
- `scripts/bundle.js` now includes `app/`, `lib/`, `components/`,
  `server.js`, `vercel.json` — 144 files in `propauto-complete-project.tar.gz`.

## [2026-10-07] — Production hardening (recovered)

Last production deployment of the original Next.js application
(Next 16.3.8 · React 19 · pnpm 10 · Tailwind v4 · shadcn/ui · drizzle +
Postgres/Neon · better-auth · Stripe · Resend · AI SDK 7 · Vapi voice).

## [2026-09-07 → 2026-10-07] — 127 deployments, 25 branches (recovered)

Full chronology preserved in `recovery/vercel-deployment-history.md`.
Branches include `v0/update-project-zip`, `v0/integrated-investor-ready`,
`v0/live-market-data`, `v0/global-hardening`, `v0/final-claude-code-ready`,
`clean/premium-audit`, and `main`.

## [2026-08-14] — Project inception (recovered)

Vercel project `propauto-ai-al-closer-saas` created (team `ta-to`).