import { Clinic, Specialization, Doctor } from '../types';
import { apiClient } from './apiClient';
import { discoveredClinicCache } from './clinicSearchService';
import { MOCK_SPECIALIZATIONS } from '../data/mockData';

export const clinicService = {
  async getSpecializations(): Promise<Specialization[]> {
    try {
      const res = await apiClient.get('/clinics/specializations');
      return res.data?.specializations || MOCK_SPECIALIZATIONS;
    } catch (err) {
      console.warn('Specializations API error, fallback to initial data:', err);
      return MOCK_SPECIALIZATIONS;
    }
  },

  async getNearbyClinics(): Promise<Clinic[]> {
    try {
      const res = await apiClient.get('/clinics/discovery?radius=10');
      return res.data?.clinics || [];
    } catch (err) {
      return [];
    }
  },

  async getRecommendedClinics(): Promise<Clinic[]> {
    try {
      const res = await apiClient.get('/clinics/discovery?sort=best');
      return res.data?.clinics || [];
    } catch (err) {
      return [];
    }
  },

  async getClinics(): Promise<Clinic[]> {
    try {
      const res = await apiClient.get('/clinics');
      return res.data?.clinics || [];
    } catch (err) {
      return [];
    }
  },

  async getClinicById(id: string): Promise<Clinic | undefined> {
    const cached = discoveredClinicCache.get(id);
    if (cached) return cached;

    try {
      const res = await apiClient.get(`/clinics/${id}`);
      const clinic = res.data?.clinic;
      if (clinic) {
        discoveredClinicCache.set(clinic.id, clinic);
        return clinic;
      }
    } catch (err) {
      console.warn(`Clinic detail API error for ${id}:`, err);
    }
    return undefined;
  },

  async searchClinics(query: string, category?: string): Promise<Clinic[]> {
    try {
      const params = new URLSearchParams();
      if (query) params.append('query', query);
      if (category) params.append('preference', category);
      const res = await apiClient.get(`/clinics/discovery?${params.toString()}`);
      return res.data?.clinics || [];
    } catch (err) {
      return [];
    }
  },

  async getDoctorsByClinic(clinicId: string): Promise<Doctor[]> {
    try {
      const res = await apiClient.get(`/clinics/${clinicId}/doctors`);
      return res.data?.doctors || [];
    } catch (err) {
      return [];
    }
  },
};
