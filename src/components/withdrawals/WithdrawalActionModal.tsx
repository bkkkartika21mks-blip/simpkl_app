import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Placement } from '../../types/database';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { formatDateIndo } from '../../utils/formatters';
import { CalendarCheck, AlertCircle, Award, CheckCircle2 } from 'lucide-react';

interface WithdrawalActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  placement: Placement | null;
}

export const WithdrawalActionModal: React.FC<WithdrawalActionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  placement,
}) => {
  const { user } = useAuth();
  const { success, error } = useToast();

  const [actualDate, setActualDate] = useState('');
  const [withdrawalNotes, setWithdrawalNotes] = useState('');
  const [finalScore, setFinalScore] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);

  useEffect(() => {
    if (placement) {
      const today = new Date().toISOString().split('T')[0];
      setActualDate(placement.actual_withdrawal_date || today);
      setWithdrawalNotes(placement.withdrawal_notes || '');
      setFinalScore(placement.final_score !== undefined && placement.final_score !== null ? placement.final_score : '');
      setDateError(null);
    }
  }, [placement, isOpen]);

  if (!placement) return null;

  const handleDateChange = (val: string) => {
    setActualDate(val);
    if (val < placement.start_date) {
      setDateError(`Realisasi tanggal penarikan tidak boleh lebih awal dari tanggal penempatan (${formatDateIndo(placement.start_date)}).`);
    } else {
      setDateError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!actualDate) {
      error('Validasi Gagal', 'Realisasi tanggal penarikan wajib diisi.');
      return;
    }

    if (actualDate < placement.start_date) {
      setDateError(`Realisasi tanggal penarikan tidak boleh lebih awal dari tanggal penempatan (${formatDateIndo(placement.start_date)}).`);
      return;
    }

    try {
      setIsSubmitting(true);
      await dataService.finalizeWithdrawal(
        placement.id,
        actualDate,
        withdrawalNotes.trim(),
        finalScore === '' ? undefined : Number(finalScore),
        { name: user?.name || 'Petugas', email: user?.email || 'admin@simpkl.sch.id' }
      );

      success(
        'Penarikan PKL Berhasil Diproses',
        `Siswa ${placement.student?.full_name} resmi menyelesaikan PKL dan status diperbarui menjadi 'Selesai'.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      error('Gagal Menyelesaikan Penarikan', err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Proses Penarikan & Penyelesaian PKL"
      subtitle="Catat tanggal realisasi penarikan, evaluasi penjemputan, dan nilai akhir"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Placement Summary Card */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 text-xs space-y-1.5">
          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            {placement.student?.full_name}
          </div>
          <div className="text-slate-500 dark:text-slate-400">
            Mitra: <b>{placement.partner?.company_name}</b> • Kelas: {placement.student?.class?.name}
          </div>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 pt-1">
            <span>Mulai Penempatan: {formatDateIndo(placement.start_date)}</span>
            <span>Rencana Penarikan: {formatDateIndo(placement.planned_withdrawal_date)}</span>
          </div>
        </div>

        {dateError && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{dateError}</span>
          </div>
        )}

        {/* Actual Withdrawal Date */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Realisasi Tanggal Penarikan / Selesai <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            min={placement.start_date}
            value={actualDate}
            onChange={e => handleDateChange(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
            required
          />
          <p className="text-[11px] text-slate-400 mt-1">
            Status 'selesai' mensyaratkan tanggal riil penjemputan/penarikan telah dilaksanakan.
          </p>
        </div>

        {/* Final Score */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Nilai Akhir PKL (Skala 0 - 100)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            step="0.1"
            value={finalScore}
            onChange={e => setFinalScore(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Contoh: 90.5"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
          />
        </div>

        {/* Withdrawal Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
            Berita Acara / Catatan Penarikan
          </label>
          <textarea
            rows={3}
            value={withdrawalNotes}
            onChange={e => setWithdrawalNotes(e.target.value)}
            placeholder="Contoh: Penjemputan dilakukan oleh guru pembimbing sekolah. Siswa telah menyerahkan laporan dan sertifikat telah disahkan oleh DU/DI..."
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
            disabled={isSubmitting || Boolean(dateError)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm shadow-teal-600/30"
          >
            <CheckCircle2 className="w-4 h-4" />
            {isSubmitting ? 'Memproses...' : 'Tandai Selesai & Ditarik'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
