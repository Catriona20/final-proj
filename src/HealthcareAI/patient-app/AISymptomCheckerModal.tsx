import React, { useState } from 'react';
import { Clinic, Doctor, SymptomAnalysisResult } from '../types';
import { analyzeSymptoms } from '../ai-engine';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  Sparkles, 
  Mic, 
  Upload, 
  AlertTriangle, 
  CheckCircle2, 
  Stethoscope, 
  Building2, 
  Clock, 
  ChevronRight, 
  X,
  Volume2,
  ShieldAlert,
  Zap
} from 'lucide-react';

interface AISymptomCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinics: Clinic[];
  doctors: Doctor[];
  onSelectDoctorAndClinic: (doctorId: string, clinicId: string) => void;
}

export const AISymptomCheckerModal: React.FC<AISymptomCheckerModalProps> = ({
  isOpen,
  onClose,
  clinics,
  doctors,
  onSelectDoctorAndClinic,
}) => {
  const [symptomText, setSymptomText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<SymptomAnalysisResult | null>(null);

  if (!isOpen) return null;

  const handleSimulateVoice = () => {
    setIsListening(true);
    setTimeout(() => {
      setSymptomText('Chest tightness, mild shortness of breath after climbing stairs, and left shoulder stiffness.');
      setIsListening(false);
    }, 1800);
  };

  const handleSimulateImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSymptomText('Red itchy skin rash with small vesicles on right forearm for 3 days.');
    }
  };

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptomText.trim()) return;

    setAnalyzing(true);
    setTimeout(() => {
      const res = analyzeSymptoms(symptomText, 'Mumbai', clinics, doctors);
      setResult(res);
      setAnalyzing(false);
    }, 1200);
  };

  const presetSymptoms = [
    'Chest discomfort & shortness of breath',
    'Severe skin rash with red spots',
    'High fever, body pain & shivering',
    'Persistent knee pain & morning stiffness',
    'Migraine headache & blurred vision',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8 animate-fade-in">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-healthcare-500 text-white flex items-center justify-center shadow-floating">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">AI Clinical Triage Engine</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">NLP Powered Symptom Analysis & Emergency Detector</p>
          </div>
        </div>

        {/* Symptom Input Form */}
        <form onSubmit={handleAnalyze} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Describe your symptoms (Type, speak, or upload image)
            </label>

            <div className="relative">
              <textarea
                rows={3}
                value={symptomText}
                onChange={(e) => setSymptomText(e.target.value)}
                placeholder="e.g. Sharp pain in chest when breathing deeply, accompanied by dizziness..."
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-healthcare-500 resize-none shadow-inner"
              />

              {/* Voice & Image Buttons inside Textarea */}
              <div className="absolute bottom-3 right-3 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSimulateVoice}
                  className={`p-2 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-healthcare-100'
                  }`}
                  title="Voice Input Simulation"
                >
                  <Mic className="w-4 h-4" />
                  <span className="text-[10px] hidden sm:inline">{isListening ? 'Listening...' : 'Voice'}</span>
                </button>

                <label className="p-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-healthcare-100 cursor-pointer transition flex items-center gap-1">
                  <Upload className="w-4 h-4" />
                  <span className="text-[10px] hidden sm:inline">Image</span>
                  <input type="file" accept="image/*" className="hidden" onChange={handleSimulateImageUpload} />
                </label>
              </div>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <span className="text-[10px] font-bold text-slate-400 py-1 mr-1">Quick Presets:</span>
            {presetSymptoms.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setSymptomText(preset)}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-medium hover:bg-healthcare-100 hover:text-healthcare-600 transition"
              >
                + {preset}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={analyzing || !symptomText.trim()}
            className="w-full py-3.5 rounded-2xl bg-healthcare-500 hover:bg-healthcare-600 disabled:opacity-50 text-white font-extrabold text-sm shadow-floating transition-all flex items-center justify-center space-x-2"
          >
            {analyzing ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>AI Clinical Neural Engine Processing...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-white" />
                <span>Run AI Symptom Analysis</span>
              </>
            )}
          </button>
        </form>

        {/* AI Output Analysis Results */}
        {result && (
          <div className="mt-6 space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800 animate-fade-in">
            
            {/* Emergency Alert Banner if Emergency Detected */}
            {result.isEmergencyDetected ? (
              <div className="p-4 rounded-2xl bg-rose-500 text-white shadow-lg space-y-2">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="w-6 h-6 text-amber-300 animate-bounce" />
                  <h4 className="font-black text-base">🚨 EMERGENCY DETECTED — PRIORITY 1 TRIAGE</h4>
                </div>
                <p className="text-xs text-rose-100 leading-relaxed">
                  {result.explanation}
                </p>
                <div className="flex items-center space-x-3 pt-2">
                  <a
                    href="tel:108"
                    className="px-4 py-2 rounded-xl bg-white text-rose-600 font-extrabold text-xs shadow hover:bg-slate-100 transition"
                  >
                    📞 Speed Dial 108 Ambulance
                  </a>
                  <span className="text-xs text-rose-100 font-semibold">Nearest ICU: Apex Healthcare (1.8 km)</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-healthcare-50/80 dark:bg-healthcare-950/40 border border-healthcare-300 dark:border-healthcare-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-healthcare-700 dark:text-healthcare-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-healthcare-500" /> AI Triage Assessment
                  </span>
                  <span className="bg-healthcare-500 text-white px-2.5 py-0.5 rounded-full text-xs font-extrabold">
                    {result.confidenceScore}% Confidence
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-2 leading-relaxed font-medium">
                  {result.explanation}
                </p>
              </div>
            )}

            {/* AI Breakdown Specs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Recommended Specialty</span>
                <span className="font-extrabold text-healthcare-600 dark:text-healthcare-400 mt-0.5 block">
                  {result.recommendedDepartment}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Triage Priority</span>
                <span className={`font-extrabold mt-0.5 block ${
                  result.priorityLevel === 'Emergency' ? 'text-rose-500' : result.priorityLevel === 'Urgent' ? 'text-amber-500' : 'text-emerald-500'
                }`}>
                  {result.priorityLevel}
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Est. Consultation</span>
                <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block">
                  ~{result.estimatedConsultationTimeMin} Mins
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/80 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 block uppercase font-semibold">Recommended Doctor</span>
                <span className="font-extrabold text-slate-900 dark:text-white mt-0.5 block truncate">
                  {result.possibleDoctorName}
                </span>
              </div>
            </div>

            {/* Direct Action Button to Book Recommended Doctor */}
            <button
              onClick={() => {
                onSelectDoctorAndClinic(result.possibleDoctorId, result.recommendedClinicId);
                onClose();
              }}
              className="w-full py-3.5 rounded-2xl bg-healthcare-500 hover:bg-healthcare-600 text-white font-extrabold text-sm shadow-floating transition-all flex items-center justify-center space-x-2"
            >
              <span>Book Appointment with {result.possibleDoctorName}</span>
              <ChevronRight className="w-4 h-4" />
            </button>

          </div>
        )}

      </div>
    </div>
  );
};
