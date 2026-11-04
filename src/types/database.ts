// ==============================================================================
// SIMPKL - TypeScript Database Models & Entity Definitions
// ==============================================================================

export type UserRole = 'admin' | 'operator' | 'school_supervisor' | 'headmaster';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRecord {
  id: string;
  user_id: string;
  role: UserRole;
  created_at: string;
}

export interface SchoolSettings {
  id: string;
  school_name: string;
  province_name?: string;
  agency_name?: string;
  city?: string;
  npsn: string;
  address: string;
  phone?: string;
  email?: string;
  website?: string;
  headmaster_name: string;
  headmaster_nip?: string;
  logo_url?: string;
  letterhead_template?: string;
  updated_at: string;
  updated_by?: string;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2024/2025"
  is_active: boolean;
  created_at: string;
}

export interface InternshipPeriod {
  id: string;
  academic_year_id: string;
  name: string; // e.g. "PKL Semester Ganjil 2024/2025"
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  is_active: boolean;
  created_at: string;
  updated_at: string;
  academic_year?: AcademicYear;
}

export interface Department {
  id: string;
  code: string; // e.g. "RPL", "TKJ"
  name: string;
  head_of_department?: string;
  created_at: string;
}

export interface ClassRoom {
  id: string;
  department_id: string;
  name: string; // e.g. "XII RPL 1"
  grade_level: number; // 11, 12, 13
  homeroom_teacher?: string;
  created_at: string;
  department?: Department;
}

export interface Student {
  id: string;
  full_name: string;
  nisn: string; // Exactly 10 digits
  nis: string;
  class_id: string;
  department_id: string;
  gender: 'L' | 'P';
  address: string;
  student_phone?: string; // WhatsApp siswa
  parent_name?: string;
  parent_phone: string;  // WhatsApp orang tua
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Joins
  class?: ClassRoom;
  department?: Department;
  current_placement?: Placement;
}

export interface Partner {
  id: string;
  company_name: string;
  industry_sector: string; // e.g. "Teknologi Informasi", "Otomotif"
  address: string;
  person_in_charge: string;
  contact_number: string;
  email?: string;
  default_quota: number;
  google_maps_url?: string;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  // Calculated / dynamic
  assigned_count?: number;
}

export interface PartnerQuota {
  id: string;
  partner_id: string;
  period_id: string;
  quota: number;
}

export interface IndustrySupervisor {
  id: string;
  partner_id: string;
  name: string;
  position?: string;
  phone: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  partner?: Partner;
}

export interface SchoolSupervisor {
  id: string;
  profile_id?: string;
  nip?: string;
  name: string;
  department_id?: string;
  phone: string;
  email?: string;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  department?: Department;
}

export type PlacementStatus =
  | 'direncanakan'
  | 'terjadwal'
  | 'berlangsung'
  | 'menunggu_penarikan'
  | 'selesai'
  | 'dibatalkan';

export interface Placement {
  id: string;
  student_id: string;
  period_id: string;
  partner_id: string;
  school_supervisor_id: string;
  industry_supervisor_id?: string;
  start_date: string; // YYYY-MM-DD
  planned_withdrawal_date: string; // YYYY-MM-DD
  actual_withdrawal_date?: string; // YYYY-MM-DD
  status: PlacementStatus;
  notes?: string;
  withdrawal_notes?: string;
  final_score?: number;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  // Relations
  student?: Student;
  period?: InternshipPeriod;
  partner?: Partner;
  school_supervisor?: SchoolSupervisor;
  industry_supervisor?: IndustrySupervisor;
}

export interface MonitoringRecord {
  id: string;
  placement_id: string;
  school_supervisor_id: string;
  visit_date: string; // YYYY-MM-DD
  student_progress: string;
  obstacles?: string;
  follow_up: string;
  attachment_url?: string;
  attachment_name?: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  // Relations
  placement?: Placement;
  school_supervisor?: SchoolSupervisor;
}

export type PlacementDocumentType =
  | 'surat_tugas'
  | 'mou'
  | 'jurnal'
  | 'sertifikat'
  | 'penilaian'
  | 'lainnya';

export interface PlacementDocument {
  id: string;
  placement_id: string;
  title: string;
  document_type: PlacementDocumentType;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  uploaded_by?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_email?: string;
  user_name?: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'ARCHIVE' | 'RESTORE' | 'STATUS_CHANGE' | 'IMPORT';
  entity: string;
  entity_id?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  created_at: string;
}
