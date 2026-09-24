import { dbStore } from '../db/database.js';
import { Appointment, QueueEntry } from '../types/index.js';

export class AppointmentService {
  public static getTodayAppointments(): Appointment[] {
    return dbStore.appointments;
  }

  public static getAppointmentById(id: string): Appointment | undefined {
    return dbStore.appointments.find((apt) => apt.id === id);
  }

  public static checkInAppointment(
    id: string,
    overrideDoctorId?: string,
    notes?: string
  ): { success: boolean; appointment?: Appointment; queueEntry?: QueueEntry; message: string } {
    const appointmentIndex = dbStore.appointments.findIndex((apt) => apt.id === id);
    if (appointmentIndex === -1) {
      return { success: false, message: 'Appointment not found' };
    }

    const appointment = dbStore.appointments[appointmentIndex];

    if (appointment.status === 'CHECKED_IN' || appointment.status === 'IN_CONSULTATION') {
      return { success: false, message: 'Patient is already checked in', appointment };
    }

    if (overrideDoctorId) {
      const doctor = dbStore.doctors.find((d) => d.id === overrideDoctorId);
      if (doctor) {
        appointment.doctorId = doctor.id;
        appointment.doctorName = doctor.name;
      }
    }

    appointment.status = 'CHECKED_IN';
    appointment.checkedInAt = new Date().toISOString();
    if (notes) appointment.notes = notes;

    dbStore.appointments[appointmentIndex] = appointment;

    // Check if patient already in waiting queue
    let queueEntry = dbStore.queueEntries.find((q) => q.appointmentId === id);
    if (!queueEntry) {
      const queueNumber = `A${String(dbStore.queueEntries.length + 1).padStart(3, '0')}`;
      queueEntry = {
        id: `q-${Date.now()}`,
        queueNumber,
        patientName: appointment.patientName,
        doctorName: appointment.doctorName,
        priority: 'NORMAL',
        waitingTime: 0,
        estimatedWait: 15,
        status: 'WAITING',
        appointmentId: appointment.id,
        addedAt: new Date().toISOString(),
      };
      dbStore.queueEntries.push(queueEntry);
    }

    return {
      success: true,
      appointment,
      queueEntry,
      message: `${appointment.patientName} successfully checked in.`,
    };
  }

  public static createAppointment(data: Omit<Appointment, 'id'>): Appointment {
    const newAppointment: Appointment = {
      ...data,
      id: `apt-${Date.now()}`,
    };
    dbStore.appointments.push(newAppointment);
    return newAppointment;
  }
}
