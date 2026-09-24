import React, { useState, useEffect } from 'react';
import { X, Search, CheckCircle2, UserCheck, Stethoscope, Clock, Phone, AlertCircle } from 'lucide-react';
import { Appointment } from '../../types/appointment.js';
import { Doctor } from '../../types/doctor.js';

interface CheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  appointments: Appointment[];
  doctors: Doctor[];
  selectedAppointment?: Appointment | null;
  onConfirmCheckIn: (appointmentId: string, doctorId: string, notes?: string) => void | Promise<void>;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  isOpen,
  onClose,
  appointments,
  doctors,
  selectedAppointment,
  onConfirmCheckIn,
}) => {
  const [search, setSearch] = useState<string>('');
  const [activeAppointmentId, setActiveAppointmentId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const bookedAppointments = appointments.filter((a) => a.status === 'BOOKED');

  useEffect(() => {
    if (selectedAppointment) {
      setActiveAppointmentId(selectedAppointment.id);
      setSelectedDoctorId(selectedAppointment.doctorId);
      setSearch(selectedAppointment.patientName);
    } else if (bookedAppointments.length > 0) {
      setActiveAppointmentId(bookedAppointments[0].id);
      setSelectedDoctorId(bookedAppointments[0].doctorId);
    }
  }, [selectedAppointment, isOpen]);

  if (!isOpen) return null;

  const currentApt = appointments.find((a) => a.id === activeAppointmentId);

  const filteredBooked = bookedAppointments.filter(
    (apt) =>
      apt.patientName.toLowerCase().includes(search.toLowerCase()) ||
      apt.doctorName.toLowerCase().includes(search.toLowerCase()) ||
      apt.id.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAppointmentId) {
      setError('Please select a patient appointment to check in.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onConfirmCheckIn(activeAppointmentId, selectedDoctorId, notes);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to check in patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
      <div
        className="bg-white rounded-3xl shadow-modal max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in-50 zoom-in-95"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Patient Check-In</h3>
              <p className="text-xs text-slate-500">Confirm arrival and transfer to waiting queue</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 rounded-xl border border-rose-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Search Patient */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Search Booked Patient
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by patient name or doctor..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Appointment Selection List */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Appointment ({filteredBooked.length} available)
            </label>
            <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 rounded-xl p-1.5 bg-slate-50/50">
              {filteredBooked.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  No booked appointments matching criteria
                </p>
              ) : (
                filteredBooked.map((apt) => (
                  <button
                    key={apt.id}
                    type="button"
                    onClick={() => {
                      setActiveAppointmentId(apt.id);
                      setSelectedDoctorId(apt.doctorId);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left text-xs transition-all ${
                      activeAppointmentId === apt.id
                        ? 'bg-teal-50 border border-teal-300 text-teal-950 font-semibold'
                        : 'bg-white hover:bg-slate-100 border border-slate-200 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-slate-900">{apt.patientName}</span>
                      <span className="text-slate-400 ml-2 font-mono">({apt.time})</span>
                    </div>
                    <span className="text-slate-500">{apt.doctorName}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Patient Details Card */}
          {currentApt && (
            <div className="p-3.5 bg-teal-50/50 rounded-xl border border-teal-100 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-950">{currentApt.patientName}</span>
                <span className="text-[11px] font-mono bg-teal-100/80 text-teal-800 px-2 py-0.5 rounded-md font-semibold">
                  {currentApt.time}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                  <span>{currentApt.doctorName}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-600" />
                  <span>Type: {currentApt.type}</span>
                </div>
              </div>
            </div>
          )}

          {/* Assigned Doctor Override / Confirm */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assigned Doctor
            </label>
            <select
              value={selectedDoctorId}
              onChange={(e) => setSelectedDoctorId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} — {doc.specialization} ({doc.status})
                </option>
              ))}
            </select>
          </div>

          {/* Optional Receptionist Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Triage / Reception Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Arrived 10 mins early, vitals normal"
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
            />
          </div>

          {/* Modal Footer Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !activeAppointmentId}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white shadow-xs transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isSubmitting ? 'Checking In...' : 'Confirm Check-in'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
