// ==============================================================================
// SIMPKL - Unified Data Service (Supabase + Local Persistent Store)
// ==============================================================================

import { supabase, isSupabaseConfigured } from './supabaseClient';
import {
  Student,
  Partner,
  SchoolSupervisor,
  IndustrySupervisor,
  Placement,
  MonitoringRecord,
  SchoolSettings,
  AcademicYear,
  InternshipPeriod,
  Department,
  ClassRoom,
  AuditLog,
  Profile,
  UserRoleRecord,
  UserRole,
} from '../types/database';
import {
  INITIAL_SCHOOL_SETTINGS,
  INITIAL_ACADEMIC_YEARS,
  INITIAL_PERIODS,
  INITIAL_DEPARTMENTS,
  INITIAL_CLASSES,
  INITIAL_SCHOOL_SUPERVISORS,
  INITIAL_PARTNERS,
  INITIAL_INDUSTRY_SUPERVISORS,
  INITIAL_STUDENTS,
  INITIAL_PLACEMENTS,
  INITIAL_MONITORING,
  INITIAL_AUDIT_LOGS,
  INITIAL_USERS,
} from './mockData';
import {
  validateNISN,
  validateDates,
  validatePlacementOverlap,
  validatePartnerQuota,
  validateCompletion,
} from '../utils/validators';

// Local storage keys
const STORAGE_PREFIX = 'simpkl_db_';
function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to persist ${key} in localStorage:`, err);
  }
}

class DataService {
  private useSupabase = isSupabaseConfigured;

  // Local persistent state in memory synced with localStorage
  private settings: SchoolSettings = getStorage('settings', INITIAL_SCHOOL_SETTINGS);
  private academicYears: AcademicYear[] = getStorage('academic_years', INITIAL_ACADEMIC_YEARS);
  private periods: InternshipPeriod[] = getStorage('periods', INITIAL_PERIODS);
  private departments: Department[] = getStorage('departments', INITIAL_DEPARTMENTS);
  private classes: ClassRoom[] = getStorage('classes', INITIAL_CLASSES);
  private supervisors: SchoolSupervisor[] = getStorage('supervisors', INITIAL_SCHOOL_SUPERVISORS);
  private partners: Partner[] = getStorage('partners', INITIAL_PARTNERS);
  private industrySupervisors: IndustrySupervisor[] = getStorage('industry_supervisors', INITIAL_INDUSTRY_SUPERVISORS);
  private students: Student[] = getStorage('students', INITIAL_STUDENTS);
  private placements: Placement[] = getStorage('placements', INITIAL_PLACEMENTS);
  private monitoring: MonitoringRecord[] = getStorage('monitoring', INITIAL_MONITORING);
  private auditLogs: AuditLog[] = getStorage('audit_logs', INITIAL_AUDIT_LOGS);
  private users: { profile: Profile; role: UserRoleRecord }[] = getStorage('users', INITIAL_USERS);

  constructor() {
    // 1. Force update school settings to Sulawesi Selatan (SMK Negeri 2 Makassar)
    this.settings.province_name = 'PEMERINTAH PROVINSI SULAWESI SELATAN';
    this.settings.agency_name = 'DINAS PENDIDIKAN';
    this.settings.city = 'Makassar';
    this.settings.school_name = 'SMK Negeri 2 Makassar';
    this.settings.address = 'Jl. Pancasila, Makassar, Sulawesi Selatan';
    this.settings.phone = '(0411) 855-0123';
    this.settings.email = 'info@smkn2makassar.sch.id';
    this.settings.website = 'https://smkn2makassar.sch.id';
    this.settings.letterhead_template = 'PEMERINTAH PROVINSI SULAWESI SELATAN\nDINAS PENDIDIKAN\nSMK NEGERI 2 MAKASSAR\nJl. Pancasila, Makassar | Telp: (0411) 855-0123';
    setStorage('settings', this.settings);

    // 2. Clear all sample placement data as requested by user
    const isSamplePlacement = (p: Placement) =>
      p.id.startsWith('plc-') ||
      Boolean(p.notes?.toLowerCase().includes('contoh')) ||
      Boolean(p.notes?.toLowerCase().includes('sample')) ||
      ['std-1', 'std-2', 'std-3', 'std-4', 'std-5', 'std-6', 'std-7'].includes(p.student_id);

    if (this.placements.some(isSamplePlacement)) {
      this.placements = this.placements.filter(p => !isSamplePlacement(p));
      setStorage('placements', this.placements);
    }

    // Clear associated sample monitoring records
    const validPlacementIds = new Set(this.placements.map(p => p.id));
    this.monitoring = this.monitoring.filter(
      m => !m.id.startsWith('mon-') && validPlacementIds.has(m.placement_id)
    );
    setStorage('monitoring', this.monitoring);

    // 3. Ensure official Admin & Operator accounts exist in users list
    const ensureAccount = (email: string, fullName: string, role: UserRole, id: string, phone: string) => {
      const exists = this.users.find(u => u.profile.email.toLowerCase() === email.toLowerCase());
      if (!exists) {
        this.users.unshift({
          profile: {
            id,
            full_name: fullName,
            email,
            phone,
            is_active: true,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          },
          role: {
            id: `role-${id}`,
            user_id: id,
            role,
            created_at: '2024-01-01T00:00:00Z',
          },
        });
      }
    };

    ensureAccount('admin@simpkl.id', 'Administrator SIMPKL', 'admin', 'usr-admin-simpkl', '081100000001');
    ensureAccount('operator@simpkl.id', 'Operator PKL', 'operator', 'usr-op-simpkl', '081100000002');
    setStorage('users', this.users);

    // 4. Ensure all user requested departments and classes are present
    const hasAllDepts = INITIAL_DEPARTMENTS.every(initDept =>
      this.departments.some(d => d.code === initDept.code)
    );
    if (!hasAllDepts) {
      this.departments = INITIAL_DEPARTMENTS;
      setStorage('departments', this.departments);
      this.classes = INITIAL_CLASSES;
      setStorage('classes', this.classes);
    }

    // 5. Ensure 2026/2027 periods and academic years are updated
    const has2026Period = this.periods.some(p => p.name.includes('2026/2027'));
    if (!has2026Period) {
      this.academicYears = INITIAL_ACADEMIC_YEARS;
      setStorage('academic_years', this.academicYears);
      this.periods = INITIAL_PERIODS;
      setStorage('periods', this.periods);
    }

    this.refreshComputedStatuses();
  }

  /**
   * Automatically compute status based on current date if placement is not yet completed/cancelled
   */
  public refreshComputedStatuses() {
    const today = new Date().toISOString().split('T')[0];
    let changed = false;

    this.placements = this.placements.map(plc => {
      if (plc.status === 'selesai' || plc.status === 'dibatalkan') {
        return plc;
      }

      let newStatus: Placement['status'] = plc.status;
      if (plc.actual_withdrawal_date) {
        newStatus = 'selesai';
      } else if (today < plc.start_date) {
        newStatus = 'terjadwal';
      } else if (today > plc.planned_withdrawal_date) {
        newStatus = 'menunggu_penarikan';
      } else {
        newStatus = 'berlangsung';
      }

      if (newStatus !== plc.status) {
        changed = true;
        return { ...plc, status: newStatus, updated_at: new Date().toISOString() };
      }
      return plc;
    });

    if (changed) {
      setStorage('placements', this.placements);
    }
  }

  // --------------------------------------------------------------------------
  // AUDIT LOGGING HELPER
  // --------------------------------------------------------------------------
  public async logAudit(
    action: AuditLog['action'],
    entity: string,
    entityId: string,
    userName: string,
    userEmail: string,
    oldValues?: any,
    newValues?: any
  ): Promise<void> {
    const newLog: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      action,
      entity,
      entity_id: entityId,
      user_name: userName || 'Petugas SIMPKL',
      user_email: userEmail || 'petugas@simpkl.sch.id',
      old_values: oldValues,
      new_values: newValues,
      created_at: new Date().toISOString(),
    };

    if (this.useSupabase && supabase) {
      try {
        await supabase.from('audit_logs').insert([newLog]);
      } catch (e) {
        console.warn('Failed to write audit to Supabase, logging locally:', e);
      }
    }

    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 300) this.auditLogs.pop(); // Keep recent 300 logs
    setStorage('audit_logs', this.auditLogs);
  }

  // --------------------------------------------------------------------------
  // SCHOOL SETTINGS & ACADEMICS
  // --------------------------------------------------------------------------
  public async getSchoolSettings(): Promise<SchoolSettings> {
    if (this.useSupabase && supabase) {
      const { data, error } = await supabase.from('school_settings').select('*').limit(1).single();
      if (!error && data) return data;
    }
    return this.settings;
  }

  public async updateSchoolSettings(settings: Partial<SchoolSettings>, user: { name: string; email: string }): Promise<SchoolSettings> {
    const updated = {
      ...this.settings,
      ...settings,
      updated_at: new Date().toISOString(),
    };

    if (this.useSupabase && supabase) {
      await supabase.from('school_settings').upsert([updated]);
    }

    await this.logAudit('UPDATE', 'school_settings', updated.id, user.name, user.email, this.settings, updated);
    this.settings = updated;
    setStorage('settings', this.settings);
    return updated;
  }

  public async getAcademicYears(): Promise<AcademicYear[]> {
    if (this.useSupabase && supabase) {
      const { data, error } = await supabase.from('academic_years').select('*').order('created_at', { ascending: false });
      if (!error && data) return data;
    }
    return this.academicYears;
  }

  public async getPeriods(): Promise<InternshipPeriod[]> {
    if (this.useSupabase && supabase) {
      const { data, error } = await supabase.from('internship_periods').select('*, academic_year:academic_years(*)').order('start_date', { ascending: false });
      if (!error && data) return data;
    }
    return this.periods;
  }

  public async savePeriod(period: Partial<InternshipPeriod>, user: { name: string; email: string }): Promise<InternshipPeriod> {
    if (period.start_date && period.end_date && period.end_date < period.start_date) {
      throw new Error('Tanggal selesai periode tidak boleh lebih awal dari tanggal mulai.');
    }

    let saved: InternshipPeriod;
    const isEdit = Boolean(period.id);

    if (isEdit) {
      const old = this.periods.find(p => p.id === period.id);
      saved = {
        ...(old || {}),
        ...period,
        updated_at: new Date().toISOString(),
      } as InternshipPeriod;
      this.periods = this.periods.map(p => (p.id === period.id ? saved : p));
      await this.logAudit('UPDATE', 'internship_periods', saved.id, user.name, user.email, old, saved);
    } else {
      saved = {
        id: 'per-' + Date.now(),
        academic_year_id: period.academic_year_id || this.academicYears[0]?.id || 'ay-1',
        name: period.name || 'Periode Baru',
        start_date: period.start_date || new Date().toISOString().split('T')[0],
        end_date: period.end_date || new Date().toISOString().split('T')[0],
        is_active: period.is_active || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.periods.unshift(saved);
      await this.logAudit('INSERT', 'internship_periods', saved.id, user.name, user.email, null, saved);
    }

    // If marked active, deactivate others
    if (saved.is_active) {
      this.periods = this.periods.map(p => (p.id === saved.id ? p : { ...p, is_active: false }));
    }

    setStorage('periods', this.periods);
    return saved;
  }

  // --------------------------------------------------------------------------
  // DEPARTMENTS & CLASSES
  // --------------------------------------------------------------------------
  public async getDepartments(): Promise<Department[]> {
    if (this.useSupabase && supabase) {
      const { data, error } = await supabase.from('departments').select('*').order('code');
      if (!error && data) return data;
    }
    return this.departments;
  }

  public async getClasses(): Promise<ClassRoom[]> {
    if (this.useSupabase && supabase) {
      const { data, error } = await supabase.from('classes').select('*, department:departments(*)').order('name');
      if (!error && data) return data;
    }
    return this.classes.map(c => ({
      ...c,
      department: this.departments.find(d => d.id === c.department_id),
    }));
  }

  // --------------------------------------------------------------------------
  // STUDENTS (CRUD, Search, Filter, Archive)
  // --------------------------------------------------------------------------
  public async getStudents(options?: {
    search?: string;
    classId?: string;
    departmentId?: string;
    includeArchived?: boolean;
    periodId?: string;
  }): Promise<Student[]> {
    let list = this.students;

    if (!options?.includeArchived) {
      list = list.filter(s => !s.is_archived);
    }

    if (options?.classId) {
      list = list.filter(s => s.class_id === options.classId);
    }

    if (options?.departmentId) {
      list = list.filter(s => s.department_id === options.departmentId);
    }

    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(
        s => s.full_name.toLowerCase().includes(q) || s.nisn.includes(q) || s.nis.includes(q)
      );
    }

    // Attach relations and current placement
    return list.map(student => {
      const cls = this.classes.find(c => c.id === student.class_id);
      const dept = this.departments.find(d => d.id === student.department_id);
      const currentPlacement = this.placements.find(
        p => p.student_id === student.id &&
             p.status !== 'dibatalkan' &&
             (!options?.periodId || p.period_id === options.periodId)
      );

      let placementWithDetails = undefined;
      if (currentPlacement) {
        placementWithDetails = {
          ...currentPlacement,
          partner: this.partners.find(part => part.id === currentPlacement.partner_id),
          school_supervisor: this.supervisors.find(sup => sup.id === currentPlacement.school_supervisor_id),
          industry_supervisor: this.industrySupervisors.find(ind => ind.id === currentPlacement.industry_supervisor_id),
        };
      }

      return {
        ...student,
        class: cls,
        department: dept,
        current_placement: placementWithDetails,
      };
    });
  }

  public async getStudentById(id: string): Promise<Student | null> {
    const student = this.students.find(s => s.id === id);
    if (!student) return null;
    const cls = this.classes.find(c => c.id === student.class_id);
    const dept = this.departments.find(d => d.id === student.department_id);
    return { ...student, class: cls, department: dept };
  }

  public async getStudentPlacementHistory(studentId: string): Promise<Placement[]> {
    return this.placements
      .filter(p => p.student_id === studentId)
      .map(p => ({
        ...p,
        period: this.periods.find(per => per.id === p.period_id),
        partner: this.partners.find(part => part.id === p.partner_id),
        school_supervisor: this.supervisors.find(sup => sup.id === p.school_supervisor_id),
        industry_supervisor: this.industrySupervisors.find(ind => ind.id === p.industry_supervisor_id),
      }))
      .sort((a, b) => b.start_date.localeCompare(a.start_date));
  }

  /**
   * Safe public lookup for students / parents to check PKL verification status
   * Privacy-preserving: does NOT expose phone numbers or personal home address
   */
  public async searchPublicStudentStatus(query: string): Promise<
    {
      id: string;
      nisn: string;
      full_name: string;
      class_name: string;
      department_name: string;
      is_placed: boolean;
      placement?: {
        partner_name: string;
        industry_sector: string;
        partner_address: string;
        school_supervisor: string;
        period_name: string;
        start_date: string;
        planned_withdrawal_date: string;
        actual_withdrawal_date?: string;
        status: Placement['status'];
      };
    }[]
  > {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 3) return [];

    const matched = this.students.filter(
      s => !s.is_archived && (s.nisn.includes(q) || s.full_name.toLowerCase().includes(q))
    );

    return matched.map(s => {
      const cls = this.classes.find(c => c.id === s.class_id);
      const dept = this.departments.find(d => d.id === s.department_id);
      const plc = this.placements.find(p => p.student_id === s.id && p.status !== 'dibatalkan');

      let placementInfo = undefined;
      if (plc) {
        const partner = this.partners.find(part => part.id === plc.partner_id);
        const supervisor = this.supervisors.find(sup => sup.id === plc.school_supervisor_id);
        const period = this.periods.find(per => per.id === plc.period_id);
        placementInfo = {
          partner_name: partner?.company_name || 'Mitra Industri',
          industry_sector: partner?.industry_sector || '-',
          partner_address: partner?.address || '-',
          school_supervisor: supervisor?.name || '-',
          period_name: period?.name || '-',
          start_date: plc.start_date,
          planned_withdrawal_date: plc.planned_withdrawal_date,
          actual_withdrawal_date: plc.actual_withdrawal_date,
          status: plc.status,
        };
      }

      return {
        id: s.id,
        nisn: s.nisn,
        full_name: s.full_name,
        class_name: cls?.name || '-',
        department_name: dept?.name || '-',
        is_placed: Boolean(plc),
        placement: placementInfo,
      };
    });
  }

  public async saveStudent(studentData: Partial<Student>, user: { name: string; email: string }): Promise<Student> {
    // Validate NISN rule: 10 digits & unique
    const nisnError = validateNISN(studentData.nisn || '', this.students, studentData.id);
    if (nisnError) {
      throw new Error(nisnError.message);
    }

    if (!studentData.full_name?.trim()) {
      throw new Error('Nama lengkap siswa wajib diisi.');
    }
    if (!studentData.class_id) {
      throw new Error('Kelas siswa wajib dipilih.');
    }
    if (!studentData.parent_phone?.trim()) {
      throw new Error('Nomor kontak orang tua wajib diisi untuk keamanan siswa.');
    }

    // Auto-link department from class if not provided
    let departmentId = studentData.department_id;
    if (!departmentId && studentData.class_id) {
      const cls = this.classes.find(c => c.id === studentData.class_id);
      if (cls) departmentId = cls.department_id;
    }

    const isEdit = Boolean(studentData.id);
    let saved: Student;

    if (isEdit) {
      const old = this.students.find(s => s.id === studentData.id);
      saved = {
        ...(old || {}),
        ...studentData,
        department_id: departmentId || (old ? old.department_id : 'dept-1'),
        updated_at: new Date().toISOString(),
      } as Student;

      this.students = this.students.map(s => (s.id === studentData.id ? saved : s));
      await this.logAudit('UPDATE', 'students', saved.id, user.name, user.email, old, saved);
    } else {
      saved = {
        id: 'std-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        full_name: studentData.full_name!.trim(),
        nisn: studentData.nisn!.trim(),
        nis: studentData.nis?.trim() || String(Date.now()).slice(-8),
        class_id: studentData.class_id!,
        department_id: departmentId || 'dept-1',
        gender: studentData.gender || 'L',
        address: studentData.address?.trim() || '-',
        student_phone: studentData.student_phone?.trim() || '',
        parent_name: studentData.parent_name?.trim() || '',
        parent_phone: studentData.parent_phone!.trim(),
        is_active: studentData.is_active ?? true,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.students.unshift(saved);
      await this.logAudit('INSERT', 'students', saved.id, user.name, user.email, null, saved);
    }

    setStorage('students', this.students);
    return saved;
  }

  public async archiveStudent(id: string, user: { name: string; email: string }): Promise<void> {
    const student = this.students.find(s => s.id === id);
    if (!student) throw new Error('Data siswa tidak ditemukan.');

    student.is_archived = true;
    student.updated_at = new Date().toISOString();
    setStorage('students', this.students);
    await this.logAudit('ARCHIVE', 'students', id, user.name, user.email, { is_archived: false }, { is_archived: true });
  }

  public async restoreStudent(id: string, user: { name: string; email: string }): Promise<void> {
    const student = this.students.find(s => s.id === id);
    if (!student) throw new Error('Data siswa tidak ditemukan.');

    student.is_archived = false;
    student.updated_at = new Date().toISOString();
    setStorage('students', this.students);
    await this.logAudit('RESTORE', 'students', id, user.name, user.email, { is_archived: true }, { is_archived: false });
  }

  public async deleteStudent(id: string, user: { name: string; email: string }): Promise<void> {
    // Check if placement history exists
    const hasHistory = this.placements.some(p => p.student_id === id);
    if (hasHistory) {
      throw new Error(
        'Siswa memiliki riwayat penempatan PKL dan tidak boleh dihapus secara permanen. Gunakan fitur Arsip agar integritas data tetap terjaga.'
      );
    }

    const old = this.students.find(s => s.id === id);
    this.students = this.students.filter(s => s.id !== id);
    setStorage('students', this.students);
    await this.logAudit('DELETE', 'students', id, user.name, user.email, old, null);
  }

  // --------------------------------------------------------------------------
  // PARTNERS & INDUSTRY SUPERVISORS
  // --------------------------------------------------------------------------
  public async getPartners(options?: { search?: string; includeArchived?: boolean; periodId?: string }): Promise<Partner[]> {
    let list = this.partners;
    if (!options?.includeArchived) {
      list = list.filter(p => !p.is_archived);
    }
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      list = list.filter(p => p.company_name.toLowerCase().includes(q) || p.industry_sector.toLowerCase().includes(q));
    }

    // Attach dynamic assigned count for current period
    const targetPeriodId = options?.periodId || this.periods.find(p => p.is_active)?.id;
    return list.map(partner => {
      const count = this.placements.filter(
        plc => plc.partner_id === partner.id &&
               (!targetPeriodId || plc.period_id === targetPeriodId) &&
               plc.status !== 'dibatalkan'
      ).length;

      return {
        ...partner,
        assigned_count: count,
      };
    });
  }

  public async getPartnerPlacedStudents(partnerId: string, periodId?: string): Promise<Placement[]> {
    return this.placements
      .filter(p => p.partner_id === partnerId && (!periodId || p.period_id === periodId) && p.status !== 'dibatalkan')
      .map(p => ({
        ...p,
        student: this.students.find(s => s.id === p.student_id),
        school_supervisor: this.supervisors.find(sup => sup.id === p.school_supervisor_id),
        industry_supervisor: this.industrySupervisors.find(ind => ind.id === p.industry_supervisor_id),
        period: this.periods.find(per => per.id === p.period_id),
      }));
  }

  public async savePartner(partnerData: Partial<Partner>, user: { name: string; email: string }): Promise<Partner> {
    if (!partnerData.company_name?.trim()) throw new Error('Nama perusahaan/instansi wajib diisi.');
    if (!partnerData.industry_sector?.trim()) throw new Error('Bidang usaha wajib diisi.');
    if (!partnerData.address?.trim()) throw new Error('Alamat mitra wajib diisi.');
    if (!partnerData.person_in_charge?.trim()) throw new Error('Nama pimpinan/penanggung jawab wajib diisi.');
    if (!partnerData.contact_number?.trim()) throw new Error('Nomor kontak mitra wajib diisi.');

    const isEdit = Boolean(partnerData.id);
    let saved: Partner;

    if (isEdit) {
      const old = this.partners.find(p => p.id === partnerData.id);
      saved = {
        ...(old || {}),
        ...partnerData,
        updated_at: new Date().toISOString(),
      } as Partner;
      this.partners = this.partners.map(p => (p.id === partnerData.id ? saved : p));
      await this.logAudit('UPDATE', 'partners', saved.id, user.name, user.email, old, saved);
    } else {
      saved = {
        id: 'part-' + Date.now(),
        company_name: partnerData.company_name!.trim(),
        industry_sector: partnerData.industry_sector!.trim(),
        address: partnerData.address!.trim(),
        person_in_charge: partnerData.person_in_charge!.trim(),
        contact_number: partnerData.contact_number!.trim(),
        email: partnerData.email?.trim() || '',
        default_quota: partnerData.default_quota ?? 5,
        google_maps_url: partnerData.google_maps_url?.trim() || '',
        is_active: true,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.partners.unshift(saved);
      await this.logAudit('INSERT', 'partners', saved.id, user.name, user.email, null, saved);
    }

    setStorage('partners', this.partners);
    return saved;
  }

  public async archivePartner(id: string, user: { name: string; email: string }): Promise<void> {
    const partner = this.partners.find(p => p.id === id);
    if (!partner) throw new Error('Data mitra tidak ditemukan.');
    partner.is_archived = true;
    partner.updated_at = new Date().toISOString();
    setStorage('partners', this.partners);
    await this.logAudit('ARCHIVE', 'partners', id, user.name, user.email, { is_archived: false }, { is_archived: true });
  }

  public async deletePartner(id: string, user: { name: string; email: string }): Promise<void> {
    const hasHistory = this.placements.some(p => p.partner_id === id);
    if (hasHistory) {
      throw new Error(
        'Mitra memiliki riwayat penempatan siswa dan tidak boleh dihapus secara permanen. Gunakan fitur Arsip agar riwayat tetap terjaga.'
      );
    }
    const old = this.partners.find(p => p.id === id);
    this.partners = this.partners.filter(p => p.id !== id);
    setStorage('partners', this.partners);
    await this.logAudit('DELETE', 'partners', id, user.name, user.email, old, null);
  }

  public async getIndustrySupervisors(partnerId?: string): Promise<IndustrySupervisor[]> {
    let list = this.industrySupervisors;
    if (partnerId) {
      list = list.filter(i => i.partner_id === partnerId);
    }
    return list.map(ind => ({
      ...ind,
      partner: this.partners.find(p => p.id === ind.partner_id),
    }));
  }

  public async saveIndustrySupervisor(data: Partial<IndustrySupervisor>, user: { name: string; email: string }): Promise<IndustrySupervisor> {
    if (!data.name?.trim()) throw new Error('Nama pembimbing industri wajib diisi.');
    if (!data.partner_id) throw new Error('Mitra industri wajib dipilih.');
    if (!data.phone?.trim()) throw new Error('Nomor telepon pembimbing industri wajib diisi.');

    const isEdit = Boolean(data.id);
    let saved: IndustrySupervisor;

    if (isEdit) {
      const old = this.industrySupervisors.find(i => i.id === data.id);
      saved = {
        ...(old || {}),
        ...data,
        updated_at: new Date().toISOString(),
      } as IndustrySupervisor;
      this.industrySupervisors = this.industrySupervisors.map(i => (i.id === data.id ? saved : i));
      await this.logAudit('UPDATE', 'industry_supervisors', saved.id, user.name, user.email, old, saved);
    } else {
      saved = {
        id: 'ind-sup-' + Date.now(),
        partner_id: data.partner_id!,
        name: data.name!.trim(),
        position: data.position?.trim() || 'Pembimbing DU/DI',
        phone: data.phone!.trim(),
        email: data.email?.trim() || '',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.industrySupervisors.unshift(saved);
      await this.logAudit('INSERT', 'industry_supervisors', saved.id, user.name, user.email, null, saved);
    }

    setStorage('industry_supervisors', this.industrySupervisors);
    return saved;
  }

  // --------------------------------------------------------------------------
  // SCHOOL SUPERVISORS
  // --------------------------------------------------------------------------
  public async getSchoolSupervisors(): Promise<SchoolSupervisor[]> {
    return this.supervisors
      .filter(s => !s.is_archived)
      .map(sup => ({
        ...sup,
        department: this.departments.find(d => d.id === sup.department_id),
      }));
  }

  public async saveSchoolSupervisor(data: Partial<SchoolSupervisor>, user: { name: string; email: string }): Promise<SchoolSupervisor> {
    if (!data.name?.trim()) throw new Error('Nama pembimbing sekolah wajib diisi.');
    if (!data.phone?.trim()) throw new Error('Nomor kontak pembimbing wajib diisi.');

    const isEdit = Boolean(data.id);
    let saved: SchoolSupervisor;

    if (isEdit) {
      const old = this.supervisors.find(s => s.id === data.id);
      saved = {
        ...(old || {}),
        ...data,
        updated_at: new Date().toISOString(),
      } as SchoolSupervisor;
      this.supervisors = this.supervisors.map(s => (s.id === data.id ? saved : s));
      await this.logAudit('UPDATE', 'school_supervisors', saved.id, user.name, user.email, old, saved);
    } else {
      saved = {
        id: 'sup-' + Date.now(),
        nip: data.nip?.trim() || '',
        name: data.name!.trim(),
        department_id: data.department_id,
        phone: data.phone!.trim(),
        email: data.email?.trim() || '',
        is_active: true,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.supervisors.unshift(saved);
      await this.logAudit('INSERT', 'school_supervisors', saved.id, user.name, user.email, null, saved);
    }

    setStorage('supervisors', this.supervisors);
    return saved;
  }

  // --------------------------------------------------------------------------
  // PLACEMENTS (Strict Business Rules Enforced)
  // --------------------------------------------------------------------------
  public async getPlacements(options?: {
    periodId?: string;
    status?: string;
    search?: string;
    departmentId?: string;
    classId?: string;
    partnerId?: string;
    supervisorId?: string;
  }): Promise<Placement[]> {
    this.refreshComputedStatuses();
    let list = this.placements.filter(p => !p.is_archived);

    if (options?.periodId) {
      list = list.filter(p => p.period_id === options.periodId);
    }
    if (options?.status) {
      list = list.filter(p => p.status === options.status);
    }
    if (options?.partnerId) {
      list = list.filter(p => p.partner_id === options.partnerId);
    }
    if (options?.supervisorId) {
      list = list.filter(p => p.school_supervisor_id === options.supervisorId);
    }

    // Map relations
    let result = list.map(p => {
      const student = this.students.find(s => s.id === p.student_id);
      const studentWithClass = student
        ? {
            ...student,
            class: this.classes.find(c => c.id === student.class_id),
            department: this.departments.find(d => d.id === student.department_id),
          }
        : undefined;

      return {
        ...p,
        student: studentWithClass,
        partner: this.partners.find(part => part.id === p.partner_id),
        school_supervisor: this.supervisors.find(sup => sup.id === p.school_supervisor_id),
        industry_supervisor: this.industrySupervisors.find(ind => ind.id === p.industry_supervisor_id),
        period: this.periods.find(per => per.id === p.period_id),
      };
    });

    if (options?.departmentId) {
      result = result.filter(p => p.student?.department_id === options.departmentId);
    }
    if (options?.classId) {
      result = result.filter(p => p.student?.class_id === options.classId);
    }
    if (options?.search) {
      const q = options.search.toLowerCase().trim();
      result = result.filter(
        p => (p.student?.full_name.toLowerCase().includes(q) || false) ||
             (p.student?.nisn.includes(q) || false) ||
             (p.partner?.company_name.toLowerCase().includes(q) || false)
      );
    }

    return result.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  public async getPlacementById(id: string): Promise<Placement | null> {
    const p = this.placements.find(item => item.id === id);
    if (!p) return null;
    const student = this.students.find(s => s.id === p.student_id);
    return {
      ...p,
      student: student
        ? {
            ...student,
            class: this.classes.find(c => c.id === student.class_id),
            department: this.departments.find(d => d.id === student.department_id),
          }
        : undefined,
      partner: this.partners.find(part => part.id === p.partner_id),
      school_supervisor: this.supervisors.find(sup => sup.id === p.school_supervisor_id),
      industry_supervisor: this.industrySupervisors.find(ind => ind.id === p.industry_supervisor_id),
      period: this.periods.find(per => per.id === p.period_id),
    };
  }

  public async savePlacement(data: Partial<Placement>, user: { name: string; email: string }): Promise<Placement> {
    if (!data.student_id) throw new Error('Siswa wajib dipilih.');
    if (!data.period_id) throw new Error('Periode PKL wajib dipilih.');
    if (!data.partner_id) throw new Error('Mitra PKL wajib dipilih.');
    if (!data.school_supervisor_id) throw new Error('Pembimbing sekolah wajib dipilih.');
    if (!data.start_date) throw new Error('Tanggal penempatan wajib diisi.');
    if (!data.planned_withdrawal_date) throw new Error('Rencana penarikan wajib diisi.');

    // 1. Date order check
    const dateErr = validateDates(data.start_date, data.planned_withdrawal_date, data.actual_withdrawal_date);
    if (dateErr) throw new Error(dateErr.message);

    // 2. Industry supervisor must belong to chosen partner
    if (data.industry_supervisor_id) {
      const indSup = this.industrySupervisors.find(i => i.id === data.industry_supervisor_id);
      if (indSup && indSup.partner_id !== data.partner_id) {
        throw new Error('Pembimbing industri yang dipilih tidak sesuai dengan mitra terpilih.');
      }
    }

    // 3. Overlap check for student
    const newEndDate = data.actual_withdrawal_date || data.planned_withdrawal_date;
    const overlapErr = validatePlacementOverlap(
      data.student_id,
      data.start_date,
      newEndDate,
      this.placements.map(p => ({
        ...p,
        partner: this.partners.find(part => part.id === p.partner_id),
      })),
      data.id
    );
    if (overlapErr) throw new Error(overlapErr.message);

    // 4. Partner Quota check
    const partner = this.partners.find(p => p.id === data.partner_id);
    if (!partner) throw new Error('Data mitra tidak ditemukan.');

    const quotaErr = validatePartnerQuota(
      data.partner_id,
      data.period_id,
      partner,
      partner.default_quota,
      this.placements,
      data.id
    );
    if (quotaErr) throw new Error(quotaErr.message);

    // 5. Completion validation
    if (data.status === 'selesai') {
      const compErr = validateCompletion('selesai', data.actual_withdrawal_date);
      if (compErr) throw new Error(compErr.message);
    }

    // Determine initial status based on date if not explicitly set to selesai/dibatalkan
    const today = new Date().toISOString().split('T')[0];
    let computedStatus = data.status || 'terjadwal';
    if (data.status !== 'selesai' && data.status !== 'dibatalkan') {
      if (data.actual_withdrawal_date) {
        computedStatus = 'selesai';
      } else if (today < data.start_date) {
        computedStatus = 'terjadwal';
      } else if (today > data.planned_withdrawal_date) {
        computedStatus = 'menunggu_penarikan';
      } else {
        computedStatus = 'berlangsung';
      }
    }

    const isEdit = Boolean(data.id);
    let saved: Placement;

    if (isEdit) {
      const old = this.placements.find(p => p.id === data.id);
      saved = {
        ...(old || {}),
        ...data,
        status: computedStatus,
        updated_at: new Date().toISOString(),
      } as Placement;
      this.placements = this.placements.map(p => (p.id === data.id ? saved : p));
      await this.logAudit('UPDATE', 'placements', saved.id, user.name, user.email, old, saved);
    } else {
      saved = {
        id: 'plc-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
        student_id: data.student_id!,
        period_id: data.period_id!,
        partner_id: data.partner_id!,
        school_supervisor_id: data.school_supervisor_id!,
        industry_supervisor_id: data.industry_supervisor_id,
        start_date: data.start_date!,
        planned_withdrawal_date: data.planned_withdrawal_date!,
        actual_withdrawal_date: data.actual_withdrawal_date,
        status: computedStatus,
        notes: data.notes?.trim() || '',
        withdrawal_notes: data.withdrawal_notes?.trim() || '',
        final_score: data.final_score,
        is_archived: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.placements.unshift(saved);
      await this.logAudit('INSERT', 'placements', saved.id, user.name, user.email, null, saved);
    }

    setStorage('placements', this.placements);
    return saved;
  }

  public async deletePlacement(id: string, user: { name: string; email: string }): Promise<void> {
    const old = this.placements.find(p => p.id === id);
    if (!old) throw new Error('Data penempatan tidak ditemukan.');

    this.placements = this.placements.filter(p => p.id !== id);
    this.monitoring = this.monitoring.filter(m => m.placement_id !== id);
    setStorage('placements', this.placements);
    setStorage('monitoring', this.monitoring);
    await this.logAudit('DELETE', 'placements', id, user.name, user.email, old, null);
  }

  public async clearAllPlacements(user: { name: string; email: string }): Promise<void> {
    const count = this.placements.length;
    this.placements = [];
    this.monitoring = [];
    setStorage('placements', []);
    setStorage('monitoring', []);
    await this.logAudit('DELETE', 'placements', 'all', user.name, user.email, { deleted_count: count }, null);
  }

  /**
   * Finalize withdrawal (penarikan)
   */
  public async finalizeWithdrawal(
    placementId: string,
    actualDate: string,
    withdrawalNotes: string,
    finalScore: number | undefined,
    user: { name: string; email: string }
  ): Promise<Placement> {
    const placement = this.placements.find(p => p.id === placementId);
    if (!placement) throw new Error('Data penempatan tidak ditemukan.');

    if (!actualDate) {
      throw new Error('Realisasi tanggal penarikan wajib diisi.');
    }
    if (actualDate < placement.start_date) {
      throw new Error('Realisasi tanggal penarikan tidak boleh lebih awal dari tanggal penempatan.');
    }

    const oldValues = { ...placement };
    placement.actual_withdrawal_date = actualDate;
    placement.withdrawal_notes = withdrawalNotes;
    placement.status = 'selesai';
    if (finalScore !== undefined) placement.final_score = finalScore;
    placement.updated_at = new Date().toISOString();

    setStorage('placements', this.placements);
    await this.logAudit('STATUS_CHANGE', 'placements', placementId, user.name, user.email, oldValues, {
      status: 'selesai',
      actual_withdrawal_date: actualDate,
      withdrawal_notes: withdrawalNotes,
      final_score: finalScore,
    });

    return placement;
  }

  // --------------------------------------------------------------------------
  // MONITORING
  // --------------------------------------------------------------------------
  public async getMonitoringRecords(placementId?: string, supervisorId?: string): Promise<MonitoringRecord[]> {
    let list = this.monitoring;
    if (placementId) {
      list = list.filter(m => m.placement_id === placementId);
    }
    if (supervisorId) {
      list = list.filter(m => m.school_supervisor_id === supervisorId);
    }

    return list
      .map(m => {
        const placement = this.placements.find(p => p.id === m.placement_id);
        const student = placement ? this.students.find(s => s.id === placement.student_id) : undefined;
        const partner = placement ? this.partners.find(p => p.id === placement.partner_id) : undefined;

        return {
          ...m,
          school_supervisor: this.supervisors.find(sup => sup.id === m.school_supervisor_id),
          placement: placement
            ? {
                ...placement,
                student,
                partner,
              }
            : undefined,
        };
      })
      .sort((a, b) => b.visit_date.localeCompare(a.visit_date));
  }

  public async saveMonitoringRecord(data: Partial<MonitoringRecord>, user: { name: string; email: string }): Promise<MonitoringRecord> {
    if (!data.placement_id) throw new Error('Siswa penempatan PKL wajib dipilih.');
    if (!data.visit_date) throw new Error('Tanggal kunjungan monitoring wajib diisi.');
    if (!data.student_progress?.trim()) throw new Error('Catatan perkembangan siswa wajib diisi.');
    if (!data.follow_up?.trim()) throw new Error('Rencana tindak lanjut wajib diisi.');

    // Auto resolve school supervisor from placement if not explicitly set
    let supId = data.school_supervisor_id;
    if (!supId) {
      const plc = this.placements.find(p => p.id === data.placement_id);
      if (plc) supId = plc.school_supervisor_id;
    }
    if (!supId) supId = this.supervisors[0]?.id || 'sup-1';

    const isEdit = Boolean(data.id);
    let saved: MonitoringRecord;

    if (isEdit) {
      const old = this.monitoring.find(m => m.id === data.id);
      saved = {
        ...(old || {}),
        ...data,
        school_supervisor_id: supId,
        updated_at: new Date().toISOString(),
      } as MonitoringRecord;
      this.monitoring = this.monitoring.map(m => (m.id === data.id ? saved : m));
      await this.logAudit('UPDATE', 'monitoring_records', saved.id, user.name, user.email, old, saved);
    } else {
      saved = {
        id: 'mon-' + Date.now(),
        placement_id: data.placement_id!,
        school_supervisor_id: supId,
        visit_date: data.visit_date!,
        student_progress: data.student_progress!.trim(),
        obstacles: data.obstacles?.trim() || '',
        follow_up: data.follow_up!.trim(),
        attachment_url: data.attachment_url,
        attachment_name: data.attachment_name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      this.monitoring.unshift(saved);
      await this.logAudit('INSERT', 'monitoring_records', saved.id, user.name, user.email, null, saved);
    }

    setStorage('monitoring', this.monitoring);
    return saved;
  }

  // --------------------------------------------------------------------------
  // USER ACCOUNTS MANAGEMENT (ADMIN ONLY)
  // --------------------------------------------------------------------------
  public async getUsers(): Promise<{ profile: Profile; role: UserRoleRecord }[]> {
    return this.users;
  }

  public async saveUser(
    userData: { id?: string; full_name: string; email: string; phone?: string; role: UserRole },
    actor: { name: string; email: string }
  ): Promise<void> {
    if (!userData.full_name?.trim()) throw new Error('Nama pengguna wajib diisi.');
    if (!userData.email?.trim()) throw new Error('Email pengguna wajib diisi.');

    const isEdit = Boolean(userData.id);
    if (isEdit) {
      const userItem = this.users.find(u => u.profile.id === userData.id);
      if (!userItem) throw new Error('Pengguna tidak ditemukan.');

      userItem.profile.full_name = userData.full_name.trim();
      userItem.profile.email = userData.email.trim();
      userItem.profile.phone = userData.phone?.trim();
      userItem.profile.updated_at = new Date().toISOString();
      userItem.role.role = userData.role;

      await this.logAudit('UPDATE', 'profiles', userData.id!, actor.name, actor.email, null, userData);
    } else {
      // Uniqueness check for email
      if (this.users.some(u => u.profile.email.toLowerCase() === userData.email.toLowerCase())) {
        throw new Error('Email pengguna sudah terdaftar.');
      }

      const newId = 'usr-' + Date.now();
      const newUser = {
        profile: {
          id: newId,
          full_name: userData.full_name.trim(),
          email: userData.email.trim(),
          phone: userData.phone?.trim() || '',
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        role: {
          id: 'role-' + Date.now(),
          user_id: newId,
          role: userData.role,
          created_at: new Date().toISOString(),
        },
      };
      this.users.unshift(newUser);
      await this.logAudit('INSERT', 'profiles', newId, actor.name, actor.email, null, userData);
    }

    setStorage('users', this.users);
  }

  public async toggleUserActive(userId: string, actor: { name: string; email: string }): Promise<void> {
    const userItem = this.users.find(u => u.profile.id === userId);
    if (!userItem) throw new Error('Pengguna tidak ditemukan.');

    userItem.profile.is_active = !userItem.profile.is_active;
    userItem.profile.updated_at = new Date().toISOString();
    setStorage('users', this.users);
    await this.logAudit('UPDATE', 'profiles', userId, actor.name, actor.email, null, {
      is_active: userItem.profile.is_active,
    });
  }

  // --------------------------------------------------------------------------
  // AUDIT LOGS
  // --------------------------------------------------------------------------
  public async getAuditLogs(): Promise<AuditLog[]> {
    return this.auditLogs;
  }

  // --------------------------------------------------------------------------
  // STATS & DASHBOARD DATA
  // --------------------------------------------------------------------------
  public async getDashboardStats(periodId?: string) {
    this.refreshComputedStatuses();
    const activePeriod = periodId
      ? this.periods.find(p => p.id === periodId)
      : this.periods.find(p => p.is_active) || this.periods[0];

    const currentPlacements = this.placements.filter(
      p => (!activePeriod || p.period_id === activePeriod.id) && !p.is_archived
    );

    const totalStudents = this.students.filter(s => !s.is_archived).length;
    const placedStudents = currentPlacements.filter(p => p.status !== 'dibatalkan').length;
    const activePlacements = currentPlacements.filter(p => p.status === 'berlangsung').length;
    const waitingWithdrawal = currentPlacements.filter(p => p.status === 'menunggu_penarikan').length;
    const completedPlacements = currentPlacements.filter(p => p.status === 'selesai').length;
    const totalPartners = this.partners.filter(p => !p.is_archived).length;

    // Upcoming 7 days schedule
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);

    const todayStr = today.toISOString().split('T')[0];
    const sevenDaysLaterStr = sevenDaysLater.toISOString().split('T')[0];

    const upcomingStart = currentPlacements
      .filter(p => p.start_date >= todayStr && p.start_date <= sevenDaysLaterStr)
      .map(p => ({
        type: 'start' as const,
        date: p.start_date,
        student: this.students.find(s => s.id === p.student_id)?.full_name || 'Siswa',
        partner: this.partners.find(part => part.id === p.partner_id)?.company_name || 'Mitra',
        placementId: p.id,
      }));

    const upcomingWithdrawal = currentPlacements
      .filter(p => p.planned_withdrawal_date >= todayStr && p.planned_withdrawal_date <= sevenDaysLaterStr && p.status !== 'selesai')
      .map(p => ({
        type: 'withdrawal' as const,
        date: p.planned_withdrawal_date,
        student: this.students.find(s => s.id === p.student_id)?.full_name || 'Siswa',
        partner: this.partners.find(part => part.id === p.partner_id)?.company_name || 'Mitra',
        placementId: p.id,
      }));

    const upcomingVisits = this.monitoring
      .filter(m => m.visit_date >= todayStr && m.visit_date <= sevenDaysLaterStr)
      .map(m => {
        const plc = this.placements.find(p => p.id === m.placement_id);
        return {
          type: 'visit' as const,
          date: m.visit_date,
          student: plc ? this.students.find(s => s.id === plc.student_id)?.full_name || 'Siswa' : 'Siswa',
          partner: plc ? this.partners.find(part => part.id === plc.partner_id)?.company_name || 'Mitra' : 'Mitra',
          placementId: m.placement_id,
        };
      });

    // Incomplete data alerts
    const incompleteStudents = this.students.filter(
      s => !s.is_archived && (!s.parent_phone || !s.student_phone || s.address === '-')
    );

    const unplacedStudents = this.students.filter(
      s => !s.is_archived && !currentPlacements.some(p => p.student_id === s.id && p.status !== 'dibatalkan')
    );

    const overdueWithdrawals = currentPlacements.filter(
      p => p.planned_withdrawal_date < todayStr && p.status !== 'selesai' && p.status !== 'dibatalkan'
    );

    // Distribution by department
    const deptDistribution = this.departments.map(d => {
      const count = this.students.filter(s => s.department_id === d.id && !s.is_archived).length;
      const placed = currentPlacements.filter(p => {
        const s = this.students.find(st => st.id === p.student_id);
        return s?.department_id === d.id && p.status !== 'dibatalkan';
      }).length;

      return {
        code: d.code,
        name: d.name,
        total: count,
        placed,
      };
    });

    return {
      activePeriod,
      totalStudents,
      placedStudents,
      activePlacements,
      waitingWithdrawal,
      completedPlacements,
      totalPartners,
      upcomingSchedule: [...upcomingStart, ...upcomingWithdrawal, ...upcomingVisits].sort((a, b) =>
        a.date.localeCompare(b.date)
      ),
      incompleteAlerts: {
        incompleteCount: incompleteStudents.length,
        unplacedCount: unplacedStudents.length,
        overdueWithdrawalCount: overdueWithdrawals.length,
      },
      deptDistribution,
    };
  }
}

export const dataService = new DataService();
