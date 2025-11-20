-- =====================================================
-- LIMPIEZA DE DATOS DE PRUEBA
-- =====================================================
-- Este script elimina todos los datos de prueba
-- manteniendo la estructura de la base de datos intacta
-- ADVERTENCIA: Esta acción no se puede deshacer

DO $$
BEGIN
    -- 1. Eliminar logs de auditoría
    DELETE FROM audit_logs;
    RAISE NOTICE '✓ Logs de auditoría eliminados';

    -- 2. Eliminar indicadores financieros
    DELETE FROM financial_indicators;
    RAISE NOTICE '✓ Indicadores financieros eliminados';

    -- 3. Eliminar items de estados de resultados
    DELETE FROM income_statement_items;
    RAISE NOTICE '✓ Items de estados de resultados eliminados';

    -- 4. Eliminar estados de resultados
    DELETE FROM income_statements;
    RAISE NOTICE '✓ Estados de resultados eliminados';

    -- 5. Eliminar items de balance general
    DELETE FROM balance_sheet_items;
    RAISE NOTICE '✓ Items de balance general eliminados';

    -- 6. Eliminar balances generales
    DELETE FROM balance_sheets;
    RAISE NOTICE '✓ Balances generales eliminados';

    -- 7. Eliminar membresías de organizaciones
    DELETE FROM organization_members;
    RAISE NOTICE '✓ Membresías de organizaciones eliminadas';

    -- 8. Eliminar organizaciones
    DELETE FROM organizations;
    RAISE NOTICE '✓ Organizaciones eliminadas';

    -- 9. Eliminar perfiles de usuario (excepto el tuyo si lo deseas conservar)
    -- Comenta las siguientes 2 líneas si quieres mantener tu perfil
    DELETE FROM user_profiles;
    RAISE NOTICE '✓ Perfiles de usuario eliminados';

    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ Limpieza completada exitosamente';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'La estructura de la base de datos permanece intacta.';
    RAISE NOTICE 'Todas las tablas, políticas RLS, funciones y vistas están preservadas.';
    RAISE NOTICE 'Puedes comenzar a usar la aplicación desde cero.';
END $$;

-- Verificar que todo está limpio
SELECT
    'organizations' as tabla,
    COUNT(*) as registros_restantes
FROM organizations
UNION ALL
SELECT 'organization_members', COUNT(*) FROM organization_members
UNION ALL
SELECT 'balance_sheets', COUNT(*) FROM balance_sheets
UNION ALL
SELECT 'balance_sheet_items', COUNT(*) FROM balance_sheet_items
UNION ALL
SELECT 'income_statements', COUNT(*) FROM income_statements
UNION ALL
SELECT 'income_statement_items', COUNT(*) FROM income_statement_items
UNION ALL
SELECT 'financial_indicators', COUNT(*) FROM financial_indicators
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs
UNION ALL
SELECT 'user_profiles', COUNT(*) FROM user_profiles;
