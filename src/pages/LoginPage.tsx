import React, { useState } from 'react';
import {
  GraduationCap,
  Lock,
  Mail,
  Shield,
  ArrowRight,
  Database,
  Globe,
  UserCheck,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { isSupabaseConfigured } from '../services/supabaseClient';
import { UserRole } from '../types/database';

interface LoginPageProps {
  onOpenSetupGuide: () => void;
  onOpenPublicView?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onOpenSetupGuide, onOpenPublicView }) => {
  const { login, isLoading } = useAuth();
  const { error, success } = useToast();

  const [email, setEmail] = useState('admin@simpkl.id');
  const [password, setPassword] = useState('admin123');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanInput = email.trim();
    if (!cleanInput) {
      error('Input Tidak Valid', 'Email atau nama pengguna wajib diisi.');
      return;
    }

    // Auto-normalize short usernames
    if (!cleanInput.includes('@')) {
      const lower = cleanInput.toLowerCase();
      if (lower === 'admin') cleanInput = 'admin@simpkl.id';
      else if (lower === 'operator') cleanInput = 'operator@simpkl.id';
      else if (lower === 'pembimbing') cleanInput = 'ahmad.fauzi@smkn1surabaya.sch.id';
      else if (lower === 'kepsek') cleanInput = 'kepsek@smkn1surabaya.sch.id';
      else cleanInput = `${cleanInput}@simpkl.id`;
    }

    try {
      await login(cleanInput, password, selectedRole);
      success('Selamat Datang di SIMPKL', `Anda berhasil masuk sebagai ${selectedRole.replace('_', ' ')}.`);
    } catch (err: any) {
      error('Autentikasi Gagal', err.message || 'Periksa kembali email dan kata sandi Anda.');
    }
  };

  const handleRoleQuickSelect = (role: UserRole, sampleEmail: string, samplePassword: string) => {
    setSelectedRole(role);
    setEmail(sampleEmail);
    setPassword(samplePassword);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Teal Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        {/* Logo & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex w-16 h-16 rounded-2xl bg-teal-500/10 border border-teal-500/30 items-center justify-center text-teal-400 mb-4 shadow-xl shadow-teal-500/10">
            <GraduationCap className="w-9 h-9" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">SIMPKL</h2>
          <p className="text-sm text-slate-400 mt-1">
            Sistem Informasi Pengelolaan Praktik Kerja Lapangan
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-850 border border-slate-800 py-8 px-6 sm:px-10 rounded-3xl shadow-2xl space-y-6">
          {/* Service Configuration Notice */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 text-xs ${
              isSupabaseConfigured
                ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                : 'bg-amber-950/40 border-amber-800 text-amber-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 flex-shrink-0" />
              <span>{isSupabaseConfigured ? 'Supabase DB Terhubung' : 'Mode Simulasi Lokal Persisten'}</span>
            </div>
            <button
              onClick={onOpenSetupGuide}
              className="font-bold underline hover:text-white"
            >
              Pengaturan DB
            </button>
          </div>

          {/* Quick Select Preset Accounts (Admin & Operator) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
              <span>Pilih Akun Masuk (Siap Pakai):</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {/* Admin Card */}
              <button
                type="button"
                onClick={() => handleRoleQuickSelect('admin', 'admin@simpkl.id', 'admin123')}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  selectedRole === 'admin'
                    ? 'border-teal-500 bg-teal-500/15 text-white ring-1 ring-teal-500 shadow-md'
                    : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-teal-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Administrator</span>
                  </div>
                  {selectedRole === 'admin' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                  )}
                </div>
                <div className="mt-1.5 text-[11px] font-mono text-slate-300 truncate">
                  admin@simpkl.id
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Sandi: <span className="font-mono text-slate-400">admin123</span>
                </div>
              </button>

              {/* Operator Card */}
              <button
                type="button"
                onClick={() => handleRoleQuickSelect('operator', 'operator@simpkl.id', 'operator123')}
                className={`p-3 rounded-2xl border text-left transition-all relative ${
                  selectedRole === 'operator'
                    ? 'border-teal-500 bg-teal-500/15 text-white ring-1 ring-teal-500 shadow-md'
                    : 'border-slate-800 bg-slate-900/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-sky-400">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Operator PKL</span>
                  </div>
                  {selectedRole === 'operator' && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                  )}
                </div>
                <div className="mt-1.5 text-[11px] font-mono text-slate-300 truncate">
                  operator@simpkl.id
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  Sandi: <span className="font-mono text-slate-400">operator123</span>
                </div>
              </button>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Email atau Nama Pengguna
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@simpkl.id atau ketik 'admin'"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Kata Sandi
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-slate-700 bg-slate-900 text-white placeholder-slate-500 focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            {/* Other Roles (Collapsible/Optional) */}
            <div className="pt-1">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Atau Peran Khusus Lainnya:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleRoleQuickSelect('school_supervisor', 'ahmad.fauzi@smkn1surabaya.sch.id', 'Pembimbing123!')}
                  className={`p-2 rounded-xl border text-left transition-colors ${
                    selectedRole === 'school_supervisor'
                      ? 'border-teal-500 bg-teal-500/10 text-teal-300 font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Pembimbing Sekolah
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleQuickSelect('headmaster', 'kepsek@smkn1surabaya.sch.id', 'Kepsek123!')}
                  className={`p-2 rounded-xl border text-left transition-colors ${
                    selectedRole === 'headmaster'
                      ? 'border-teal-500 bg-teal-500/10 text-teal-300 font-bold'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white'
                  }`}
                >
                  Kepala Sekolah
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all shadow-lg shadow-teal-600/30"
            >
              <span>{isLoading ? 'Memverifikasi...' : `Masuk sebagai ${selectedRole === 'admin' ? 'Administrator' : selectedRole === 'operator' ? 'Operator' : selectedRole.replace('_', ' ')}`}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Public Portal Access Button */}
          {onOpenPublicView && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={onOpenPublicView}
                className="inline-flex items-center gap-2 text-xs font-semibold text-teal-400 hover:text-teal-300 transition-colors py-2.5 px-3 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 w-full justify-center"
              >
                <Globe className="w-4 h-4 text-teal-400" />
                <span>Buka Portal Publik (Cek Status Siswa & Mitra DU/DI)</span>
              </button>
            </div>
          )}

          {/* Registration Disabled Notice */}
          <div className="pt-4 border-t border-slate-800 text-center">
            <p className="text-xs text-slate-400">
              Pendaftaran akun mandiri dinonaktifkan untuk keamanan data siswa.
              <br />
              Gunakan akun Administrator atau Operator yang disediakan di atas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
