import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  Power,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Check,
  X,
  Sparkles,
  Plus,
  Send,
  Building2
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext.js';
import { clinicApi } from '../services/api.js';
import { Doctor, DoctorStatus } from '../types/doctor.js';

const formatDisplayDate = (dateStr?: string): string => {
  if (!dateStr) return '';
  const clean = String(dateStr).includes('T') ? String(dateStr).split('T')[0] : String(dateStr).trim();
  const match = clean.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return clean;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = parseInt(match[3], 10);
  const month = months[parseInt(match[2], 10) - 1];
  const year = match[1];
  return `${day} ${month} ${year}`;
};

const formatTimestampDisplay = (isoStr?: string): string => {
  if (!isoStr) return '';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = d.getDate();
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    const hours = d.getHours();
    const mins = String(d.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayH = hours % 12 === 0 ? 12 : hours % 12;
    return `${day} ${month} ${year} ${displayH}:${mins} ${ampm}`;
  } catch {
    return isoStr;
  }
};

interface DoctorsPageProps {
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export const DoctorsPage: React.FC<DoctorsPageProps> = ({
  searchQuery = '',
  setSearchQuery,
}) => {
  const {
    doctors,
    queue,
    appointments,
    updateDoctorStatus,
    addToast,
    activeClinic,
    availabilityRequests,
    requestDoctorAvailability
  } = useClinic();

  const [activeSection, setActiveSection] = useState<'roster' | 'verifications' | 'availability'>('roster');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Availability Request Form State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestDoctorId, setRequestDoctorId] = useState('');
  const [requestSpecialty, setRequestSpecialty] = useState('');
  const [requestDate, setRequestDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [requestStartTime, setRequestStartTime] = useState('10:00 AM');
  const [requestEndTime, setRequestEndTime] = useState('01:00 PM');
  const [requestNotes, setRequestNotes] = useState('Morning Consultation OPD Session');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Pending Verifications State
  const [pendingDoctors, setPendingDoctors] = useState<any[]>([]);
  const [isLoadingVerifications, setIsLoadingVerifications] = useState<boolean>(false);

  const fetchPendingVerifications = useCallback(async () => {
    setIsLoadingVerifications(true);
    try {
      const list = await clinicApi.getPendingDoctorVerifications();
      setPendingDoctors(list);
    } catch (err) {
      console.warn('Could not fetch pending doctor verifications:', err);
    } finally {
      setIsLoadingVerifications(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingVerifications();
  }, [fetchPendingVerifications]);

  const handleVerifyDoctor = async (doctorId: string, status: 'VERIFIED' | 'REJECTED') => {
    try {
      const res = await clinicApi.verifyDoctor(doctorId, status, 'Verified by Clinic Reception Admin');
      if (res.success) {
        addToast(
          status === 'VERIFIED' ? 'success' : 'info',
          status === 'VERIFIED' ? 'Doctor Verified' : 'Doctor Application Rejected',
          `Doctor ${status === 'VERIFIED' ? 'verified successfully and now visible in patient search' : 'marked as rejected'}.`
        );
        fetchPendingVerifications();
      } else {
        addToast('error', 'Error', res.message || 'Verification update failed.');
      }
    } catch (err: any) {
      addToast('error', 'Error', err.message || 'Failed to update verification.');
    }
  };

  const handleOpenRequestModal = (docId?: string) => {
    const targetDoc = doctors.find((d) => d.id === docId) || doctors[0];
    if (targetDoc) {
      setRequestDoctorId(targetDoc.id);
      setRequestSpecialty(targetDoc.specialization || 'General Medicine');
    }
    setIsRequestModalOpen(true);
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestDoctorId) {
      addToast('error', 'Select Doctor', 'Please select a doctor to request availability.');
      return;
    }
    setIsSubmittingRequest(true);
    try {
      const targetDoc = doctors.find((d) => d.id === requestDoctorId);
      const res = await requestDoctorAvailability({
        doctor_id: requestDoctorId,
        specialty: requestSpecialty || targetDoc?.specialization || 'General Medicine',
        date: requestDate,
        start_time: requestStartTime,
        end_time: requestEndTime,
        notes: requestNotes,
      });
      if (res.success) {
        setIsRequestModalOpen(false);
        setActiveSection('availability');
      }
    } finally {
      setIsSubmittingRequest(false);
    }
  };

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
      label: 'NOT SCHEDULED / OFFLINE',
      badgeBg: 'bg-slate-100',
      text: 'text-slate-500',
      border: 'border-slate-300',
      dot: 'bg-slate-400',
    },
  };

  const getDoctorWorkload = useCallback(
    (doctor: Doctor) => {
      const activeEntry = queue.find(
        (q) =>
          (q.doctorId === doctor.id || q.doctorName === doctor.name || (doctor.name && q.doctorName?.toLowerCase() === doctor.name.toLowerCase())) &&
          (q.status === 'IN_CONSULTATION' || (q as any).status === 'In Consultation')
      );

      const waitingEntries = queue.filter(
        (q) =>
          (q.doctorId === doctor.id || q.doctorName === doctor.name || (doctor.name && q.doctorName?.toLowerCase() === doctor.name.toLowerCase())) &&
          q.status === 'WAITING'
      );

      const isConsulting = !!activeEntry || !!doctor.currentPatientName || (doctor.status === 'BUSY' && (doctor.currentPatients || 0) > 0);
      const activePatientName = activeEntry?.patientName || doctor.currentPatientName;
      const waitingCount = waitingEntries.length > 0 ? waitingEntries.length : ((doctor as any).waitingCount ?? 0);

      const effectiveStatus: DoctorStatus =
        doctor.status === 'OFFLINE'
          ? 'OFFLINE'
          : isConsulting
          ? 'BUSY'
          : doctor.status === 'BUSY'
          ? 'BUSY'
          : 'AVAILABLE';

      const appointmentsCount =
        appointments.filter(
          (a) => a.doctorId === doctor.id || a.doctorName === doctor.name || (doctor.name && a.doctorName?.toLowerCase() === doctor.name.toLowerCase())
        ).length || doctor.todayAppointmentsCount || doctor.todayPatients || 0;

      return {
        effectiveStatus,
        isConsulting,
        activePatientName,
        waitingCount,
        appointmentsCount,
      };
    },
    [queue, appointments]
  );

  const departments = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialization));
    return Array.from(set);
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doc) => {
      const { effectiveStatus, activePatientName } = getDoctorWorkload(doc);
      const matchesStatus =
        selectedStatusFilter === 'ALL' || effectiveStatus === selectedStatusFilter;

      const matchesDept =
        selectedDeptFilter === 'ALL' || doc.specialization === selectedDeptFilter;

      const q = (searchQuery || localSearch).toLowerCase().trim();
      const matchesSearch =
        !q ||
        doc.name.toLowerCase().includes(q) ||
        doc.specialization.toLowerCase().includes(q) ||
        (doc.roomNumber && doc.roomNumber.toLowerCase().includes(q)) ||
        (activePatientName && activePatientName.toLowerCase().includes(q));

      return matchesStatus && matchesDept && matchesSearch;
    });
  }, [doctors, selectedStatusFilter, selectedDeptFilter, searchQuery, localSearch, getDoctorWorkload]);

  const availableCount = doctors.filter((d) => getDoctorWorkload(d).effectiveStatus === 'AVAILABLE').length;
  const busyCount = doctors.filter((d) => getDoctorWorkload(d).effectiveStatus === 'BUSY').length;
  const offlineCount = doctors.filter((d) => getDoctorWorkload(d).effectiveStatus === 'OFFLINE').length;

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
              <h1 className="text-xl font-bold text-slate-900">Doctor Roster & Availability Console</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
                {availableCount} Available Now
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live consultation room allocations, schedule availability approvals, and credential verifications.
            </p>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80">
          <button
            onClick={() => setActiveSection('roster')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeSection === 'roster'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Doctor Roster ({doctors.length})
          </button>
          <button
            onClick={() => setActiveSection('availability')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'availability'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-teal-600" />
            <span>Availability Requests</span>
            {availabilityRequests.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-teal-600 text-white rounded-full font-bold">
                {availabilityRequests.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveSection('verifications')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeSection === 'verifications'
                ? 'bg-white text-teal-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
            <span>Verifications</span>
            {pendingDoctors.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] bg-amber-500 text-white rounded-full font-bold">
                {pendingDoctors.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {activeSection === 'availability' ? (
        /* AVAILABILITY REQUESTS INTERFACE */
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Facility Doctor Availability Requests</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Request doctor shifts for {activeClinic?.name || 'this facility'}. Upon doctor acceptance, dynamic bookable slots are automatically unlocked for patients.
                </p>
              </div>
            </div>

            <button
              onClick={() => handleOpenRequestModal()}
              className="px-4 py-2.5 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs flex items-center gap-2 cursor-pointer transition-all self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Request Doctor Availability</span>
            </button>
          </div>

          <div className="space-y-3">
            {availabilityRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
                <Clock className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-base">No Availability Requests Sent</h4>
                <p className="text-xs text-slate-400 mt-1 mb-4">
                  Click "Request Doctor Availability" to propose consultation hours to any affiliated practitioner.
                </p>
                <button
                  onClick={() => handleOpenRequestModal()}
                  className="px-4 py-2 text-xs font-bold bg-teal-600 text-white rounded-xl shadow-xs inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Send Availability Request</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availabilityRequests.map((req) => {
                  const isApproved = req.status === 'APPROVED';
                  const isPending = req.status === 'PENDING';
                  const isRejected = req.status === 'REJECTED';

                  return (
                    <div
                      key={req.id}
                      className={`bg-white rounded-2xl border p-5 shadow-xs space-y-3 transition-all ${
                        isApproved
                          ? 'border-emerald-200 bg-emerald-50/20'
                          : isPending
                          ? 'border-amber-200 bg-amber-50/10'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-base">{req.doctor_name || 'Dr. Arun Kumar'}</h4>
                          <p className="text-xs text-teal-700 font-semibold">{req.specialty || 'General Medicine'}</p>
                        </div>
                        <span
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wide border ${
                            isApproved
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isPending
                              ? 'bg-amber-100 text-amber-800 border-amber-300'
                              : 'bg-rose-100 text-rose-800 border-rose-300'
                          }`}
                        >
                          {req.status}
                        </span>
                      </div>

                      <div className="text-xs space-y-1.5 bg-slate-50 p-3 rounded-xl text-slate-700">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span><strong>Facility:</strong> {req.clinic_name || activeClinic?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span><strong>Date:</strong> {formatDisplayDate(req.date || req.requested_date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span><strong>Shift Window:</strong> {req.start_time} – {req.end_time}</span>
                        </div>
                        {req.updated_at && !isPending && (
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-0.5">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span><strong>Updated:</strong> {formatTimestampDisplay(req.updated_at)}</span>
                          </div>
                        )}
                        {req.notes && (
                          <div className="text-slate-500 italic pt-1">
                            "{req.notes}"
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400 font-mono">ID: {req.id}</span>
                        {isApproved ? (
                          <span className="text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Confirmed & Slots Activated</span>
                          </span>
                        ) : isPending ? (
                          <span className="text-amber-700 font-medium flex items-center gap-1">
                            <Clock className="w-4 h-4 animate-spin" />
                            <span>Awaiting Doctor Decision</span>
                          </span>
                        ) : (
                          <span className="text-rose-600 font-medium flex items-center gap-1">
                            <X className="w-4 h-4" />
                            <span>Declined by Doctor</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : activeSection === 'verifications' ? (
        /* VERIFICATION REVIEW INTERFACE */
        <div className="space-y-4">
          <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-teal-600 mt-0.5" />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Medical Registration & Credential Verification</h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Review and approve medical council licenses and clinical credentials. Only verified doctors can be recommended to patients and accept bookings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingDoctors.length === 0 ? (
              <div className="col-span-2 bg-white rounded-2xl p-12 text-center border border-slate-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-base">All Doctor Verifications Up to Date</h4>
                <p className="text-xs text-slate-400 mt-1">There are no pending doctor registration applications.</p>
              </div>
            ) : (
              pendingDoctors.map((doc) => (
                <div key={doc.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-slate-900 text-base">{doc.name}</h4>
                      <p className="text-xs text-teal-700 font-semibold">{doc.specialization || doc.primary_specialization}</p>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 border border-amber-200">
                      PENDING REVIEW
                    </span>
                  </div>

                  <div className="text-xs space-y-1.5 bg-slate-50 p-3 rounded-xl text-slate-600">
                    <div><strong>Qualification:</strong> {doc.qualification || 'MBBS, MD'}</div>
                    <div><strong>Registration #:</strong> {doc.registration_number || doc.registration_no || 'TN-MED-94821'}</div>
                    <div><strong>Registration Authority:</strong> {doc.registration_council || 'State Medical Council'}</div>
                    <div><strong>Experience:</strong> {doc.experience_years || doc.years_experience || '8'} years</div>                    {doc.procedures && doc.procedures.length > 0 && (
                      <div>
                        <strong>Procedures:</strong>{' '}
                        <span className="text-teal-700 font-semibold">{doc.procedures.join(', ')}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => handleVerifyDoctor(doc.id, 'REJECTED')}
                      className="px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg border border-rose-200 flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleVerifyDoctor(doc.id, 'VERIFIED')}
                      className="px-4 py-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white rounded-lg shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve & Verify Doctor
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (        /* DOCTOR ROSTER INTERFACE */
        <>
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
              const {
                effectiveStatus,
                isConsulting,
                activePatientName,
                waitingCount: docWaitingCount,
                appointmentsCount: docAppointmentsCount,
              } = getDoctorWorkload(doctor);

              const style = statusStyles[effectiveStatus] || statusStyles.OFFLINE;

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
                      {effectiveStatus === 'BUSY' || isConsulting ? (
                        <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs font-semibold text-amber-900 flex items-center justify-between">
                          <div className="flex items-center gap-2 truncate">
                            <User className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span className="truncate">{activePatientName || 'Consultation in progress'}</span>
                          </div>
                          <span className="px-1.5 py-0.5 text-[10px] bg-amber-200/80 text-amber-900 rounded font-bold">
                            In Room
                          </span>
                        </div>
                      ) : effectiveStatus === 'AVAILABLE' ? (
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
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Change Availability Status
                      </div>
                      <button
                        onClick={() => handleOpenRequestModal(doctor.id)}
                        className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1"
                      >
                        <Clock className="w-3 h-3" />
                        <span>Request Shift</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        onClick={() => updateDoctorStatus(doctor.id, 'AVAILABLE')}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                          effectiveStatus === 'AVAILABLE'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 border border-slate-200'
                        }`}
                      >
                        Available
                      </button>

                      <button
                        onClick={() => updateDoctorStatus(doctor.id, 'BUSY')}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                          effectiveStatus === 'BUSY'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-slate-50 text-slate-600 hover:bg-amber-50 hover:text-amber-700 border border-slate-200'
                        }`}
                      >
                        Busy
                      </button>

                      <button
                        onClick={() => updateDoctorStatus(doctor.id, 'OFFLINE')}
                        className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all ${
                          effectiveStatus === 'OFFLINE'
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
        </>
      )}

      {/* REQUEST DOCTOR AVAILABILITY MODAL */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-100">
                  <Clock className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Request Doctor Availability</h3>
                  <p className="text-xs text-slate-500">Propose clinic shift hours for doctor approval</p>
                </div>
              </div>
              <button
                onClick={() => setIsRequestModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Target Facility</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-600" />
                  <span>{activeClinic?.name || 'Moon Dental & Medical Clinic'}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Physician *</label>
                <select
                  value={requestDoctorId}
                  onChange={(e) => {
                    setRequestDoctorId(e.target.value);
                    const selected = doctors.find((d) => d.id === e.target.value);
                    if (selected) setRequestSpecialty(selected.specialization);
                  }}
                  required
                  className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold"
                >
                  <option value="">-- Choose Doctor --</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specialty</label>
                  <input
                    type="text"
                    value={requestSpecialty}
                    onChange={(e) => setRequestSpecialty(e.target.value)}
                    placeholder="Specialty"
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date *</label>
                  <input
                    type="date"
                    value={requestDate}
                    onChange={(e) => setRequestDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Start Time *</label>
                  <input
                    type="text"
                    value={requestStartTime}
                    onChange={(e) => setRequestStartTime(e.target.value)}
                    placeholder="10:00 AM"
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">End Time *</label>
                  <input
                    type="text"
                    value={requestEndTime}
                    onChange={(e) => setRequestEndTime(e.target.value)}
                    placeholder="01:00 PM"
                    required
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Shift Notes / OPD Instructions</label>
                <textarea
                  value={requestNotes}
                  onChange={(e) => setRequestNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Morning OPD session, 20 minute consultation slots"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRequestModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingRequest}
                  className="px-5 py-2 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded-xl shadow-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingRequest ? 'Sending Request...' : 'Send Availability Request'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
