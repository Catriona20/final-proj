import React, { useState } from 'react';
import { analyzeSymptoms, forecastPharmacyDemand, predictNoShowRisk, PEAK_HOURS_HEATMAP } from './ai-engine';
import { INITIAL_CLINICS, INITIAL_DOCTORS, GENERATED_APPOINTMENTS, GENERATED_PHARMACY_ITEMS } from './dummy-data';
import { GlassCard } from './shared-components/GlassCard';
import { 
  Brain, 
  Cpu, 
  Sparkles, 
  Zap, 
  Activity, 
  ShieldAlert, 
  BarChart2, 
  Search, 
  CheckCircle2, 
  Clock,
  Layers
} from 'lucide-react';

export const AIEngineInspector: React.FC = () => {
  const [testSymptom, setTestSymptom] = useState('Severe crushing chest pain, shortness of breath and sweating');
  const [analysisResult, setAnalysisResult] = useState(() => analyzeSymptoms(testSymptom, 'Mumbai', INITIAL_CLINICS, INITIAL_DOCTORS));

  const handleTestRun = () => {
    setAnalysisResult(analyzeSymptoms(testSymptom, 'Mumbai', INITIAL_CLINICS, INITIAL_DOCTORS));
  };

  const pharmacyForecast = forecastPharmacyDemand(GENERATED_PHARMACY_ITEMS);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-healthcare-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-healthcare-500/40 shadow-2xl space-y-3">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-healthcare-500 text-white flex items-center justify-center font-bold text-2xl shadow-floating animate-glow">
            🤖
          </div>
          <div>
            <h2 className="text-2xl font-black">AI Core Neural Inspector & Triage Simulator</h2>
            <p className="text-xs text-slate-300">Live operational inspection of HealthcareAI algorithmic models</p>
          </div>
        </div>
      </div>

      {/* Model 1: Live Interactive Symptom Analyzer */}
      <GlassCard className="space-y-4 border-healthcare-300">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-healthcare-500" />
            <span>Model 1: NLP Clinical Triage & Emergency Detector</span>
          </h3>
          <span className="text-xs font-bold text-healthcare-600 bg-healthcare-100 px-2.5 py-0.5 rounded-full">
            Rule-Based + Neural Classification
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={testSymptom}
              onChange={(e) => setTestSymptom(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-medium"
            />
            <button
              onClick={handleTestRun}
              className="px-4 py-2.5 rounded-xl bg-healthcare-500 hover:bg-healthcare-600 text-white font-extrabold text-xs shadow transition"
            >
              Run Test Triage
            </button>
          </div>

          {/* Result Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white">Department: <strong className="text-healthcare-500">{analysisResult.recommendedDepartment}</strong></span>
              <span className={`px-2.5 py-0.5 rounded-full font-extrabold uppercase ${
                analysisResult.isEmergencyDetected ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
              }`}>
                Priority: {analysisResult.priorityLevel}
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">{analysisResult.explanation}</p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
              <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border">
                <span className="text-[10px] text-slate-400 block">Est. Consultation</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{analysisResult.estimatedConsultationTimeMin} Mins</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border">
                <span className="text-[10px] text-slate-400 block">AI Match Score</span>
                <span className="font-bold text-healthcare-600">{analysisResult.confidenceScore}%</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border">
                <span className="text-[10px] text-slate-400 block">Recommended Doc</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{analysisResult.possibleDoctorName}</span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2 rounded-xl border">
                <span className="text-[10px] text-slate-400 block">Emergency Status</span>
                <span className={`font-bold ${analysisResult.isEmergencyDetected ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {analysisResult.isEmergencyDetected ? '🚨 Flagged' : '🟢 Clear'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Model 2: Pharmacy AI Demand Forecaster */}
      <GlassCard className="space-y-4">
        <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
          <Activity className="w-5 h-5 text-healthcare-500" />
          <span>Model 2: Inventory Demand & Restock Predictor</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border">
            <span className="text-slate-400 font-semibold block uppercase">Total Valued SKUs</span>
            <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block">{GENERATED_PHARMACY_ITEMS.length} Items</span>
          </div>

          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200">
            <span className="text-rose-700 font-semibold block uppercase">Critical Restock Alerts</span>
            <span className="text-2xl font-black text-rose-500 mt-1 block">{pharmacyForecast.criticalRestockCount} SKUs</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200">
            <span className="text-amber-700 font-semibold block uppercase">High AI Surge Demand</span>
            <span className="text-2xl font-black text-amber-500 mt-1 block">{pharmacyForecast.highDemandCount} SKUs</span>
          </div>
        </div>
      </GlassCard>

    </div>
  );
};
