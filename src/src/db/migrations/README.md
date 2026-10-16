# Database migrations

Plain SQL, applied in file-name order. Each file is idempotent, so applying it
twice is harmless.

## Recommended: the migration runner

```bash
pnpm db:migrate            # apply pending migrations
pnpm db:migrate --status   # list applied and pending, change nothing
```

The runner records each applied file (name and checksum) in the
`propauto_migrations` table and applies each file once, inside a transaction.
It takes an advisory lock, so two deploys cannot migrate at the same time. It
exits non-zero, and applies nothing, when an applied file has been edited or
has disappeared: add a new numbered file instead of editing an applied one.
File names must look like `0005_what_it_does.sql`, and numbers must be unique.

It reads `DATABASE_URL_UNPOOLED`, then `POSTGRES_URL_NON_POOLING`,
`DATABASE_URL` and `POSTGRES_URL`. Use an unpooled URL: a transaction pooler
can break advisory locks and DDL.

`0000_base_schema.sql` creates the base tables (`propauto_events`, `propauto_leads`,
`propauto_operator_logs`), so the runner can build a brand-new database from
nothing. On a database that already has them it changes nothing. The
better-auth tables (`user`, `session`, ...) are not part of these files; create
them with the better-auth CLI.

The first run on a database you migrated by hand re-applies the existing files.
They are idempotent, so that is harmless, and it records them in the ledger.

## Applying by hand

The same files can still be applied one at a time:

```bash
psql "$DATABASE_URL_UNPOOLED" -f db/migrations/0001_lead_details.sql
psql "$DATABASE_URL_UNPOOLED" -f db/migrations/0002_subscriptions.sql
psql "$DATABASE_URL_UNPOOLED" -f db/migrations/0003_bookings.sql
psql "$DATABASE_URL_UNPOOLED" -f db/migrations/0004_stripe_event_dedupe.sql
```

Apply a migration before (or right after) deploying the code that uses it.
Until `0001` is applied, lead intake keeps working and stores the core fields
only; the full details still reach the owner by email.
Until `0002` is applied, the Stripe webhook answers subscription events with
503, so Stripe keeps retrying them (for up to three days) and no state is lost.

Until `0003` is applied, Sarah answers booking requests with "not configured
yet" and offers an advisor call. No booking is stored in that state.

Until `0004` is applied, the Stripe webhook still skips an event it has already
recorded, but two deliveries that arrive at the same instant can both record it.
`0004` first deletes repeated Stripe rows from `propauto_operator_logs` (keeping
the earliest of each event and action), then adds the unique index that closes
that window.
