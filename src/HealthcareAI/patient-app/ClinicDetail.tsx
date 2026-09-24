import React from 'react';
import { Clinic, Doctor, Review } from '../types';
import { InteractiveMap } from '../shared-components/InteractiveMap';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  MapPin, 
  Clock, 
  Users, 
  Star, 
  ShieldCheck, 
  Stethoscope, 
  Building2, 
  ChevronRight, 
  Phone, 
  Sparkles,
  Zap
} from 'lucide-react';

interface ClinicDetailProps {
  clinic: Clinic;
  doctors: Doctor[];
  reviews: Review[];
  allClinics: Clinic[];
  onSelectDoctor: (doctorId: string) => void;
  onBack: () => void;
}

export const ClinicDetail: React.FC<ClinicDetailProps> = ({
  clinic,
  doctors,
  reviews,
  allClinics,
  onSelectDoctor,
  onBack,
}) => {
  const clinicDoctors = doctors.filter(d => clinic.doctorIds.includes(d.id));
  const clinicReviews = reviews.filter(r => r.clinicId === clinic.id);

  return (
    <div className="space-y-6">

      {/* Back Button & Header Banner */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 transition"
        >
          ← Back to Clinics
        </button>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-healthcare-100 text-healthcare-700 border border-healthcare-300">
          {clinic.city} Branch
        </span>
      </div>

      {/* Hero Image & Headline Card */}
      <div className="relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-white dark:bg-slate-900">
        <div className="h-64 sm:h-80 w-full relative">
          <img src={clinic.image} alt={clinic.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

          <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-healthcare-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                {clinic.aiRecommended ? 'AI Recommended Clinic' : 'Verified Healthcare Facility'}
              </span>
              <span className="bg-emerald-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                {clinic.isOpen ? 'Open Now' : 'Closed'}
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black">{clinic.name}</h1>
            <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-healthcare-400" /> {clinic.address}
            </p>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-100 dark:border-slate-800 text-center">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Distance</span>
            <span className="text-base font-extrabold text-slate-900 dark:text-white">{clinic.distanceKm} km</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Travel Time</span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">{clinic.travelTimeMin} mins</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Live Queue</span>
            <span className="text-base font-extrabold text-healthcare-500">{clinic.liveQueueLength} Patients</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Avg Wait Time</span>
            <span className="text-base font-extrabold text-amber-500">{clinic.avgWaitTimeMin} mins</span>
          </div>
        </div>
      </div>

      {/* Facilities & Working Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-3 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-healthcare-500" />
            <span>Facilities & Amenities</span>
          </h3>

          <div className="flex flex-wrap gap-2">
            {clinic.facilities.map((fac) => (
              <span
                key={fac}
                className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700"
              >
                ✓ {fac}
              </span>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-healthcare-500" />
            <span>Working Hours & Consultation</span>
          </h3>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold">Clinic Hours:</span>
              <span className="font-bold text-slate-900 dark:text-white">{clinic.openHours}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="font-semibold">Consultation Fee:</span>
              <span className="font-bold text-healthcare-500">{clinic.consultationFeeRange}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="font-semibold">Emergency Triage:</span>
              <span className="font-bold text-emerald-600">{clinic.emergencyAvailable ? '24/7 Trauma Ready' : 'Standard'}</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Interactive GIS Route Map Component */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
          <MapPin className="w-5 h-5 text-healthcare-500" />
          <span>Interactive Location & Navigation Route</span>
        </h3>
        <InteractiveMap clinics={allClinics} selectedClinicId={clinic.id} onSelectClinic={() => {}} />
      </div>

      {/* Available Doctors List */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-healthcare-500" />
          <span>Available Doctors at this Clinic ({clinicDoctors.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {clinicDoctors.map((doc) => (
            <GlassCard key={doc.id} onClick={() => onSelectDoctor(doc.id)}>
              <div className="flex items-start space-x-4">
                <img src={doc.avatar} alt={doc.name} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-healthcare-200" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-base text-slate-900 dark:text-white">{doc.name}</h4>
                      <span className="text-xs text-healthcare-600 dark:text-healthcare-400 font-semibold block">
                        {doc.specialization}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-lg">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span>{doc.rating}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{doc.qualification}</p>

                  <div className="flex items-center justify-between mt-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Fee: <strong>₹{doc.consultationFee}</strong>
                    </span>
                    <button
                      onClick={() => onSelectDoctor(doc.id)}
                      className="px-3.5 py-1.5 rounded-xl bg-healthcare-500 text-white font-bold text-xs shadow hover:bg-healthcare-600 transition flex items-center space-x-1"
                    >
                      <span>Book Slot</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

    </div>
  );
};
