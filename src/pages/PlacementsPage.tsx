import React, { useState, useEffect, useMemo } from 'react';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  Download,
  Eye,
  Edit2,
  Calendar,
  Building2,
  User,
  CheckCircle,
  Clock,
  Ban,
  Trash2,
} from 'lucide-react';
import {
  Placement,
  Student,
  Partner,
  SchoolSupervisor,
  IndustrySupervisor,
  Department,
} from '../types/database';
import { dataService } from '../services/dataService';
import { exportPlacementsCsv } from '../services/exportService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePeriod } from '../context/PeriodContext';
import { PlacementFormModal } from '../components/placements/PlacementFormModal';
import { PlacementDetailModal } from '../components/placements/PlacementDetailModal';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Pagination } from '../components/common/Pagination';
import { formatDateIndo, getPlacementStatusBadge } from '../utils/formatters';

export const PlacementsPage: React.FC = () => {
  const { canEditOperations, isSupervisor, user } = useAuth();
  const { success, error } = useToast();
  const { selectedPeriodId, activePeriod, periods } = usePeriod();

  const [placements, setPlacements] = useState<Placement[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [schoolSupervisors, setSchoolSupervisors] = useState<SchoolSupervisor[]>([]);
  const [industrySupervisors, setIndustrySupervisors] = useState<IndustrySupervisor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [partnerFilter, setPartnerFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<Placement | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [
        placementsData,
        studentsData,
        partnersData,
        schoolSupData,
        indSupData,
        deptData,
      ] = await Promise.all([
        dataService.getPlacements({ periodId: selectedPeriodId }),
        dataService.getStudents(),
        dataService.getPartners(),
        dataService.getSchoolSupervisors(),
        dataService.getIndustrySupervisors(),
        dataService.getDepartments(),
      ]);

      setPlacements(placementsData);
      setStudents(studentsData);
      setPartners(partnersData);
      setSchoolSupervisors(schoolSupData);
      setIndustrySupervisors(indSupData);
      setDepartments(deptData);
    } catch (err) {
      console.error('Failed to load placements data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriodId]);

  const handleDeletePlacement = async (id: string, studentName: string) => {
    if (!window.confirm(`Yakin ingin menghapus data penempatan untuk "${studentName}"?`)) return;
    try {
      await dataService.deletePlacement(id, {
        name: user?.name || 'Petugas SIMPKL',
        email: user?.email || 'petugas@simpkl.sch.id',
      });
      success('Data penempatan berhasil dihapus.');
      loadData();
    } catch (err: any) {
      error(err.message || 'Gagal menghapus penempatan.');
    }
  };

  const handleClearAllPlacements = async () => {
    if (!window.confirm('PERINGATAN: Apakah Anda yakin ingin MENGHAPUS SEMUA data penempatan? Tindakan ini akan mengosongkan seluruh riwayat penempatan.')) return;
    try {
      await dataService.clearAllPlacements({
        name: user?.name || 'Petugas SIMPKL',
        email: user?.email || 'petugas@simpkl.sch.id',
      });
      success('Semua data penempatan berhasil dihapus.');
      loadData();
    } catch (err: any) {
      error(err.message || 'Gagal menghapus semua penempatan.');
    }
  };

  // Client filtering
  const filteredPlacements = useMemo(() => {
    return placements.filter(p => {
      // Pembimbing sekolah role restriction: can view placements where they are assigned supervisor
      if (isSupervisor && user?.supervisorId && p.school_supervisor_id !== user.supervisorId) {
        return false;
      }
      if (statusFilter && p.status !== statusFilter) return false;
      if (partnerFilter && p.partner_id !== partnerFilter) return false;
      if (deptFilter && p.student?.department_id !== deptFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesStudent = p.student?.full_name.toLowerCase().includes(q) || false;
        const matchesNisn = p.student?.nisn.includes(q) || false;
        const matchesPartner = p.partner?.company_name.toLowerCase().includes(q) || false;
        if (!matchesStudent && !matchesNisn && !matchesPartner) return false;
      }
      return true;
    });
  }, [placements, statusFilter, partnerFilter, deptFilter, searchQuery, isSupervisor, user]);

  const totalPages = Math.ceil(filteredPlacements.length / itemsPerPage);
  const paginatedPlacements = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredPlacements.slice(start, start + itemsPerPage);
  }, [filteredPlacements, currentPage, itemsPerPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Briefcase className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            Penempatan Praktik Kerja Lapangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Penetapan siswa ke mitra DU/DI dengan validasi kuota otomatis dan pencegahan jadwal bertumpang tindih.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportPlacementsCsv(filteredPlacements, activePeriod?.name)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-teal-600" />
            Ekspor Rekap
          </button>

          {canEditOperations && placements.length > 0 && (
            <button
              onClick={handleClearAllPlacements}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors shadow-sm"
              title="Hapus seluruh data penempatan"
            >
              <Trash2 className="w-4 h-4" />
              Hapus Semua
            </button>
          )}

          {canEditOperations && (
            <button
              onClick={() => {
                setSelectedPlacement(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-md shadow-teal-600/30"
            >
              <Plus className="w-4 h-4" />
              Buat Penempatan Baru
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari siswa, NISN, atau mitra..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Semua Status</option>
            <option value="berlangsung">Sedang Berlangsung</option>
            <option value="terjadwal">Terjadwal</option>
            <option value="menunggu_penarikan">Menunggu Penarikan</option>
            <option value="selesai">Selesai & Ditarik</option>
            <option value="dibatalkan">Dibatalkan</option>
          </select>

          {/* Partner Filter */}
          <select
            value={partnerFilter}
            onChange={e => {
              setPartnerFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Semua Mitra Industri</option>
            {partners.map(p => (
              <option key={p.id} value={p.id}>
                {p.company_name}
              </option>
            ))}
          </select>

          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={e => {
              setDeptFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Semua Jurusan</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner label="Memuat data penempatan siswa..." size="md" />
        ) : filteredPlacements.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title="Tidak Ada Penempatan Ditemukan"
            description="Belum ada penempatan yang cocok dengan kriteria filter pada periode ini."
            actionButton={
              canEditOperations
                ? {
                    label: 'Buat Penempatan Pertama',
                    onClick: () => {
                      setSelectedPlacement(null);
                      setIsFormOpen(true);
                    },
                  }
                : undefined
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Siswa & Kelas</th>
                  <th className="px-4 py-3.5">Mitra Industri (DU/DI)</th>
                  <th className="px-4 py-3.5">Jadwal PKL</th>
                  <th className="px-4 py-3.5">Guru Pembimbing</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedPlacements.map(plc => {
                  const badge = getPlacementStatusBadge(plc.status);

                  return (
                    <tr
                      key={plc.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Student */}
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-slate-900 dark:text-slate-100">
                          {plc.student?.full_name}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          NISN: {plc.student?.nisn} • {plc.student?.class?.name}
                        </div>
                      </td>

                      {/* Partner */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {plc.partner?.company_name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {plc.partner?.industry_sector}
                        </div>
                      </td>

                      {/* Dates */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-teal-600" />
                          <span>
                            {formatDateIndo(plc.start_date)} s.d. {formatDateIndo(plc.planned_withdrawal_date)}
                          </span>
                        </div>
                        {plc.actual_withdrawal_date && (
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
                            Ditarik: {formatDateIndo(plc.actual_withdrawal_date)}
                          </div>
                        )}
                      </td>

                      {/* Supervisor */}
                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                        <div className="font-medium">{plc.school_supervisor?.name || '-'}</div>
                        <div className="text-[10px] text-slate-400">
                          DU/DI: {plc.industry_supervisor?.name || '-'}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setSelectedPlacement(plc);
                              setIsDetailOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Lihat Detail Penempatan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEditOperations && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedPlacement(plc);
                                  setIsFormOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Ubah Penempatan"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePlacement(plc.id, plc.student?.full_name || 'Siswa')}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Hapus Penempatan"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredPlacements.length}
          itemsPerPage={itemsPerPage}
          onPageChange={page => setCurrentPage(page)}
        />
      </div>

      {/* Placement Form Modal */}
      <PlacementFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
        placementToEdit={selectedPlacement}
        students={students}
        partners={partners}
        schoolSupervisors={schoolSupervisors}
        industrySupervisors={industrySupervisors}
        periods={periods}
        existingPlacements={placements}
      />

      {/* Placement Detail Modal */}
      <PlacementDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        placement={selectedPlacement}
      />
    </div>
  );
};
