-- =====================================================
-- Quick Check: Ver si hay datos básicos
-- =====================================================

-- 1. ¿Cuántas organizaciones hay?
SELECT 'ORGANIZACIONES' as tipo, COUNT(*) as total FROM organizations;

-- 2. ¿Cuántos balances hay?
SELECT 'BALANCES' as tipo, COUNT(*) as total FROM balance_sheets;

-- 3. ¿Quién soy?
SELECT 'MI USUARIO' as tipo, auth.uid() as mi_id;

-- 4. Ver TODAS mis organizaciones
SELECT
    'MIS ORGANIZACIONES' as tipo,
    o.id,
    o.name,
    om.role
FROM organizations o
JOIN organization_members om ON o.id = om.organization_id
WHERE om.user_id = auth.uid();

-- 5. Ver TODOS los balances de MIS organizaciones
SELECT
    'MIS BALANCES' as tipo,
    bs.id,
    bs.name,
    bs.organization_id,
    o.name as org_name
FROM balance_sheets bs
JOIN organizations o ON bs.organization_id = o.id
WHERE bs.organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
);

-- 6. Ver si la organización ef4d03ef-8107-4f79-9f6a-b864ed1b75f3 es mía
SELECT
    'ES MIA?' as tipo,
    CASE
        WHEN EXISTS (
            SELECT 1 FROM organization_members
            WHERE organization_id = 'ef4d03ef-8107-4f79-9f6a-b864ed1b75f3'
            AND user_id = auth.uid()
        ) THEN 'SÍ'
        ELSE 'NO'
    END as resultado;
