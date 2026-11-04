import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Filter,
  Download,
  Printer,
  Calendar,
  Building2,
  Users,
  Search,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import {
  Placement,
  InternshipPeriod,
  Department,
  ClassRoom,
  Partner,
  SchoolSupervisor,
  SchoolSettings,
} from '../types/database';
import { dataService } from '../services/dataService';
import { exportPlacementsCsv } from '../services/exportService';
import { useAuth } from '../context/AuthContext';
import { usePeriod } from '../context/PeriodContext';
import { PrintableLetterheadReport } from '../components/reports/PrintableLetterheadReport';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatDateIndo, getPlacementStatusBadge } from '../utils/formatters';

export const ReportsPage: React.FC = () => {
  const { role } = useAuth();
  const { selectedPeriodId, activePeriod } = usePeriod();

  const [placements, setPlacements] = useState<Placement[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [supervisors, setSupervisors] = useState<SchoolSupervisor[]>([]);
  const [schoolSettings, setSchoolSettings] = useState<SchoolSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [filterPeriod, setFilterPeriod] = useState(selectedPeriodId);
  const [filterDept, setFilterDept] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterPartner, setFilterPartner] = useState('');
  const [filterSupervisor, setFilterSupervisor] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // PDF / Print modal
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  useEffect(() => {
    setFilterPeriod(selectedPeriodId);
  }, [selectedPeriodId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [
        placementsData,
        deptData,
        classData,
        partnerData,
        supervisorData,
        settingsData,
      ] = await Promise.all([
        dataService.getPlacements({ periodId: filterPeriod }),
        dataService.getDepartments(),
        dataService.getClasses(),
        dataService.getPartners(),
        dataService.getSchoolSupervisors(),
        dataService.getSchoolSettings(),
      ]);

      setPlacements(placementsData);
      setDepartments(deptData);
      setClasses(classData);
      setPartners(partnerData);
      setSupervisors(supervisorData);
      setSchoolSettings(settingsData);
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterPeriod]);

  // Dynamic filtered results
  const filteredPlacements = useMemo(() => {
    return placements.filter(p => {
      if (filterDept && p.student?.department_id !== filterDept) return false;
      if (filterClass && p.student?.class_id !== filterClass) return false;
      if (filterPartner && p.partner_id !== filterPartner) return false;
      if (filterSupervisor && p.school_supervisor_id !== filterSupervisor) return false;
      if (filterStatus && p.status !== filterStatus) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const studentName = p.student?.full_name.toLowerCase() || '';
        const nisn = p.student?.nisn || '';
        const partnerName = p.partner?.company_name.toLowerCase() || '';
        if (!studentName.includes(q) && !nisn.includes(q) && !partnerName.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [
    placements,
    filterDept,
    filterClass,
    filterPartner,
    filterSupervisor,
    filterStatus,
    searchQuery,
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <FileText className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            Laporan & Rekapitulasi PKL
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Filter rekapitulasi berdasarkan jurusan, mitra, pembimbing, dan ekspor dokumen resmi ber-Kop Surat.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportPlacementsCsv(filteredPlacements, activePeriod?.name)}
            disabled={filteredPlacements.length === 0}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 disabled:opacity-50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-teal-600" />
            Ekspor Excel/CSV
          </button>

          <button
            onClick={() => setIsPrintModalOpen(true)}
            disabled={filteredPlacements.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-teal-600/30"
          >
            <Printer className="w-4 h-4" />
            Cetak PDF Kop Sekolah
          </button>
        </div>
      </div>

      {/* Security note on Backup vs Export */}
      <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 flex items-center gap-2.5 text-xs text-slate-600 dark:text-slate-300">
        <ShieldAlert className="w-4 h-4 text-teal-600 flex-shrink-0" />
        <p>
          <b>Catatan Keamanan Data:</b> Ekspor CSV/Excel ini adalah rekapan operasional data tabular. Untuk backup database PostgreSQL lengkap, gunakan fitur <b>Database Backup</b> pada menu Pengaturan.
        </p>
      </div>

      {/* Filter Matrix */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-slate-500">
          <Filter className="w-4 h-4 text-teal-600" />
          Parameter Filter Rekapitulasi
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 text-xs">
          {/* Search */}
          <div className="xl:col-span-2">
            <label className="block text-slate-500 mb-1 font-medium">Pencarian Siswa/Mitra</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Nama siswa, NISN, mitra..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Department */}
          <div>
            <label className="block text-slate-500 mb-1 font-medium">Program Keahlian</label>
            <select
              value={filterDept}
              onChange={e => setFilterDept(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Semua Jurusan</option>
              {departments.map(d => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Class */}
          <div>
            <label className="block text-slate-500 mb-1 font-medium">Kelas / Rombel</label>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Partner */}
          <div>
            <label className="block text-slate-500 mb-1 font-medium">Mitra DU/DI</label>
            <select
              value={filterPartner}
              onChange={e => setFilterPartner(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Semua Mitra</option>
              {partners.map(p => (
                <option key={p.id} value={p.id}>
                  {p.company_name}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-slate-500 mb-1 font-medium">Status PKL</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Semua Status</option>
              <option value="berlangsung">Sedang Berlangsung</option>
              <option value="terjadwal">Terjadwal</option>
              <option value="menunggu_penarikan">Menunggu Penarikan</option>
              <option value="selesai">Selesai & Ditarik</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400 px-2">
        <span>
          Menampilkan <span className="text-teal-600 dark:text-teal-400 font-bold">{filteredPlacements.length}</span> data penempatan sesuai filter
        </span>
      </div>

      {/* Table Results */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner label="Menyusun laporan rekap..." size="md" />
        ) : filteredPlacements.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="Tidak Ada Rekap Data Ditemukan"
            description="Tidak ada penempatan siswa yang sesuai dengan kombinasi filter yang diterapkan."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3 text-center w-10">No</th>
                  <th className="px-4 py-3">Nama Siswa & NISN</th>
                  <th className="px-4 py-3">Kelas / Jurusan</th>
                  <th className="px-4 py-3">Mitra Industri (DU/DI)</th>
                  <th className="px-4 py-3">Pembimbing Sekolah</th>
                  <th className="px-4 py-3">Rentang Tanggal</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPlacements.map((plc, idx) => {
                  const badge = getPlacementStatusBadge(plc.status);
                  return (
                    <tr
                      key={plc.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-center font-mono text-slate-400">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {plc.student?.full_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          NISN: {plc.student?.nisn}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {plc.student?.class?.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {plc.student?.department?.code}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {plc.partner?.company_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        {plc.school_supervisor?.name || '-'}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                        <div>Mulai: {formatDateIndo(plc.start_date)}</div>
                        <div>
                          Selesai:{' '}
                          {plc.actual_withdrawal_date
                            ? formatDateIndo(plc.actual_withdrawal_date)
                            : formatDateIndo(plc.planned_withdrawal_date)}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold text-teal-600 dark:text-teal-400">
                        {plc.final_score !== undefined && plc.final_score !== null ? plc.final_score : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Printable Report Modal */}
      {schoolSettings && (
        <PrintableLetterheadReport
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          placements={filteredPlacements}
          settings={schoolSettings}
          periodName={activePeriod?.name || 'Periode PKL'}
        />
      )}
    </div>
  );
};
