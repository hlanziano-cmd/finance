-- =====================================================
-- Verificar organización específica y sus datos
-- =====================================================

-- Reemplaza este ID con el que viste en la consola
-- ef4d03ef-8107-4f79-9f6a-b864ed1b75f3

-- 1. Ver detalles de la organización
SELECT
    'ORGANIZACIÓN' as tipo,
    id,
    name,
    subscription_plan,
    created_by
FROM organizations
WHERE id = 'ef4d03ef-8107-4f79-9f6a-b864ed1b75f3';

-- 2. Ver si el usuario actual es miembro
SELECT
    'MEMBRESÍA' as tipo,
    om.user_id,
    om.role,
    om.status,
    auth.uid() as current_user_id,
    (om.user_id = auth.uid()) as es_mi_membresia
FROM organization_members om
WHERE om.organization_id = 'ef4d03ef-8107-4f79-9f6a-b864ed1b75f3';

-- 3. Ver balances de esta organización (SIN RLS)
SELECT
    'BALANCES (SIN RLS)' as tipo,
    id,
    name,
    organization_id,
    status,
    fiscal_year
FROM balance_sheets
WHERE organization_id = 'ef4d03ef-8107-4f79-9f6a-b864ed1b75f3';

-- 4. Ver si puedo acceder con RLS (esta es la consulta real que hace la app)
SELECT
    'BALANCES (CON RLS - LO QUE VE LA APP)' as tipo,
    bs.id,
    bs.name,
    bs.organization_id,
    bs.status,
    bs.fiscal_year
FROM balance_sheets bs
WHERE bs.organization_id = 'ef4d03ef-8107-4f79-9f6a-b864ed1b75f3';

-- 5. Verificar que la política permite el acceso
SELECT
    'TEST DE POLÍTICA' as tipo,
    CASE
        WHEN 'ef4d03ef-8107-4f79-9f6a-b864ed1b75f3' IN (
            SELECT organization_id
            FROM organization_members
            WHERE user_id = auth.uid()
        ) THEN 'SÍ - Deberías poder ver los balances'
        ELSE 'NO - Por eso no ves los balances'
    END as resultado;

-- 6. Debug: Ver TODAS las membresías del usuario
SELECT
    'MIS ORGANIZACIONES' as tipo,
    om.organization_id,
    o.name,
    om.role
FROM organization_members om
JOIN organizations o ON om.organization_id = o.id
WHERE om.user_id = auth.uid();
