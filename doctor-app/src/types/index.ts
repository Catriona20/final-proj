export interface LocationCoords {
  latitude: number;
  longitude: number;
}

export type DoctorVerificationStatus =
  | 'PENDING'
  | 'DOCUMENTS_SUBMITTED'
  | 'UNDER_REVIEW'
  | 'VERIFIED'
  | 'ACTIVE'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'EXPIRED';

export type DoctorAvailabilityStatus =
  | 'AVAILABLE'
  | 'BUSY'
  | 'IN_SESSION'
  | 'ON_BREAK'
  | 'OFFLINE'
  | 'RUNNING_LATE';

export type DoctorTimingStatus =
  | 'Not Started'
  | 'Available'
  | 'Busy'
  | 'In Session'
  | 'On Break'
  | 'Running Late'
  | 'Offline'
  | 'Clinic Closed';

export type QueuePriority = 'NORMAL' | 'PRIORITY' | 'EMERGENCY';

export interface DoctorVerificationDocument {
  id: string;
  doctor_id: string;
  document_type: 'medical_reg_cert' | 'degree_cert' | 'gov_id' | 'additional_cert';
  document_name: string;
  uri: string;
  status: 'PENDING' | 'UNDER_REVIEW' | 'VERIFIED' | 'REJECTED';
  rejection_reason?: string;
  uploaded_at: string;
  verified_at?: string;
  verifier_id?: string;
}

export interface VerificationAuditItem {
  id: string;
  date: string;
  reviewer: string;
  action: string;
  details: string;
  statusTransition: string;
}

export interface Procedure {
  id: string;
  name: string;
  department: string;
  description?: string;
  is_verified?: boolean;
}

export interface DoctorProcedure {
  id: string;
  doctor_id: string;
  procedure_id: string;
  procedure_name: string;
  is_verified: boolean;
  created_at?: string;
}

export interface DoctorClinicItem {
  id: string;
  name: string;
  address: string;
  area: string;
  city: string;
  latitude: number;
  longitude: number;
  todayHours: string;
  status: string;
  waitingCount: number;
  totalToday: number;
  isPrimary: boolean;
  isAssigned?: boolean;
  category?: string;
  specialization?: string;
  department?: string;
  departments?: string[];
  phone?: string;
  rating?: number;
  reviews_count?: number;
  source?: string;
  isConnected?: boolean;
}

export interface DoctorLoadItem {
  doctorId: string;
  doctorName: string;
  specialization: string;
  avatar?: string;
  status: string;
  patientsWaiting: number;
  currentLoad: 'Low' | 'Moderate' | 'High';
  isAvailableToday: boolean;
}

export interface ScheduleDay {
  start: string;
  end: string;
  slot_duration: number;
  is_off: boolean;
}

export interface ScheduleException {
  id: string;
  doctor_id: string;
  date: string;
  reason: string;
  is_full_day: boolean;
  created_at?: string;
}

export interface Doctor {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  specialization: string;
  primary_specialization?: string;
  secondary_specialization?: string;
  qualification: string;
  university?: string;
  grad_year?: number;
  dob?: string;
  gender?: string;
  rating: number;
  reviews_count: number;
  experience_years: number;
  avatar: string;
  clinic_id: string;
  clinic_name: string;
  available_days: string[];
  wait_time: string;
  is_available_today: boolean;
  status: DoctorAvailabilityStatus;
  liveStatus?: DoctorAvailabilityStatus;
  live_status?: DoctorAvailabilityStatus;
  languages: string[];
  consultation_fee: string;
  is_preferred?: boolean;
  about?: string;
  is_verified: boolean;
  verification_status: DoctorVerificationStatus;
  verification_rejection_reason?: string;
  verified_at?: string;
  verifier_id?: string;
  registration_number?: string;
  registration_authority?: string;
  consultation_duration: string;
  clinic_affiliations?: string[];
  procedures?: string[];
  treatmentsProvided?: string[];
  proceduresList?: DoctorProcedure[];
  verificationDocuments?: DoctorVerificationDocument[];
  schedule?: Record<string, ScheduleDay>;
  scheduleExceptions?: ScheduleException[];
}

export type AppointmentStatus =
  | 'Booked'
  | 'Arrived'
  | 'Confirmed'
  | 'Checked In'
  | 'Waiting'
  | 'Almost Your Turn'
  | 'Next'
  | 'In Consultation'
  | 'Completed'
  | 'Delayed'
  | 'Cancelled'
  | 'CANCELLED'
  | 'No-show'
  | 'NO_SHOW';

export interface Appointment {
  id: string;
  patient_id: string;
  patient_name?: string;
  clinic_id: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialization: string;
  doctor_avatar?: string;
  clinic_name: string;
  clinic_address: string;
  department: string;
  date: string;
  time: string;
  duration: string;
  status: AppointmentStatus;
  queue_number: number;
  token_number: string;
  queue_position: number;
  patients_ahead: number;
  estimated_wait: string;
  travel_time?: string;
  distance?: string;
  reason: string;
  custom_reason_text?: string;
  treatmentRequirement?: string;
  recommendedSpecialty?: string;
  symptoms: string[];
  consultation_fee: string;
  notes?: string;
  prescription_available: boolean;
  priority?: QueuePriority;
  created_at?: string;
  updated_at?: string;
}

export interface Patient {
  id: string;
  name: string;
  email?: string;
  phone: string;
  blood_group?: string;
  age?: number;
  gender?: string;
  avatar?: string;
  address?: string;
  emergency_contact?: string;
  lastVisitDate?: string;
  lastReason?: string;
  lastAppointmentId?: string;
  lastStatus?: string;
}

export interface PrescriptionMedicine {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
}

export interface Prescription {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  doctor_name: string;
  doctor_specialization: string;
  doctor_registration_number?: string;
  clinic_id: string;
  clinic_name: string;
  clinic_address: string;
  date: string;
  diagnosis: string;
  clinical_notes?: string;
  follow_up_date?: string;
  medicines: PrescriptionMedicine[];
  created_at?: string;
}

export interface Consultation {
  id: string;
  appointment_id: string;
  patient_id: string;
  doctor_id: string;
  clinic_id: string;
  clinical_notes?: string;
  symptoms: string[];
  assessment?: string;
  diagnosis: string;
  follow_up_date?: string;
  follow_up_reason?: string;
  vitals?: {
    bp?: string;
    pulse?: string;
    temperature?: string;
    weight?: string;
    spO2?: string;
  };
  created_at?: string;
}

export interface MedicalFile {
  id: string;
  patient_id: string;
  appointment_id?: string;
  file_name: string;
  file_type: string;
  file_size?: string;
  uri?: string;
  upload_date: string;
  test_name: string;
  category: string;
  clinic_performed: string;
  test_date: string;
  reason_for_test?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  doctor_id?: string;
  doctor_name?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  ip_address?: string;
  timestamp: string;
}

export interface DiscoveredClinic {
  id: string;
  name: string;
  address: string;
  area?: string;
  city?: string;
  latitude: number;
  longitude: number;
  department?: string;
  rating?: number;
  reviews_count?: number;
  phone?: string;
  isOpen?: boolean;
  distance?: string;
  travelTime?: string;
  isDoctorClinic?: boolean;
  source?: 'platform' | 'geoapify' | 'osm';
}

export interface AvailabilityRequest {
  id: string;
  clinic_id: string;
  clinic_name: string;
  clinic_address?: string;
  doctor_id: string;
  doctor_name: string;
  specialty: string;
  date: string;
  requested_date?: string;
  start_time: string;
  end_time: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  notes?: string;
  requested_by?: string;
  created_at?: string;
  updated_at?: string;
}
