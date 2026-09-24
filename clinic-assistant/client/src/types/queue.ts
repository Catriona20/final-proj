export type QueuePriority = 'NORMAL' | 'URGENT' | 'EMERGENCY';

export type QueueStatus = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';

export interface QueueEntry {
  id: string;
  queueNumber: string;
  queuePosition?: number;
  patientsAhead?: number;
  patientId?: string;
  patientName: string;
  doctorId?: string;
  doctorName: string;
  priority: QueuePriority;
  waitingTime: number; // in minutes
  estimatedWait: number; // in minutes
  status: QueueStatus;
  appointmentId?: string;
  walkInId?: string;
  addedAt?: string;
  reason?: string;
}
