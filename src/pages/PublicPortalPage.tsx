import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Search,
  Building2,
  Calendar,
  UserCheck,
  CheckCircle,
  Clock,
  MapPin,
  ExternalLink,
  Phone,
  Mail,
  Shield,
  ArrowRight,
  Sun,
  Moon,
  Info,
  Layers,
  ChevronRight,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Partner, SchoolSettings, InternshipPeriod } from '../types/database';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { formatDateIndo, getPlacementStatusBadge } from '../utils/formatters';

interface PublicPortalPageProps {
  onBackToDashboard?: () => void;
  onOpenLogin: () => void;
}

export const PublicPortalPage: React.FC<PublicPortalPageProps> = ({
  onBackToDashboard,
  onOpenLogin,
}) => {
  const { isAuthenticated, user, role } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [activePeriod, setActivePeriod] = useState<InternshipPeriod | null>(null);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search State for Student PKL Verification
  const [searchNisn, setSearchNisn] = useState('');
  const [searchHasRun, setSearchHasRun] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Partner filter
  const [partnerFilter, setPartnerFilter] = useState('');
  const [partnerSector, setPartnerSector] = useState('');

  useEffect(() => {
    const loadPublicData = async () => {
      try {
        setIsLoading(true);
        const [settingsData, periodsData, partnersData] = await Promise.all([
          dataService.getSchoolSettings(),
          dataService.getPeriods(),
          dataService.getPartners(),
        ]);
        setSettings(settingsData);
        const currentActive = periodsData.find(p => p.is_active) || periodsData[0];
        setActivePeriod(currentActive);
        setPartners(partnersData);
      } catch (err) {
        console.error('Failed to load public portal data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadPublicData();
  }, []);

  const handleSearchStudent = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchNisn.trim()) return;

    try {
      setIsSearching(true);
      setSearchHasRun(true);
      const results = await dataService.searchPublicStudentStatus(searchNisn);
      setSearchResults(results);
    } catch (err) {
      console.error('Public search failed:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const filteredPartners = partners.filter(p => {
    if (partnerFilter) {
      const q = partnerFilter.toLowerCase();
      if (!p.company_name.toLowerCase().includes(q) && !p.address.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (partnerSector && p.industry_sector !== partnerSector) {
      return false;
    }
    return true;
  });

  const uniqueSectors = Array.from(new Set(partners.map(p => p.industry_sector))).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Top Banner if user is logged in as staff */}
      {isAuthenticated && (
        <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-slate-900 text-white px-4 py-2.5 text-xs font-medium sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                <b>Pratinjau Mode Publik:</b> Anda sedang melihat portal publik sebagai{' '}
                <span className="underline font-bold capitalize">{user?.name || role}</span>.
              </span>
            </div>
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white font-bold rounded-lg transition-colors text-[11px]"
              >
                ← Kembali ke Dashboard Internal
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Public Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & School Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-base tracking-tight">
                  SIMPKL
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                  PORTAL PUBLIK
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                {settings?.school_name || 'SMK Negeri 2 Makassar'} • {settings?.agency_name || 'Dinas Pendidikan Sulawesi Selatan'}
              </p>
            </div>
          </div>

          {/* Nav links on desktop */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-slate-300">
            <a href="#cek-status" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              Cek Status Siswa
            </a>
            <a href="#mitra-industri" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              Mitra DU/DI
            </a>
            <a href="#alur-pkl" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              Alur & Panduan
            </a>
            <a href="#kontak" className="hover:text-teal-600 dark:hover:text-teal-400 transition-colors">
              Kontak Sekolah
            </a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Ganti Tema Terang/Gelap"
              aria-label="Ganti mode tema"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {isAuthenticated && onBackToDashboard ? (
              <button
                onClick={onBackToDashboard}
                className="px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-sm"
              >
                Panel Petugas
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs transition-colors shadow-sm"
              >
                <span>Masuk Petugas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-850 to-slate-900 text-white py-16 sm:py-20 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(#0D9488_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-semibold">
            <span>PEMERINTAH PROVINSI SULAWESI SELATAN • DINAS PENDIDIKAN</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Portal Informasi & Layanan PKL <br />
            <span className="text-teal-400">{settings?.school_name || 'SMK Negeri 2 Makassar'}</span>
          </h1>

          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            Layanan transparansi Praktik Kerja Lapangan (PKL) bagi siswa, orang tua, dan masyarakat. Verifikasi status penempatan siswa secara mandiri dan jelajahi mitra dunia usaha/dunia industri (DU/DI).
          </p>

          {/* Quick Action Search Bar directly inside Hero */}
          <div className="pt-4 max-w-2xl mx-auto">
            <form onSubmit={handleSearchStudent} className="flex flex-col sm:flex-row items-center gap-2 p-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl">
              <div className="relative flex-1 w-full">
                <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchNisn}
                  onChange={e => setSearchNisn(e.target.value)}
                  placeholder="Ketik 10 Digit NISN atau Nama Siswa..."
                  className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-900/80 text-white placeholder-slate-400 text-xs sm:text-sm border border-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-400"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-all shadow-lg shadow-teal-500/30 flex items-center justify-center gap-2 flex-shrink-0"
              >
                <span>{isSearching ? 'Memeriksa...' : 'Cek Status PKL'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-center gap-2 mt-3 text-[11px] text-slate-400">
              <span>Contoh pencarian NISN:</span>
              <button
                type="button"
                onClick={() => {
                  setSearchNisn('0061234567');
                  dataService.searchPublicStudentStatus('0061234567').then(res => {
                    setSearchHasRun(true);
                    setSearchResults(res);
                  });
                }}
                className="underline hover:text-teal-300 font-mono"
              >
                0061234567
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  setSearchNisn('0062345678');
                  dataService.searchPublicStudentStatus('0062345678').then(res => {
                    setSearchHasRun(true);
                    setSearchResults(res);
                  });
                }}
                className="underline hover:text-teal-300 font-mono"
              >
                0062345678
              </button>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-16">
        {/* =========================================================================
            SECTION 1: HASIL PENCARIAN & VERIFIKASI STATUS SISWA
            ========================================================================= */}
        <section id="cek-status" className="scroll-mt-24 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                Verifikasi Status Penempatan PKL Siswa
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Gunakan fitur ini untuk memeriksa apakah siswa telah ditempatkan, lokasi mitra DU/DI, serta guru pembimbingnya.
              </p>
            </div>
            {activePeriod && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 self-start sm:self-auto">
                Periode Aktif: <b>{activePeriod.name}</b>
              </span>
            )}
          </div>

          {/* Search Result Box */}
          {searchHasRun && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  Hasil pencarian untuk kata kunci: <b className="text-teal-600 dark:text-teal-400">"{searchNisn}"</b>
                </span>
                <span>{searchResults.length} siswa ditemukan</span>
              </div>

              {searchResults.length === 0 ? (
                <div className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center mx-auto">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                    Data Siswa Tidak Ditemukan
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Pastikan NISN atau nama siswa yang dimasukkan sudah sesuai dengan data resmi sekolah. Jika baru mendaftar atau terdapat kendala data, silakan koordinasi dengan Pokja PKL sekolah.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {searchResults.map(item => {
                    const plc = item.placement;
                    const badge = plc ? getPlacementStatusBadge(plc.status) : null;

                    return (
                      <div
                        key={item.id}
                        className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 hover:border-teal-500 transition-all"
                      >
                        {/* Student Biodata */}
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                              NISN: {item.nisn}
                            </span>
                            <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                              {item.full_name}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {item.class_name} • {item.department_name}
                            </p>
                          </div>

                          {badge ? (
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold ${badge.bg}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              {badge.label}
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                              Belum Ditempatkan
                            </span>
                          )}
                        </div>

                        {/* Placement Details if Available */}
                        {plc ? (
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-slate-100 dark:border-slate-800 space-y-2.5 text-xs">
                            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                              <Building2 className="w-4 h-4 text-teal-600" />
                              <span>{plc.partner_name}</span>
                            </div>
                            <div className="text-slate-500 dark:text-slate-400 text-[11px]">
                              {plc.industry_sector} • {plc.partner_address}
                            </div>

                            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-[10px] text-slate-400 block font-medium">Pembimbing Sekolah</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{plc.school_supervisor}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block font-medium">Masa PKL</span>
                                <span className="font-semibold text-slate-800 dark:text-slate-200">
                                  {formatDateIndo(plc.start_date)} s.d. {formatDateIndo(plc.planned_withdrawal_date)}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-850/60 text-xs text-slate-500 border border-slate-100 dark:border-slate-800">
                            Siswa terdaftar aktif di SIMPKL dan belum memiliki penugasan penempatan mitra industri pada periode berjalan.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>

        {/* =========================================================================
            SECTION 2: DIREKTORI MITRA INDUSTRI (DU/DI) & KUOTA
            ========================================================================= */}
        <section id="mitra-industri" className="scroll-mt-24 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                Mitra Industri & Ketersediaan Kuota
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Kemitraan resmi SMK Negeri 2 Makassar dengan perusahaan dan instansi bereputasi.
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="text"
                placeholder="Cari nama mitra / kota..."
                value={partnerFilter}
                onChange={e => setPartnerFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />

              <select
                value={partnerSector}
                onChange={e => setPartnerSector(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Semua Bidang Usaha</option>
                {uniqueSectors.map(sec => (
                  <option key={sec} value={sec}>
                    {sec}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPartners.map(partner => {
              const assigned = partner.assigned_count || 0;
              const quota = partner.default_quota || 0;
              const remaining = Math.max(0, quota - assigned);
              const isFull = remaining === 0;

              return (
                <div
                  key={partner.id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between hover:border-teal-500/50 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800">
                        {partner.industry_sector}
                      </span>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isFull
                            ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                            : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                        }`}
                      >
                        {isFull ? 'Kuota Penuh' : `Sisa ${remaining} Kuota`}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {partner.company_name}
                    </h3>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {partner.address}
                    </p>

                    <div className="text-xs text-slate-600 dark:text-slate-300 pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Pimpinan / PIC:</span>
                        <span className="font-semibold">{partner.person_in_charge}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Kapasitas Kuota:</span>
                        <span className="font-semibold">{quota} Siswa</span>
                      </div>
                    </div>
                  </div>

                  {partner.google_maps_url && (
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                      <a
                        href={partner.google_maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>Lihat Lokasi di Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================================================================
            SECTION 3: ALUR & PROSEDUR PELAKSANAAN PKL
            ========================================================================= */}
        <section id="alur-pkl" className="scroll-mt-24 space-y-6">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              Alur & Prosedur Pelaksanaan PKL
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Tahapan resmi yang dilalui siswa mulai dari persiapan hingga sertifikasi kelulusan PKL.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-extrabold text-sm flex items-center justify-center">
                1
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Pembekalan & Pendaftaran
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Siswa mengikuti pengarahan budaya industri, K3LH, dan memilih mitra DU/DI sesuai kompetensi keahlian.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-extrabold text-sm flex items-center justify-center">
                2
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Penetapan & Surat Tugas
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sekolah menerbitkan surat tugas resmi, penetapan guru pembimbing, dan serah terima siswa ke pihak perusahaan.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-extrabold text-sm flex items-center justify-center">
                3
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Praktik & Monitoring
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pelaksanaan kerja nyata di DU/DI dengan pemantauan berkala oleh guru pembimbing dan bimbingan mentor industri.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
              <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-extrabold text-sm flex items-center justify-center">
                4
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-white text-sm">
                Penarikan & Sertifikasi
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Penjemputan resmi siswa, evaluasi nilai akhir industri, penulisan laporan akhir, dan penerbitan sertifikat PKL.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================================
            SECTION 4: KONTAK & POKJA PKL SEKOLAH
            ========================================================================= */}
        <section id="kontak" className="scroll-mt-24 p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-teal-950 text-white space-y-6 shadow-xl border border-slate-800">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-2xl font-extrabold">Hubungi Pokja PKL Sekolah</h2>
            <p className="text-xs sm:text-sm text-slate-300">
              Pertanyaan mengenai penempatan, kendala lapangan, atau tawaran kerja sama kemitraan industri dapat disampaikan langsung ke pihak sekolah.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <MapPin className="w-5 h-5 text-teal-400 flex-shrink-0" />
              <div>
                <span className="font-bold block text-white">Alamat Kampus:</span>
                <span className="text-slate-300">{settings?.address || 'Jl. Pancasila, Makassar, Sulawesi Selatan'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <Phone className="w-5 h-5 text-teal-400 flex-shrink-0" />
              <div>
                <span className="font-bold block text-white">Telepon / Kontak:</span>
                <span className="text-slate-300">{settings?.phone || '(0411) 855-0123'}</span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
              <Mail className="w-5 h-5 text-teal-400 flex-shrink-0" />
              <div>
                <span className="font-bold block text-white">Email Resmi:</span>
                <span className="text-slate-300">{settings?.email || 'info@smkn2makassar.sch.id'}</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-8 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 space-y-2">
          <p className="font-semibold text-slate-700 dark:text-slate-300">
            {settings?.school_name || 'SMK Negeri 2 Makassar'} • {settings?.province_name || 'PEMERINTAH PROVINSI SULAWESI SELATAN'}
          </p>
          <p>
            SIMPKL — Sistem Informasi Pengelolaan Praktik Kerja Lapangan Terpadu • NPSN: {settings?.npsn || '20531234'}
          </p>
        </div>
      </footer>
    </div>
  );
};
