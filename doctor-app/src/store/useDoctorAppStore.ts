import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appointment, DoctorClinicItem, DoctorLoadItem, DoctorTimingStatus, AvailabilityRequest } from '../types';
import { appointmentApi } from '../api/appointmentApi';
import { queueApi } from '../api/queueApi';
import { doctorApi } from '../api/doctorApi';
import { consultationApi } from '../api/consultationApi';
import { timeUtils } from '../utils/timeUtils';
import { useDoctorAuthStore } from './useDoctorAuthStore';

const DOCTOR_ACTIVE_CLINIC_KEY = '@medlink_doctor_active_clinic_id';

interface DoctorAppState {
  availableClinics: DoctorClinicItem[];
  clinics: DoctorClinicItem[]; // Alias
  allDemoClinics: DoctorClinicItem[];
  activeClinic: DoctorClinicItem | null;
  activeClinicId: string | null;
  activeClinicName: string | null;
  isClinicSelected: boolean;

  appointments: Appointment[];
  liveQueue: Appointment[];
  upcomingAppointments: Appointment[];
  currentPatient: Appointment | null;
  nextPatient: Appointment | null;
  waitingCount: number;
  completedCount: number;
  totalToday: number;

  doctorTiming: {
    status: DoctorTimingStatus;
    operatingHours: string;
    currentTime: string;
    nextAppointmentTime: string | null;
    patientsWaiting: number;
  };

  doctorLoad: DoctorLoadItem[];
  availabilityRequests: AvailabilityRequest[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;

  // Shared Clinic Actions
  setActiveClinic: (clinic: DoctorClinicItem | { id: string; name?: string; address?: string }) => Promise<void>;
  selectClinic: (clinicId: string) => Promise<void>;
  clearActiveClinic: () => void;
  loadClinics: () => Promise<DoctorClinicItem[]>;
  fetchAuthorizedClinics: () => Promise<DoctorClinicItem[]>;

  // Clinical Dashboard Actions
  fetchDashboardData: () => Promise<void>;
  fetchTodayAppointments: () => Promise<void>;
  fetchUpcomingAppointments: () => Promise<void>;
  fetchLiveQueue: () => Promise<void>;
  fetchDoctorLoad: () => Promise<void>;
  fetchAvailabilityRequests: () => Promise<void>;
  approveAvailabilityRequest: (requestId: string, notes?: string) => Promise<boolean>;
  rejectAvailabilityRequest: (requestId: string, reason?: string) => Promise<boolean>;
  startConsultation: (appointmentId: string) => Promise<boolean>;
  submitConsultation: (payload: any) => Promise<boolean>;
  reportDelay: (delayMinutes: number, reason?: string) => Promise<boolean>;

  // Real-Time Socket Updates
  handleSocketQueueUpdated: (data: any) => void;
  handleSocketAppointmentStatus: (data: any) => void;
  handleSocketAppointmentCreated: (appointment: Appointment) => void;
  handleSocketAvailabilityRequestNew: (data: any) => void;
  handleSocketAvailabilityRequestApproved: (data: any) => void;
  handleSocketAvailabilityRequestRejected: (data: any) => void;
}

const computeNextAppointmentTime = (
  appointments: Appointment[],
  liveQueue: Appointment[],
  nextPatient: Appointment | null
): string | null => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parseTimeToMinutes = (t: string | undefined): number => {
    if (!t) return -1;
    const match = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
    if (!match) return -1;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // 1. If nextPatient has a scheduled slot time (not generic walk-in string)
  if (nextPatient?.time && nextPatient.time !== 'Walk-in') {
    return nextPatient.time;
  }

  // 2. Select earliest valid scheduled appointment for today (excluding CANCELLED, COMPLETED, NO_SHOW)
  const validScheduled = (appointments || []).filter((a) => {
    const s = (a.status || '').toUpperCase().replace(/[\s_-]+/g, '_');
    return !['CANCELLED', 'COMPLETED', 'NO_SHOW'].includes(s);
  });

  const parsed = validScheduled
    .map((a) => ({
      time: a.time,
      mins: parseTimeToMinutes(a.time),
    }))
    .filter((x) => x.mins >= 0)
    .sort((a, b) => a.mins - b.mins);

  if (parsed.length > 0) {
    const upcoming = parsed.find((x) => x.mins >= currentMinutes);
    return upcoming ? upcoming.time : parsed[0].time;
  }

  // 3. If there is a next patient in queue (walk-in)
  if (nextPatient) {
    return nextPatient.time || 'Immediate (Walk-in)';
  }

  return null;
};

export const useDoctorAppStore = create<DoctorAppState>((set, get) => ({
  availableClinics: [],
  clinics: [],
  allDemoClinics: [],
  activeClinic: null,
  activeClinicId: null,
  activeClinicName: null,
  isClinicSelected: false,

  appointments: [],
  liveQueue: [],
  upcomingAppointments: [],
  currentPatient: null,
  nextPatient: null,
  waitingCount: 0,
  completedCount: 0,
  totalToday: 0,

  doctorTiming: {
    status: 'Available',
    operatingHours: '09:00 AM – 05:00 PM',
    currentTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    nextAppointmentTime: null,
    patientsWaiting: 0,
  },

  doctorLoad: [],
  availabilityRequests: [],
  isLoading: false,
  isRefreshing: false,
  error: null,

  fetchAuthorizedClinics: async () => {
    try {
      set({ isLoading: true, error: null });
      const res = await doctorApi.getDoctorClinics();
      const list = res.clinics || [];
      const allDemo = res.allDemoClinics || list;
      set({ availableClinics: list, clinics: list, allDemoClinics: allDemo });

      // Check if there is a saved valid activeClinicId in storage
      const currentActive = get().activeClinic;
      if (!currentActive) {
        try {
          const savedClinicId = await AsyncStorage.getItem(DOCTOR_ACTIVE_CLINIC_KEY);
          if (savedClinicId) {
            const matched = list.find((c) => c.id === savedClinicId);
            if (matched) {
              set({
                activeClinic: matched,
                activeClinicId: matched.id,
                activeClinicName: matched.name,
                isClinicSelected: true,
              });
            } else {
              // Stale or unauthorized saved clinic -> clear it
              await AsyncStorage.removeItem(DOCTOR_ACTIVE_CLINIC_KEY);
            }
          }
        } catch {
          // ignore storage read issues
        }
      }
      return list;
    } catch (e: any) {
      console.warn('Failed to fetch doctor clinics:', e.message);
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  loadClinics: async () => {
    return get().fetchAuthorizedClinics();
  },

  setActiveClinic: async (clinic) => {
    let list = get().availableClinics;
    let allDemo = get().allDemoClinics;
    if (list.length === 0) {
      list = await get().fetchAuthorizedClinics();
      allDemo = get().allDemoClinics;
    }

    // Verify doctor is actually assigned to this clinic
    const foundAssigned = list.find((c) => c.id === clinic.id || c.name.toLowerCase() === (clinic.name || '').toLowerCase());
    const demoItem = allDemo.find((c) => c.id === clinic.id);

    if (!foundAssigned && demoItem && !demoItem.isAssigned) {
      console.warn(`Doctor is not authorized for clinic: ${clinic.name}`);
      throw new Error(`Doctor is not assigned to ${clinic.name}. Please select an authorized facility.`);
    }

    const targetClinic: DoctorClinicItem = foundAssigned || demoItem || {
      id: clinic.id,
      name: clinic.name || 'Clinical Facility',
      address: (clinic as any).address || 'Chennai, Tamil Nadu',
      area: 'Chennai',
      city: 'Chennai',
      latitude: 13.0338,
      longitude: 80.2677,
      todayHours: '09:00 AM – 05:00 PM',
      status: 'Running on time',
      waitingCount: 0,
      totalToday: 0,
      isPrimary: false,
      isAssigned: true,
    };

    // Clean previous clinic state to prevent cross-clinic leakage
    set({
      activeClinic: targetClinic,
      activeClinicId: targetClinic.id,
      activeClinicName: targetClinic.name,
      isClinicSelected: true,
      appointments: [],
      liveQueue: [],
      upcomingAppointments: [],
      doctorLoad: [],
      currentPatient: null,
      nextPatient: null,
      waitingCount: 0,
      completedCount: 0,
      totalToday: 0,
    });

    try {
      await AsyncStorage.setItem(DOCTOR_ACTIVE_CLINIC_KEY, targetClinic.id);
    } catch {}

    await get().fetchDashboardData();
  },

  selectClinic: async (clinicId: string) => {
    let list = get().availableClinics;
    if (list.length === 0) {
      list = await get().fetchAuthorizedClinics();
    }

    const selected = list.find((c) => c.id === clinicId);
    if (selected) {
      await get().setActiveClinic(selected);
    }
  },

  clearActiveClinic: () => {
    try {
      AsyncStorage.removeItem(DOCTOR_ACTIVE_CLINIC_KEY).catch(() => {});
    } catch {}
    set({
      activeClinic: null,
      activeClinicId: null,
      activeClinicName: null,
      isClinicSelected: false,
      appointments: [],
      liveQueue: [],
      upcomingAppointments: [],
      doctorLoad: [],
      currentPatient: null,
      nextPatient: null,
      waitingCount: 0,
      completedCount: 0,
      totalToday: 0,
    });
  },

  fetchDashboardData: async () => {
    try {
      set({ isLoading: true, error: null });
      await Promise.all([
        get().fetchTodayAppointments(),
        get().fetchUpcomingAppointments(),
        get().fetchLiveQueue(),
        get().fetchDoctorLoad(),
        get().fetchAvailabilityRequests(),
      ]);
    } catch (e: any) {
      set({ error: e.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTodayAppointments: async () => {
    try {
      const { activeClinicId, liveQueue, nextPatient } = get();
      if (!activeClinicId) return;
      const res = await appointmentApi.getTodayAppointments(activeClinicId);
      const rawList = res.appointments || [];
      const seenIds = new Set<string>();
      const list = rawList.filter((a: any) => {
        if (!a?.id) return true;
        if (seenIds.has(a.id)) return false;
        seenIds.add(a.id);
        return true;
      });
      const nextApt = computeNextAppointmentTime(list, liveQueue, nextPatient);
      set((state) => ({
        appointments: list,
        doctorTiming: {
          ...state.doctorTiming,
          nextAppointmentTime: nextApt,
        },
      }));
    } catch (e: any) {
      console.warn('Failed to fetch today appointments:', e.message);
    }
  },

  fetchUpcomingAppointments: async () => {
    try {
      const { activeClinicId } = get();
      if (!activeClinicId) return;
      const res = await appointmentApi.getUpcomingAppointments(activeClinicId);
      const rawList = res.appointments || [];
      const seenIds = new Set<string>();
      const list = rawList.filter((a: any) => {
        if (!a?.id) return true;
        if (seenIds.has(a.id)) return false;
        seenIds.add(a.id);
        return true;
      });
      set({ upcomingAppointments: list });
    } catch (e: any) {
      console.warn('Failed to fetch upcoming appointments:', e.message);
    }
  },

  fetchLiveQueue: async () => {
    try {
      const { activeClinicId, activeClinic, appointments } = get();
      if (!activeClinicId) return;
      const res = await queueApi.getLiveQueue(activeClinicId);

      const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const rawQueue = res.queue || [];
      const seenQ = new Set<string>();
      const queueList = rawQueue.filter((q: any) => {
        const key = q.queueId || q.id || q.appointmentId || q.walkInId;
        if (!key) return true;
        if (seenQ.has(key)) return false;
        seenQ.add(key);
        return true;
      });
      const nextApt = computeNextAppointmentTime(appointments, queueList, res.nextPatient);

      let timingStatus: DoctorTimingStatus = 'Available';
      if (res.currentPatient) {
        timingStatus = 'In Session';
      } else if (activeClinic?.status?.includes('Starts in')) {
        timingStatus = 'Not Started';
      } else if (activeClinic?.status === 'Completed') {
        timingStatus = 'Clinic Closed';
      } else if (activeClinic?.status === 'On Break') {
        timingStatus = 'On Break';
      } else if (activeClinic?.status === 'Running Late') {
        timingStatus = 'Running Late';
      } else if (activeClinic?.status === 'Offline') {
        timingStatus = 'Offline';
      }

      set({
        currentPatient: res.currentPatient,
        nextPatient: res.nextPatient,
        waitingCount: res.waitingCount,
        completedCount: res.completedCount,
        totalToday: res.totalToday,
        liveQueue: queueList,
        doctorTiming: {
          status: timingStatus,
          operatingHours: activeClinic?.todayHours || '09:00 AM – 05:00 PM',
          currentTime: nowStr,
          nextAppointmentTime: nextApt,
          patientsWaiting: res.waitingCount,
        },
      });
    } catch (e: any) {
      console.warn('Failed to fetch live queue:', e.message);
    }
  },

  fetchDoctorLoad: async () => {
    try {
      const { activeClinicId } = get();
      if (!activeClinicId) return;
      const res = await doctorApi.getDoctorLoad(activeClinicId);
      set({ doctorLoad: res.doctorLoad || [] });
    } catch (e: any) {
      console.warn('Failed to fetch doctor load:', e.message);
    }
  },

  startConsultation: async (appointmentId: string) => {
    try {
      set({ isLoading: true });
      await queueApi.startConsultation(appointmentId);
      await get().fetchDashboardData();
      return true;
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      return false;
    }
  },

  submitConsultation: async (payload: any) => {
    try {
      set({ isLoading: true });
      await consultationApi.createConsultation(payload);
      await get().fetchDashboardData();
      return true;
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      return false;
    }
  },

  reportDelay: async (delayMinutes: number, reason?: string) => {
    try {
      await doctorApi.reportDelay(delayMinutes, reason);
      await get().fetchDashboardData();
      return true;
    } catch (e: any) {
      set({ error: e.message });
      return false;
    }
  },

  handleSocketQueueUpdated: (data: any) => {
    get().fetchLiveQueue();
    get().fetchTodayAppointments();
  },

  handleSocketAppointmentStatus: (data: any) => {
    const { appointmentId, status, appointmentStatus } = data;
    const effectiveStatus = status || (appointmentStatus === 'CANCELLED' ? 'Cancelled' : appointmentStatus);
    const currentApts = get().appointments;
    const updatedApts = currentApts.map((a) => (a.id === appointmentId ? { ...a, status: effectiveStatus } : a));
    set({ appointments: updatedApts });
    get().fetchLiveQueue();
    get().fetchTodayAppointments();
  },

  handleSocketAppointmentCreated: (appointment: Appointment) => {
    const { activeClinicId } = get();
    if (appointment.clinic_id === activeClinicId) {
      const currentApts = get().appointments;
      if (!currentApts.some((a) => a.id === appointment.id)) {
        set({
          appointments: [appointment, ...currentApts],
          totalToday: get().totalToday + 1,
        });
      }
      get().fetchLiveQueue();
    }
  },

  fetchAvailabilityRequests: async () => {
    try {
      const doctorId = useDoctorAuthStore.getState().doctor?.id;
      const res = await doctorApi.getAvailabilityRequests(doctorId);
      const requests = res.requests || [];
      set({ availabilityRequests: requests });
    } catch (e: any) {
      console.warn('Failed to fetch availability requests:', e.message);
    }
  },

  approveAvailabilityRequest: async (requestId: string, notes?: string) => {
    try {
      set({ isLoading: true });
      await doctorApi.approveAvailabilityRequest(requestId, notes);
      await get().fetchAvailabilityRequests();
      await get().fetchTodayAppointments();
      return true;
    } catch (e: any) {
      set({ error: e.message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  rejectAvailabilityRequest: async (requestId: string, reason?: string) => {
    try {
      set({ isLoading: true });
      await doctorApi.rejectAvailabilityRequest(requestId, reason);
      await get().fetchAvailabilityRequests();
      return true;
    } catch (e: any) {
      set({ error: e.message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  handleSocketAvailabilityRequestNew: () => {
    get().fetchAvailabilityRequests();
  },

  handleSocketAvailabilityRequestApproved: () => {
    get().fetchAvailabilityRequests();
    get().fetchTodayAppointments();
  },

  handleSocketAvailabilityRequestRejected: () => {
    get().fetchAvailabilityRequests();
  },
}));
