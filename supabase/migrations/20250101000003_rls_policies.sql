-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Seguridad a nivel de fila para arquitectura multiempresa
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_sheets ENABLE ROW LEVEL SECURITY;
ALTER TABLE balance_sheet_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE income_statement_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE financial_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNCIÓN HELPER: get_user_organizations
-- Obtiene las organizaciones a las que el usuario tiene acceso
-- =====================================================

CREATE OR REPLACE FUNCTION get_user_organizations(user_uuid UUID)
RETURNS SETOF UUID AS $$
BEGIN
    RETURN QUERY
    SELECT organization_id
    FROM organization_members
    WHERE user_id = user_uuid
      AND status = 'active';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- FUNCIÓN HELPER: has_organization_permission
-- Verifica si el usuario tiene un rol específico en la organización
-- =====================================================

CREATE OR REPLACE FUNCTION has_organization_permission(
    user_uuid UUID,
    org_uuid UUID,
    required_role organization_role
)
RETURNS BOOLEAN AS $$
DECLARE
    user_role organization_role;
    role_hierarchy INT;
    required_hierarchy INT;
BEGIN
    -- Obtener el rol del usuario
    SELECT role INTO user_role
    FROM organization_members
    WHERE user_id = user_uuid
      AND organization_id = org_uuid
      AND status = 'active';

    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Definir jerarquía de roles (mayor número = más permisos)
    role_hierarchy := CASE user_role
        WHEN 'owner' THEN 4
        WHEN 'admin' THEN 3
        WHEN 'analyst' THEN 2
        WHEN 'viewer' THEN 1
    END;

    required_hierarchy := CASE required_role
        WHEN 'owner' THEN 4
        WHEN 'admin' THEN 3
        WHEN 'analyst' THEN 2
        WHEN 'viewer' THEN 1
    END;

    RETURN role_hierarchy >= required_hierarchy;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- =====================================================
-- POLICIES: organizations
-- =====================================================

-- SELECT: Ver organizaciones donde el usuario es miembro
CREATE POLICY "Users can view their organizations"
    ON organizations FOR SELECT
    USING (
        id IN (SELECT get_user_organizations(auth.uid()))
    );

-- INSERT: Solo usuarios autenticados pueden crear organizaciones
CREATE POLICY "Authenticated users can create organizations"
    ON organizations FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- UPDATE: Solo owners y admins pueden actualizar
CREATE POLICY "Owners and admins can update organizations"
    ON organizations FOR UPDATE
    USING (
        has_organization_permission(auth.uid(), id, 'admin'::organization_role)
    );

-- DELETE: Solo owners pueden eliminar
CREATE POLICY "Only owners can delete organizations"
    ON organizations FOR DELETE
    USING (
        has_organization_permission(auth.uid(), id, 'owner'::organization_role)
    );

-- =====================================================
-- POLICIES: organization_members
-- =====================================================

-- SELECT: Ver miembros de organizaciones accesibles
CREATE POLICY "Users can view members of their organizations"
    ON organization_members FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

-- INSERT: Admins y owners pueden agregar miembros
CREATE POLICY "Admins can add members"
    ON organization_members FOR INSERT
    WITH CHECK (
        has_organization_permission(auth.uid(), organization_id, 'admin'::organization_role)
    );

-- UPDATE: Admins pueden actualizar miembros (excepto owners)
CREATE POLICY "Admins can update members"
    ON organization_members FOR UPDATE
    USING (
        has_organization_permission(auth.uid(), organization_id, 'admin'::organization_role)
        AND role != 'owner'
    );

-- DELETE: Admins pueden eliminar miembros (excepto owners)
CREATE POLICY "Admins can remove members"
    ON organization_members FOR DELETE
    USING (
        has_organization_permission(auth.uid(), organization_id, 'admin'::organization_role)
        AND role != 'owner'
    );

-- =====================================================
-- POLICIES: balance_sheets
-- =====================================================

-- SELECT: Ver balances de organizaciones accesibles
CREATE POLICY "Users can view balance sheets of their organizations"
    ON balance_sheets FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

-- INSERT: Analysts, admins y owners pueden crear
CREATE POLICY "Analysts can create balance sheets"
    ON balance_sheets FOR INSERT
    WITH CHECK (
        has_organization_permission(auth.uid(), organization_id, 'analyst'::organization_role)
    );

-- UPDATE: Analysts, admins y owners pueden actualizar (solo drafts si son analyst)
CREATE POLICY "Analysts can update draft balance sheets"
    ON balance_sheets FOR UPDATE
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
        AND (
            has_organization_permission(auth.uid(), organization_id, 'admin'::organization_role)
            OR (
                has_organization_permission(auth.uid(), organization_id, 'analyst'::organization_role)
                AND status = 'draft'
            )
        )
    );

-- DELETE: Solo admins y owners pueden eliminar
CREATE POLICY "Admins can delete balance sheets"
    ON balance_sheets FOR DELETE
    USING (
        has_organization_permission(auth.uid(), organization_id, 'admin'::organization_role)
    );

-- =====================================================
-- POLICIES: balance_sheet_items
-- =====================================================

-- SELECT: Ver ítems de balances accesibles
CREATE POLICY "Users can view balance sheet items"
    ON balance_sheet_items FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

-- INSERT: Analysts pueden crear ítems
CREATE POLICY "Analysts can create balance sheet items"
    ON balance_sheet_items FOR INSERT
    WITH CHECK (
        has_organization_permission(auth.uid(), organization_id, 'analyst'::organization_role)
        AND EXISTS (
            SELECT 1 FROM balance_sheets
            WHERE id = balance_sheet_id
            AND status = 'draft'
        )
    );

-- UPDATE: Analysts pueden actualizar ítems de balances en draft
CREATE POLICY "Analysts can update balance sheet items"
    ON balance_sheet_items FOR UPDATE
    USING (
        has_organization_permission(auth.uid(), organization_id, 'analyst'::organization_role)
        AND EXISTS (
            SELECT 1 FROM balance_sheets
            WHERE id = balance_sheet_id
            AND status = 'draft'
        )
    );

-- DELETE: Analysts pueden eliminar ítems de balances en draft
CREATE POLICY "Analysts can delete balance sheet items"
    ON balance_sheet_items FOR DELETE
    USING (
        has_organization_permission(auth.uid(), organization_id, 'analyst'::organization_role)
        AND EXISTS (
            SELECT 1 FROM balance_sheets
            WHERE id = balance_sheet_id
            AND status = 'draft'
        )
    );

-- =====================================================
-- POLICIES: income_statements
-- =====================================================

-- SELECT: Ver estados de resultados de organizaciones accesibles
CREATE POLICY "Users can view income statements"
    ON income_statements FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

-- INSERT: Analysts pueden crear
CREATE POLICY "Analysts can create income statements"
    ON income_statements FOR INSERT
    WITH CHECK (
        has_organization_permission(auth.uid(), organization_id, 'analyst'::organization_role)
    );

-- UPDATE: Analysts pueden actualizar drafts
CREATE POLICY "Analysts can update draft income statements"
    ON income_statements FOR UPDATE
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
        AND (
            has_organization_permission(auth.uid(), organization_id, 'admin'::organization_role)
            OR (
                has_organization_permission(auth.uid(), organization_id, 'analyst'::organization_role)
                AND status = 'draft'
            )
        )
    );

-- DELETE: Solo admins pueden eliminar
CREATE POLICY "Admins can delete income statements"
    ON income_statements FOR DELETE
    USING (
        has_organization_permission(auth.uid(), organization_id, 'admin'::organization_role)
    );

-- =====================================================
-- POLICIES: income_statement_items
-- =====================================================

-- SELECT
CREATE POLICY "Users can view income statement items"
    ON income_statement_items FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

-- INSERT
CREATE POLICY "Analysts can create income statement items"
    ON income_statement_items FOR INSERT
    WITH CHECK (
        has_organization_permission(auth.uid(), organization_id, 'analyst'::organization_role)
        AND EXISTS (
            SELECT 1 FROM income_statements
            WHERE id = income_statement_id
            AND status = 'draft'
        )
    );

-- UPDATE
CREATE POLICY "Analysts can update income statement items"
    ON income_statement_items FOR UPDATE
    USING (
        has_organization_permission(auth.uid(), organization_id, 'analyst'::organization_role)
        AND EXISTS (
            SELECT 1 FROM income_statements
            WHERE id = income_statement_id
            AND status = 'draft'
        )
    );

-- DELETE
CREATE POLICY "Analysts can delete income statement items"
    ON income_statement_items FOR DELETE
    USING (
        has_organization_permission(auth.uid(), organization_id, 'analyst'::organization_role)
        AND EXISTS (
            SELECT 1 FROM income_statements
            WHERE id = income_statement_id
            AND status = 'draft'
        )
    );

-- =====================================================
-- POLICIES: financial_indicators
-- =====================================================

-- SELECT: Todos los miembros pueden ver indicadores
CREATE POLICY "Users can view financial indicators"
    ON financial_indicators FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

-- INSERT: Solo analysts, admins y owners (generados automáticamente)
CREATE POLICY "Analysts can create financial indicators"
    ON financial_indicators FOR INSERT
    WITH CHECK (
        has_organization_permission(auth.uid(), organization_id, 'analyst'::organization_role)
    );

-- DELETE: Solo admins
CREATE POLICY "Admins can delete financial indicators"
    ON financial_indicators FOR DELETE
    USING (
        has_organization_permission(auth.uid(), organization_id, 'admin'::organization_role)
    );

-- =====================================================
-- POLICIES: audit_logs
-- =====================================================

-- SELECT: Todos pueden ver logs de sus organizaciones
CREATE POLICY "Users can view audit logs"
    ON audit_logs FOR SELECT
    USING (
        organization_id IN (SELECT get_user_organizations(auth.uid()))
    );

-- INSERT: Sistema puede insertar (service_role)
-- No se crea policy de INSERT para usuarios normales

-- =====================================================
-- POLICIES: user_profiles
-- =====================================================

-- SELECT: Usuarios pueden ver su propio perfil
CREATE POLICY "Users can view their own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = id);

-- INSERT: Usuarios pueden crear su propio perfil
CREATE POLICY "Users can create their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- UPDATE: Usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- =====================================================
-- TRIGGER: Auto-crear perfil de usuario
-- =====================================================

CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id, full_name)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- =====================================================
-- TRIGGER: Auto-agregar creador como owner
-- =====================================================

CREATE OR REPLACE FUNCTION add_creator_as_owner()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO organization_members (
        organization_id,
        user_id,
        role,
        status,
        joined_at
    ) VALUES (
        NEW.id,
        NEW.created_by,
        'owner',
        'active',
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_organization_created
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION add_creator_as_owner();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION get_user_organizations IS 'Retorna las organizaciones a las que el usuario tiene acceso activo';
COMMENT ON FUNCTION has_organization_permission IS 'Verifica si el usuario tiene un rol con suficientes permisos en la organización';
COMMENT ON FUNCTION create_user_profile IS 'Crea automáticamente un perfil de usuario cuando se registra';
COMMENT ON FUNCTION add_creator_as_owner IS 'Agrega automáticamente al creador como owner de la organización';
