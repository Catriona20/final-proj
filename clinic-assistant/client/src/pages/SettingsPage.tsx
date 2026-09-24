import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Building,
  Bell,
  Save,
  CheckCircle2,
  Shield,
  Clock,
  Phone,
  MapPin,
  Sparkles,
  Volume2,
  AlertTriangle,
  Mail,
  Stethoscope
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext.js';

export const SettingsPage: React.FC = () => {
  const { activeClinic, operator, updateOperator, addToast } = useClinic();

  // Receptionist Profile State
  const [receptionistName, setReceptionistName] = useState(operator?.name || 'Staff Receptionist');
  const [role, setRole] = useState(operator?.role || 'Head Receptionist & Triage Lead');
  const [station, setStation] = useState(operator?.station || 'Station 01 — Main Reception Desk');
  const [shift, setShift] = useState(operator?.shift || 'Morning Shift (08:00 AM – 04:00 PM)');
  const [staffId, setStaffId] = useState(operator?.staffId || 'REC-101');

  // Clinic Info State - Dynamically synchronized with activeClinic
  const [clinicName, setClinicName] = useState(activeClinic?.name || '');
  const [clinicPhone, setClinicPhone] = useState(activeClinic?.phone || '');
  const [clinicAddress, setClinicAddress] = useState(activeClinic?.address || '');
  const [emergencyHotline, setEmergencyHotline] = useState(activeClinic?.emergencyHotline || activeClinic?.phone || '909090909');
  const [specialization, setSpecialization] = useState(activeClinic?.specialization || activeClinic?.category || 'Dentistry');
  const [officialEmail, setOfficialEmail] = useState(activeClinic?.email || '');
  const [operatingHours, setOperatingHours] = useState(activeClinic?.open_hours || '10:00 AM - 06:00 PM');

  useEffect(() => {
    if (activeClinic) {
      setClinicName(activeClinic.name || '');
      setClinicPhone(activeClinic.phone || '');
      setClinicAddress(activeClinic.address || '');
      setEmergencyHotline(activeClinic.emergencyHotline || activeClinic.phone || '909090909');
      setSpecialization(activeClinic.specialization || activeClinic.category || (activeClinic.departments && activeClinic.departments[0]) || 'Dentistry');
      setOfficialEmail(activeClinic.email || (activeClinic.name ? `${activeClinic.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@medlink.test` : ''));
      setOperatingHours(activeClinic.open_hours || '10:00 AM - 06:00 PM');
    }
  }, [activeClinic]);

  useEffect(() => {
    if (operator) {
      setReceptionistName(operator.name || 'Staff Receptionist');
      setRole(operator.role || 'Head Receptionist & Triage Lead');
      setStation(operator.station || 'Station 01 — Main Reception Desk');
      setShift(operator.shift || 'Morning Shift (08:00 AM – 04:00 PM)');
      setStaffId(operator.staffId || 'REC-101');
    }
  }, [operator]);

  // Notification Preferences
  const [appointmentAlerts, setAppointmentAlerts] = useState(true);
  const [queueAlerts, setQueueAlerts] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [soundChime, setSoundChime] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateOperator({
      name: receptionistName.trim(),
      role: role.trim(),
      station: station.trim(),
      shift: shift.trim(),
      staffId: staffId.trim(),
    });
    addToast('success', 'Settings Saved', 'Station configuration and facility preferences updated.');
  };

  return (
    <div className="space-y-6 pb-16 max-w-5xl">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200/60 shadow-xs">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Station & Clinic Settings</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Configure front desk profile, facility metadata, and real-time alert preferences.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveSettings}
          className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs transition-colors flex items-center gap-2 shrink-0"
        >
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </button>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Receptionist Profile */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
              <User className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Receptionist & Station Profile</h2>
              <p className="text-xs text-slate-500">Active operator identification and assigned shift</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Staff Name
              </label>
              <input
                type="text"
                value={receptionistName}
                onChange={(e) => setReceptionistName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Staff ID & Badge
              </label>
              <input
                type="text"
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Role & Designation
              </label>
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Station Allocation
              </label>
              <input
                type="text"
                value={station}
                onChange={(e) => setStation(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Current Shift
              </label>
              <input
                type="text"
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Clinic Information */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
              <Building className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Clinic Facility Details</h2>
              <p className="text-xs text-slate-500">Center contact numbers, addresses, and hotlines</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Clinic / Medical Center Name
              </label>
              <input
                type="text"
                value={clinicName}
                onChange={(e) => setClinicName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Reception Direct Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={clinicPhone}
                  onChange={(e) => setClinicPhone(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Emergency Triage Hotline
              </label>
              <div className="relative">
                <AlertTriangle className="w-4 h-4 text-rose-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={emergencyHotline}
                  onChange={(e) => setEmergencyHotline(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-mono text-rose-700 font-bold"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Facility Address
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={clinicAddress}
                  onChange={(e) => setClinicAddress(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Primary Specialization
              </label>
              <div className="relative">
                <Stethoscope className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Official Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Operating Hours
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Notification & Queue Preferences */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-subtle p-6">
          <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
              <Bell className="w-4 h-4 text-teal-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Notification & Alert Preferences</h2>
              <p className="text-xs text-slate-500">Configure visual badges, audio chimes, and emergency alerts</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Appointment Alerts</h3>
                <p className="text-xs text-slate-500">Receive popup toast reminders for scheduled check-in slots</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={appointmentAlerts}
                  onChange={(e) => setAppointmentAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Queue Delay Alerts</h3>
                <p className="text-xs text-slate-500">Highlight patients waiting longer than 20 minutes in orange</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={queueAlerts}
                  onChange={(e) => setQueueAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>

            {/* Toggle 3 */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-rose-50/50 border border-rose-200/60">
              <div>
                <h3 className="text-sm font-semibold text-rose-950 flex items-center gap-2">
                  <span>Emergency Intake Flash</span>
                  <span className="px-1.5 py-0.2 text-[10px] bg-rose-600 text-white rounded font-bold">CRITICAL</span>
                </h3>
                <p className="text-xs text-rose-700">Display high-visibility pulsing highlight on incoming emergency triage arrivals</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={emergencyAlerts}
                  onChange={(e) => setEmergencyAlerts(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
              </label>
            </div>

            {/* Toggle 4 */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/60">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Audio Chime</h3>
                <p className="text-xs text-slate-500">Play subtle audio notification upon new walk-in patient arrival</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soundChime}
                  onChange={(e) => setSoundChime(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>Save All Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
};
