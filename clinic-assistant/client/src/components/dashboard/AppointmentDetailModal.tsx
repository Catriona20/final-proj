import React from 'react';
import { X, Calendar, Clock, Stethoscope, User, Phone, FileText, CheckCircle2 } from 'lucide-react';
import { Appointment } from '../../types/appointment.js';

interface AppointmentDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointment: Appointment | null;
  onCheckIn?: (appointment: Appointment) => void;
}

export const AppointmentDetailModal: React.FC<AppointmentDetailModalProps> = ({
  isOpen,
  onClose,
  appointment,
  onCheckIn,
}) => {
  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="bg-white rounded-3xl shadow-modal max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in-50 zoom-in-95"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Appointment Details</h3>
              <p className="text-xs text-slate-500">ID: {appointment.id}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-sm text-slate-700">
          <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div>
              <span className="text-xs text-slate-400 font-medium block">Patient Name</span>
              <span className="font-bold text-slate-900 text-sm mt-0.5 block">{appointment.patientName}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">Patient ID</span>
              <span className="font-mono text-slate-700 text-xs mt-0.5 block">{String(appointment.patientId || '')}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">Assigned Doctor</span>
              <span className="font-medium text-slate-900 text-sm mt-0.5 block">{typeof appointment.doctorName === 'string' ? appointment.doctorName : 'Doctor'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">Scheduled Time</span>
              <span className="font-mono font-bold text-teal-700 text-sm mt-0.5 block">
                {typeof appointment.time === 'object' && appointment.time ? (appointment.time as any).time || (appointment.time as any).slot : appointment.time || '09:00 AM'}
              </span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">Appointment Type</span>
              <span className="font-medium text-slate-800 text-xs mt-0.5 block">{typeof appointment.type === 'string' ? appointment.type : 'Consultation'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 font-medium block">Current Status</span>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {typeof appointment.status === 'object' && appointment.status ? (appointment.status as any).status : appointment.status || 'BOOKED'}
              </span>
            </div>
          </div>

          {appointment.notes && (
            <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100">
              <span className="text-xs font-bold text-teal-900 block mb-1">Reception Notes</span>
              <p className="text-xs text-slate-600">{appointment.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Close
            </button>
            {appointment.status === 'BOOKED' && onCheckIn && (
              <button
                onClick={() => {
                  onClose();
                  onCheckIn(appointment);
                }}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Check In Now</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
