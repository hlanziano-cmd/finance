-- Fix RLS policy for investment_simulations INSERT
-- Drop the old policy if it exists
DROP POLICY IF EXISTS "Users can create investment simulations for their organization" ON investment_simulations;

-- Create the corrected INSERT policy - simplified to only check authentication
CREATE POLICY "Users can create investment simulations for their organization"
  ON investment_simulations
  FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
  );

-- Add comments
COMMENT ON POLICY "Users can create investment simulations for their organization" ON investment_simulations IS 'Users can create investment simulations if they are authenticated';
