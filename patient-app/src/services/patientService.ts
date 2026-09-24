import { Patient, SavedLocation } from '../types';
import { apiClient } from './apiClient';
import { useAuthStore } from '../store/useAuthStore';

export const patientService = {
  async getProfile(): Promise<Patient | null> {
    try {
      const res = await apiClient.get('/patient/profile');
      if (res.data?.user) {
        useAuthStore.getState().updateProfile(res.data.user);
        return res.data.user;
      }
      return useAuthStore.getState().user;
    } catch (err) {
      console.warn('Patient getProfile API error, using stored profile:', err);
      return useAuthStore.getState().user;
    }
  },

  async updateProfile(updatedData: Partial<Patient>): Promise<Patient | null> {
    try {
      const res = await apiClient.put('/patient/profile', updatedData);
      if (res.data?.user) {
        useAuthStore.getState().updateProfile(res.data.user);
        return res.data.user;
      }
      useAuthStore.getState().updateProfile(updatedData);
      return useAuthStore.getState().user;
    } catch (err) {
      console.warn('Patient updateProfile API error, updating local state:', err);
      useAuthStore.getState().updateProfile(updatedData);
      return useAuthStore.getState().user;
    }
  },

  async getSavedLocations(): Promise<SavedLocation[]> {
    try {
      const res = await apiClient.get('/patient/saved-locations');
      return res.data?.locations || [];
    } catch (err) {
      return [];
    }
  },

  async saveLocation(loc: Omit<SavedLocation, 'id'>): Promise<SavedLocation | null> {
    try {
      const res = await apiClient.post('/patient/saved-locations', loc);
      return res.data?.location || null;
    } catch (err) {
      return null;
    }
  },
};
