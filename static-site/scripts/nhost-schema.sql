-- ============================================================================
-- PropAuto AI — Nhost Postgres schema
-- Run this in the Nhost dashboard (Data → SQL) or with the Hasura CLI.
-- The tool `nhost_execute_sql` in this workspace is currently broken
-- (it returns malformed URLs like https://https://…), so this file is the
-- canonical way to create the tables.
--
-- IMPORTANT (Hasura permissions):
-- Creating a table via SQL does NOT make it readable/writable from the
-- client GraphQL API. After running this file, open Nhost → Hasura →
-- Permissions and grant:
--   * leads:   insert (public), select (owner or authenticated)
--   * api_keys: admin-only — never expose to the client
--   * users:   managed by Nhost Auth — do NOT create manually
-- The server-side code (server.js / app/api/*) holds the admin secret and
-- bypasses these rules, which is the recommended production path.
-- ============================================================================

-- ── Leads (contact form + API + CRM webhook) ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.leads (
  id          serial PRIMARY KEY,
  name        text,
  email       text,
  phone       text,
  interest    text,                                   -- buying | investing | partnership | listing
  message     text,
  status      text NOT NULL DEFAULT 'new',            -- new | contacted | qualified | closed | lost
  lang        text NOT NULL DEFAULT 'en',             -- en | ar | fr | es | de | tr
  type        text NOT NULL DEFAULT 'contact',        -- contact | call | webhook
  source      text NOT NULL DEFAULT 'web',
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads (status);
CREATE INDEX IF NOT EXISTS idx_leads_created ON public.leads (created_at DESC);

-- ── Voice calls (Vapi queue) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.calls (
  id          serial PRIMARY KEY,
  phone       text NOT NULL,
  language    text NOT NULL DEFAULT 'en',
  type        text NOT NULL DEFAULT 'real_estate',    -- real_estate | automotive
  status      text NOT NULL DEFAULT 'queued',         -- queued | ringing | completed | failed
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ── CRM webhook log ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.webhooks (
  id          serial PRIMARY KEY,
  event       text NOT NULL,
  lead        jsonb,
  source      text NOT NULL DEFAULT 'unknown',
  received_at timestamptz NOT NULL DEFAULT now()
);

-- ── API keys (Dashboard → Settings → API Keys) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.api_keys (
  id          serial PRIMARY KEY,
  label       text NOT NULL,
  key_hash    text NOT NULL UNIQUE,                   -- sha256 of the raw key
  created_at  timestamptz NOT NULL DEFAULT now(),
  last_used_at timestamptz
);

-- ── Analytics events (optional; server.js also stores locally) ────────────
CREATE TABLE IF NOT EXISTS public.analytics (
  id          serial PRIMARY KEY,
  type        text NOT NULL,
  payload     jsonb,
  received_at timestamptz NOT NULL DEFAULT now()
);

-- ── Sample: verified lead (matches /api/v1/leads sample data) ─────────────
INSERT INTO public.leads (name, phone, status, lang, type, source)
VALUES ('Ahmed', '+966500000000', 'closed', 'ar', 'real_estate', 'seed'),
       ('John', '+10000000000',  'new',    'en', 'automotive',   'seed')
ON CONFLICT DO NOTHING;