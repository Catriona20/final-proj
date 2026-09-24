export type Gender = 'Male' | 'Female' | 'Other';

export type DoctorStatus = 'AVAILABLE' | 'BUSY' | 'OFFLINE';

export type AppointmentStatus =
  | 'BOOKED'
  | 'CHECKED_IN'
  | 'WAITING'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'NO_SHOW';

export type QueuePriority = 'NORMAL' | 'URGENT' | 'EMERGENCY';

export type QueueStatus = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';

export type WalkInStatus = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';

export interface Patient {
  id: string;
  name: string;
  phone: string;
  age: number;
  gender: string;
  email?: string;
  address?: string;
  createdAt?: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  status: DoctorStatus;
  currentPatients: number;
  avatarUrl?: string;
  roomNumber?: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  time: string;
  type: string;
  status: AppointmentStatus;
  notes?: string;
  checkedInAt?: string;
}

export interface QueueEntry {
  id: string;
  queueNumber: string;
  patientName: string;
  doctorName: string;
  priority: QueuePriority;
  waitingTime: number; // in minutes
  estimatedWait: number; // in minutes
  status: QueueStatus;
  appointmentId?: string;
  walkInId?: string;
  addedAt?: string;
}

export interface WalkIn {
  id: string;
  patientName: string;
  phone: string;
  reason: string;
  preferredDoctor: string;
  registeredAt: string;
  status: WalkInStatus;
  priority?: QueuePriority;
}

export interface DashboardSummary {
  todayAppointments: {
    total: number;
    remaining: number;
  };
  checkedIn: {
    total: number;
    subtitle: string;
  };
  waiting: {
    total: number;
    subtitle: string;
  };
  availableDoctors: {
    available: number;
    total: number;
    subtitle: string;
  };
  walkIns: {
    total: number;
    subtitle: string;
  };
}
