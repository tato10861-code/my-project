-- One operator-log row per Stripe event and action, so concurrent duplicate
-- webhook deliveries cannot both record (and email) the same event.
-- Idempotent: safe to run twice.

-- Remove duplicates already recorded, keeping the first row of each, so the
-- unique index below can be built.
DELETE FROM propauto_operator_logs a
USING propauto_operator_logs b
WHERE a.bot_name = 'stripe'
  AND b.bot_name = 'stripe'
  AND a.action = b.action
  AND a.details ? 'eventId'
  AND a.details->>'eventId' = b.details->>'eventId'
  AND a.id > b.id;

CREATE UNIQUE INDEX IF NOT EXISTS propauto_operator_logs_stripe_event
  ON propauto_operator_logs (action, (details->>'eventId'))
  WHERE bot_name = 'stripe' AND details ? 'eventId';
