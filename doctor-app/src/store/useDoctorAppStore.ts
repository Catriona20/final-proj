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
  handleSocketAppointmentCancelled: (data: any) => void;
  handleSocketAvailabilityRequestNew: (data: any) => void;
  handleSocketAvailabilityRequestApproved: (data: any) => void;
  handleSocketAvailabilityRequestRejected: (data: any) => void;
  handleSocketStatusUpdated: (data: any) => void;
  handleSocketDemoReset: () => void;
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
      const cur = get().currentPatient;
      if (cur && (cur.id === payload.appointmentId || (cur as any).appointment_id === payload.appointmentId)) {
        set({ currentPatient: null });
      }
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
    const isCompleted = data && (['Completed', 'COMPLETED'].includes(data.status) || ['Completed', 'COMPLETED'].includes(data.appointmentStatus));
    if (isCompleted && data.appointmentId) {
      const cur = get().currentPatient;
      if (cur && (cur.id === data.appointmentId || (cur as any).appointment_id === data.appointmentId)) {
        set({ currentPatient: null });
      }
    }
    get().fetchLiveQueue();
    get().fetchTodayAppointments();
  },

  handleSocketAppointmentStatus: (data: any) => {
    const { appointmentId, status, appointmentStatus } = data;
    const effectiveStatus = status || (appointmentStatus === 'CANCELLED' ? 'Cancelled' : appointmentStatus);
    const isCompleted = ['Completed', 'COMPLETED'].includes(effectiveStatus);

    if (isCompleted) {
      const cur = get().currentPatient;
      if (cur && (cur.id === appointmentId || (cur as any).appointment_id === appointmentId)) {
        set({ currentPatient: null });
      }
    }

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

  handleSocketAppointmentCancelled: (data: any) => {
    const { appointmentId, doctorId, clinicId } = data || {};
    if (!appointmentId) return;

    const { doctor } = useDoctorAuthStore.getState();
    const { activeClinicId, liveQueue, appointments, nextPatient } = get();

    // Multi-clinic and doctor isolation check
    if (activeClinicId && clinicId && activeClinicId !== clinicId) {
      return;
    }
    if (doctor?.id && doctorId && doctor.id !== doctorId) {
      return;
    }

    // 1. Evict cancelled appointment from liveQueue immediately
    const updatedQueue = liveQueue.filter(
      (q) => (q as any).appointmentId !== appointmentId && q.id !== appointmentId
    );

    // 2. Recalculate queue positions, patients ahead, and estimated wait for remaining patients
    const avgConsultDuration = 20;
    const reindexedQueue = updatedQueue.map((q, idx) => {
      const patientsAhead = Math.max(0, idx);
      const estMinutes = patientsAhead * avgConsultDuration;
      return {
        ...q,
        queuePosition: idx + 1,
        queue_number: idx + 1,
        patientsAhead,
        patients_ahead: patientsAhead,
        estimatedWait: estMinutes === 0 ? 'Next' : `~${estMinutes}m`,
        estimated_wait: estMinutes === 0 ? 'Next' : `~${estMinutes}m`,
      };
    });

    // 3. Promote next patient if the cancelled patient was next
    let newNextPatient = nextPatient;
    if (nextPatient && ((nextPatient as any).appointmentId === appointmentId || nextPatient.id === appointmentId)) {
      newNextPatient = reindexedQueue.find(
        (q) => (q.status as string) === 'WAITING' || q.status === 'Checked In' || q.status === 'Waiting'
      ) || null;
    }

    // 4. Update appointment status in appointments list
    const updatedAppointments = appointments.map((a) =>
      a.id === appointmentId
        ? { ...a, status: 'Cancelled' as const, appointmentStatus: 'CANCELLED' }
        : a
    );

    // 5. Recalculate waiting count
    const waitingCount = reindexedQueue.filter(
      (q) => (q.status as string) === 'WAITING' || q.status === 'Waiting' || q.status === 'Checked In' || (q.status as string) === 'CHECKED_IN'
    ).length;

    // 6. Update doctorTiming next appointment time
    const nextApt = computeNextAppointmentTime(updatedAppointments, reindexedQueue, newNextPatient);

    set((state) => ({
      liveQueue: reindexedQueue,
      nextPatient: newNextPatient,
      appointments: updatedAppointments,
      waitingCount,
      doctorTiming: {
        ...state.doctorTiming,
        nextAppointmentTime: nextApt,
        patientsWaiting: waitingCount,
      },
    }));

    // Authoritative backend sync
    get().fetchLiveQueue();
    get().fetchTodayAppointments();
  },

  fetchAvailabilityRequests: async () => {
    try {
      const doctorId = useDoctorAuthStore.getState().doctor?.id;
      const res = await doctorApi.getAvailabilityRequests(doctorId);
      const rawRequests = res.requests || [];
      const requests: AvailabilityRequest[] = rawRequests.map((r: any) => ({
        ...r,
        date: r.date || r.requested_date || r.requestedDate || '',
        requested_date: r.date || r.requested_date || r.requestedDate || '',
        clinic_id: r.clinic_id || r.clinicId,
        clinic_name: r.clinic_name || r.clinicName,
        doctor_id: r.doctor_id || r.doctorId,
        doctor_name: r.doctor_name || r.doctorName,
        start_time: r.start_time || r.startTime,
        end_time: r.end_time || r.endTime,
      }));
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

  handleSocketAvailabilityRequestNew: (_data?: any) => {
    get().fetchAvailabilityRequests();
  },

  handleSocketAvailabilityRequestApproved: (data?: any) => {
    const targetId = data?.id || data?.requestId || data?.request_id;
    if (targetId) {
      const canonicalDate = data.date || data.requested_date || data.requestedDate || '';
      set((state) => ({
        availabilityRequests: state.availabilityRequests.map((r) =>
          r.id === targetId
            ? {
                ...r,
                ...data,
                id: r.id,
                date: canonicalDate || r.date,
                status: 'APPROVED',
              }
            : r
        ),
      }));
    }
    get().fetchAvailabilityRequests();
    get().fetchTodayAppointments();
  },

  handleSocketAvailabilityRequestRejected: (data?: any) => {
    const targetId = data?.id || data?.requestId || data?.request_id;
    if (targetId) {
      set((state) => ({
        availabilityRequests: state.availabilityRequests.map((r) =>
          r.id === targetId
            ? {
                ...r,
                ...data,
                id: r.id,
                status: 'REJECTED',
              }
            : r
        ),
      }));
    }
    get().fetchAvailabilityRequests();
  },

  handleSocketDemoReset: () => {
    set({
      availabilityRequests: [],
      appointments: [],
      liveQueue: [],
      upcomingAppointments: [],
      currentPatient: null,
      nextPatient: null,
      waitingCount: 0,
      completedCount: 0,
      totalToday: 0,
    });
    get().fetchAvailabilityRequests();
    get().fetchTodayAppointments();
    get().fetchLiveQueue();
  },

  handleSocketStatusUpdated: (data?: any) => {
    if (!data?.doctorId) return;
    const authDoctor = useDoctorAuthStore.getState().doctor;
    if (authDoctor && authDoctor.id === data.doctorId) {
      useDoctorAuthStore.setState({
        doctor: {
          ...authDoctor,
          status: data.status,
          live_status: data.status,
          liveStatus: data.status,
          is_available_today: data.status === 'AVAILABLE',
        },
      });

      const { activeClinicId, activeClinic, doctorTiming } = get();
      if (!data.clinicId || data.clinicId === activeClinicId) {
        let newTimingStatus: DoctorTimingStatus = 'Available';
        if (data.status === 'BUSY') {
          newTimingStatus = 'Busy';
        } else if (data.status === 'IN_SESSION') {
          newTimingStatus = 'In Session';
        } else if (data.status === 'OFFLINE') {
          newTimingStatus = 'Offline';
        } else if (data.status === 'ON_BREAK') {
          newTimingStatus = 'On Break';
        } else if (data.status === 'RUNNING_LATE') {
          newTimingStatus = 'Running Late';
        } else {
          newTimingStatus = 'Available';
        }

        set({
          doctorTiming: {
            ...doctorTiming,
            status: newTimingStatus,
          },
          ...(activeClinic
            ? {
                activeClinic: {
                  ...activeClinic,
                  status: data.status === 'AVAILABLE' ? 'On Schedule' : data.status === 'BUSY' ? 'Busy' : 'Offline',
                },
              }
            : {}),
        });
      }
    }
  },
}));
