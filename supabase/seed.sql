-- =====================================================
-- SEED DATA - Datos de Prueba
-- Sistema de Diagnóstico Financiero
-- =====================================================

-- IMPORTANTE: Este script obtiene automáticamente el primer usuario
-- Si no tienes usuarios, créalos primero en Supabase Auth

DO $$
DECLARE
    test_user_id UUID;
    org1_id UUID;
    org2_id UUID;
    balance1_id UUID;
    income1_id UUID;
BEGIN
    -- Obtener el primer usuario disponible
    SELECT id INTO test_user_id FROM auth.users ORDER BY created_at DESC LIMIT 1;

    -- Verificar que existe al menos un usuario
    IF test_user_id IS NULL THEN
        RAISE EXCEPTION 'No hay usuarios en el sistema. Crea un usuario primero en Authentication > Users';
    END IF;

    RAISE NOTICE '📌 Usando usuario: %', test_user_id;
    RAISE NOTICE '';

    -- Desactivar temporalmente el trigger para evitar conflictos
    ALTER TABLE organizations DISABLE TRIGGER on_organization_created;

    -- =====================================================
    -- ORGANIZACIONES
    -- =====================================================

    -- Organización 1: Empresa de Ejemplo
    INSERT INTO organizations (
        id, name, legal_name, tax_id, country, currency,
        industry, size, subscription_plan, subscription_status,
        created_by, created_at
    ) VALUES (
        gen_random_uuid(),
        'Tecnología Avanzada SAS',
        'Tecnología Avanzada Sociedad por Acciones Simplificada',
        '900123456-1',
        'CO',
        'COP',
        'Tecnología',
        'mediana',
        'pro',
        'active',
        test_user_id,
        NOW() - INTERVAL '6 months'
    ) RETURNING id INTO org1_id;

    -- Agregar el usuario como owner de la organización 1
    INSERT INTO organization_members (
        organization_id, user_id, role, status, joined_at
    ) VALUES (
        org1_id, test_user_id, 'owner', 'active', NOW() - INTERVAL '6 months'
    );

    -- Organización 2: Segunda Empresa
    INSERT INTO organizations (
        id, name, legal_name, tax_id, country, currency,
        industry, size, subscription_plan, subscription_status,
        created_by, created_at
    ) VALUES (
        gen_random_uuid(),
        'Comercializadora del Norte',
        'Comercializadora del Norte Limitada',
        '800987654-2',
        'CO',
        'COP',
        'Comercio',
        'pequeña',
        'free',
        'trial',
        test_user_id,
        NOW() - INTERVAL '2 months'
    ) RETURNING id INTO org2_id;

    -- Agregar el usuario como admin de la organización 2
    INSERT INTO organization_members (
        organization_id, user_id, role, status, joined_at
    ) VALUES (
        org2_id, test_user_id, 'admin', 'active', NOW() - INTERVAL '2 months'
    );

    -- Reactivar el trigger
    ALTER TABLE organizations ENABLE TRIGGER on_organization_created;

    RAISE NOTICE '✅ Organizaciones creadas y vinculadas automáticamente';
    RAISE NOTICE 'Organización 1 ID: %', org1_id;
    RAISE NOTICE 'Organización 2 ID: %', org2_id;
    RAISE NOTICE '';

    -- =====================================================
    -- BALANCE GENERAL - TECNOLOGÍA AVANZADA
    -- =====================================================

    INSERT INTO balance_sheets (
        id, organization_id, name, period_start, period_end,
        fiscal_year, status, created_at
    ) VALUES (
        gen_random_uuid(),
        org1_id,
        'Balance General Q4 2024',
        '2024-10-01',
        '2024-12-31',
        2024,
        'final',
        NOW() - INTERVAL '1 month'
    ) RETURNING id INTO balance1_id;

    -- ACTIVOS CORRIENTES
    INSERT INTO balance_sheet_items (organization_id, balance_sheet_id, category, subcategory, account_name, account_code, amount, order_index) VALUES
    (org1_id, balance1_id, 'activo', 'corriente', 'Efectivo y Equivalentes', '1105', 45000000, 1),
    (org1_id, balance1_id, 'activo', 'corriente', 'Inversiones Temporales', '1205', 15000000, 2),
    (org1_id, balance1_id, 'activo', 'corriente', 'Cuentas por Cobrar Clientes', '1305', 85000000, 3),
    (org1_id, balance1_id, 'activo', 'corriente', 'Inventarios', '1405', 60000000, 4),
    (org1_id, balance1_id, 'activo', 'corriente', 'Gastos Pagados por Anticipado', '1705', 5000000, 5);

    -- ACTIVOS NO CORRIENTES
    INSERT INTO balance_sheet_items (organization_id, balance_sheet_id, category, subcategory, account_name, account_code, amount, order_index) VALUES
    (org1_id, balance1_id, 'activo', 'no_corriente', 'Propiedad, Planta y Equipo', '1504', 150000000, 6),
    (org1_id, balance1_id, 'activo', 'no_corriente', 'Depreciación Acumulada', '1592', -45000000, 7),
    (org1_id, balance1_id, 'activo', 'no_corriente', 'Intangibles', '1605', 25000000, 8),
    (org1_id, balance1_id, 'activo', 'no_corriente', 'Inversiones Largo Plazo', '1205', 20000000, 9);

    -- PASIVOS CORRIENTES
    INSERT INTO balance_sheet_items (organization_id, balance_sheet_id, category, subcategory, account_name, account_code, amount, order_index) VALUES
    (org1_id, balance1_id, 'pasivo', 'corriente', 'Obligaciones Bancarias CP', '2105', 35000000, 10),
    (org1_id, balance1_id, 'pasivo', 'corriente', 'Proveedores', '2205', 55000000, 11),
    (org1_id, balance1_id, 'pasivo', 'corriente', 'Cuentas por Pagar', '2335', 20000000, 12),
    (org1_id, balance1_id, 'pasivo', 'corriente', 'Impuestos por Pagar', '2408', 15000000, 13),
    (org1_id, balance1_id, 'pasivo', 'corriente', 'Obligaciones Laborales', '2505', 10000000, 14);

    -- PASIVOS NO CORRIENTES
    INSERT INTO balance_sheet_items (organization_id, balance_sheet_id, category, subcategory, account_name, account_code, amount, order_index) VALUES
    (org1_id, balance1_id, 'pasivo', 'no_corriente', 'Obligaciones Bancarias LP', '2105', 80000000, 15),
    (org1_id, balance1_id, 'pasivo', 'no_corriente', 'Pasivos por Arrendamiento', '2705', 15000000, 16);

    -- PATRIMONIO
    INSERT INTO balance_sheet_items (organization_id, balance_sheet_id, category, subcategory, account_name, account_code, amount, order_index) VALUES
    (org1_id, balance1_id, 'patrimonio', 'capital', 'Capital Social', '3105', 100000000, 17),
    (org1_id, balance1_id, 'patrimonio', 'reservas', 'Reservas Legal', '3305', 20000000, 18),
    (org1_id, balance1_id, 'patrimonio', 'resultados', 'Utilidades Acumuladas', '3605', 25000000, 19),
    (org1_id, balance1_id, 'patrimonio', 'resultados', 'Utilidad del Ejercicio', '3605', 15000000, 20);

    -- =====================================================
    -- ESTADO DE RESULTADOS - TECNOLOGÍA AVANZADA
    -- =====================================================

    INSERT INTO income_statements (
        id, organization_id, name, period_start, period_end,
        fiscal_year, status, created_at
    ) VALUES (
        gen_random_uuid(),
        org1_id,
        'Estado de Resultados Q4 2024',
        '2024-10-01',
        '2024-12-31',
        2024,
        'final',
        NOW() - INTERVAL '1 month'
    ) RETURNING id INTO income1_id;

    -- INGRESOS
    INSERT INTO income_statement_items (organization_id, income_statement_id, category, subcategory, account_name, account_code, amount, order_index) VALUES
    (org1_id, income1_id, 'ingresos', 'operacionales', 'Ventas de Productos', '4135', 250000000, 1),
    (org1_id, income1_id, 'ingresos', 'operacionales', 'Prestación de Servicios', '4140', 80000000, 2),
    (org1_id, income1_id, 'ingresos', 'no_operacionales', 'Ingresos Financieros', '4210', 5000000, 3);

    -- COSTOS
    INSERT INTO income_statement_items (organization_id, income_statement_id, category, subcategory, account_name, account_code, amount, order_index) VALUES
    (org1_id, income1_id, 'costos', 'ventas', 'Costo de Ventas Productos', '6135', -120000000, 4),
    (org1_id, income1_id, 'costos', 'ventas', 'Costo de Prestación Servicios', '6140', -35000000, 5);

    -- GASTOS OPERACIONALES
    INSERT INTO income_statement_items (organization_id, income_statement_id, category, subcategory, account_name, account_code, amount, order_index) VALUES
    (org1_id, income1_id, 'gastos_operativos', 'administrativos', 'Sueldos y Salarios', '5105', -45000000, 6),
    (org1_id, income1_id, 'gastos_operativos', 'administrativos', 'Arrendamientos', '5120', -8000000, 7),
    (org1_id, income1_id, 'gastos_operativos', 'administrativos', 'Servicios Públicos', '5135', -4000000, 8),
    (org1_id, income1_id, 'gastos_operativos', 'ventas', 'Publicidad', '5205', -12000000, 9),
    (org1_id, income1_id, 'gastos_operativos', 'ventas', 'Comisiones', '5210', -8000000, 10),
    (org1_id, income1_id, 'gastos_operativos', 'ventas', 'Transporte', '5240', -5000000, 11);

    -- GASTOS FINANCIEROS
    INSERT INTO income_statement_items (organization_id, income_statement_id, category, subcategory, account_name, account_code, amount, order_index) VALUES
    (org1_id, income1_id, 'gastos_financieros', 'intereses', 'Intereses', '5305', -10000000, 12);

    -- OTROS GASTOS E IMPUESTOS
    INSERT INTO income_statement_items (organization_id, income_statement_id, category, subcategory, account_name, account_code, amount, order_index) VALUES
    (org1_id, income1_id, 'otros', 'diversos', 'Gastos Diversos', '5395', -3000000, 13),
    (org1_id, income1_id, 'otros', 'impuestos', 'Impuesto de Renta', '5405', -15000000, 14);

    -- =====================================================
    -- SEGUNDO BALANCE (DRAFT) - TECNOLOGÍA AVANZADA
    -- =====================================================

    INSERT INTO balance_sheets (
        organization_id, name, period_start, period_end,
        fiscal_year, status, created_at
    ) VALUES (
        org1_id,
        'Balance General Q1 2025 (Borrador)',
        '2025-01-01',
        '2025-03-31',
        2025,
        'draft',
        NOW()
    );

    RAISE NOTICE '';
    RAISE NOTICE '✅ Datos de prueba creados exitosamente!';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Resumen:';
    RAISE NOTICE '- 2 Organizaciones creadas';
    RAISE NOTICE '- 1 Balance General finalizado con 20 cuentas';
    RAISE NOTICE '- 1 Estado de Resultados finalizado con 14 cuentas';
    RAISE NOTICE '- 1 Balance General en borrador';
    RAISE NOTICE '';
    RAISE NOTICE '⚠️  IMPORTANTE: Vincula estas organizaciones a tu usuario';
    RAISE NOTICE '   ejecutando los comandos mostrados arriba.';

END $$;
