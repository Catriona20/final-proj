import React from 'react';
import { UserCheck, Footprints, ListOrdered, CalendarDays, Zap } from 'lucide-react';

interface QuickActionsProps {
  onCheckInPatient: () => void;
  onAddWalkIn: () => void;
  onViewQueue: () => void;
  onViewAppointments: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onCheckInPatient,
  onAddWalkIn,
  onViewQueue,
  onViewAppointments,
}) => {
  const actions = [
    {
      id: 'quick-checkin',
      title: 'Check-in Patient',
      desc: 'Verify scheduled arrival',
      icon: UserCheck,
      color: 'bg-teal-600 hover:bg-teal-700 text-white',
      border: 'border-teal-700',
      onClick: onCheckInPatient,
    },
    {
      id: 'quick-walkin',
      title: 'Add Walk-in',
      desc: 'Register unscheduled patient',
      icon: Footprints,
      color: 'bg-slate-900 hover:bg-slate-800 text-white',
      border: 'border-slate-800',
      onClick: onAddWalkIn,
    },
    {
      id: 'quick-queue',
      title: 'View Queue',
      desc: 'Monitor live waiting times',
      icon: ListOrdered,
      color: 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90',
      border: '',
      onClick: onViewQueue,
    },
    {
      id: 'quick-appointments',
      title: 'View Appointments',
      desc: 'Browse daily schedule',
      icon: CalendarDays,
      color: 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200/90',
      border: '',
      onClick: onViewAppointments,
    },
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5">
      <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
          <Zap className="w-4 h-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Reception Quick Actions</h2>
          <p className="text-[11px] text-slate-500">Fast workflow shortcuts for front desk</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <button
              key={act.id}
              id={act.id}
              onClick={act.onClick}
              className={`flex items-center gap-3.5 p-3.5 rounded-xl border transition-all duration-150 text-left shadow-xs hover:shadow-card active:scale-[0.99] ${act.color}`}
            >
              <div className="p-2.5 rounded-lg bg-black/10 shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <span className="font-semibold text-sm block leading-tight">{act.title}</span>
                <span className="text-xs opacity-80 block mt-0.5">{act.desc}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
