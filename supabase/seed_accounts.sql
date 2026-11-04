-- ==============================================================================
-- SIMPKL: Seed Akun Administrator & Operator untuk Supabase Auth & PostgreSQL
-- ==============================================================================
-- Jalankan file ini di Supabase SQL Editor jika menggunakan database Cloud Supabase.
-- Password bawaan untuk kedua akun:
-- • Admin:    admin@simpkl.id    | Sandi: admin123
-- • Operator: operator@simpkl.id | Sandi: operator123
-- ==============================================================================

-- 1. Pastikan ekstensi pgcrypto tersedia untuk hashing kata sandi
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    admin_id UUID := '00000000-0000-0000-0000-000000000001';
    operator_id UUID := '00000000-0000-0000-0000-000000000002';
BEGIN
    -- 2. Buat Akun Administrator di auth.users jika belum ada
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@simpkl.id') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            aud
        ) VALUES (
            admin_id,
            '00000000-0000-0000-0000-000000000000',
            'admin@simpkl.id',
            crypt('admin123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Administrator SIMPKL"}',
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        );
    ELSE
        SELECT id INTO admin_id FROM auth.users WHERE email = 'admin@simpkl.id';
    END IF;

    -- Profil & Role Admin
    INSERT INTO public.profiles (id, full_name, email, phone, is_active)
    VALUES (admin_id, 'Administrator SIMPKL', 'admin@simpkl.id', '081100000001', TRUE)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, is_active = TRUE;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (admin_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

    -- 3. Buat Akun Operator di auth.users jika belum ada
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'operator@simpkl.id') THEN
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            role,
            aud
        ) VALUES (
            operator_id,
            '00000000-0000-0000-0000-000000000000',
            'operator@simpkl.id',
            crypt('operator123', gen_salt('bf')),
            NOW(),
            '{"provider":"email","providers":["email"]}',
            '{"full_name":"Operator PKL"}',
            NOW(),
            NOW(),
            'authenticated',
            'authenticated'
        );
    ELSE
        SELECT id INTO operator_id FROM auth.users WHERE email = 'operator@simpkl.id';
    END IF;

    -- Profil & Role Operator
    INSERT INTO public.profiles (id, full_name, email, phone, is_active)
    VALUES (operator_id, 'Operator PKL', 'operator@simpkl.id', '081100000002', TRUE)
    ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, is_active = TRUE;

    INSERT INTO public.user_roles (user_id, role)
    VALUES (operator_id, 'operator')
    ON CONFLICT (user_id) DO UPDATE SET role = 'operator';

END $$;
