-- =====================================================
-- TEST: Verificar acceso del usuario actual
-- =====================================================
-- Ejecuta este script mientras estés autenticado en la app

-- 1. ¿Quién soy?
SELECT
    'USUARIO ACTUAL' as info,
    auth.uid() as user_id,
    u.email
FROM auth.users u
WHERE u.id = auth.uid();

-- 2. ¿Qué membresías tengo?
SELECT
    'MIS MEMBRESÍAS' as info,
    om.id,
    om.organization_id,
    om.user_id,
    om.role,
    om.status
FROM organization_members om
WHERE om.user_id = auth.uid();

-- 3. ¿Qué organizaciones puedo ver? (con RLS)
SELECT
    'ORGANIZACIONES VISIBLES (CON RLS)' as info,
    o.id,
    o.name,
    o.subscription_plan
FROM organizations o;

-- 4. ¿Qué organizaciones existen? (sin RLS, solo para verificar)
SELECT
    'TODAS LAS ORGANIZACIONES (SIN RLS)' as info,
    COUNT(*) as total
FROM organizations;

-- 5. ¿Qué balances puedo ver? (con RLS)
SELECT
    'BALANCES VISIBLES (CON RLS)' as info,
    bs.id,
    bs.name,
    bs.organization_id,
    bs.status,
    bs.fiscal_year
FROM balance_sheets bs;

-- 6. ¿Qué balances existen? (sin RLS)
SELECT
    'TODOS LOS BALANCES (SIN RLS)' as info,
    COUNT(*) as total
FROM balance_sheets;

-- 7. Verificar relación completa
SELECT
    'RELACIÓN COMPLETA' as info,
    u.email as usuario,
    om.role as rol,
    o.name as organizacion,
    COUNT(bs.id) as num_balances
FROM auth.users u
JOIN organization_members om ON u.id = om.user_id
JOIN organizations o ON om.organization_id = o.id
LEFT JOIN balance_sheets bs ON o.id = bs.organization_id
WHERE u.id = auth.uid()
GROUP BY u.email, om.role, o.name;

-- 8. ¿Las políticas están activas?
SELECT
    'POLÍTICAS ACTIVAS' as info,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('organization_members', 'organizations', 'balance_sheets')
ORDER BY tablename;
