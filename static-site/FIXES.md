# Static site — fixes applied and what is still open

These pages come from the static rebuild workspace (see `CHANGELOG.md`). They
are **not** what Vercel production serves today: production deploys the
Next.js app in `src/src` from `main`.

The pages load `assets/css/styles.css` and `assets/js/{locales,i18n,data,analytics,app}.js`,
and post to the `server.js` API. Those files were not uploaded, so they are not
in this folder yet.

## Locale keys the fixed pages expect

Each page's `<h1>` now has its own key, separate from the `<title>` key, so a
translated title like "Sign in | PropAuto AI" no longer leaks into the
heading. Add these to every locale in `assets/js/locales.js`:

| key | English |
|---|---|
| `page.about.heading` | About PropAuto AI |
| `page.cars.heading` | Rare cars |
| `page.contact.heading` | Talk to PropAuto |
| `page.signin.heading` | Welcome back |
| `page.signin.forgot` | Forgot password? |
| `page.signup.heading` | Create your account |
| `page.terms.heading` | Terms of service |

## Still open

- `og:image` points at an SVG, which Facebook, WhatsApp and X do not render.
  Add a 1200×630 PNG and point `og:image` / `twitter:image` at it.
- `reset-password.html`, `properties.html`, `investors.html` and
  `privacy.html` are linked but were not uploaded.
- `terms.html` is four short paragraphs. With accounts and a paid product it
  needs sections on accounts, payments and refunds, governing law and
  termination; have it reviewed.

## vercel.json

- Added `cleanUrls: true`. Every canonical, hreflang and sitemap URL is
  extensionless (`/terms`), but without `cleanUrls` Vercel only serves
  `/terms.html`, so all of those URLs answered 404 to search engines.
- The no-cache rule for HTML now matches both `/terms` and `/terms.html`.
- `/assets/*` was cached for a year as `immutable`, but the file names are not
  content-hashed (`styles.css`, `app.js`), so visitors would keep a stale
  stylesheet or script for up to a year after a deploy. Now one hour plus
  background revalidation.
- `buildCommand: node scripts/bundle.js` is kept for this folder only. Do not
  put this file at the repository root: production builds the Next.js app,
  and this command would replace it with the static build.

## server.js (security)

- **The whole project folder was served as static files.** `GET /.env`,
  `/data/propauto.db`, `/data/store/users.json` (password hashes and session
  tokens), `/server.js` and `/package.json` were all downloadable. Static
  serving is now an allowlist: page and asset types only, scripts only under
  `assets/`, never dotfiles, `data/`, `lib/`, `scripts/`, `recovery/` or
  `original-source/`.
- **`GET /api/v1/leads` listed every lead (name, email, phone) to anyone.**
  It now requires `Authorization: Bearer $ADMIN_TOKEN`.
- **`POST /api/v1/webhook` accepted anything and forwarded it to the CRM.** It
  now requires the `x-webhook-secret: $WEBHOOK_SECRET` header, and answers 503
  when no secret is configured.
- Session tokens were stored in plain text and never expired. Only a SHA-256
  hash is stored now; tokens last 7 days and rotate on every sign-in. Existing
  plain-text tokens keep working until the next sign-in.
- Password and token comparisons are constant-time, and sign-in hashes even
  for unknown emails so response time does not reveal which accounts exist.
- With `STRIPE_SECRET_KEY` set, checkout returned a made-up
  `checkout.stripe.com/pay/ck_…` link that never worked. It now answers 501;
  real Stripe checkout lives in the Next.js app.
- `GET /api/checkout?session=` no longer returns the buyer's email.
- Request bodies are capped at 64 KB (was 1 MB); analytics batches at 50
  events; a malformed URL answers 400 instead of 500.
- Clean URLs (`/terms` → `terms.html`) now work locally, matching `vercel.json`.

New environment variables: `ADMIN_TOKEN`, `WEBHOOK_SECRET` (added to
`.env.example`). `scripts/api-test.js` is updated for the new rules and
passes; it was run against an in-memory stand-in for `lib/storage.js`,
which was not uploaded.
