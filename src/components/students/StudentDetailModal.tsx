import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Student, Placement } from '../../types/database';
import { dataService } from '../../services/dataService';
import { formatDateIndo, formatWhatsAppUrl, getPlacementStatusBadge } from '../../utils/formatters';
import { MessageSquare, MapPin, User, Phone, Briefcase, Calendar, Award } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface StudentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student | null;
}

export const StudentDetailModal: React.FC<StudentDetailModalProps> = ({ isOpen, onClose, student }) => {
  const [history, setHistory] = useState<Placement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (student && isOpen) {
      setLoadingHistory(true);
      dataService
        .getStudentPlacementHistory(student.id)
        .then(data => setHistory(data))
        .finally(() => setLoadingHistory(false));
    }
  }, [student, isOpen]);

  if (!student) return null;

  const studentWa = formatWhatsAppUrl(student.student_phone);
  const parentWa = formatWhatsAppUrl(student.parent_phone);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Profil & Riwayat PKL Siswa"
      subtitle={`NISN: ${student.nisn} • ${student.class?.name || 'Kelas'}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Profile Header Card */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl font-extrabold shadow-md shadow-teal-600/20">
              {student.full_name.charAt(0)}
            </div>
            <div>
              <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                {student.full_name}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                NIS: {student.nis} • Jurusan: {student.department?.name || student.department_id}
              </p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300">
                  {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                </span>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {student.is_active ? 'Siswa Aktif' : 'Tidak Aktif'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick WA Contact Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {studentWa && (
              <a
                href={studentWa}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                WA Siswa
              </a>
            )}
            {parentWa && (
              <a
                href={parentWa}
                target="_blank"
                rel="noreferrer"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                WA Ortu
              </a>
            )}
          </div>
        </div>

        {/* Biodata Details */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Informasi Domisili & Pribadi
            </span>
            <div className="flex items-start gap-2 text-slate-700 dark:text-slate-300">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>{student.address || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>No. Siswa: {student.student_phone || '-'}</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Data Orang Tua / Wali
            </span>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>Nama: {student.parent_name || '-'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>No. Darurat Ortu: {student.parent_phone}</span>
            </div>
          </div>
        </div>

        {/* PKL Placement History Section */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Riwayat Penempatan Praktik Kerja Lapangan
          </h4>

          {loadingHistory ? (
            <LoadingSpinner label="Memuat riwayat penempatan..." size="sm" />
          ) : history.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 text-xs">
              Siswa belum pernah terdaftar dalam penempatan PKL manapun.
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(plc => {
                const badge = getPlacementStatusBadge(plc.status);
                return (
                  <div
                    key={plc.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {plc.partner?.company_name || 'Mitra DU/DI'}
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {plc.partner?.industry_sector} • {plc.partner?.address}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>
                          {formatDateIndo(plc.start_date)} s.d. {formatDateIndo(plc.planned_withdrawal_date)}
                        </span>
                      </div>
                      {plc.actual_withdrawal_date && (
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                          <Award className="w-3.5 h-3.5" />
                          <span>Ditarik: {formatDateIndo(plc.actual_withdrawal_date)} (Nilai: {plc.final_score ?? '-'})</span>
                        </div>
                      )}
                      <div>
                        <b>Pembimbing Sekolah:</b> {plc.school_supervisor?.name || '-'}
                      </div>
                      <div>
                        <b>Pembimbing DU/DI:</b> {plc.industry_supervisor?.name || '-'}
                      </div>
                    </div>

                    {plc.notes && (
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg mt-1">
                        Catatan: "{plc.notes}"
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
