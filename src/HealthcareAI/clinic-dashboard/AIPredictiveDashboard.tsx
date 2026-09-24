import React from 'react';
import { Clinic, Doctor, Appointment } from '../types';
import { PEAK_HOURS_HEATMAP, predictNoShowRisk } from '../ai-engine';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  Activity, 
  Brain, 
  Clock, 
  Users, 
  AlertCircle, 
  Sparkles, 
  TrendingUp, 
  ChevronRight 
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface AIPredictiveDashboardProps {
  clinic: Clinic;
  doctors: Doctor[];
  appointments: Appointment[];
  onBack: () => void;
}

export const AIPredictiveDashboard: React.FC<AIPredictiveDashboardProps> = ({
  clinic,
  doctors,
  appointments,
  onBack,
}) => {
  const sampleNoShowData = appointments.slice(0, 5).map(apt => {
    const risk = predictNoShowRisk(apt, 45, clinic.distanceKm);
    return {
      name: apt.patientName,
      riskScore: risk.riskScorePercent,
      category: risk.category,
      slot: apt.timeSlot,
    };
  });

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 transition"
        >
          ← Back to Dashboard
        </button>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-healthcare-500 text-white">
          AI Intelligence & Triage Engine
        </span>
      </div>

      {/* Hero AI Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-healthcare-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-2xl space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-healthcare-500 text-white flex items-center justify-center shadow-floating">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black">AI Predictive Operations Hub</h2>
            <p className="text-xs text-slate-300">
              Real-time machine learning predictions for clinic flow, doctor workload, and patient no-show risks.
            </p>
          </div>
        </div>

        {/* AI KPI Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-700/80 text-center text-xs">
          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl">
            <span className="text-[10px] text-slate-300 uppercase font-semibold block">Predicted No-Show Rate</span>
            <span className="text-2xl font-black text-amber-400 mt-0.5 block">11.8%</span>
            <span className="text-[10px] text-slate-400 block">-3.2% optimization</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl">
            <span className="text-[10px] text-slate-300 uppercase font-semibold block">Avg Wait Prediction</span>
            <span className="text-2xl font-black text-emerald-400 mt-0.5 block">~12.4 Mins</span>
            <span className="text-[10px] text-emerald-300 block">Within target</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl">
            <span className="text-[10px] text-slate-300 uppercase font-semibold block">Doctor Workload Index</span>
            <span className="text-2xl font-black text-white mt-0.5 block">84% Balanced</span>
            <span className="text-[10px] text-slate-400 block">Optimal utilization</span>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-3.5 rounded-2xl">
            <span className="text-[10px] text-slate-300 uppercase font-semibold block">Peak Hour Window</span>
            <span className="text-2xl font-black text-healthcare-300 mt-0.5 block">10:00 AM - 12:00 PM</span>
            <span className="text-[10px] text-slate-400 block">High density</span>
          </div>
        </div>
      </div>

      {/* Peak Hour Heatmap Table */}
      <GlassCard className="space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center space-x-2">
          <Activity className="w-5 h-5 text-healthcare-500" />
          <span>Clinic Peak Hours Density Heatmap (Patient Density %)</span>
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                <th className="p-2.5 text-left rounded-l-xl">Time Slot</th>
                <th className="p-2.5">Mon</th>
                <th className="p-2.5">Tue</th>
                <th className="p-2.5">Wed</th>
                <th className="p-2.5">Thu</th>
                <th className="p-2.5">Fri</th>
                <th className="p-2.5 rounded-r-xl">Sat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-semibold">
              {PEAK_HOURS_HEATMAP.map((row) => (
                <tr key={row.hour}>
                  <td className="p-2.5 text-left font-bold text-slate-900 dark:text-white">{row.hour}</td>
                  {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].map((day) => {
                    const val = (row as any)[day];
                    const bgClass = val > 90 ? 'bg-rose-500 text-white' : val > 75 ? 'bg-amber-500 text-white' : val > 50 ? 'bg-healthcare-400 text-white' : 'bg-slate-100 text-slate-700';
                    return (
                      <td key={day} className="p-2.5">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${bgClass}`}>
                          {val}%
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* No-Show Risk Bar Chart */}
      <GlassCard className="space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <span>Patient No-Show Probability Predictions</span>
        </h3>

        <div className="h-60 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={sampleNoShowData}>
              <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} unit="%" />
              <Tooltip />
              <Bar dataKey="riskScore" fill="#FF8A3D" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

    </div>
  );
};
