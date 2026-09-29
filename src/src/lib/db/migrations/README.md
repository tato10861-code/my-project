# Drizzle migrations

This directory explains how to generate and run schema migrations for Drizzle ORM used in this project.

We intentionally do not commit compiled migration files here. For buyers:

1. Install drizzle-kit globally or as a dev-dependency.

2. Configure your DATABASE_URL in .env.local

3. Generate a migration:
   npx drizzle-kit generate --out ./src/src/lib/db/migrations

4. Apply migration (example using psql):
   psql "$DATABASE_URL" -f ./src/src/lib/db/migrations/<timestamp>-migration.sql

Notes:
- For production deployments, use a managed migration workflow or a CI step to run migrations.
- If you want, we can add an automated migration runner in CI as part of the integration package.
