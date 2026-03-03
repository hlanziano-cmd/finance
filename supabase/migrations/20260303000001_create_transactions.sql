-- Migration: Create transactions table for income/expense tracking
-- Date: 2026-03-03

CREATE TABLE IF NOT EXISTS transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type        TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category    TEXT NOT NULL,
  amount      NUMERIC(15,2) NOT NULL CHECK (amount > 0),
  date        DATE NOT NULL,
  description TEXT,
  reference   TEXT,
  created_by  UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common filter patterns
CREATE INDEX IF NOT EXISTS transactions_created_by_date_idx ON transactions (created_by, date DESC);
CREATE INDEX IF NOT EXISTS transactions_created_by_type_idx ON transactions (created_by, type);

-- Row Level Security
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own transactions" ON transactions
  FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_transactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_transactions_updated_at();
