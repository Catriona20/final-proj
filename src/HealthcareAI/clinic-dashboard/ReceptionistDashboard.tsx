import React from 'react';
import { Clinic, Doctor, Appointment, EmergencyCase } from '../types';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  Building2, 
  Users, 
  DollarSign, 
  Clock, 
  ShieldAlert, 
  CheckCircle2, 
  Plus, 
  TrendingUp, 
  Stethoscope, 
  Pill, 
  ChevronRight,
  Zap,
  Activity
} from 'lucide-react';

interface ReceptionistDashboardProps {
  clinic: Clinic;
  doctors: Doctor[];
  appointments: Appointment[];
  emergencyCases: EmergencyCase[];
  onOpenQueueManagement: () => void;
  onOpenPharmacy: () => void;
  onOpenAiInsights: () => void;
  onOpenAnalytics: () => void;
}

export const ReceptionistDashboard: React.FC<ReceptionistDashboardProps> = ({
  clinic,
  doctors,
  appointments,
  emergencyCases,
  onOpenQueueManagement,
  onOpenPharmacy,
  onOpenAiInsights,
  onOpenAnalytics,
}) => {
  const clinicAppointments = appointments.filter(a => a.clinicId === clinic.id);
  const totalRevenue = clinicAppointments.reduce((acc, curr) => acc + curr.fee, 0);
  const inQueueCount = clinicAppointments.filter(a => a.status === 'In-Queue' || a.status === 'Confirmed' || a.status === 'Priority').length;
  const completedCount = clinicAppointments.filter(a => a.status === 'Completed').length;
  const availableDoctors = doctors.filter(d => clinic.doctorIds.includes(d.id) && d.isAvailable).length;

  return (
    <div className="space-y-6">

      {/* Receptionist Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-healthcare-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-healthcare-500 text-white flex items-center justify-center font-bold text-2xl shadow-floating">
              🏥
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl sm:text-3xl font-black">{clinic.name}</h1>
                <span className="bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                  {clinic.city} Central Hub
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">{clinic.address}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onOpenQueueManagement}
              className="px-4 py-2.5 rounded-2xl bg-healthcare-500 hover:bg-healthcare-600 text-white font-extrabold text-xs shadow-floating transition flex items-center space-x-2"
            >
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
              <span>Live Queue Control</span>
            </button>

            <button
              onClick={onOpenPharmacy}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs backdrop-blur-md border border-white/20 transition flex items-center space-x-2"
            >
              <Pill className="w-4 h-4 text-healthcare-400" />
              <span>Pharmacy & Stock</span>
            </button>
          </div>
        </div>

        {/* Executive KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-slate-700/80 text-center">
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
            <span className="text-[10px] text-slate-300 uppercase font-semibold block">Today's Appointments</span>
            <span className="text-2xl font-black text-white mt-0.5 block">{clinicAppointments.length}</span>
            <span className="text-[10px] text-emerald-400 font-semibold block mt-0.5">{completedCount} Completed</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
            <span className="text-[10px] text-slate-300 uppercase font-semibold block">Today's Revenue</span>
            <span className="text-2xl font-black text-healthcare-300 mt-0.5 block">₹{totalRevenue.toLocaleString()}</span>
            <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">UPI & Cash Collections</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
            <span className="text-[10px] text-slate-300 uppercase font-semibold block">Active Queue Waiting</span>
            <span className="text-2xl font-black text-amber-400 mt-0.5 block">{inQueueCount} Patients</span>
            <span className="text-[10px] text-amber-300 font-semibold block mt-0.5">Est Avg Wait: {clinic.avgWaitTimeMin} mins</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl">
            <span className="text-[10px] text-slate-300 uppercase font-semibold block">Active Doctors Available</span>
            <span className="text-2xl font-black text-emerald-400 mt-0.5 block">{availableDoctors} On Duty</span>
            <span className="text-[10px] text-slate-300 font-semibold block mt-0.5">Across {clinic.departments.length} Depts</span>
          </div>
        </div>
      </div>

      {/* Emergency Cases Triage Bar */}
      {emergencyCases.length > 0 && (
        <div className="bg-rose-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ShieldAlert className="w-6 h-6 text-amber-300 animate-bounce" />
            <div>
              <h4 className="font-extrabold text-sm">Emergency Trauma Queue Warning ({emergencyCases.length} Active Cases)</h4>
              <p className="text-xs text-rose-100">
                Patient: {emergencyCases[0].patientName} • {emergencyCases[0].condition} (ETA ~{emergencyCases[0].etaMinutes} min)
              </p>
            </div>
          </div>

          <button
            onClick={onOpenQueueManagement}
            className="px-3.5 py-1.5 rounded-xl bg-white text-rose-600 font-extrabold text-xs shadow hover:bg-slate-100 transition"
          >
            Manage Priority Queue
          </button>
        </div>
      )}

      {/* Quick Access Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        
        <GlassCard onClick={onOpenQueueManagement} className="group border-healthcare-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-healthcare-100 dark:bg-healthcare-950 text-healthcare-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition" />
          </div>
          <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Priority & Emergency Queue</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Rearrange token positions, advance tokens, handle emergency walk-ins.
          </p>
        </GlassCard>

        <GlassCard onClick={onOpenAiInsights} className="group border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-500 flex items-center justify-center">
              <Activity className="w-5 h-5" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition" />
          </div>
          <h4 className="font-extrabold text-base text-slate-900 dark:text-white">AI Predictions & Flow</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            No-show probability, waiting time prediction, peak hour heatmaps.
          </p>
        </GlassCard>

        <GlassCard onClick={onOpenAnalytics} className="group border-emerald-200">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-500 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition" />
          </div>
          <h4 className="font-extrabold text-base text-slate-900 dark:text-white">Executive Analytics</h4>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Revenue reports, doctor performance metrics, multi-clinic benchmarking.
          </p>
        </GlassCard>

      </div>

    </div>
  );
};
