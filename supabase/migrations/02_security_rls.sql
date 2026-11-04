-- ==============================================================================
-- SIMPKL Database Migration: Row Level Security (RLS) & Permissions
-- ==============================================================================

-- Helper function: Check if current authenticated user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if current authenticated user is Admin or Operator
CREATE OR REPLACE FUNCTION public.is_admin_or_operator()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = auth.uid()
          AND role IN ('admin', 'operator')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get current user's school_supervisor id if any
CREATE OR REPLACE FUNCTION public.get_current_supervisor_id()
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    SELECT id INTO v_id
    FROM public.school_supervisors
    WHERE profile_id = auth.uid()
    LIMIT 1;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------------------------
-- ENABLE RLS ON ALL TABLES
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internship_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_supervisors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitoring_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.placement_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- PROFILES POLICIES
-- ------------------------------------------------------------------------------
-- Any authenticated user can read profiles (needed for names/collaborators)
CREATE POLICY "Authenticated users can read profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (true);

-- User can update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Admin can manage all profiles
CREATE POLICY "Admin full access on profiles"
ON public.profiles FOR ALL
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- ------------------------------------------------------------------------------
-- USER ROLES POLICIES (Strictly Admin only for modification)
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- ------------------------------------------------------------------------------
-- SCHOOL SETTINGS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can read school settings"
ON public.school_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admin can update school settings"
ON public.school_settings FOR ALL
TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

-- ------------------------------------------------------------------------------
-- ACADEMIC YEARS & PERIODS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "All authenticated users can read academic years and periods"
ON public.academic_years FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated users can read internship periods"
ON public.internship_periods FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin can manage academic years"
ON public.academic_years FOR ALL TO authenticated
USING (public.has_role('admin'))
WITH CHECK (public.has_role('admin'));

CREATE POLICY "Admin and Operator can manage internship periods"
ON public.internship_periods FOR ALL TO authenticated
USING (public.is_admin_or_operator())
WITH CHECK (public.is_admin_or_operator());

-- ------------------------------------------------------------------------------
-- DEPARTMENTS & CLASSES POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "All authenticated users can read departments"
ON public.departments FOR SELECT TO authenticated USING (true);

CREATE POLICY "All authenticated users can read classes"
ON public.classes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Operator can manage departments"
ON public.departments FOR ALL TO authenticated
USING (public.is_admin_or_operator())
WITH CHECK (public.is_admin_or_operator());

CREATE POLICY "Admin and Operator can manage classes"
ON public.classes FOR ALL TO authenticated
USING (public.is_admin_or_operator())
WITH CHECK (public.is_admin_or_operator());

-- ------------------------------------------------------------------------------
-- STUDENTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view students"
ON public.students FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Operator can manage students"
ON public.students FOR ALL TO authenticated
USING (public.is_admin_or_operator())
WITH CHECK (public.is_admin_or_operator());

-- ------------------------------------------------------------------------------
-- PARTNERS & INDUSTRY SUPERVISORS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view partners"
ON public.partners FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view partner quotas"
ON public.partner_quotas FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view industry supervisors"
ON public.industry_supervisors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Operator can manage partners"
ON public.partners FOR ALL TO authenticated
USING (public.is_admin_or_operator())
WITH CHECK (public.is_admin_or_operator());

CREATE POLICY "Admin and Operator can manage partner quotas"
ON public.partner_quotas FOR ALL TO authenticated
USING (public.is_admin_or_operator())
WITH CHECK (public.is_admin_or_operator());

CREATE POLICY "Admin and Operator can manage industry supervisors"
ON public.industry_supervisors FOR ALL TO authenticated
USING (public.is_admin_or_operator())
WITH CHECK (public.is_admin_or_operator());

-- ------------------------------------------------------------------------------
-- SCHOOL SUPERVISORS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Authenticated users can view school supervisors"
ON public.school_supervisors FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and Operator can manage school supervisors"
ON public.school_supervisors FOR ALL TO authenticated
USING (public.is_admin_or_operator())
WITH CHECK (public.is_admin_or_operator());

-- ------------------------------------------------------------------------------
-- PLACEMENTS POLICIES
-- ------------------------------------------------------------------------------
-- Admin and Operator and Headmaster can view all placements
-- Supervisor can view placements where they are the school supervisor
CREATE POLICY "Placements view policy"
ON public.placements FOR SELECT TO authenticated
USING (
    public.is_admin_or_operator()
    OR public.has_role('headmaster')
    OR school_supervisor_id = public.get_current_supervisor_id()
);

CREATE POLICY "Admin and Operator can insert/update/delete placements"
ON public.placements FOR ALL TO authenticated
USING (public.is_admin_or_operator())
WITH CHECK (public.is_admin_or_operator());

-- ------------------------------------------------------------------------------
-- MONITORING RECORDS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Monitoring view policy"
ON public.monitoring_records FOR SELECT TO authenticated
USING (
    public.is_admin_or_operator()
    OR public.has_role('headmaster')
    OR school_supervisor_id = public.get_current_supervisor_id()
);

-- Supervisors can insert monitoring records for their own assigned placements
CREATE POLICY "Supervisors can insert monitoring for own assigned placements"
ON public.monitoring_records FOR INSERT TO authenticated
WITH CHECK (
    public.is_admin_or_operator()
    OR (
        public.has_role('school_supervisor')
        AND school_supervisor_id = public.get_current_supervisor_id()
        AND EXISTS (
            SELECT 1 FROM public.placements
            WHERE id = placement_id
              AND school_supervisor_id = public.get_current_supervisor_id()
        )
    )
);

CREATE POLICY "Supervisors can update own monitoring"
ON public.monitoring_records FOR UPDATE TO authenticated
USING (
    public.is_admin_or_operator()
    OR (
        public.has_role('school_supervisor')
        AND school_supervisor_id = public.get_current_supervisor_id()
    )
)
WITH CHECK (
    public.is_admin_or_operator()
    OR (
        public.has_role('school_supervisor')
        AND school_supervisor_id = public.get_current_supervisor_id()
    )
);

CREATE POLICY "Admin and Operator can delete monitoring"
ON public.monitoring_records FOR DELETE TO authenticated
USING (public.is_admin_or_operator());

-- ------------------------------------------------------------------------------
-- PLACEMENT DOCUMENTS POLICIES
-- ------------------------------------------------------------------------------
CREATE POLICY "Placement documents view policy"
ON public.placement_documents FOR SELECT TO authenticated
USING (
    public.is_admin_or_operator()
    OR public.has_role('headmaster')
    OR EXISTS (
        SELECT 1 FROM public.placements
        WHERE id = placement_documents.placement_id
          AND school_supervisor_id = public.get_current_supervisor_id()
    )
);

CREATE POLICY "Placement documents insert/update policy"
ON public.placement_documents FOR ALL TO authenticated
USING (public.is_admin_or_operator() OR public.has_role('school_supervisor'))
WITH CHECK (public.is_admin_or_operator() OR public.has_role('school_supervisor'));

-- ------------------------------------------------------------------------------
-- AUDIT LOGS POLICIES (Read-only for Admin & Operator; inserted by triggers/system)
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin and Operator can view audit logs"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.is_admin_or_operator());

CREATE POLICY "Authenticated users can insert audit logs"
ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- STORAGE BUCKET SETUP (Private bucket for SIMPKL documents)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'simpkl_documents',
    'simpkl_documents',
    false, -- Private bucket! Signed URLs only
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 10485760,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

-- Storage RLS: Authenticated users can view objects in simpkl_documents
CREATE POLICY "Authenticated users can read simpkl_documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'simpkl_documents');

-- Storage RLS: Authenticated users can upload
CREATE POLICY "Authenticated users can upload simpkl_documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'simpkl_documents' AND auth.role() = 'authenticated');
