import { apiClient } from './apiClient';
import { Doctor } from '../types';

export interface DoctorLoginPayload {
  emailOrPhone: string;
  password?: string;
  otp?: string;
}

export interface DoctorRegisterPayload {
  name: string;
  email: string;
  phone: string;
  password?: string;
  registrationNumber: string;
  registrationAuthority?: string;
  specialization: string;
  primarySpecialization?: string;
  qualification: string;
  university?: string;
  gradYear?: number;
  experienceYears?: number;
  clinicName?: string;
  clinicId?: string;
  consultationFee?: string;
  languages?: string[];
  procedures?: string[];
  consultationDuration?: string;
  about?: string;
  avatar?: string;
}

export const authApi = {
  sendOtp: async (identifier: string, isPhone?: boolean): Promise<{ success: boolean; message: string; expiresInSeconds?: number; devOtp?: string }> => {
    const payload = isPhone ? { phone: identifier } : { email: identifier };
    const res = await apiClient.post('/auth/doctor/send-otp', payload);
    return res.data;
  },

  verifyOtp: async (identifier: string, otp: string, isPhone?: boolean): Promise<{ success: boolean; verified: boolean; message: string }> => {
    const payload = isPhone ? { phone: identifier, otp } : { email: identifier, otp };
    const res = await apiClient.post('/auth/doctor/verify-otp', payload);
    return res.data;
  },

  login: async (payload: DoctorLoginPayload): Promise<{ token: string; doctor: Doctor }> => {
    const res = await apiClient.post('/auth/doctor/login', payload);
    return res.data;
  },

  register: async (
    payload: DoctorRegisterPayload
  ): Promise<{
    token: string;
    doctor: Doctor;
    message: string;
    riskEvaluation?: { riskScore: number; riskLevel: string; triggeredRules: string[] };
  }> => {
    const res = await apiClient.post('/auth/doctor/register', payload);
    return res.data;
  },

  refreshSession: async (): Promise<{ token: string; doctor: Doctor }> => {
    const res = await apiClient.post('/auth/doctor/refresh');
    return res.data;
  },
};
