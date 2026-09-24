import React from 'react';
import { X, UserX, AlertTriangle, Clock, Stethoscope, User, ArrowRight, Bell } from 'lucide-react';
import { Appointment } from '../../types/appointment.js';

interface NoShowModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onConfirm: (appointmentId: string) => void;
}

export const NoShowModal: React.FC<NoShowModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onConfirm,
}) => {
  if (!isOpen || !appointment) return null;

  const handleConfirm = () => {
    onConfirm(appointment.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-rose-50/50">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center border border-rose-200 shadow-xs">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Mark Patient as No-Show</h2>
              <p className="text-xs text-slate-500">Release consultation slot and rebalance queue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-bold text-slate-900">{appointment.patientName}</span>
              </div>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                {appointment.id}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-1 border-t border-slate-200/60">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Slot:{' '}
                  <strong className="text-slate-900 font-mono">
                    {typeof appointment.time === 'object' && appointment.time
                      ? (appointment.time as any).time || (appointment.time as any).slot
                      : appointment.time || '09:00 AM'}
                  </strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate">{typeof appointment.doctorName === 'string' ? appointment.doctorName : 'Doctor'}</span>
              </div>
            </div>
          </div>

          {/* Automated consequence notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <Bell className="w-3.5 h-3.5 text-amber-600" />
              <span>Automated Queue & Notification Actions:</span>
            </div>
            <ul className="list-disc pl-4 space-y-1 text-amber-800 text-[11px] leading-relaxed">
              <li>Patient will be marked as <strong className="text-rose-700">NO_SHOW</strong> and removed from active queue.</li>
              <li>Subsequent waiting patients will advance by 1 position with recalculated ETAs.</li>
              <li>The next eligible patient will receive an instant <strong>Earlier Slot Offer</strong>.</li>
            </ul>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm shadow-rose-600/20 transition-colors flex items-center gap-2"
          >
            <UserX className="w-4 h-4" />
            <span>Confirm No-Show</span>
          </button>
        </div>
      </div>
    </div>
  );
};
