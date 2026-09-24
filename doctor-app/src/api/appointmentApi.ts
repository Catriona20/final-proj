import { apiClient } from './apiClient';
import { Appointment } from '../types';

export const appointmentApi = {
  getTodayAppointments: async (clinicId?: string): Promise<{ appointments: Appointment[] }> => {
    const params = clinicId ? { clinicId } : {};
    const res = await apiClient.get('/doctors/auth/appointments/today', { params });
    return res.data;
  },

  getUpcomingAppointments: async (clinicId?: string): Promise<{ appointments: Appointment[] }> => {
    const params = clinicId ? { clinicId } : {};
    const res = await apiClient.get('/doctors/auth/appointments/upcoming', { params });
    return res.data;
  },

  getAppointmentById: async (id: string): Promise<{ appointment: Appointment }> => {
    const res = await apiClient.get(`/appointments/${id}`);
    return res.data;
  },

  cancelAppointment: async (id: string): Promise<{ appointment: Appointment }> => {
    const res = await apiClient.post(`/appointments/${id}/cancel`);
    return res.data;
  },
};
