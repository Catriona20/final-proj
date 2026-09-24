import React, { createContext, useContext, useState, useMemo } from 'react';
import { Patient } from '../types/patient.js';
import { Doctor, DoctorStatus } from '../types/doctor.js';
import { Appointment } from '../types/appointment.js';
import { QueueEntry, QueuePriority, QueueStatus } from '../types/queue.js';
import { WalkIn } from '../types/walkin.js';
import { DashboardSummary } from '../types/dashboard.js';
import { ClinicNotification } from '../types/notification.js';
import { ToastMessage } from '../components/common/Toast.js';
import {
  initialPatients,
  initialDoctors,
  initialAppointments,
  initialQueue,
  initialWalkIns,
  initialNotifications,
  computeSummary,
} from '../data/mockData.js';
import { noShowService } from '../services/noShowService.js';
import { clinicApi } from '../services/api.js';

interface ClinicContextType {
  patients: Patient[];
  doctors: Doctor[];
  appointments: Appointment[];
  queue: QueueEntry[];
  walkIns: WalkIn[];
  summary: DashboardSummary;
  notifications: ClinicNotification[];
  unreadNotificationsCount: number;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;
  checkInAppointment: (appointmentId: string, doctorId?: string, notes?: string) => void;
  handleNoShow: (appointmentId: string) => void;
  acceptEarlierSlot: (notificationId: string) => void;
  declineEarlierSlot: (notificationId: string) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
  addPatient: (data: Omit<Patient, 'id'>) => Patient;
  addWalkIn: (data: {
    patientName: string;
    phone: string;
    reason: string;
    preferredDoctor: string;
    priority: QueuePriority;
    age?: number;
    gender?: string;
  }) => void;
  addToQueue: (data: {
    patientName: string;
    doctorName: string;
    priority: QueuePriority;
    estimatedWait?: number;
    reason?: string;
  }) => void;
  callNextPatient: (preferredDoctorName?: string) => void;
  markInConsultation: (queueId: string) => void;
  markCompleted: (queueId: string) => void;
  removeFromQueue: (queueId: string) => void;
  updateDoctorStatus: (doctorId: string, status: DoctorStatus) => void;
  addAppointment: (data: Omit<Appointment, 'id' | 'status'>) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [patients, setPatients] = useState<Patient[]>(initialPatients);
  const [doctors, setDoctors] = useState<Doctor[]>(initialDoctors);
  const [appointments, setAppointments] = useState<Appointment[]>(initialAppointments);
  const [queue, setQueue] = useState<QueueEntry[]>(initialQueue);
  const [walkIns, setWalkIns] = useState<WalkIn[]>(initialWalkIns);
  const [notifications, setNotifications] = useState<ClinicNotification[]>(initialNotifications);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const summary = useMemo(
    () => computeSummary(appointments, doctors, walkIns, queue),
    [appointments, doctors, walkIns, queue]
  );

  const unreadNotificationsCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const addToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Check In an Appointment
  const checkInAppointment = (appointmentId: string, doctorId?: string, notes?: string) => {
    const targetApt = appointments.find((a) => a.id === appointmentId);
    if (!targetApt) return;

    const assignedDoc = doctors.find((d) => d.id === doctorId) ||
      doctors.find((d) => d.name === targetApt.doctorName) || {
        id: targetApt.doctorId,
        name: targetApt.doctorName,
        specialization: targetApt.department || 'General Medicine',
      };

    const updatedApts: Appointment[] = appointments.map((apt) => {
      if (apt.id === appointmentId) {
        return {
          ...apt,
          status: 'CHECKED_IN' as const,
          doctorId: assignedDoc.id,
          doctorName: assignedDoc.name,
          notes: notes || apt.notes,
          checkedInAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
      }
      return apt;
    });

    // Add to waiting queue if not already in queue
    let updatedQueue = [...queue];
    const inQueue = updatedQueue.some((q) => q.appointmentId === appointmentId);
    if (!inQueue) {
      const queueNumber = `A${String(updatedQueue.length + 1).padStart(3, '0')}`;
      const newQueueEntry: QueueEntry = {
        id: `q-${Date.now()}`,
        queueNumber,
        patientName: targetApt.patientName,
        doctorName: assignedDoc.name,
        priority: 'NORMAL',
        waitingTime: 0,
        estimatedWait: updatedQueue.length * 15,
        status: 'WAITING',
        appointmentId,
        addedAt: new Date().toISOString(),
        reason: `${targetApt.type} (${targetApt.department || 'General'})`,
      };
      updatedQueue.push(newQueueEntry);
    }

    setAppointments(updatedApts);
    setQueue(updatedQueue);

    clinicApi.checkInAppointment(appointmentId, doctorId, notes);

    addToast(
      'success',
      'Patient Checked In',
      'Patient checked in successfully.'
    );
  };

  // ==========================================
  // NO-SHOW + QUEUE PUSH NOTIFICATIONS
  // ==========================================

  const handleNoShow = (appointmentId: string) => {
    const result = noShowService.handleNoShow(appointmentId, appointments, queue, doctors);

    setAppointments(result.updatedAppointments);
    setQueue(result.updatedQueue);
    setNotifications((prev) => [...result.newNotifications, ...prev]);

    addToast(
      'success',
      'No-Show Processed',
      'Patient marked as no-show. Queue updated.'
    );
  };

  const acceptEarlierSlot = (notificationId: string) => {
    const result = noShowService.acceptEarlierSlot(
      notificationId,
      notifications,
      appointments,
      queue
    );

    setAppointments(result.updatedAppointments);
    setQueue(result.updatedQueue);
    setNotifications(result.updatedNotifications);

    addToast(
      'success',
      'Earlier Slot Accepted',
      'Earlier slot accepted successfully.'
    );
  };

  const declineEarlierSlot = (notificationId: string) => {
    const result = noShowService.declineEarlierSlot(notificationId, notifications);

    setNotifications(result.updatedNotifications);

    addToast(
      'info',
      'Original Slot Retained',
      'Patient kept the original appointment.'
    );
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    addToast('info', 'Notifications Cleared', 'All alerts have been cleared.');
  };

  // Add Patient
  const addPatient = (data: Omit<Patient, 'id'>): Patient => {
    const newId = `PAT${String(patients.length + 1).padStart(3, '0')}`;
    const newPatient: Patient = {
      id: newId,
      ...data,
      lastVisit: data.lastVisit || 'Today',
      status: data.status || 'Active',
    };

    setPatients((prev) => [newPatient, ...prev]);
    addToast('success', 'Patient Added', `${newPatient.name} has been added to patient records.`);
    return newPatient;
  };

  // Add Walk-in
  const addWalkIn = (data: {
    patientName: string;
    phone: string;
    reason: string;
    preferredDoctor: string;
    priority: QueuePriority;
    age?: number;
    gender?: string;
  }) => {
    const now = new Date();
    const registeredAt = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newId = `W${String(walkIns.length + 1).padStart(3, '0')}`;

    const newWalkIn: WalkIn = {
      id: newId,
      patientName: data.patientName,
      phone: data.phone,
      reason: data.reason,
      preferredDoctor: data.preferredDoctor,
      registeredAt,
      status: 'WAITING',
      priority: data.priority,
      age: data.age || 35,
      gender: data.gender || 'Male',
    };

    const prefix = data.priority === 'EMERGENCY' ? 'E' : data.priority === 'URGENT' ? 'U' : 'A';
    const queueNumber = `${prefix}${String(queue.length + 1).padStart(3, '0')}`;

    const newQueueEntry: QueueEntry = {
      id: `q-${Date.now()}`,
      queueNumber,
      patientName: data.patientName,
      doctorName: data.preferredDoctor,
      priority: data.priority,
      waitingTime: 0,
      estimatedWait: data.priority === 'EMERGENCY' ? 0 : 15,
      status: 'WAITING',
      walkInId: newWalkIn.id,
      addedAt: new Date().toISOString(),
      reason: data.reason,
    };

    let updatedQueue = [...queue];
    if (data.priority === 'EMERGENCY') {
      updatedQueue = [newQueueEntry, ...updatedQueue];
    } else {
      updatedQueue = [...updatedQueue, newQueueEntry];
    }

    setWalkIns((prev) => [newWalkIn, ...prev]);
    setQueue(updatedQueue);

    const patientExists = patients.some(
      (p) => p.name.toLowerCase() === data.patientName.toLowerCase()
    );
    if (!patientExists) {
      const newPatId = `PAT${String(patients.length + 1).padStart(3, '0')}`;
      const newPat: Patient = {
        id: newPatId,
        name: data.patientName,
        phone: data.phone,
        age: data.age || 35,
        gender: data.gender || 'Male',
        lastVisit: 'Today',
        status: 'In Queue',
        notes: `Walk-in: ${data.reason}`,
      };
      setPatients((prev) => [newPat, ...prev]);
    }

    clinicApi.addWalkIn(data);

    addToast('success', 'Walk-in Registered', 'Walk-in patient added successfully.');
  };

  // Add to Queue manually
  const addToQueue = (data: {
    patientName: string;
    doctorName: string;
    priority: QueuePriority;
    estimatedWait?: number;
    reason?: string;
  }) => {
    const prefix = data.priority === 'EMERGENCY' ? 'E' : data.priority === 'URGENT' ? 'U' : 'A';
    const queueNumber = `${prefix}${String(queue.length + 1).padStart(3, '0')}`;

    const newEntry: QueueEntry = {
      id: `q-${Date.now()}`,
      queueNumber,
      patientName: data.patientName,
      doctorName: data.doctorName,
      priority: data.priority,
      waitingTime: 0,
      estimatedWait:
        data.estimatedWait !== undefined
          ? data.estimatedWait
          : data.priority === 'EMERGENCY'
          ? 0
          : 15,
      status: 'WAITING',
      addedAt: new Date().toISOString(),
      reason: data.reason || 'General Consultation',
    };

    let updatedQueue = [...queue];
    if (data.priority === 'EMERGENCY') {
      updatedQueue = [newEntry, ...updatedQueue];
    } else {
      updatedQueue = [...updatedQueue, newEntry];
    }

    setQueue(updatedQueue);
    clinicApi.addToQueue(data);

    addToast('success', 'Patient Queued', `${data.patientName} (${queueNumber}) added to queue.`);
  };

  // Call Next Patient
  const callNextPatient = (preferredDoctorName?: string) => {
    const priorityWeight: Record<QueuePriority, number> = {
      EMERGENCY: 3,
      URGENT: 2,
      NORMAL: 1,
    };

    const waitingPatients = queue
      .filter((q) => q.status === 'WAITING')
      .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    if (waitingPatients.length === 0) {
      addToast('info', 'Queue Empty', 'There are no waiting patients in the queue.');
      return;
    }

    const nextPatient = preferredDoctorName
      ? waitingPatients.find((p) => p.doctorName === preferredDoctorName) || waitingPatients[0]
      : waitingPatients[0];

    const updatedQueue = queue.map((q) => {
      if (q.id === nextPatient.id) {
        return { ...q, status: 'IN_CONSULTATION' as QueueStatus };
      }
      return q;
    });

    const updatedDocs = doctors.map((doc) => {
      if (doc.name === nextPatient.doctorName) {
        return {
          ...doc,
          status: 'BUSY' as DoctorStatus,
          currentPatients: 1,
          currentPatientName: nextPatient.patientName,
        };
      }
      return doc;
    });

    if (nextPatient.appointmentId) {
      setAppointments((prev) =>
        prev.map((apt) =>
          apt.id === nextPatient.appointmentId
            ? { ...apt, status: 'IN_CONSULTATION' as const }
            : apt
        )
      );
    }

    setQueue(updatedQueue);
    setDoctors(updatedDocs);

    addToast(
      'success',
      'Patient Called',
      `Called ${nextPatient.patientName} (${nextPatient.queueNumber}) into consultation with ${nextPatient.doctorName}.`
    );
  };

  // Mark in consultation manually
  const markInConsultation = (queueId: string) => {
    const target = queue.find((q) => q.id === queueId);
    if (!target) return;

    setQueue((prev) =>
      prev.map((q) => (q.id === queueId ? { ...q, status: 'IN_CONSULTATION' as QueueStatus } : q))
    );

    setDoctors((prev) =>
      prev.map((d) =>
        d.name === target.doctorName
          ? { ...d, status: 'BUSY' as DoctorStatus, currentPatients: 1, currentPatientName: target.patientName }
          : d
      )
    );

    if (target.appointmentId) {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === target.appointmentId ? { ...a, status: 'IN_CONSULTATION' as const } : a
        )
      );
    }

    addToast('info', 'In Consultation', `${target.patientName} is now in consultation.`);
  };

  // Mark Completed
  const markCompleted = (queueId: string) => {
    const target = queue.find((q) => q.id === queueId);
    if (!target) return;

    const updatedQueue = queue.map((q) => {
      if (q.id === queueId) {
        return { ...q, status: 'COMPLETED' as QueueStatus };
      }
      return q;
    });

    const updatedDocs = doctors.map((doc) => {
      if (doc.name === target.doctorName) {
        return {
          ...doc,
          status: 'AVAILABLE' as DoctorStatus,
          currentPatients: Math.max(0, doc.currentPatients - 1),
          currentPatientName: undefined,
        };
      }
      return doc;
    });

    if (target.appointmentId) {
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === target.appointmentId ? { ...a, status: 'COMPLETED' as const } : a
        )
      );
    }

    setQueue(updatedQueue);
    setDoctors(updatedDocs);

    addToast(
      'success',
      'Consultation Completed',
      `Consultation completed for ${target.patientName}.`
    );
  };

  // Remove from queue
  const removeFromQueue = (queueId: string) => {
    const target = queue.find((q) => q.id === queueId);
    setQueue((prev) => prev.filter((q) => q.id !== queueId));
    if (target) {
      addToast('info', 'Queue Updated', `${target.patientName} removed from waiting queue.`);
    }
  };

  // Update Doctor Status
  const updateDoctorStatus = (doctorId: string, status: DoctorStatus) => {
    const targetDoc = doctors.find((d) => d.id === doctorId);
    if (!targetDoc) return;

    setDoctors((prev) =>
      prev.map((d) => {
        if (d.id === doctorId) {
          return {
            ...d,
            status,
            currentPatients: status === 'OFFLINE' ? 0 : d.currentPatients,
            currentPatientName: status === 'OFFLINE' ? undefined : d.currentPatientName,
          };
        }
        return d;
      })
    );

    addToast(
      'info',
      'Doctor Status Changed',
      `${targetDoc.name} status updated to ${status}.`
    );
  };

  // Add Appointment
  const addAppointment = (data: Omit<Appointment, 'id' | 'status'>) => {
    const newId = `APT${String(appointments.length + 1).padStart(3, '0')}`;
    const newApt: Appointment = {
      id: newId,
      status: 'BOOKED',
      ...data,
      date: data.date || '2026-08-21',
    };

    setAppointments((prev) => [...prev, newApt]);
    addToast('success', 'Appointment Booked', `Appointment ${newId} scheduled for ${newApt.patientName}.`);
  };

  return (
    <ClinicContext.Provider
      value={{
        patients,
        doctors,
        appointments,
        queue,
        walkIns,
        summary,
        notifications,
        unreadNotificationsCount,
        toasts,
        addToast,
        removeToast,
        checkInAppointment,
        handleNoShow,
        acceptEarlierSlot,
        declineEarlierSlot,
        markNotificationAsRead,
        clearAllNotifications,
        addPatient,
        addWalkIn,
        addToQueue,
        callNextPatient,
        markInConsultation,
        markCompleted,
        removeFromQueue,
        updateDoctorStatus,
        addAppointment,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = (): ClinicContextType => {
  const context = useContext(ClinicContext);
  if (!context) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
