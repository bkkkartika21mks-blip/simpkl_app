import React, { useState } from 'react';
import { Database, Key, CheckCircle, AlertCircle, Copy, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { Modal } from './Modal';
import { isSupabaseConfigured, supabaseUrl, supabaseAnonKey, setSupabaseConfig, clearSupabaseConfig } from '../../services/supabaseClient';
import { useToast } from '../../context/ToastContext';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  const { success, error } = useToast();
  const [url, setUrl] = useState(supabaseUrl);
  const [anonKey, setAnonKey] = useState(supabaseAnonKey);
  const [activeTab, setActiveTab] = useState<'status' | 'sql' | 'guide'>('status');
  const [copied, setCopied] = useState<string | null>(null);

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim().startsWith('https://') || !url.includes('.supabase.co')) {
      error('Format Supabase URL tidak valid', 'URL harus berupa https://xxxx.supabase.co');
      return;
    }
    if (!anonKey.trim()) {
      error('Supabase Anon Key wajib diisi');
      return;
    }
    setSupabaseConfig(url, anonKey);
    success('Koneksi Disimpan', 'Memuat ulang aplikasi untuk menghubungkan database Supabase...');
    onClose();
  };

  const handleDisconnect = () => {
    clearSupabaseConfig();
    success('Beralih ke Simulasi Lokal', 'Kredensial dinonaktifkan, menggunakan database lokal persisten.');
    onClose();
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2500);
    success(`Berhasil disalin!`, `${label} telah disalin ke clipboard.`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Konfigurasi Database & Supabase SIMPKL"
      subtitle="Panduan koneksi database PostgreSQL, Storage privat, dan status layanan"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 text-sm">
          <button
            onClick={() => setActiveTab('status')}
            className={`pb-3 px-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'status'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Koneksi & Status
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`pb-3 px-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'guide'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Langkah Setup Supabase
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`pb-3 px-4 font-semibold border-b-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-teal-600 text-teal-600 dark:text-teal-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            File Migrasi SQL
          </button>
        </div>

        {/* Tab 1: Status & Config */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            <div
              className={`p-4 rounded-xl border flex items-start gap-3.5 ${
                isSupabaseConfigured
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100'
                  : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100'
              }`}
            >
              {isSupabaseConfigured ? (
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                <h4 className="font-bold">
                  {isSupabaseConfigured
                    ? 'Terhubung ke Database Cloud Supabase'
                    : 'Berjalan dalam Mode Demonstrasi / Simulasi Lokal Persisten'}
                </h4>
                <p className="mt-1 text-slate-600 dark:text-slate-300">
                  {isSupabaseConfigured
                    ? `Aplikasi terhubung ke backend Supabase (${supabaseUrl}). Seluruh data siswa, penempatan, dan RLS tersimpan langsung di PostgreSQL.`
                    : 'Kredensial Supabase belum dimasukkan. Aplikasi tetap 100% berfungsi dengan penyimpanan lokal persisten, validasi aturan bisnis lengkap, dan data fiktif berlabel [DATA CONTOH].'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  VITE_SUPABASE_URL
                </label>
                <div className="relative">
                  <Database className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={e => setUrl(e.target.value)}
                    placeholder="https://xyzabcdefg.supabase.co"
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  VITE_SUPABASE_ANON_KEY (Public / Anon Key)
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                  <input
                    type="password"
                    value={anonKey}
                    onChange={e => setAnonKey(e.target.value)}
                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                    required
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Keamanan: Hanya gunakan Anon Key. JANGAN PERNAH gunakan Service Role Key di frontend!
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                {isSupabaseConfigured && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-medium"
                  >
                    Putuskan & Gunakan Simulasi Lokal
                  </button>
                )}
                <div className="flex items-center gap-3 ml-auto">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-sm transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Simpan & Terapkan Kredensial
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Step by Step Guide */}
        {activeTab === 'guide' && (
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <ol className="list-decimal list-inside space-y-3">
              <li className="leading-relaxed">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Buat Proyek Supabase Baru:</span>
                <p className="ml-5 text-xs text-slate-500 mt-0.5">
                  Buka{' '}
                  <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-teal-600 underline inline-flex items-center gap-0.5">
                    supabase.com <ExternalLink className="w-3 h-3" />
                  </a>
                  , buat proyek baru dengan region terdekat (misal Singapore), dan catat database password Anda.
                </p>
              </li>
              <li className="leading-relaxed">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Jalankan Migrasi Database SQL:</span>
                <p className="ml-5 text-xs text-slate-500 mt-0.5">
                  Buka menu <b>SQL Editor</b> di dashboard Supabase. Salin dan jalankan skrip dari tab <b>File Migrasi SQL</b> (01_initial_schema.sql & 02_security_rls.sql).
                </p>
              </li>
              <li className="leading-relaxed">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Konfigurasi Storage Bucket:</span>
                <p className="ml-5 text-xs text-slate-500 mt-0.5">
                  Skrip migrasi sudah otomatis membuat bucket privat bernama <code>simpkl_documents</code> dengan batas 10MB dan URL sementara (signed URLs).
                </p>
              </li>
              <li className="leading-relaxed">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Dapatkan API Keys:</span>
                <p className="ml-5 text-xs text-slate-500 mt-0.5">
                  Buka <b>Project Settings &gt; API</b>. Salin <b>Project URL</b> dan <b>anon public key</b>, lalu tempelkan ke tab <i>Koneksi & Status</i> di atas atau file <code>.env.local</code>.
                </p>
              </li>
            </ol>
          </div>
        )}

        {/* Tab 3: SQL Script View */}
        {activeTab === 'sql' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500">File tersedia di folder proyek: <code>supabase/migrations/</code></p>
              <button
                onClick={() =>
                  copyToClipboard(
                    `-- Lihat file supabase/migrations/01_initial_schema.sql dan 02_security_rls.sql di direktori proyek SIMPKL`,
                    'Lokasi file SQL'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                {copied === 'Lokasi file SQL' ? 'Disalin!' : 'Salin Info Path'}
              </button>
            </div>
            <div className="bg-slate-950 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-64 border border-slate-800">
              <pre>{`-- File: supabase/migrations/01_initial_schema.sql
-- Berisi struktur 11 tabel SIMPKL + foreign keys + indeks + 4 triggers validasi aturan bisnis:
-- 1. validate_placement_supervisor (pembimbing industri harus sesuai mitra)
-- 2. validate_placement_overlap (pencegahan benturan tanggal siswa)
-- 3. validate_partner_quota (pemeriksaan kuota mitra per periode)
-- 4. prevent_hard_delete (larangan penghapusan fisik jika ada riwayat penempatan)

-- File: supabase/migrations/02_security_rls.sql
-- Berisi kebijakan Row Level Security (RLS) untuk 4 peran:
-- Admin, Operator, Pembimbing Sekolah, Kepala Sekolah, serta Storage bucket simpkl_documents.`}</pre>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
