-- Stripe subscription state, kept current by /api/webhooks/stripe.
-- Idempotent: safe to run more than once.
CREATE TABLE IF NOT EXISTS propauto_subscriptions (
  id                   text PRIMARY KEY,
  customer_id          text        NOT NULL,
  plan                 text,
  price_id             text,
  status               text        NOT NULL,
  cancel_at_period_end boolean     NOT NULL DEFAULT false,
  trial_end            timestamptz,
  current_period_end   timestamptz,
  livemode             boolean     NOT NULL,
  last_event_created   bigint      NOT NULL,
  updated_at           timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS propauto_subscriptions_customer_idx ON propauto_subscriptions (customer_id);
