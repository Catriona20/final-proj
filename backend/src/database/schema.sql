-- Healthcare Marketplace Relational Schema (PostgreSQL)
-- Supports Patient App Functional Requirements

CREATE TABLE IF NOT EXISTS patients (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(50) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  blood_group VARCHAR(10) DEFAULT 'O+',
  age INTEGER DEFAULT 28,
  gender VARCHAR(20) DEFAULT 'Female',
  avatar TEXT,
  address TEXT,
  emergency_contact TEXT,
  preferred_specialization VARCHAR(100) DEFAULT 'General Medicine',
  preferred_doctor VARCHAR(255) DEFAULT 'Dr. Aris Thorne',
  notifications_enabled BOOLEAN DEFAULT true,
  theme_preference VARCHAR(20) DEFAULT 'system',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saved_locations (
  id VARCHAR(64) PRIMARY KEY,
  patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL, -- Home, Work, College, Other
  name VARCHAR(255) NOT NULL,
  locality VARCHAR(255) NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS departments (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  clinic_count INTEGER DEFAULT 0,
  doctor_count INTEGER DEFAULT 0,
  keywords TEXT[] DEFAULT '{}',
  popular_symptoms TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS clinics (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  rating NUMERIC(3, 2) DEFAULT 4.50,
  reviews_count INTEGER DEFAULT 0,
  image TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  doctors_count INTEGER DEFAULT 0,
  open_hours VARCHAR(100) DEFAULT '09:00 AM - 08:00 PM',
  phone VARCHAR(50) DEFAULT '+91 44 2811 0000',
  is_open BOOLEAN DEFAULT true,
  opens_at VARCHAR(100),
  is_popular BOOLEAN DEFAULT false,
  is_nearby BOOLEAN DEFAULT false,
  wait_time VARCHAR(50) DEFAULT '15 min wait',
  consultation_fee VARCHAR(50) DEFAULT '₹400',
  google_place_id VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinic_departments (
  id VARCHAR(64) PRIMARY KEY,
  clinic_id VARCHAR(64) NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  department_name VARCHAR(100) NOT NULL,
  is_available BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS doctors (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  password_hash VARCHAR(255),
  specialization VARCHAR(100) NOT NULL,
  qualification VARCHAR(255) NOT NULL,
  rating NUMERIC(3, 2) DEFAULT 4.80,
  reviews_count INTEGER DEFAULT 0,
  experience_years INTEGER NOT NULL,
  avatar TEXT NOT NULL,
  clinic_id VARCHAR(64) NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  clinic_name VARCHAR(255) NOT NULL,
  available_days TEXT[] DEFAULT '{}',
  wait_time VARCHAR(50) DEFAULT '10 min',
  is_available_today BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'AVAILABLE', -- AVAILABLE, BUSY, ON_BREAK, OFFLINE
  languages TEXT[] DEFAULT '{}',
  consultation_fee VARCHAR(50) DEFAULT '₹500',
  is_preferred BOOLEAN DEFAULT false,
  about TEXT,
  is_verified BOOLEAN DEFAULT true,
  verification_status VARCHAR(50) DEFAULT 'VERIFIED', -- REGISTERED, DOCUMENTS_SUBMITTED, UNDER_REVIEW, VERIFIED, ACTIVE, REJECTED, RESUBMISSION_REQUIRED
  verification_rejection_reason TEXT,
  verified_at TIMESTAMP WITH TIME ZONE,
  verifier_id VARCHAR(64),
  registration_number VARCHAR(100),
  registration_authority VARCHAR(255),
  primary_specialization VARCHAR(100),
  secondary_specialization VARCHAR(100),
  university VARCHAR(255),
  grad_year INTEGER,
  dob VARCHAR(50),
  gender VARCHAR(20),
  consultation_duration VARCHAR(50) DEFAULT '25 min',
  clinic_affiliations TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS procedures (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  department VARCHAR(100) NOT NULL,
  description TEXT,
  is_verified BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_procedures (
  id VARCHAR(64) PRIMARY KEY,
  doctor_id VARCHAR(64) NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  procedure_id VARCHAR(64) REFERENCES procedures(id) ON DELETE CASCADE,
  procedure_name VARCHAR(255) NOT NULL,
  is_verified BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_verification_documents (
  id VARCHAR(64) PRIMARY KEY,
  doctor_id VARCHAR(64) NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL, -- medical_reg_cert, degree_cert, gov_id, additional_cert
  document_name VARCHAR(255) NOT NULL,
  uri TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'UNDER_REVIEW', -- PENDING, UNDER_REVIEW, VERIFIED, REJECTED
  rejection_reason TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  verified_at TIMESTAMP WITH TIME ZONE,
  verifier_id VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS consultations (
  id VARCHAR(64) PRIMARY KEY,
  appointment_id VARCHAR(64) UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id VARCHAR(64) NOT NULL REFERENCES doctors(id),
  clinic_id VARCHAR(64) NOT NULL REFERENCES clinics(id),
  clinical_notes TEXT,
  symptoms TEXT[] DEFAULT '{}',
  assessment TEXT,
  diagnosis TEXT NOT NULL,
  follow_up_date VARCHAR(50),
  follow_up_reason TEXT,
  vitals JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  doctor_id VARCHAR(64) REFERENCES doctors(id) ON DELETE SET NULL,
  doctor_name VARCHAR(255),
  action VARCHAR(100) NOT NULL, -- LOGIN, VIEW_PATIENT_RECORD, START_CONSULTATION, CREATE_PRESCRIPTION, UPDATE_AVAILABILITY, REPORT_DELAY, SUBMIT_VERIFICATION
  entity_type VARCHAR(100) NOT NULL, -- PATIENT, APPOINTMENT, PRESCRIPTION, VERIFICATION, SCHEDULE
  entity_id VARCHAR(64),
  details TEXT,
  ip_address VARCHAR(50),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_schedule_exceptions (
  id VARCHAR(64) PRIMARY KEY,
  doctor_id VARCHAR(64) NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  date VARCHAR(50) NOT NULL,
  reason VARCHAR(255) NOT NULL,
  is_full_day BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS doctor_departments (
  id VARCHAR(64) PRIMARY KEY,
  doctor_id VARCHAR(64) NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  department_name VARCHAR(100) NOT NULL
);

CREATE TABLE IF NOT EXISTS doctor_availability (
  id VARCHAR(64) PRIMARY KEY,
  doctor_id VARCHAR(64) NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id VARCHAR(64) NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  day_of_week VARCHAR(20) NOT NULL, -- Monday, Tuesday, etc.
  start_time VARCHAR(10) NOT NULL, -- 09:00 AM
  end_time VARCHAR(10) NOT NULL, -- 05:00 PM
  slot_duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS appointments (
  id VARCHAR(64) PRIMARY KEY,
  patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  clinic_id VARCHAR(64) NOT NULL REFERENCES clinics(id),
  doctor_id VARCHAR(64) NOT NULL REFERENCES doctors(id),
  doctor_name VARCHAR(255) NOT NULL,
  doctor_specialization VARCHAR(100) NOT NULL,
  doctor_avatar TEXT NOT NULL,
  clinic_name VARCHAR(255) NOT NULL,
  clinic_address TEXT NOT NULL,
  department VARCHAR(100) NOT NULL,
  date VARCHAR(50) NOT NULL,
  time VARCHAR(50) NOT NULL,
  duration VARCHAR(50) DEFAULT '25 min',
  status VARCHAR(50) NOT NULL DEFAULT 'Waiting', -- Booked, Arrived, Confirmed, Checked In, Waiting, Almost Your Turn, Next, In Consultation, Completed, Delayed, Cancelled
  queue_number INTEGER DEFAULT 1,
  token_number VARCHAR(50) DEFAULT '#01',
  queue_position INTEGER DEFAULT 1,
  patients_ahead INTEGER DEFAULT 0,
  estimated_wait VARCHAR(50) DEFAULT '10 min',
  travel_time VARCHAR(50) DEFAULT '12 min',
  distance VARCHAR(50) DEFAULT '1.4 km',
  reason VARCHAR(255) DEFAULT 'General consultation',
  custom_reason_text TEXT,
  symptoms TEXT[] DEFAULT '{}',
  consultation_fee VARCHAR(50) DEFAULT '₹500',
  notes TEXT,
  prescription_available BOOLEAN DEFAULT false,
  earlier_slot_offered JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointment_queue (
  id VARCHAR(64) PRIMARY KEY,
  clinic_id VARCHAR(64) NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
  doctor_id VARCHAR(64) NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_id VARCHAR(64) NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  token_number VARCHAR(50) NOT NULL,
  queue_position INTEGER NOT NULL,
  patients_ahead INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'Waiting',
  estimated_wait_minutes INTEGER DEFAULT 15,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS appointment_status_history (
  id VARCHAR(64) PRIMARY KEY,
  appointment_id VARCHAR(64) NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  changed_by VARCHAR(50) DEFAULT 'system',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medical_files (
  id VARCHAR(64) PRIMARY KEY,
  patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  appointment_id VARCHAR(64) REFERENCES appointments(id) ON DELETE SET NULL,
  clinic_id VARCHAR(64) REFERENCES clinics(id) ON DELETE SET NULL,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_size VARCHAR(50),
  uri TEXT,
  upload_date VARCHAR(50) NOT NULL,
  test_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- Lab report, Scan, Prescription, Medical document, Test result, Other
  clinic_performed VARCHAR(255) NOT NULL,
  test_date VARCHAR(50) NOT NULL,
  reason_for_test TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescriptions (
  id VARCHAR(64) PRIMARY KEY,
  appointment_id VARCHAR(64) UNIQUE NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id VARCHAR(64) NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id VARCHAR(64) NOT NULL REFERENCES doctors(id),
  doctor_name VARCHAR(255) NOT NULL,
  doctor_specialization VARCHAR(100) NOT NULL,
  doctor_registration_number VARCHAR(100),
  clinic_id VARCHAR(64) NOT NULL REFERENCES clinics(id),
  clinic_name VARCHAR(255) NOT NULL,
  clinic_address TEXT NOT NULL,
  date VARCHAR(50) NOT NULL,
  diagnosis TEXT NOT NULL,
  clinical_notes TEXT,
  follow_up_date VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS prescription_items (
  id VARCHAR(64) PRIMARY KEY,
  prescription_id VARCHAR(64) NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration VARCHAR(100) NOT NULL,
  instructions TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(64) PRIMARY KEY,
  recipient_id VARCHAR(64) NOT NULL,
  recipient_type VARCHAR(20) NOT NULL DEFAULT 'PATIENT', -- PATIENT, DOCTOR, CLINIC
  patient_id VARCHAR(64) REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id VARCHAR(64) REFERENCES doctors(id) ON DELETE CASCADE,
  clinic_id VARCHAR(64) REFERENCES clinics(id) ON DELETE SET NULL,
  appointment_id VARCHAR(64) REFERENCES appointments(id) ON DELETE SET NULL,
  queue_id VARCHAR(64),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  timestamp VARCHAR(100) NOT NULL,
  read BOOLEAN DEFAULT false,
  is_read BOOLEAN DEFAULT false,
  category VARCHAR(50) NOT NULL, -- Appointments, Queue Updates, Clinic Updates, Reminders, System, Announcements
  type VARCHAR(50) DEFAULT 'appointment', -- appointment, reminder, announcement, system, emergency, delay
  action_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS walk_ins (
  id VARCHAR(64) PRIMARY KEY,
  clinic_id VARCHAR(64) REFERENCES clinics(id) ON DELETE SET NULL,
  doctor_id VARCHAR(64) REFERENCES doctors(id) ON DELETE SET NULL,
  patient_id VARCHAR(64) REFERENCES patients(id) ON DELETE SET NULL,
  patient_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  reason TEXT NOT NULL,
  preferred_doctor VARCHAR(255) NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL', -- NORMAL, URGENT, EMERGENCY
  status VARCHAR(30) NOT NULL DEFAULT 'WAITING', -- WAITING, IN_CONSULTATION, COMPLETED
  registered_at VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS clinic_announcements (
  id VARCHAR(64) PRIMARY KEY,
  clinic_id VARCHAR(64) REFERENCES clinics(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  content TEXT NOT NULL,
  date VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL, -- Clinic, Holiday, Health, System
  is_important BOOLEAN DEFAULT false,
  clinic_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pharmacy_inventory (
  id VARCHAR(64) PRIMARY KEY,
  clinic_id VARCHAR(64) REFERENCES clinics(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  category VARCHAR(100) NOT NULL, -- Antibiotics, Analgesics, Antipyretics, Cardiovascular, Antidiabetic, Dermatology, Gastrointestinal, Respiratory
  dosage_form VARCHAR(100) NOT NULL DEFAULT 'Tablet', -- Tablet, Capsule, Syrup, Injection, Ointment, Drops
  strength VARCHAR(100) NOT NULL,
  batch_number VARCHAR(100) NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock_level INTEGER NOT NULL DEFAULT 15,
  reorder_quantity INTEGER NOT NULL DEFAULT 50,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 10.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pharmacy_dispensations (
  id VARCHAR(64) PRIMARY KEY,
  inventory_id VARCHAR(64) REFERENCES pharmacy_inventory(id) ON DELETE SET NULL,
  medicine_name VARCHAR(255) NOT NULL,
  prescription_id VARCHAR(64) REFERENCES prescriptions(id) ON DELETE SET NULL,
  patient_id VARCHAR(64) REFERENCES patients(id) ON DELETE SET NULL,
  patient_name VARCHAR(255),
  quantity_dispensed INTEGER NOT NULL,
  batch_number VARCHAR(100) NOT NULL,
  dispensed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  dispensed_by VARCHAR(255) DEFAULT 'Pharmacist Staff'
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_patients_email ON patients(email);
CREATE INDEX IF NOT EXISTS idx_clinics_category ON clinics(category);
CREATE INDEX IF NOT EXISTS idx_doctors_specialization ON doctors(specialization);
CREATE INDEX IF NOT EXISTS idx_doctors_clinic ON doctors(clinic_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_walk_ins_status ON walk_ins(status);
CREATE INDEX IF NOT EXISTS idx_walk_ins_priority ON walk_ins(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_patient ON notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_files_patient ON medical_files(patient_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_name ON pharmacy_inventory(name);
CREATE INDEX IF NOT EXISTS idx_pharmacy_expiry ON pharmacy_inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_pharmacy_batch ON pharmacy_inventory(batch_number);
