import { apiClient } from './apiClient';
import { Patient, Appointment, Prescription, MedicalFile, Consultation } from '../types';

export interface PatientDetailResponse {
  patient: Patient;
  history: {
    appointments: Appointment[];
    prescriptions: Prescription[];
    reports: MedicalFile[];
    consultations: Consultation[];
  };
}

export const patientApi = {
  getDoctorPatients: async (query?: string): Promise<{ patients: Patient[] }> => {
    const params = query ? { query } : {};
    const res = await apiClient.get('/doctors/auth/patients', { params });
    return res.data;
  },

  getPatientDetail: async (patientId: string): Promise<PatientDetailResponse> => {
    const res = await apiClient.get(`/doctors/auth/patients/${patientId}`);
    return res.data;
  },
};
