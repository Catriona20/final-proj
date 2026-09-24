import React, { useState } from 'react';
import { Appointment, Clinic } from '../types';
import { GlassCard } from '../shared-components/GlassCard';
import { 
  Zap, 
  Users, 
  Clock, 
  ArrowUp, 
  ArrowDown, 
  UserPlus, 
  CheckCircle2, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';

interface QueueManagementProps {
  clinic: Clinic;
  appointments: Appointment[];
  onBack: () => void;
}

export const QueueManagement: React.FC<QueueManagementProps> = ({
  clinic,
  appointments,
  onBack,
}) => {
  const [queueList, setQueueList] = useState<Appointment[]>(
    appointments.filter(a => a.clinicId === clinic.id)
  );

  const moveUp = (index: number) => {
    if (index === 0) return;
    const updated = [...queueList];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    setQueueList(updated);
  };

  const moveDown = (index: number) => {
    if (index === queueList.length - 1) return;
    const updated = [...queueList];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    setQueueList(updated);
  };

  const setPriority = (id: string, priority: 'Standard' | 'Urgent' | 'Emergency') => {
    setQueueList(queueList.map(item => item.id === id ? { ...item, priorityLevel: priority } : item));
  };

  const advanceToken = (id: string) => {
    setQueueList(queueList.map(item => item.id === id ? { ...item, status: 'Completed' } : item));
  };

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="px-3.5 py-1.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-bold hover:bg-slate-100 transition"
        >
          ← Back to Dashboard
        </button>

        <span className="text-xs font-bold px-3 py-1 rounded-full bg-healthcare-100 text-healthcare-700">
          Live Dynamic Queue Dispatcher
        </span>
      </div>

      <GlassCard className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-healthcare-500 fill-healthcare-500" />
              <span>Real-Time Priority Queue Matrix — {clinic.name}</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Drag or re-order patient tokens dynamically to handle priority cases or emergency walk-ins.
            </p>
          </div>

          <button
            onClick={() => {
              const newApt: Appointment = {
                id: `apt-${Date.now()}`,
                patientId: 'p10',
                patientName: 'Walk-In Patient (Rajesh Sharma)',
                doctorId: 'd1',
                doctorName: 'Dr. Rajesh Sharma',
                specialization: 'Cardiology',
                clinicId: clinic.id,
                clinicName: clinic.name,
                date: new Date().toISOString().split('T')[0],
                timeSlot: '03:30 PM',
                tokenNumber: queueList.length + 1,
                status: 'In-Queue',
                priorityLevel: 'Urgent',
                symptoms: ['Chest palpitations'],
                fee: 1500,
              };
              setQueueList([newApt, ...queueList]);
            }}
            className="px-4 py-2.5 rounded-2xl bg-healthcare-500 hover:bg-healthcare-600 text-white font-extrabold text-xs shadow-floating transition flex items-center space-x-1.5"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Add Emergency Walk-In</span>
          </button>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                <th className="p-3 rounded-l-xl">Token</th>
                <th className="p-3">Patient Name</th>
                <th className="p-3">Doctor & Dept</th>
                <th className="p-3">Priority Level</th>
                <th className="p-3">Status</th>
                <th className="p-3 rounded-r-xl text-right">Actions / Re-order</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {queueList.slice(0, 10).map((apt, idx) => (
                <tr key={apt.id} className={`transition ${apt.status === 'Completed' ? 'opacity-40 bg-slate-50' : 'hover:bg-slate-50/50'}`}>
                  <td className="p-3">
                    <span className="w-8 h-8 rounded-xl bg-healthcare-500 text-white font-black flex items-center justify-center text-xs shadow">
                      #{apt.tokenNumber.toString().padStart(2, '0')}
                    </span>
                  </td>

                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    {apt.patientName}
                    <span className="block text-[10px] text-slate-400 font-normal">{apt.symptoms.join(', ')}</span>
                  </td>

                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">
                    {apt.doctorName}
                    <span className="block text-[10px] text-healthcare-600">{apt.specialization}</span>
                  </td>

                  <td className="p-3">
                    <select
                      value={apt.priorityLevel}
                      onChange={(e) => setPriority(apt.id, e.target.value as any)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold border-none focus:outline-none cursor-pointer ${
                        apt.priorityLevel === 'Emergency' ? 'bg-rose-500 text-white' : apt.priorityLevel === 'Urgent' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      <option value="Standard">Standard</option>
                      <option value="Urgent">Urgent</option>
                      <option value="Emergency">Emergency 🚨</option>
                    </select>
                  </td>

                  <td className="p-3 font-extrabold text-slate-700 dark:text-slate-300">
                    {apt.status}
                  </td>

                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end space-x-1">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700"
                        title="Move Up Queue"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === queueList.length - 1}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-30 text-slate-700"
                        title="Move Down Queue"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>

                      {apt.status !== 'Completed' && (
                        <button
                          onClick={() => advanceToken(apt.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold text-[10px] shadow hover:bg-emerald-600 transition ml-2"
                        >
                          Mark Served ✓
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

    </div>
  );
};
