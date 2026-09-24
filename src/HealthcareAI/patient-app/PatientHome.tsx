import React from 'react';
import { Clinic, Doctor, Appointment, Patient } from '../types';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  Sparkles, 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  ShieldCheck, 
  ChevronRight, 
  Search, 
  Zap, 
  Activity,
  HeartHandshake
} from 'lucide-react';

interface PatientHomeProps {
  clinics: Clinic[];
  doctors: Doctor[];
  patient: Patient;
  activeAppointment?: Appointment;
  onOpenSymptomChecker: () => void;
  onSelectClinic: (clinicId: string) => void;
  onOpenSearch: () => void;
  onViewLiveQueue: () => void;
}

export const PatientHome: React.FC<PatientHomeProps> = ({
  clinics,
  doctors,
  patient,
  activeAppointment,
  onOpenSymptomChecker,
  onSelectClinic,
  onOpenSearch,
  onViewLiveQueue,
}) => {
  const aiRecommendedClinic = clinics.find(c => c.aiRecommended) || clinics[0];

  return (
    <div className="space-y-6">

      {/* Hero AI Triage Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-healthcare-900 text-white overflow-hidden shadow-2xl border border-slate-700/60">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-healthcare-500/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-healthcare-500/30 text-healthcare-300 text-xs font-bold border border-healthcare-500/40 mb-3">
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
            <span>AI Triage & Live Queue Dispatch</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Hello, <span className="text-healthcare-400">{patient.name.split(' ')[0]}</span>! 👋
          </h1>
          <p className="text-slate-300 text-sm mt-2 leading-relaxed">
            Need care right now? Describe symptoms using AI voice, text, or photo. We'll match you to the shortest queue and optimal specialist.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={onOpenSymptomChecker}
              className="px-5 py-3 rounded-2xl bg-healthcare-500 hover:bg-healthcare-600 text-white font-bold text-sm shadow-floating transition-all flex items-center space-x-2 group"
            >
              <Sparkles className="w-4 h-4 text-white group-hover:rotate-12 transition-transform" />
              <span>Launch AI Symptom Checker</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={onOpenSearch}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm backdrop-blur-md border border-white/20 transition-all flex items-center space-x-2"
            >
              <Search className="w-4 h-4 text-healthcare-400" />
              <span>Search Clinics & Doctors</span>
            </button>
          </div>
        </div>
      </div>

      {/* Active Live Queue Token Widget if Patient Has Active Queue */}
      {activeAppointment && (
        <div 
          onClick={onViewLiveQueue}
          className="bg-gradient-to-r from-healthcare-500 to-amber-500 text-white p-5 rounded-2xl shadow-floating cursor-pointer transform hover:-translate-y-0.5 transition"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-white text-2xl font-black shadow-inner">
                #{activeAppointment.tokenNumber.toString().padStart(2, '0')}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-white/20 px-2 py-0.5 rounded-full">
                  Live Token Active • {activeAppointment.clinicName}
                </span>
                <h4 className="font-extrabold text-base mt-1">{activeAppointment.doctorName} ({activeAppointment.specialization})</h4>
                <p className="text-xs text-white/90">Est. Wait Time: ~12 Mins • Status: {activeAppointment.status}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-white text-healthcare-600 px-3 py-2 rounded-xl text-xs font-extrabold shadow-md">
              <Zap className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Track Queue</span>
            </div>
          </div>
        </div>
      )}

      {/* AI Recommended Featured Clinic Card */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-healthcare-500" />
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">AI Recommended Clinic</h3>
          </div>
          <span className="text-xs font-bold text-healthcare-600 bg-healthcare-100 dark:bg-healthcare-950 px-2.5 py-1 rounded-full border border-healthcare-300">
            {aiRecommendedClinic.aiMatchScore}% Match Score
          </span>
        </div>

        <GlassCard onClick={() => onSelectClinic(aiRecommendedClinic.id)} className="relative overflow-hidden border-2 border-healthcare-300 dark:border-healthcare-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="relative h-48 md:h-full rounded-xl overflow-hidden">
              <img src={aiRecommendedClinic.image} alt={aiRecommendedClinic.name} className="w-full h-full object-cover" />
              <div className="absolute top-2 left-2 bg-healthcare-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow">
                <Sparkles className="w-3 h-3" /> Top AI Recommendation
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-xl text-slate-900 dark:text-white">{aiRecommendedClinic.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3.5 h-3.5 text-healthcare-500" /> {aiRecommendedClinic.address}
                  </p>
                </div>
                <div className="flex items-center space-x-1 bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2.5 py-1 rounded-xl text-xs font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{aiRecommendedClinic.rating} ({aiRecommendedClinic.reviewCount})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
                <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Distance</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{aiRecommendedClinic.distanceKm} km</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Est. Travel Time</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{aiRecommendedClinic.travelTimeMin} mins</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Live Queue</span>
                  <span className="font-bold text-healthcare-600 dark:text-healthcare-400">{aiRecommendedClinic.liveQueueLength} Patients</span>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Avg Waiting</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{aiRecommendedClinic.avgWaitTimeMin} mins</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Fee: <strong className="text-slate-900 dark:text-white">{aiRecommendedClinic.consultationFeeRange}</strong>
                </span>
                <button
                  onClick={() => onSelectClinic(aiRecommendedClinic.id)}
                  className="px-4 py-2 rounded-xl bg-healthcare-500 hover:bg-healthcare-600 text-white font-bold text-xs shadow transition flex items-center space-x-1"
                >
                  <span>Book Appointment & Queue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* All Nearby Clinics Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Nearby Clinics & Polyclinics</h3>
          <button onClick={onOpenSearch} className="text-xs font-bold text-healthcare-500 hover:underline">
            View All ({clinics.length})
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {clinics.map((clinic) => (
            <GlassCard key={clinic.id} onClick={() => onSelectClinic(clinic.id)}>
              <div className="relative h-40 rounded-xl overflow-hidden mb-3">
                <img src={clinic.image} alt={clinic.name} className="w-full h-full object-cover" />
                <div className="absolute top-2 right-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full border border-slate-700">
                  {clinic.isOpen ? '🟢 Open Now' : '🔴 Closed'}
                </div>
              </div>

              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">{clinic.name}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{clinic.address}</p>
                </div>
                <div className="flex items-center space-x-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-lg">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  <span>{clinic.rating}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Distance & Travel</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {clinic.distanceKm} km ({clinic.travelTimeMin} min drive)
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 block">Live Queue</span>
                  <span className="font-semibold text-healthcare-600 dark:text-healthcare-400">
                    {clinic.liveQueueLength} ahead (~{clinic.avgWaitTimeMin} min wait)
                  </span>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Fee: {clinic.consultationFeeRange}</span>
                <span className="text-xs font-bold text-healthcare-500 group-hover:translate-x-1 transition flex items-center">
                  Select <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

    </div>
  );
};
