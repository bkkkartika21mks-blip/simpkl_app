-- ==============================================================================
-- SIMPKL Database Seed: Realistic Fictional Indonesian Data (Labeled as [DATA CONTOH / SIMULASI])
-- ==============================================================================

-- 1. School Settings
INSERT INTO public.school_settings (
    school_name, province_name, agency_name, city, npsn, address, phone, email, website,
    headmaster_name, headmaster_nip, letterhead_template
) VALUES (
    'SMK Negeri 2 Makassar',
    'PEMERINTAH PROVINSI SULAWESI SELATAN',
    'DINAS PENDIDIKAN',
    'Makassar',
    '20531234',
    'Jl. Pancasila, Makassar, Sulawesi Selatan',
    '(0411) 855-0123',
    'info@smkn2makassar.sch.id',
    'https://smkn2makassar.sch.id',
    'Dr. H. Bambang Sudarsono, M.Pd.',
    '19680512 199303 1 004',
    'PEMERINTAH PROVINSI SULAWESI SELATAN\nDINAS PENDIDIKAN\nSMK NEGERI 2 MAKASSAR\nJl. Pancasila, Makassar | Telp: (0411) 855-0123'
) ON CONFLICT DO NOTHING;

-- 2. Academic Years & Periods
INSERT INTO public.academic_years (id, name, is_active) VALUES
    ('a0000000-0000-0000-0000-000000000001', '2024/2025', TRUE),
    ('a0000000-0000-0000-0000-000000000002', '2023/2024', FALSE)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.internship_periods (id, academic_year_id, name, start_date, end_date, is_active) VALUES
    ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'PKL Semester Ganjil 2024/2025 [DATA CONTOH]', '2024-08-01', '2024-11-30', TRUE),
    ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'PKL Semester Genap 2024/2025 [DATA CONTOH]', '2025-01-10', '2025-04-30', FALSE)
ON CONFLICT DO NOTHING;

-- 3. Departments & Classes
INSERT INTO public.departments (id, code, name, head_of_department) VALUES
    ('d0000000-0000-0000-0000-000000000001', 'RPL', 'Rekayasa Perangkat Lunak', 'Ahmad Fauzi, S.Kom., M.Kom.'),
    ('d0000000-0000-0000-0000-000000000002', 'TKJ', 'Teknik Komputer & Jaringan', 'Siti Rahmawati, S.T.'),
    ('d0000000-0000-0000-0000-000000000003', 'DKV', 'Desain Komunikasi Visual', 'Wahyu Pratama, S.Sn.')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.classes (id, department_id, name, grade_level, homeroom_teacher) VALUES
    ('c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'XII RPL 1', 12, 'Sri Mulyani, S.Pd.'),
    ('c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'XII RPL 2', 12, 'Budi Santoso, S.Kom.'),
    ('c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'XII TKJ 1', 12, 'Joko Susilo, S.T.'),
    ('c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'XII DKV 1', 12, 'Anisa Kusuma, M.Ds.')
ON CONFLICT DO NOTHING;

-- 4. School Supervisors
INSERT INTO public.school_supervisors (id, nip, name, department_id, phone, email, is_active) VALUES
    ('s0000000-0000-0000-0000-000000000001', '19810214 200501 1 002', 'Ahmad Fauzi, S.Kom. [Pembimbing]', 'd0000000-0000-0000-0000-000000000001', '081234567891', 'ahmad.fauzi@smkn1nusantara.sch.id', TRUE),
    ('s0000000-0000-0000-0000-000000000002', '19850621 200902 2 004', 'Siti Rahmawati, S.T. [Pembimbing]', 'd0000000-0000-0000-0000-000000000002', '081234567892', 'siti.rahma@smkn1nusantara.sch.id', TRUE),
    ('s0000000-0000-0000-0000-000000000003', '19890918 201201 1 007', 'Wahyu Pratama, S.Sn. [Pembimbing]', 'd0000000-0000-0000-0000-000000000003', '081234567893', 'wahyu.p@smkn1nusantara.sch.id', TRUE)
ON CONFLICT DO NOTHING;

-- 5. Partners (DU/DI) & Industry Supervisors
INSERT INTO public.partners (
    id, company_name, industry_sector, address, person_in_charge, contact_number, email, default_quota, google_maps_url
) VALUES
    ('p0000000-0000-0000-0000-000000000001', 'PT Nusantara Digital Solusindo [CONTOH]', 'Teknologi Informasi & Software House', 'Gedung Cyber 2 Lantai 15, Jl. HR Rasuna Said, Jakarta Selatan', 'Rian Hidayat, M.TI.', '021-52901122', 'career@nusantaradigital.id', 5, 'https://maps.google.com/?q=Jakarta'),
    ('p0000000-0000-0000-0000-000000000002', 'PT Solusi Jaringan Andal [CONTOH]', 'Telekomunikasi & Network Infrastructure', 'Kawasan Industri Pulogadung Kav. 18, Jakarta Timur', 'Hendra Setiawan', '021-4601234', 'hrd@solusijaringan.co.id', 4, 'https://maps.google.com/?q=Pulogadung'),
    ('p0000000-0000-0000-0000-000000000003', 'CV Kreasi Visual Grafika [CONTOH]', 'Advertising, Desain Grafis & Multimedia', 'Jl. Kemang Raya No. 12B, Mampang Prapatan, Jakarta Selatan', 'Maya Kartika, S.Ds.', '021-7193344', 'contact@kreasivisual.com', 3, 'https://maps.google.com/?q=Kemang')
ON CONFLICT DO NOTHING;

INSERT INTO public.industry_supervisors (id, partner_id, name, position, phone, email) VALUES
    ('i0000000-0000-0000-0000-000000000001', 'p0000000-0000-0000-0000-000000000001', 'Dimas Prasetyo [Pembimbing DU/DI]', 'Lead Software Engineer', '081298765401', 'dimas@nusantaradigital.id'),
    ('i0000000-0000-0000-0000-000000000002', 'p0000000-0000-0000-0000-000000000002', 'Eko Wibowo [Pembimbing DU/DI]', 'Senior Network Administrator', '081298765402', 'eko.w@solusijaringan.co.id'),
    ('i0000000-0000-0000-0000-000000000003', 'p0000000-0000-0000-0000-000000000003', 'Dina Lestari [Pembimbing DU/DI]', 'Creative Director', '081298765403', 'dina@kreasivisual.com')
ON CONFLICT DO NOTHING;

-- 6. Students (10-digit NISN, distinct classes & depts)
INSERT INTO public.students (
    id, full_name, nisn, nis, class_id, department_id, gender, address, student_phone, parent_name, parent_phone
) VALUES
    ('10000000-0000-0000-0000-000000000001', 'Fajar Ramadhan [DATA CONTOH]', '0061234567', '22231001', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'L', 'Jl. Tebet Barat Dalam No. 14, Jakarta Selatan', '085711223344', 'Ramadhan Triyono', '081288990011'),
    ('10000000-0000-0000-0000-000000000002', 'Nabila Zahra [DATA CONTOH]', '0062345678', '22231002', 'c0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001', 'P', 'Jl. Pancoran Barat VIII No. 5, Jakarta Selatan', '085711223345', 'Agus Suprianto', '081288990012'),
    ('10000000-0000-0000-0000-000000000003', 'Rizky Aditiya [DATA CONTOH]', '0063456789', '22231003', 'c0000000-0000-0000-0000-000000000002', 'd0000000-0000-0000-0000-000000000001', 'L', 'Jl. Kalibata Tengah No. 22, Jakarta Selatan', '085711223346', 'Supardi', '081288990013'),
    ('10000000-0000-0000-0000-000000000004', 'Putri Ayu Wandira [DATA CONTOH]', '0064567890', '22232001', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'P', 'Jl. Cipinang Muara No. 8, Jakarta Timur', '085711223347', 'Bambang Kusuma', '081288990014'),
    ('10000000-0000-0000-0000-000000000005', 'Kevin Sanjaya [DATA CONTOH]', '0065678901', '22232002', 'c0000000-0000-0000-0000-000000000003', 'd0000000-0000-0000-0000-000000000002', 'L', 'Jl. Rawamangun Muka No. 3, Jakarta Timur', '085711223348', 'Lie Tiong San', '081288990015'),
    ('10000000-0000-0000-0000-000000000006', 'Tiara Andini [DATA CONTOH]', '0066789012', '22233001', 'c0000000-0000-0000-0000-000000000004', 'd0000000-0000-0000-0000-000000000003', 'P', 'Jl. Bangka Raya No. 17, Jakarta Selatan', '085711223349', 'Andi Sujarwo', '081288990016')
ON CONFLICT (nisn) DO NOTHING;

-- 7. Placements & Monitoring Records
-- Note: Data penempatan dan monitoring dikosongkan agar siap digunakan langsung
-- untuk penempatan operasional riil sekolah melalui aplikasi SIMPKL.

