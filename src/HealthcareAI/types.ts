export type AppRole = 'patient' | 'doctor' | 'clinic' | 'ai-inspector';

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  phone: string;
  email: string;
  bloodGroup: string;
  location: string;
  city: string;
  emergencyContact: string;
  medicalHistory: string[];
  allergies: string[];
  activePrescriptionsCount: number;
  riskScore: 'Low' | 'Moderate' | 'High';
  avatar: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  languages: string[];
  rating: number;
  reviewCount: number;
  consultationFee: number;
  patientsServed: number;
  clinicIds: string[];
  currentClinicId: string;
  isAvailable: boolean;
  avatar: string;
  workingHours: string;
  vacationMode: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  city: string;
  address: string;
  lat: number;
  lng: number;
  distanceKm: number;
  travelTimeMin: number;
  rating: number;
  reviewCount: number;
  facilities: string[];
  departments: string[];
  doctorIds: string[];
  image: string;
  openHours: string;
  isOpen: boolean;
  liveQueueLength: number;
  avgWaitTimeMin: number;
  consultationFeeRange: string;
  emergencyAvailable: boolean;
  insuranceAccepted: boolean;
  aiRecommended?: boolean;
  aiMatchScore?: number;
}

export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  specialization: string;
  clinicId: string;
  clinicName: string;
  date: string;
  timeSlot: string;
  tokenNumber: number;
  status: 'Confirmed' | 'In-Queue' | 'Completed' | 'Cancelled' | 'Priority' | 'Emergency';
  priorityLevel: 'Standard' | 'Urgent' | 'Emergency';
  symptoms: string[];
  notes?: string;
  fee: number;
  isAiRecommendedSlot?: boolean;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  clinicName: string;
  date: string;
  diagnosis: string;
  medicines: {
    name: string;
    dosage: string;
    duration: string;
    instructions: string;
  }[];
  labTestsRecommended?: string[];
  followUpDate?: string;
}

export interface MedicalRecord {
  id: string;
  patientId: string;
  patientName: string;
  type: 'Lab Report' | 'Consultation' | 'Digital Prescription' | 'Medical Image' | 'Vaccination';
  title: string;
  doctorName: string;
  clinicName: string;
  date: string;
  fileSize: string;
  downloadUrl: string;
  summary: string;
}

export interface PharmacyItem {
  id: string;
  name: string;
  category: string;
  batchNumber: string;
  stockQuantity: number;
  minThreshold: number;
  expiryDate: string;
  pricePerUnit: number;
  aiDemandForecast: 'High' | 'Normal' | 'Critical';
  aiPredictedRestockDays: number;
  manufacturer: string;
}

export interface NotificationItem {
  id: string;
  type: 'appointment_reminder' | 'followup_reminder' | 'earlier_slot' | 'emergency_delay' | 'medicine_reminder' | 'queue_update';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionableSlot?: string;
}

export interface Review {
  id: string;
  clinicId: string;
  patientName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface QueueItem {
  tokenNumber: number;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName: string;
  estimatedWaitMin: number;
  status: 'Serving' | 'Waiting' | 'Completed' | 'Priority' | 'Emergency';
  arrivalTime: string;
  priority: 'Standard' | 'Priority' | 'Emergency';
}

export interface EmergencyCase {
  id: string;
  patientName: string;
  age: number;
  condition: string;
  priority: 'Critical' | 'Severe';
  assignedDoctorId: string;
  assignedDoctorName: string;
  clinicName: string;
  etaMinutes: number;
  status: 'En Route' | 'Triage' | 'Attended';
}

export interface SymptomAnalysisResult {
  symptoms: string[];
  recommendedDepartment: string;
  possibleDoctorId: string;
  possibleDoctorName: string;
  priorityLevel: 'Standard' | 'Urgent' | 'Emergency';
  isEmergencyDetected: boolean;
  estimatedConsultationTimeMin: number;
  recommendedClinicId: string;
  confidenceScore: number;
  explanation: string;
}
