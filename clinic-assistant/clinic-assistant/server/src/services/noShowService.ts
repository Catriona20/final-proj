import { dbStore } from '../db/database.js';
import { Appointment, QueueEntry } from '../types/index.js';

export interface BackendNoShowResult {
  success: boolean;
  appointment?: Appointment;
  affectedPatient?: Appointment;
  offeredSlot?: string;
  updatedQueue?: QueueEntry[];
  message: string;
}

export class NoShowService {
  public static handleNoShow(appointmentId: string): BackendNoShowResult {
    const aptIndex = dbStore.appointments.findIndex((a) => a.id === appointmentId);
    if (aptIndex === -1) {
      return { success: false, message: 'Appointment not found' };
    }

    const apt = dbStore.appointments[aptIndex];
    apt.status = 'NO_SHOW';
    apt.notes = apt.notes ? `${apt.notes} • Marked No-Show` : 'Marked No-Show';

    // Remove from queue
    dbStore.queueEntries = dbStore.queueEntries.filter(
      (q) => q.appointmentId !== appointmentId && q.patientName !== apt.patientName
    );

    // Recalculate estimated wait times
    dbStore.queueEntries.forEach((entry, idx) => {
      entry.estimatedWait = idx * 15;
    });

    // Find eligible candidate
    const eligibleCandidate = dbStore.appointments.find(
      (a) =>
        a.id !== appointmentId &&
        (a.doctorId === apt.doctorId || a.doctorName === apt.doctorName) &&
        a.status === 'BOOKED'
    );

    return {
      success: true,
      appointment: apt,
      affectedPatient: eligibleCandidate,
      offeredSlot: apt.time,
      updatedQueue: dbStore.queueEntries,
      message: 'Patient marked as no-show and queue updated.',
    };
  }
}
