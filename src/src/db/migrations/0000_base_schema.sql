-- Base tables, mirroring lib/db/schema.ts, so a brand-new database can be
-- built by `pnpm db:migrate` alone. Every statement is IF NOT EXISTS, so on a
-- database that already has these tables (created earlier by a schema push)
-- this file changes nothing. Later migrations add columns and tables.
CREATE TABLE IF NOT EXISTS propauto_events (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id text        NOT NULL,
  event_name text        NOT NULL,
  path       text        NOT NULL DEFAULT '/',
  metadata   jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS propauto_leads (
  id         serial      PRIMARY KEY,
  name       text        NOT NULL,
  email      text        NOT NULL,
  intent     text        NOT NULL,
  source     text        NOT NULL DEFAULT 'web',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS propauto_operator_logs (
  id         serial      PRIMARY KEY,
  bot_name   text        NOT NULL,
  action     text        NOT NULL,
  status     text        NOT NULL DEFAULT 'queued',
  details    jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
