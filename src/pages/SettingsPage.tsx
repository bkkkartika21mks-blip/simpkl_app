import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Calendar,
  Users,
  Database,
  Save,
  Plus,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
} from 'lucide-react';
import {
  SchoolSettings,
  AcademicYear,
  InternshipPeriod,
  Profile,
  UserRoleRecord,
  UserRole,
} from '../types/database';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Modal } from '../components/common/Modal';

export const SettingsPage: React.FC = () => {
  const { user, isAdmin, canManageUsers } = useAuth();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'school' | 'periods' | 'users' | 'backup'>('school');

  // School settings
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [schoolName, setSchoolName] = useState('');
  const [provinceName, setProvinceName] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [city, setCity] = useState('');
  const [npsn, setNpsn] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [headmasterName, setHeadmasterName] = useState('');
  const [headmasterNip, setHeadmasterNip] = useState('');
  const [letterheadTemplate, setLetterheadTemplate] = useState('');

  // Academic periods
  const [periods, setPeriods] = useState<InternshipPeriod[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);

  // Users management
  const [usersList, setUsersList] = useState<{ profile: Profile; role: UserRoleRecord }[]>([]);

  // Period Modal
  const [isPeriodModalOpen, setIsPeriodModalOpen] = useState(false);
  const [periodName, setPeriodName] = useState('');
  const [periodStartDate, setPeriodStartDate] = useState('');
  const [periodEndDate, setPeriodEndDate] = useState('');
  const [periodIsActive, setPeriodIsActive] = useState(false);
  const [selectedAyId, setSelectedAyId] = useState('');

  // User Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('operator');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [settingsData, periodsData, ayData, usersData] = await Promise.all([
        dataService.getSchoolSettings(),
        dataService.getPeriods(),
        dataService.getAcademicYears(),
        dataService.getUsers(),
      ]);

      setSettings(settingsData);
      setSchoolName(settingsData.school_name);
      setProvinceName(settingsData.province_name || 'PEMERINTAH PROVINSI SULAWESI SELATAN');
      setAgencyName(settingsData.agency_name || 'DINAS PENDIDIKAN');
      setCity(settingsData.city || 'Makassar');
      setNpsn(settingsData.npsn);
      setAddress(settingsData.address);
      setPhone(settingsData.phone || '');
      setEmail(settingsData.email || '');
      setWebsite(settingsData.website || '');
      setHeadmasterName(settingsData.headmaster_name);
      setHeadmasterNip(settingsData.headmaster_nip || '');
      setLetterheadTemplate(settingsData.letterhead_template || '');

      setPeriods(periodsData);
      setAcademicYears(ayData);
      setSelectedAyId(ayData[0]?.id || 'ay-1');
      setUsersList(usersData);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveSchoolSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await dataService.updateSchoolSettings(
        {
          school_name: schoolName.trim(),
          province_name: provinceName.trim(),
          agency_name: agencyName.trim(),
          city: city.trim(),
          npsn: npsn.trim(),
          address: address.trim(),
          phone: phone.trim(),
          email: email.trim(),
          website: website.trim(),
          headmaster_name: headmasterName.trim(),
          headmaster_nip: headmasterNip.trim(),
          letterhead_template: letterheadTemplate.trim(),
        },
        { name: user?.name || 'Administrator', email: user?.email || 'admin@simpkl.sch.id' }
      );
      success('Pengaturan Disimpan', 'Identitas sekolah dan template kop surat berhasil diperbarui.');
    } catch (err: any) {
      error('Gagal Menyimpan Pengaturan', err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreatePeriod = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodName.trim() || !periodStartDate || !periodEndDate) {
      error('Validasi Gagal', 'Semua kolom periode wajib diisi.');
      return;
    }
    if (periodEndDate < periodStartDate) {
      error('Validasi Gagal', 'Tanggal selesai tidak boleh sebelum tanggal mulai.');
      return;
    }

    try {
      await dataService.savePeriod(
        {
          name: periodName.trim(),
          start_date: periodStartDate,
          end_date: periodEndDate,
          is_active: periodIsActive,
          academic_year_id: selectedAyId,
        },
        { name: user?.name || 'Administrator', email: user?.email || 'admin@simpkl.sch.id' }
      );
      success('Periode Dibuat', `Periode ${periodName} berhasil ditambahkan.`);
      setIsPeriodModalOpen(false);
      loadData();
    } catch (err: any) {
      error('Gagal Membuat Periode', err.message);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) {
      error('Validasi Gagal', 'Nama dan email wajib diisi.');
      return;
    }

    try {
      await dataService.saveUser(
        {
          full_name: userName.trim(),
          email: userEmail.trim(),
          phone: userPhone.trim(),
          role: userRole,
        },
        { name: user?.name || 'Administrator', email: user?.email || 'admin@simpkl.sch.id' }
      );
      success('Akun Dibuat', `Akun ${userName} (${userRole}) berhasil ditambahkan.`);
      setIsUserModalOpen(false);
      loadData();
    } catch (err: any) {
      error('Gagal Membuat Akun', err.message);
    }
  };

  const handleToggleUser = async (userId: string) => {
    try {
      await dataService.toggleUserActive(userId, {
        name: user?.name || 'Administrator',
        email: user?.email || 'admin@simpkl.sch.id',
      });
      success('Status Akun Berubah', 'Status keaktifan akun telah diperbarui.');
      loadData();
    } catch (err: any) {
      error('Gagal Mengubah Status', err.message);
    }
  };

  if (isLoading) {
    return <LoadingSpinner label="Memuat pengaturan sistem..." size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
          <Settings className="w-7 h-7 text-teal-600 dark:text-teal-400" />
          Pengaturan Sistem SIMPKL
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Konfigurasi identitas sekolah, periode kegiatan PKL, manajemen akun petugas, dan panduan backup database.
        </p>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl text-xs font-semibold overflow-x-auto">
        <button
          onClick={() => setActiveTab('school')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'school'
              ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building className="w-4 h-4" />
          Identitas Sekolah
        </button>

        <button
          onClick={() => setActiveTab('periods')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'periods'
              ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          Tahun Ajaran & Periode PKL
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            Manajemen Akun Petugas ({usersList.length})
          </button>
        )}

        <button
          onClick={() => setActiveTab('backup')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all whitespace-nowrap ${
            activeTab === 'backup'
              ? 'bg-white dark:bg-slate-900 text-teal-600 dark:text-teal-400 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          Backup & Restore Database
        </button>
      </div>

      {/* Tab 1: School Identity Form */}
      {activeTab === 'school' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <form onSubmit={handleSaveSchoolSettings} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Pemerintah Daerah / Provinsi <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={provinceName}
                  onChange={e => setProvinceName(e.target.value)}
                  placeholder="PEMERINTAH PROVINSI SULAWESI SELATAN"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Instansi / Dinas Pendidikan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={e => setAgencyName(e.target.value)}
                  placeholder="DINAS PENDIDIKAN"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Kota / Kabupaten (Titi Mangsa) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  placeholder="Makassar"
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Nama Satuan Pendidikan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={e => setSchoolName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  NPSN (Nomor Pokok Sekolah Nasional) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={npsn}
                  onChange={e => setNpsn(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Alamat Lengkap Sekolah <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Nomor Telepon
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Email Resmi
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={e => setWebsite(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Nama Kepala Sekolah & Gelar <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={headmasterName}
                  onChange={e => setHeadmasterName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  NIP Kepala Sekolah
                </label>
                <input
                  type="text"
                  value={headmasterNip}
                  onChange={e => setHeadmasterNip(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
              </div>
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold transition-all shadow-md shadow-teal-600/30"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab 2: Periods & Academic Years */}
      {activeTab === 'periods' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              Daftar Periode Praktik Kerja Lapangan
            </h3>
            {isAdmin && (
              <button
                onClick={() => setIsPeriodModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Plus className="w-4 h-4" />
                Tambah Periode Baru
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {periods.map(p => (
              <div
                key={p.id}
                className={`p-5 rounded-2xl border transition-all ${
                  p.is_active
                    ? 'bg-teal-50/40 dark:bg-teal-950/30 border-teal-300 dark:border-teal-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-400">ID: {p.id}</span>
                  {p.is_active && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-600 text-white">
                      Periode Berjalan (Aktif)
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">{p.name}</h4>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
                  <div>Tanggal Mulai: <b>{p.start_date}</b></div>
                  <div>Tanggal Selesai: <b>{p.end_date}</b></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: User Accounts Management (Admin Only) */}
      {activeTab === 'users' && isAdmin && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Pengelolaan Akun & Hak Akses (RBAC)
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pendaftaran publik dinonaktifkan. Seluruh akun dibuat dan ditentukan perannya oleh Administrator.
              </p>
            </div>
            <button
              onClick={() => setIsUserModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Undang / Buat Akun
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3">Nama Petugas</th>
                  <th className="px-4 py-3">Email Pengguna</th>
                  <th className="px-4 py-3">Peran / Hak Akses</th>
                  <th className="px-4 py-3">Status Akun</th>
                  <th className="px-4 py-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {usersList.map(u => (
                  <tr key={u.profile.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                      {u.profile.full_name}
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono">
                      {u.profile.email}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800 capitalize">
                        {u.role.role.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          u.profile.is_active
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {u.profile.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleToggleUser(u.profile.id)}
                        className="text-xs font-semibold text-teal-600 hover:underline"
                      >
                        {u.profile.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Database Backup & Restore Guide */}
      {activeTab === 'backup' && (
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-1">
            <h4 className="font-bold flex items-center gap-1.5 text-sm">
              <Shield className="w-4 h-4 text-amber-600" />
              Peringatan Keamanan: Ekspor Spreadsheet Bukanlah Backup Database Lengkap!
            </h4>
            <p>
              Ekspor CSV/Excel hanya menyimpan data tabular dan mengabaikan constraint foreign key, triggers validasi aturan bisnis, data histori audit trail, user credentials, serta kebijakan RLS. Selalu lakukan backup PostgreSQL native (<code>pg_dump</code>) untuk keperluan disaster recovery yang valid.
            </p>
          </div>

          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300">
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
              1. Cara Backup Database PostgreSQL (pg_dump)
            </h4>
            <p>Jalankan perintah berikut di terminal server atau mesin lokal yang memiliki akses PostgreSQL:</p>
            <div className="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto">
              <code>pg_dump -h db.xyz.supabase.co -U postgres -d postgres -F c -b -v -f "simpkl_backup_$(date +%Y%m%d).dump"</code>
            </div>

            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 pt-2">
              2. Cara Restore Database (pg_restore)
            </h4>
            <p>Untuk mengembalikan data dari file dump ke database target:</p>
            <div className="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto">
              <code>pg_restore -h db.xyz.supabase.co -U postgres -d postgres -v --clean "simpkl_backup_20261102.dump"</code>
            </div>

            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 pt-2">
              3. Backup Otomatis Supabase Cloud
            </h4>
            <p>
              Jika menggunakan Supabase Pro / Team tier, backup harian otomatis telah tersedia langsung di menu <b>Project Settings &gt; Database &gt; Backups</b> dengan point-in-time recovery (PITR).
            </p>
          </div>
        </div>
      )}

      {/* Create Period Modal */}
      <Modal
        isOpen={isPeriodModalOpen}
        onClose={() => setIsPeriodModalOpen(false)}
        title="Tambah Periode PKL Baru"
        maxWidth="md"
      >
        <form onSubmit={handleCreatePeriod} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Tahun Ajaran
            </label>
            <select
              value={selectedAyId}
              onChange={e => setSelectedAyId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              {academicYears.map(ay => (
                <option key={ay.id} value={ay.id}>
                  {ay.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Nama Periode PKL <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={periodName}
              onChange={e => setPeriodName(e.target.value)}
              placeholder="Contoh: PKL Semester Ganjil 2025/2026"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Mulai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={periodStartDate}
                onChange={e => setPeriodStartDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Tanggal Selesai <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={periodEndDate}
                onChange={e => setPeriodEndDate(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={periodIsActive}
                onChange={e => setPeriodIsActive(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Jadikan Periode Aktif Saat Ini
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsPeriodModalOpen(false)}
              className="px-4 py-2 text-xs font-medium border rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl"
            >
              Simpan Periode
            </button>
          </div>
        </form>
      </Modal>

      {/* Create User Modal */}
      <Modal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        title="Buat Akun Petugas Baru"
        maxWidth="md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Nama Petugas <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={userName}
              onChange={e => setUserName(e.target.value)}
              placeholder="Contoh: Dra. Hj. Nur Aini"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Email Petugas <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={userEmail}
              onChange={e => setUserEmail(e.target.value)}
              placeholder="petugas@smkn1surabaya.sch.id"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Peran Akun (Role RBAC) <span className="text-rose-500">*</span>
            </label>
            <select
              value={userRole}
              onChange={e => setUserRole(e.target.value as UserRole)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="operator">Operator PKL (Kelola operasional)</option>
              <option value="school_supervisor">Pembimbing Sekolah (Isi monitoring bimbingan)</option>
              <option value="headmaster">Kepala Sekolah (Melihat dashboard & laporan)</option>
              <option value="admin">Administrator (Akses penuh)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsUserModalOpen(false)}
              className="px-4 py-2 text-xs font-medium border rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold rounded-xl"
            >
              Buat Akun
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
