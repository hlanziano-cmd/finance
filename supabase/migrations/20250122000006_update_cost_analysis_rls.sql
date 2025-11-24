-- Update RLS policies for cost_analysis to allow NULL organization_id

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view cost analysis from their organization" ON public.cost_analysis;
DROP POLICY IF EXISTS "Users can create cost analysis for their organization" ON public.cost_analysis;
DROP POLICY IF EXISTS "Users can update cost analysis from their organization" ON public.cost_analysis;
DROP POLICY IF EXISTS "Users can delete cost analysis from their organization" ON public.cost_analysis;

-- Create new policies that allow NULL organization_id
CREATE POLICY "Users can view their own cost analysis"
  ON public.cost_analysis FOR SELECT
  USING (
    created_by = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own cost analysis"
  ON public.cost_analysis FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND (
      organization_id IS NULL
      OR organization_id IN (
        SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update their own cost analysis"
  ON public.cost_analysis FOR UPDATE
  USING (
    created_by = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    created_by = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own cost analysis"
  ON public.cost_analysis FOR DELETE
  USING (
    created_by = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
    )
  );
