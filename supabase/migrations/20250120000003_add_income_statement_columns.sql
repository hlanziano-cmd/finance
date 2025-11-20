-- =====================================================
-- MIGRACIÓN: Añadir columnas detalladas a income_statements
-- =====================================================
-- Añade columnas para almacenar todos los cálculos del
-- estado de resultados

BEGIN;

-- Añadir columnas solo si no existen
DO $$
BEGIN
  -- tax_rate
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'tax_rate') THEN
    ALTER TABLE income_statements ADD COLUMN tax_rate DECIMAL(5, 2) DEFAULT 35.00 CHECK (tax_rate >= 0 AND tax_rate <= 100);
  END IF;

  -- revenue
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'revenue') THEN
    ALTER TABLE income_statements ADD COLUMN revenue DECIMAL(18, 2) DEFAULT 0;
  END IF;

  -- cost_of_sales
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'cost_of_sales') THEN
    ALTER TABLE income_statements ADD COLUMN cost_of_sales DECIMAL(18, 2) DEFAULT 0;
  END IF;

  -- gross_profit
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'gross_profit') THEN
    ALTER TABLE income_statements ADD COLUMN gross_profit DECIMAL(18, 2) DEFAULT 0;
  END IF;

  -- gross_margin
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'gross_margin') THEN
    ALTER TABLE income_statements ADD COLUMN gross_margin DECIMAL(10, 4) DEFAULT 0;
  END IF;

  -- operating_expenses
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'operating_expenses') THEN
    ALTER TABLE income_statements ADD COLUMN operating_expenses DECIMAL(18, 2) DEFAULT 0;
  END IF;

  -- depreciation_amortization
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'depreciation_amortization') THEN
    ALTER TABLE income_statements ADD COLUMN depreciation_amortization DECIMAL(18, 2) DEFAULT 0;
  END IF;

  -- ebitda
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'ebitda') THEN
    ALTER TABLE income_statements ADD COLUMN ebitda DECIMAL(18, 2) DEFAULT 0;
  END IF;

  -- operating_profit (EBIT)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'operating_profit') THEN
    ALTER TABLE income_statements ADD COLUMN operating_profit DECIMAL(18, 2) DEFAULT 0;
  END IF;

  -- operating_margin
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'operating_margin') THEN
    ALTER TABLE income_statements ADD COLUMN operating_margin DECIMAL(10, 4) DEFAULT 0;
  END IF;

  -- non_operating_income
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'non_operating_income') THEN
    ALTER TABLE income_statements ADD COLUMN non_operating_income DECIMAL(18, 2) DEFAULT 0;
  END IF;

  -- non_operating_expenses
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'non_operating_expenses') THEN
    ALTER TABLE income_statements ADD COLUMN non_operating_expenses DECIMAL(18, 2) DEFAULT 0;
  END IF;

  -- profit_before_tax
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'profit_before_tax') THEN
    ALTER TABLE income_statements ADD COLUMN profit_before_tax DECIMAL(18, 2) DEFAULT 0;
  END IF;

  -- tax_expense
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'tax_expense') THEN
    ALTER TABLE income_statements ADD COLUMN tax_expense DECIMAL(18, 2) DEFAULT 0;
  END IF;

  -- net_profit
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'net_profit') THEN
    ALTER TABLE income_statements ADD COLUMN net_profit DECIMAL(18, 2) DEFAULT 0;
  END IF;

  -- net_margin
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'income_statements' AND column_name = 'net_margin') THEN
    ALTER TABLE income_statements ADD COLUMN net_margin DECIMAL(10, 4) DEFAULT 0;
  END IF;
END $$;

-- Añadir índices para consultas comunes (solo si no existen)
CREATE INDEX IF NOT EXISTS idx_income_statements_fiscal_year_net_profit
  ON income_statements(fiscal_year, net_profit DESC);
CREATE INDEX IF NOT EXISTS idx_income_statements_created_by
  ON income_statements(created_by);

-- Añadir comentarios
COMMENT ON COLUMN income_statements.tax_rate IS 'Tasa de impuestos aplicable (porcentaje)';
COMMENT ON COLUMN income_statements.revenue IS 'Ingresos totales del período';
COMMENT ON COLUMN income_statements.cost_of_sales IS 'Costo de ventas';
COMMENT ON COLUMN income_statements.gross_profit IS 'Utilidad bruta (Ingresos - Costo de ventas)';
COMMENT ON COLUMN income_statements.gross_margin IS 'Margen bruto en porcentaje';
COMMENT ON COLUMN income_statements.operating_expenses IS 'Gastos operacionales';
COMMENT ON COLUMN income_statements.depreciation_amortization IS 'Depreciación y amortización';
COMMENT ON COLUMN income_statements.ebitda IS 'EBITDA - Utilidad operacional + Depreciación y Amortización (flujo de caja operativo)';
COMMENT ON COLUMN income_statements.operating_profit IS 'Utilidad Operacional / EBIT - Ganancia antes de intereses e impuestos';
COMMENT ON COLUMN income_statements.operating_margin IS 'Margen operacional en porcentaje';
COMMENT ON COLUMN income_statements.non_operating_income IS 'Ingresos no operacionales';
COMMENT ON COLUMN income_statements.non_operating_expenses IS 'Gastos no operacionales (incluye gastos financieros)';
COMMENT ON COLUMN income_statements.profit_before_tax IS 'Utilidad antes de impuestos';
COMMENT ON COLUMN income_statements.tax_expense IS 'Gasto por impuestos';
COMMENT ON COLUMN income_statements.net_profit IS 'Utilidad neta';
COMMENT ON COLUMN income_statements.net_margin IS 'Margen neto en porcentaje';

COMMIT;

-- Mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '✅ Columnas añadidas a income_statements';
    RAISE NOTICE 'La tabla ahora incluye todos los campos de cálculo del estado de resultados';
END $$;
