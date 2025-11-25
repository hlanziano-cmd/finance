-- Fix RLS policy for investment_simulations INSERT
-- Drop the old policy if it exists
DROP POLICY IF EXISTS "Users can create investment simulations for their organization" ON investment_simulations;

-- Create the corrected INSERT policy - allow all authenticated users
CREATE POLICY "Users can create investment simulations for their organization"
  ON investment_simulations
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

-- Add comments
COMMENT ON POLICY "Users can create investment simulations for their organization" ON investment_simulations IS 'Authenticated users can create investment simulations';
