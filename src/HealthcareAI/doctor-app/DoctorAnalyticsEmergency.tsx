import React from 'react';
import { Doctor, EmergencyCase } from '../types';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  TrendingUp, 
  Users, 
  Star, 
  ShieldAlert, 
  DollarSign, 
  Clock, 
  Activity,
  ArrowUpRight
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface DoctorAnalyticsEmergencyProps {
  doctor: Doctor;
  emergencyCases: EmergencyCase[];
  onBack: () => void;
}

export const DoctorAnalyticsEmergency: React.FC<DoctorAnalyticsEmergencyProps> = ({
  doctor,
  emergencyCases,
  onBack,
}) => {
  const revenueData = [
    { day: 'Mon', revenue: 14500, patients: 11 },
    { day: 'Tue', revenue: 18000, patients: 14 },
    { day: 'Wed', revenue: 15000, patients: 12 },
    { day: 'Thu', revenue: 21000, patients: 16 },
    { day: 'Fri', revenue: 19500, patients: 15 },
    { day: 'Sat', revenue: 24000, patients: 18 },
    { day: 'Sun', revenue: 9000, patients: 7 },
  ];

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 transition"
        >
          ← Back to Dashboard
        </button>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-healthcare-100 text-healthcare-700 border border-healthcare-300">
          Doctor Analytics & Triage
        </span>
      </div>

      {/* Emergency Cases Section */}
      <div className="space-y-3">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-lg flex items-center space-x-2">
          <ShieldAlert className="w-5 h-5 text-rose-500" />
          <span>Active Emergency & Trauma Triage ({emergencyCases.length})</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {emergencyCases.map((ec) => (
            <GlassCard key={ec.id} className="border-2 border-rose-400 bg-rose-50/10">
              <div className="flex items-start justify-between">
                <div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500 text-white">
                    {ec.priority} Priority
                  </span>
                  <h4 className="font-extrabold text-base text-slate-900 dark:text-white mt-1">{ec.patientName} ({ec.age} Yrs)</h4>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-0.5">{ec.condition}</p>
                </div>
                <div className="bg-rose-100 text-rose-800 px-2.5 py-1 rounded-xl text-xs font-extrabold">
                  ETA ~{ec.etaMinutes} min
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">Facility: {ec.clinicName}</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">Status: {ec.status}</span>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>

      {/* Revenue & Consultations Chart */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-healthcare-500" />
              <span>Weekly Consultation Revenue & Patient Volume</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Total 7-Day Earnings: ₹121,000</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% vs last week
          </span>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF8A3D" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#FF8A3D" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#FF8A3D" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

    </div>
  );
};
