import React, { useState } from 'react';
import { Clinic, Doctor } from '../types';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  BarChart3, 
  PieChart as PieChartIcon, 
  Activity, 
  Clock, 
  Building2,
  Calendar
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

interface AnalyticsReportsProps {
  clinics: Clinic[];
  doctors: Doctor[];
  onBack: () => void;
}

export const AnalyticsReports: React.FC<AnalyticsReportsProps> = ({
  clinics,
  doctors,
  onBack,
}) => {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const monthlyRevenueData = [
    { month: 'Jan', revenue: 420000, appointments: 520 },
    { month: 'Feb', revenue: 480000, appointments: 590 },
    { month: 'Mar', revenue: 510000, appointments: 630 },
    { month: 'Apr', revenue: 490000, appointments: 610 },
    { month: 'May', revenue: 580000, appointments: 720 },
    { month: 'Jun', revenue: 640000, appointments: 790 },
    { month: 'Jul', revenue: 710000, appointments: 880 },
  ];

  const deptDistributionData = [
    { name: 'Cardiology', value: 32 },
    { name: 'Dermatology', value: 24 },
    { name: 'Pediatrics', value: 18 },
    { name: 'Orthopedics', value: 14 },
    { name: 'General Med', value: 12 },
  ];

  const COLORS = ['#FF8A3D', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 transition"
        >
          ← Back to Dashboard
        </button>

        {/* Period Selector Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button
            onClick={() => setPeriod('daily')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${period === 'daily' ? 'bg-white dark:bg-slate-900 text-healthcare-600 shadow' : 'text-slate-500'}`}
          >
            Daily Report
          </button>
          <button
            onClick={() => setPeriod('weekly')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${period === 'weekly' ? 'bg-white dark:bg-slate-900 text-healthcare-600 shadow' : 'text-slate-500'}`}
          >
            Weekly Report
          </button>
          <button
            onClick={() => setPeriod('monthly')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition ${period === 'monthly' ? 'bg-white dark:bg-slate-900 text-healthcare-600 shadow' : 'text-slate-500'}`}
          >
            Monthly Report
          </button>
        </div>
      </div>

      {/* Revenue Trend Area Chart */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-healthcare-500" />
              <span>Multi-Clinic Revenue & Patient Consultation Trends</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">Aggregated across all 10 clinic branches.</p>
          </div>
          <span className="text-xs font-bold text-healthcare-600 bg-healthcare-100 px-3 py-1 rounded-full">
            Total H2 Revenue: ₹3,830,000
          </span>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyRevenueData}>
              <defs>
                <linearGradient id="areaRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF8A3D" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#FF8A3D" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
              <YAxis stroke="#94A3B8" fontSize={11} />
              <Tooltip />
              <Area type="monotone" dataKey="revenue" stroke="#FF8A3D" strokeWidth={3} fillOpacity={1} fill="url(#areaRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Department Distribution & Doctor Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        <GlassCard className="space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center space-x-2">
            <PieChartIcon className="w-5 h-5 text-healthcare-500" />
            <span>Consultation Distribution by Specialty</span>
          </h3>

          <div className="h-60 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={deptDistributionData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {deptDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="space-y-4">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center space-x-2">
            <Building2 className="w-5 h-5 text-healthcare-500" />
            <span>Clinic Performance Benchmarking</span>
          </h3>

          <div className="space-y-3 text-xs">
            {clinics.slice(0, 4).map((c) => (
              <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">{c.name}</h4>
                  <span className="text-slate-400 text-[10px]">{c.city} • Rating {c.rating}★</span>
                </div>
                <div className="text-right font-extrabold text-healthcare-500">
                  {c.liveQueueLength} In Queue • ~{c.avgWaitTimeMin}m Wait
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

      </div>

    </div>
  );
};
