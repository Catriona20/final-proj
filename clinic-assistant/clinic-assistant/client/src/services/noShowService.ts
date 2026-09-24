import { Appointment } from '../types/appointment.js';
import { QueueEntry } from '../types/queue.js';
import { Doctor } from '../types/doctor.js';
import { ClinicNotification } from '../types/notification.js';

// Helper to convert time string "10:00 AM" to minutes from midnight
export const timeToMinutes = (timeStr: string): number => {
  if (!timeStr) return 0;
  const match = timeStr.trim().match(/(\d+):(\d+)\s*(AM|PM)?/i);
  if (!match) return 0;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3]?.toUpperCase();

  if (period === 'PM' && hours !== 12) hours += 12;
  if (period === 'AM' && hours === 12) hours = 0;

  return hours * 60 + minutes;
};

// Helper to format minutes from midnight to "HH:MM AM/PM"
export const minutesToTime = (minutes: number): string => {
  let hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  const period = hours >= 12 ? 'PM' : 'AM';

  if (hours > 12) hours -= 12;
  if (hours === 0) hours = 12;

  const minStr = mins < 10 ? `0${mins}` : `${mins}`;
  return `${hours}:${minStr} ${period}`;
};

export interface NoShowResult {
  updatedAppointments: Appointment[];
  updatedQueue: QueueEntry[];
  newNotifications: ClinicNotification[];
  affectedPatient?: Appointment;
  offeredSlot?: string;
  noShowAppointment?: Appointment;
}

export const noShowService = {
  /**
   * Process a patient No-Show:
   * 1. Mark appointment as NO_SHOW.
   * 2. Remove patient from active queue.
   * 3. Move all patients behind forward and recalculate estimated wait times / ETAs.
   * 4. Identify the best eligible patient for the earlier available slot.
   * 5. Generate mock notifications for the receptionist & patient.
   */
  handleNoShow(
    appointmentId: string,
    appointments: Appointment[],
    queue: QueueEntry[],
    doctors: Doctor[]
  ): NoShowResult {
    const targetApt = appointments.find((a) => a.id === appointmentId);
    if (!targetApt) {
      return {
        updatedAppointments: appointments,
        updatedQueue: queue,
        newNotifications: [],
      };
    }

    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const freedSlotTime = targetApt.time;
    const freedSlotMinutes = timeToMinutes(freedSlotTime);

    // 1. Update appointment status to NO_SHOW
    const updatedAppointments = appointments.map((apt) => {
      if (apt.id === appointmentId) {
        return {
          ...apt,
          status: 'NO_SHOW' as const,
          notes: apt.notes
            ? `${apt.notes} • Marked No-Show at ${nowStr}`
            : `Marked No-Show at ${nowStr}`,
        };
      }
      return apt;
    });

    // 2. Remove the no-show patient from active queue (by appointmentId or patientName)
    const removedQueueEntry = queue.find(
      (q) => q.appointmentId === appointmentId || q.patientName === targetApt.patientName
    );

    const remainingQueue = queue.filter(
      (q) => q.appointmentId !== appointmentId && q.patientName !== targetApt.patientName
    );

    // 3. Recalculate queue positions and estimated wait times
    const updatedQueue: QueueEntry[] = remainingQueue.map((entry, index) => {
      // Each position takes ~15 minutes
      const recalculatedWait = index * 15;
      const newEtaMinutes = freedSlotMinutes + recalculatedWait;
      const newEtaStr = minutesToTime(newEtaMinutes);

      return {
        ...entry,
        waitingTime: entry.waitingTime > 5 ? entry.waitingTime - 5 : entry.waitingTime,
        estimatedWait: recalculatedWait,
      };
    });

    // 4. Identify eligible patients for the freed earlier slot
    // Criteria:
    // - Same doctor
    // - Not NO_SHOW, not COMPLETED, not IN_CONSULTATION
    // - Scheduled slot is strictly after the freed slot
    // - Ranked by earliest appointment time, then queue priority
    const eligibleCandidates = appointments
      .filter((apt) => {
        if (apt.id === appointmentId) return false;
        if (apt.doctorId !== targetApt.doctorId && apt.doctorName !== targetApt.doctorName) {
          return false;
        }
        if (apt.status === 'NO_SHOW' || apt.status === 'COMPLETED' || apt.status === 'IN_CONSULTATION') {
          return false;
        }
        const candidateMinutes = timeToMinutes(apt.time);
        return candidateMinutes > freedSlotMinutes;
      })
      .sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

    const bestCandidate = eligibleCandidates[0];

    // 5. Create notifications
    const newNotifications: ClinicNotification[] = [];

    // Notification A: Earlier Slot Available (for receptionist/patient)
    if (bestCandidate) {
      newNotifications.push({
        id: `notif-slot-${Date.now()}-${bestCandidate.id}`,
        patientId: bestCandidate.patientId,
        patientName: bestCandidate.patientName,
        doctorId: bestCandidate.doctorId,
        doctorName: bestCandidate.doctorName,
        type: 'EARLIER_SLOT',
        title: `Earlier slot available for ${bestCandidate.patientName}`,
        message: `An earlier appointment slot at ${freedSlotTime} is available with ${targetApt.doctorName}. Current scheduled slot: ${bestCandidate.time}.`,
        createdAt: nowStr,
        read: false,
        status: 'PENDING',
        appointmentId: bestCandidate.id,
        originalSlot: bestCandidate.time,
        offeredSlot: freedSlotTime,
      });
    }

    // Notification B: Queue updates for affected waiting patients
    updatedQueue.forEach((entry, idx) => {
      if (idx < 3) {
        // Generate notifications for top affected patients
        const newEtaMinutes = freedSlotMinutes + idx * 15;
        const newEta = minutesToTime(newEtaMinutes);

        newNotifications.push({
          id: `notif-q-${Date.now()}-${entry.id}-${idx}`,
          patientName: entry.patientName,
          doctorName: entry.doctorName,
          type: 'QUEUE_UPDATE',
          title: `Queue updated for ${entry.patientName}`,
          message: `Your queue position advanced to #${idx + 1}. Estimated consultation time updated to ${newEta}.`,
          createdAt: nowStr,
          read: false,
          status: 'PENDING',
          newEta,
          newWaitTime: entry.estimatedWait,
        });
      }
    });

    // Notification C: Log no-show event
    newNotifications.push({
      id: `notif-noshow-${Date.now()}`,
      patientId: targetApt.patientId,
      patientName: targetApt.patientName,
      doctorName: targetApt.doctorName,
      type: 'NO_SHOW',
      title: `No-Show Recorded: ${targetApt.patientName}`,
      message: `${targetApt.patientName} marked as No-Show for ${targetApt.time} appointment. Queue recalculated.`,
      createdAt: nowStr,
      read: false,
      status: 'ACCEPTED',
      appointmentId: targetApt.id,
      originalSlot: targetApt.time,
    });

    return {
      updatedAppointments,
      updatedQueue,
      newNotifications,
      affectedPatient: bestCandidate,
      offeredSlot: freedSlotTime,
      noShowAppointment: targetApt,
    };
  },

  /**
   * Accept an earlier appointment slot
   */
  acceptEarlierSlot(
    notificationId: string,
    notifications: ClinicNotification[],
    appointments: Appointment[],
    queue: QueueEntry[]
  ): {
    updatedAppointments: Appointment[];
    updatedQueue: QueueEntry[];
    updatedNotifications: ClinicNotification[];
    patientName: string;
    newSlot: string;
  } {
    const targetNotif = notifications.find((n) => n.id === notificationId);
    if (!targetNotif || !targetNotif.offeredSlot || !targetNotif.appointmentId) {
      return {
        updatedAppointments: appointments,
        updatedQueue: queue,
        updatedNotifications: notifications,
        patientName: '',
        newSlot: '',
      };
    }

    const newSlotTime = targetNotif.offeredSlot;
    const patientName = targetNotif.patientName;

    // 1. Update appointment time
    const updatedAppointments = appointments.map((apt) => {
      if (apt.id === targetNotif.appointmentId) {
        return {
          ...apt,
          time: newSlotTime,
          notes: apt.notes
            ? `${apt.notes} • Accepted earlier slot (${newSlotTime})`
            : `Rescheduled to earlier slot: ${newSlotTime}`,
        };
      }
      return apt;
    });

    // 2. Update linked queue entry if any
    const updatedQueue = queue.map((q) => {
      if (q.appointmentId === targetNotif.appointmentId || q.patientName === patientName) {
        return {
          ...q,
          reason: `${q.reason || 'Consultation'} (Advanced to ${newSlotTime})`,
        };
      }
      return q;
    });

    // 3. Mark notification as ACCEPTED
    const updatedNotifications = notifications.map((n) => {
      if (n.id === notificationId) {
        return {
          ...n,
          status: 'ACCEPTED' as const,
          read: true,
          message: `Slot accepted! ${patientName}'s appointment rescheduled from ${n.originalSlot} to ${newSlotTime}.`,
        };
      }
      return n;
    });

    return {
      updatedAppointments,
      updatedQueue,
      updatedNotifications,
      patientName,
      newSlot: newSlotTime,
    };
  },

  /**
   * Decline an earlier appointment slot
   */
  declineEarlierSlot(
    notificationId: string,
    notifications: ClinicNotification[]
  ): {
    updatedNotifications: ClinicNotification[];
    patientName: string;
  } {
    const targetNotif = notifications.find((n) => n.id === notificationId);
    const patientName = targetNotif ? targetNotif.patientName : 'Patient';

    const updatedNotifications = notifications.map((n) => {
      if (n.id === notificationId) {
        return {
          ...n,
          status: 'DECLINED' as const,
          read: true,
          message: `${patientName} chose to keep their original appointment slot (${n.originalSlot}).`,
        };
      }
      return n;
    });

    return {
      updatedNotifications,
      patientName,
    };
  },
};
