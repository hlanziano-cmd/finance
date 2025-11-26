-- Make organization_id optional in investment_simulations table
-- This allows the app to work without organizations

-- Drop the foreign key constraint
ALTER TABLE investment_simulations
DROP CONSTRAINT IF EXISTS fk_organization;

ALTER TABLE investment_simulations
DROP CONSTRAINT IF EXISTS investment_simulations_organization_id_fkey;

-- Make organization_id nullable
ALTER TABLE investment_simulations
ALTER COLUMN organization_id DROP NOT NULL;

-- Update RLS policies to not depend on organizations
-- Drop existing policies
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'investment_simulations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON investment_simulations', pol.policyname);
    END LOOP;
END $$;

-- Create new policies based only on created_by
CREATE POLICY "Users can view their own investment simulations"
  ON investment_simulations FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can create their own investment simulations"
  ON investment_simulations FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own investment simulations"
  ON investment_simulations FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own investment simulations"
  ON investment_simulations FOR DELETE
  USING (created_by = auth.uid());
