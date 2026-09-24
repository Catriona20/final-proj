import React from 'react';
import { X, User, Phone, Mail, MapPin, Calendar, Heart, Shield, Clock, Plus } from 'lucide-react';
import { Patient } from '../../types/patient.js';

interface PatientDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient | null;
  onQuickQueue?: (patient: Patient) => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  isOpen,
  onClose,
  patient,
  onQuickQueue,
}) => {
  if (!isOpen || !patient) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-teal-50/70 via-slate-50 to-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-teal-600 text-white flex items-center justify-center text-xl font-bold shadow-md shadow-teal-600/20">
              {patient.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{patient.name}</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-teal-100 text-teal-800 rounded-md border border-teal-200">
                  {patient.id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {patient.age} yrs • {patient.gender} • Blood Group: <strong className="text-rose-600">{patient.bloodGroup || 'O+'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Contact Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                <Phone className="w-3.5 h-3.5 text-teal-600" />
                <span>Phone Number</span>
              </div>
              <p className="text-sm font-semibold text-slate-900">{patient.phone}</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                <Mail className="w-3.5 h-3.5 text-teal-600" />
                <span>Email Address</span>
              </div>
              <p className="text-sm font-semibold text-slate-900 truncate">
                {patient.email || 'None on record'}
              </p>
            </div>
          </div>

          {/* Address */}
          {patient.address && (
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                <MapPin className="w-3.5 h-3.5 text-teal-600" />
                <span>Residential Address</span>
              </div>
              <p className="text-sm text-slate-800">{patient.address}</p>
            </div>
          )}

          {/* Emergency Contact */}
          {patient.emergencyContact && (
            <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 uppercase tracking-wider mb-1">
                <Shield className="w-3.5 h-3.5 text-amber-600" />
                <span>Emergency Contact</span>
              </div>
              <p className="text-sm font-medium text-amber-950">{patient.emergencyContact}</p>
            </div>
          )}

          {/* Clinical Notes & History */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Clinical Overview & Notes
              </span>
              <span className="text-xs text-slate-400">
                Last Visit: <strong className="text-slate-700">{patient.lastVisit || 'Today'}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-200">
              {patient.notes || 'No prior conditions noted in general record.'}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Record Status: <strong className="text-emerald-700 font-semibold">{patient.status || 'Active'}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            {onQuickQueue && (
              <button
                onClick={() => {
                  onQuickQueue(patient);
                  onClose();
                }}
                className="px-4 py-2 text-xs font-bold rounded-xl bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add to Queue</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
