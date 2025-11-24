-- Create investment_simulations table
CREATE TABLE IF NOT EXISTS investment_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  initial_amount DECIMAL(15, 2) NOT NULL CHECK (initial_amount > 0),
  source_type TEXT NOT NULL CHECK (source_type IN ('cashflow', 'manual')),
  cash_flow_id UUID REFERENCES cash_flows(id) ON DELETE SET NULL,
  risk_profile TEXT NOT NULL CHECK (risk_profile IN ('conservative', 'moderate', 'aggressive')),
  selected_products JSONB NOT NULL DEFAULT '[]',
  diversification_strategy TEXT CHECK (diversification_strategy IN ('equal', 'risk-weighted', 'return-optimized')),
  projections JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_investment_simulations_organization ON investment_simulations(organization_id);
CREATE INDEX idx_investment_simulations_created_by ON investment_simulations(created_by);
CREATE INDEX idx_investment_simulations_created_at ON investment_simulations(created_at DESC);
CREATE INDEX idx_investment_simulations_risk_profile ON investment_simulations(risk_profile);

-- Enable Row Level Security
ALTER TABLE investment_simulations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their organization's investment simulations"
  ON investment_simulations
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create investment simulations for their organization"
  ON investment_simulations
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their organization's investment simulations"
  ON investment_simulations
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their organization's investment simulations"
  ON investment_simulations
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_users
      WHERE user_id = auth.uid()
    )
  );

-- Create updated_at trigger
CREATE TRIGGER update_investment_simulations_updated_at
  BEFORE UPDATE ON investment_simulations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE investment_simulations IS 'Stores investment simulations and portfolio allocations';
COMMENT ON COLUMN investment_simulations.source_type IS 'Source of funds: cashflow (from cash flow excess) or manual (user input)';
COMMENT ON COLUMN investment_simulations.risk_profile IS 'Investment risk profile: conservative, moderate, or aggressive';
COMMENT ON COLUMN investment_simulations.selected_products IS 'Array of investment product allocations with percentages';
COMMENT ON COLUMN investment_simulations.projections IS 'Investment projections for 3, 6, and 12 months';
