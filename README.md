# PropAuto AI

PropAuto AI is a multilingual sales platform for luxury real estate and collector cars. It qualifies buyers and investors through an on-site concierge, captures and notifies leads, sells paid access through Stripe and gives the owner a private analytics dashboard.

[![CI](https://github.com/tato10861-code/my-project/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/tato10861-code/my-project/actions/workflows/ci.yml)

## Repository layout

| Path | What it is |
|---|---|
| [`src/src`](src/src) | The production web app (Next.js 16, React 19, TypeScript), deployed on Vercel. Start with its [README](src/src/README.md). |
| [`agents/sara-closer`](agents/sara-closer) | Sara, the closing agent, built on the eve agent framework. |
| [`.github`](.github) | CI (tests, coverage, lint, typecheck, dependency audit, build, secret scan), Dependabot and templates. |
| [`ARCHIVE.md`](ARCHIVE.md) | Where retired material lives and how to restore it. |

## Architecture

```
Browser ──► Next.js app (Vercel)
              ├─ /api/leads, /api/events        validated intake (Zod), rate limited, size capped
              ├─ /api/sarah, /api/concierge     multilingual concierge (AI SDK, Vercel AI Gateway)
              ├─ /api/checkout                  Stripe Checkout session
              ├─ /api/webhooks/stripe           signed webhook, each payment recorded once
              ├─ /api/admin/*, /api/analytics   owner-only reporting (Better Auth session)
              └─ /api/health                    liveness probe
                    │
                    ├─► Neon Postgres (Drizzle ORM)
                    ├─► Resend (owner notifications)
                    └─► Stripe, Vapi (voice)
```

Shared request defences live in [`src/src/lib/request-security.ts`](src/src/lib/request-security.ts). They provide sliding-window rate limiting keyed on platform-set client IPs, body caps enforced on received bytes and origin validation. Money is handled as integer cents in [`src/src/lib/math.ts`](src/src/lib/math.ts).

## Quick start

Requires Node 24 and pnpm 10.

```bash
cd src/src
pnpm install --frozen-lockfile
cp .env.example .env.local   # fill in the values you need
pnpm dev
```

`pnpm check` runs the same steps as CI: smoke test, unit tests with enforced coverage thresholds, lint, typecheck, dependency audit and production build.

## Quality

- Unit tests run on Jest, with coverage thresholds enforced in CI.
- `pnpm audit` is clean at every package root. Dependabot keeps dependencies current.
- Every push is scanned for credential patterns.
- Security headers (HSTS, CSP `frame-ancestors`, `X-Frame-Options`) are set in [`next.config.mjs`](src/src/next.config.mjs).

## Documentation

- [CHANGELOG.md](CHANGELOG.md): release history
- [SECURITY.md](SECURITY.md): security policy and reporting
- [CONTRIBUTING.md](CONTRIBUTING.md): workflow and conventions
- [src/src/docs/DEVELOPMENT.md](src/src/docs/DEVELOPMENT.md): development guide

## License

Proprietary. All rights reserved. See [LICENSE](LICENSE).
