import React, { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Search,
  Filter,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Award,
  ArrowRight,
} from 'lucide-react';
import { Placement } from '../types/database';
import { dataService } from '../services/dataService';
import { useAuth } from '../context/AuthContext';
import { usePeriod } from '../context/PeriodContext';
import { WithdrawalActionModal } from '../components/withdrawals/WithdrawalActionModal';
import { EmptyState } from '../components/common/EmptyState';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { formatDateIndo, getPlacementStatusBadge } from '../utils/formatters';

export const WithdrawalsPage: React.FC = () => {
  const { canEditOperations } = useAuth();
  const { selectedPeriodId } = usePeriod();

  const [placements, setPlacements] = useState<Placement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilterTab, setActiveFilterTab] = useState<'all' | 'overdue' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<Placement | null>(null);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const data = await dataService.getPlacements({ periodId: selectedPeriodId });
      setPlacements(data);
    } catch (err) {
      console.error('Failed to load withdrawal placements:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriodId]);

  const todayStr = new Date().toISOString().split('T')[0];

  // Upcoming 14 days calculation
  const fourteenDaysLater = new Date();
  fourteenDaysLater.setDate(new Date().getDate() + 14);
  const fourteenDaysLaterStr = fourteenDaysLater.toISOString().split('T')[0];

  const categorizedData = useMemo(() => {
    const overdue = placements.filter(
      p => p.status !== 'selesai' && p.status !== 'dibatalkan' && p.planned_withdrawal_date < todayStr
    );

    const upcoming = placements.filter(
      p =>
        p.status !== 'selesai' &&
        p.status !== 'dibatalkan' &&
        p.planned_withdrawal_date >= todayStr &&
        p.planned_withdrawal_date <= fourteenDaysLaterStr
    );

    const completed = placements.filter(p => p.status === 'selesai');

    return { overdue, upcoming, completed };
  }, [placements, todayStr, fourteenDaysLaterStr]);

  const displayedPlacements = useMemo(() => {
    let list = placements;

    if (activeFilterTab === 'overdue') {
      list = categorizedData.overdue;
    } else if (activeFilterTab === 'upcoming') {
      list = categorizedData.upcoming;
    } else if (activeFilterTab === 'completed') {
      list = categorizedData.completed;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        p =>
          (p.student?.full_name.toLowerCase().includes(q) || false) ||
          (p.partner?.company_name.toLowerCase().includes(q) || false) ||
          (p.student?.nisn.includes(q) || false)
      );
    }

    return list;
  }, [placements, activeFilterTab, categorizedData, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <CalendarCheck className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            Penarikan & Penyelesaian PKL
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pantau siswa mendekati batas akhir penempatan, filter keterlambatan tindak lanjut, dan catat realisasi penjemputan resmi.
          </p>
        </div>
      </div>

      {/* Filter Tabs & Quick Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overdue Card */}
        <button
          onClick={() => setActiveFilterTab('overdue')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeFilterTab === 'overdue'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              Terlambat Ditindaklanjuti
            </span>
            <span className="w-6 h-6 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold flex items-center justify-center">
              {categorizedData.overdue.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Jadwal penarikan telah lewat, perlu segera difinalisasi realisasinya.
          </p>
        </button>

        {/* Upcoming Card */}
        <button
          onClick={() => setActiveFilterTab('upcoming')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeFilterTab === 'upcoming'
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Mendekati Jadwal (14 Hari)
            </span>
            <span className="w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold flex items-center justify-center">
              {categorizedData.upcoming.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Segera koordinasikan surat tugas penjemputan dengan guru pembimbing.
          </p>
        </button>

        {/* Completed Card */}
        <button
          onClick={() => setActiveFilterTab('completed')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            activeFilterTab === 'completed'
              ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-300 dark:border-teal-800 ring-2 ring-teal-500 shadow-md'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-teal-300'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" />
              Selesai & Telah Ditarik
            </span>
            <span className="w-6 h-6 rounded-full bg-teal-100 dark:bg-teal-900/60 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-center">
              {categorizedData.completed.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Penarikan terlaksana lengkap dengan tanggal riil dan catatan evaluasi.
          </p>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari siswa, mitra, atau NISN..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              activeFilterTab === 'all'
                ? 'bg-slate-800 text-white border-slate-800 dark:bg-slate-200 dark:text-slate-900'
                : 'bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
            }`}
          >
            Tampilkan Semua ({placements.length})
          </button>
        </div>
      </div>

      {/* Placements List */}
      {isLoading ? (
        <LoadingSpinner label="Memeriksa status jadwal penarikan..." size="md" />
      ) : displayedPlacements.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="Tidak Ada Siswa Sesuai Kriteria"
          description="Tidak ditemukan siswa yang cocok dengan filter jadwal penarikan yang dipilih."
        />
      ) : (
        <div className="space-y-3">
          {displayedPlacements.map(plc => {
            const badge = getPlacementStatusBadge(plc.status);
            const isOverdue =
              plc.status !== 'selesai' &&
              plc.status !== 'dibatalkan' &&
              plc.planned_withdrawal_date < todayStr;

            return (
              <div
                key={plc.id}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md ${
                  isOverdue
                    ? 'border-l-4 border-l-rose-500 border-slate-200 dark:border-slate-800'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.bg}`}>
                      {badge.label}
                    </span>
                    {isOverdue && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Terlambat Ditindaklanjuti
                      </span>
                    )}
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                    {plc.student?.full_name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    NISN: {plc.student?.nisn} • {plc.student?.class?.name} • Mitra:{' '}
                    <b>{plc.partner?.company_name}</b>
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      <span>Rencana Penarikan: <b>{formatDateIndo(plc.planned_withdrawal_date)}</b></span>
                    </div>

                    {plc.actual_withdrawal_date ? (
                      <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Realisasi Penarikan: {formatDateIndo(plc.actual_withdrawal_date)}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 italic">
                        (Belum ada realisasi penarikan)
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action */}
                <div className="flex items-center gap-3 self-end md:self-center flex-shrink-0">
                  {canEditOperations && (
                    <button
                      onClick={() => {
                        setSelectedPlacement(plc);
                        setIsModalOpen(true);
                      }}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all ${
                        plc.status === 'selesai'
                          ? 'border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50'
                          : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
                      }`}
                    >
                      <CalendarCheck className="w-4 h-4" />
                      {plc.status === 'selesai' ? 'Ubah Realisasi Penarikan' : 'Proses Penarikan'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Modal */}
      <WithdrawalActionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        placement={selectedPlacement}
      />
    </div>
  );
};
