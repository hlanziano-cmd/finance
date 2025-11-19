-- =====================================================
-- FUNCIONES Y VISTAS - DIAGNÓSTICO FINANCIERO
-- =====================================================

-- =====================================================
-- FUNCIÓN: calculate_balance_totals
-- Calcula los totales del balance general
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_balance_totals(p_balance_sheet_id UUID)
RETURNS TABLE (
    total_activo DECIMAL(18, 2),
    total_activo_corriente DECIMAL(18, 2),
    total_activo_no_corriente DECIMAL(18, 2),
    total_pasivo DECIMAL(18, 2),
    total_pasivo_corriente DECIMAL(18, 2),
    total_pasivo_no_corriente DECIMAL(18, 2),
    total_patrimonio DECIMAL(18, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(CASE WHEN category = 'activo' THEN amount ELSE 0 END), 0) as total_activo,
        COALESCE(SUM(CASE WHEN category = 'activo' AND subcategory ILIKE '%corriente%' THEN amount ELSE 0 END), 0) as total_activo_corriente,
        COALESCE(SUM(CASE WHEN category = 'activo' AND subcategory NOT ILIKE '%corriente%' THEN amount ELSE 0 END), 0) as total_activo_no_corriente,
        COALESCE(SUM(CASE WHEN category = 'pasivo' THEN amount ELSE 0 END), 0) as total_pasivo,
        COALESCE(SUM(CASE WHEN category = 'pasivo' AND subcategory ILIKE '%corriente%' THEN amount ELSE 0 END), 0) as total_pasivo_corriente,
        COALESCE(SUM(CASE WHEN category = 'pasivo' AND subcategory NOT ILIKE '%corriente%' THEN amount ELSE 0 END), 0) as total_pasivo_no_corriente,
        COALESCE(SUM(CASE WHEN category = 'patrimonio' THEN amount ELSE 0 END), 0) as total_patrimonio
    FROM balance_sheet_items
    WHERE balance_sheet_id = p_balance_sheet_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNCIÓN: calculate_income_totals
-- Calcula los totales del estado de resultados
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_income_totals(p_income_statement_id UUID)
RETURNS TABLE (
    total_ingresos DECIMAL(18, 2),
    total_costos DECIMAL(18, 2),
    total_gastos_operativos DECIMAL(18, 2),
    total_gastos_financieros DECIMAL(18, 2),
    utilidad_bruta DECIMAL(18, 2),
    utilidad_operativa DECIMAL(18, 2),
    utilidad_neta DECIMAL(18, 2)
) AS $$
DECLARE
    v_ingresos DECIMAL(18, 2);
    v_costos DECIMAL(18, 2);
    v_gastos_op DECIMAL(18, 2);
    v_gastos_fin DECIMAL(18, 2);
BEGIN
    SELECT
        COALESCE(SUM(CASE WHEN category = 'ingresos' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN category = 'costos' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN category = 'gastos_operativos' THEN amount ELSE 0 END), 0),
        COALESCE(SUM(CASE WHEN category = 'gastos_financieros' THEN amount ELSE 0 END), 0)
    INTO v_ingresos, v_costos, v_gastos_op, v_gastos_fin
    FROM income_statement_items
    WHERE income_statement_id = p_income_statement_id;

    RETURN QUERY SELECT
        v_ingresos as total_ingresos,
        v_costos as total_costos,
        v_gastos_op as total_gastos_operativos,
        v_gastos_fin as total_gastos_financieros,
        (v_ingresos - v_costos) as utilidad_bruta,
        (v_ingresos - v_costos - v_gastos_op) as utilidad_operativa,
        (v_ingresos - v_costos - v_gastos_op - v_gastos_fin) as utilidad_neta;
END;
$$ LANGUAGE plpgsql STABLE;

-- =====================================================
-- FUNCIÓN: calculate_financial_indicators
-- Calcula todos los indicadores financieros
-- =====================================================

CREATE OR REPLACE FUNCTION calculate_financial_indicators(
    p_organization_id UUID,
    p_balance_sheet_id UUID,
    p_income_statement_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_indicator_id UUID;
    v_period_start DATE;
    v_period_end DATE;

    -- Variables Balance
    v_activo_total DECIMAL(18, 2);
    v_activo_corriente DECIMAL(18, 2);
    v_pasivo_total DECIMAL(18, 2);
    v_pasivo_corriente DECIMAL(18, 2);
    v_patrimonio DECIMAL(18, 2);
    v_inventario DECIMAL(18, 2);
    v_cuentas_cobrar DECIMAL(18, 2);
    v_cuentas_pagar DECIMAL(18, 2);

    -- Variables P&L
    v_ingresos DECIMAL(18, 2);
    v_costos DECIMAL(18, 2);
    v_gastos_op DECIMAL(18, 2);
    v_utilidad_neta DECIMAL(18, 2);

    -- Indicadores calculados
    v_working_capital DECIMAL(18, 2);
    v_current_ratio DECIMAL(10, 4);
    v_acid_test DECIMAL(10, 4);
    v_gross_margin DECIMAL(10, 4);
    v_operating_margin DECIMAL(10, 4);
    v_net_margin DECIMAL(10, 4);
    v_roe DECIMAL(10, 4);
    v_roa DECIMAL(10, 4);
    v_debt_ratio DECIMAL(10, 4);
    v_debt_to_equity DECIMAL(10, 4);
    v_financial_leverage DECIMAL(10, 4);
    v_asset_turnover DECIMAL(10, 4);
    v_health_score INTEGER;
    v_risk_level VARCHAR(20);
BEGIN
    -- Obtener período
    SELECT period_start, period_end INTO v_period_start, v_period_end
    FROM balance_sheets WHERE id = p_balance_sheet_id;

    -- Obtener datos del balance
    SELECT
        total_activo, total_activo_corriente, total_pasivo,
        total_pasivo_corriente, total_patrimonio
    INTO v_activo_total, v_activo_corriente, v_pasivo_total,
         v_pasivo_corriente, v_patrimonio
    FROM calculate_balance_totals(p_balance_sheet_id);

    -- Obtener inventario y cuentas por cobrar/pagar (simplificado)
    v_inventario := v_activo_corriente * 0.3; -- Estimación
    v_cuentas_cobrar := v_activo_corriente * 0.4;
    v_cuentas_pagar := v_pasivo_corriente * 0.5;

    -- Obtener datos del estado de resultados
    SELECT total_ingresos, total_costos, total_gastos_operativos, utilidad_neta
    INTO v_ingresos, v_costos, v_gastos_op, v_utilidad_neta
    FROM calculate_income_totals(p_income_statement_id);

    -- CALCULAR INDICADORES

    -- Liquidez
    v_working_capital := v_activo_corriente - v_pasivo_corriente;
    v_current_ratio := CASE WHEN v_pasivo_corriente > 0
                            THEN v_activo_corriente / v_pasivo_corriente
                            ELSE NULL END;
    v_acid_test := CASE WHEN v_pasivo_corriente > 0
                       THEN (v_activo_corriente - v_inventario) / v_pasivo_corriente
                       ELSE NULL END;

    -- Rentabilidad
    v_gross_margin := CASE WHEN v_ingresos > 0
                          THEN (v_ingresos - v_costos) / v_ingresos
                          ELSE NULL END;
    v_operating_margin := CASE WHEN v_ingresos > 0
                               THEN (v_ingresos - v_costos - v_gastos_op) / v_ingresos
                               ELSE NULL END;
    v_net_margin := CASE WHEN v_ingresos > 0
                        THEN v_utilidad_neta / v_ingresos
                        ELSE NULL END;
    v_roe := CASE WHEN v_patrimonio > 0
                 THEN v_utilidad_neta / v_patrimonio
                 ELSE NULL END;
    v_roa := CASE WHEN v_activo_total > 0
                 THEN v_utilidad_neta / v_activo_total
                 ELSE NULL END;

    -- Endeudamiento
    v_debt_ratio := CASE WHEN v_activo_total > 0
                        THEN v_pasivo_total / v_activo_total
                        ELSE NULL END;
    v_debt_to_equity := CASE WHEN v_patrimonio > 0
                            THEN v_pasivo_total / v_patrimonio
                            ELSE NULL END;
    v_financial_leverage := CASE WHEN v_patrimonio > 0
                                THEN v_activo_total / v_patrimonio
                                ELSE NULL END;

    -- Eficiencia
    v_asset_turnover := CASE WHEN v_activo_total > 0
                            THEN v_ingresos / v_activo_total
                            ELSE NULL END;

    -- Calcular score de salud (0-100)
    v_health_score := LEAST(100, GREATEST(0,
        COALESCE(v_current_ratio * 20, 0) +
        COALESCE(v_net_margin * 100, 0) +
        COALESCE((1 - v_debt_ratio) * 30, 0) +
        COALESCE(v_roe * 50, 0)
    ))::INTEGER;

    -- Determinar nivel de riesgo
    v_risk_level := CASE
        WHEN v_health_score >= 80 THEN 'bajo'
        WHEN v_health_score >= 60 THEN 'medio'
        WHEN v_health_score >= 40 THEN 'alto'
        ELSE 'critico'
    END;

    -- Insertar indicadores
    INSERT INTO financial_indicators (
        organization_id, balance_sheet_id, income_statement_id,
        period_start, period_end,
        working_capital, current_ratio, acid_test,
        gross_margin, operating_margin, net_margin, roe, roa,
        debt_ratio, debt_to_equity, financial_leverage,
        asset_turnover, health_score, risk_level
    ) VALUES (
        p_organization_id, p_balance_sheet_id, p_income_statement_id,
        v_period_start, v_period_end,
        v_working_capital, v_current_ratio, v_acid_test,
        v_gross_margin, v_operating_margin, v_net_margin, v_roe, v_roa,
        v_debt_ratio, v_debt_to_equity, v_financial_leverage,
        v_asset_turnover, v_health_score, v_risk_level
    ) RETURNING id INTO v_indicator_id;

    RETURN v_indicator_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VISTA: v_organization_financial_summary
-- Resumen financiero por organización
-- =====================================================

CREATE OR REPLACE VIEW v_organization_financial_summary AS
SELECT
    o.id as organization_id,
    o.name as organization_name,
    o.subscription_plan,
    o.subscription_status,

    -- Balance más reciente
    (SELECT period_end FROM balance_sheets
     WHERE organization_id = o.id
     ORDER BY period_end DESC LIMIT 1) as last_balance_date,

    -- Estado de resultados más reciente
    (SELECT period_end FROM income_statements
     WHERE organization_id = o.id
     ORDER BY period_end DESC LIMIT 1) as last_income_date,

    -- Indicadores más recientes
    fi.health_score,
    fi.risk_level,
    fi.current_ratio,
    fi.net_margin,
    fi.roe,

    -- Contadores
    (SELECT COUNT(*) FROM balance_sheets WHERE organization_id = o.id) as balance_sheets_count,
    (SELECT COUNT(*) FROM income_statements WHERE organization_id = o.id) as income_statements_count,
    (SELECT COUNT(*) FROM organization_members WHERE organization_id = o.id AND status = 'active') as active_members_count

FROM organizations o
LEFT JOIN LATERAL (
    SELECT * FROM financial_indicators
    WHERE organization_id = o.id
    ORDER BY calculated_at DESC
    LIMIT 1
) fi ON true
WHERE o.is_active = true;

-- =====================================================
-- VISTA: v_user_organizations
-- Organizaciones de un usuario con su rol
-- =====================================================

CREATE OR REPLACE VIEW v_user_organizations AS
SELECT
    om.user_id,
    om.organization_id,
    o.name as organization_name,
    o.logo_url,
    om.role,
    om.status,
    om.permissions,
    o.subscription_plan,
    o.subscription_status,
    om.joined_at,
    o.created_at as organization_created_at
FROM organization_members om
JOIN organizations o ON om.organization_id = o.id
WHERE om.status = 'active' AND o.is_active = true;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION calculate_balance_totals IS 'Calcula los totales agregados de un balance general';
COMMENT ON FUNCTION calculate_income_totals IS 'Calcula los totales del estado de resultados';
COMMENT ON FUNCTION calculate_financial_indicators IS 'Calcula todos los indicadores financieros y retorna el ID del registro creado';
COMMENT ON VIEW v_organization_financial_summary IS 'Vista resumen del estado financiero de cada organización';
COMMENT ON VIEW v_user_organizations IS 'Vista de organizaciones accesibles por usuario';
