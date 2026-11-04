-- ==============================================================================
-- SIMPKL Database Migration: Initial Schema
-- PostgreSQL + Supabase with Row Level Security (RLS) & Triggers
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES & ROLES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    avatar_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'operator', 'school_supervisor', 'headmaster')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- ------------------------------------------------------------------------------
-- 2. SCHOOL SETTINGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_name TEXT NOT NULL DEFAULT 'SMK Negeri 2 Makassar',
    province_name TEXT NOT NULL DEFAULT 'PEMERINTAH PROVINSI SULAWESI SELATAN',
    agency_name TEXT NOT NULL DEFAULT 'DINAS PENDIDIKAN',
    city TEXT NOT NULL DEFAULT 'Makassar',
    npsn TEXT NOT NULL DEFAULT '20531234',
    address TEXT NOT NULL DEFAULT 'Jl. Pancasila, Makassar, Sulawesi Selatan',
    phone TEXT DEFAULT '(0411) 855-0123',
    email TEXT DEFAULT 'info@smkn2makassar.sch.id',
    website TEXT DEFAULT 'https://smkn2makassar.sch.id',
    headmaster_name TEXT NOT NULL DEFAULT 'Dr. H. Bambang Sudarsono, M.Pd.',
    headmaster_nip TEXT DEFAULT '19680512 199303 1 004',
    logo_url TEXT,
    letterhead_template TEXT DEFAULT 'PEMERINTAH PROVINSI SULAWESI SELATAN\nDINAS PENDIDIKAN\nSMK NEGERI 2 MAKASSAR',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.profiles(id)
);

-- ------------------------------------------------------------------------------
-- 3. ACADEMIC YEARS & INTERNSHIP PERIODS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE, -- e.g. "2024/2025"
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.internship_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID NOT NULL REFERENCES public.academic_years(id) ON DELETE RESTRICT,
    name TEXT NOT NULL, -- e.g. "PKL Semester Ganjil 2024/2025"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_period_dates CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_internship_periods_active ON public.internship_periods(is_active);

-- ------------------------------------------------------------------------------
-- 4. DEPARTMENTS & CLASSES
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE, -- e.g. "RPL", "TKJ", "DKV"
    name TEXT NOT NULL,
    head_of_department TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    name TEXT NOT NULL, -- e.g. "XII RPL 1"
    grade_level INTEGER NOT NULL CHECK (grade_level IN (11, 12, 13)),
    homeroom_teacher TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (department_id, name)
);

CREATE INDEX IF NOT EXISTS idx_classes_dept ON public.classes(department_id);

-- ------------------------------------------------------------------------------
-- 5. STUDENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    nisn VARCHAR(10) NOT NULL UNIQUE,
    nis TEXT NOT NULL UNIQUE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE RESTRICT,
    department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
    gender VARCHAR(1) CHECK (gender IN ('L', 'P')),
    address TEXT NOT NULL,
    student_phone TEXT, -- WhatsApp siswa
    parent_name TEXT,
    parent_phone TEXT NOT NULL, -- WhatsApp orang tua
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    CONSTRAINT chk_nisn_format CHECK (nisn ~ '^[0-9]{10}$')
);

CREATE INDEX IF NOT EXISTS idx_students_nisn ON public.students(nisn);
CREATE INDEX IF NOT EXISTS idx_students_name ON public.students(full_name);
CREATE INDEX IF NOT EXISTS idx_students_class ON public.students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_dept ON public.students(department_id);
CREATE INDEX IF NOT EXISTS idx_students_archived ON public.students(is_archived);

-- ------------------------------------------------------------------------------
-- 6. PARTNERS (DU/DI) & INDUSTRY SUPERVISORS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name TEXT NOT NULL,
    industry_sector TEXT NOT NULL,
    address TEXT NOT NULL,
    person_in_charge TEXT NOT NULL,
    contact_number TEXT NOT NULL,
    email TEXT,
    default_quota INTEGER NOT NULL DEFAULT 5 CHECK (default_quota >= 0),
    google_maps_url TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_partners_name ON public.partners(company_name);
CREATE INDEX IF NOT EXISTS idx_partners_archived ON public.partners(is_archived);

CREATE TABLE IF NOT EXISTS public.partner_quotas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
    period_id UUID NOT NULL REFERENCES public.internship_periods(id) ON DELETE CASCADE,
    quota INTEGER NOT NULL CHECK (quota >= 0),
    UNIQUE (partner_id, period_id)
);

CREATE TABLE IF NOT EXISTS public.industry_supervisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE RESTRICT,
    name TEXT NOT NULL,
    position TEXT,
    phone TEXT NOT NULL,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_industry_supervisors_partner ON public.industry_supervisors(partner_id);

-- ------------------------------------------------------------------------------
-- 7. SCHOOL SUPERVISORS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.school_supervisors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    nip TEXT UNIQUE,
    name TEXT NOT NULL,
    department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
    phone TEXT NOT NULL,
    email TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_supervisors_profile ON public.school_supervisors(profile_id);

-- ------------------------------------------------------------------------------
-- 8. PLACEMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE RESTRICT,
    period_id UUID NOT NULL REFERENCES public.internship_periods(id) ON DELETE RESTRICT,
    partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE RESTRICT,
    school_supervisor_id UUID NOT NULL REFERENCES public.school_supervisors(id) ON DELETE RESTRICT,
    industry_supervisor_id UUID REFERENCES public.industry_supervisors(id) ON DELETE RESTRICT,
    start_date DATE NOT NULL,
    planned_withdrawal_date DATE NOT NULL,
    actual_withdrawal_date DATE,
    status TEXT NOT NULL DEFAULT 'terjadwal' CHECK (
        status IN ('direncanakan', 'terjadwal', 'berlangsung', 'menunggu_penarikan', 'selesai', 'dibatalkan')
    ),
    notes TEXT,
    withdrawal_notes TEXT,
    final_score NUMERIC(5, 2) CHECK (final_score IS NULL OR (final_score >= 0 AND final_score <= 100)),
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id),
    updated_by UUID REFERENCES public.profiles(id),
    CONSTRAINT chk_planned_withdrawal CHECK (planned_withdrawal_date >= start_date),
    CONSTRAINT chk_actual_withdrawal CHECK (actual_withdrawal_date IS NULL OR actual_withdrawal_date >= start_date),
    CONSTRAINT chk_completion_requires_actual_date CHECK (status != 'selesai' OR actual_withdrawal_date IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_placements_student ON public.placements(student_id);
CREATE INDEX IF NOT EXISTS idx_placements_partner ON public.placements(partner_id);
CREATE INDEX IF NOT EXISTS idx_placements_period ON public.placements(period_id);
CREATE INDEX IF NOT EXISTS idx_placements_school_sup ON public.placements(school_supervisor_id);
CREATE INDEX IF NOT EXISTS idx_placements_status ON public.placements(status);
CREATE INDEX IF NOT EXISTS idx_placements_dates ON public.placements(start_date, planned_withdrawal_date);

-- ------------------------------------------------------------------------------
-- 9. MONITORING RECORDS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.monitoring_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_id UUID NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
    school_supervisor_id UUID NOT NULL REFERENCES public.school_supervisors(id) ON DELETE RESTRICT,
    visit_date DATE NOT NULL,
    student_progress TEXT NOT NULL,
    obstacles TEXT,
    follow_up TEXT NOT NULL,
    attachment_url TEXT,
    attachment_name TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_by UUID REFERENCES public.profiles(id)
);

CREATE INDEX IF NOT EXISTS idx_monitoring_placement ON public.monitoring_records(placement_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_date ON public.monitoring_records(visit_date);

-- ------------------------------------------------------------------------------
-- 10. PLACEMENT DOCUMENTS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.placement_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    placement_id UUID NOT NULL REFERENCES public.placements(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('surat_tugas', 'mou', 'jurnal', 'sertifikat', 'penilaian', 'lainnya')),
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    uploaded_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_placement ON public.placement_documents(placement_id);

-- ------------------------------------------------------------------------------
-- 11. AUDIT LOGS
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_email TEXT,
    user_name TEXT,
    action TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE', 'ARCHIVE', 'RESTORE', 'STATUS_CHANGE', 'IMPORT'
    entity TEXT NOT NULL, -- 'students', 'placements', 'partners', etc.
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 12. BUSINESS RULES VALIDATION FUNCTIONS & TRIGGERS
-- ------------------------------------------------------------------------------

-- Validation 1: Check Industry Supervisor belongs to Partner
CREATE OR REPLACE FUNCTION public.fn_validate_placement_supervisor()
RETURNS TRIGGER AS $$
DECLARE
    v_partner_id UUID;
BEGIN
    IF NEW.industry_supervisor_id IS NOT NULL THEN
        SELECT partner_id INTO v_partner_id
        FROM public.industry_supervisors
        WHERE id = NEW.industry_supervisor_id;

        IF v_partner_id IS DISTINCT FROM NEW.partner_id THEN
            RAISE EXCEPTION 'Pembimbing industri harus terdaftar pada mitra yang dipilih.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_placement_supervisor
BEFORE INSERT OR UPDATE OF partner_id, industry_supervisor_id
ON public.placements
FOR EACH ROW
EXECUTE FUNCTION public.fn_validate_placement_supervisor();

-- Validation 2: Check Student Placement Date Overlaps (No overlapping non-cancelled placements)
CREATE OR REPLACE FUNCTION public.fn_validate_placement_overlap()
RETURNS TRIGGER AS $$
DECLARE
    v_overlap_count INTEGER;
BEGIN
    -- Ignored if status is 'dibatalkan'
    IF NEW.status = 'dibatalkan' THEN
        RETURN NEW;
    END IF;

    SELECT COUNT(*) INTO v_overlap_count
    FROM public.placements
    WHERE student_id = NEW.student_id
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
      AND status <> 'dibatalkan'
      AND (
          (NEW.start_date <= COALESCE(actual_withdrawal_date, planned_withdrawal_date))
          AND
          (COALESCE(NEW.actual_withdrawal_date, NEW.planned_withdrawal_date) >= start_date)
      );

    IF v_overlap_count > 0 THEN
        RAISE EXCEPTION 'Siswa telah memiliki penempatan aktif pada rentang tanggal yang bertumpang tindih.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_placement_overlap
BEFORE INSERT OR UPDATE OF student_id, start_date, planned_withdrawal_date, actual_withdrawal_date, status
ON public.placements
FOR EACH ROW
EXECUTE FUNCTION public.fn_validate_placement_overlap();

-- Validation 3: Check Partner Quota per Period
CREATE OR REPLACE FUNCTION public.fn_validate_partner_quota()
RETURNS TRIGGER AS $$
DECLARE
    v_max_quota INTEGER;
    v_current_count INTEGER;
BEGIN
    -- Only check on INSERT or changing partner/period or un-cancelling
    IF NEW.status = 'dibatalkan' THEN
        RETURN NEW;
    END IF;

    -- Lookup custom quota for period, or fallback to default_quota
    SELECT COALESCE(pq.quota, p.default_quota)
    INTO v_max_quota
    FROM public.partners p
    LEFT JOIN public.partner_quotas pq ON pq.partner_id = p.id AND pq.period_id = NEW.period_id
    WHERE p.id = NEW.partner_id;

    IF v_max_quota IS NULL THEN
        RAISE EXCEPTION 'Data mitra atau kuota tidak ditemukan.';
    END IF;

    SELECT COUNT(*) INTO v_current_count
    FROM public.placements
    WHERE partner_id = NEW.partner_id
      AND period_id = NEW.period_id
      AND status <> 'dibatalkan'
      AND id <> COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

    IF v_current_count >= v_max_quota THEN
        RAISE EXCEPTION 'Kuota mitra untuk periode ini telah terpenuhi (Maksimal % siswa).', v_max_quota;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_partner_quota
BEFORE INSERT OR UPDATE OF partner_id, period_id, status
ON public.placements
FOR EACH ROW
EXECUTE FUNCTION public.fn_validate_partner_quota();

-- Rule 4: Prevent Hard-Delete of records that have placement history
CREATE OR REPLACE FUNCTION public.fn_prevent_student_hard_delete()
RETURNS TRIGGER AS $$
DECLARE
    v_history_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_history_count
    FROM public.placements
    WHERE student_id = OLD.id;

    IF v_history_count > 0 THEN
        RAISE EXCEPTION 'Siswa memiliki riwayat penempatan PKL dan tidak boleh dihapus secara permanen. Gunakan fitur Arsip (is_archived).';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_student_hard_delete
BEFORE DELETE ON public.students
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_student_hard_delete();

CREATE OR REPLACE FUNCTION public.fn_prevent_partner_hard_delete()
RETURNS TRIGGER AS $$
DECLARE
    v_history_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_history_count
    FROM public.placements
    WHERE partner_id = OLD.id;

    IF v_history_count > 0 THEN
        RAISE EXCEPTION 'Mitra memiliki riwayat penempatan PKL dan tidak boleh dihapus secara permanen. Gunakan fitur Arsip (is_archived).';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_prevent_partner_hard_delete
BEFORE DELETE ON public.partners
FOR EACH ROW
EXECUTE FUNCTION public.fn_prevent_partner_hard_delete();
