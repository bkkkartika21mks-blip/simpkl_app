import React from 'react';
import {
  LayoutDashboard,
  Users,
  Building2,
  UserCheck,
  Briefcase,
  ClipboardCheck,
  CalendarCheck,
  FileText,
  Settings,
  History,
  GraduationCap,
  X,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export type NavItem =
  | 'dashboard'
  | 'students'
  | 'partners'
  | 'supervisors'
  | 'placements'
  | 'monitoring'
  | 'withdrawals'
  | 'reports'
  | 'settings'
  | 'audit';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenPublicView?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  onOpenPublicView,
}) => {
  const { role, isSupervisor } = useAuth();

  const navItems: { id: NavItem; label: string; icon: React.FC<{ className?: string }>; roleMin?: string }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'students', label: 'Data Siswa', icon: Users },
    { id: 'partners', label: 'Mitra PKL (DU/DI)', icon: Building2 },
    { id: 'supervisors', label: 'Pembimbing', icon: UserCheck },
    { id: 'placements', label: 'Penempatan', icon: Briefcase },
    { id: 'monitoring', label: 'Monitoring Kunjungan', icon: ClipboardCheck },
    { id: 'withdrawals', label: 'Penarikan & Selesai', icon: CalendarCheck },
    { id: 'reports', label: 'Laporan & Rekap', icon: FileText },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
    { id: 'audit', label: 'Audit Trail', icon: History },
  ];

  const handleNavClick = (tab: NavItem) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full bg-[#0F172A] text-slate-300">
      {/* Brand Logo & Name */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shadow-sm shadow-teal-500/10">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-extrabold tracking-tight text-white">SIMPKL</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30">
                PRO
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Sistem Praktik Kerja Lapangan</p>
          </div>
        </div>
        <button
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Tutup menu navigasi"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Menu Utama
        </div>
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;

          // Pembimbing sekolah gets streamlined focus, but can access pages
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-600 text-white font-semibold shadow-md shadow-teal-600/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-colors ${
                  isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              <span>{item.label}</span>
              {item.id === 'monitoring' && isSupervisor && (
                <span className="ml-auto text-[10px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded-full font-semibold">
                  Tugas
                </span>
              )}
            </button>
          );
        })}
        {/* Public View Shortcut */}
        {onOpenPublicView && (
          <div className="pt-2 mt-2 border-t border-slate-800">
            <button
              onClick={() => {
                onOpenPublicView();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-teal-400 hover:text-teal-300 hover:bg-teal-950/40 border border-teal-500/20 transition-all"
            >
              <Globe className="w-4 h-4 text-teal-400" />
              <span>Portal View Publik</span>
              <span className="ml-auto text-[9px] bg-teal-500/20 text-teal-300 px-1.5 py-0.5 rounded font-bold">
                Tamu
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Role Indicator Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0">
            {role === 'admin'
              ? 'AD'
              : role === 'operator'
              ? 'OP'
              : role === 'school_supervisor'
              ? 'PB'
              : 'KS'}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-white truncate">
              {role === 'admin'
                ? 'Administrator'
                : role === 'operator'
                ? 'Operator PKL'
                : role === 'school_supervisor'
                ? 'Pembimbing Sekolah'
                : 'Kepala Sekolah'}
            </p>
            <p className="text-[10px] text-teal-400 capitalize">Akses: {role.replace('_', ' ')}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 h-screen fixed left-0 top-0 z-30 shadow-xl shadow-slate-900/10">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative w-72 max-w-[80vw] h-full shadow-2xl z-10">{navContent}</div>
        </div>
      )}
    </>
  );
};
