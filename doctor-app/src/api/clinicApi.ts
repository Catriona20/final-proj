import { apiClient } from './apiClient';
import { DiscoveredClinic } from '../types';

export const clinicApi = {
  discoverClinics: async (params?: {
    query?: string;
    department?: string;
    latitude?: number;
    longitude?: number;
    radius?: number;
  }): Promise<{ clinics: DiscoveredClinic[]; results?: DiscoveredClinic[]; count: number }> => {
    const res = await apiClient.get('/clinics/discovery', { params });
    return res.data;
  },

  getAllClinics: async (): Promise<{ clinics: DiscoveredClinic[] }> => {
    const res = await apiClient.get('/clinics');
    return res.data;
  },

  getClinicById: async (id: string): Promise<{ clinic: DiscoveredClinic }> => {
    const res = await apiClient.get(`/clinics/${id}`);
    return res.data;
  },
};
