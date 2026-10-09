# Database migrations

Plain SQL, applied in file-name order. Each file is idempotent, so applying it
twice is harmless.

```bash
psql "$DATABASE_URL_UNPOOLED" -f db/migrations/0001_lead_details.sql
```

Apply a migration before (or right after) deploying the code that uses it.
Until `0001` is applied, lead intake keeps working and stores the core fields
only; the full details still reach the owner by email.
