import React from 'react';
import {
  ListOrdered,
  Plus,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Stethoscope
} from 'lucide-react';
import { QueueEntry, QueuePriority } from '../../types/queue.js';

interface QueueTableProps {
  queue: QueueEntry[];
  onAddToQueueClick: () => void;
}

export const QueueTable: React.FC<QueueTableProps> = ({ queue, onAddToQueueClick }) => {
  const priorityBadges: Record<
    QueuePriority,
    { label: string; bg: string; text: string; border: string; icon?: React.ComponentType<{ className?: string }> }
  > = {
    NORMAL: {
      label: 'Normal',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300',
    },
    URGENT: {
      label: 'Urgent',
      bg: 'bg-amber-50',
      text: 'text-amber-800',
      border: 'border-amber-300',
      icon: AlertTriangle,
    },
    EMERGENCY: {
      label: 'Emergency',
      bg: 'bg-rose-100',
      text: 'text-rose-900 font-bold',
      border: 'border-rose-300',
      icon: Flame,
    },
  };

  const waitingQueue = queue.filter((q) => q.status === 'WAITING' || q.status === 'IN_CONSULTATION');

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/60">
            <ListOrdered className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Current Waiting Queue</h2>
              <span className="px-2 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200/60">
                {waitingQueue.length} in line
              </span>
            </div>
            <p className="text-xs text-slate-500">Live triage and waiting time tracker</p>
          </div>
        </div>

        <button
          id="add-to-queue-btn"
          onClick={onAddToQueueClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add to Queue</span>
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-5 text-center">Pos</th>
              <th className="py-3 px-5">Queue #</th>
              <th className="py-3 px-5">Patient</th>
              <th className="py-3 px-5">Doctor</th>
              <th className="py-3 px-5">Priority</th>
              <th className="py-3 px-5">Waiting Time</th>
              <th className="py-3 px-5">Est. Wait</th>
              <th className="py-3 px-5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {waitingQueue.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">Queue is empty</p>
                    <p className="text-xs text-slate-400 mt-0.5">All checked-in patients have been served</p>
                  </div>
                </td>
              </tr>
            ) : (
              waitingQueue.map((entry, index) => {
                const priorityInfo = priorityBadges[entry.priority] || priorityBadges.NORMAL;
                const PriorityIcon = priorityInfo.icon;
                const isEmergency = entry.priority === 'EMERGENCY';

                return (
                  <tr
                    key={entry.id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isEmergency ? 'bg-rose-50/40 border-l-4 border-l-rose-500' : ''
                    }`}
                  >
                    {/* Position */}
                    <td className="py-3.5 px-5 text-center">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        entry.status === 'IN_CONSULTATION'
                          ? 'bg-purple-600 text-white animate-pulse'
                          : (entry.queuePosition === 1 || (!entry.queuePosition && index === 0))
                          ? 'bg-teal-600 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {entry.status === 'IN_CONSULTATION' ? '•' : (entry.queuePosition ?? (index + 1))}
                      </span>
                    </td>

                    {/* Queue # */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className={`font-mono font-bold text-xs px-2 py-1 rounded-md border ${
                        isEmergency
                          ? 'bg-rose-100 text-rose-800 border-rose-300'
                          : 'bg-slate-100 text-slate-800 border-slate-200'
                      }`}>
                        {entry.queueNumber}
                      </span>
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-5 font-semibold text-slate-900 text-sm">
                      {entry.patientName}
                    </td>

                    {/* Doctor */}
                    <td className="py-3.5 px-5 text-slate-800 text-xs sm:text-sm">
                      <div className="flex items-center gap-1.5">
                        <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                        <span>{entry.doctorName}</span>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs border ${
                          priorityInfo.bg
                        } ${priorityInfo.text} ${priorityInfo.border} ${
                          isEmergency ? 'animate-pulse' : ''
                        }`}
                      >
                        {PriorityIcon && <PriorityIcon className="w-3.5 h-3.5" />}
                        <span>{priorityInfo.label}</span>
                      </span>
                    </td>

                    {/* Waiting Time */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{entry.waitingTime} min</span>
                      </div>
                    </td>

                    {/* Estimated Wait */}
                    <td className="py-3.5 px-5 whitespace-nowrap text-xs">
                      {entry.estimatedWait === 0 || isEmergency ? (
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Immediate</span>
                      ) : (
                        <span className="text-slate-700 font-medium">{entry.estimatedWait} min</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        entry.status === 'IN_CONSULTATION'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          entry.status === 'IN_CONSULTATION' ? 'bg-purple-600' : 'bg-amber-500'
                        }`} />
                        {entry.status === 'IN_CONSULTATION' ? 'In Consultation' : 'Waiting'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
