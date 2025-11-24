-- Create cost_analysis table
CREATE TABLE IF NOT EXISTS public.cost_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  product_name TEXT NOT NULL,
  product_description TEXT,

  -- Pricing
  unit_price DECIMAL(15, 2) NOT NULL CHECK (unit_price >= 0),

  -- Variable Costs
  variable_cost_per_unit DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (variable_cost_per_unit >= 0),
  variable_cost_breakdown JSONB DEFAULT '[]'::jsonb, -- Array of {name, amount}

  -- Fixed Costs
  monthly_fixed_costs DECIMAL(15, 2) NOT NULL DEFAULT 0 CHECK (monthly_fixed_costs >= 0),
  fixed_cost_breakdown JSONB DEFAULT '[]'::jsonb, -- Array of {name, monthlyAmount}

  -- Production/Sales Data
  current_monthly_units INTEGER DEFAULT 0 CHECK (current_monthly_units >= 0),
  production_capacity INTEGER CHECK (production_capacity IS NULL OR production_capacity >= 0),

  -- Metadata
  fiscal_year INTEGER NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'final')),
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_by UUID,

  CONSTRAINT fk_cost_analysis_organization FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE CASCADE,
  CONSTRAINT fk_cost_analysis_created_by FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_cost_analysis_updated_by FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_cost_analysis_organization ON public.cost_analysis(organization_id);
CREATE INDEX IF NOT EXISTS idx_cost_analysis_created_by ON public.cost_analysis(created_by);
CREATE INDEX IF NOT EXISTS idx_cost_analysis_fiscal_year ON public.cost_analysis(fiscal_year);
CREATE INDEX IF NOT EXISTS idx_cost_analysis_status ON public.cost_analysis(status);

-- Enable RLS
ALTER TABLE public.cost_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view cost analysis from their organization"
  ON public.cost_analysis FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create cost analysis for their organization"
  ON public.cost_analysis FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
    )
    AND created_by = auth.uid()
  );

CREATE POLICY "Users can update cost analysis from their organization"
  ON public.cost_analysis FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete cost analysis from their organization"
  ON public.cost_analysis FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_users WHERE user_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_cost_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER update_cost_analysis_updated_at
  BEFORE UPDATE ON public.cost_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_cost_analysis_updated_at();

-- Add comment
COMMENT ON TABLE public.cost_analysis IS 'Stores cost analysis data for products including fixed and variable costs';
