# Database migrations

Plain SQL, applied in file-name order. Each file is idempotent, so applying it
twice is harmless.

```bash
psql "$DATABASE_URL_UNPOOLED" -f db/migrations/0001_lead_details.sql
psql "$DATABASE_URL_UNPOOLED" -f db/migrations/0002_subscriptions.sql
psql "$DATABASE_URL_UNPOOLED" -f db/migrations/0003_bookings.sql
```

Apply a migration before (or right after) deploying the code that uses it.
Until `0001` is applied, lead intake keeps working and stores the core fields
only; the full details still reach the owner by email.
Until `0002` is applied, the Stripe webhook answers subscription events with
503, so Stripe keeps retrying them (for up to three days) and no state is lost.

Until `0003` is applied, Sarah answers booking requests with "not configured
yet" and offers an advisor call. No booking is stored in that state.
