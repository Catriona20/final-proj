import React from 'react';
import { GlassCard } from '../shared-components/GlassCard';
import { BookOpen, Sparkles, Smartphone, Stethoscope, Building2, Cpu, CheckCircle2 } from 'lucide-react';

export const HealthcareGuide: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-soft space-y-3">
        <div className="flex items-center space-x-3">
          <BookOpen className="w-8 h-8 text-healthcare-500" />
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">HealthcareAI Architecture & User Guide</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">High-fidelity multi-clinic ecosystem and AI clinical triage platform</p>
          </div>
        </div>
      </div>

      <GlassCard className="space-y-4">
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Folder Structure Breakdown</h3>
        <pre className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs font-mono overflow-x-auto leading-relaxed">
{`HealthcareAI/
├── patient-app/           # Patient mobile & desktop views (Triage, Booking, Live Queue, Vault)
├── doctor-app/            # Doctor mobile & tablet views (Prescription Builder, Schedule, Workload)
├── clinic-dashboard/      # Receptionist & Admin SaaS platform (Priority Queue, AI Insights, Pharmacy)
├── shared-components/     # Reusable glassmorphic UI, Interactive GIS Map, Toast Alerts, Header
├── dummy-data/            # 50 Patients, 20 Doctors, 10 Clinics, 500 Appointments, 100 Pharmacy Items
├── ai-engine/             # NLP Symptom Triage, No-Show Risk Engine, Stock Forecaster
└── documentation/         # Technical Specs & Operational Guide`}
        </pre>
      </GlassCard>
    </div>
  );
};
