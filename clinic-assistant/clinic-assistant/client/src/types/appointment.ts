export type AppointmentStatus =
  | 'BOOKED'
  | 'CHECKED_IN'
  | 'WAITING'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'NO_SHOW';

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  department?: string;
  time: string;
  date?: string;
  type: string;
  status: AppointmentStatus;
  notes?: string;
  checkedInAt?: string;
}
