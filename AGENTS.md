# PropAuto AI: start here (reviewers, scanners and coding agents)

A Next.js 16 / React 19 / TypeScript app (Postgres via Drizzle, Better Auth, Stripe, Resend, Vercel AI SDK) at the
repository root. Node 24 and pnpm 10 (`.nvmrc`, `package.json#engines`).

| Task | Command |
|---|---|
| Install | `pnpm install --frozen-lockfile` |
| Run locally | `cp .env.example .env.local` then `pnpm dev` |
| Unit tests (Jest) | `pnpm test` (221 tests, no database needed) |
| Coverage (enforced floors) | `pnpm test:coverage` |
| Lint / format / types | `pnpm lint`, `pnpm format:check`, `pnpm typecheck` |
| Production build | `pnpm build` (needs `BETTER_AUTH_SECRET`; any value works for a build) |
| Everything CI runs | `pnpm check` |
| Apply database migrations | `pnpm db:migrate` (needs `DATABASE_URL`) |

`make test`, `make build` and `make check` run the same commands.

## Where things are

- `app/`: pages and the 17 API routes under `app/api/` (leads, events, checkout, bookings, Stripe webhook, admin, health).
- `lib/`: business logic with no framework imports where possible: money math (`math.ts`), request defences
  (`request-security.ts`), billing and revenue (`billing.ts`, `revenue.ts`), bookings, the concierge prompt.
- `components/`: UI. `db/migrations/`: ordered SQL, applied by `scripts/migrate.mjs` with a checksum ledger.
- `tests/unit/`: 28 Jest suites (logic and route handlers). `.github/workflows/ci.yml`: the CI pipeline.
- `docs/`: `INVESTOR_OVERVIEW.md` (what is built and verified), `ARCHITECTURE.md`, `DEVELOPMENT.md`, `HANDOVER.md`.
- `agents/sara-closer/`: a superseded eve agent kept as a record; excluded from the root type check and lint.

Tests, lint, types and build all pass without any external service. Only the live site needs Postgres, Stripe, Resend
and model keys (see `.env.example`).

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
