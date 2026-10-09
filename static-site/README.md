# PropAuto AI

**Luxury assets, smarter ownership.**

PropAuto AI is a private marketplace and intelligence layer for luxury real
estate and rare collector cars: verified listings, live market signals, a
multilingual AI concierge and investor-grade tools — localised in **6
languages** (English, Arabic, French, Spanish, German, Turkish).

- **Production:** https://propauto-ai-al-closer-saas.vercel.app
- **Contact:** propautoal@gmail.com · +967 733 393 884

---

## What ships in this repository

| Layer | Path | Notes |
|---|---|---|
| Static site (12 pages) | `*.html` at root | `index.html` (product shell) + properties, cars, investors, contact, sign-in, sign-up, reset-password, privacy, terms, about, 404 |
| Design system | `assets/css/styles.css` | Original palette (`#071014` bg · `#d5b77b` gold), RTL-ready |
| Localisation | `assets/js/locales.js` | **188 keys × 6 languages**, parity-enforced |
| Locale engine | `assets/js/i18n.js` | Detection, `?lang=`, `data-i18n`, formatters, dynamic locale menu |
| Data | `assets/js/data.js` | 14 verified assets, market signals, audience/operations metrics |
| App layer | `assets/js/app.js` | Pulse, marketplace, calculator, board, concierge chat, forms, error guard, offline queue |
| Analytics | `assets/js/analytics.js` | Batched `POST /api/analytics` + Vercel/GA forwarding |
| **Backend (zero deps)** | `server.js` | Static serving + full API (see below) |
| Quality gates | `scripts/` | `test.js` (27 unit) · `verify.js` (markup↔dictionaries↔CSS) · `api-test.js` (end-to-end API) |
| Original application | `original-source/src/src/` | Full Next.js 16.3.8 source (app/, lib/, components/, agent/, docs/, tests/) |
| Provenance archive | `recovery/` | Vercel deployment history, RSC payload, UI strings (read-only) |

## Quick start

```bash
npm run dev        # node server.js → http://localhost:5173 (site + API)
```

Quality gates (all three must pass before a release):

```bash
npm test           # 27 unit tests + markup/dictionary/stylesheet gate + API smoke test
```

## API surface (`server.js`)

| Endpoint | Purpose |
|---|---|
| `GET /api/health` | health probe |
| `GET /api/v1/leads?status=&lang=&type=` | list leads |
| `POST /api/v1/leads` | create a lead (contact form) |
| `POST /api/v1/call` | queue an AI voice call (Vapi) |
| `POST /api/v1/webhook` | receive lead events → forward to `CRM_WEBHOOK_URL` |
| `POST /api/analytics` | analytics event batch |
| `POST /api/checkout` · `GET /api/checkout?session=` | create / read a checkout session (Stripe-ready) |
| `POST /api/auth/signup` · `signin` · `reset` | demo auth (scrypt-hashed) |
| `GET /api/auth/me` | current user from Bearer token |

Data persists in a **SQLite database** (`data/propauto.db`, zero-dependency
via `node:sqlite`) with automatic migration of the legacy JSON store
(`data/store/`, kept as fallback). Override the location with `DATA_DIR`.
When `NHOST_GRAPHQL_URL` + `NHOST_ADMIN_SECRET` are set (server-side only),
leads are mirrored to the linked Nhost Postgres database.

The frontend never loses a submission: if the API is unreachable the form
data is queued in `localStorage` (`propauto.leads.queue`) and replayed
automatically at the next page load or when the connection returns.
The Sarah concierge also detects call requests ("call me", "اتصال", …) and
queues a `POST /api/v1/call` when a phone number is present in the message —
matching the `GLOBAL_VAPI_PROMPT` promise.

## Localisation

- English is the source of truth; ar (RTL), fr, es, de and tr mirror it
  key-for-key, enforced by `PropAutoI18n.parity()` and `scripts/verify.js`.
- Switch language via the header menu or directly with `?lang=tr`
  (matching the production site's locale mechanism).
- Dictionaries are maintained directly in `assets/js/locales.js`
  (one `DICTIONARIES = { en, ar, fr, es, de, tr }` block); `scripts/verify.js`
  fails the build if any locale is missing a key or carries an extra one.

## Deployment modes

1. **Local / self-hosted (full API):** `npm run dev` — site + API, zero deps.
2. **Static hosting (site only):** `vercel.json` sets `buildCommand` to
   `node scripts/bundle.js`; deploy the root. API endpoints are not served
   in this mode — point the frontend at a hosted backend instead.
3. **Next.js (original stack):** `original-source/src/src/` is the complete
   original application (Next 16.3.8 · React 19 · Tailwind v4 · shadcn/ui ·
   drizzle + Postgres/Neon · better-auth · Stripe · Resend · AI SDK 7 ·
   Vapi voice). Requires `pnpm install` plus env vars
   (`STRIPE_SECRET_KEY`, `NHOST_GRAPHQL_URL`, `NHOST_ADMIN_SECRET`,
   `VAPI_API_KEY`, `CRM_WEBHOOK_URL`).

## Nhost

The database is provisioned via `scripts/nhost-schema.sql` — run it in the
Nhost dashboard (Data → SQL), then configure Hasura permissions for the
`leads` table (insert public, select owner/authenticated). Nhost **Auth**
(sign-up / sign-in / sessions) works out of the box via the Auth service
URL and needs no permission setup. Server-side code holds the admin secret
and bypasses Hasura permissions by design.

## Engineering standards

- **Zero-dependency runtime** for the deployed site: `server.js` uses only
  Node built-ins (`node:http`, `node:sqlite`, `node:crypto`) — no supply-chain
  surface, trivially auditable.
- **Security defaults:** `X-Content-Type-Options: nosniff`, `X-Frame-Options:
  DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Cache-Control:
  no-store` on all responses; request bodies capped at 1 MB; passwords
  scrypt-hashed; tokens server-side only.
- **Quality gates:** 27 unit tests, a markup↔dictionary↔stylesheet verifier,
  and an end-to-end API smoke test — all wired into `npm test`.
- **Localisation parity:** every one of the 6 locales must carry exactly the
  same 188 keys or the build fails.
- The original Next.js application ships with its own strict `tsconfig.json`
  (`strict: true`, `noEmit`, build errors never ignored), ESLint
  (core-web-vitals + typescript rulesets), `SECURITY.md`, `CLAUDE.md` and a
  smoke test suite under `original-source/src/src/tests/`.

## Provenance

The original Next.js application (Next 16.3.8 · React 19 · pnpm · Tailwind
v4 · shadcn/ui · drizzle + Postgres/Neon · better-auth · Stripe · Resend ·
AI SDK 7 · Vapi voice) was deployed **127 times between 2026-09-07 and
2026-10-07** across 25 branches. The full deployment chronology, build logs,
route map, environment inventory and recovered UI strings are preserved
under `recovery/` — see `CHANGELOG.md` for the human-readable history.

## License

Proprietary. All rights reserved. Nothing in this repository is an offer, a
solicitation, or investment advice; all figures are indicative.