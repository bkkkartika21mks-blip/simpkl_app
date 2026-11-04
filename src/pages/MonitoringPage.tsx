import React, { useState, useEffect } from 'react';
import {
  ClipboardCheck,
  Plus,
  Calendar,
  Building2,
  User,
  Paperclip,
  ExternalLink,
  Edit2,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { MonitoringRecord, Placement, SchoolSupervisor } from '../types/database';
import { dataService } from '../services/dataService';
import { getTemporarySignedUrl } from '../services/storageService';
import { useAuth } from '../context/AuthContext';
import { usePeriod } from '../context/PeriodContext';
import { MonitoringFormModal } from '../components/monitoring/MonitoringFormModal';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatDateIndo } from '../utils/formatters';

export const MonitoringPage: React.FC = () => {
  const { canEditMonitoring, isSupervisor, user } = useAuth();
  const { selectedPeriodId } = usePeriod();

  const [records, setRecords] = useState<MonitoringRecord[]>([]);
  const [placements, setPlacements] = useState<Placement[]>([]);
  const [supervisors, setSupervisors] = useState<SchoolSupervisor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState('');

  // Form modal
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MonitoringRecord | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [recordsData, placementsData, supervisorsData] = await Promise.all([
        dataService.getMonitoringRecords(
          undefined,
          isSupervisor && user?.supervisorId ? user.supervisorId : undefined
        ),
        dataService.getPlacements({ periodId: selectedPeriodId }),
        dataService.getSchoolSupervisors(),
      ]);

      setRecords(recordsData);
      setPlacements(placementsData);
      setSupervisors(supervisorsData);
    } catch (err) {
      console.error('Failed to load monitoring records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriodId, isSupervisor, user]);

  const filteredRecords = records.filter(r => {
    if (selectedSupervisor && r.school_supervisor_id !== selectedSupervisor) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const studentName = r.placement?.student?.full_name.toLowerCase() || '';
      const partnerName = r.placement?.partner?.company_name.toLowerCase() || '';
      const supName = r.school_supervisor?.name.toLowerCase() || '';
      if (!studentName.includes(q) && !partnerName.includes(q) && !supName.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const handleOpenAttachment = async (path: string) => {
    const signedUrl = await getTemporarySignedUrl(path);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <ClipboardCheck className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            Monitoring Kunjungan PKL
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Catatan berkala perkembangan siswa di industri, kendala lapangan, tindak lanjut, dan berkas foto kunjungan.
          </p>
        </div>

        {canEditMonitoring && (
          <button
            onClick={() => {
              setSelectedRecord(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-md shadow-teal-600/30 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Catat Kunjungan Baru
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari siswa, mitra, atau pembimbing..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        {!isSupervisor && (
          <div className="w-full sm:w-auto">
            <select
              value={selectedSupervisor}
              onChange={e => setSelectedSupervisor(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Semua Guru Pembimbing</option>
              {supervisors.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Records Timeline List */}
      {isLoading ? (
        <LoadingSpinner label="Memuat catatan monitoring kunjungan..." size="md" />
      ) : filteredRecords.length === 0 ? (
        <EmptyState
          icon={ClipboardCheck}
          title="Tidak Ada Catatan Monitoring"
          description="Belum ada catatan kunjungan bimbingan yang terdaftar untuk periode ini."
          actionButton={
            canEditMonitoring
              ? {
                  label: 'Catat Kunjungan Pertama',
                  onClick: () => {
                    setSelectedRecord(null);
                    setIsFormOpen(true);
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="space-y-4">
          {filteredRecords.map(item => (
            <div
              key={item.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                    <ClipboardCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                      {item.placement?.student?.full_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Mitra: {item.placement?.partner?.company_name} • Kelas:{' '}
                      {item.placement?.student?.class?.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-auto">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-teal-600" />
                    <span>{formatDateIndo(item.visit_date)}</span>
                  </div>

                  {canEditMonitoring && (
                    <button
                      onClick={() => {
                        setSelectedRecord(item);
                        setIsFormOpen(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                      title="Ubah Catatan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress & Follow Up Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Progress */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>Perkembangan Siswa</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.student_progress}
                  </p>
                </div>

                {/* Obstacles */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <span>Kendala / Masalah</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {item.obstacles || 'Tidak ada kendala yang dilaporkan.'}
                  </p>
                </div>

                {/* Follow up */}
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Rencana Tindak Lanjut</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{item.follow_up}</p>
                </div>
              </div>

              {/* Footer info: Supervisor name & Attachment */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-teal-600" />
                  <span>
                    Guru Pembimbing: <b>{item.school_supervisor?.name || '-'}</b>
                  </span>
                </div>

                {item.attachment_url && (
                  <button
                    onClick={() => handleOpenAttachment(item.attachment_url!)}
                    className="inline-flex items-center gap-1.5 text-teal-600 dark:text-teal-400 font-semibold hover:underline self-start sm:self-auto"
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Lampiran: {item.attachment_name || 'Lihat Berkas Foto/Dokumen'}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <MonitoringFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
        monitoringToEdit={selectedRecord}
        placements={placements}
        schoolSupervisors={supervisors}
      />
    </div>
  );
};
