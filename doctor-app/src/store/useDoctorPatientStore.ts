import { create } from 'zustand';
import { Patient, Appointment, Prescription, MedicalFile, Consultation } from '../types';
import { patientApi, PatientDetailResponse } from '../api/patientApi';

interface DoctorPatientState {
  patients: Patient[];
  selectedPatientDetail: PatientDetailResponse | null;
  isLoading: boolean;
  searchQuery: string;
  error: string | null;

  // Actions
  fetchPatients: (query?: string) => Promise<void>;
  fetchPatientDetail: (patientId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  clearSelectedPatient: () => void;
}

export const useDoctorPatientStore = create<DoctorPatientState>((set, get) => ({
  patients: [],
  selectedPatientDetail: null,
  isLoading: false,
  searchQuery: '',
  error: null,

  fetchPatients: async (query?: string) => {
    try {
      set({ isLoading: true, error: null });
      const res = await patientApi.getDoctorPatients(query);
      set({ patients: res.patients || [], isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  fetchPatientDetail: async (patientId: string) => {
    try {
      set({ isLoading: true, error: null });
      const res = await patientApi.getPatientDetail(patientId);
      set({ selectedPatientDetail: res, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
    }
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
    get().fetchPatients(query);
  },

  clearSelectedPatient: () => set({ selectedPatientDetail: null }),
}));
