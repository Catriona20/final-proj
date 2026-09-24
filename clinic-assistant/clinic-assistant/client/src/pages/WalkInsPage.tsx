import React, { useState, useMemo } from 'react';
import {
  Footprints,
  Plus,
  Clock,
  Stethoscope,
  Phone,
  Search,
  Filter,
  AlertTriangle,
  Flame,
  CheckCircle2,
  UserCheck
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext.js';
import { WalkIn, WalkInStatus } from '../types/walkin.js';
import { QueuePriority } from '../types/queue.js';
import { WalkInModal } from '../components/dashboard/WalkInModal.js';

interface WalkInsPageProps {
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export const WalkInsPage: React.FC<WalkInsPageProps> = ({
  searchQuery = '',
  setSearchQuery,
}) => {
  const { walkIns, doctors, addWalkIn } = useClinic();

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedPriorityFilter, setSelectedPriorityFilter] = useState<string>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');
  const [isAddWalkInOpen, setIsAddWalkInOpen] = useState(false);

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
      text: 'text-amber-800 font-semibold',
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

  const filteredWalkIns = useMemo(() => {
    return walkIns.filter((w) => {
      const matchesStatus =
        selectedStatusFilter === 'ALL' || w.status === selectedStatusFilter;

      const prio = w.priority || 'NORMAL';
      const matchesPriority =
        selectedPriorityFilter === 'ALL' || prio === selectedPriorityFilter;

      const q = (searchQuery || localSearch).toLowerCase().trim();
      const matchesSearch =
        !q ||
        w.id.toLowerCase().includes(q) ||
        w.patientName.toLowerCase().includes(q) ||
        w.phone.toLowerCase().includes(q) ||
        w.reason.toLowerCase().includes(q) ||
        w.preferredDoctor.toLowerCase().includes(q);

      return matchesStatus && matchesPriority && matchesSearch;
    });
  }, [walkIns, selectedStatusFilter, selectedPriorityFilter, searchQuery, localSearch]);

  const emergencyCount = walkIns.filter((w) => w.priority === 'EMERGENCY').length;
  const urgentCount = walkIns.filter((w) => w.priority === 'URGENT').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 border border-purple-200/60 shadow-xs">
            <Footprints className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Walk-In Patient Intake</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-purple-50 text-purple-700 rounded-full border border-purple-200/60">
                {walkIns.length} Registered Today
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unscheduled front-desk arrivals, emergency triage registration, and immediate queue dispatch.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddWalkInOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Walk-in</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Total Walk-Ins Today</span>
            <div className="text-2xl font-bold text-slate-900 mt-0.5">{walkIns.length}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center font-bold">
            <Footprints className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Emergency Triage Arrivals</span>
            <div className="text-2xl font-bold text-rose-600 mt-0.5">{emergencyCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center font-bold">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-subtle flex items-center justify-between">
          <div>
            <span className="text-xs font-medium text-slate-500">Urgent Consultations</span>
            <div className="text-2xl font-bold text-amber-600 mt-0.5">{urgentCount}</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle overflow-hidden">
        {/* Search & Filters */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by ID (W001), patient name, reason, or physician..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="WAITING">Waiting</option>
              <option value="IN_CONSULTATION">In Consultation</option>
              <option value="COMPLETED">Completed</option>
            </select>

            <select
              value={selectedPriorityFilter}
              onChange={(e) => setSelectedPriorityFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="ALL">All Priorities</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="URGENT">Urgent</option>
              <option value="NORMAL">Normal</option>
            </select>
          </div>
        </div>

        {/* Walk-in Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">ID</th>
                <th className="py-3 px-5">Patient Name</th>
                <th className="py-3 px-5">Contact Phone</th>
                <th className="py-3 px-5">Reason for Visit</th>
                <th className="py-3 px-5">Preferred Doctor</th>
                <th className="py-3 px-5">Reg Time</th>
                <th className="py-3 px-5">Priority</th>
                <th className="py-3 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredWalkIns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <Footprints className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No walk-in records found</p>
                    <p className="text-xs text-slate-400 mt-0.5">Click "Add Walk-in" to register new arrivals</p>
                  </td>
                </tr>
              ) : (
                filteredWalkIns.map((walkIn) => {
                  const prio = walkIn.priority || 'NORMAL';
                  const priorityInfo = priorityBadges[prio] || priorityBadges.NORMAL;
                  const PriorityIcon = priorityInfo.icon;
                  const isEmergency = prio === 'EMERGENCY';

                  return (
                    <tr
                      key={walkIn.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isEmergency ? 'bg-rose-50/40 border-l-4 border-l-rose-500' : ''
                      }`}
                    >
                      {/* ID */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          {walkIn.id}
                        </span>
                      </td>

                      {/* Patient Name */}
                      <td className="py-3.5 px-5 font-semibold text-slate-900 text-sm">
                        {walkIn.patientName}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-5 whitespace-nowrap font-mono text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{walkIn.phone}</span>
                        </div>
                      </td>

                      {/* Reason */}
                      <td className="py-3.5 px-5 text-xs text-slate-700">
                        <span className="bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200/80 inline-block font-medium">
                          {walkIn.reason}
                        </span>
                      </td>

                      {/* Preferred Doctor */}
                      <td className="py-3.5 px-5 text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
                          <span>{walkIn.preferredDoctor}</span>
                        </div>
                      </td>

                      {/* Registration Time */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-xs text-slate-600">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{walkIn.registeredAt}</span>
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

                      {/* Status */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${
                            walkIn.status === 'IN_CONSULTATION'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : walkIn.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              walkIn.status === 'IN_CONSULTATION'
                                ? 'bg-purple-600'
                                : walkIn.status === 'COMPLETED'
                                ? 'bg-emerald-600'
                                : 'bg-amber-500'
                            }`}
                          />
                          {walkIn.status === 'WAITING' ? 'Waiting in Queue' : walkIn.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Showing <strong className="text-slate-800">{filteredWalkIns.length}</strong> of{' '}
            {walkIns.length} walk-in records
          </span>
          <span className="text-[11px] text-slate-400">
            Automatically synchronized with waiting line
          </span>
        </div>
      </div>

      {/* MODAL */}
      <WalkInModal
        isOpen={isAddWalkInOpen}
        onClose={() => setIsAddWalkInOpen(false)}
        doctors={doctors}
        onAddWalkIn={(data) => addWalkIn(data)}
      />
    </div>
  );
};
