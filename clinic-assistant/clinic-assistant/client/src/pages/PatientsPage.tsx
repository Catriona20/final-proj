import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  UserPlus,
  Eye,
  Phone,
  Calendar,
  Plus,
  CheckCircle2,
  Clock,
  ArrowUpDown
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext.js';
import { Patient } from '../types/patient.js';
import { AddPatientModal } from '../components/patients/AddPatientModal.js';
import { PatientDetailModal } from '../components/patients/PatientDetailModal.js';
import { AddToQueueModal } from '../components/dashboard/AddToQueueModal.js';

interface PatientsPageProps {
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}

export const PatientsPage: React.FC<PatientsPageProps> = ({
  searchQuery = '',
  setSearchQuery,
}) => {
  const { patients, doctors, addPatient, addToQueue } = useClinic();

  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState<string>('ALL');
  const [localSearch, setLocalSearch] = useState<string>('');

  // Modals
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isQueueModalOpen, setIsQueueModalOpen] = useState(false);

  const statusBadges: Record<
    string,
    { label: string; bg: string; text: string; border: string; dot: string }
  > = {
    Active: {
      label: 'Active',
      bg: 'bg-emerald-50',
      text: 'text-emerald-700',
      border: 'border-emerald-200',
      dot: 'bg-emerald-500',
    },
    'In Queue': {
      label: 'In Queue',
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
    },
    Scheduled: {
      label: 'Scheduled',
      bg: 'bg-blue-50',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-600',
    },
    Completed: {
      label: 'Completed',
      bg: 'bg-purple-50',
      text: 'text-purple-700',
      border: 'border-purple-200',
      dot: 'bg-purple-600',
    },
    Inactive: {
      label: 'Inactive',
      bg: 'bg-slate-100',
      text: 'text-slate-600',
      border: 'border-slate-300',
      dot: 'bg-slate-400',
    },
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((pat) => {
      const patStatus = pat.status || 'Active';
      const matchesStatus =
        selectedStatusFilter === 'ALL' || patStatus === selectedStatusFilter;

      const matchesGender =
        selectedGenderFilter === 'ALL' || pat.gender === selectedGenderFilter;

      const q = (searchQuery || localSearch).toLowerCase().trim();
      const matchesSearch =
        !q ||
        pat.id.toLowerCase().includes(q) ||
        pat.name.toLowerCase().includes(q) ||
        pat.phone.toLowerCase().includes(q) ||
        (pat.email && pat.email.toLowerCase().includes(q)) ||
        (pat.address && pat.address.toLowerCase().includes(q));

      return matchesStatus && matchesGender && matchesSearch;
    });
  }, [patients, selectedStatusFilter, selectedGenderFilter, searchQuery, localSearch]);

  const handleOpenDetail = (pat: Patient) => {
    setSelectedPatient(pat);
    setIsDetailOpen(true);
  };

  const handleQuickQueue = (pat: Patient) => {
    setSelectedPatient(pat);
    setIsQueueModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200/60 shadow-xs">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Patient Directory</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-teal-50 text-teal-700 rounded-full border border-teal-200/60">
                {patients.length} Total Patients
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprehensive patient master records, medical profiles, and check-in history.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAddPatientOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Patient</span>
        </button>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle overflow-hidden">
        {/* Filters and Search */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search by Patient ID (PAT001), name, phone, or email..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2.5">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Active">Active</option>
              <option value="In Queue">In Queue</option>
              <option value="Scheduled">Scheduled</option>
              <option value="Completed">Completed</option>
            </select>

            <select
              value={selectedGenderFilter}
              onChange={(e) => setSelectedGenderFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            >
              <option value="ALL">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        {/* Patients Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/80 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-5">Patient ID</th>
                <th className="py-3 px-5">Name & Demographics</th>
                <th className="py-3 px-5">Contact Phone</th>
                <th className="py-3 px-5">Email Address</th>
                <th className="py-3 px-5">Last Visit</th>
                <th className="py-3 px-5">Status</th>
                <th className="py-3 px-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <Users className="w-9 h-9 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700 text-sm">No patients found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Try updating your search query or click "Add Patient"
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  const patStatus = patient.status || 'Active';
                  const badge = statusBadges[patStatus] || statusBadges.Active;

                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* ID */}
                      <td className="py-3.5 px-5 whitespace-nowrap">
                        <span className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          {patient.id}
                        </span>
                      </td>

                      {/* Name & Demographics */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 border border-teal-200 flex items-center justify-center font-bold text-xs shrink-0">
                            {patient.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 text-sm">{patient.name}</div>
                            <div className="text-xs text-slate-400">
                              {patient.age} yrs • {patient.gender} • Blood: {patient.bloodGroup || 'O+'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-5 whitespace-nowrap font-mono text-xs text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{patient.phone}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-5 text-xs text-slate-600 truncate max-w-[180px]">
                        {patient.email || '—'}
                      </td>

                      {/* Last Visit */}
                      <td className="py-3.5 px-5 whitespace-nowrap text-xs text-slate-600">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{patient.lastVisit || 'Today'}</span>
                        </div>
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
                          <button
                            onClick={() => handleOpenDetail(patient)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 transition-colors"
                            title="View patient file"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                            <span>View</span>
                          </button>

                          <button
                            onClick={() => handleQuickQueue(patient)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200/80 transition-colors"
                            title="Queue patient"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Queue</span>
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

        {/* Table Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Showing <strong className="text-slate-800">{filteredPatients.length}</strong> of{' '}
            {patients.length} registered patients
          </span>
          <span className="text-[11px] text-slate-400">
            Records automatically indexed by registration timestamp
          </span>
        </div>
      </div>

      {/* MODALS */}
      <AddPatientModal
        isOpen={isAddPatientOpen}
        onClose={() => setIsAddPatientOpen(false)}
        onAddPatient={(data) => addPatient(data)}
      />

      <PatientDetailModal
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedPatient(null);
        }}
        patient={selectedPatient}
        onQuickQueue={(pat) => {
          setSelectedPatient(pat);
          setIsQueueModalOpen(true);
        }}
      />

      <AddToQueueModal
        isOpen={isQueueModalOpen}
        onClose={() => {
          setIsQueueModalOpen(false);
          setSelectedPatient(null);
        }}
        doctors={doctors}
        initialPatientName={selectedPatient?.name}
        onAddToQueue={(data) => addToQueue(data)}
      />
    </div>
  );
};
