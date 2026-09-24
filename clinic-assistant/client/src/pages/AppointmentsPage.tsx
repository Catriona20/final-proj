import React, { useState, useMemo } from 'react';
import {
  CalendarDays,
  Search,
  Filter,
  Eye,
  CheckCircle,
  Clock,
  UserCheck,
  Plus,
  Stethoscope,
  Calendar,
  AlertCircle,
  UserX
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext.js';
import { Appointment, AppointmentStatus } from '../types/appointment.js';
import { CheckInModal } from '../components/dashboard/CheckInModal.js';
import { AppointmentDetailModal } from '../components/dashboard/AppointmentDetailModal.js';
import { NewAppointmentModal } from '../components/appointments/NewAppointmentModal.js';
import { NoShowModal } from '../components/appointments/NoShowModal.js';

interface AppointmentsPageProps {
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
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

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({
  searchQuery = '',
  setSearchQuery,
}) => {
  const { appointments = [], doctors = [], patients = [], checkInAppointment, handleNoShow, addAppointment } = useClinic();

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedDoctorFilter, setSelectedDoctorFilter] = useState<string>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Modals
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [selectedCheckInApt, setSelectedCheckInApt] = useState<Appointment | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedDetailApt, setSelectedDetailApt] = useState<Appointment | null>(null);

  const [isNewAptOpen, setIsNewAptOpen] = useState(false);

  const [isNoShowModalOpen, setIsNoShowModalOpen] = useState(false);
  const [selectedNoShowApt, setSelectedNoShowApt] = useState<Appointment | null>(null);

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
      text: 'text-slate-500',
      border: 'border-slate-200',
      dot: 'bg-slate-400',
    },
  };

  const statusTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'TODAY', label: 'Today' },
    { id: 'UPCOMING', label: 'Upcoming' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'CANCELLED', label: 'Cancelled' },
    { id: 'NO_SHOW', label: 'No-show' },
  ];

  const todayDateStr = useMemo(() => {
    // Current date formatted in Indian locale YYYY-MM-DD
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  const getAptDateStr = (apt: Appointment): string => {
    if (!apt.date) return todayDateStr;
    const clean = apt.date.trim();
    if (clean.toLowerCase().startsWith('today')) return todayDateStr;
    if (clean.toLowerCase().startsWith('tomorrow')) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    const p = new Date(clean);
    if (!isNaN(p.getTime())) {
      return `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, '0')}-${String(p.getDate()).padStart(2, '0')}`;
    }
    return clean;
  };

  const isAptToday = (apt: Appointment): boolean => {
    return getAptDateStr(apt) === todayDateStr;
  };

  const isAptUpcoming = (apt: Appointment): boolean => {
    const d = getAptDateStr(apt);
    const s = getStatusStr(apt.status);
    return d > todayDateStr && !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(s);
  };

  const hasAptSlotGracePassed = (apt: Appointment): boolean => {
    const dStr = getAptDateStr(apt);
    if (dStr < todayDateStr) return true;
    if (dStr > todayDateStr) return false;
    // same day: check time + 10 mins grace
    const timeStr = getTimeStr(apt.time);
    const isPM = timeStr.toUpperCase().includes('PM');
    const isAM = timeStr.toUpperCase().includes('AM');
    const parts = timeStr.replace(/[^\d:]/g, '').split(':');
    let h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    if (isPM && h < 12) h += 12;
    if (isAM && h === 12) h = 0;
    const slotMins = h * 60 + m + 10;
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    return currentMins >= slotMins;
  };

  const filteredAppointments = useMemo(() => {
    return (appointments || []).filter((apt) => {
      const aptStatus = getStatusStr(apt.status);

      let matchesStatus = true;
      if (selectedStatusFilter === 'ALL') {
        matchesStatus = true;
      } else if (selectedStatusFilter === 'TODAY') {
        matchesStatus = isAptToday(apt) && aptStatus !== 'CANCELLED';
      } else if (selectedStatusFilter === 'UPCOMING') {
        matchesStatus = isAptUpcoming(apt);
      } else if (selectedStatusFilter === 'COMPLETED') {
        matchesStatus = aptStatus === 'COMPLETED';
      } else if (selectedStatusFilter === 'CANCELLED') {
        matchesStatus = aptStatus === 'CANCELLED';
      } else if (selectedStatusFilter === 'NO_SHOW') {
        matchesStatus = aptStatus === 'NO_SHOW';
      } else {
        matchesStatus = aptStatus === selectedStatusFilter;
      }

      const aptDocId = String(apt.doctorId || '');
      const aptDocName = String(apt.doctorName || '').toLowerCase();
      const matchesDoctor =
        selectedDoctorFilter === 'ALL' ||
        aptDocId === selectedDoctorFilter ||
        aptDocName.includes(selectedDoctorFilter.toLowerCase());

      const q = (searchQuery || localSearch).toLowerCase().trim();
      const idStr = String(apt.id || '').toLowerCase();
      const patientName = String(apt.patientName || '').toLowerCase();
      const deptStr = String(apt.department || '').toLowerCase();
      const typeStr = String(apt.type || '').toLowerCase();
      const timeStr = getTimeStr(apt.time).toLowerCase();

      const matchesSearch =
        !q ||
        idStr.includes(q) ||
        patientName.includes(q) ||
        aptDocName.includes(q) ||
        deptStr.includes(q) ||
        typeStr.includes(q) ||
        timeStr.includes(q);

      return matchesStatus && matchesDoctor && matchesSearch;
    });
  }, [appointments, selectedStatusFilter, selectedDoctorFilter, searchQuery, localSearch, todayDateStr]);

  const handleDirectCheckIn = (apt: Appointment) => {
    checkInAppointment(apt.id);
  };

  const handleOpenNoShow = (apt: Appointment) => {
    setSelectedNoShowApt(apt);
    setIsNoShowModalOpen(true);
  };

  const getTabCount = (tabId: string): number => {
    if (tabId === 'ALL') return appointments.length;
    if (tabId === 'TODAY') return appointments.filter((a) => isAptToday(a) && getStatusStr(a.status) !== 'CANCELLED').length;
    if (tabId === 'UPCOMING') return appointments.filter((a) => isAptUpcoming(a)).length;
    if (tabId === 'COMPLETED') return appointments.filter((a) => getStatusStr(a.status) === 'COMPLETED').length;
    if (tabId === 'CANCELLED') return appointments.filter((a) => getStatusStr(a.status) === 'CANCELLED').length;
    if (tabId === 'NO_SHOW') return appointments.filter((a) => getStatusStr(a.status) === 'NO_SHOW').length;
    return appointments.filter((a) => getStatusStr(a.status) === tabId).length;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & Quick Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200/60 shadow-xs">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Appointments Management</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200/60">
                {getTabCount('TODAY')} Total Today
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review daily schedules, filter by physician, process check-ins, or mark no-shows with automated queue rebalancing.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-teal-600" />
            <span>Today • {todayDateStr}</span>
          </div>

          <button
            onClick={() => setIsNewAptOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Book Appointment</span>
          </button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle overflow-hidden">
        {/* Filter Bar */}
        <div className="p-5 border-b border-slate-100 space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {statusTabs.map((tab) => {
              const count = getTabCount(tab.id);
              const isActive = selectedStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedStatusFilter(tab.id)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
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

          {/* Search & Doctor Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {/* Search Input */}
            <div className="relative sm:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                placeholder="Search by ID (APT001), patient name, doctor, or specialization..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              />
            </div>

            {/* Doctor Filter */}
            <div className="relative">
              <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedDoctorFilter}
                onChange={(e) => setSelectedDoctorFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              >
                <option value="ALL">All Doctors & Departments</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} ({doc.specialization})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Appointments Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">ID</th>
                <th className="py-3 px-5">Time</th>
                <th className="py-3 px-5">Patient</th>
                <th className="py-3 px-5">Doctor</th>
                <th className="py-3 px-5">Department</th>
                <th className="py-3 px-5">Type</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-slate-400">
                    <CalendarDays className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No appointments matching criteria</p>
                    <p className="text-xs text-slate-400 mt-0.5">Try resetting search query or status filter</p>
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((apt) => {
                  const currentStatus = getStatusStr(apt.status);
                  const badge = statusBadges[currentStatus] || statusBadges.BOOKED;
                  const aptIsToday = isAptToday(apt);
                  const canCheckIn = currentStatus === 'BOOKED' && aptIsToday;
                  const canMarkNoShow = (currentStatus === 'BOOKED' || currentStatus === 'CHECKED_IN' || currentStatus === 'WAITING') &&
                    hasAptSlotGracePassed(apt);
                  const displayTime = getTimeStr(apt.time);
                  const displayPatient = typeof apt.patientName === 'string' ? apt.patientName : 'Patient';
                  const displayDoctor = typeof apt.doctorName === 'string' ? apt.doctorName : 'Doctor';
                  const displayDept = typeof apt.department === 'string' ? apt.department : 'General Medicine';
                  const displayType = typeof apt.type === 'string' ? apt.type : 'Consultation';

                  return (
                    <tr
                      key={apt.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          {String(apt.id || '')}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
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

                      {/* Department */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="text-xs font-semibold text-teal-700 bg-teal-50/80 px-2 py-0.5 rounded-md border border-teal-200/60">
                          {displayDept}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {displayType}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          {badge.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {canCheckIn && (
                            <button
                              id={`checkin-btn-${apt.id}`}
                              onClick={() => handleDirectCheckIn(apt)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-teal-600 hover:bg-teal-700 text-white shadow-xs transition-colors"
                              title="Check-in patient"
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>Check In</span>
                            </button>
                          )}

                          {canMarkNoShow && (
                            <button
                              id={`noshow-btn-${apt.id}`}
                              onClick={() => handleOpenNoShow(apt)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors"
                              title="Mark patient as No-Show and trigger queue push notification"
                            >
                              <UserX className="w-3.5 h-3.5" />
                              <span>Mark No-Show</span>
                            </button>
                          )}

                          <button
                            id={`view-btn-${apt.id}`}
                            onClick={() => {
                              setSelectedDetailApt(apt);
                              setIsDetailOpen(true);
                            }}
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

        {/* Footer Summary */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Showing <strong className="text-slate-800">{filteredAppointments.length}</strong> of{' '}
            {appointments.length} appointments
          </span>
          <span className="text-[11px] text-slate-400">
            Appointments sorted chronologically by slot
          </span>
        </div>
      </div>

      {/* MODALS */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => {
          setIsCheckInOpen(false);
          setSelectedCheckInApt(null);
        }}
        appointments={appointments}
        doctors={doctors}
        selectedAppointment={selectedCheckInApt}
        onConfirmCheckIn={(aptId, docId, notes) => checkInAppointment(aptId, docId, notes)}
      />

      <AppointmentDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedDetailApt(null);
        }}
        appointment={selectedDetailApt}
        onCheckIn={(apt) => {
          setIsDetailOpen(false);
          checkInAppointment(apt.id);
        }}
      />

      <NewAppointmentModal
        isOpen={isNewAptOpen}
        onClose={() => setIsNewAptOpen(false)}
        doctors={doctors}
        patients={patients}
        onAddAppointment={(data) => addAppointment(data)}
      />

      <NoShowModal
        isOpen={isNoShowModalOpen}
        onClose={() => {
          setIsNoShowModalOpen(false);
          setSelectedNoShowApt(null);
        }}
        appointment={selectedNoShowApt}
        onConfirm={(aptId) => handleNoShow(aptId)}
      />
    </div>
  );
};
