-- =====================================================
-- FIX: Recursión infinita en políticas RLS
-- =====================================================

-- El problema es que organization_members está usando una subconsulta
-- sobre sí misma, creando recursión infinita

-- =====================================================
-- 1. ORGANIZATION_MEMBERS - Base sin recursión
-- =====================================================

-- Eliminar política recursiva
DROP POLICY IF EXISTS "Users can view members of their organizations" ON organization_members;
DROP POLICY IF EXISTS "organization_members_select" ON organization_members;

-- Crear política simple: los usuarios pueden ver sus propias membresías
CREATE POLICY "Users can view their own memberships"
ON organization_members
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- =====================================================
-- 2. ORGANIZATIONS - Basada en organization_members
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
-- 3. BALANCE SHEETS - Basada en organizations
-- =====================================================

DROP POLICY IF EXISTS "Users can view balances of their organizations" ON balance_sheets;
DROP POLICY IF EXISTS "balance_sheets_select" ON balance_sheets;

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
-- 4. BALANCE SHEET ITEMS
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
-- 5. INCOME STATEMENTS
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
-- 6. INCOME STATEMENT ITEMS
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
-- 7. USER_PROFILES - Los usuarios pueden ver su propio perfil
-- =====================================================

DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_select" ON user_profiles;

CREATE POLICY "Users can view their own profile"
ON user_profiles
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- =====================================================
-- Verificar políticas creadas
-- =====================================================

SELECT
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN (
        'organization_members',
        'organizations',
        'balance_sheets',
        'balance_sheet_items',
        'income_statements',
        'income_statement_items',
        'user_profiles'
    )
ORDER BY tablename, policyname;

-- =====================================================
-- PRUEBA: Verificar acceso a datos
-- =====================================================

-- Ver membresías del usuario
SELECT
    'MIS MEMBRESÍAS' as tipo,
    om.organization_id,
    om.role,
    o.name as organizacion
FROM organization_members om
JOIN organizations o ON om.organization_id = o.id
WHERE om.user_id = auth.uid();

-- Ver balances accesibles
SELECT
    'MIS BALANCES' as tipo,
    bs.id,
    bs.name,
    bs.organization_id
FROM balance_sheets bs
WHERE bs.organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
);

RAISE NOTICE '✅ Políticas RLS corregidas - Sin recursión';
RAISE NOTICE 'Ahora deberías poder acceder a los datos de tus organizaciones';
