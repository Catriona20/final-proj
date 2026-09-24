import { Appointment, Doctor, AppointmentStatus, UploadedMedicalFile } from '../types';
import { apiClient } from './apiClient';
import { useAuthStore } from '../store/useAuthStore';

export interface BookAppointmentParams {
  doctor: Doctor;
  clinicId: string;
  department: string;
  date: string;
  time: string;
  reason?: string;
  customReasonText?: string;
  symptoms?: string[];
  uploadedFiles?: UploadedMedicalFile[];
  notes?: string;
  expectedDuration?: string;
  consultationFee?: string;
}

export const appointmentService = {
  async getAppointments(patientId?: string): Promise<Appointment[]> {
    try {
      const authUser = useAuthStore.getState().user;
      const pid = patientId || authUser?.id;
      const url = pid ? `/appointments?patientId=${encodeURIComponent(pid)}` : '/appointments';
      const res = await apiClient.get(url);
      const rawList: Appointment[] = res.data?.appointments || [];
      const seen = new Set<string>();
      const deduplicated: Appointment[] = [];
      for (const a of rawList) {
        if (!seen.has(a.id)) {
          seen.add(a.id);
          deduplicated.push(a);
        }
      }
      return deduplicated;
    } catch (err) {
      console.warn('Get appointments API error:', err);
      return [];
    }
  },

  async getUpcomingAppointments(): Promise<Appointment[]> {
    const list = await this.getAppointments();
    const activeStatuses: AppointmentStatus[] = [
      'Confirmed',
      'Checked In',
      'Waiting',
      'Almost Your Turn',
      'Next',
      'In Consultation',
      'Delayed',
      'Booked',
      'Arrived',
    ];
    return list.filter((a) => activeStatuses.includes(a.status));
  },

  async getRecentVisits(): Promise<Appointment[]> {
    const list = await this.getAppointments();
    return list.filter((a) => a.status === 'Completed');
  },

  async getCancelledAppointments(): Promise<Appointment[]> {
    const list = await this.getAppointments();
    return list.filter((a) => a.status === 'Cancelled');
  },

  async getAppointmentById(id: string): Promise<Appointment | undefined> {
    try {
      const res = await apiClient.get(`/appointments/${id}`);
      return res.data?.appointment;
    } catch (err) {
      return undefined;
    }
  },

  async bookAppointment(params: BookAppointmentParams): Promise<Appointment> {
    const authUser = useAuthStore.getState().user;
    const patientId = authUser?.id;
    const patientName = authUser?.name;
    const patientPhone = authUser?.phone;

    if (!patientId) {
      throw new Error('You must be logged in to book an appointment.');
    }

    const response = await apiClient.post('/appointments/book', {
      patientId,
      patientName,
      patientPhone,
      doctorId: params.doctor.id,
      clinicId: params.clinicId,
      department: params.department,
      date: params.date,
      time: params.time,
      reason: params.reason,
      customReasonText: params.customReasonText,
      symptoms: params.symptoms,
      uploadedFiles: params.uploadedFiles,
      notes: params.notes,
      expectedDuration: params.expectedDuration,
      consultationFee: params.consultationFee,
    });

    return response.data?.appointment;
  },

  async cancelAppointment(id: string, reason?: string): Promise<void> {
    await apiClient.post(`/appointments/${id}/cancel`, { reason });
  },

  async rescheduleAppointment(id: string, date: string, time: string): Promise<void> {
    await apiClient.post(`/appointments/${id}/reschedule`, { date, time });
  },

  async acceptEarlierSlot(id: string): Promise<void> {
    await apiClient.post(`/appointments/${id}/accept-earlier-slot`);
  },

  async declineEarlierSlot(id: string): Promise<void> {
    await apiClient.post(`/appointments/${id}/decline-earlier-slot`);
  },

  async updateAppointmentStatus(id: string, status: AppointmentStatus): Promise<void> {
    // Used by simulations / doctor completions
    if (status === 'Completed') {
      await apiClient.post('/simulation/complete-consultation', { appointmentId: id });
    } else if (status === 'In Consultation') {
      await apiClient.post('/simulation/start-consultation', { appointmentId: id });
    }
  },
};
