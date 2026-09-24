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

export const AppointmentsPage: React.FC<AppointmentsPageProps> = ({
  searchQuery = '',
  setSearchQuery,
}) => {
  const { appointments, doctors, patients, checkInAppointment, handleNoShow, addAppointment } = useClinic();

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
  };

  const statusTabs = [
    { id: 'ALL', label: 'All Appointments' },
    { id: 'BOOKED', label: 'Booked' },
    { id: 'CHECKED_IN', label: 'Checked In' },
    { id: 'WAITING', label: 'Waiting' },
    { id: 'IN_CONSULTATION', label: 'In Consultation' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'NO_SHOW', label: 'No Show' },
  ];

  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      const matchesStatus =
        selectedStatusFilter === 'ALL' || apt.status === selectedStatusFilter;

      const matchesDoctor =
        selectedDoctorFilter === 'ALL' ||
        apt.doctorId === selectedDoctorFilter ||
        apt.doctorName.toLowerCase().includes(selectedDoctorFilter.toLowerCase());

      const q = (searchQuery || localSearch).toLowerCase().trim();
      const matchesSearch =
        !q ||
        apt.id.toLowerCase().includes(q) ||
        apt.patientName.toLowerCase().includes(q) ||
        apt.doctorName.toLowerCase().includes(q) ||
        (apt.department && apt.department.toLowerCase().includes(q)) ||
        apt.type.toLowerCase().includes(q) ||
        apt.time.toLowerCase().includes(q);

      return matchesStatus && matchesDoctor && matchesSearch;
    });
  }, [appointments, selectedStatusFilter, selectedDoctorFilter, searchQuery, localSearch]);

  const handleDirectCheckIn = (apt: Appointment) => {
    checkInAppointment(apt.id);
  };

  const handleOpenNoShow = (apt: Appointment) => {
    setSelectedNoShowApt(apt);
    setIsNoShowModalOpen(true);
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
                {appointments.length} Total Today
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
            <span>Today • Friday, Aug 21, 2026</span>
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
              const count =
                tab.id === 'ALL'
                  ? appointments.length
                  : appointments.filter((a) => a.status === tab.id).length;
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
                  const badge = statusBadges[apt.status] || statusBadges.BOOKED;
                  const canCheckIn = apt.status === 'BOOKED';
                  const canMarkNoShow = apt.status === 'BOOKED' || apt.status === 'CHECKED_IN';

                  return (
                    <tr
                      key={apt.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          {apt.id}
                        </span>
                      </td>

                      {/* Time */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-semibold text-slate-900 font-mono text-xs">
                            {apt.time}
                          </span>
                        </div>
                      </td>

                      {/* Patient */}
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-slate-900 text-sm">{apt.patientName}</div>
                        <div className="text-xs text-slate-400 font-mono">{apt.patientId}</div>
                      </td>

                      {/* Doctor */}
                      <td className="py-3.5 px-5">
                        <div className="text-slate-800 font-medium text-xs sm:text-sm">
                          {apt.doctorName}
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="text-xs font-semibold text-teal-700 bg-teal-50/80 px-2 py-0.5 rounded-md border border-teal-200/60">
                          {apt.department || 'General Medicine'}
                        </span>
                      </td>

                      {/* Type */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                          {apt.type}
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
