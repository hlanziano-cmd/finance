-- =====================================================
-- SCHEMA INICIAL - SISTEMA DE DIAGNÓSTICO FINANCIERO
-- Arquitectura Multiempresa (Multi-tenant)
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE organization_role AS ENUM ('owner', 'admin', 'analyst', 'viewer');
CREATE TYPE organization_status AS ENUM ('active', 'inactive', 'pending');
CREATE TYPE document_status AS ENUM ('draft', 'final', 'archived');
CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE subscription_status AS ENUM ('active', 'inactive', 'trial', 'cancelled');

-- =====================================================
-- TABLA: organizations
-- Organizaciones/Empresas del sistema
-- =====================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    legal_name VARCHAR(255),
    tax_id VARCHAR(50) NOT NULL UNIQUE,
    country VARCHAR(2) NOT NULL DEFAULT 'CO',
    currency VARCHAR(3) NOT NULL DEFAULT 'COP',

    -- Información adicional
    industry VARCHAR(100),
    size VARCHAR(20),
    settings JSONB DEFAULT '{}'::jsonb,
    fiscal_year_start INTEGER DEFAULT 1 CHECK (fiscal_year_start BETWEEN 1 AND 12),

    -- Suscripción
    subscription_plan subscription_plan DEFAULT 'free',
    subscription_status subscription_status DEFAULT 'trial',
    subscription_expires_at TIMESTAMPTZ,

    -- Metadata
    logo_url TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT true,

    CONSTRAINT valid_tax_id_length CHECK (LENGTH(tax_id) >= 5)
);

-- Índices
CREATE INDEX idx_organizations_tax_id ON organizations(tax_id);
CREATE INDEX idx_organizations_created_by ON organizations(created_by);
CREATE INDEX idx_organizations_status ON organizations(subscription_status);

-- =====================================================
-- TABLA: organization_members
-- Membresías de usuarios en organizaciones
-- =====================================================

CREATE TABLE organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    role organization_role NOT NULL DEFAULT 'viewer',
    status organization_status NOT NULL DEFAULT 'pending',
    permissions JSONB DEFAULT '[]'::jsonb,

    invited_by UUID REFERENCES auth.users(id),
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_organization_member UNIQUE(organization_id, user_id)
);

-- Índices
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(role);

-- =====================================================
-- TABLA: balance_sheets
-- Estados de Situación Financiera (Balance General)
-- =====================================================

CREATE TABLE balance_sheets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    fiscal_year INTEGER NOT NULL,
    status document_status DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),

    CONSTRAINT valid_period CHECK (period_end > period_start),
    CONSTRAINT valid_fiscal_year CHECK (fiscal_year BETWEEN 2000 AND 2100)
);

-- Índices
CREATE INDEX idx_balance_sheets_org_id ON balance_sheets(organization_id);
CREATE INDEX idx_balance_sheets_period_end ON balance_sheets(period_end DESC);
CREATE INDEX idx_balance_sheets_fiscal_year ON balance_sheets(fiscal_year);
CREATE INDEX idx_balance_sheets_status ON balance_sheets(status);

-- =====================================================
-- TABLA: balance_sheet_items
-- Ítems/Cuentas del Balance General
-- =====================================================

CREATE TABLE balance_sheet_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    balance_sheet_id UUID NOT NULL REFERENCES balance_sheets(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    category VARCHAR(20) NOT NULL CHECK (category IN ('activo', 'pasivo', 'patrimonio')),
    subcategory VARCHAR(100) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_code VARCHAR(50),
    amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    order_index INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_balance_items_sheet_id ON balance_sheet_items(balance_sheet_id);
CREATE INDEX idx_balance_items_org_id ON balance_sheet_items(organization_id);
CREATE INDEX idx_balance_items_category ON balance_sheet_items(category);

-- =====================================================
-- TABLA: income_statements
-- Estados de Resultados (P&L)
-- =====================================================

CREATE TABLE income_statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    name VARCHAR(255) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    fiscal_year INTEGER NOT NULL,
    status document_status DEFAULT 'draft',
    version INTEGER DEFAULT 1,
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id),

    CONSTRAINT valid_income_period CHECK (period_end > period_start),
    CONSTRAINT valid_income_fiscal_year CHECK (fiscal_year BETWEEN 2000 AND 2100)
);

-- Índices
CREATE INDEX idx_income_statements_org_id ON income_statements(organization_id);
CREATE INDEX idx_income_statements_period_end ON income_statements(period_end DESC);
CREATE INDEX idx_income_statements_fiscal_year ON income_statements(fiscal_year);

-- =====================================================
-- TABLA: income_statement_items
-- Ítems del Estado de Resultados
-- =====================================================

CREATE TABLE income_statement_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    income_statement_id UUID NOT NULL REFERENCES income_statements(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

    category VARCHAR(30) NOT NULL CHECK (category IN ('ingresos', 'costos', 'gastos_operativos', 'gastos_financieros', 'otros')),
    subcategory VARCHAR(100) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_code VARCHAR(50),
    amount DECIMAL(18, 2) NOT NULL DEFAULT 0,
    notes TEXT,
    order_index INTEGER DEFAULT 0,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_income_items_statement_id ON income_statement_items(income_statement_id);
CREATE INDEX idx_income_items_org_id ON income_statement_items(organization_id);

-- =====================================================
-- TABLA: financial_indicators
-- Indicadores financieros calculados
-- =====================================================

CREATE TABLE financial_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    balance_sheet_id UUID REFERENCES balance_sheets(id) ON DELETE CASCADE,
    income_statement_id UUID REFERENCES income_statements(id) ON DELETE CASCADE,

    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    -- Liquidez
    working_capital DECIMAL(18, 2),
    current_ratio DECIMAL(10, 4),
    acid_test DECIMAL(10, 4),

    -- Rentabilidad
    gross_margin DECIMAL(10, 4),
    operating_margin DECIMAL(10, 4),
    net_margin DECIMAL(10, 4),
    roe DECIMAL(10, 4),
    roa DECIMAL(10, 4),

    -- Endeudamiento
    debt_ratio DECIMAL(10, 4),
    debt_to_equity DECIMAL(10, 4),
    financial_leverage DECIMAL(10, 4),

    -- Eficiencia
    asset_turnover DECIMAL(10, 4),
    inventory_turnover DECIMAL(10, 4),
    receivables_days INTEGER,
    payables_days INTEGER,

    -- Otros
    ebitda DECIMAL(18, 2),
    break_even_point DECIMAL(18, 2),

    -- Análisis
    health_score INTEGER CHECK (health_score BETWEEN 0 AND 100),
    risk_level VARCHAR(20) CHECK (risk_level IN ('bajo', 'medio', 'alto', 'critico')),

    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_financial_indicators_org_id ON financial_indicators(organization_id);
CREATE INDEX idx_financial_indicators_period ON financial_indicators(period_end DESC);

-- =====================================================
-- TABLA: audit_logs
-- Registro de auditoría de cambios
-- =====================================================

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    old_data JSONB,
    new_data JSONB,
    ip_address INET,
    user_agent TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_audit_logs_org_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- =====================================================
-- TABLA: user_profiles
-- Perfiles extendidos de usuarios
-- =====================================================

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    phone VARCHAR(20),
    avatar_url TEXT,
    locale VARCHAR(10) DEFAULT 'es-CO',
    timezone VARCHAR(50) DEFAULT 'America/Bogota',
    preferences JSONB DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS PARA updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_members_updated_at
    BEFORE UPDATE ON organization_members
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_balance_sheets_updated_at
    BEFORE UPDATE ON balance_sheets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_income_statements_updated_at
    BEFORE UPDATE ON income_statements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMENTARIOS EN TABLAS
-- =====================================================

COMMENT ON TABLE organizations IS 'Organizaciones/Empresas en el sistema multiempresa';
COMMENT ON TABLE organization_members IS 'Membresías de usuarios en organizaciones';
COMMENT ON TABLE balance_sheets IS 'Estados de Situación Financiera (Balance General)';
COMMENT ON TABLE balance_sheet_items IS 'Cuentas y partidas del balance general';
COMMENT ON TABLE income_statements IS 'Estados de Resultados (P&L)';
COMMENT ON TABLE income_statement_items IS 'Cuentas y partidas del estado de resultados';
COMMENT ON TABLE financial_indicators IS 'Indicadores financieros calculados';
COMMENT ON TABLE audit_logs IS 'Registro de auditoría de todas las acciones';
COMMENT ON TABLE user_profiles IS 'Perfiles extendidos de usuarios';
