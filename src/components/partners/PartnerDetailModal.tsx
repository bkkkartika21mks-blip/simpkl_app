import React, { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { Partner, Placement } from '../../types/database';
import { dataService } from '../../services/dataService';
import { formatDateIndo, getPlacementStatusBadge } from '../../utils/formatters';
import {
  Building2,
  MapPin,
  User,
  Phone,
  Mail,
  ExternalLink,
  Users,
  Calendar,
  CheckCircle,
} from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface PartnerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  partner: Partner | null;
  periodId?: string;
}

export const PartnerDetailModal: React.FC<PartnerDetailModalProps> = ({
  isOpen,
  onClose,
  partner,
  periodId,
}) => {
  const [placedStudents, setPlacedStudents] = useState<Placement[]>([]);
  const [loadingPlaced, setLoadingPlaced] = useState(false);

  useEffect(() => {
    if (partner && isOpen) {
      setLoadingPlaced(true);
      dataService
        .getPartnerPlacedStudents(partner.id, periodId)
        .then(data => setPlacedStudents(data))
        .finally(() => setLoadingPlaced(false));
    }
  }, [partner, isOpen, periodId]);

  if (!partner) return null;

  const quota = partner.default_quota;
  const currentCount = placedStudents.length;
  const quotaPercent = Math.min(Math.round((currentCount / quota) * 100), 100);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Profil Mitra & Siswa Ditempatkan"
      subtitle={partner.industry_sector}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Company Header Card */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-teal-600 text-white flex items-center justify-center text-lg font-extrabold shadow-sm shadow-teal-600/20">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                  {partner.company_name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pimpinan: {partner.person_in_charge}
                </p>
              </div>
            </div>

            {partner.google_maps_url && (
              <a
                href={partner.google_maps_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-teal-600 dark:text-teal-400 text-xs font-semibold hover:bg-teal-50 dark:hover:bg-slate-700/60 transition-colors shadow-sm self-start sm:self-auto"
              >
                <MapPin className="w-3.5 h-3.5" />
                Buka Google Maps
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Quota Progress */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300">
                Status Pemenuhan Kuota Siswa:
              </span>
              <span className="font-bold text-teal-600 dark:text-teal-400">
                {currentCount} / {quota} Siswa ({quotaPercent}%)
              </span>
            </div>
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  currentCount >= quota ? 'bg-amber-500' : 'bg-teal-600'
                }`}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
              <span>{partner.address}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>{partner.contact_number}</span>
            </div>
            {partner.email && (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>{partner.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Placed Students List */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            Daftar Siswa yang Ditempatkan ({placedStudents.length})
          </h4>

          {loadingPlaced ? (
            <LoadingSpinner label="Memuat daftar siswa..." size="sm" />
          ) : placedStudents.length === 0 ? (
            <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 text-xs">
              Belum ada siswa yang ditempatkan pada mitra ini untuk periode terpilih.
            </div>
          ) : (
            <div className="space-y-2.5">
              {placedStudents.map(plc => {
                const badge = getPlacementStatusBadge(plc.status);
                return (
                  <div
                    key={plc.id}
                    className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-slate-100">
                        {plc.student?.full_name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        NISN: {plc.student?.nisn} • {plc.student?.class?.name || 'Kelas'}
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                        <Calendar className="w-3 h-3 text-teal-600" />
                        <span>
                          {formatDateIndo(plc.start_date)} s.d. {formatDateIndo(plc.planned_withdrawal_date)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg}`}>
                        {badge.label}
                      </span>
                    </div>
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
