import React, { useState } from 'react';
import { Doctor, Clinic } from '../types';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  Star, 
  Award, 
  Globe, 
  Users, 
  Clock, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  ChevronRight,
  ShieldAlert
} from 'lucide-react';

interface DoctorProfileBookingProps {
  doctor: Doctor;
  clinic: Clinic;
  onConfirmBooking: (doctorId: string, timeSlot: string) => void;
  onBack: () => void;
}

export const DoctorProfileBooking: React.FC<DoctorProfileBookingProps> = ({
  doctor,
  clinic,
  onConfirmBooking,
  onBack,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<string>('10:30 AM');
  const [symptomsInput, setSymptomsInput] = useState('Routine checkup & consultation');
  const [isBooked, setIsBooked] = useState(false);

  const timeSlots = [
    { slot: '09:00 AM', isAiRecommended: false, isShortestWait: false },
    { slot: '09:30 AM', isAiRecommended: false, isShortestWait: false },
    { slot: '10:00 AM', isAiRecommended: false, isShortestWait: true },
    { slot: '10:30 AM', isAiRecommended: true, isShortestWait: false },
    { slot: '02:00 PM', isAiRecommended: false, isShortestWait: false },
    { slot: '02:30 PM', isAiRecommended: false, isShortestWait: false },
    { slot: '04:00 PM', isAiRecommended: false, isShortestWait: false },
    { slot: '04:30 PM', isAiRecommended: false, isShortestWait: false },
  ];

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    setIsBooked(true);
    setTimeout(() => {
      onConfirmBooking(doctor.id, selectedSlot);
    }, 1500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Back Button */}
      <button
        onClick={onBack}
        className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 transition"
      >
        ← Back
      </button>

      {/* Doctor Header Profile Card */}
      <GlassCard className="border-healthcare-300 dark:border-healthcare-700">
        <div className="flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 text-center sm:text-left">
          <img
            src={doctor.avatar}
            alt={doctor.name}
            className="w-28 h-28 rounded-3xl object-cover ring-4 ring-healthcare-200 dark:ring-healthcare-900 shadow-lg"
          />

          <div className="space-y-2 flex-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white">{doctor.name}</h2>
                <p className="text-sm font-bold text-healthcare-600 dark:text-healthcare-400">{doctor.specialization}</p>
              </div>

              <div className="flex items-center justify-center sm:justify-end space-x-1 bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-3 py-1 rounded-xl font-extrabold text-sm">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span>{doctor.rating} ({doctor.reviewCount} reviews)</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">{doctor.qualification}</p>

            {/* Doctor KPI Pill Grid */}
            <div className="grid grid-cols-3 gap-3 pt-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Experience</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{doctor.experienceYears} Years</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Patients Treated</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{doctor.patientsServed.toLocaleString()}+</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl">
                <span className="text-slate-400 block text-[10px] uppercase font-semibold">Consultation Fee</span>
                <span className="font-extrabold text-healthcare-600 dark:text-healthcare-400">₹{doctor.consultationFee}</span>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-600 dark:text-slate-300 flex items-center space-x-2">
              <Globe className="w-4 h-4 text-healthcare-500" />
              <span>Languages: <strong>{doctor.languages.join(', ')}</strong></span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Appointment Slot Booking Form */}
      <GlassCard className="space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-healthcare-500" />
              <span>Select Appointment Time Slot</span>
            </h3>
            <span className="text-xs font-bold text-healthcare-600 bg-healthcare-100 dark:bg-healthcare-950 px-2.5 py-1 rounded-full">
              Today's Slots • {clinic.name}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Slots tagged with AI badges are optimized for minimum waiting time and doctor energy balance.
          </p>
        </div>

        {/* Time Slots Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {timeSlots.map((item) => {
            const isSelected = selectedSlot === item.slot;
            return (
              <button
                key={item.slot}
                onClick={() => setSelectedSlot(item.slot)}
                className={`relative p-3.5 rounded-2xl border text-left transition-all duration-200 ${
                  isSelected
                    ? 'bg-healthcare-500 text-white border-healthcare-500 shadow-floating scale-[1.02]'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:border-healthcare-300'
                }`}
              >
                {item.isAiRecommended && (
                  <span className={`absolute -top-2.5 left-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase flex items-center gap-1 ${
                    isSelected ? 'bg-white text-healthcare-600 shadow' : 'bg-healthcare-500 text-white'
                  }`}>
                    <Sparkles className="w-2.5 h-2.5" /> AI Optimal
                  </span>
                )}

                {item.isShortestWait && (
                  <span className={`absolute -top-2.5 left-2 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                    isSelected ? 'bg-white text-emerald-600 shadow' : 'bg-emerald-500 text-white'
                  }`}>
                    ⚡ Min Wait
                  </span>
                )}

                <div className="font-extrabold text-sm mt-1">{item.slot}</div>
                <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                  {item.isShortestWait ? '~5 min queue wait' : '~12 min queue wait'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Symptoms / Chief Complaint input */}
        <div className="space-y-2 pt-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Chief Complaint / Reason for Visit
          </label>
          <input
            type="text"
            value={symptomsInput}
            onChange={(e) => setSymptomsInput(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500"
            placeholder="Describe any symptoms or checkup purpose..."
          />
        </div>

        {/* Booking Summary & Confirmation */}
        {isBooked ? (
          <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 text-center space-y-2 animate-fade-in">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="font-extrabold text-lg text-emerald-900 dark:text-emerald-300">Appointment Confirmed! 🎉</h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Your token <strong>#04</strong> for <strong>{selectedSlot}</strong> with <strong>{doctor.name}</strong> has been generated. Redirecting to Live Queue tracker...
            </p>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Consultation Payable</span>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                ₹{doctor.consultationFee} <span className="text-xs font-normal text-slate-400">(Pay at Clinic / UPI)</span>
              </span>
            </div>

            <button
              onClick={handleBooking}
              className="px-6 py-3.5 rounded-2xl bg-healthcare-500 hover:bg-healthcare-600 text-white font-extrabold text-sm shadow-floating transition-all flex items-center justify-center space-x-2"
            >
              <Calendar className="w-4 h-4" />
              <span>Confirm & Generate Queue Token</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </GlassCard>

    </div>
  );
};
