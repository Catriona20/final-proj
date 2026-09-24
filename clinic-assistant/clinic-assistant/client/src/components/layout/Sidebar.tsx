import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ListOrdered,
  Stethoscope,
  Footprints,
  Settings,
  Activity,
  X,
  Sparkles
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext.js';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile: boolean;
  setIsOpenMobile: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  setIsOpenMobile,
}) => {
  const { appointments, patients, queue, doctors, walkIns } = useClinic();

  const waitingCount = queue.filter((q) => q.status === 'WAITING').length;
  const availableDoctors = doctors.filter((d) => d.status === 'AVAILABLE').length;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'appointments', label: 'Appointments', icon: CalendarDays, badge: String(appointments.length) },
    { id: 'patients', label: 'Patients', icon: Users, badge: String(patients.length) },
    {
      id: 'queue',
      label: 'Queue',
      icon: ListOrdered,
      badge: waitingCount > 0 ? `${waitingCount} Live` : 'Live',
      isLive: true,
    },
    {
      id: 'doctors',
      label: 'Doctors',
      icon: Stethoscope,
      badge: `${availableDoctors} Online`,
    },
    { id: 'walk-ins', label: 'Walk-ins', icon: Footprints, badge: String(walkIns.length) },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsOpenMobile(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsOpenMobile(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between h-18 px-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-teal-500 text-white shadow-lg shadow-teal-500/20 font-bold">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold tracking-tight text-white text-lg">CareFlow</span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-teal-500/20 text-teal-400 rounded-md border border-teal-500/30">
                  CLINIC
                </span>
              </div>
              <p className="text-xs text-slate-400">Reception & Triage</p>
            </div>
          </div>

          <button
            onClick={() => setIsOpenMobile(false)}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Clinic Modules
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`nav-${item.id}`}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-sm shadow-teal-700/50 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[11px] font-semibold rounded-full ${
                      isActive
                        ? 'bg-teal-700/80 text-teal-100'
                        : item.isLive
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 group-hover:text-slate-300'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Shift / Module 1 Status Card */}
        <div className="p-4 m-3 rounded-xl bg-slate-800/60 border border-slate-700/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-200">Active Shift</span>
            </div>
            <span className="text-[10px] font-mono bg-slate-700/80 text-slate-300 px-1.5 py-0.5 rounded">
              STATION 01
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight">
            Front Desk #1 • Morning Shift
          </p>
          <div className="mt-2.5 pt-2 border-t border-slate-700/60 flex items-center gap-1.5 text-[11px] text-teal-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Demonstration Model Active</span>
          </div>
        </div>
      </aside>
    </>
  );
};
