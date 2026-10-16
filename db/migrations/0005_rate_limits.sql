-- Shared request counters, so rate limits hold across all server instances.
-- One row per client key and one-minute window. Idempotent: safe to run twice.
CREATE TABLE IF NOT EXISTS propauto_rate_limits (
  key          text        NOT NULL,
  window_start timestamptz NOT NULL,
  count        integer     NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
CREATE INDEX IF NOT EXISTS propauto_rate_limits_window ON propauto_rate_limits (window_start);
