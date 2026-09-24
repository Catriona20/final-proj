import { apiClient } from './apiClient';
import {
  Doctor,
  DoctorAvailabilityStatus,
  DoctorVerificationDocument,
  AuditLog,
  DoctorClinicItem,
  DoctorLoadItem,
  VerificationAuditItem,
  AvailabilityRequest,
} from '../types';

export const doctorApi = {
  getProfile: async (): Promise<{ doctor: Doctor }> => {
    const res = await apiClient.get('/doctors/auth/me');
    return res.data;
  },

  getDoctorClinics: async (): Promise<{
    clinics: DoctorClinicItem[];
    allDemoClinics?: DoctorClinicItem[];
    totalDemoClinics?: number;
    assignedClinicsCount?: number;
  }> => {
    const res = await apiClient.get('/doctors/auth/clinics');
    return res.data;
  },

  getDoctorLoad: async (clinicId?: string): Promise<{ clinicId: string; doctorLoad: DoctorLoadItem[] }> => {
    const params = clinicId ? { clinicId } : {};
    const res = await apiClient.get('/doctors/auth/load', { params });
    return res.data;
  },

  getVerificationAuditTrail: async (): Promise<{ auditTrail: VerificationAuditItem[] }> => {
    const res = await apiClient.get('/doctors/auth/verification/audit-trail');
    return res.data;
  },

  updateProfile: async (
    updates: Partial<Doctor>
  ): Promise<{ doctor: Doctor; triggeredReverification: boolean; message: string }> => {
    const res = await apiClient.put('/doctors/auth/me', updates);
    return res.data;
  },

  uploadVerificationDocument: async (payload: {
    documentType: string;
    documentName: string;
    uri?: string;
  }): Promise<{ document: DoctorVerificationDocument; documents: DoctorVerificationDocument[]; message: string }> => {
    const res = await apiClient.post('/doctors/auth/verification/documents', payload);
    return res.data;
  },

  updateAvailability: async (status: DoctorAvailabilityStatus): Promise<{ status: DoctorAvailabilityStatus; isAvailableToday: boolean }> => {
    const res = await apiClient.post('/doctors/auth/availability', { status });
    return res.data;
  },

  reportDelay: async (delayMinutes: number, reason?: string): Promise<{ message: string }> => {
    const res = await apiClient.post('/doctors/auth/delay', { delayMinutes, reason });
    return res.data;
  },

  getAuditLogs: async (): Promise<{ logs: AuditLog[] }> => {
    const res = await apiClient.get('/doctors/auth/audit-logs');
    return res.data;
  },

  getEarlierSlots: async (): Promise<{ eligiblePatients: any[] }> => {
    const res = await apiClient.get('/doctors/auth/earlier-slots');
    return res.data;
  },

  getAiPatientSummary: async (patientId: string): Promise<{ success: boolean; summary: any }> => {
    const res = await apiClient.post('/ai/patient-summary', { patientId });
    return res.data;
  },

  getAiConsultationSummary: async (consultationData: any): Promise<{ success: boolean; summary: any }> => {
    const res = await apiClient.post('/ai/summarize-consultation', { consultationData });
    return res.data;
  },
  getAiSymptomAnalysis: async (query: string): Promise<any> => {
    const res = await apiClient.post('/ai/symptom-analysis', { query });
    return res.data;
  },

  getAvailabilityRequests: async (doctorId?: string): Promise<{ requests: AvailabilityRequest[] }> => {
    const params = doctorId ? { doctorId } : {};
    const res = await apiClient.get('/availability/requests', { params });
    return res.data;
  },

  approveAvailabilityRequest: async (requestId: string, notes?: string): Promise<{ success: boolean; request: AvailabilityRequest; message: string }> => {
    const res = await apiClient.post(`/availability/requests/${requestId}/approve`, { notes });
    return res.data;
  },

  rejectAvailabilityRequest: async (requestId: string, reason?: string): Promise<{ success: boolean; request: AvailabilityRequest; message: string }> => {
    const res = await apiClient.post(`/availability/requests/${requestId}/reject`, { reason });
    return res.data;
  },
};
