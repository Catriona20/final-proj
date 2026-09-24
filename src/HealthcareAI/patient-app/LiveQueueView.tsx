import React, { useState } from 'react';
import { Appointment, Clinic, Doctor } from '../types';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  Zap, 
  Clock, 
  Users, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Bell, 
  RefreshCw, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

interface LiveQueueViewProps {
  appointment: Appointment;
  clinic: Clinic;
  doctor: Doctor;
  onSimulateCancellation: () => void;
  onShiftSlot: (newSlot: string) => void;
}

export const LiveQueueView: React.FC<LiveQueueViewProps> = ({
  appointment,
  clinic,
  doctor,
  onSimulateCancellation,
  onShiftSlot,
}) => {
  const currentServingToken = Math.max(1, appointment.tokenNumber - 2);
  const totalAhead = appointment.tokenNumber - currentServingToken;
  const estWaitMin = totalAhead * 6;

  const [hasShifted, setHasShifted] = useState(false);

  const queueSteps = Array.from({ length: 6 }, (_, i) => ({
    token: i + 1,
    status: i + 1 < currentServingToken ? 'served' : i + 1 === currentServingToken ? 'serving' : i + 1 === appointment.tokenNumber ? 'user' : 'waiting',
  }));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">

      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-healthcare-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-700/60 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-healthcare-500/20 rounded-full blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center sm:text-left">
            <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-healthcare-500/30 text-healthcare-300 text-xs font-extrabold border border-healthcare-500/40">
              <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>Real-Time Queue Token Matrix</span>
            </span>

            <h2 className="text-2xl sm:text-3xl font-black">{clinic.name}</h2>
            <p className="text-xs text-slate-300">
              Consultation with <strong>{doctor.name}</strong> ({doctor.specialization})
            </p>
          </div>

          {/* Large Token Badge Display */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-3xl text-center min-w-[140px]">
            <span className="text-[10px] uppercase font-bold tracking-widest text-healthcare-300 block">Your Token</span>
            <div className="text-4xl font-black text-white mt-1">#{appointment.tokenNumber.toString().padStart(2, '0')}</div>
            <span className="text-[10px] text-emerald-400 font-semibold block mt-1">Confirmed • {appointment.timeSlot}</span>
          </div>
        </div>
      </div>

      {/* Queue Metrics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <GlassCard className="text-center">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Currently Serving</span>
          <div className="text-3xl font-extrabold text-healthcare-500 mt-1">
            #{currentServingToken.toString().padStart(2, '0')}
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">Inside Doctor's Chamber</span>
        </GlassCard>

        <GlassCard className="text-center">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Patients Ahead</span>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {totalAhead} Patients
          </div>
          <span className="text-[10px] text-emerald-600 font-semibold block mt-1">Moving ~6 mins/patient</span>
        </GlassCard>

        <GlassCard className="text-center">
          <span className="text-xs text-slate-400 font-semibold block uppercase">Estimated Wait</span>
          <div className="text-3xl font-extrabold text-amber-500 mt-1">
            ~{estWaitMin} Mins
          </div>
          <span className="text-[10px] text-slate-500 block mt-1">AI Adaptive Estimate</span>
        </GlassCard>
      </div>

      {/* Animated Timeline Queue Flow */}
      <GlassCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center space-x-2">
            <Users className="w-5 h-5 text-healthcare-500" />
            <span>Live Chamber Flow</span>
          </h3>
          <span className="text-xs text-slate-400 font-semibold">Auto-refreshed 5s ago</span>
        </div>

        {/* Step Nodes Progress Bar */}
        <div className="flex items-center justify-between relative pt-6 pb-2 px-4">
          <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0" />
          
          {queueSteps.map((step) => (
            <div key={step.token} className="relative z-10 flex flex-col items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  step.status === 'user'
                    ? 'bg-healthcare-500 text-white ring-4 ring-healthcare-200 dark:ring-healthcare-900 scale-125 shadow-floating'
                    : step.status === 'serving'
                    ? 'bg-amber-500 text-white ring-4 ring-amber-200 dark:ring-amber-950 animate-pulse'
                    : step.status === 'served'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                }`}
              >
                #{step.token.toString().padStart(2, '0')}
              </div>
              <span className="text-[10px] font-bold mt-2 text-slate-600 dark:text-slate-400">
                {step.status === 'user' ? 'YOU' : step.status === 'serving' ? 'In Room' : step.status === 'served' ? 'Done' : 'Waiting'}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Dynamic Scheduling & Patient Cancellation Simulation Trigger */}
      <GlassCard className="border-2 border-dashed border-healthcare-300 dark:border-healthcare-700 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase bg-healthcare-100 text-healthcare-700 px-2.5 py-0.5 rounded-full">
              ⚡ Adaptive AI Queue Simulation
            </span>
            <h4 className="font-bold text-base text-slate-900 dark:text-white mt-1">Dynamic Slot Shift Trigger</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Simulate another patient cancelling an earlier 02:10 PM slot. The platform will automatically offer you an immediate slot shift!
            </p>
          </div>
        </div>

        <button
          onClick={onSimulateCancellation}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
        >
          <RefreshCw className="w-4 h-4 text-healthcare-400" />
          <span>Simulate Patient Cancellation at 02:10 PM</span>
        </button>
      </GlassCard>

    </div>
  );
};
