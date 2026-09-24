import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Search,
  Filter,
  Eye,
  CheckCircle,
  UserCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowUpDown,
  UserX
} from 'lucide-react';
import { Appointment, AppointmentStatus } from '../../types/appointment.js';

interface AppointmentTableProps {
  appointments: Appointment[];
  searchQuery: string;
  onCheckInClick: (appointment: Appointment) => void;
  onViewDetailsClick: (appointment: Appointment) => void;
  onMarkNoShowClick?: (appointment: Appointment) => void;
}

const getTimeStr = (timeVal: any): string => {
  if (!timeVal) return '09:00 AM';
  if (typeof timeVal === 'string') return timeVal;
  if (typeof timeVal === 'object') {
    return timeVal.time || timeVal.time_slot || timeVal.slot || timeVal.label || '09:00 AM';
  }
  return String(timeVal);
};

const getStatusStr = (statusVal: any): AppointmentStatus => {
  let s = '';
  if (typeof statusVal === 'string') {
    s = statusVal;
  } else if (statusVal && typeof statusVal === 'object') {
    s = statusVal.status || statusVal.name || statusVal.value || '';
  }
  const clean = s.toUpperCase().replace(/[\s_-]+/g, '_');
  if (clean === 'CHECKED_IN' || clean === 'ARRIVED') return 'CHECKED_IN';
  if (clean === 'WAITING' || clean === 'ALMOST_YOUR_TURN' || clean === 'NEXT') return 'WAITING';
  if (clean === 'IN_CONSULTATION') return 'IN_CONSULTATION';
  if (clean === 'COMPLETED') return 'COMPLETED';
  if (clean === 'NO_SHOW') return 'NO_SHOW';
  if (clean === 'CANCELLED' || clean === 'CANCELED') return 'CANCELLED';
  return 'BOOKED';
};

export const AppointmentTable: React.FC<AppointmentTableProps> = ({
  appointments = [],
  searchQuery,
  onCheckInClick,
  onViewDetailsClick,
  onMarkNoShowClick,
}) => {
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');

  const statusBadges: Record<
    AppointmentStatus,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    BOOKED: {
      label: 'Booked',
      bg: 'bg-slate-100',
      text: 'text-slate-700',
      border: 'border-slate-300/80',
      dot: 'bg-slate-500',
    },
    CHECKED_IN: {
      label: 'Checked In',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-600',
    },
    WAITING: {
      label: 'Waiting',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    IN_CONSULTATION: {
      label: 'In Consultation',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      dot: 'bg-purple-600',
    },
    COMPLETED: {
      label: 'Completed',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-600',
    },
    NO_SHOW: {
      label: 'No Show',
      bg: 'bg-rose-50',
      text: 'text-rose-700',
      border: 'border-rose-200',
      dot: 'bg-rose-600',
    },
    CANCELLED: {
      label: 'Cancelled',
      bg: 'bg-slate-100',
      text: 'text-slate-500 line-through',
      border: 'border-slate-300',
      dot: 'bg-slate-400',
    },
  };

  const statusTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'BOOKED', label: 'Booked' },
    { id: 'CHECKED_IN', label: 'Checked In' },
    { id: 'WAITING', label: 'Waiting' },
    { id: 'IN_CONSULTATION', label: 'In Consultation' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'NO_SHOW', label: 'No Show' },
    { id: 'CANCELLED', label: 'Cancelled' },
  ];

  const filteredAppointments = useMemo(() => {
    return (appointments || []).filter((apt) => {
      const aptStatus = getStatusStr(apt.status);
      const matchesStatus =
        selectedStatusFilter === 'ALL' || aptStatus === selectedStatusFilter;

      const q = (searchQuery || localSearch).toLowerCase().trim();
      const patientName = String(apt.patientName || '').toLowerCase();
      const doctorName = String(apt.doctorName || '').toLowerCase();
      const typeStr = String(apt.type || '').toLowerCase();
      const timeStr = getTimeStr(apt.time).toLowerCase();

      const matchesSearch =
        !q ||
        patientName.includes(q) ||
        doctorName.includes(q) ||
        typeStr.includes(q) ||
        timeStr.includes(q);

      return matchesStatus && matchesSearch;
    });
  }, [appointments, selectedStatusFilter, searchQuery, localSearch]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-5 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600 border border-teal-200/60">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Today's Appointments</h2>
              <p className="text-xs text-slate-500">
                Scheduled consultations and check-in management
              </p>
            </div>
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {statusTabs.map((tab) => {
              const count =
                tab.id === 'ALL'
                  ? appointments.length
                  : appointments.filter((a) => getStatusStr(a.status) === tab.id).length;
              const isActive = selectedStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatusFilter(tab.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`ml-1.5 px-1.5 py-0.2 rounded-full text-[10px] ${
                      isActive ? 'bg-slate-800 text-slate-300' : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Search inside table if global search is not active */}
        <div className="mt-3.5 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Filter by patient name or doctor..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-slate-700">{filteredAppointments.length}</strong> of{' '}
            {appointments.length} appointments
          </span>
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
            <tr>
              <th className="py-3 px-5">Time</th>
              <th className="py-3 px-5">Patient</th>
              <th className="py-3 px-5">Doctor</th>
              <th className="py-3 px-5">Appointment Type</th>
              <th className="py-3 px-5">Status</th>
              <th className="py-3 px-5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredAppointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <div className="flex flex-col items-center justify-center">
                    <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600 text-sm">No appointments found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try clearing filters or search query
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAppointments.map((apt) => {
                const currentStatus = getStatusStr(apt.status);
                const badge = statusBadges[currentStatus] || statusBadges.BOOKED;
                const canCheckIn = currentStatus === 'BOOKED';
                const canMarkNoShow = currentStatus === 'BOOKED' || currentStatus === 'CHECKED_IN';
                const displayTime = getTimeStr(apt.time);
                const displayPatient = typeof apt.patientName === 'string' ? apt.patientName : 'Patient';
                const displayDoctor = typeof apt.doctorName === 'string' ? apt.doctorName : 'Doctor';
                const displayType = typeof apt.type === 'string' ? apt.type : 'Consultation';

                return (
                  <tr
                    key={apt.id}
                    id={`apt-row-${apt.id}`}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Time */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold text-slate-900 font-mono text-xs">
                          {displayTime}
                        </span>
                      </div>
                    </td>

                    {/* Patient */}
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-900 text-sm">{displayPatient}</div>
                      <div className="text-xs text-slate-400 font-mono">{String(apt.patientId || '')}</div>
                    </td>

                    {/* Doctor */}
                    <td className="py-3.5 px-5">
                      <div className="text-slate-800 font-medium text-xs sm:text-sm">
                        {displayDoctor}
                      </div>
                    </td>

                    {/* Type */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                        {displayType}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                        {badge.label}
                      </span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {canCheckIn && (
                          <button
                            id={`checkin-btn-${apt.id}`}
                            onClick={() => onCheckInClick(apt)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
                            title="Check-in patient"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            <span>Check In</span>
                          </button>
                        )}

                        {canMarkNoShow && onMarkNoShowClick && (
                          <button
                            id={`dash-noshow-btn-${apt.id}`}
                            onClick={() => onMarkNoShowClick(apt)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                            title="Mark patient as No-Show"
                          >
                            <UserX className="w-3.5 h-3.5" />
                            <span>No-Show</span>
                          </button>
                        )}

                        <button
                          id={`view-btn-${apt.id}`}
                          onClick={() => onViewDetailsClick(apt)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                          title="View appointment details"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-500" />
                          <span>View</span>
                        </button>
                      </div>
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
