-- =====================================================
-- MIGRACIÓN: Actualizar políticas RLS para usuarios
-- =====================================================
-- Reemplaza las políticas basadas en organizaciones
-- por políticas basadas en el usuario autenticado

BEGIN;

-- ============================================
-- BALANCE SHEETS - Políticas de usuario
-- ============================================

-- Eliminar políticas antiguas de balance_sheets (basadas en organización)
DROP POLICY IF EXISTS "Users can view balance sheets in their organization" ON balance_sheets;
DROP POLICY IF EXISTS "Users can create balance sheets in their organization" ON balance_sheets;
DROP POLICY IF EXISTS "Users can update balance sheets in their organization" ON balance_sheets;
DROP POLICY IF EXISTS "Users can delete balance sheets in their organization" ON balance_sheets;

-- Eliminar políticas si ya existen (basadas en usuario)
DROP POLICY IF EXISTS "Users can view their own balance sheets" ON balance_sheets;
DROP POLICY IF EXISTS "Users can create their own balance sheets" ON balance_sheets;
DROP POLICY IF EXISTS "Users can update their own balance sheets" ON balance_sheets;
DROP POLICY IF EXISTS "Users can delete their own balance sheets" ON balance_sheets;

-- Crear nuevas políticas basadas en usuario
CREATE POLICY "Users can view their own balance sheets"
ON balance_sheets FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Users can create their own balance sheets"
ON balance_sheets FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own balance sheets"
ON balance_sheets FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own balance sheets"
ON balance_sheets FOR DELETE
USING (created_by = auth.uid());

-- ============================================
-- BALANCE SHEET ITEMS - Políticas de usuario
-- ============================================

-- Eliminar políticas antiguas de balance_sheet_items (basadas en organización)
DROP POLICY IF EXISTS "Users can view balance sheet items in their organization" ON balance_sheet_items;
DROP POLICY IF EXISTS "Users can create balance sheet items in their organization" ON balance_sheet_items;
DROP POLICY IF EXISTS "Users can update balance sheet items in their organization" ON balance_sheet_items;
DROP POLICY IF EXISTS "Users can delete balance sheet items in their organization" ON balance_sheet_items;

-- Eliminar políticas si ya existen (basadas en usuario)
DROP POLICY IF EXISTS "Users can view items from their balance sheets" ON balance_sheet_items;
DROP POLICY IF EXISTS "Users can create items in their balance sheets" ON balance_sheet_items;
DROP POLICY IF EXISTS "Users can update items in their balance sheets" ON balance_sheet_items;
DROP POLICY IF EXISTS "Users can delete items from their balance sheets" ON balance_sheet_items;

-- Crear nuevas políticas basadas en el balance_sheet padre
CREATE POLICY "Users can view items from their balance sheets"
ON balance_sheet_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM balance_sheets
    WHERE balance_sheets.id = balance_sheet_items.balance_sheet_id
    AND balance_sheets.created_by = auth.uid()
  )
);

CREATE POLICY "Users can create items in their balance sheets"
ON balance_sheet_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM balance_sheets
    WHERE balance_sheets.id = balance_sheet_items.balance_sheet_id
    AND balance_sheets.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update items in their balance sheets"
ON balance_sheet_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM balance_sheets
    WHERE balance_sheets.id = balance_sheet_items.balance_sheet_id
    AND balance_sheets.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM balance_sheets
    WHERE balance_sheets.id = balance_sheet_items.balance_sheet_id
    AND balance_sheets.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete items from their balance sheets"
ON balance_sheet_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM balance_sheets
    WHERE balance_sheets.id = balance_sheet_items.balance_sheet_id
    AND balance_sheets.created_by = auth.uid()
  )
);

-- ============================================
-- INCOME STATEMENTS - Políticas de usuario
-- ============================================

-- Eliminar políticas antiguas de income_statements (basadas en organización)
DROP POLICY IF EXISTS "Users can view income statements in their organization" ON income_statements;
DROP POLICY IF EXISTS "Users can create income statements in their organization" ON income_statements;
DROP POLICY IF EXISTS "Users can update income statements in their organization" ON income_statements;
DROP POLICY IF EXISTS "Users can delete income statements in their organization" ON income_statements;

-- Eliminar políticas si ya existen (basadas en usuario)
DROP POLICY IF EXISTS "Users can view their own income statements" ON income_statements;
DROP POLICY IF EXISTS "Users can create their own income statements" ON income_statements;
DROP POLICY IF EXISTS "Users can update their own income statements" ON income_statements;
DROP POLICY IF EXISTS "Users can delete their own income statements" ON income_statements;

-- Crear nuevas políticas basadas en usuario
CREATE POLICY "Users can view their own income statements"
ON income_statements FOR SELECT
USING (created_by = auth.uid());

CREATE POLICY "Users can create their own income statements"
ON income_statements FOR INSERT
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own income statements"
ON income_statements FOR UPDATE
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can delete their own income statements"
ON income_statements FOR DELETE
USING (created_by = auth.uid());

-- ============================================
-- INCOME STATEMENT ITEMS - Políticas de usuario
-- ============================================

-- Eliminar políticas antiguas de income_statement_items (basadas en organización)
DROP POLICY IF EXISTS "Users can view income statement items in their organization" ON income_statement_items;
DROP POLICY IF EXISTS "Users can create income statement items in their organization" ON income_statement_items;
DROP POLICY IF EXISTS "Users can update income statement items in their organization" ON income_statement_items;
DROP POLICY IF EXISTS "Users can delete income statement items in their organization" ON income_statement_items;

-- Eliminar políticas si ya existen (basadas en usuario)
DROP POLICY IF EXISTS "Users can view items from their income statements" ON income_statement_items;
DROP POLICY IF EXISTS "Users can create items in their income statements" ON income_statement_items;
DROP POLICY IF EXISTS "Users can update items in their income statements" ON income_statement_items;
DROP POLICY IF EXISTS "Users can delete items from their income statements" ON income_statement_items;

-- Crear nuevas políticas basadas en el income_statement padre
CREATE POLICY "Users can view items from their income statements"
ON income_statement_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM income_statements
    WHERE income_statements.id = income_statement_items.income_statement_id
    AND income_statements.created_by = auth.uid()
  )
);

CREATE POLICY "Users can create items in their income statements"
ON income_statement_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM income_statements
    WHERE income_statements.id = income_statement_items.income_statement_id
    AND income_statements.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update items in their income statements"
ON income_statement_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM income_statements
    WHERE income_statements.id = income_statement_items.income_statement_id
    AND income_statements.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM income_statements
    WHERE income_statements.id = income_statement_items.income_statement_id
    AND income_statements.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete items from their income statements"
ON income_statement_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM income_statements
    WHERE income_statements.id = income_statement_items.income_statement_id
    AND income_statements.created_by = auth.uid()
  )
);

-- ============================================
-- FINANCIAL INDICATORS - Políticas de usuario
-- ============================================

-- Eliminar políticas antiguas de financial_indicators (basadas en organización)
DROP POLICY IF EXISTS "Users can view financial indicators in their organization" ON financial_indicators;
DROP POLICY IF EXISTS "Users can create financial indicators in their organization" ON financial_indicators;
DROP POLICY IF EXISTS "Users can update financial indicators in their organization" ON financial_indicators;
DROP POLICY IF EXISTS "Users can delete financial indicators in their organization" ON financial_indicators;

-- Eliminar políticas si ya existen (basadas en usuario)
DROP POLICY IF EXISTS "Users can view indicators from their balance sheets" ON financial_indicators;
DROP POLICY IF EXISTS "Users can create indicators for their balance sheets" ON financial_indicators;
DROP POLICY IF EXISTS "Users can update indicators from their balance sheets" ON financial_indicators;
DROP POLICY IF EXISTS "Users can delete indicators from their balance sheets" ON financial_indicators;

-- Crear nuevas políticas basadas en el balance_sheet padre
-- Los indicadores se calculan a partir de balances, por lo que verificamos
-- que el balance pertenezca al usuario
CREATE POLICY "Users can view indicators from their balance sheets"
ON financial_indicators FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM balance_sheets
    WHERE balance_sheets.id = financial_indicators.balance_sheet_id
    AND balance_sheets.created_by = auth.uid()
  )
);

CREATE POLICY "Users can create indicators for their balance sheets"
ON financial_indicators FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM balance_sheets
    WHERE balance_sheets.id = financial_indicators.balance_sheet_id
    AND balance_sheets.created_by = auth.uid()
  )
);

CREATE POLICY "Users can update indicators from their balance sheets"
ON financial_indicators FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM balance_sheets
    WHERE balance_sheets.id = financial_indicators.balance_sheet_id
    AND balance_sheets.created_by = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM balance_sheets
    WHERE balance_sheets.id = financial_indicators.balance_sheet_id
    AND balance_sheets.created_by = auth.uid()
  )
);

CREATE POLICY "Users can delete indicators from their balance sheets"
ON financial_indicators FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM balance_sheets
    WHERE balance_sheets.id = financial_indicators.balance_sheet_id
    AND balance_sheets.created_by = auth.uid()
  )
);

-- ============================================
-- AUDIT LOGS - Políticas de usuario
-- ============================================

-- Eliminar políticas antiguas de audit_logs (basadas en organización)
DROP POLICY IF EXISTS "Users can view audit logs in their organization" ON audit_logs;
DROP POLICY IF EXISTS "System can create audit logs" ON audit_logs;

-- Eliminar políticas si ya existen (basadas en usuario)
DROP POLICY IF EXISTS "Users can view their own audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can create audit logs for authenticated users" ON audit_logs;

-- Crear nuevas políticas basadas en usuario
CREATE POLICY "Users can view their own audit logs"
ON audit_logs FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "System can create audit logs for authenticated users"
ON audit_logs FOR INSERT
WITH CHECK (user_id = auth.uid());

COMMIT;

-- Mensaje de éxito
DO $$
BEGIN
    RAISE NOTICE '✅ Políticas RLS actualizadas correctamente';
    RAISE NOTICE 'Ahora los usuarios pueden acceder a sus recursos sin organización';
END $$;
