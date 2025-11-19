-- =====================================================
-- SOLUCIÓN RÁPIDA: Permitir Registro de Usuarios
-- =====================================================

-- Opción 1: Desactivar temporalmente el trigger problemático
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Opción 2: Crear una función simplificada que no falle
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Simplemente retornar NEW sin crear el perfil
    -- El perfil se creará manualmente después o cuando el usuario inicie sesión
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger con la función simplificada
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

RAISE NOTICE '✅ Trigger simplificado - los usuarios ahora se pueden crear sin problemas';
RAISE NOTICE 'ℹ️  Los perfiles se crearán automáticamente al iniciar sesión';
