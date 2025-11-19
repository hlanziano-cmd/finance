-- =====================================================
-- CREAR USUARIO DE PRUEBA DIRECTAMENTE
-- =====================================================
-- Este script crea un usuario directamente en auth.users
-- evitando las validaciones de la API de Supabase

-- PASO 1: Crear el usuario en auth.users
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'admin@fluxifinance.co',
    -- Password: admin123456 (hasheado con bcrypt)
    crypt('admin123456', gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Admin Usuario"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
);

-- PASO 2: Crear el perfil en user_profiles
INSERT INTO public.user_profiles (id, full_name, created_at, updated_at)
SELECT
    id,
    'Admin Usuario',
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'admin@fluxifinance.co'
ON CONFLICT (id) DO NOTHING;

-- PASO 3: Crear identidad en auth.identities (si no existe ya)
INSERT INTO auth.identities (
    provider_id,
    user_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
)
SELECT
    id::text,
    id,
    format('{"sub":"%s","email":"%s"}', id::text, email)::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
FROM auth.users
WHERE email = 'admin@fluxifinance.co'
AND NOT EXISTS (
    SELECT 1 FROM auth.identities
    WHERE user_id = (SELECT id FROM auth.users WHERE email = 'admin@fluxifinance.co')
);

-- Verificar que el usuario fue creado
DO $$
DECLARE
    user_id UUID;
BEGIN
    SELECT id INTO user_id
    FROM auth.users
    WHERE email = 'admin@fluxifinance.co'
    LIMIT 1;

    IF user_id IS NOT NULL THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ Usuario creado exitosamente!';
        RAISE NOTICE '';
        RAISE NOTICE '📧 Email: admin@fluxifinance.co';
        RAISE NOTICE '🔑 Contraseña: admin123456';
        RAISE NOTICE '🆔 User ID: %', user_id;
        RAISE NOTICE '';
        RAISE NOTICE '➡️  Ahora puedes ejecutar el script seed.sql para crear datos de prueba';
    ELSE
        RAISE EXCEPTION 'Error: No se pudo crear el usuario';
    END IF;
END $$;
