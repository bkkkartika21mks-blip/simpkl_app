import React, { useEffect, useState } from 'react';
import { RefreshCw, PlusCircle, Building2, UserPlus, FileSpreadsheet } from 'lucide-react';
import { dataService } from '../services/dataService';
import { usePeriod } from '../context/PeriodContext';
import { useAuth } from '../context/AuthContext';
import { StatCards } from '../components/dashboard/StatCards';
import { DistributionChart } from '../components/dashboard/DistributionChart';
import { UpcomingSchedule } from '../components/dashboard/UpcomingSchedule';
import { IncompleteDataAlert } from '../components/dashboard/IncompleteDataAlert';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { NavItem } from '../components/common/Sidebar';

interface DashboardPageProps {
  onNavigate: (tab: NavItem) => void;
  onOpenNewStudent?: () => void;
  onOpenNewPartner?: () => void;
  onOpenNewPlacement?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenNewStudent,
  onOpenNewPartner,
  onOpenNewPlacement,
}) => {
  const { selectedPeriodId, activePeriod } = usePeriod();
  const { canEditOperations, role } = useAuth();
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadStats = async () => {
    try {
      setIsLoading(true);
      const data = await dataService.getDashboardStats(selectedPeriodId);
      setStats(data);
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [selectedPeriodId]);

  if (isLoading || !stats) {
    return <LoadingSpinner label="Menghitung statistik operasional PKL..." size="lg" />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-850 to-teal-950 text-white shadow-xl shadow-slate-950/10 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              SIMPKL v1.0 • Resmi
            </span>
            <span className="text-xs text-slate-300">
              {activePeriod ? activePeriod.name : 'Periode Aktif'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard Pengelolaan PKL
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Pantau penempatan siswa, ketersediaan kuota mitra DU/DI, jadwal monitoring pembimbing, dan realisasi penarikan secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadStats}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
            title="Muat Ulang Statistik"
            aria-label="Muat Ulang Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {canEditOperations && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('placements')}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-all shadow-lg shadow-teal-600/30"
              >
                <PlusCircle className="w-4 h-4" />
                Penempatan Baru
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Operational Alerts for Incomplete Data */}
      <IncompleteDataAlert
        alerts={stats.incompleteAlerts}
        onNavigateToStudents={() => onNavigate('students')}
        onNavigateToWithdrawals={() => onNavigate('withdrawals')}
      />

      {/* Dynamic Stat Cards */}
      <StatCards stats={stats} />

      {/* Two Column Layout: Distribution & Upcoming Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7">
          <DistributionChart distribution={stats.deptDistribution} />
        </div>
        <div className="lg:col-span-5">
          <UpcomingSchedule
            schedule={stats.upcomingSchedule}
            onNavigateToPlacements={() => onNavigate('placements')}
          />
        </div>
      </div>
    </div>
  );
};
