import React from 'react';
import { AppRole, Patient, Doctor, Clinic } from '../types';
import { 
  Activity, 
  Smartphone, 
  Stethoscope, 
  Building2, 
  Cpu, 
  Bell, 
  Moon, 
  Sun, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

interface AppHeaderProps {
  currentRole: AppRole;
  setRole: (role: AppRole) => void;
  activePatient: Patient;
  activeDoctor: Doctor;
  activeClinic: Clinic;
  allClinics: Clinic[];
  setSelectedClinicId: (id: string) => void;
  unreadNotificationCount: number;
  onOpenNotifications: () => void;
  isDarkMode: boolean;
  setIsDarkMode: (dark: boolean) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  currentRole,
  setRole,
  activePatient,
  activeDoctor,
  activeClinic,
  allClinics,
  setSelectedClinicId,
  unreadNotificationCount,
  onOpenNotifications,
  isDarkMode,
  setIsDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-white/80 dark:bg-slate-900/85 border-b border-slate-200/80 dark:border-slate-800 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Platform Title */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setRole('patient')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-healthcare-500 to-healthcare-300 flex items-center justify-center text-white shadow-floating transform transition hover:scale-105">
              <Activity className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white font-sans">
                  Healthcare<span className="text-healthcare-500">AI</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-healthcare-100 text-healthcare-700 dark:bg-healthcare-900/50 dark:text-healthcare-300 border border-healthcare-200 dark:border-healthcare-800">
                  <Sparkles className="w-3 h-3 mr-1" /> Enterprise
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                Multi-Clinic Platform & Triage Engine
              </p>
            </div>
          </div>

          {/* App Switcher Tabs */}
          <nav className="flex items-center bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-2xl border border-slate-200/50 dark:border-slate-700">
            <button
              onClick={() => setRole('patient')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                currentRole === 'patient'
                  ? 'bg-white dark:bg-slate-900 text-healthcare-600 dark:text-healthcare-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden md:inline">Patient App</span>
            </button>

            <button
              onClick={() => setRole('doctor')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                currentRole === 'doctor'
                  ? 'bg-white dark:bg-slate-900 text-healthcare-600 dark:text-healthcare-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Stethoscope className="w-4 h-4" />
              <span className="hidden md:inline">Doctor App</span>
            </button>

            <button
              onClick={() => setRole('clinic')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                currentRole === 'clinic'
                  ? 'bg-white dark:bg-slate-900 text-healthcare-600 dark:text-healthcare-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span className="hidden md:inline">Clinic Dashboard</span>
            </button>

            <button
              onClick={() => setRole('ai-inspector')}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                currentRole === 'ai-inspector'
                  ? 'bg-healthcare-500 text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span className="hidden md:inline">AI Engine</span>
            </button>
          </nav>

          {/* Right Actions & Active Context */}
          <div className="flex items-center space-x-3">

            {/* Clinic Switcher Selector */}
            <div className="hidden lg:flex items-center relative bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-1 text-xs">
              <Building2 className="w-3.5 h-3.5 text-healthcare-500 mr-1.5" />
              <select
                value={activeClinic.id}
                onChange={(e) => setSelectedClinicId(e.target.value)}
                className="bg-transparent font-medium text-slate-800 dark:text-slate-200 border-none focus:outline-none cursor-pointer pr-4"
              >
                {allClinics.map(c => (
                  <option key={c.id} value={c.id} className="text-slate-900 dark:bg-slate-800 dark:text-white">
                    {c.name} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Notifications Button */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadNotificationCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-healthcare-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                  {unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Active User Avatar Pill */}
            <div className="flex items-center space-x-2 pl-2 border-l border-slate-200 dark:border-slate-700">
              <img
                src={
                  currentRole === 'doctor' 
                    ? activeDoctor.avatar 
                    : activePatient.avatar
                }
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover ring-2 ring-healthcare-200 dark:ring-healthcare-900"
              />
              <div className="hidden xl:block text-left text-xs">
                <p className="font-semibold text-slate-900 dark:text-white leading-tight">
                  {currentRole === 'doctor' ? activeDoctor.name : activePatient.name}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  {currentRole === 'doctor' ? activeDoctor.specialization : activePatient.city}
                </p>
              </div>
            </div>

          </div>

        </div>
      </div>
    </header>
  );
};
