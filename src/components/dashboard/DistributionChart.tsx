import React from 'react';
import { Layers, CheckCircle } from 'lucide-react';

interface DistributionChartProps {
  distribution: {
    code: string;
    name: string;
    total: number;
    placed: number;
  }[];
}

export const DistributionChart: React.FC<DistributionChartProps> = ({ distribution }) => {
  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600 dark:text-teal-400" />
            Distribusi Penempatan Siswa per Jurusan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Perbandingan total siswa dan status penempatan di industri
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {distribution.map(dept => {
          const percentage = dept.total > 0 ? Math.round((dept.placed / dept.total) * 100) : 0;
          return (
            <div key={dept.code} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {dept.name} ({dept.code})
                </span>
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  <span className="font-bold text-teal-600 dark:text-teal-400">{dept.placed}</span> / {dept.total} siswa ({percentage}%)
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-600 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
