import React from 'react';
import { Calendar, Briefcase, Clock, ClipboardCheck, ArrowRight } from 'lucide-react';
import { formatDateIndo } from '../../utils/formatters';

interface ScheduleItem {
  type: 'start' | 'withdrawal' | 'visit';
  date: string;
  student: string;
  partner: string;
  placementId?: string;
}

interface UpcomingScheduleProps {
  schedule: ScheduleItem[];
  onNavigateToPlacements?: () => void;
}

export const UpcomingSchedule: React.FC<UpcomingScheduleProps> = ({
  schedule,
  onNavigateToPlacements,
}) => {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Agenda 7 Hari Mendatang
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Jadwal mulai PKL, rencana penarikan, dan kunjungan pembimbing
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3">
        {schedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center text-slate-400 dark:text-slate-500">
            <Calendar className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs">Tidak ada agenda PKL dalam 7 hari ke depan.</p>
          </div>
        ) : (
          schedule.map((item, idx) => {
            let badgeBg = 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800';
            let label = 'Mulai PKL';
            let Icon = Briefcase;

            if (item.type === 'withdrawal') {
              badgeBg = 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800';
              label = 'Rencana Penarikan';
              Icon = Clock;
            } else if (item.type === 'visit') {
              badgeBg = 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-400 border-teal-200 dark:border-teal-800';
              label = 'Kunjungan Monitoring';
              Icon = ClipboardCheck;
            }

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 transition-all flex items-start gap-3"
              >
                <div className={`p-2 rounded-lg border flex-shrink-0 ${badgeBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {item.student}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                      {formatDateIndo(item.date)}
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 truncate">{item.partner}</p>
                  <span className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${badgeBg}`}>
                    {label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {onNavigateToPlacements && (
        <button
          onClick={onNavigateToPlacements}
          className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold text-teal-600 dark:text-teal-400 hover:text-teal-700 flex items-center justify-center gap-1 transition-colors"
        >
          Lihat Semua Penempatan <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
