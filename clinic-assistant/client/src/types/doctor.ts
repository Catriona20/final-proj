export type DoctorStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  specialty?: string;
  status: DoctorStatus;
  currentPatients: number;
  currentPatientName?: string;
  todayAppointmentsCount?: number;
  todayPatients?: number;
  avgConsultTime?: number;
  roomNumber?: string;
  room?: string;
  avatarUrl?: string;
  phone?: string;
}
