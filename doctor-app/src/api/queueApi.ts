import { apiClient } from './apiClient';
import { Appointment } from '../types';

export interface LiveQueueResponse {
  currentPatient: Appointment | null;
  nextPatient: Appointment | null;
  waitingCount: number;
  completedCount: number;
  totalToday: number;
  queue: Appointment[];
}

export const queueApi = {
  getLiveQueue: async (clinicId?: string): Promise<LiveQueueResponse> => {
    const params = clinicId ? { clinicId } : {};
    const res = await apiClient.get('/doctors/auth/queue', { params });
    return res.data;
  },

  advanceQueue: async (appointmentId: string): Promise<{ appointment: Appointment }> => {
    const res = await apiClient.post('/simulation/advance-queue', { appointmentId });
    return res.data;
  },

  startConsultation: async (appointmentId: string): Promise<{ appointment: Appointment }> => {
    const res = await apiClient.post('/simulation/start-consultation', { appointmentId });
    return res.data;
  },
};
