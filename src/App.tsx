import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar, NavItem } from './components/common/Sidebar';
import { Navbar } from './components/common/Navbar';
import { SetupGuideModal } from './components/common/SetupGuideModal';
import { LoginPage } from './pages/LoginPage';
import { PublicPortalPage } from './pages/PublicPortalPage';
import { DashboardPage } from './pages/DashboardPage';
import { StudentsPage } from './pages/StudentsPage';
import { PartnersPage } from './pages/PartnersPage';
import { SupervisorsPage } from './pages/SupervisorsPage';
import { PlacementsPage } from './pages/PlacementsPage';
import { MonitoringPage } from './pages/MonitoringPage';
import { WithdrawalsPage } from './pages/WithdrawalsPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { AuditLogsPage } from './pages/AuditLogsPage';

export const App: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState(false);
  const [isPublicView, setIsPublicView] = useState(false);

  // If in Public View mode, render PublicPortalPage
  if (isPublicView) {
    return (
      <PublicPortalPage
        onBackToDashboard={isAuthenticated ? () => setIsPublicView(false) : undefined}
        onOpenLogin={() => setIsPublicView(false)}
      />
    );
  }

  // If not authenticated, render LoginPage
  if (!isAuthenticated) {
    return (
      <>
        <LoginPage
          onOpenSetupGuide={() => setIsSetupGuideOpen(true)}
          onOpenPublicView={() => setIsPublicView(true)}
        />
        <SetupGuideModal
          isOpen={isSetupGuideOpen}
          onClose={() => setIsSetupGuideOpen(false)}
        />
      </>
    );
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return <DashboardPage onNavigate={tab => setCurrentTab(tab)} />;
      case 'students':
        return <StudentsPage />;
      case 'partners':
        return <PartnersPage />;
      case 'supervisors':
        return <SupervisorsPage />;
      case 'placements':
        return <PlacementsPage />;
      case 'monitoring':
        return <MonitoringPage />;
      case 'withdrawals':
        return <WithdrawalsPage />;
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage />;
      case 'audit':
        return <AuditLogsPage />;
      default:
        return <DashboardPage onNavigate={tab => setCurrentTab(tab)} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Desktop Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={tab => setCurrentTab(tab)}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
        onOpenPublicView={() => setIsPublicView(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        {/* Sticky Top Navbar */}
        <Navbar
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenSetupGuide={() => setIsSetupGuideOpen(true)}
          onOpenPublicView={() => setIsPublicView(true)}
        />

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-300">
          {renderContent()}
        </main>
      </div>

      {/* Database Connection & Setup Guide Modal */}
      <SetupGuideModal
        isOpen={isSetupGuideOpen}
        onClose={() => setIsSetupGuideOpen(false)}
      />
    </div>
  );
};

export default App;
