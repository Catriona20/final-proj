import React, { useState } from 'react';
import { X, Footprints, AlertCircle, PlusCircle } from 'lucide-react';
import { Doctor } from '../../types/doctor.js';
import { QueuePriority } from '../../types/queue.js';

interface WalkInModalProps {
  isOpen: boolean;
  onClose: () => void;
  doctors: Doctor[];
  onAddWalkIn: (walkIn: {
    patientName: string;
    phone: string;
    reason: string;
    preferredDoctor: string;
    priority: QueuePriority;
  }) => void | Promise<void>;
}

export const WalkInModal: React.FC<WalkInModalProps> = ({
  isOpen,
  onClose,
  doctors,
  onAddWalkIn,
}) => {
  const [patientName, setPatientName] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [preferredDoctor, setPreferredDoctor] = useState<string>(
    doctors[0]?.name || 'Dr. Sarah Lee'
  );
  const [priority, setPriority] = useState<QueuePriority>('NORMAL');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim() || !phone.trim() || !reason.trim()) {
      setError('Please fill in patient name, phone, and reason for visit.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      await onAddWalkIn({
        patientName: patientName.trim(),
        phone: phone.trim(),
        reason: reason.trim(),
        preferredDoctor,
        priority,
      });
      // Reset form
      setPatientName('');
      setPhone('');
      setReason('');
      setPriority('NORMAL');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to add walk-in patient');
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
            <div className="p-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
              <Footprints className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Add Walk-in Patient</h3>
              <p className="text-xs text-slate-500">Register new unscheduled clinical arrival</p>
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

          {/* Patient Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Patient Full Name *
            </label>
            <input
              type="text"
              required
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              placeholder="e.g. Robert Brown"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +1 (555) 019-2834"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
            />
          </div>

          {/* Reason for Visit */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Visit / Symptoms *
            </label>
            <textarea
              required
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Acute sore throat, mild fever since morning"
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
            />
          </div>

          {/* Preferred Doctor */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Preferred Doctor
            </label>
            <select
              value={preferredDoctor}
              onChange={(e) => setPreferredDoctor(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
            >
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.name}>
                  {doc.name} — {doc.specialization} ({doc.status})
                </option>
              ))}
            </select>
          </div>

          {/* Priority Flag */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Triage Priority Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['NORMAL', 'URGENT', 'EMERGENCY'] as QueuePriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                    priority === p
                      ? p === 'EMERGENCY'
                        ? 'bg-rose-600 text-white border-rose-700'
                        : p === 'URGENT'
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-teal-600 text-white border-teal-700'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
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
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'Registering...' : 'Add Walk-in'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
