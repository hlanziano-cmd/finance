-- Fix RLS policies for investment_simulations table - FINAL VERSION
-- This migration safely drops all old policies and creates new ones

-- Drop ALL existing policies (old and new naming)
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
