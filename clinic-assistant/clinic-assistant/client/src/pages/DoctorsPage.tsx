import React, { useState, useMemo } from 'react';
import {
  Stethoscope,
  DoorOpen,
  User,
  Clock,
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Activity,
  Phone,
  Power
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext.js';
import { Doctor, DoctorStatus } from '../types/doctor.js';

interface DoctorsPageProps {
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export const DoctorsPage: React.FC<DoctorsPageProps> = ({
  searchQuery = '',
  setSearchQuery,
}) => {
  const { doctors, queue, appointments, updateDoctorStatus } = useClinic();

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');

  const statusStyles: Record<
    DoctorStatus,
    { label: string; badgeBg: string; text: string; border: string; dot: string }
  > = {
    AVAILABLE: {
      label: 'AVAILABLE',
      badgeBg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    BUSY: {
      label: 'BUSY',
      badgeBg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    OFFLINE: {
      label: 'OFFLINE',
      badgeBg: 'bg-slate-100',
      text: 'text-slate-500',
      border: 'border-slate-300',
      dot: 'bg-slate-400',
    },
  };

  const departments = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialization));
    return Array.from(set);
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const matchesStatus =
        selectedStatusFilter === 'ALL' || doc.status === selectedStatusFilter;

      const matchesDept =
        selectedDeptFilter === 'ALL' || doc.specialization === selectedDeptFilter;

      const q = (searchQuery || localSearch).toLowerCase().trim();
      const matchesSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q) ||
        (doc.roomNumber && doc.roomNumber.toLowerCase().includes(q)) ||
        (doc.currentPatientName && doc.currentPatientName.toLowerCase().includes(q));

      return matchesStatus && matchesDept && matchesSearch;
    });
  }, [doctors, selectedStatusFilter, selectedDeptFilter, searchQuery, localSearch]);

  const availableCount = doctors.filter((d) => d.status === 'AVAILABLE').length;
  const busyCount = doctors.filter((d) => d.status === 'BUSY').length;
  const offlineCount = doctors.filter((d) => d.status === 'OFFLINE').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200/60 shadow-xs">
            <Stethoscope className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Doctor Roster & Availability</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                {availableCount} Available Now
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live consultation room allocations, current patient status, and on-duty availability controls.
            </p>
          </div>
        </div>

        {/* Quick Tally Pills */}
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {availableCount} Available
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            {busyCount} In Consultation
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            {offlineCount} Offline
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by physician name, specialty, room..."
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
            <option value="AVAILABLE">Available</option>
            <option value="BUSY">In Consultation (Busy)</option>
            <option value="OFFLINE">Offline</option>
          </select>

          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
          >
            <option value="ALL">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDoctors.map((doctor) => {
          const style = statusStyles[doctor.status] || statusStyles.OFFLINE;

          // Calculate waiting patients for this doctor
          const docWaitingCount = queue.filter(
            (q) => q.doctorName === doctor.name && q.status === 'WAITING'
          ).length;

          // Calculate today's appointments for this doctor
          const docAppointmentsCount = appointments.filter(
            (a) => a.doctorName === doctor.name
          ).length;

          return (
            <div
              key={doctor.id}
              className="bg-white rounded-3xl border border-slate-200/90 shadow-subtle p-6 flex flex-col justify-between hover:border-slate-300 transition-all group"
            >
              {/* Card Top */}
              <div>
                {/* Doctor Avatar & Status */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-teal-600/10 text-teal-700 border border-teal-200/60 flex items-center justify-center font-bold text-base shadow-xs">
                      {doctor.name.replace('Dr. ', '').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-tight">
                        {doctor.name}
                      </h3>
                      <p className="text-xs text-teal-700 font-semibold mt-0.5">
                        {doctor.specialization}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider border ${style.badgeBg} ${style.text} ${style.border}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                    {style.label}
                  </span>
                </div>

                {/* Location & Contact */}
                <div className="space-y-2 mb-4 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/60">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <DoorOpen className="w-3.5 h-3.5 text-teal-600" />
                      Assigned Room:
                    </span>
                    <strong className="text-slate-800">{doctor.roomNumber || 'Room 101'}</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-teal-600" />
                      Appointments Today:
                    </span>
                    <strong className="text-slate-800">{docAppointmentsCount} booked</strong>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-teal-600" />
                      Patients in Queue:
                    </span>
                    <strong className="text-amber-700 font-bold">{docWaitingCount} waiting</strong>
                  </div>
                </div>

                {/* Current Patient Banner */}
                <div className="mb-4">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Current Active Patient
                  </div>
                  {doctor.status === 'BUSY' ? (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate">{doctor.currentPatientName || 'Consultation in progress'}</span>
                      </div>
                      <span className="px-1.5 py-0.5 text-[10px] bg-amber-200/80 text-amber-900 rounded font-bold">
                        In Room
                      </span>
                    </div>
                  ) : doctor.status === 'AVAILABLE' ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>Ready for next queued patient</span>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
                      <Power className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Off duty / Break</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Change Control Buttons */}
              <div className="pt-4 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Change Availability Status
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    onClick={() => updateDoctorStatus(doctor.id, 'AVAILABLE')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                      doctor.status === 'AVAILABLE'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
                    }`}
                  >
                    Available
                  </button>

                  <button
                    onClick={() => updateDoctorStatus(doctor.id, 'BUSY')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                      doctor.status === 'BUSY'
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700 border border-slate-200'
                    }`}
                  >
                    Busy
                  </button>

                  <button
                    onClick={() => updateDoctorStatus(doctor.id, 'OFFLINE')}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                      doctor.status === 'OFFLINE'
                        ? 'bg-slate-800 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    Offline
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
