-- =====================================================
-- FIX: Políticas RLS - Permitir lectura de datos
-- =====================================================
-- Este script corrige las políticas para que los usuarios
-- puedan ver los datos de sus organizaciones

-- IMPORTANTE: Primero verificar qué usuario está autenticado
SELECT
    auth.uid() as current_user_id,
    u.email
FROM auth.users u
WHERE u.id = auth.uid();

-- =====================================================
-- BALANCE SHEETS - Políticas de lectura
-- =====================================================

-- Eliminar políticas existentes de balance_sheets si existen
DROP POLICY IF EXISTS "Users can view balances of their organizations" ON balance_sheets;
DROP POLICY IF EXISTS "balance_sheets_select" ON balance_sheets;

-- Crear política de SELECT para balance_sheets
CREATE POLICY "Users can view balances of their organizations"
ON balance_sheets
FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- BALANCE SHEET ITEMS - Políticas de lectura
-- =====================================================

DROP POLICY IF EXISTS "Users can view balance items of their organizations" ON balance_sheet_items;
DROP POLICY IF EXISTS "balance_sheet_items_select" ON balance_sheet_items;

CREATE POLICY "Users can view balance items of their organizations"
ON balance_sheet_items
FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- INCOME STATEMENTS - Políticas de lectura
-- =====================================================

DROP POLICY IF EXISTS "Users can view income statements of their organizations" ON income_statements;
DROP POLICY IF EXISTS "income_statements_select" ON income_statements;

CREATE POLICY "Users can view income statements of their organizations"
ON income_statements
FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- INCOME STATEMENT ITEMS - Políticas de lectura
-- =====================================================

DROP POLICY IF EXISTS "Users can view income items of their organizations" ON income_statement_items;
DROP POLICY IF EXISTS "income_statement_items_select" ON income_statement_items;

CREATE POLICY "Users can view income items of their organizations"
ON income_statement_items
FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- ORGANIZATIONS - Políticas de lectura
-- =====================================================

DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
DROP POLICY IF EXISTS "organizations_select" ON organizations;

CREATE POLICY "Users can view their organizations"
ON organizations
FOR SELECT
TO authenticated
USING (
    id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- ORGANIZATION MEMBERS - Políticas de lectura
-- =====================================================

DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "organization_members_select" ON organization_members;

CREATE POLICY "Users can view members of their organizations"
ON organization_members
FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id
        FROM organization_members
        WHERE user_id = auth.uid()
    )
);

-- =====================================================
-- Verificar que las políticas se crearon correctamente
-- =====================================================

SELECT
    tablename,
    policyname,
    cmd,
    roles
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('balance_sheets', 'balance_sheet_items', 'income_statements', 'income_statement_items', 'organizations', 'organization_members')
ORDER BY tablename, policyname;

-- =====================================================
-- PRUEBA: Verificar que el usuario actual puede ver datos
-- =====================================================

-- Ver organizaciones del usuario actual
SELECT
    'MIS ORGANIZACIONES' as tipo,
    o.id,
    o.name,
    om.role
FROM organizations o
JOIN organization_members om ON o.id = om.organization_id
WHERE om.user_id = auth.uid();

-- Ver balances de las organizaciones del usuario
SELECT
    'MIS BALANCES' as tipo,
    bs.id,
    bs.name,
    o.name as organizacion
FROM balance_sheets bs
JOIN organizations o ON bs.organization_id = o.id
JOIN organization_members om ON o.id = om.organization_id
WHERE om.user_id = auth.uid();

RAISE NOTICE '✅ Políticas RLS actualizadas correctamente';
RAISE NOTICE 'Si las consultas de prueba no muestran datos, verifica que:';
RAISE NOTICE '1. Estás autenticado en Supabase';
RAISE NOTICE '2. El usuario tiene organizaciones asignadas en organization_members';
