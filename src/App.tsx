import React, { useState, useEffect } from 'react';
import { AppRole, Patient, Doctor, Clinic, Appointment, Prescription, MedicalRecord, PharmacyItem, NotificationItem } from './HealthcareAI/types';
import { 
  INITIAL_CLINICS, 
  INITIAL_DOCTORS, 
  GENERATED_PATIENTS, 
  CURRENT_PATIENT, 
  CURRENT_DOCTOR, 
  GENERATED_APPOINTMENTS, 
  GENERATED_PHARMACY_ITEMS, 
  INITIAL_PRESCRIPTIONS, 
  INITIAL_MEDICAL_RECORDS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_REVIEWS, 
  INITIAL_EMERGENCY_CASES 
} from './HealthcareAI/dummy-data';

import { AppHeader } from './HealthcareAI/shared-components/AppHeader';
import { ToastContainer } from './HealthcareAI/shared-components/ToastContainer';

// Patient App Views
import { PatientAuth } from './HealthcareAI/patient-app/PatientAuth';
import { PatientHome } from './HealthcareAI/patient-app/PatientHome';
import { PatientSearch } from './HealthcareAI/patient-app/PatientSearch';
import { ClinicDetail } from './HealthcareAI/patient-app/ClinicDetail';
import { DoctorProfileBooking } from './HealthcareAI/patient-app/DoctorProfileBooking';
import { AISymptomCheckerModal } from './HealthcareAI/patient-app/AISymptomCheckerModal';
import { LiveQueueView } from './HealthcareAI/patient-app/LiveQueueView';
import { HealthRecordsView } from './HealthcareAI/patient-app/HealthRecordsView';
import { PatientDashboard } from './HealthcareAI/patient-app/PatientDashboard';

// Doctor App Views
import { DoctorDashboard } from './HealthcareAI/doctor-app/DoctorDashboard';
import { DigitalPrescriptionModal } from './HealthcareAI/doctor-app/DigitalPrescriptionModal';
import { DoctorAnalyticsEmergency } from './HealthcareAI/doctor-app/DoctorAnalyticsEmergency';
import { DoctorProfileCalendar } from './HealthcareAI/doctor-app/DoctorProfileCalendar';

// Receptionist & Admin Clinic Dashboard Views
import { ReceptionistDashboard } from './HealthcareAI/clinic-dashboard/ReceptionistDashboard';
import { QueueManagement } from './HealthcareAI/clinic-dashboard/QueueManagement';
import { AIPredictiveDashboard } from './HealthcareAI/clinic-dashboard/AIPredictiveDashboard';
import { PharmacyManagement } from './HealthcareAI/clinic-dashboard/PharmacyManagement';
import { AnalyticsReports } from './HealthcareAI/clinic-dashboard/AnalyticsReports';

// AI Inspector & Docs
import { AIEngineInspector } from './HealthcareAI/AIEngineInspector';

export function App() {
  // Global Role & View Navigation State
  const [currentRole, setRole] = useState<AppRole>('patient');
  const [patientTab, setPatientTab] = useState<'home' | 'search' | 'clinic' | 'doctor' | 'queue' | 'records' | 'dashboard'>('home');
  const [doctorTab, setDoctorTab] = useState<'dashboard' | 'analytics' | 'profile-calendar'>('dashboard');
  const [clinicTab, setClinicTab] = useState<'dashboard' | 'queue' | 'ai-insights' | 'pharmacy' | 'analytics'>('dashboard');

  // Active Entity Selections
  const [selectedClinicId, setSelectedClinicId] = useState<string>('c1');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('d1');

  // UI Dialog States
  const [isSymptomCheckerOpen, setIsSymptomCheckerOpen] = useState(false);
  const [activePrescriptionAppointment, setActivePrescriptionAppointment] = useState<Appointment | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  // Core Data Store
  const [clinics, setClinics] = useState<Clinic[]>(INITIAL_CLINICS);
  const [doctors, setDoctors] = useState<Doctor[]>(INITIAL_DOCTORS);
  const [appointments, setAppointments] = useState<Appointment[]>(GENERATED_APPOINTMENTS);
  const [pharmacyItems, setPharmacyItems] = useState<PharmacyItem[]>(GENERATED_PHARMACY_ITEMS);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>(INITIAL_PRESCRIPTIONS);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>(INITIAL_MEDICAL_RECORDS);
  const [emergencyCases, setEmergencyCases] = useState(INITIAL_EMERGENCY_CASES);

  // Active Context Entities
  const activeClinic = clinics.find(c => c.id === selectedClinicId) || clinics[0];
  const activeDoctor = doctors.find(d => d.id === selectedDoctorId) || doctors[0];
  const activePatient = CURRENT_PATIENT;
  const userActiveAppointment = appointments[0]; // Active appointment for Aarav Sharma

  // Sync Dark Mode class on body
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handlers for Cross-App State Updates
  const handleConfirmBooking = (doctorId: string, timeSlot: string) => {
    const doc = doctors.find(d => d.id === doctorId) || doctors[0];
    const newApt: Appointment = {
      id: `apt-${Date.now()}`,
      patientId: activePatient.id,
      patientName: activePatient.name,
      doctorId: doc.id,
      doctorName: doc.name,
      specialization: doc.specialization,
      clinicId: activeClinic.id,
      clinicName: activeClinic.name,
      date: new Date().toISOString().split('T')[0],
      timeSlot,
      tokenNumber: 4,
      status: 'In-Queue',
      priorityLevel: 'Standard',
      symptoms: ['Routine consultation'],
      fee: doc.consultationFee,
    };

    setAppointments([newApt, ...appointments]);
    setPatientTab('queue');
  };

  const handleSimulateSlotShift = () => {
    // Add dynamic slot shift notification
    const shiftToast: NotificationItem = {
      id: `notif-${Date.now()}`,
      type: 'earlier_slot',
      title: 'Earlier Appointment Slot Available! ⚡',
      message: `A 02:10 PM appointment became available with ${activeDoctor.name} at ${activeClinic.name}. Would you like to shift?`,
      timestamp: 'Just Now',
      read: false,
      actionableSlot: '02:10 PM',
    };
    setNotifications([shiftToast, ...notifications]);
  };

  const handleAcceptSlotShift = (newSlot: string) => {
    setAppointments(appointments.map((apt, idx) => idx === 0 ? { ...apt, timeSlot: newSlot } : apt));
    setNotifications(notifications.filter(n => n.type !== 'earlier_slot'));
  };

  const handleDismissNotification = (id: string) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const handleSavePrescription = (newRx: Prescription) => {
    setPrescriptions([newRx, ...prescriptions]);
    // Also create a medical record entry
    const newRecord: MedicalRecord = {
      id: `mr-${Date.now()}`,
      patientId: newRx.patientId,
      patientName: newRx.patientName,
      type: 'Digital Prescription',
      title: `Consultation Rx - ${newRx.diagnosis}`,
      doctorName: newRx.doctorName,
      clinicName: newRx.clinicName,
      date: newRx.date,
      fileSize: '1.4 MB',
      downloadUrl: '#',
      summary: newRx.diagnosis,
    };
    setMedicalRecords([newRecord, ...medicalRecords]);
  };

  const handleToggleDoctorAvailability = () => {
    setDoctors(doctors.map(d => d.id === activeDoctor.id ? { ...d, isAvailable: !d.isAvailable } : d));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Top Application Navigation Header with Role Switcher */}
      <AppHeader
        currentRole={currentRole}
        setRole={setRole}
        activePatient={activePatient}
        activeDoctor={activeDoctor}
        activeClinic={activeClinic}
        allClinics={clinics}
        setSelectedClinicId={setSelectedClinicId}
        unreadNotificationCount={notifications.filter(n => !n.read).length}
        onOpenNotifications={() => setPatientTab('dashboard')}
        isDarkMode={isDarkMode}
        setIsDarkMode={setIsDarkMode}
      />

      {/* Main Container Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ROLE 1: PATIENT MOBILE APP */}
        {currentRole === 'patient' && (
          <div className="space-y-6">
            
            {/* Patient Secondary Sub-Navigation Pills Bar */}
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
              <button
                onClick={() => setPatientTab('home')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  patientTab === 'home' ? 'bg-healthcare-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                🏠 Patient Home
              </button>

              <button
                onClick={() => setPatientTab('search')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  patientTab === 'search' ? 'bg-healthcare-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                🔍 Search & Smart Filters
              </button>

              <button
                onClick={() => setPatientTab('queue')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  patientTab === 'queue' ? 'bg-healthcare-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                ⚡ Live Queue Token (#04)
              </button>

              <button
                onClick={() => setPatientTab('records')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  patientTab === 'records' ? 'bg-healthcare-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                📁 Health Vault & Prescriptions
              </button>

              <button
                onClick={() => setPatientTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  patientTab === 'dashboard' ? 'bg-healthcare-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                📊 Dashboard Summary
              </button>
            </div>

            {/* Patient Views Switcher */}
            {patientTab === 'home' && (
              <PatientHome
                clinics={clinics}
                doctors={doctors}
                patient={activePatient}
                activeAppointment={userActiveAppointment}
                onOpenSymptomChecker={() => setIsSymptomCheckerOpen(true)}
                onSelectClinic={(cid) => { setSelectedClinicId(cid); setPatientTab('clinic'); }}
                onOpenSearch={() => setPatientTab('search')}
                onViewLiveQueue={() => setPatientTab('queue')}
              />
            )}

            {patientTab === 'search' && (
              <PatientSearch
                clinics={clinics}
                doctors={doctors}
                onSelectClinic={(cid) => { setSelectedClinicId(cid); setPatientTab('clinic'); }}
                onSelectDoctor={(did) => { setSelectedDoctorId(did); setPatientTab('doctor'); }}
              />
            )}

            {patientTab === 'clinic' && (
              <ClinicDetail
                clinic={activeClinic}
                doctors={doctors}
                reviews={INITIAL_REVIEWS}
                allClinics={clinics}
                onSelectDoctor={(did) => { setSelectedDoctorId(did); setPatientTab('doctor'); }}
                onBack={() => setPatientTab('home')}
              />
            )}

            {patientTab === 'doctor' && (
              <DoctorProfileBooking
                doctor={activeDoctor}
                clinic={activeClinic}
                onConfirmBooking={handleConfirmBooking}
                onBack={() => setPatientTab('clinic')}
              />
            )}

            {patientTab === 'queue' && (
              <LiveQueueView
                appointment={userActiveAppointment}
                clinic={activeClinic}
                doctor={activeDoctor}
                onSimulateCancellation={handleSimulateSlotShift}
                onShiftSlot={handleAcceptSlotShift}
              />
            )}

            {patientTab === 'records' && (
              <HealthRecordsView
                patient={activePatient}
                records={medicalRecords}
                prescriptions={prescriptions}
              />
            )}

            {patientTab === 'dashboard' && (
              <PatientDashboard
                patient={activePatient}
                upcomingAppointment={userActiveAppointment}
                clinics={clinics}
                doctors={doctors}
                notifications={notifications}
                onSelectClinic={(cid) => { setSelectedClinicId(cid); setPatientTab('clinic'); }}
                onSelectDoctor={(did) => { setSelectedDoctorId(did); setPatientTab('doctor'); }}
                onViewQueue={() => setPatientTab('queue')}
              />
            )}

          </div>
        )}

        {/* ROLE 2: DOCTOR APP */}
        {currentRole === 'doctor' && (
          <div className="space-y-6">
            
            {/* Doctor Sub Navigation */}
            <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                onClick={() => setDoctorTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  doctorTab === 'dashboard' ? 'bg-healthcare-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-700'
                }`}
              >
                🩺 Today's Chamber Queue
              </button>

              <button
                onClick={() => setDoctorTab('analytics')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  doctorTab === 'analytics' ? 'bg-healthcare-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-700'
                }`}
              >
                📊 Revenue & Trauma Triage
              </button>

              <button
                onClick={() => setDoctorTab('profile-calendar')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  doctorTab === 'profile-calendar' ? 'bg-healthcare-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-700'
                }`}
              >
                📅 Schedule & Multi-Clinic Setup
              </button>
            </div>

            {doctorTab === 'dashboard' && (
              <DoctorDashboard
                doctor={activeDoctor}
                allClinics={clinics}
                appointments={appointments}
                patients={GENERATED_PATIENTS}
                onToggleAvailability={handleToggleDoctorAvailability}
                onSelectClinic={setSelectedClinicId}
                onOpenPrescriptionBuilder={(apt) => setActivePrescriptionAppointment(apt)}
                onOpenAnalytics={() => setDoctorTab('analytics')}
                onOpenProfileCalendar={() => setDoctorTab('profile-calendar')}
              />
            )}

            {doctorTab === 'analytics' && (
              <DoctorAnalyticsEmergency
                doctor={activeDoctor}
                emergencyCases={emergencyCases}
                onBack={() => setDoctorTab('dashboard')}
              />
            )}

            {doctorTab === 'profile-calendar' && (
              <DoctorProfileCalendar
                doctor={activeDoctor}
                clinics={clinics}
                onBack={() => setDoctorTab('dashboard')}
              />
            )}

          </div>
        )}

        {/* ROLE 3: RECEPTIONIST & CLINIC ADMIN DASHBOARD */}
        {currentRole === 'clinic' && (
          <div className="space-y-6">
            
            {/* Clinic Sub Navigation */}
            <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setClinicTab('dashboard')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  clinicTab === 'dashboard' ? 'bg-healthcare-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-700'
                }`}
              >
                🏥 Reception Overview
              </button>

              <button
                onClick={() => setClinicTab('queue')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  clinicTab === 'queue' ? 'bg-healthcare-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-700'
                }`}
              >
                ⚡ Priority Queue Control
              </button>

              <button
                onClick={() => setClinicTab('ai-insights')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  clinicTab === 'ai-insights' ? 'bg-healthcare-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-700'
                }`}
              >
                🤖 AI Predictive Analytics
              </button>

              <button
                onClick={() => setClinicTab('pharmacy')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  clinicTab === 'pharmacy' ? 'bg-healthcare-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-700'
                }`}
              >
                💊 Pharmacy & Stock
              </button>

              <button
                onClick={() => setClinicTab('analytics')}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  clinicTab === 'analytics' ? 'bg-healthcare-500 text-white shadow-md' : 'bg-white dark:bg-slate-800 text-slate-700'
                }`}
              >
                📊 Executive Reports
              </button>
            </div>

            {clinicTab === 'dashboard' && (
              <ReceptionistDashboard
                clinic={activeClinic}
                doctors={doctors}
                appointments={appointments}
                emergencyCases={emergencyCases}
                onOpenQueueManagement={() => setClinicTab('queue')}
                onOpenPharmacy={() => setClinicTab('pharmacy')}
                onOpenAiInsights={() => setClinicTab('ai-insights')}
                onOpenAnalytics={() => setClinicTab('analytics')}
              />
            )}

            {clinicTab === 'queue' && (
              <QueueManagement
                clinic={activeClinic}
                appointments={appointments}
                onBack={() => setClinicTab('dashboard')}
              />
            )}

            {clinicTab === 'ai-insights' && (
              <AIPredictiveDashboard
                clinic={activeClinic}
                doctors={doctors}
                appointments={appointments}
                onBack={() => setClinicTab('dashboard')}
              />
            )}

            {clinicTab === 'pharmacy' && (
              <PharmacyManagement
                pharmacyItems={pharmacyItems}
                onBack={() => setClinicTab('dashboard')}
              />
            )}

            {clinicTab === 'analytics' && (
              <AnalyticsReports
                clinics={clinics}
                doctors={doctors}
                onBack={() => setClinicTab('dashboard')}
              />
            )}

          </div>
        )}

        {/* ROLE 4: AI ENGINE LIVE INSPECTOR */}
        {currentRole === 'ai-inspector' && (
          <AIEngineInspector />
        )}

      </main>

      {/* AI Symptom Checker Global Modal */}
      <AISymptomCheckerModal
        isOpen={isSymptomCheckerOpen}
        onClose={() => setIsSymptomCheckerOpen(false)}
        clinics={clinics}
        doctors={doctors}
        onSelectDoctorAndClinic={(did, cid) => {
          setSelectedDoctorId(did);
          setSelectedClinicId(cid);
          setPatientTab('doctor');
        }}
      />

      {/* Doctor Prescription Builder Modal */}
      {activePrescriptionAppointment && (
        <DigitalPrescriptionModal
          isOpen={!!activePrescriptionAppointment}
          onClose={() => setActivePrescriptionAppointment(null)}
          appointment={activePrescriptionAppointment}
          pharmacyItems={pharmacyItems}
          onSavePrescription={handleSavePrescription}
        />
      )}

      {/* Toast Notifications Container */}
      <ToastContainer
        notifications={notifications}
        onDismiss={handleDismissNotification}
        onActionSlotShift={handleAcceptSlotShift}
      />

      {/* Persistent Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md py-4 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>HealthcareAI Multi-Clinic Ecosystem • Investor Demo Prototype</span>
          <span className="font-mono text-[11px] text-healthcare-500 font-bold">Vite + React + Tailwind + Recharts</span>
        </div>
      </footer>

    </div>
  );
}

export default App;
