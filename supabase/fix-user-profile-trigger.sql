-- =====================================================
-- FIX: Trigger de Creación de Perfil de Usuario
-- =====================================================

-- Eliminar el trigger existente
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recrear la función con mejor manejo de errores
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Intentar insertar el perfil, ignorar si ya existe
    INSERT INTO public.user_profiles (id, full_name, avatar_url, created_at, updated_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'avatar_url',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Si hay algún error, lo registramos pero no fallamos la creación del usuario
        RAISE WARNING 'Error creating user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Verificar que la tabla user_profiles tenga RLS habilitado
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

RAISE NOTICE '✅ Trigger de perfil de usuario actualizado correctamente';
