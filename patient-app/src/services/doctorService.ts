import { Doctor } from '../types';
import { apiClient } from './apiClient';
import { MOCK_DOCTORS } from '../data/mockData';
import { timeUtils } from '../utils/timeUtils';

export interface TimeSlot {
  time: string;
  status: 'Available' | 'Limited' | 'Unavailable' | 'Recommended';
  reasoning?: string;
}

export interface GroupedTimeSlots {
  morning: TimeSlot[];
  afternoon: TimeSlot[];
  evening: TimeSlot[];
}

export function normalizeDoctor(d: any): Doctor {
  if (!d) return d;
  const isVerified = d.isVerified ?? d.is_verified ?? (d.verification_status === 'VERIFIED');
  const isAvailableToday = d.isAvailableToday ?? d.is_available_today ?? (d.status === 'AVAILABLE');
  const status = d.status || (isAvailableToday ? 'AVAILABLE' : 'OFFLINE');
  return {
    ...d,
    id: d.id,
    name: d.name,
    specialization: d.specialization || d.primary_specialization || 'General Medicine',
    qualification: d.qualification || 'MBBS',
    rating: Number(d.rating) || 4.9,
    reviewsCount: Number(d.reviewsCount ?? d.reviews_count ?? 120),
    experienceYears: Number(d.experienceYears ?? d.experience_years ?? 8),
    avatar: d.avatar,
    clinicId: d.clinicId || d.clinic_id || '',
    clinicName: d.clinicName || d.clinic_name || '',
    availableDays: d.availableDays || d.available_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    waitTime: d.waitTime || d.wait_time || '15 min',
    isAvailableToday: Boolean(isAvailableToday),
    status,
    languages: d.languages || ['English', 'Tamil'],
    consultationFee: d.consultationFee || d.consultation_fee || '₹400',
    isPreferred: d.isPreferred ?? d.is_preferred ?? false,
    about: d.about || '',
    clinicAffiliations: d.clinicAffiliations || d.clinic_affiliations || [],
    isVerified,
    registrationNumber: d.registrationNumber || d.registration_number,
    registrationAuthority: d.registrationAuthority || d.registration_authority,
    consultationDuration: d.consultationDuration || d.consultation_duration || '25 min',
    previousVisitsCount: d.previousVisitsCount,
    lastVisitedDate: d.lastVisitedDate,
  };
}

export const doctorService = {
  async getDoctors(clinicId?: string): Promise<Doctor[]> {
    try {
      const params = clinicId ? { clinicId } : {};
      const res = await apiClient.get('/doctors', { params });
      const docs = res.data?.doctors || MOCK_DOCTORS;
      return docs.map(normalizeDoctor);
    } catch (err) {
      console.warn('Doctors API error, fallback to initial doctors:', err);
      return MOCK_DOCTORS.map(normalizeDoctor);
    }
  },

  async getDoctorById(id: string): Promise<Doctor | undefined> {
    try {
      const res = await apiClient.get(`/doctors/${id}`);
      return res.data?.doctor ? normalizeDoctor(res.data.doctor) : undefined;
    } catch (err) {
      const mock = MOCK_DOCTORS.find((d) => d.id === id);
      return mock ? normalizeDoctor(mock) : undefined;
    }
  },

  getGroupedTimeSlots(doctorId: string, date?: string): GroupedTimeSlots {
    const todayStr = timeUtils.getTodayDateString();
    const isToday =
      !date ||
      date === todayStr ||
      date.toLowerCase().includes('today') ||
      date.toLowerCase() === new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toLowerCase();

    const currentHour = new Date().getHours();
    const currentMinute = new Date().getMinutes();

    const isSlotPast = (slotTime: string) => {
      if (!isToday) return false;
      const isPM = slotTime.toUpperCase().includes('PM');
      const isAM = slotTime.toUpperCase().includes('AM');
      const parts = slotTime.replace(/[^\d:]/g, '').split(':');
      let hour = parseInt(parts[0], 10) || 0;
      const minute = parseInt(parts[1], 10) || 0;
      if (isPM && hour < 12) hour += 12;
      if (isAM && hour === 12) hour = 0;
      return hour < currentHour || (hour === currentHour && minute <= currentMinute);
    };

    const getStatus = (time: string, defaultStatus: 'Available' | 'Limited' | 'Recommended' = 'Available') => {
      if (isSlotPast(time)) return 'Unavailable';
      return defaultStatus;
    };

    return {
      morning: [
        { time: '09:00 AM', status: getStatus('09:00 AM', 'Available') },
        { time: '09:30 AM', status: getStatus('09:30 AM', 'Available') },
        { time: '10:00 AM', status: getStatus('10:00 AM', 'Available') },
        { time: '10:30 AM', status: getStatus('10:30 AM', 'Limited') },
        { time: '11:00 AM', status: getStatus('11:00 AM', 'Available') },
      ],
      afternoon: [
        { time: '02:00 PM', status: getStatus('02:00 PM', 'Available') },
        { time: '02:30 PM', status: getStatus('02:30 PM', 'Available') },
        { time: '03:00 PM', status: getStatus('03:00 PM', 'Limited') },
        { time: '03:30 PM', status: getStatus('03:30 PM', 'Available') },
        { time: '04:00 PM', status: getStatus('04:00 PM', 'Available') },
      ],
      evening: [
        { time: '05:30 PM', status: getStatus('05:30 PM', 'Available') },
        { time: '06:00 PM', status: getStatus('06:00 PM', 'Available') },
        { time: '06:30 PM', status: getStatus('06:30 PM', 'Recommended'), reasoning: 'Lowest estimated wait (~8 min)' },
        { time: '07:00 PM', status: getStatus('07:00 PM', 'Available') },
        { time: '07:30 PM', status: getStatus('07:30 PM', 'Limited') },
      ],
    };
  },

  async getAvailableSlots(doctorId: string, date: string, clinicId?: string): Promise<GroupedTimeSlots> {
    try {
      const clinicParam = clinicId ? `&clinicId=${encodeURIComponent(clinicId)}` : '';
      const res = await apiClient.get(`/doctors/${doctorId}/slots?date=${encodeURIComponent(date)}${clinicParam}`);
      if (res.data?.slots) {
        return res.data.slots;
      }
    } catch (err) {
      console.warn('Available slots API error:', err);
    }

    return {
      morning: [],
      afternoon: [],
      evening: [],
    };
  },

  async getPreviousDoctorForDepartment(departmentName: string, clinicId?: string): Promise<Doctor | null> {
    try {
      const url = `/doctors/continuity?department=${encodeURIComponent(departmentName)}${clinicId ? `&clinicId=${encodeURIComponent(clinicId)}` : ''}`;
      const res = await apiClient.get(url);
      return res.data?.previousDoctor ? normalizeDoctor(res.data.previousDoctor) : null;
    } catch (err) {
      return null;
    }
  },
};
