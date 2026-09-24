import React, { useState } from 'react';
import { Doctor, Clinic } from '../types';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  Calendar, 
  Clock, 
  Building2, 
  Palmtree, 
  CheckCircle2, 
  Globe, 
  Award, 
  Star,
  Save
} from 'lucide-react';

interface DoctorProfileCalendarProps {
  doctor: Doctor;
  clinics: Clinic[];
  onBack: () => void;
}

export const DoctorProfileCalendar: React.FC<DoctorProfileCalendarProps> = ({
  doctor,
  clinics,
  onBack,
}) => {
  const [workingHours, setWorkingHours] = useState(doctor.workingHours);
  const [vacationMode, setVacationMode] = useState(doctor.vacationMode);
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 transition"
        >
          ← Back
        </button>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-healthcare-100 text-healthcare-700">
          Doctor Profile & Availability Config
        </span>
      </div>

      <GlassCard className="space-y-6">
        <div className="flex items-center space-x-4">
          <img src={doctor.avatar} alt={doctor.name} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-healthcare-500" />
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">{doctor.name}</h2>
            <p className="text-xs font-bold text-healthcare-600">{doctor.specialization} • {doctor.qualification}</p>
            <p className="text-xs text-slate-500 mt-1">Multi-Clinic Assigned Count: {doctor.clinicIds.length} Clinics</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Standard Daily Working Hours
            </label>
            <input
              type="text"
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center space-x-3">
              <Palmtree className="w-6 h-6 text-amber-600" />
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">Vacation Mode / Out of Chamber</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Temporarily pause appointment booking across all assigned clinics.</p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={vacationMode}
                onChange={(e) => setVacationMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {saved ? (
            <div className="p-3 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs text-center">
              ✓ Doctor Schedule & Vacation Settings Saved!
            </div>
          ) : (
            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-healthcare-500 hover:bg-healthcare-600 text-white font-extrabold text-xs shadow-floating transition flex items-center justify-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Profile & Schedule Updates</span>
            </button>
          )}
        </form>
      </GlassCard>

    </div>
  );
};
