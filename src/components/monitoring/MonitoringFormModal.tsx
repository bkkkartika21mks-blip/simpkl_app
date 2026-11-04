import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { MonitoringRecord, Placement, SchoolSupervisor } from '../../types/database';
import { dataService } from '../../services/dataService';
import { uploadPlacementDocument, validateFile } from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface MonitoringFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  monitoringToEdit?: MonitoringRecord | null;
  placements: Placement[];
  schoolSupervisors: SchoolSupervisor[];
}

export const MonitoringFormModal: React.FC<MonitoringFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  monitoringToEdit,
  placements,
  schoolSupervisors,
}) => {
  const { user, isSupervisor } = useAuth();
  const { success, error } = useToast();

  const [placementId, setPlacementId] = useState('');
  const [supervisorId, setSupervisorId] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [studentProgress, setStudentProgress] = useState('');
  const [obstacles, setObstacles] = useState('');
  const [followUp, setFollowUp] = useState('');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [existingAttachmentUrl, setExistingAttachmentUrl] = useState<string | undefined>('');
  const [existingAttachmentName, setExistingAttachmentName] = useState<string | undefined>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);

  useEffect(() => {
    if (monitoringToEdit) {
      setPlacementId(monitoringToEdit.placement_id);
      setSupervisorId(monitoringToEdit.school_supervisor_id);
      setVisitDate(monitoringToEdit.visit_date);
      setStudentProgress(monitoringToEdit.student_progress);
      setObstacles(monitoringToEdit.obstacles || '');
      setFollowUp(monitoringToEdit.follow_up);
      setExistingAttachmentUrl(monitoringToEdit.attachment_url);
      setExistingAttachmentName(monitoringToEdit.attachment_name);
      setAttachmentFile(null);
    } else {
      setPlacementId(placements[0]?.id || '');

      // If logged in user is a supervisor, auto select their supervisor record
      if (isSupervisor && user?.supervisorId) {
        setSupervisorId(user.supervisorId);
      } else {
        setSupervisorId(schoolSupervisors[0]?.id || '');
      }

      setVisitDate(new Date().toISOString().split('T')[0]);
      setStudentProgress('');
      setObstacles('');
      setFollowUp('');
      setAttachmentFile(null);
      setExistingAttachmentUrl('');
      setExistingAttachmentName('');
    }
  }, [monitoringToEdit, isOpen, placements, schoolSupervisors, isSupervisor, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      error('File Tidak Didukung', validation.error);
      return;
    }

    setAttachmentFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!placementId) {
      error('Validasi Gagal', 'Siswa penempatan PKL wajib dipilih.');
      return;
    }
    if (!visitDate) {
      error('Validasi Gagal', 'Tanggal kunjungan wajib diisi.');
      return;
    }
    if (!studentProgress.trim()) {
      error('Validasi Gagal', 'Catatan perkembangan siswa wajib diisi.');
      return;
    }
    if (!followUp.trim()) {
      error('Validasi Gagal', 'Rencana tindak lanjut wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      let attachmentUrl = existingAttachmentUrl;
      let attachmentName = existingAttachmentName;

      // Handle file upload to private Supabase storage bucket
      if (attachmentFile) {
        setUploadProgress(true);
        const uploadRes = await uploadPlacementDocument(attachmentFile, 'monitoring');
        if (uploadRes.error) {
          throw new Error('Gagal mengunggah lampiran: ' + uploadRes.error);
        }
        attachmentUrl = uploadRes.filePath;
        attachmentName = uploadRes.fileName;
      }

      await dataService.saveMonitoringRecord(
        {
          id: monitoringToEdit?.id,
          placement_id: placementId,
          school_supervisor_id: supervisorId,
          visit_date: visitDate,
          student_progress: studentProgress.trim(),
          obstacles: obstacles.trim(),
          follow_up: followUp.trim(),
          attachment_url: attachmentUrl,
          attachment_name: attachmentName,
        },
        { name: user?.name || 'Pembimbing', email: user?.email || 'pembimbing@simpkl.sch.id' }
      );

      success(
        monitoringToEdit ? 'Monitoring Diperbarui' : 'Monitoring Berhasil Disimpan',
        'Catatan kunjungan pembimbing telah tercatat di sistem.'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Gagal Menyimpan Monitoring', err.message);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={monitoringToEdit ? 'Ubah Catatan Monitoring' : 'Catat Kunjungan Monitoring PKL'}
      subtitle="Dokumentasikan progres siswa di industri, evaluasi kendala, dan bukti foto kunjungan"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Student Placement Selection */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Siswa & Mitra PKL <span className="text-rose-500">*</span>
          </label>
          <select
            value={placementId}
            onChange={e => setPlacementId(e.target.value)}
            disabled={Boolean(monitoringToEdit)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            required
          >
            <option value="">-- Pilih Penempatan Siswa --</option>
            {placements.map(p => (
              <option key={p.id} value={p.id}>
                {p.student?.full_name} • {p.partner?.company_name} ({p.student?.class?.name})
              </option>
            ))}
          </select>
        </div>

        {/* Supervisor & Visit Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Guru Pembimbing <span className="text-rose-500">*</span>
            </label>
            <select
              value={supervisorId}
              onChange={e => setSupervisorId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            >
              {schoolSupervisors.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Tanggal Kunjungan Lapangan <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={visitDate}
              onChange={e => setVisitDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Student Progress */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Catatan Perkembangan Siswa <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={3}
            value={studentProgress}
            onChange={e => setStudentProgress(e.target.value)}
            placeholder="Jelaskan kemajuan kompetensi teknis, kedisiplinan kehadiran, dan adaptasi budaya kerja siswa..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            required
          />
        </div>

        {/* Obstacles & Issues */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Kendala / Hambatan yang Dihadapi (Opsional)
          </label>
          <textarea
            rows={2}
            value={obstacles}
            onChange={e => setObstacles(e.target.value)}
            placeholder="Kendala teknis, kesehatan, transportasi, atau ketidaksesuaian penugasan..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Follow Up */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Rencana Tindak Lanjut & Saran <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            value={followUp}
            onChange={e => setFollowUp(e.target.value)}
            placeholder="Tindakan yang disepakati bersama pembimbing industri atau arahan bagi siswa..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            required
          />
        </div>

        {/* Attachment Upload (Private Bucket) */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Lampiran Foto Kunjungan / Berita Acara (Maks. 10MB)
          </label>
          <div className="p-3.5 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileText className="w-5 h-5 text-teal-600 flex-shrink-0" />
              <div className="min-w-0 text-xs">
                <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {attachmentFile
                    ? attachmentFile.name
                    : existingAttachmentName
                    ? existingAttachmentName
                    : 'Belum ada file dipilih'}
                </p>
                <p className="text-[10px] text-slate-400">PDF, JPG, PNG, WEBP, atau DOCX (Bucket Privat)</p>
              </div>
            </div>

            <label className="cursor-pointer px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 transition-colors flex-shrink-0">
              Pilih File
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf,.docx"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={isSubmitting || uploadProgress}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-sm shadow-teal-600/30"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {monitoringToEdit ? 'Perbarui Catatan' : 'Simpan Catatan Monitoring'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
