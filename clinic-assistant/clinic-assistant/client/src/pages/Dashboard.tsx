import React, { useState } from 'react';
import { SummaryCards } from '../components/dashboard/SummaryCard.js';
import { AppointmentTable } from '../components/dashboard/AppointmentTable.js';
import { QueueTable } from '../components/dashboard/QueueTable.js';
import { DoctorStatus } from '../components/dashboard/DoctorStatus.js';
import { WalkInList } from '../components/dashboard/WalkInList.js';
import { QuickActions } from '../components/dashboard/QuickActions.js';
import { NotificationPanel } from '../components/dashboard/NotificationPanel.js';
import { CheckInModal } from '../components/dashboard/CheckInModal.js';
import { WalkInModal } from '../components/dashboard/WalkInModal.js';
import { AddToQueueModal } from '../components/dashboard/AddToQueueModal.js';
import { AppointmentDetailModal } from '../components/dashboard/AppointmentDetailModal.js';
import { NoShowModal } from '../components/appointments/NoShowModal.js';

import { Appointment } from '../types/appointment.js';
import { QueuePriority } from '../types/queue.js';
import { useClinic } from '../context/ClinicContext.js';

interface DashboardProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  searchQuery,
  setSearchQuery,
  activeTab,
  setActiveTab,
}) => {
  const {
    appointments,
    doctors,
    queue,
    walkIns,
    summary,
    checkInAppointment,
    handleNoShow,
    addWalkIn,
    addToQueue,
  } = useClinic();

  // Modals
  const [isCheckInOpen, setIsCheckInOpen] = useState<boolean>(false);
  const [selectedCheckInApt, setSelectedCheckInApt] = useState<Appointment | null>(null);

  const [isWalkInOpen, setIsWalkInOpen] = useState<boolean>(false);
  const [isAddToQueueOpen, setIsAddToQueueOpen] = useState<boolean>(false);

  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [selectedDetailApt, setSelectedDetailApt] = useState<Appointment | null>(null);

  const [isNoShowOpen, setIsNoShowOpen] = useState<boolean>(false);
  const [selectedNoShowApt, setSelectedNoShowApt] = useState<Appointment | null>(null);

  // Handler: Confirm Check-In
  const handleConfirmCheckIn = async (
    appointmentId: string,
    doctorId: string,
    notes?: string
  ) => {
    checkInAppointment(appointmentId, doctorId, notes);
    setIsCheckInOpen(false);
    setSelectedCheckInApt(null);
  };

  // Handler: Add Walk-In Patient
  const handleAddWalkIn = async (data: {
    patientName: string;
    phone: string;
    reason: string;
    preferredDoctor: string;
    priority: QueuePriority;
  }) => {
    addWalkIn(data);
    setIsWalkInOpen(false);
  };

  // Handler: Add To Queue Manually
  const handleAddToQueue = async (data: {
    patientName: string;
    doctorName: string;
    priority: QueuePriority;
    estimatedWait?: number;
  }) => {
    addToQueue(data);
    setIsAddToQueueOpen(false);
  };

  // Open Check-In from Appointment table
  const handleOpenCheckIn = (appointment: Appointment) => {
    setSelectedCheckInApt(appointment);
    setIsCheckInOpen(true);
  };

  // Open Details Modal
  const handleOpenDetails = (appointment: Appointment) => {
    setSelectedDetailApt(appointment);
    setIsDetailOpen(true);
  };

  // Open No-Show Modal
  const handleOpenNoShow = (appointment: Appointment) => {
    setSelectedNoShowApt(appointment);
    setIsNoShowOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* SECTION 1 — SUMMARY CARDS */}
      <section id="section-summary">
        <SummaryCards
          summary={summary}
          onCardClick={(type) => {
            if (type === 'appointments' || type === 'checked-in') {
              setActiveTab('appointments');
            } else if (type === 'waiting') {
              setActiveTab('queue');
            } else if (type === 'doctors') {
              setActiveTab('doctors');
            } else if (type === 'walk-ins') {
              setActiveTab('walk-ins');
            }
          }}
        />
      </section>

      {/* SECTION 6 — QUICK ACTIONS */}
      <section id="section-quick-actions">
        <QuickActions
          onCheckInPatient={() => {
            setSelectedCheckInApt(null);
            setIsCheckInOpen(true);
          }}
          onAddWalkIn={() => setIsWalkInOpen(true)}
          onViewQueue={() => setActiveTab('queue')}
          onViewAppointments={() => setActiveTab('appointments')}
        />
      </section>

      {/* SECTION: TODAY'S APPOINTMENTS & REAL-TIME NOTIFICATION PANEL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* TODAY'S APPOINTMENTS (2 cols) */}
        <div className="lg:col-span-2" id="section-appointments">
          <AppointmentTable
            appointments={appointments}
            searchQuery={searchQuery}
            onCheckInClick={handleOpenCheckIn}
            onViewDetailsClick={handleOpenDetails}
            onMarkNoShowClick={handleOpenNoShow}
          />
        </div>

        {/* NOTIFICATION & SLOT ALERT PANEL (1 col) */}
        <div className="lg:col-span-1">
          <NotificationPanel />
        </div>
      </div>

      {/* SECTION 3, 4, 5 — QUEUE, DOCTORS, WALK-INS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* SECTION 3 — WAITING QUEUE (2 Columns on large screens) */}
        <div className="lg:col-span-2" id="section-queue">
          <QueueTable
            queue={queue}
            onAddToQueueClick={() => setIsAddToQueueOpen(true)}
          />
        </div>

        {/* SECTION 4 & 5 — DOCTOR STATUS & WALK-INS (1 Column on large screens) */}
        <div className="space-y-6">
          <section id="section-doctors">
            <DoctorStatus doctors={doctors} />
          </section>

          <section id="section-walkins">
            <WalkInList
              walkIns={walkIns}
              onAddWalkInClick={() => setIsWalkInOpen(true)}
            />
          </section>
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
        onConfirmCheckIn={handleConfirmCheckIn}
      />

      <WalkInModal
        isOpen={isWalkInOpen}
        onClose={() => setIsWalkInOpen(false)}
        doctors={doctors}
        onAddWalkIn={handleAddWalkIn}
      />

      <AddToQueueModal
        isOpen={isAddToQueueOpen}
        onClose={() => setIsAddToQueueOpen(false)}
        doctors={doctors}
        onAddToQueue={handleAddToQueue}
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
          handleOpenCheckIn(apt);
        }}
      />

      <NoShowModal
        isOpen={isNoShowOpen}
        onClose={() => {
          setIsNoShowOpen(false);
          setSelectedNoShowApt(null);
        }}
        appointment={selectedNoShowApt}
        onConfirm={(aptId) => handleNoShow(aptId)}
      />
    </div>
  );
};
