-- =====================================================
-- MIGRACIÓN: Eliminar requerimiento de organizaciones
-- =====================================================
-- Permite que los balances sean directamente del usuario
-- sin necesidad de crear una organización

BEGIN;

-- 1. Hacer organization_id opcional en balance_sheets
ALTER TABLE balance_sheets
ALTER COLUMN organization_id DROP NOT NULL;

-- 2. Hacer organization_id opcional en balance_sheet_items
ALTER TABLE balance_sheet_items
ALTER COLUMN organization_id DROP NOT NULL;

-- 3. Hacer organization_id opcional en income_statements
ALTER TABLE income_statements
ALTER COLUMN organization_id DROP NOT NULL;

-- 4. Hacer organization_id opcional en income_statement_items
ALTER TABLE income_statement_items
ALTER COLUMN organization_id DROP NOT NULL;

-- 5. Hacer organization_id opcional en financial_indicators
ALTER TABLE financial_indicators
ALTER COLUMN organization_id DROP NOT NULL;

-- 6. Hacer organization_id opcional en audit_logs
ALTER TABLE audit_logs
ALTER COLUMN organization_id DROP NOT NULL;

COMMIT;

-- Mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '✅ Migración completada: organization_id es ahora opcional';
    RAISE NOTICE 'Los balances pueden crearse sin organización, solo con el usuario';
END $$;
