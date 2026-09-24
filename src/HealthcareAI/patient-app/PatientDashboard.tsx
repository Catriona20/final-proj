import React from 'react';
import { Patient, Appointment, Clinic, Doctor, NotificationItem } from '../types';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  Activity, 
  Calendar, 
  Clock, 
  Heart, 
  Building2, 
  Stethoscope, 
  Bell, 
  ChevronRight, 
  ShieldCheck, 
  Zap 
} from 'lucide-react';

interface PatientDashboardProps {
  patient: Patient;
  upcomingAppointment?: Appointment;
  clinics: Clinic[];
  doctors: Doctor[];
  notifications: NotificationItem[];
  onSelectClinic: (clinicId: string) => void;
  onSelectDoctor: (doctorId: string) => void;
  onViewQueue: () => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({
  patient,
  upcomingAppointment,
  clinics,
  doctors,
  notifications,
  onSelectClinic,
  onSelectDoctor,
  onViewQueue,
}) => {
  const favoriteDoctors = doctors.slice(0, 3);
  const recentClinics = clinics.slice(0, 3);

  return (
    <div className="space-y-6">

      {/* Patient Health Summary Banner */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <img src={patient.avatar} alt={patient.name} className="w-16 h-16 rounded-2xl object-cover ring-4 ring-healthcare-200" />
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="font-extrabold text-xl text-slate-900 dark:text-white">{patient.name}</h2>
                <span className="bg-healthcare-100 text-healthcare-700 px-2 py-0.5 rounded-full text-xs font-bold">
                  {patient.gender}, {patient.age} Yrs
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                City: {patient.city} • Blood Group: <strong className="text-healthcare-600">{patient.bloodGroup}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-2 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>AI Health Risk Score: {patient.riskScore}</span>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-center text-xs">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
            <span className="text-slate-400 block uppercase font-semibold text-[10px]">Active Prescriptions</span>
            <span className="text-lg font-extrabold text-slate-900 dark:text-white">{patient.activePrescriptionsCount} Rx</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
            <span className="text-slate-400 block uppercase font-semibold text-[10px]">Medical History</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">{patient.medicalHistory.join(', ')}</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
            <span className="text-slate-400 block uppercase font-semibold text-[10px]">Known Allergies</span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate block">{patient.allergies.join(', ')}</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
            <span className="text-slate-400 block uppercase font-semibold text-[10px]">Emergency Hotline</span>
            <span className="text-xs font-extrabold text-rose-500 block">108 / {patient.emergencyContact}</span>
          </div>
        </div>
      </div>

      {/* Upcoming Appointment Card */}
      {upcomingAppointment ? (
        <div className="bg-gradient-to-r from-healthcare-500 to-amber-500 text-white p-6 rounded-3xl shadow-floating space-y-4">
          <div className="flex items-center justify-between">
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5">
              <Calendar className="w-4 h-4" /> Next Upcoming Appointment
            </span>
            <span className="text-xs font-bold bg-white text-healthcare-600 px-3 py-1 rounded-full shadow">
              Token #{upcomingAppointment.tokenNumber.toString().padStart(2, '0')}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-extrabold">{upcomingAppointment.doctorName}</h3>
              <p className="text-xs text-white/90 font-medium">
                {upcomingAppointment.specialization} • {upcomingAppointment.clinicName}
              </p>
              <p className="text-xs text-white/80 mt-1">
                📅 {upcomingAppointment.date} at ⏰ {upcomingAppointment.timeSlot}
              </p>
            </div>

            <button
              onClick={onViewQueue}
              className="px-5 py-3 rounded-2xl bg-white text-healthcare-600 hover:bg-slate-100 font-extrabold text-xs shadow-md transition flex items-center space-x-1 self-start sm:self-auto"
            >
              <span>Track Live Queue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : null}

      {/* Favorite Doctors & Recent Clinics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Favorite Doctors */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center space-x-2">
            <Stethoscope className="w-5 h-5 text-healthcare-500" />
            <span>Favorite Specialists</span>
          </h3>

          <div className="space-y-3">
            {favoriteDoctors.map((doc) => (
              <GlassCard key={doc.id} onClick={() => onSelectDoctor(doc.id)}>
                <div className="flex items-center space-x-3">
                  <img src={doc.avatar} alt={doc.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{doc.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{doc.specialization} • ₹{doc.consultationFee}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Recent Clinics */}
        <div className="space-y-3">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-healthcare-500" />
            <span>Recent Healthcare Clinics</span>
          </h3>

          <div className="space-y-3">
            {recentClinics.map((clinic) => (
              <GlassCard key={clinic.id} onClick={() => onSelectClinic(clinic.id)}>
                <div className="flex items-center space-x-3">
                  <img src={clinic.image} alt={clinic.name} className="w-12 h-12 rounded-xl object-cover" />
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">{clinic.name}</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{clinic.city} • {clinic.distanceKm} km</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
