-- =====================================================
-- MIGRACIÓN: Crear tablas para Flujo de Caja Operacional
-- =====================================================
-- Crea tablas para gestionar flujos de caja con períodos mensuales

BEGIN;

-- Eliminar tablas si existen (para re-ejecutar la migración limpiamente)
DROP TABLE IF EXISTS cash_flow_periods CASCADE;
DROP TABLE IF EXISTS cash_flows CASCADE;

-- =====================================================
-- TABLA: cash_flows
-- Flujo de caja consolidado con múltiples períodos
-- =====================================================

CREATE TABLE cash_flows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    fiscal_year INTEGER NOT NULL CHECK (fiscal_year BETWEEN 2000 AND 2100),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_cash_flow_per_user_year UNIQUE(created_by, fiscal_year, name)
);

-- =====================================================
-- TABLA: cash_flow_periods
-- Períodos mensuales del flujo de caja
-- =====================================================

CREATE TABLE cash_flow_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cash_flow_id UUID NOT NULL REFERENCES cash_flows(id) ON DELETE CASCADE,

    -- Información del período
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year BETWEEN 2000 AND 2100),

    -- Entradas de efectivo
    sales_collections DECIMAL(18, 2) DEFAULT 0,        -- Cobros a clientes
    other_income DECIMAL(18, 2) DEFAULT 0,             -- Otros ingresos operativos
    total_inflows DECIMAL(18, 2) DEFAULT 0,            -- Total entradas

    -- Salidas de efectivo
    supplier_payments DECIMAL(18, 2) DEFAULT 0,        -- Pagos a proveedores
    payroll DECIMAL(18, 2) DEFAULT 0,                  -- Nómina
    rent DECIMAL(18, 2) DEFAULT 0,                     -- Arriendo
    utilities DECIMAL(18, 2) DEFAULT 0,                -- Servicios públicos
    taxes DECIMAL(18, 2) DEFAULT 0,                    -- Impuestos
    other_expenses DECIMAL(18, 2) DEFAULT 0,           -- Otros gastos operativos
    total_outflows DECIMAL(18, 2) DEFAULT 0,           -- Total salidas

    -- Flujo neto y acumulado
    net_cash_flow DECIMAL(18, 2) DEFAULT 0,            -- Flujo neto del período
    cumulative_cash_flow DECIMAL(18, 2) DEFAULT 0,     -- Flujo acumulado

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_cash_flow_period UNIQUE(cash_flow_id, year, month)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_cash_flows_created_by ON cash_flows(created_by);
CREATE INDEX IF NOT EXISTS idx_cash_flows_fiscal_year ON cash_flows(fiscal_year DESC);
CREATE INDEX IF NOT EXISTS idx_cash_flow_periods_cash_flow_id ON cash_flow_periods(cash_flow_id);
CREATE INDEX IF NOT EXISTS idx_cash_flow_periods_year_month ON cash_flow_periods(year, month);

-- Triggers para updated_at
CREATE TRIGGER update_cash_flows_updated_at
    BEFORE UPDATE ON cash_flows
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cash_flow_periods_updated_at
    BEFORE UPDATE ON cash_flow_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE cash_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_flow_periods ENABLE ROW LEVEL SECURITY;

-- Políticas para cash_flows
CREATE POLICY "Users can view their own cash flows"
ON cash_flows FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Users can create their own cash flows"
ON cash_flows FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own cash flows"
ON cash_flows FOR UPDATE
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own cash flows"
ON cash_flows FOR DELETE
USING (created_by = auth.uid());

-- Políticas para cash_flow_periods
CREATE POLICY "Users can view periods from their cash flows"
ON cash_flow_periods FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM cash_flows
    WHERE cash_flows.id = cash_flow_periods.cash_flow_id
    AND cash_flows.created_by = auth.uid()
  )
);

CREATE POLICY "Users can create periods in their cash flows"
ON cash_flow_periods FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM cash_flows
    WHERE cash_flows.id = cash_flow_periods.cash_flow_id
    AND cash_flows.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update periods in their cash flows"
ON cash_flow_periods FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM cash_flows
    WHERE cash_flows.id = cash_flow_periods.cash_flow_id
    AND cash_flows.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete periods from their cash flows"
ON cash_flow_periods FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM cash_flows
    WHERE cash_flows.id = cash_flow_periods.cash_flow_id
    AND cash_flows.created_by = auth.uid()
  )
);

-- Comentarios
COMMENT ON TABLE cash_flows IS 'Flujos de caja operacionales con períodos mensuales';
COMMENT ON TABLE cash_flow_periods IS 'Períodos mensuales con entradas y salidas de efectivo';
COMMENT ON COLUMN cash_flow_periods.sales_collections IS 'Cobros de ventas a clientes';
COMMENT ON COLUMN cash_flow_periods.supplier_payments IS 'Pagos a proveedores';
COMMENT ON COLUMN cash_flow_periods.net_cash_flow IS 'Flujo neto del mes (entradas - salidas)';
COMMENT ON COLUMN cash_flow_periods.cumulative_cash_flow IS 'Flujo acumulado desde el inicio del año';

COMMIT;

-- Mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '✅ Tablas de flujo de caja creadas correctamente';
    RAISE NOTICE 'Ahora los usuarios pueden gestionar flujos de caja con períodos mensuales';
END $$;
