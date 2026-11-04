import React from 'react';
import { AlertTriangle, UserX, Clock, ArrowRight } from 'lucide-react';

interface IncompleteDataAlertProps {
  alerts: {
    incompleteCount: number;
    unplacedCount: number;
    overdueWithdrawalCount: number;
  };
  onNavigateToStudents?: () => void;
  onNavigateToWithdrawals?: () => void;
}

export const IncompleteDataAlert: React.FC<IncompleteDataAlertProps> = ({
  alerts,
  onNavigateToStudents,
  onNavigateToWithdrawals,
}) => {
  const hasAlerts =
    alerts.incompleteCount > 0 || alerts.unplacedCount > 0 || alerts.overdueWithdrawalCount > 0;

  if (!hasAlerts) {
    return (
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="text-xs">
          <p className="font-bold text-emerald-900 dark:text-emerald-100">Seluruh Data Lengkap & Tertib</p>
          <p className="text-emerald-700 dark:text-emerald-400">
            Tidak ada siswa dengan kontak belum lengkap atau penarikan yang terlambat ditindaklanjuti.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 space-y-3">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <h4 className="text-sm font-bold text-amber-900 dark:text-amber-100">
          Perhatian Operasional: Tindak Lanjut Diperlukan
        </h4>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {alerts.overdueWithdrawalCount > 0 && (
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/80 dark:border-amber-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold mb-1">
                <Clock className="w-4 h-4" />
                <span>{alerts.overdueWithdrawalCount} Penarikan Terlambat</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                Melewati rencana penarikan tanpa realisasi tanggal selesai.
              </p>
            </div>
            {onNavigateToWithdrawals && (
              <button
                onClick={onNavigateToWithdrawals}
                className="mt-2 text-teal-600 dark:text-teal-400 font-semibold hover:underline inline-flex items-center gap-1 text-[11px]"
              >
                Proses Penarikan <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {alerts.unplacedCount > 0 && (
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/80 dark:border-amber-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold mb-1">
                <UserX className="w-4 h-4" />
                <span>{alerts.unplacedCount} Siswa Belum Ditempatkan</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                Siswa aktif terdaftar yang belum memiliki mitra PKL di periode ini.
              </p>
            </div>
            {onNavigateToStudents && (
              <button
                onClick={onNavigateToStudents}
                className="mt-2 text-teal-600 dark:text-teal-400 font-semibold hover:underline inline-flex items-center gap-1 text-[11px]"
              >
                Lihat Data Siswa <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {alerts.incompleteCount > 0 && (
          <div className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-amber-200/80 dark:border-amber-800/80 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold mb-1">
                <AlertTriangle className="w-4 h-4" />
                <span>{alerts.incompleteCount} Biodata Belum Lengkap</span>
              </div>
              <p className="text-slate-600 dark:text-slate-300 text-[11px]">
                Nomor kontak orang tua atau alamat siswa belum terisi lengkap.
              </p>
            </div>
            {onNavigateToStudents && (
              <button
                onClick={onNavigateToStudents}
                className="mt-2 text-teal-600 dark:text-teal-400 font-semibold hover:underline inline-flex items-center gap-1 text-[11px]"
              >
                Lengkapi Profil <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
