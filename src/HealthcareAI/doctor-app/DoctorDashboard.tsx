import React, { useState } from 'react';
import { Doctor, Appointment, Patient, Clinic } from '../types';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  Stethoscope, 
  Users, 
  Clock, 
  Calendar, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  Power, 
  Pill, 
  FileText, 
  TrendingUp, 
  Plus,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface DoctorDashboardProps {
  doctor: Doctor;
  allClinics: Clinic[];
  appointments: Appointment[];
  patients: Patient[];
  onToggleAvailability: () => void;
  onSelectClinic: (clinicId: string) => void;
  onOpenPrescriptionBuilder: (appointment: Appointment) => void;
  onOpenAnalytics: () => void;
  onOpenProfileCalendar: () => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({
  doctor,
  allClinics,
  appointments,
  patients,
  onToggleAvailability,
  onSelectClinic,
  onOpenPrescriptionBuilder,
  onOpenAnalytics,
  onOpenProfileCalendar,
}) => {
  const currentClinic = allClinics.find(c => c.id === doctor.currentClinicId) || allClinics[0];
  const doctorAppointments = appointments.filter(a => a.doctorId === doctor.id);
  const activeQueue = doctorAppointments.filter(a => a.status === 'In-Queue' || a.status === 'Confirmed' || a.status === 'Priority');
  const completedToday = doctorAppointments.filter(a => a.status === 'Completed').length;

  return (
    <div className="space-y-6">

      {/* Doctor Header Banner & Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-healthcare-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img
              src={doctor.avatar}
              alt={doctor.name}
              className="w-16 h-16 rounded-2xl object-cover ring-4 ring-healthcare-500/50 shadow-lg"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl sm:text-2xl font-black">{doctor.name}</h2>
                <span className="bg-healthcare-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                  {doctor.specialization}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{doctor.qualification}</p>
            </div>
          </div>

          {/* Controls: Availability Toggle & Multi-Clinic Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Multi-Clinic Selector */}
            <div className="flex items-center space-x-1.5 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/20 text-xs">
              <Building2 className="w-4 h-4 text-healthcare-400" />
              <select
                value={doctor.currentClinicId}
                onChange={(e) => onSelectClinic(e.target.value)}
                className="bg-transparent font-bold text-white border-none focus:outline-none cursor-pointer pr-2"
              >
                {allClinics.filter(c => doctor.clinicIds.includes(c.id)).map(c => (
                  <option key={c.id} value={c.id} className="text-slate-900">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Live Availability Toggle */}
            <button
              onClick={onToggleAvailability}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-md ${
                doctor.isAvailable
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                  : 'bg-rose-500 hover:bg-rose-600 text-white'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{doctor.isAvailable ? 'Available (Accepting Queue)' : 'Away / On Break'}</span>
            </button>
          </div>
        </div>

        {/* Doctor KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-slate-700/80 text-center text-xs">
          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl">
            <span className="text-[10px] text-slate-300 block uppercase font-semibold">Today's Appointments</span>
            <span className="text-xl font-extrabold text-white">{doctorAppointments.length}</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl">
            <span className="text-[10px] text-slate-300 block uppercase font-semibold">Active Queue</span>
            <span className="text-xl font-extrabold text-amber-400">{activeQueue.length} Waiting</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl">
            <span className="text-[10px] text-slate-300 block uppercase font-semibold">Completed Today</span>
            <span className="text-xl font-extrabold text-emerald-400">{completedToday}</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3 rounded-2xl">
            <span className="text-[10px] text-slate-300 block uppercase font-semibold">Est. Daily Revenue</span>
            <span className="text-xl font-extrabold text-healthcare-300">
              ₹{(completedToday * doctor.consultationFee).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Emergency Triage Priority Banner if Emergency Case Present */}
      <div className="bg-rose-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ShieldAlert className="w-6 h-6 text-amber-300 animate-bounce" />
          <div>
            <h4 className="font-extrabold text-sm">Emergency Alert: Vikram Sengupta (Age 58)</h4>
            <p className="text-xs text-rose-100">Acute Angina / Chest Pain • Arriving at Apex ICU in ~4 mins</p>
          </div>
        </div>
        <button 
          onClick={onOpenAnalytics}
          className="px-3 py-1.5 rounded-xl bg-white text-rose-600 font-extrabold text-xs shadow hover:bg-slate-100 transition"
        >
          View Trauma Triage
        </button>
      </div>

      {/* Today's Live Patient Queue List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center space-x-2">
            <Users className="w-5 h-5 text-healthcare-500" />
            <span>Today's Patient Queue ({activeQueue.length})</span>
          </h3>

          <div className="flex items-center space-x-2 text-xs font-semibold">
            <button onClick={onOpenProfileCalendar} className="text-healthcare-500 hover:underline">
              Calendar & Working Hours
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {activeQueue.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl text-center border border-slate-200 dark:border-slate-800 text-slate-500">
              <p className="font-bold text-base">No active patients in queue for today.</p>
            </div>
          ) : (
            activeQueue.map((apt) => (
              <GlassCard key={apt.id} className={apt.priorityLevel === 'Emergency' ? 'border-2 border-rose-500 bg-rose-50/20' : ''}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 rounded-2xl bg-healthcare-500 text-white font-black text-lg flex items-center justify-center shadow-floating">
                      #{apt.tokenNumber.toString().padStart(2, '0')}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-extrabold text-base text-slate-900 dark:text-white">{apt.patientName}</h4>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          apt.priorityLevel === 'Emergency' ? 'bg-rose-500 text-white' : apt.priorityLevel === 'Urgent' ? 'bg-amber-500 text-white' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {apt.priorityLevel}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Symptoms: <strong>{apt.symptoms.join(', ')}</strong>
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium">Slot: {apt.timeSlot} • Status: {apt.status}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <button
                      onClick={() => onOpenPrescriptionBuilder(apt)}
                      className="px-4 py-2 rounded-xl bg-healthcare-500 hover:bg-healthcare-600 text-white font-extrabold text-xs shadow transition flex items-center space-x-1.5"
                    >
                      <Pill className="w-4 h-4" />
                      <span>Start Consultation & Rx</span>
                    </button>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>

    </div>
  );
};
