import { QueuePriority } from './queue.js';

export type WalkInStatus = 'WAITING' | 'IN_CONSULTATION' | 'COMPLETED';

export interface WalkIn {
  id: string;
  patientName: string;
  phone: string;
  reason: string;
  preferredDoctor: string;
  registeredAt: string;
  status: WalkInStatus;
  priority?: QueuePriority;
  age?: number;
  gender?: string;
}
