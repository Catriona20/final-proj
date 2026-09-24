export type DoctorStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  status: DoctorStatus;
  currentPatients: number;
  currentPatientName?: string;
  todayAppointmentsCount?: number;
  roomNumber?: string;
  avatarUrl?: string;
  phone?: string;
}
