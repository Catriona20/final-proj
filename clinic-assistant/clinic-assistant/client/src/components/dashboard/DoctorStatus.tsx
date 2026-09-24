import React from 'react';
import { Stethoscope, User, DoorOpen } from 'lucide-react';
import { Doctor, DoctorStatus as DocStatusType } from '../../types/doctor.js';

interface DoctorStatusProps {
  doctors: Doctor[];
}

export const DoctorStatus: React.FC<DoctorStatusProps> = ({ doctors }) => {
  const statusStyles: Record<
    DocStatusType,
    { label: string; badgeBg: string; text: string; border: string; dot: string }
  > = {
    AVAILABLE: {
      label: 'AVAILABLE',
      badgeBg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    BUSY: {
      label: 'BUSY',
      badgeBg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    OFFLINE: {
      label: 'OFFLINE',
      badgeBg: 'bg-slate-100',
      text: 'text-slate-500',
      border: 'border-slate-300',
      dot: 'bg-slate-400',
    },
  };

  const availableCount = doctors.filter((d) => d.status === 'AVAILABLE').length;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <Stethoscope className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Doctor Status</h2>
            <p className="text-xs text-slate-500">Real-time availability and patient load</p>
          </div>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full border border-emerald-200">
          {availableCount} / {doctors.length} Online
        </span>
      </div>

      {/* Doctor Cards / List */}
      <div className="divide-y divide-slate-100 my-2 max-h-[380px] overflow-y-auto pr-1">
        {doctors.map((doctor) => {
          const style = statusStyles[doctor.status] || statusStyles.OFFLINE;

          return (
            <div
              key={doctor.id}
              className="py-3.5 flex items-center justify-between hover:bg-slate-50/60 px-2 rounded-xl transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-sm shrink-0">
                  {doctor.name.replace('Dr. ', '').substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                    {doctor.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    <span className="text-teal-700 font-medium">{doctor.specialization}</span>
                    {doctor.roomNumber && (
                      <span className="flex items-center gap-1 text-slate-400">
                        • <DoorOpen className="w-3 h-3 inline" /> {doctor.roomNumber}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-medium text-slate-500 block">
                    {doctor.currentPatients} {doctor.currentPatients === 1 ? 'patient' : 'patients'}
                  </span>
                </div>

                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wider border ${style.badgeBg} ${style.text} ${style.border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                  {style.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
