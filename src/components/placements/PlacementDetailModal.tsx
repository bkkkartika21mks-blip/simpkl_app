import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Placement, MonitoringRecord } from '../../types/database';
import { dataService } from '../../services/dataService';
import { formatDateIndo, getPlacementStatusBadge } from '../../utils/formatters';
import {
  Briefcase,
  Building2,
  User,
  Calendar,
  CheckCircle,
  Clock,
  ClipboardCheck,
  Award,
  FileText,
} from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface PlacementDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  placement: Placement | null;
}

export const PlacementDetailModal: React.FC<PlacementDetailModalProps> = ({
  isOpen,
  onClose,
  placement,
}) => {
  const [monitoringLogs, setMonitoringLogs] = useState<MonitoringRecord[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (placement && isOpen) {
      setLoadingLogs(true);
      dataService
        .getMonitoringRecords(placement.id)
        .then(data => setMonitoringLogs(data))
        .finally(() => setLoadingLogs(false));
    }
  }, [placement, isOpen]);

  if (!placement) return null;

  const badge = getPlacementStatusBadge(placement.status);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Detail Penempatan Praktik Kerja Lapangan"
      subtitle={`${placement.student?.full_name} • ${placement.partner?.company_name}`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Header Card */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${badge.dot}`} />
                {badge.label}
              </span>
              <span className="text-xs text-slate-400">ID: {placement.id.slice(0, 8)}</span>
            </div>
            <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
              {placement.student?.full_name}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              NISN: {placement.student?.nisn} • {placement.student?.class?.name} (
              {placement.student?.department?.code})
            </p>
          </div>

          <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-right self-stretch sm:self-auto">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Nilai Akhir PKL
            </span>
            <span className="text-xl font-extrabold text-teal-600 dark:text-teal-400">
              {placement.final_score !== undefined && placement.final_score !== null
                ? placement.final_score
                : 'Belum Ada'}
            </span>
          </div>
        </div>

        {/* 2-Column Info: Partner & Supervisors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          {/* Mitra Info */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <Building2 className="w-4 h-4 text-teal-600" />
              Mitra Industri (DU/DI)
            </div>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">
              {placement.partner?.company_name}
            </p>
            <p className="text-slate-500 dark:text-slate-400">{placement.partner?.industry_sector}</p>
            <p className="text-slate-500 dark:text-slate-400">{placement.partner?.address}</p>
            <p className="text-slate-500 dark:text-slate-400">
              Kontak: {placement.partner?.person_in_charge} ({placement.partner?.contact_number})
            </p>
          </div>

          {/* Supervisors & Dates */}
          <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
              <User className="w-4 h-4 text-teal-600" />
              Pembimbing & Jadwal
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Pembimbing Sekolah:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {placement.school_supervisor?.name || '-'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Pembimbing DU/DI:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {placement.industry_supervisor?.name || '-'} ({placement.industry_supervisor?.position || 'Instruktur'})
              </span>
            </div>
            <div className="pt-1 text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Mulai:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDateIndo(placement.start_date)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Rencana Penarikan:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {formatDateIndo(placement.planned_withdrawal_date)}
                </span>
              </div>
              {placement.actual_withdrawal_date && (
                <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 font-bold">
                  <span>Realisasi Penarikan:</span>
                  <span>{formatDateIndo(placement.actual_withdrawal_date)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        {placement.notes && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 block mb-0.5">Catatan Penempatan:</span>
            <p className="text-slate-600 dark:text-slate-300 italic">"{placement.notes}"</p>
          </div>
        )}

        {placement.withdrawal_notes && (
          <div className="p-3.5 rounded-xl bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-800 text-xs">
            <span className="font-bold text-teal-800 dark:text-teal-300 block mb-0.5">Catatan Realisasi Penarikan:</span>
            <p className="text-slate-700 dark:text-slate-300">"{placement.withdrawal_notes}"</p>
          </div>
        )}

        {/* Monitoring Visits Log */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Catatan Kunjungan Monitoring ({monitoringLogs.length})
          </h4>

          {loadingLogs ? (
            <LoadingSpinner label="Memuat catatan monitoring..." size="sm" />
          ) : monitoringLogs.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 text-xs">
              Belum ada kunjungan monitoring yang dicatat untuk penempatan ini.
            </div>
          ) : (
            <div className="space-y-3">
              {monitoringLogs.map(log => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      Kunjungan: {formatDateIndo(log.visit_date)}
                    </span>
                    <span className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold">
                      {log.school_supervisor?.name || 'Pembimbing'}
                    </span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Perkembangan:</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">{log.student_progress}</p>
                  </div>
                  {log.obstacles && (
                    <div>
                      <span className="font-semibold text-rose-600 dark:text-rose-400">Kendala:</span>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">{log.obstacles}</p>
                    </div>
                  )}
                  <div>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Tindak Lanjut:</span>
                    <p className="text-slate-600 dark:text-slate-300 mt-0.5">{log.follow_up}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
