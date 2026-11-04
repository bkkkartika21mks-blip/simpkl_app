import React, { useState } from 'react';
import {
  Menu,
  Moon,
  Sun,
  Database,
  Calendar,
  LogOut,
  ChevronDown,
  UserCheck,
  Shield,
  Layers,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { usePeriod } from '../../context/PeriodContext';
import { isSupabaseConfigured } from '../../services/supabaseClient';
import { UserRole } from '../../types/database';

interface NavbarProps {
  onOpenMobileMenu: () => void;
  onOpenSetupGuide: () => void;
  onOpenPublicView: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenMobileMenu, onOpenSetupGuide, onOpenPublicView }) => {
  const { user, role, switchRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { periods, selectedPeriodId, setSelectedPeriodId } = usePeriod();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const rolesList: { id: UserRole; label: string; desc: string }[] = [
    { id: 'admin', label: 'Admin', desc: 'Akses penuh data, akun, & pengaturan' },
    { id: 'operator', label: 'Operator', desc: 'Kelola data operasional PKL' },
    { id: 'school_supervisor', label: 'Pembimbing Sekolah', desc: 'Lihat bimbingan & isi monitoring' },
    { id: 'headmaster', label: 'Kepala Sekolah', desc: 'Lihat dashboard & laporan (read-only)' },
  ];

  return (
    <header className="sticky top-0 z-20 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6">
        {/* Left: Mobile hamburger & Period selector */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Buka menu navigasi"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Period Selector */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs">
            <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="font-medium text-slate-500 dark:text-slate-400">Periode:</span>
            <select
              value={selectedPeriodId}
              onChange={e => setSelectedPeriodId(e.target.value)}
              className="bg-transparent font-semibold text-slate-800 dark:text-slate-100 focus:outline-none cursor-pointer"
            >
              {periods.map(p => (
                <option key={p.id} value={p.id} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {p.name} {p.is_active ? '(Aktif)' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right: Quick Role Switcher, Database Status, Theme Toggle, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Database Setup Button / Status Pill */}
          <button
            onClick={onOpenSetupGuide}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
              isSupabaseConfigured
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 hover:bg-amber-100'
            }`}
            title="Klik untuk membuka Pengaturan & Panduan Koneksi Supabase"
          >
            <Database className="w-3.5 h-3.5" />
            <span className="hidden md:inline">
              {isSupabaseConfigured ? 'Supabase Terhubung' : 'Simulasi Lokal Aktif'}
            </span>
          </button>

          {/* User Info (Desktop) */}
          <div className="hidden lg:flex flex-col text-right pr-1">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight truncate max-w-[180px]">
              {user?.name || (role === 'admin' ? 'Administrator SIMPKL' : 'Operator PKL')}
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate max-w-[180px]">
              {user?.email || (role === 'admin' ? 'admin@simpkl.id' : 'operator@simpkl.id')}
            </span>
          </div>

          {/* Role Switcher Pill (Testing / Evaluation) */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 hover:bg-teal-100 transition-colors"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="capitalize">{role.replace('_', ' ')}</span>
              <ChevronDown className="w-3 h-3 text-teal-600" />
            </button>

            {roleMenuOpen && (
              <div
                className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                onClick={() => setRoleMenuOpen(false)}
              >
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  Uji Hak Akses Pengguna
                </div>
                {rolesList.map(r => (
                  <button
                    key={r.id}
                    onClick={() => switchRole(r.id)}
                    className={`w-full text-left px-3.5 py-2 text-xs transition-colors flex flex-col ${
                      role === r.id
                        ? 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{r.label}</span>
                      {role === r.id && <span className="text-[10px] bg-teal-600 text-white px-1.5 py-0.2 rounded font-bold">Aktif</span>}
                    </div>
                    <span className="text-[10px] text-slate-400 font-normal mt-0.5">{r.desc}</span>
                  </button>
                ))}

                {/* View Publik Entry in Dropdown */}
                <div className="pt-1.5 mt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={onOpenPublicView}
                    className="w-full text-left px-3.5 py-2 text-xs transition-colors flex items-center justify-between text-teal-600 dark:text-teal-400 hover:bg-teal-50/50 dark:hover:bg-teal-950/30"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                      <div>
                        <div className="font-bold">View Publik (Siswa / Wali)</div>
                        <div className="text-[10px] text-slate-400 font-normal">Portal info PKL & cek status siswa</div>
                      </div>
                    </div>
                    <span className="text-[9px] bg-teal-100 dark:bg-teal-900/60 text-teal-800 dark:text-teal-300 px-1.5 py-0.5 rounded font-bold">
                      Tamu
                    </span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Direct Quick View Publik Button */}
          <button
            onClick={onOpenPublicView}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors"
            title="Buka Portal Publik Siswa & Tamu"
          >
            <Globe className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
            <span className="hidden md:inline">View Publik</span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Ganti mode terang/gelap"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Logout Button */}
          <button
            onClick={logout}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
            title="Keluar"
            aria-label="Keluar"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
