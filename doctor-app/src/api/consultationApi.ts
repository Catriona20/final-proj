import { apiClient } from './apiClient';
import { Consultation, Prescription, Appointment, PrescriptionMedicine } from '../types';

export interface CreateConsultationPayload {
  appointmentId: string;
  patientId: string;
  clinicId?: string;
  clinicalNotes?: string;
  symptoms?: string[];
  assessment?: string;
  diagnosis: string;
  medicines?: PrescriptionMedicine[];
  followUpDate?: string;
  followUpReason?: string;
  vitals?: {
    bp?: string;
    pulse?: string;
    temperature?: string;
    weight?: string;
    spO2?: string;
  };
}

export const consultationApi = {
  createConsultation: async (
    payload: CreateConsultationPayload
  ): Promise<{
    consultation: Consultation;
    prescription: Prescription | null;
    appointment: Appointment;
    message: string;
  }> => {
    const res = await apiClient.post('/doctors/auth/consultations', payload);
    return res.data;
  },
};
