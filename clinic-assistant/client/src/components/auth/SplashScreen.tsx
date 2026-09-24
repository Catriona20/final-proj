import React, { useEffect } from 'react';
import { Building2, ShieldCheck, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  message?: string;
  onComplete?: () => void;
  duration?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  message = 'Connecting you to care...',
  onComplete,
  duration = 1200,
}) => {
  useEffect(() => {
    if (!onComplete) return;
    const timer = setTimeout(() => {
      onComplete();
    }, duration);
    return () => clearTimeout(timer);
  }, [onComplete, duration]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white font-sans selection:bg-teal-500">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Brand Card */}
      <div className="relative flex flex-col items-center z-10 max-w-sm px-6 text-center animate-in fade-in zoom-in-95 duration-300">
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <h1 className="text-3xl font-black tracking-widest text-white">
            MEDLINK
          </h1>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 mt-2 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-300 text-xs font-semibold tracking-wide">
            Healthcare Platform • Clinic Assistant Workspace
          </div>
        </div>

        {/* MedLink Logo Container */}
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-teal-500 to-emerald-400 p-0.5 shadow-2xl shadow-teal-500/30 flex items-center justify-center animate-pulse">
            <div className="w-full h-full bg-slate-900 rounded-[22px] flex items-center justify-center">
              <Building2 className="w-10 h-10 text-teal-400" />
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 text-slate-950 rounded-full ring-4 ring-slate-900 shadow-sm">
            <ShieldCheck className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* Tagline */}
        <p className="text-sm font-medium text-slate-200 mb-6">
          Connecting you to care...
        </p>

        {/* Progress Bar / Indicator */}
        <div className="w-52 h-1.5 bg-slate-800 rounded-full overflow-hidden mb-3 relative">
          <div className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full animate-progress" />
        </div>

        <p className="text-[11px] font-mono text-slate-400">
          {message}
        </p>

        {/* Security / Compliance Badge */}
        <div className="mt-8 flex items-center gap-1.5 px-3 py-1 bg-slate-800/60 rounded-full border border-slate-700/60 text-[10px] text-slate-400">
          <Sparkles className="w-3 h-3 text-teal-400" />
          <span>Multi-Tenant Clinical Workspace • Outpatient Operations</span>
        </div>
      </div>
    </div>
  );
};
