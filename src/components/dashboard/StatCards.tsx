import React from 'react';
import { Users, Briefcase, Clock, CheckCircle2, Building2, AlertTriangle } from 'lucide-react';

interface StatCardsProps {
  stats: {
    totalStudents: number;
    placedStudents: number;
    activePlacements: number;
    waitingWithdrawal: number;
    completedPlacements: number;
    totalPartners: number;
  };
}

export const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
  const cards = [
    {
      label: 'Total Siswa Aktif',
      value: stats.totalStudents,
      sub: `${stats.placedStudents} telah ditempatkan`,
      icon: Users,
      color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    },
    {
      label: 'Sedang Berlangsung',
      value: stats.activePlacements,
      sub: 'Aktif di dunia industri',
      icon: Briefcase,
      color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    {
      label: 'Menunggu Penarikan',
      value: stats.waitingWithdrawal,
      sub: 'Jadwal penarikan tiba',
      icon: Clock,
      color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    {
      label: 'PKL Selesai & Ditarik',
      value: stats.completedPlacements,
      sub: 'Realisasi penarikan tercatat',
      icon: CheckCircle2,
      color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20',
    },
    {
      label: 'Mitra DU/DI Terdaftar',
      value: stats.totalPartners,
      sub: 'Perusahaan mitra sekolah',
      icon: Building2,
      color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm transition-all hover:shadow-md"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {card.label}
              </span>
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{card.value}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{card.sub}</p>
          </div>
        );
      })}
    </div>
  );
};
