-- Viewing and test-drive requests made through Sarah. A request is 'pending'
-- until the team confirms it from the email link. Idempotent: safe to run twice.
CREATE TABLE IF NOT EXISTS propauto_bookings (
  id text PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('viewing', 'test_drive')),
  starts_at timestamptz NOT NULL,
  listing_ref text NOT NULL,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  language text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz
);

-- One live request per slot. The database enforces it, so two chats cannot both take the same time.
CREATE UNIQUE INDEX IF NOT EXISTS propauto_bookings_live_slot
  ON propauto_bookings (starts_at)
  WHERE status <> 'cancelled';
