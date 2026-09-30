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
  const liveStatus = (d.liveStatus || d.live_status || d.status || 'OFFLINE').toUpperCase();
  const isAvailableToday = d.isAvailableToday ?? d.is_available_today ?? false;
  // Use the computed `status` from backend directly. Do NOT derive from liveStatus alone,
  // because liveStatus comes from DoctorClinicAssignmentModel while `status` (finalStatus)
  // already incorporates the approved-schedule check from GET /api/doctors.
  const status = d.status || liveStatus;
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
    liveStatus,
    availabilityStatus: d.availabilityStatus || d.availability_status || (d.hasApprovedSchedule ? 'APPROVED' : 'NONE'),
    // Default hasApprovedSchedule to FALSE — if the backend doesn't provide it,
    // we must NOT assume the doctor has an approved schedule.
    hasApprovedSchedule: d.hasApprovedSchedule ?? d.has_approved_schedule ?? false,
    // isInsideSchedule is informational only — default to false
    isInsideSchedule: d.isInsideSchedule ?? d.is_inside_schedule ?? false,
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

  getGroupedTimeSlots(_doctorId: string, _date?: string): GroupedTimeSlots {
    return {
      morning: [],
      afternoon: [],
      evening: [],
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
