-- Store every field the lead forms collect. Idempotent: safe to run more than once.
ALTER TABLE propauto_leads ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE propauto_leads ADD COLUMN IF NOT EXISTS budget text;
ALTER TABLE propauto_leads ADD COLUMN IF NOT EXISTS message text;
ALTER TABLE propauto_leads ADD COLUMN IF NOT EXISTS language text;
