import React, { useState, useEffect } from 'react';
import { History, Search, Filter, ShieldCheck, Clock, User, Eye } from 'lucide-react';
import { AuditLog } from '../types/database';
import { dataService } from '../services/dataService';
import { formatDateTimeIndo } from '../utils/formatters';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { EmptyState } from '../components/common/EmptyState';
import { Modal } from '../components/common/Modal';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const data = await dataService.getAuditLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter(l => {
    if (actionFilter && l.action !== actionFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const userName = (l.user_name || '').toLowerCase();
      const entity = l.entity.toLowerCase();
      if (!userName.includes(q) && !entity.includes(q)) return false;
    }
    return true;
  });

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'INSERT':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'UPDATE':
        return 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'STATUS_CHANGE':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400 border-purple-200 dark:border-purple-800';
      case 'ARCHIVE':
        return 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'RESTORE':
        return 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-400 border-teal-200 dark:border-teal-800';
      case 'DELETE':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-rose-200 dark:border-rose-800';
      case 'IMPORT':
        return 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
      default:
        return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
            <History className="w-7 h-7 text-teal-600 dark:text-teal-400" />
            Audit Trail & Log Aktivitas
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Riwayat pencatatan setiap aksi penambahan, perubahan, pengarsipan, dan perubahan status penempatan beserta identitas pengguna.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Cari petugas atau entitas (students, placements)..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={e => setActionFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Semua Jenis Aksi</option>
            <option value="INSERT">INSERT (Penambahan)</option>
            <option value="UPDATE">UPDATE (Perubahan Data)</option>
            <option value="STATUS_CHANGE">STATUS_CHANGE (Perubahan Status)</option>
            <option value="ARCHIVE">ARCHIVE (Pengarsipan)</option>
            <option value="RESTORE">RESTORE (Pemulihan)</option>
            <option value="IMPORT">IMPORT (Impor CSV)</option>
            <option value="DELETE">DELETE (Penghapusan)</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <LoadingSpinner label="Memuat riwayat audit trail..." size="md" />
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            icon={History}
            title="Tidak Ada Catatan Log Audit"
            description="Belum ada riwayat aktivitas yang tercatat sesuai filter saat ini."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Waktu & Tanggal</th>
                  <th className="px-4 py-3.5">Aksi</th>
                  <th className="px-4 py-3.5">Entitas Terkait</th>
                  <th className="px-4 py-3.5">Pengguna / Petugas</th>
                  <th className="px-4 py-3.5 text-right">Detail Nilai</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map(log => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-slate-500 dark:text-slate-400 font-mono">
                      {formatDateTimeIndo(log.created_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getActionBadge(
                          log.action
                        )}`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                      <code>{log.entity}</code>
                      {log.entity_id && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          ID: {log.entity_id.slice(0, 12)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {log.user_name || 'Sistem'}
                      </div>
                      <div className="text-[10px] text-slate-400">{log.user_email}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {(log.old_values || log.new_values) && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="inline-flex items-center gap-1 text-teal-600 dark:text-teal-400 font-semibold hover:underline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspeksi Nilai
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* JSON Inspection Modal */}
      {selectedLog && (
        <Modal
          isOpen={Boolean(selectedLog)}
          onClose={() => setSelectedLog(null)}
          title="Detail Perubahan Data (Audit Diff)"
          subtitle={`Aksi ${selectedLog.action} pada entitas ${selectedLog.entity} oleh ${selectedLog.user_name}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs font-mono">
            {selectedLog.old_values && (
              <div>
                <span className="font-bold text-rose-600 block mb-1">Nilai Lama (Sebelum):</span>
                <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl overflow-x-auto max-h-48 border border-slate-800">
                  {JSON.stringify(selectedLog.old_values, null, 2)}
                </pre>
              </div>
            )}

            {selectedLog.new_values && (
              <div>
                <span className="font-bold text-emerald-600 block mb-1">Nilai Baru (Sesudah):</span>
                <pre className="p-3 bg-slate-950 text-slate-200 rounded-xl overflow-x-auto max-h-48 border border-slate-800">
                  {JSON.stringify(selectedLog.new_values, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};
