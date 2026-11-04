import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  Upload,
  Download,
  Eye,
  Edit2,
  Archive,
  RotateCcw,
  Trash2,
  Briefcase,
  AlertCircle,
  Phone,
} from 'lucide-react';
import { Student, ClassRoom, Department } from '../types/database';
import { dataService } from '../services/dataService';
import { exportStudentsCsv } from '../services/exportService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePeriod } from '../context/PeriodContext';
import { StudentFormModal } from '../components/students/StudentFormModal';
import { StudentDetailModal } from '../components/students/StudentDetailModal';
import { StudentImportModal } from '../components/students/StudentImportModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { Pagination } from '../components/common/Pagination';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { getPlacementStatusBadge } from '../utils/formatters';

export const StudentsPage: React.FC = () => {
  const { canEditOperations, role, user } = useAuth();
  const { success, error } = useToast();
  const { selectedPeriodId } = usePeriod();

  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Delete & Archive dialogs
  const [archiveTarget, setArchiveTarget] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [studentsData, classesData, deptData] = await Promise.all([
        dataService.getStudents({
          includeArchived: showArchived,
          periodId: selectedPeriodId,
        }),
        dataService.getClasses(),
        dataService.getDepartments(),
      ]);

      setStudents(studentsData);
      setClasses(classesData);
      setDepartments(deptData);
    } catch (err) {
      console.error('Failed to load students data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [showArchived, selectedPeriodId]);

  // Client-side filtering & pagination
  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      if (selectedDepartment && student.department_id !== selectedDepartment) {
        return false;
      }
      if (selectedClass && student.class_id !== selectedClass) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = student.full_name.toLowerCase().includes(q);
        const matchesNisn = student.nisn.includes(q);
        const matchesNis = student.nis.includes(q);
        if (!matchesName && !matchesNisn && !matchesNis) return false;
      }
      return true;
    });
  }, [students, selectedDepartment, selectedClass, searchQuery]);

  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredStudents.slice(start, start + itemsPerPage);
  }, [filteredStudents, currentPage, itemsPerPage]);

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      setActionLoading(true);
      await dataService.archiveStudent(archiveTarget.id, {
        name: user?.name || 'Petugas',
        email: user?.email || 'admin@simpkl.sch.id',
      });
      success('Siswa Diarsipkan', `${archiveTarget.full_name} berhasil dipindahkan ke arsip.`);
      setArchiveTarget(null);
      loadData();
    } catch (err: any) {
      error('Gagal Mengarsipkan', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRestore = async (student: Student) => {
    try {
      await dataService.restoreStudent(student.id, {
        name: user?.name || 'Petugas',
        email: user?.email || 'admin@simpkl.sch.id',
      });
      success('Siswa Dipulihkan', `${student.full_name} berhasil dikembalikan dari arsip.`);
      loadData();
    } catch (err: any) {
      error('Gagal Memulihkan Siswa', err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoading(true);
      await dataService.deleteStudent(deleteTarget.id, {
        name: user?.name || 'Petugas',
        email: user?.email || 'admin@simpkl.sch.id',
      });
      success('Siswa Dihapus', `Data siswa berhasil dihapus secara permanen.`);
      setDeleteTarget(null);
      loadData();
    } catch (err: any) {
      error('Pencegahan Integritas Data', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Users className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            Data Siswa Praktik Kerja Lapangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola data induk siswa, riwayat penempatan, kontak darurat, dan status keaktifan.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportStudentsCsv(filteredStudents)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-teal-600" />
            Ekspor CSV
          </button>

          {canEditOperations && (
            <>
              <button
                onClick={() => setIsImportOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4 text-teal-600" />
                Impor CSV
              </button>

              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setIsFormOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-md shadow-teal-600/30"
              >
                <Plus className="w-4 h-4" />
                Tambah Siswa
              </button>
            </>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama, NISN, atau NIS..."
            value={searchQuery}
            onChange={e => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* Department Filter */}
          <select
            value={selectedDepartment}
            onChange={e => {
              setSelectedDepartment(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Semua Jurusan</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>

          {/* Class Filter */}
          <select
            value={selectedClass}
            onChange={e => {
              setSelectedClass(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Semua Kelas</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Archived Toggle */}
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              showArchived
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-300 dark:border-amber-800'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            {showArchived ? 'Menampilkan Arsip' : 'Lihat Arsip'}
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner label="Memuat data siswa..." size="md" />
        ) : filteredStudents.length === 0 ? (
          <EmptyState
            icon={Users}
            title="Tidak Ada Siswa Ditemukan"
            description="Tidak ada data siswa yang cocok dengan kriteria pencarian atau filter yang dipilih."
            actionButton={
              canEditOperations
                ? {
                    label: 'Tambah Siswa Pertama',
                    onClick: () => {
                      setSelectedStudent(null);
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
                  <th className="px-4 py-3.5">Nama & NISN</th>
                  <th className="px-4 py-3.5">Kelas & Jurusan</th>
                  <th className="px-4 py-3.5">Status PKL</th>
                  <th className="px-4 py-3.5">Mitra Industri</th>
                  <th className="px-4 py-3.5">Kontak Ortu</th>
                  <th className="px-4 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginatedStudents.map(student => {
                  const plc = student.current_placement;
                  const badge = plc ? getPlacementStatusBadge(plc.status) : null;

                  return (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Name & NISN */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 font-bold flex items-center justify-center flex-shrink-0">
                            {student.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {student.full_name}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              NISN: {student.nisn} • NIS: {student.nis}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Class & Department */}
                      <td className="px-4 py-3.5">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {student.class?.name || '-'}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {student.department?.code || '-'}
                        </div>
                      </td>

                      {/* Status PKL */}
                      <td className="px-4 py-3.5">
                        {badge ? (
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            {badge.label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                            Belum Ditempatkan
                          </span>
                        )}
                      </td>

                      {/* Partner */}
                      <td className="px-4 py-3.5">
                        {plc?.partner ? (
                          <div>
                            <div className="font-semibold text-slate-800 dark:text-slate-200">
                              {plc.partner.company_name}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              Pembimbing: {plc.school_supervisor?.name?.split(' ')[0] || '-'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">-</span>
                        )}
                      </td>

                      {/* Parent Contact */}
                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                        <div>{student.parent_phone}</div>
                        {student.parent_name && (
                          <div className="text-[10px] text-slate-400">{student.parent_name}</div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail */}
                          <button
                            onClick={() => {
                              setSelectedStudent(student);
                              setIsDetailOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Lihat Detail Profil & Riwayat"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {canEditOperations && (
                            <>
                              {/* Edit */}
                              <button
                                onClick={() => {
                                  setSelectedStudent(student);
                                  setIsFormOpen(true);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Ubah Data"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              {/* Archive or Restore */}
                              {student.is_archived ? (
                                <button
                                  onClick={() => handleRestore(student)}
                                  className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                                  title="Pulihkan Siswa dari Arsip"
                                >
                                  <RotateCcw className="w-4 h-4" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => setArchiveTarget(student)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors"
                                  title="Arsipkan Siswa"
                                >
                                  <Archive className="w-4 h-4" />
                                </button>
                              )}

                              {/* Hard Delete only if no history */}
                              <button
                                onClick={() => setDeleteTarget(student)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Hapus Permanen"
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

        {/* Pagination Bar */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredStudents.length}
          itemsPerPage={itemsPerPage}
          onPageChange={page => setCurrentPage(page)}
        />
      </div>

      {/* Form Modal (Add / Edit) */}
      <StudentFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
        studentToEdit={selectedStudent}
        classes={classes}
        departments={departments}
        allStudents={students}
      />

      {/* Detail Modal */}
      <StudentDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        student={selectedStudent}
      />

      {/* CSV Import Modal */}
      <StudentImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onSuccess={loadData}
        existingStudents={students}
        classes={classes}
        departments={departments}
      />

      {/* Archive Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Konfirmasi Pengarsipan Siswa"
        message={`Apakah Anda yakin ingin mengarsipkan siswa "${archiveTarget?.full_name}"? Riwayat penempatan dan nilai akan tetap aman tersimpan.`}
        confirmLabel="Ya, Arsipkan"
        variant="warning"
        isLoading={actionLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Siswa Permanen"
        message={`Siswa "${deleteTarget?.full_name}" hanya dapat dihapus permanen jika belum pernah memiliki riwayat penempatan PKL. Lanjutkan penghapusan?`}
        confirmLabel="Hapus Permanen"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
};
