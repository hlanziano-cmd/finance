-- Fix RLS policies for investment_simulations table
-- Drop ALL existing policies to ensure clean slate
DROP POLICY IF EXISTS "Users can create investment simulations for their organization" ON investment_simulations;
DROP POLICY IF EXISTS "Users can view investment simulations from their organization" ON investment_simulations;
DROP POLICY IF EXISTS "Users can update investment simulations from their organization" ON investment_simulations;
DROP POLICY IF EXISTS "Users can delete investment simulations from their organization" ON investment_simulations;

-- Create SELECT policy - users can view simulations they created
CREATE POLICY "Users can view their own investment simulations"
  ON investment_simulations
  FOR SELECT
  USING (created_by = auth.uid());

-- Create INSERT policy - authenticated users can create simulations
CREATE POLICY "Authenticated users can create investment simulations"
  ON investment_simulations
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Create UPDATE policy - users can update their own simulations
CREATE POLICY "Users can update their own investment simulations"
  ON investment_simulations
  FOR UPDATE
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Create DELETE policy - users can delete their own simulations
CREATE POLICY "Users can delete their own investment simulations"
  ON investment_simulations
  FOR DELETE
  USING (created_by = auth.uid());

-- Add comments
COMMENT ON POLICY "Users can view their own investment simulations" ON investment_simulations IS 'Users can view investment simulations they created';
COMMENT ON POLICY "Authenticated users can create investment simulations" ON investment_simulations IS 'Authenticated users can create investment simulations';
COMMENT ON POLICY "Users can update their own investment simulations" ON investment_simulations IS 'Users can update their own investment simulations';
COMMENT ON POLICY "Users can delete their own investment simulations" ON investment_simulations IS 'Users can delete their own investment simulations';
