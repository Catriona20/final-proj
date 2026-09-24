import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Bell,
  Menu,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Sparkles,
  ArrowRight,
  Check,
  X,
  Trash2,
  Building2,
  ChevronDown,
  LogOut
} from 'lucide-react';
import { useClinic } from '../../context/ClinicContext.js';
import { ClinicRegistrationModal } from './ClinicRegistrationModal.js';
import { DemoTimeController } from '../common/DemoTimeController.js';

interface HeaderProps {
  onOpenMobileSidebar: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  pageTitle?: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMobileSidebar,
  searchQuery,
  setSearchQuery,
  pageTitle = 'Clinic Dashboard',
}) => {
  const {
    activeClinic,
    activeClinicId,
    operator,
    notifications,
    unreadNotificationsCount,
    acceptEarlierSlot,
    declineEarlierSlot,
    markNotificationAsRead,
    clearAllNotifications,
    logoutAssistant,
  } = useClinic();

  const [currentDateStr, setCurrentDateStr] = useState<string>('');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      };
      setCurrentDateStr(now.toLocaleDateString('en-US', options));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-18 px-4 sm:px-8 bg-white border-b border-slate-200/80 shadow-xs">
      {/* Left: Mobile Menu Toggle, Title & Active Facility Switcher */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobileSidebar}
          className="lg:hidden p-2 text-slate-500 rounded-lg hover:bg-slate-100 hover:text-slate-700 transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">{pageTitle}</h1>
            <button
              onClick={() => setIsFacilityModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold bg-teal-50 text-teal-800 rounded-xl border border-teal-200 hover:bg-teal-100 transition-colors cursor-pointer shadow-2xs"
              title="Click to Switch Facility or Register New Clinic"
            >
              <Building2 className="w-3.5 h-3.5 text-teal-600" />
              <span className="max-w-[180px] truncate">{activeClinic?.name || 'MetroCare Primary Health'}</span>
              <ChevronDown className="w-3 h-3 text-teal-600" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{currentDateStr || 'Today'}</span>
            <span className="text-slate-300">•</span>
            <span className="text-[11px] font-mono text-slate-400">ID: {activeClinicId}</span>
          </div>
        </div>
      </div>

      {/* Center/Right: Search Bar & Actions */}
      <div className="flex items-center gap-3 sm:gap-5">
        {/* Demo Time Simulator Controller (Dev / Demo Only) */}
        <DemoTimeController />

        {/* Global Search Bar */}
        <div className="relative hidden md:block w-64 lg:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search patient, doctor, or ID..."
            className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="notification-bell-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2.5 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200/70 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotificationsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-white">
                {unreadNotificationsCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-slate-200 p-4 z-50 animate-in fade-in-50 zoom-in-95 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900">Clinic Push Alerts</span>
                  {unreadNotificationsCount > 0 && (
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-800 rounded-full">
                      {unreadNotificationsCount} New
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <button
                      onClick={clearAllNotifications}
                      className="text-[11px] text-slate-400 hover:text-rose-600 transition-colors"
                    >
                      Clear All
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded-lg"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="divide-y divide-slate-100 my-1 overflow-y-auto max-h-96 pr-1 space-y-2">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400">
                    <Bell className="w-7 h-7 mx-auto text-slate-300 mb-1.5" />
                    <p className="text-xs font-semibold text-slate-600">No active notifications</p>
                    <p className="text-[11px] text-slate-400">No-show reallocations will alert here</p>
                  </div>
                ) : (
                  notifications.map((n) => {
                    const isEarlierSlot = n.type === 'EARLIER_SLOT';
                    const isPending = n.status === 'PENDING';

                    return (
                      <div
                        key={n.id}
                        className={`p-3 rounded-2xl transition-all border ${
                          isEarlierSlot && isPending
                            ? 'bg-amber-50/70 border-amber-200'
                            : n.type === 'NO_SHOW'
                            ? 'bg-rose-50/50 border-rose-200'
                            : 'bg-slate-50 border-slate-200/80'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {isEarlierSlot ? (
                              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                            ) : n.type === 'NO_SHOW' ? (
                              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                            ) : (
                              <Clock className="w-4 h-4 text-blue-500 shrink-0" />
                            )}
                            <p className="text-xs font-bold text-slate-900 leading-tight">
                              {n.title}
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            {n.createdAt}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 mt-1 leading-snug">
                          {n.message}
                        </p>

                        {isEarlierSlot && n.originalSlot && n.offeredSlot && (
                          <div className="mt-2 p-2 bg-white rounded-xl border border-amber-200/80 flex items-center justify-between text-xs font-medium">
                            <span className="text-slate-400 line-through font-mono">{n.originalSlot}</span>
                            <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                            <span className="text-emerald-700 font-bold font-mono">{n.offeredSlot}</span>
                          </div>
                        )}

                        {isEarlierSlot && isPending && (
                          <div className="mt-2.5 pt-2 border-t border-amber-200/60 flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => declineEarlierSlot(n.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 bg-white hover:bg-slate-100 rounded-lg border border-slate-200"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => acceptEarlierSlot(n.id)}
                              className="px-3 py-1 text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg shadow-xs flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Accept</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Receptionist Profile Card */}
        <div className="flex items-center gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-400 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {operator?.initials || (operator?.name ? operator.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() : 'OP')}
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
          </div>

          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1">
              <span className="text-sm font-semibold text-slate-900 leading-tight">
                {operator?.name || 'Staff Receptionist'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-500">
              <UserCheck className="w-3 h-3 text-teal-600" />
              <span className="font-medium text-teal-700">{operator?.role || 'Receptionist'}</span>
            </div>
          </div>

          <button
            onClick={logoutAssistant}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
            title="Log Out Assistant Session"
            aria-label="Log Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <ClinicRegistrationModal
        isOpen={isFacilityModalOpen}
        onClose={() => setIsFacilityModalOpen(false)}
      />
    </header>
  );
};
