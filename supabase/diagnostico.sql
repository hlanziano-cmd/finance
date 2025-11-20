-- =====================================================
-- DIAGNÓSTICO DE DATOS
-- Verifica que los datos se hayan creado correctamente
-- =====================================================

-- 1. Verificar usuarios
SELECT
    'USUARIOS' as tabla,
    COUNT(*) as total,
    STRING_AGG(email, ', ') as emails
FROM auth.users;

-- 2. Verificar perfiles de usuario
SELECT
    'USER_PROFILES' as tabla,
    COUNT(*) as total
FROM user_profiles;

-- 3. Verificar organizaciones
SELECT
    'ORGANIZATIONS' as tabla,
    COUNT(*) as total,
    STRING_AGG(name, ', ') as nombres
FROM organizations;

-- 4. Verificar miembros de organizaciones
SELECT
    'ORGANIZATION_MEMBERS' as tabla,
    COUNT(*) as total,
    STRING_AGG(role::text, ', ') as roles
FROM organization_members;

-- 5. Verificar balances
SELECT
    'BALANCE_SHEETS' as tabla,
    COUNT(*) as total,
    STRING_AGG(name, ', ') as nombres
FROM balance_sheets;

-- 6. Verificar items de balance
SELECT
    'BALANCE_SHEET_ITEMS' as tabla,
    COUNT(*) as total
FROM balance_sheet_items;

-- 7. Verificar estados de resultados
SELECT
    'INCOME_STATEMENTS' as tabla,
    COUNT(*) as total,
    STRING_AGG(name, ', ') as nombres
FROM income_statements;

-- 8. Verificar items de estado de resultados
SELECT
    'INCOME_STATEMENT_ITEMS' as tabla,
    COUNT(*) as total
FROM income_statement_items;

-- 9. DETALLE: Verificar relaciones entre usuario, organizaciones y balances
SELECT
    u.email,
    o.name as organizacion,
    om.role as rol,
    COUNT(bs.id) as num_balances
FROM auth.users u
LEFT JOIN organization_members om ON u.id = om.user_id
LEFT JOIN organizations o ON om.organization_id = o.id
LEFT JOIN balance_sheets bs ON o.id = bs.organization_id
GROUP BY u.email, o.name, om.role;

-- 10. DETALLE: Ver políticas RLS activas
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
