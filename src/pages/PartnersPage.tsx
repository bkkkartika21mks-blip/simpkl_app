import React, { useState, useEffect, useMemo } from 'react';
import {
  Building2,
  Search,
  Plus,
  Download,
  Eye,
  Edit2,
  Archive,
  Trash2,
  MapPin,
  Phone,
  Users,
  ExternalLink,
} from 'lucide-react';
import { Partner } from '../types/database';
import { dataService } from '../services/dataService';
import { exportPartnersCsv } from '../services/exportService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { usePeriod } from '../context/PeriodContext';
import { PartnerFormModal } from '../components/partners/PartnerFormModal';
import { PartnerDetailModal } from '../components/partners/PartnerDetailModal';
import { ConfirmDialog } from '../components/common/ConfirmDialog';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const PartnersPage: React.FC = () => {
  const { canEditOperations, user } = useAuth();
  const { success, error } = useToast();
  const { selectedPeriodId } = usePeriod();

  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);

  // Archive & Delete targets
  const [archiveTarget, setArchiveTarget] = useState<Partner | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Partner | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await dataService.getPartners({
        includeArchived: showArchived,
        periodId: selectedPeriodId,
      });
      setPartners(data);
    } catch (err) {
      console.error('Failed to load partners:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [showArchived, selectedPeriodId]);

  const filteredPartners = useMemo(() => {
    if (!searchQuery.trim()) return partners;
    const q = searchQuery.toLowerCase().trim();
    return partners.filter(
      p => p.company_name.toLowerCase().includes(q) || p.industry_sector.toLowerCase().includes(q)
    );
  }, [partners, searchQuery]);

  const handleArchive = async () => {
    if (!archiveTarget) return;
    try {
      setActionLoading(true);
      await dataService.archivePartner(archiveTarget.id, {
        name: user?.name || 'Petugas',
        email: user?.email || 'admin@simpkl.sch.id',
      });
      success('Mitra Diarsipkan', `${archiveTarget.company_name} berhasil dipindahkan ke arsip.`);
      setArchiveTarget(null);
      loadData();
    } catch (err: any) {
      error('Gagal Mengarsipkan', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setActionLoading(true);
      await dataService.deletePartner(deleteTarget.id, {
        name: user?.name || 'Petugas',
        email: user?.email || 'admin@simpkl.sch.id',
      });
      success('Mitra Dihapus', `Data mitra berhasil dihapus.`);
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
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            Mitra PKL (Dunia Usaha & Dunia Industri)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Kelola instansi rekanan, batas kuota penempatan per periode, kontak PIC, dan daftar siswa aktif.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportPartnersCsv(filteredPartners)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors shadow-sm"
          >
            <Download className="w-4 h-4 text-teal-600" />
            Ekspor CSV
          </button>

          {canEditOperations && (
            <button
              onClick={() => {
                setSelectedPartner(null);
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold transition-all shadow-md shadow-teal-600/30"
            >
              <Plus className="w-4 h-4" />
              Tambah Mitra
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama perusahaan atau sektor industri..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

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

      {/* Partners Grid */}
      {isLoading ? (
        <LoadingSpinner label="Memuat data mitra industri..." size="md" />
      ) : filteredPartners.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Tidak Ada Mitra Industri Ditemukan"
          description="Belum ada data perusahaan mitra atau kriteria pencarian tidak cocok."
          actionButton={
            canEditOperations
              ? {
                  label: 'Tambah Mitra Baru',
                  onClick: () => {
                    setSelectedPartner(null);
                    setIsFormOpen(true);
                  },
                }
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPartners.map(partner => {
            const assigned = partner.assigned_count || 0;
            const quota = partner.default_quota;
            const isFull = assigned >= quota;

            return (
              <div
                key={partner.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 font-bold">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        isFull
                          ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                      }`}
                    >
                      {isFull ? 'Kuota Penuh' : 'Kuota Tersedia'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 dark:text-slate-100 text-sm line-clamp-1">
                    {partner.company_name}
                  </h3>
                  <p className="text-xs text-teal-600 dark:text-teal-400 font-medium mb-3">
                    {partner.industry_sector}
                  </p>

                  {/* Quota Progress Bar */}
                  <div className="space-y-1.5 mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400">Kuota Terisi:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {assigned} / {quota} Siswa
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isFull ? 'bg-amber-500' : 'bg-teal-600'
                        }`}
                        style={{ width: `${Math.min((assigned / quota) * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Contact & Address */}
                  <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                    <div className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{partner.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span>
                        {partner.person_in_charge} ({partner.contact_number})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => {
                      setSelectedPartner(partner);
                      setIsDetailOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Lihat Siswa ({assigned})
                  </button>

                  <div className="flex items-center gap-1">
                    {partner.google_maps_url && (
                      <a
                        href={partner.google_maps_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                        title="Google Maps"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}

                    {canEditOperations && (
                      <>
                        <button
                          onClick={() => {
                            setSelectedPartner(partner);
                            setIsFormOpen(true);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors"
                          title="Ubah Mitra"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setArchiveTarget(partner)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 transition-colors"
                          title="Arsipkan Mitra"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(partner)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                          title="Hapus Permanen"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Partner Form Modal */}
      <PartnerFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={loadData}
        partnerToEdit={selectedPartner}
      />

      {/* Partner Detail Modal */}
      <PartnerDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        partner={selectedPartner}
        periodId={selectedPeriodId}
      />

      {/* Archive Dialog */}
      <ConfirmDialog
        isOpen={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleArchive}
        title="Arsipkan Mitra DU/DI"
        message={`Arsipkan mitra "${archiveTarget?.company_name}"? Riwayat siswa yang pernah ditempatkan di mitra ini tidak akan terhapus.`}
        confirmLabel="Ya, Arsipkan"
        variant="warning"
        isLoading={actionLoading}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Mitra Permanen"
        message={`Mitra "${deleteTarget?.company_name}" hanya dapat dihapus jika belum pernah memiliki riwayat penempatan siswa. Lanjutkan?`}
        confirmLabel="Hapus Permanen"
        variant="danger"
        isLoading={actionLoading}
      />
    </div>
  );
};
