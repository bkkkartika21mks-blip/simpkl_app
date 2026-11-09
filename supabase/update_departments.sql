-- ==============================================================================
-- SIMPKL - Update Jurusan & Kelas (Supabase SQL Editor)
-- Jurusan: TKJ 1, TKJ 2, RPL, MESIN, ELEKTRONIKA 1, ELEKTRONIKA 2, AVI, TKP 1, TKP 2, LISTRIK 1, LISTRIK 2
-- ==============================================================================

-- 1. Insert or update Departments (Jurusan)
INSERT INTO public.departments (id, code, name, head_of_department) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'RPL', 'Rekayasa Perangkat Lunak', 'Ahmad Fauzi, M.Kom.'),
    ('d0000000-0000-0000-0000-000000000002', 'TKJ 1', 'Teknik Komputer & Jaringan 1', 'Siti Rahmawati, S.T.'),
    ('d0000000-0000-0000-0000-000000000003', 'TKJ 2', 'Teknik Komputer & Jaringan 2', 'Joko Susilo, S.T.'),
    ('d0000000-0000-0000-0000-000000000004', 'MESIN', 'Teknik Mesin', 'Bambang Supriyadi, S.T.'),
    ('d0000000-0000-0000-0000-000000000005', 'ELEKTRONIKA 1', 'Teknik Elektronika 1', 'Ir. Hendra Gunawan'),
    ('d0000000-0000-0000-0000-000000000006', 'ELEKTRONIKA 2', 'Teknik Elektronika 2', 'Agus Setiawan, S.T.'),
    ('d0000000-0000-0000-0000-000000000007', 'AVI', 'Audio Video', 'Wahyu Pratama, S.Sn.'),
    ('d0000000-0000-0000-0000-000000000008', 'TKP 1', 'Teknik Konstruksi & Properti 1', 'Dedi Kurniawan, S.T.'),
    ('d0000000-0000-0000-0000-000000000009', 'TKP 2', 'Teknik Konstruksi & Properti 2', 'Rudi Hartono, S.T.'),
    ('d0000000-0000-0000-0000-000000000010', 'LISTRIK 1', 'Teknik Listrik 1', 'Tri Wahyudi, S.T.'),
    ('d0000000-0000-0000-0000-000000000011', 'LISTRIK 2', 'Teknik Listrik 2', 'Eko Prasetyo, S.T.')
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    head_of_department = EXCLUDED.head_of_department;

-- 2. Insert or update Classes (Kelas)
INSERT INTO public.classes (id, department_id, name, grade_level, homeroom_teacher) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'XII RPL 1', 12, 'Sri Mulyani, S.Pd.'),
    ('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'XII RPL 2', 12, 'Budi Santoso, S.Kom.'),
    ('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'XII TKJ 1', 12, 'Joko Susilo, S.T.'),
    ('c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'XII TKJ 2', 12, 'Siti Rahmawati, S.T.'),
    ('c0000000-0000-0000-0000-000000000005', 'd0000000-0000-0000-0000-000000000004', 'XII MESIN 1', 12, 'Bambang Supriyadi, S.T.'),
    ('c0000000-0000-0000-0000-000000000006', 'd0000000-0000-0000-0000-000000000005', 'XII ELEKTRONIKA 1', 12, 'Ir. Hendra Gunawan'),
    ('c0000000-0000-0000-0000-000000000007', 'd0000000-0000-0000-0000-000000000006', 'XII ELEKTRONIKA 2', 12, 'Agus Setiawan, S.T.'),
    ('c0000000-0000-0000-0000-000000000008', 'd0000000-0000-0000-0000-000000000007', 'XII AVI 1', 12, 'Wahyu Pratama, S.Sn.'),
    ('c0000000-0000-0000-0000-000000000009', 'd0000000-0000-0000-0000-000000000008', 'XII TKP 1', 12, 'Dedi Kurniawan, S.T.'),
    ('c0000000-0000-0000-0000-000000000010', 'd0000000-0000-0000-0000-000000000009', 'XII TKP 2', 12, 'Rudi Hartono, S.T.'),
    ('c0000000-0000-0000-0000-000000000011', 'd0000000-0000-0000-0000-000000000010', 'XII LISTRIK 1', 12, 'Tri Wahyudi, S.T.'),
    ('c0000000-0000-0000-0000-000000000012', 'd0000000-0000-0000-0000-000000000011', 'XII LISTRIK 2', 12, 'Eko Prasetyo, S.T.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    department_id = EXCLUDED.department_id,
    homeroom_teacher = EXCLUDED.homeroom_teacher;
