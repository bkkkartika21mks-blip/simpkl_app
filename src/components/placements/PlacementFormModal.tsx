import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import {
  Placement,
  Student,
  Partner,
  SchoolSupervisor,
  IndustrySupervisor,
  InternshipPeriod,
} from '../../types/database';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { usePeriod } from '../../context/PeriodContext';
import {
  validateDates,
  validatePlacementOverlap,
  validatePartnerQuota,
} from '../../utils/validators';
import { AlertCircle, Calendar, Building2, User, UserCheck } from 'lucide-react';

interface PlacementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  placementToEdit?: Placement | null;
  students: Student[];
  partners: Partner[];
  schoolSupervisors: SchoolSupervisor[];
  industrySupervisors: IndustrySupervisor[];
  periods: InternshipPeriod[];
  existingPlacements: Placement[];
}

export const PlacementFormModal: React.FC<PlacementFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  placementToEdit,
  students,
  partners,
  schoolSupervisors,
  industrySupervisors,
  periods,
  existingPlacements,
}) => {
  const { user } = useAuth();
  const { selectedPeriodId } = usePeriod();
  const { success, error } = useToast();

  const [studentId, setStudentId] = useState('');
  const [periodId, setPeriodId] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [schoolSupervisorId, setSchoolSupervisorId] = useState('');
  const [industrySupervisorId, setIndustrySupervisorId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [plannedWithdrawalDate, setPlannedWithdrawalDate] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<Placement['status']>('terjadwal');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation feedback state
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (placementToEdit) {
      setStudentId(placementToEdit.student_id);
      setPeriodId(placementToEdit.period_id);
      setPartnerId(placementToEdit.partner_id);
      setSchoolSupervisorId(placementToEdit.school_supervisor_id);
      setIndustrySupervisorId(placementToEdit.industry_supervisor_id || '');
      setStartDate(placementToEdit.start_date);
      setPlannedWithdrawalDate(placementToEdit.planned_withdrawal_date);
      setNotes(placementToEdit.notes || '');
      setStatus(placementToEdit.status);
    } else {
      setStudentId('');
      setPeriodId(selectedPeriodId || periods[0]?.id || '');
      setPartnerId(partners[0]?.id || '');
      setSchoolSupervisorId(schoolSupervisors[0]?.id || '');
      setIndustrySupervisorId('');

      // Default start and end dates from selected period
      const activeP = periods.find(p => p.id === selectedPeriodId) || periods[0];
      if (activeP) {
        setStartDate(activeP.start_date);
        setPlannedWithdrawalDate(activeP.end_date);
      } else {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setPlannedWithdrawalDate(today);
      }
      setNotes('');
      setStatus('terjadwal');
    }
    setFormError(null);
  }, [placementToEdit, isOpen, periods, partners, schoolSupervisors, selectedPeriodId]);

  // Filter industry supervisors to ONLY those belonging to the chosen partner!
  const availableIndustrySupervisors = industrySupervisors.filter(
    i => i.partner_id === partnerId
  );

  // Reset industry supervisor when partner changes if selected one does not belong to new partner
  const handlePartnerChange = (newPartnerId: string) => {
    setPartnerId(newPartnerId);
    const valid = industrySupervisors.find(
      i => i.partner_id === newPartnerId && i.id === industrySupervisorId
    );
    if (!valid) {
      const firstAvailable = industrySupervisors.find(i => i.partner_id === newPartnerId);
      setIndustrySupervisorId(firstAvailable ? firstAvailable.id : '');
    }
  };

  // Live partner quota info
  const selectedPartner = partners.find(p => p.id === partnerId);
  const partnerPlacedCount = existingPlacements.filter(
    p => p.partner_id === partnerId &&
         p.period_id === periodId &&
         p.status !== 'dibatalkan' &&
         p.id !== placementToEdit?.id
  ).length;

  const quota = selectedPartner?.default_quota || 0;
  const isQuotaFull = partnerPlacedCount >= quota;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!studentId) {
      setFormError('Siswa wajib dipilih.');
      return;
    }
    if (!partnerId) {
      setFormError('Mitra industri wajib dipilih.');
      return;
    }
    if (!schoolSupervisorId) {
      setFormError('Pembimbing sekolah wajib dipilih.');
      return;
    }

    // 1. Date order validation
    const dateErr = validateDates(startDate, plannedWithdrawalDate);
    if (dateErr) {
      setFormError(dateErr.message);
      return;
    }

    // 2. Overlap validation
    const overlapErr = validatePlacementOverlap(
      studentId,
      startDate,
      plannedWithdrawalDate,
      existingPlacements,
      placementToEdit?.id
    );
    if (overlapErr) {
      setFormError(overlapErr.message);
      return;
    }

    // 3. Quota validation
    if (selectedPartner) {
      const quotaErr = validatePartnerQuota(
        partnerId,
        periodId,
        selectedPartner,
        selectedPartner.default_quota,
        existingPlacements,
        placementToEdit?.id
      );
      if (quotaErr) {
        setFormError(quotaErr.message);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      await dataService.savePlacement(
        {
          id: placementToEdit?.id,
          student_id: studentId,
          period_id: periodId,
          partner_id: partnerId,
          school_supervisor_id: schoolSupervisorId,
          industry_supervisor_id: industrySupervisorId || undefined,
          start_date: startDate,
          planned_withdrawal_date: plannedWithdrawalDate,
          notes: notes.trim(),
          status,
        },
        { name: user?.name || 'Petugas', email: user?.email || 'admin@simpkl.sch.id' }
      );

      success(
        placementToEdit ? 'Penempatan Diperbarui' : 'Penempatan Berhasil Dibuat',
        'Data penempatan PKL telah diverifikasi dan tersimpan.'
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      setFormError(err.message);
      error('Gagal Menyimpan Penempatan', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={placementToEdit ? 'Ubah Data Penempatan Siswa' : 'Buat Penempatan PKL Baru'}
      subtitle="Sistem akan memeriksa benturan tanggal dan kuota penerimaan mitra secara otomatis"
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Aturan Bisnis Tidak Terpenuhi</p>
              <p className="mt-0.5">{formError}</p>
            </div>
          </div>
        )}

        {/* Period & Student */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Periode PKL <span className="text-rose-500">*</span>
            </label>
            <select
              value={periodId}
              onChange={e => setPeriodId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            >
              {periods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Pilih Siswa <span className="text-rose-500">*</span>
            </label>
            <select
              value={studentId}
              onChange={e => setStudentId(e.target.value)}
              disabled={Boolean(placementToEdit)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800"
              required
            >
              <option value="">-- Pilih Siswa --</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>
                  {s.full_name} ({s.class?.name || 'Kelas'} - NISN: {s.nisn})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Partner Selection & Live Quota Info */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              Mitra Industri (DU/DI) <span className="text-rose-500">*</span>
            </label>
            {selectedPartner && (
              <span
                className={`text-[11px] font-bold ${
                  isQuotaFull ? 'text-rose-600 dark:text-rose-400' : 'text-teal-600 dark:text-teal-400'
                }`}
              >
                Kuota: {partnerPlacedCount} / {quota} Siswa {isQuotaFull ? '(Penuh)' : '(Tersedia)'}
              </span>
            )}
          </div>
          <select
            value={partnerId}
            onChange={e => handlePartnerChange(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            required
          >
            <option value="">-- Pilih Mitra Industri --</option>
            {partners.map(p => (
              <option key={p.id} value={p.id}>
                {p.company_name} ({p.industry_sector}) - Kuota: {p.default_quota}
              </option>
            ))}
          </select>
        </div>

        {/* Supervisors (School & Industry) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Guru Pembimbing Sekolah <span className="text-rose-500">*</span>
            </label>
            <select
              value={schoolSupervisorId}
              onChange={e => setSchoolSupervisorId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            >
              <option value="">-- Pilih Guru Pembimbing --</option>
              {schoolSupervisors.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Pembimbing DU/DI (Sesuai Mitra)
            </label>
            <select
              value={industrySupervisorId}
              onChange={e => setIndustrySupervisorId(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="">-- Pilih Pembimbing DU/DI --</option>
              {availableIndustrySupervisors.map(i => (
                <option key={i.id} value={i.id}>
                  {i.name} ({i.position || 'Instruktur'})
                </option>
              ))}
            </select>
            {availableIndustrySupervisors.length === 0 && (
              <p className="text-[10px] text-amber-600 mt-1">
                Belum ada pembimbing industri terdaftar untuk mitra ini.
              </p>
            )}
          </div>
        </div>

        {/* Start Date & Planned Withdrawal Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Tanggal Penempatan Mulai <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Rencana Penarikan Selesai <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              min={startDate}
              value={plannedWithdrawalDate}
              onChange={e => setPlannedWithdrawalDate(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              required
            />
          </div>
        </div>

        {/* Status (For edit) */}
        {placementToEdit && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
              Status Penempatan
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as Placement['status'])}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            >
              <option value="terjadwal">Terjadwal</option>
              <option value="berlangsung">Sedang Berlangsung</option>
              <option value="menunggu_penarikan">Menunggu Penarikan</option>
              <option value="selesai">Selesai (Membutuhkan Realisasi)</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Catatan Penempatan / Divisi Kerja
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Contoh: Ditempatkan di Divisi Web Application Developer..."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
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
            disabled={isSubmitting || (isQuotaFull && !placementToEdit)}
            className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-sm font-semibold transition-all shadow-sm shadow-teal-600/30"
          >
            {isSubmitting ? 'Memvalidasi & Menyimpan...' : placementToEdit ? 'Perbarui Penempatan' : 'Simpan Penempatan'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
