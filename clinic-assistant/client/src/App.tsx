import React, { useState } from 'react';
import { Sidebar } from './components/layout/Sidebar.js';
import { Header } from './components/layout/Header.js';
import { Dashboard } from './pages/Dashboard.js';
import { AppointmentsPage } from './pages/AppointmentsPage.js';
import { PatientsPage } from './pages/PatientsPage.js';
import { QueuePage } from './pages/QueuePage.js';
import { DoctorsPage } from './pages/DoctorsPage.js';
import { WalkInsPage } from './pages/WalkInsPage.js';
import { PharmacyPage } from './pages/PharmacyPage.js';
import { SettingsPage } from './pages/SettingsPage.js';
import { ToastContainer } from './components/common/Toast.js';
import { ClinicProvider, useClinic } from './context/ClinicContext.js';
import { AssistantLoginScreen } from './components/auth/AssistantLoginScreen.js';
import { SplashScreen } from './components/auth/SplashScreen.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';

const AppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isOpenMobile, setIsOpenMobile] = useState<boolean>(false);

  const { toasts, removeToast } = useClinic();

  const getPageTitle = () => {
    switch (activeTab) {
      case 'appointments':
        return "Today's Appointments";
      case 'patients':
        return 'Patient Directory';
      case 'queue':
        return 'Waiting Queue Management';
      case 'doctors':
        return 'Doctor Roster & Availability';
      case 'walk-ins':
        return 'Walk-In Patient Intake';
      case 'pharmacy':
        return 'Digital Pharmacy & Stock Management';
      case 'settings':
        return 'Station & Clinic Settings';
      default:
        return 'Clinic Dashboard';
    }
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] overflow-hidden font-sans">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isOpenMobile}
        setIsOpenMobile={setIsOpenMobile}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenMobileSidebar={() => setIsOpenMobile(true)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          pageTitle={getPageTitle()}
        />

        {/* Dynamic Page Content with Scroll */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && (
              <Dashboard
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            )}

            {activeTab === 'appointments' && (
              <AppointmentsPage
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            )}

            {activeTab === 'patients' && (
              <PatientsPage
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            )}

            {activeTab === 'queue' && (
              <QueuePage
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            )}

            {activeTab === 'doctors' && (
              <DoctorsPage
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            )}

            {activeTab === 'walk-ins' && (
              <WalkInsPage
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            )}

            {activeTab === 'pharmacy' && (
              <PharmacyPage
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
              />
            )}

            {activeTab === 'settings' && <SettingsPage />}
          </div>
        </main>
      </div>

      {/* Centralized Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};

const MainRoot: React.FC = () => {
  const [showSplash, setShowSplash] = useState<boolean>(true);
  const {
    isAuthenticated,
    isSplashTriggered,
    clearSplashTrigger,
    toasts,
    removeToast,
  } = useClinic();

  if (showSplash || isSplashTriggered) {
    return (
      <SplashScreen
        onComplete={() => {
          setShowSplash(false);
          clearSplashTrigger();
        }}
        duration={1200}
      />
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <AssistantLoginScreen />
        <ToastContainer toasts={toasts} onDismiss={removeToast} />
      </>
    );
  }

  return <AppContent />;
};

export const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ClinicProvider>
        <MainRoot />
      </ClinicProvider>
    </ErrorBoundary>
  );
};

export default App;

