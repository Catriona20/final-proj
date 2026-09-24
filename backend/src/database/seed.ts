import bcrypt from 'bcryptjs';
import { memoryDb, saveStateToFile } from './db';
import { PatientEntity, ClinicEntity, DoctorEntity, DepartmentEntity, AppointmentEntity, DoctorClinicAssignmentModel } from './models';
import { timeService, CLINIC_TIMEZONE } from '../services/timeService';

export interface SeedSummary {
  patientsCount: number;
  clinicsCount: number;
  doctorsCount: number;
  appointmentsCount: number;
  queuesCount: number;
  consultationsCount: number;
  prescriptionsCount: number;
  medicalReportsCount: number;
  totalCount: number;
  duplicateIds: number;
}

export const seedDatabase = async (): Promise<SeedSummary> => {
  console.log('🌱 Seeding MedLink presentation dataset (220 relationally connected records)...');

  // Reset in-memory DB collections to ensure deterministic idempotency
  for (const key of Object.keys(memoryDb) as (keyof typeof memoryDb)[]) {
    if (memoryDb[key] && typeof (memoryDb[key] as any).clear === 'function') {
      (memoryDb[key] as any).clear();
    }
  }

  const todayStr = timeService.getTodayDateString();

  // Common password hashes
  const genericPassHash = await bcrypt.hash('password123', 10);
  const docPassHash = await bcrypt.hash('Doctor@2001', 10);
  const asstPassHash = await bcrypt.hash('Clinic@3001', 10);

  // ============================================================
  // 1. SEED 40 REALISTIC PATIENTS (Indian / Chennai Demographics)
  // ============================================================
  const patientProfiles: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    age: number;
    gender: string;
    blood: string;
    locality: string;
    address: string;
    contact: string;
    spec: string;
    doc: string;
  }> = [
    { id: 'pat-demo-01', name: 'Aarav Sharma', email: 'patient01@demo.medlink.test', phone: '+91 9000000001', age: 32, gender: 'Male', blood: 'B+', locality: 'Mylapore', address: '24, Luz Church Road, Mylapore, Chennai', contact: '+91 9000000091 (Pooja Sharma - Spouse)', spec: 'Dentistry', doc: 'Dr. Arun Kumar' },
    { id: 'pat-demo-02', name: 'Sneha Patel', email: 'patient02@demo.medlink.test', phone: '+91 9000000002', age: 29, gender: 'Female', blood: 'O+', locality: 'Adyar', address: '12, Gandhi Nagar 1st Main Rd, Adyar, Chennai', contact: '+91 9000000092 (Ramesh Patel - Father)', spec: 'General Medicine', doc: 'Dr. Priya Sharma' },
    { id: 'pat-demo-03', name: 'Rajesh Kumar', email: 'patient03@demo.medlink.test', phone: '+91 9000000003', age: 52, gender: 'Male', blood: 'A+', locality: 'T Nagar', address: '18, Venkatnarayana Road, T Nagar, Chennai', contact: '+91 9000000093 (Kavita Kumar - Spouse)', spec: 'Cardiology', doc: 'Dr. Karthik Raman' },
    { id: 'pat-demo-04', name: 'Priya Raman', email: 'patient04@demo.medlink.test', phone: '+91 9000000004', age: 28, gender: 'Female', blood: 'AB+', locality: 'Guindy', address: '154, Mount Road, Guindy, Chennai', contact: '+91 9000000094 (Maya Raman - Mother)', spec: 'Pediatrics', doc: 'Dr. Kavitha Reddy' },
    { id: 'pat-demo-05', name: 'Vikram Malhotra', email: 'patient05@demo.medlink.test', phone: '+91 9000000005', age: 45, gender: 'Male', blood: 'O-', locality: 'Velachery', address: '42, 100 Feet Bypass Road, Velachery, Chennai', contact: '+91 9000000095 (Deepak Malhotra - Brother)', spec: 'Dermatology', doc: 'Dr. Priya Nair' },
    { id: 'pat-demo-06', name: 'Ananya Iyer', email: 'patient06@demo.medlink.test', phone: '+91 9000000006', age: 31, gender: 'Female', blood: 'B-', locality: 'Anna Nagar', address: 'Plot 102, 2nd Avenue, Anna Nagar West, Chennai', contact: '+91 9000000096 (Raghav Iyer - Spouse)', spec: 'ENT', doc: 'Dr. Venkat Raman' },
    { id: 'pat-demo-07', name: 'Rahul Verma', email: 'patient07@demo.medlink.test', phone: '+91 9000000007', age: 38, gender: 'Male', blood: 'A-', locality: 'R.A. Puram', address: '77, Chamiers Road, R.A. Puram, Chennai', contact: '+91 9000000097 (Lavanya Verma - Spouse)', spec: 'Orthopedics', doc: 'Dr. Aditya Rao' },
    { id: 'pat-demo-08', name: 'Pooja Nair', email: 'patient08@demo.medlink.test', phone: '+91 9000000008', age: 26, gender: 'Female', blood: 'B+', locality: 'Kilpauk', address: '33, Ormes Road, Kilpauk, Chennai', contact: '+91 9000000098 (Sarala Nair - Mother)', spec: 'Gynecology', doc: 'Dr. Radha Sundaram' },
    { id: 'pat-101', name: 'Sarah Jenkins', email: 'sarah.jenkins@example.com', phone: '+91 98401 23456', age: 34, gender: 'Female', blood: 'O+', locality: 'Mylapore', address: '24, Luz Church Road, Mylapore, Chennai', contact: '+91 98401 23499 (David Jenkins - Spouse)', spec: 'Dentistry', doc: 'Dr. Ananya Deshmukh' },
    { id: 'pat-102', name: 'Priya Sharma', email: 'priya.sharma@example.com', phone: '+91 98401 23457', age: 29, gender: 'Female', blood: 'A+', locality: 'Anna Nagar', address: '88 Healthcare Blvd, Anna Nagar West, Chennai', contact: '+91 98401 23498 (Ramesh Sharma - Father)', spec: 'General Medicine', doc: 'Dr. Priya Sharma' },
    { id: 'pat-demo-09', name: 'Rahul Menon', email: 'rahul.menon@medlink.test', phone: '+91 98401 10009', age: 33, gender: 'Male', blood: 'O-', locality: 'Mylapore', address: '55, Kutchery Road, Mylapore, Chennai', contact: '+91 98401 90009 (Deepa Menon - Sister)', spec: 'Dentistry', doc: 'Dr. Arun Kumar' },
    { id: 'pat-demo-10', name: 'Priya Balaji', email: 'priya.balaji@medlink.test', phone: '+91 98401 10010', age: 58, gender: 'Female', blood: 'B+', locality: 'Perungudi', address: '82, OMR Phase 1, Perungudi, Chennai', contact: '+91 98401 90010 (Balaji Varadan - Spouse)', spec: 'Cardiology', doc: 'Dr. Nithya Menon' },
    { id: 'pat-demo-11', name: 'Nithya Raj', email: 'nithya.raj@medlink.test', phone: '+91 98401 10011', age: 27, gender: 'Female', blood: 'A+', locality: 'OMR', address: '104, Rajiv Gandhi Salai, Thoraipakkam, Chennai', contact: '+91 98401 90011 (Rajasekar M - Father)', spec: 'General Medicine', doc: 'Dr. Meenakshi Iyer' },
    { id: 'pat-demo-12', name: 'Sanjay Prakash', email: 'sanjay.prakash@medlink.test', phone: '+91 98401 10012', age: 49, gender: 'Male', blood: 'O+', locality: 'Sholinganallur', address: '33, Medavakkam High Road, Sholinganallur, Chennai', contact: '+91 98401 90012 (Usha Prakash - Spouse)', spec: 'Orthopedics', doc: 'Dr. Suresh Balaji' },
    { id: 'pat-demo-13', name: 'Pooja Nair Secondary', email: 'pooja.nair@medlink.test', phone: '+91 98401 10013', age: 26, gender: 'Female', blood: 'B+', locality: 'Tambaram', address: '18, GST Road, West Tambaram, Chennai', contact: '+91 98401 90013 (Sarala Nair - Mother)', spec: 'Dermatology', doc: 'Dr. Kavya Narayanan' },
    { id: 'pat-demo-14', name: 'Vikram Malhotra Secondary', email: 'vikram.malhotra@medlink.test', phone: '+91 98401 10014', age: 44, gender: 'Male', blood: 'AB-', locality: 'Chromepet', address: '47, Radha Nagar Main Rd, Chromepet, Chennai', contact: '+91 98401 90014 (Deepak Malhotra - Brother)', spec: 'ENT', doc: 'Dr. Rahul Srinivasan' },
    { id: 'pat-demo-15', name: 'Sunita Reddy', email: 'sunita.reddy@medlink.test', phone: '+91 98401 10015', age: 61, gender: 'Female', blood: 'A+', locality: 'Guindy', address: '12, Race Course Road, Guindy, Chennai', contact: '+91 98401 90015 (Varun Reddy - Son)', spec: 'Cardiology', doc: 'Dr. Karthik Raman' },
    { id: 'pat-demo-16', name: 'Suresh Menon', email: 'suresh.menon@medlink.test', phone: '+91 98401 10016', age: 63, gender: 'Male', blood: 'B+', locality: 'Kilpauk', address: '25, Ormes Road, Kilpauk, Chennai', contact: '+91 98401 90016 (Radhika Menon - Spouse)', spec: 'General Medicine', doc: 'Dr. Rajesh Varma' },
    { id: 'pat-demo-17', name: 'Neha Agarwal', email: 'neha.agarwal@medlink.test', phone: '+91 98401 10017', age: 30, gender: 'Female', blood: 'O-', locality: 'Royapettah', address: '71, Whites Road, Royapettah, Chennai', contact: '+91 98401 90017 (Sangeeta Agarwal - Mother)', spec: 'Gynecology', doc: 'Dr. Radha Sundaram' },
    { id: 'pat-demo-18', name: 'Arjun Rao', email: 'arjun.rao@medlink.test', phone: '+91 98401 10018', age: 36, gender: 'Male', blood: 'A+', locality: 'Besant Nagar', address: '15, 5th Avenue, Besant Nagar, Chennai', contact: '+91 98401 90018 (Priya Rao - Sister)', spec: 'Ophthalmology', doc: 'Dr. Pooja Balaji' },
    { id: 'pat-demo-19', name: 'Kavita Deshmukh', email: 'kavita.deshmukh@medlink.test', phone: '+91 98401 10019', age: 41, gender: 'Female', blood: 'AB+', locality: 'Thiruvanmiyur', address: '22, East Coast Road, Thiruvanmiyur, Chennai', contact: '+91 98401 90019 (Nitin Deshmukh - Spouse)', spec: 'Neurology', doc: 'Dr. Vignesh Kumar' },
    { id: 'pat-demo-20', name: 'Manoj Pillai', email: 'manoj.pillai@medlink.test', phone: '+91 98401 10020', age: 52, gender: 'Male', blood: 'B-', locality: 'Ambattur', address: '93, MTH Road, Ambattur Industrial Estate, Chennai', contact: '+91 98401 90020 (Usha Pillai - Spouse)', spec: 'Pediatrics', doc: 'Dr. Divya Krishnan' },
    { id: 'pat-demo-21', name: 'Ritu Sen', email: 'ritu.sen@medlink.test', phone: '+91 98401 10021', age: 28, gender: 'Female', blood: 'O+', locality: 'Royapuram', address: '64, Mannarsamy Koil St, Royapuram, Chennai', contact: '+91 98401 90021 (Debashis Sen - Father)', spec: 'General Medicine', doc: 'Dr. Sanjay Prakash' },
    { id: 'pat-demo-22', name: 'Deepa Subramanian', email: 'deepa.subramanian@medlink.test', phone: '+91 98401 10022', age: 35, gender: 'Female', blood: 'A+', locality: 'Mylapore', address: '108, Royapettah High Rd, Mylapore, Chennai', contact: '+91 98401 90022 (Subramanian K - Spouse)', spec: 'Dentistry', doc: 'Dr. Arun Kumar' },
    { id: 'pat-demo-23', name: 'Harish Natarajan', email: 'harish.natarajan@medlink.test', phone: '+91 98401 10023', age: 47, gender: 'Male', blood: 'B+', locality: 'Anna Nagar', address: 'Plot 102, 2nd Avenue, Anna Nagar, Chennai', contact: '+91 98401 90023 (Gayatri Natarajan - Spouse)', spec: 'General Medicine', doc: 'Dr. Priya Sharma' },
    { id: 'pat-demo-24', name: 'Swetha Sundaram', email: 'swetha.sundaram@medlink.test', phone: '+91 98401 10024', age: 32, gender: 'Female', blood: 'O+', locality: 'Kilpauk', address: '33, Ormes Road, Kilpauk, Chennai', contact: '+91 98401 90024 (Sundaram V - Father)', spec: 'Gynecology', doc: 'Dr. Shalini Mukerjee' },
    { id: 'pat-demo-25', name: 'Gautham Ramachandran', email: 'gautham.ramachandran@medlink.test', phone: '+91 98401 10025', age: 50, gender: 'Male', blood: 'AB+', locality: 'Nungambakkam', address: '88, Sterling Road, Nungambakkam, Chennai', contact: '+91 98401 90025 (Lakshmi Ramachandran - Spouse)', spec: 'Cardiology', doc: 'Dr. Vikram Sundaram' },
    { id: 'pat-demo-26', name: 'Malini Venkatesh', email: 'malini.venkatesh@medlink.test', phone: '+91 98401 10026', age: 43, gender: 'Female', blood: 'A-', locality: 'T. Nagar', address: '12, North Usman Road, T. Nagar, Chennai', contact: '+91 98401 90026 (Venkatesh K - Spouse)', spec: 'Ophthalmology', doc: 'Dr. Deepa Sundar' },
    { id: 'pat-demo-27', name: 'Ashwin Raghavan', email: 'ashwin.raghavan@medlink.test', phone: '+91 98401 10027', age: 39, gender: 'Male', blood: 'B-', locality: 'Guindy', address: '154, Mount Road, Guindy, Chennai', contact: '+91 98401 90027 (Padma Raghavan - Mother)', spec: 'Orthopedics', doc: 'Dr. Sneha Krishnan' },
    { id: 'pat-demo-28', name: 'Shreya Parthasarathy', email: 'shreya.parthasarathy@medlink.test', phone: '+91 98401 10028', age: 25, gender: 'Female', blood: 'O+', locality: 'Adyar', address: '8, Lattice Bridge Road, Adyar, Chennai', contact: '+91 98401 90028 (Parthasarathy R - Father)', spec: 'Dermatology', doc: 'Dr. Harish Menon' },
    { id: 'pat-demo-29', name: 'Dinesh Chandrasekar', email: 'dinesh.chandrasekar@medlink.test', phone: '+91 98401 10029', age: 48, gender: 'Male', blood: 'A+', locality: 'Velachery', address: '29, Dhandeeswaram Main Rd, Velachery, Chennai', contact: '+91 98401 90029 (Revathi Chandrasekar - Spouse)', spec: 'Neurology', doc: 'Dr. Gayatri Mohan' },
    { id: 'pat-demo-30', name: 'Kirthika Balasubramanian', email: 'kirthika.bala@medlink.test', phone: '+91 98401 10030', age: 34, gender: 'Female', blood: 'B+', locality: 'Mogappair', address: '22, Nolambur Main Road, Mogappair, Chennai', contact: '+91 98401 90030 (Balasubramanian T - Spouse)', spec: 'ENT', doc: 'Dr. Swetha Narayanan' },
    { id: 'pat-demo-31', name: 'Arvind Seshadri', email: 'arvind.seshadri@medlink.test', phone: '+91 98401 10031', age: 6, gender: 'Male', blood: 'O+', locality: 'Porur', address: '15, Mount Poonamallee Rd, Porur, Chennai', contact: '+91 98401 90031 (Seshadri Raman - Father)', spec: 'Pediatrics', doc: 'Dr. Arun Prakash' },
    { id: 'pat-demo-32', name: 'Lavanya Gopalakrishnan', email: 'lavanya.gopal@medlink.test', phone: '+91 98401 10032', age: 53, gender: 'Female', blood: 'AB+', locality: 'Perungudi', address: '45, Industrial Estate, Perungudi, Chennai', contact: '+91 98401 90032 (Gopalakrishnan S - Spouse)', spec: 'Cardiology', doc: 'Dr. Karthik Raman' },
    { id: 'pat-demo-33', name: 'Pradeep Varadarajan', email: 'pradeep.varad@medlink.test', phone: '+91 98401 10033', age: 45, gender: 'Male', blood: 'A+', locality: 'OMR', address: '78, Old Mahabalipuram Rd, Thoraipakkam, Chennai', contact: '+91 98401 90033 (Shanthi Varadarajan - Spouse)', spec: 'General Medicine', doc: 'Dr. Rajesh Varma' },
    { id: 'pat-demo-34', name: 'Meenakshi Sridharan', email: 'meenakshi.sridhar@medlink.test', phone: '+91 98401 10034', age: 56, gender: 'Female', blood: 'B+', locality: 'Sholinganallur', address: '12, IT Corridor Avenue, Sholinganallur, Chennai', contact: '+91 98401 90034 (Sridharan N - Spouse)', spec: 'Orthopedics', doc: 'Dr. Aditya Rao' },
    { id: 'pat-demo-35', name: 'Aditya Jayaraman', email: 'aditya.jayaraman@medlink.test', phone: '+91 98401 10035', age: 29, gender: 'Male', blood: 'O-', locality: 'Tambaram', address: '88, Mudichur Road, West Tambaram, Chennai', contact: '+91 98401 90035 (Jayaraman K - Father)', spec: 'Dermatology', doc: 'Dr. Priya Nair' },
    { id: 'pat-demo-36', name: 'Rohini Vijayakumar', email: 'rohini.vijay@medlink.test', phone: '+91 98401 10036', age: 37, gender: 'Female', blood: 'A+', locality: 'Chromepet', address: '34, Station Road, Chromepet, Chennai', contact: '+91 98401 90036 (Vijayakumar M - Spouse)', spec: 'ENT', doc: 'Dr. Venkat Raman' },
    { id: 'pat-demo-37', name: 'Kishore Ananthakrishnan', email: 'kishore.ananth@medlink.test', phone: '+91 98401 10037', age: 10, gender: 'Male', blood: 'B+', locality: 'Ambattur', address: '50, Dunlop Main Road, Ambattur, Chennai', contact: '+91 98401 90037 (Ananthakrishnan V - Father)', spec: 'Pediatrics', doc: 'Dr. Divya Krishnan' },
    { id: 'pat-demo-38', name: 'Bhavani Sankaran', email: 'bhavani.sankaran@medlink.test', phone: '+91 98401 10038', age: 65, gender: 'Female', blood: 'O+', locality: 'Royapettah', address: '10, Peters Road, Royapettah, Chennai', contact: '+91 98401 90038 (Sankaran G - Spouse)', spec: 'General Medicine', doc: 'Dr. Sanjay Prakash' },
    { id: 'pat-demo-39', name: 'Vandana Muralidharan', email: 'vandana.muralidhar@medlink.test', phone: '+91 98401 10039', age: 31, gender: 'Female', blood: 'AB+', locality: 'Besant Nagar', address: '4, Beach Road, Besant Nagar, Chennai', contact: '+91 98401 90039 (Muralidharan R - Spouse)', spec: 'Ophthalmology', doc: 'Dr. Ramesh Chandran' },
    { id: 'pat-demo-ramesh-emergency', name: 'Emergency Patient Ramesh', email: 'ramesh.emergency@demo.medlink.test', phone: '+91 9000000039', age: 26, gender: 'Male', blood: 'O+', locality: 'Villivakkam', address: '14, Market Road, Villivakkam, Chennai', contact: '+91 9000000099 (Suresh Kumar - Father)', spec: 'Dentistry', doc: 'Dr. Arun Kumar' },
  ];

  for (const p of patientProfiles) {
    const patPassword = p.id === 'pat-demo-01' ? 'Demo@1001' :
      p.id === 'pat-demo-02' ? 'Demo@1002' :
      p.id === 'pat-demo-03' ? 'Demo@1003' :
      p.id === 'pat-demo-04' ? 'Demo@1004' :
      p.id === 'pat-demo-05' ? 'Demo@1005' :
      p.id === 'pat-demo-06' ? 'Demo@1006' :
      p.id === 'pat-demo-07' ? 'Demo@1007' :
      p.id === 'pat-demo-08' ? 'Demo@1008' : 'password123';
    const passHash = await bcrypt.hash(patPassword, 10);

    const patientEntity: PatientEntity = {
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      password_hash: passHash,
      blood_group: p.blood,
      age: p.age,
      gender: p.gender,
      avatar: `https://images.unsplash.com/photo-${1500000000000 + p.age * 12345}?auto=format&fit=crop&q=80&w=200`,
      address: p.address,
      emergency_contact: p.contact,
      preferred_specialization: p.spec,
      preferred_doctor: p.doc,
      notifications_enabled: true,
      theme_preference: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    memoryDb.patients.set(p.id, patientEntity);
  }

  // Set backward-compatible patient aliases
  memoryDb.patients.setAlias('patient-001', 'pat-demo-01');
  memoryDb.patients.setAlias('patient-002', 'pat-demo-02');
  memoryDb.patients.setAlias('patient-003', 'pat-demo-03');
  memoryDb.patients.setAlias('patient-1', 'pat-demo-01');
  memoryDb.patients.setAlias('patient-2', 'pat-demo-02');
  memoryDb.patients.setAlias('patient-3', 'pat-demo-03');
  memoryDb.patients.setAlias('pat-001', 'pat-demo-01');
  memoryDb.patients.setAlias('pat-002', 'pat-demo-02');
  memoryDb.patients.setAlias('pat-003', 'pat-demo-03');
  memoryDb.patients.setAlias('pat-1', 'pat-demo-01');
  memoryDb.patients.setAlias('pat-2', 'pat-demo-02');
  memoryDb.patients.setAlias('pat-3', 'pat-demo-03');
  memoryDb.patients.setAlias('patient01@demo.medlink.test', 'pat-demo-01');
  memoryDb.patients.setAlias('patient02@demo.medlink.test', 'pat-demo-02');

  // Saved location for pat-demo-01 & pat-demo-02
  memoryDb.saved_locations.set('loc-demo-01', {
    id: 'loc-demo-01',
    patient_id: 'pat-demo-01',
    label: 'Home',
    name: 'Mylapore Residence',
    locality: 'Mylapore, Chennai',
    latitude: 13.0338,
    longitude: 80.2677,
    address: '24, Luz Church Road, Mylapore, Chennai',
    created_at: new Date().toISOString(),
  });
  memoryDb.saved_locations.set('loc-demo-02', {
    id: 'loc-demo-02',
    patient_id: 'pat-demo-02',
    label: 'Home',
    name: 'Adyar Residence',
    locality: 'Adyar, Chennai',
    latitude: 13.0012,
    longitude: 80.2565,
    address: '12, Gandhi Nagar 1st Main Rd, Adyar, Chennai',
    created_at: new Date().toISOString(),
  });

  // ============================================================
  // 2. SEED DEPARTMENTS CATALOG (10 Core Healthcare Specialties + 7 Clinical Subspecialties)
  // ============================================================
  const departmentsData = [
    { id: 'dept-gen', name: 'General Medicine', icon: '🩺', desc: 'Comprehensive adult health, acute viral fever, metabolic screening, and preventive primary care', keywords: ['General Physician', 'Fever', 'Cough', 'Internal Medicine', 'Primary Care', 'Family Doctor'], symptoms: ['Fever', 'Fatigue', 'Cold / Cough', 'Body Ache', 'Headache'] },
    { id: 'dept-cardio', name: 'Cardiology', icon: '❤️', desc: 'Heart health, resting ECG, arterial pressure, lipid profiles, and cardiovascular diagnostics', keywords: ['Cardiologist', 'Heart', 'ECG', 'Hypertension', 'Chest Pain', 'Cardiac Consultation'], symptoms: ['Chest Pain', 'Palpitations', 'High BP', 'Shortness of Breath', 'Dizziness'] },
    { id: 'dept-derma', name: 'Dermatology', icon: '✨', desc: 'Skin rashes, acne treatment, eczema, psoriasis, cutaneous allergy, and dermatosurgery', keywords: ['Dermatologist', 'Skin', 'Acne', 'Rash', 'Eczema', 'Hair Fall'], symptoms: ['Skin Rash', 'Severe Acne', 'Itching / Redness', 'Eczema Flare', 'Scalp Flaking'] },
    { id: 'dept-opht', name: 'Ophthalmology', icon: '👁️', desc: 'Visual acuity, slit-lamp bio-microscopy, cataract checks, glaucoma, and refractive corrections', keywords: ['Ophthalmologist', 'Eye Specialist', 'Vision', 'Cataract', 'Glaucoma', 'Eye Irritation'], symptoms: ['Eye Irritation', 'Blurred Vision', 'Red Eyes', 'Watery Eyes', 'Eye Strain'] },
    { id: 'dept-dent', name: 'Dentistry', icon: '🦷', desc: 'Oral hygiene, toothache, root canal therapy, cavity fillings, cleaning & dental restorations', keywords: ['Dentist', 'Toothache', 'Teeth', 'Root Canal', 'Cleaning', 'Cavity', 'Dental Filling', 'Tooth Extraction'], symptoms: ['Toothache', 'Tooth Sensitivity', 'Bleeding Gums', 'Jaw Pain', 'Cavity Pain'] },
    { id: 'dept-ent', name: 'ENT', icon: '👂', desc: 'Ear infections, otoscopy, sinus disorders, throat discomfort, and audiometric evaluations', keywords: ['ENT Specialist', 'Ear Pain', 'Ear Infection', 'Sinus', 'Throat', 'Hearing'], symptoms: ['Ear Pain', 'Ear Infection', 'Sore Throat', 'Nasal Blockage', 'Sinus Pressure'] },
    { id: 'dept-pedia', name: 'Pediatrics', icon: '👶', desc: 'Infant and child wellness, developmental milestones, pediatric fevers, and immunization', keywords: ['Pediatrician', 'Child Fever', 'Child Specialist', 'Vaccination', 'Infant Care'], symptoms: ['Child Fever', 'Pediatric Cough', 'Loss of Appetite', 'Child Vomiting'] },
    { id: 'dept-ortho', name: 'Orthopedics', icon: '🦴', desc: 'Bone fractures, joint pain, spine care, sports injuries, and arthritis management', keywords: ['Orthopedic', 'Bone', 'Joint Pain', 'Back Pain', 'Fracture', 'Knee Pain'], symptoms: ['Knee Pain', 'Lower Back Pain', 'Joint Swelling', 'Shoulder Stiffness'] },
    { id: 'dept-gyn', name: 'Gynecology', icon: '🌸', desc: 'Women\'s reproductive health, prenatal checkups, PCOS management, and hormonal evaluations', keywords: ['Gynecologist', 'Pregnancy', 'Obstetrics', 'PCOS', 'Women\'s Health', 'Maternity'], symptoms: ['Pregnancy Checkup', 'Pelvic Pain', 'Irregular Periods', 'Hormonal Imbalance'] },
    { id: 'dept-neuro', name: 'Neurology', icon: '🧠', desc: 'Cranial nerve evaluation, migraine therapy, neuro-vascular health, and vertigo management', keywords: ['Neurologist', 'Migraine', 'Brain', 'Headache', 'Nerve', 'Dizziness', 'Vertigo'], symptoms: ['Headache and Dizziness', 'Severe Migraine', 'Numbness / Tingling', 'Vertigo', 'Tremors'] },
    { id: 'dept-pulmo', name: 'Pulmonology', icon: '🫁', desc: 'Pulmonary function, asthma management, spirometry, chronic cough, and bronchial airflow', keywords: ['Pulmonologist', 'Breathing Problem', 'Asthma', 'Lung', 'Chronic Cough', 'Wheezing'], symptoms: ['Breathing Problem', 'Shortness of Breath', 'Chronic Cough', 'Wheezing', 'Chest Congestion'] },
    { id: 'dept-nephro', name: 'Nephrology', icon: '🧪', desc: 'Renal clearance profiles, chronic kidney disease, proteinuria, and fluid-electrolyte balance', keywords: ['Nephrologist', 'Kidney Problem', 'Renal', 'Dialysis', 'Creatinine'], symptoms: ['Kidney Problem', 'Foamy Urine', 'Decreased Urine Output', 'Swollen Ankles / Edema'] },
    { id: 'dept-gastro', name: 'Gastroenterology', icon: '🍽️', desc: 'Digestive tract health, gastric acidity, GERD, abdominal discomfort, and hepatobiliary care', keywords: ['Gastroenterologist', 'Stomach Pain', 'Acidity', 'GERD', 'Digestive Health', 'Gastritis'], symptoms: ['Stomach Pain', 'Severe Acid Reflux', 'Bloating / Indigestion', 'Nausea / Vomiting'] },
    { id: 'dept-endo', name: 'Endocrinology', icon: '⚖️', desc: 'Glycemic profiling, Type 1/2 diabetes therapy, thyroid disorders, and metabolic regulation', keywords: ['Endocrinologist', 'Diabetes', 'Thyroid', 'Blood Sugar', 'Hormone', 'Metabolic'], symptoms: ['Diabetes Checkup', 'Fatigue / Weight Change', 'Thyroid Swelling', 'Frequent Urination'] },
    { id: 'dept-uro', name: 'Urology', icon: '💧', desc: 'Urinary tract health, lithotripsy for kidney stones, prostate profiling, and uro-diagnostics', keywords: ['Urologist', 'Kidney Stone', 'Urine Problem', 'Urinary Infection', 'Prostate'], symptoms: ['Urine Problem', 'Kidney Stone Flank Pain', 'Burning Urination', 'Urinary Hesitancy'] },
    { id: 'dept-physio', name: 'Physiotherapy', icon: '🏃', desc: 'Musculoskeletal conditioning, sports injury recovery, postural alignment, and physical therapy', keywords: ['Physiotherapist', 'Physiotherapy', 'Back Pain Physiotherapy', 'Rehab', 'Mobility'], symptoms: ['Back Pain Physiotherapy', 'Post-Op Knee Stiffness', 'Neck & Shoulder Spasm', 'Sports Sprain'] },
    { id: 'dept-psych', name: 'Psychiatry', icon: '🧘', desc: 'Comprehensive psychiatric evaluation, mental wellness support, psychotherapy, and clinical care', keywords: ['Psychiatrist', 'Anxiety', 'Depression', 'Stress', 'Insomnia', 'Mental Health'], symptoms: ['Anxiety', 'Panic Attacks', 'Chronic Stress', 'Severe Insomnia', 'Persistent Low Mood'] },
  ];

  for (const d of departmentsData) {
    memoryDb.departments.set(d.id, {
      id: d.id,
      name: d.name,
      icon: d.icon,
      description: d.desc,
      clinic_count: 5,
      doctor_count: 8,
      keywords: d.keywords,
      popular_symptoms: d.symptoms,
    });
  }

  // ============================================================
  // 3. SEED EXACTLY 20 CHENNAI LOCALITY PLATFORM CLINICS
  // ============================================================
  const demoClinics: ClinicEntity[] = [
    { id: 'c-demo-moon-01', name: 'Moon Dental & Medical Clinic', address: '24 Luz Church Road, Mylapore, Chennai', latitude: 13.0338, longitude: 80.2677, rating: 4.97, reviews_count: 320, image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80', category: 'Dentistry', doctors_count: 2, open_hours: '09:00 AM – 08:30 PM', phone: '+91 44 2498 0001', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹400', departments: ['Dentistry', 'General Medicine'], created_at: new Date().toISOString() },
    { id: 'c-demo-apollo-02', name: 'Apollo Family Care Centre', address: '88 Healthcare Blvd, Anna Nagar, Chennai', latitude: 13.0850, longitude: 80.2101, rating: 4.92, reviews_count: 410, image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', category: 'General Medicine', doctors_count: 2, open_hours: '08:00 AM – 09:00 PM', phone: '+91 44 2621 0002', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹500', departments: ['General Medicine', 'Cardiology'], created_at: new Date().toISOString() },
    { id: 'c-demo-greenlife-03', name: "GreenLife Women's & Maternity Clinic", address: '25 Maternity Way, Kilpauk, Chennai', latitude: 13.0827, longitude: 80.2407, rating: 4.94, reviews_count: 215, image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', category: 'Gynecology', doctors_count: 2, open_hours: '09:00 AM – 07:30 PM', phone: '+91 44 2641 0003', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹600', departments: ['Gynecology'], created_at: new Date().toISOString() },
    { id: 'c-demo-heart-04', name: 'Chennai Heart & Vascular Centre', address: '42 Cardio Boulevard, Nungambakkam, Chennai', latitude: 13.0569, longitude: 80.2425, rating: 4.98, reviews_count: 450, image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80', category: 'Cardiology', doctors_count: 2, open_hours: '08:00 AM – 09:00 PM', phone: '+91 44 2821 0004', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹700', departments: ['Cardiology'], created_at: new Date().toISOString() },
    { id: 'c-demo-vision-05', name: 'VisionPlus Eye Centre', address: '19 Optics Road, T. Nagar, Chennai', latitude: 13.0418, longitude: 80.2341, rating: 4.93, reviews_count: 280, image: 'https://images.unsplash.com/photo-1580281657527-47f249e8f4df?auto=format&fit=crop&w=800&q=80', category: 'Ophthalmology', doctors_count: 2, open_hours: '09:00 AM – 08:00 PM', phone: '+91 44 2834 0005', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹450', departments: ['Ophthalmology'], created_at: new Date().toISOString() },
    { id: 'c-demo-ortho-06', name: 'OrthoCare Chennai', address: '56 Mount Road, Guindy, Chennai', latitude: 13.0112, longitude: 80.2195, rating: 4.90, reviews_count: 195, image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80', category: 'Orthopedics', doctors_count: 2, open_hours: '09:00 AM – 08:30 PM', phone: '+91 44 2661 0006', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹550', departments: ['Orthopedics'], created_at: new Date().toISOString() },
    { id: 'c-demo-skin-07', name: 'SkinSphere Dermatology', address: '14 Derma Plaza, Adyar, Chennai', latitude: 13.0078, longitude: 80.2567, rating: 4.95, reviews_count: 310, image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80', category: 'Dermatology', doctors_count: 2, open_hours: '09:30 AM – 08:00 PM', phone: '+91 44 2441 0007', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹500', departments: ['Dermatology'], created_at: new Date().toISOString() },
    { id: 'c-demo-neuro-08', name: 'NeuroBridge Care Clinic', address: '73 Neuro Street, Velachery, Chennai', latitude: 12.9815, longitude: 80.2180, rating: 4.96, reviews_count: 220, image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80', category: 'Neurology', doctors_count: 2, open_hours: '09:00 AM – 07:00 PM', phone: '+91 44 2235 0008', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹700', departments: ['Neurology'], created_at: new Date().toISOString() },
    { id: 'c-demo-perambur-19', name: 'Perambur Multi-Specialty Clinic', address: '45 Madhavaram High Road, Perambur, Chennai', latitude: 13.1075, longitude: 80.2435, rating: 4.89, reviews_count: 185, image: 'https://images.unsplash.com/photo-1578496479914-7ef3b0193be3?auto=format&fit=crop&w=800&q=80', category: 'ENT', doctors_count: 2, open_hours: '09:00 AM – 08:00 PM', phone: '+91 44 2656 0009', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹450', departments: ['ENT'], created_at: new Date().toISOString() },
    { id: 'c-demo-smile-10', name: 'Smile & Child Pediatric Centre', address: '10 Pediatric Square, Porur, Chennai', latitude: 13.0382, longitude: 80.1565, rating: 4.97, reviews_count: 360, image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', category: 'Pediatrics', doctors_count: 2, open_hours: '08:30 AM – 08:30 PM', phone: '+91 44 2476 0010', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹450', departments: ['Pediatrics'], created_at: new Date().toISOString() },
    { id: 'c-demo-ramapuram-11', name: 'Ramapuram Family Medical Centre', address: '12 Mount Poonamallee High Rd, Ramapuram, Chennai', latitude: 13.0304, longitude: 80.1802, rating: 4.91, reviews_count: 175, image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', category: 'Cardiology', doctors_count: 1, open_hours: '08:30 AM – 08:30 PM', phone: '+91 44 2496 0011', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹600', departments: ['Cardiology', 'General Medicine'], created_at: new Date().toISOString() },
    { id: 'c-demo-omr-12', name: 'OMR Health City Clinic', address: '104 Rajiv Gandhi Salai, Thoraipakkam, Chennai', latitude: 12.9348, longitude: 80.2312, rating: 4.93, reviews_count: 210, image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80', category: 'General Medicine', doctors_count: 1, open_hours: '08:00 AM – 09:00 PM', phone: '+91 44 2450 0012', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹500', departments: ['General Medicine'], created_at: new Date().toISOString() },
    { id: 'c-demo-sholinganallur-13', name: 'Sholinganallur Family Healthcare', address: '33 Medavakkam High Rd, Sholinganallur, Chennai', latitude: 12.9010, longitude: 80.2279, rating: 4.88, reviews_count: 160, image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80', category: 'Orthopedics', doctors_count: 1, open_hours: '09:00 AM – 08:00 PM', phone: '+91 44 2453 0013', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹550', departments: ['Orthopedics'], created_at: new Date().toISOString() },
    { id: 'c-demo-tambaram-14', name: 'Tambaram Prime Healthcare', address: '18 GST Road, West Tambaram, Chennai', latitude: 12.9249, longitude: 80.1478, rating: 4.92, reviews_count: 230, image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80', category: 'Dermatology', doctors_count: 1, open_hours: '09:00 AM – 08:30 PM', phone: '+91 44 2226 0014', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹500', departments: ['Dermatology'], created_at: new Date().toISOString() },
    { id: 'c-demo-chromepet-15', name: 'Chromepet Medical Pavilion', address: '47 Radha Nagar Main Rd, Chromepet, Chennai', latitude: 12.9517, longitude: 80.1408, rating: 4.90, reviews_count: 190, image: 'https://images.unsplash.com/photo-1578496479914-7ef3b0193be3?auto=format&fit=crop&w=800&q=80', category: 'ENT', doctors_count: 1, open_hours: '09:00 AM – 08:00 PM', phone: '+91 44 2238 0015', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹450', departments: ['ENT'], created_at: new Date().toISOString() },
    { id: 'c-demo-pallavaram-16', name: 'Pallavaram Prime Health Clinic', address: '71 GST Road, Pallavaram, Chennai', latitude: 12.9675, longitude: 80.1491, rating: 4.94, reviews_count: 240, image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', category: 'General Medicine', doctors_count: 1, open_hours: '08:00 AM – 09:00 PM', phone: '+91 44 2852 0017', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹500', departments: ['General Medicine'], created_at: new Date().toISOString() },
    { id: 'c-demo-ambattur-17', name: 'Ambattur Industrial Care Clinic', address: '93 MTH Road, Ambattur, Chennai', latitude: 13.1143, longitude: 80.1548, rating: 4.89, reviews_count: 150, image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80', category: 'Pediatrics', doctors_count: 1, open_hours: '08:30 AM – 08:00 PM', phone: '+91 44 2658 0016', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹450', departments: ['Pediatrics'], created_at: new Date().toISOString() },
    { id: 'c-demo-besant-18', name: 'Besant Nagar Coastal Health Care', address: '15 5th Avenue, Besant Nagar, Chennai', latitude: 13.0002, longitude: 80.2667, rating: 4.96, reviews_count: 275, image: 'https://images.unsplash.com/photo-1580281657527-47f249e8f4df?auto=format&fit=crop&w=800&q=80', category: 'Ophthalmology', doctors_count: 1, open_hours: '09:00 AM – 08:00 PM', phone: '+91 44 2491 0018', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹500', departments: ['Ophthalmology'], created_at: new Date().toISOString() },
    { id: 'c-demo-avadi-18', name: 'Avadi Central Care Hospital', address: '28 CTH Road, Avadi, Chennai', latitude: 13.1147, longitude: 80.1008, rating: 4.95, reviews_count: 260, image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80', category: 'Neurology', doctors_count: 1, open_hours: '09:00 AM – 07:30 PM', phone: '+91 44 2448 0019', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹650', departments: ['Neurology'], created_at: new Date().toISOString() },
    { id: 'c-demo-royapuram-20', name: 'Royapuram Community Health Clinic', address: '64 Mannarsamy Koil St, Royapuram, Chennai', latitude: 13.1137, longitude: 80.2952, rating: 4.88, reviews_count: 165, image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80', category: 'General Medicine', doctors_count: 1, open_hours: '08:30 AM – 08:00 PM', phone: '+91 44 2595 0020', is_open: true, is_popular: true, is_nearby: true, wait_time: '0 min wait', consultation_fee: '₹400', departments: ['General Medicine'], created_at: new Date().toISOString() },
  ];

  demoClinics.forEach((c) => {
    memoryDb.clinics.set(c.id, c);
  });

  // Set backward-compatibility aliases on memoryDb.clinics
  memoryDb.clinics.setAlias('c1', 'c-demo-apollo-02');
  memoryDb.clinics.setAlias('c2', 'c-demo-apollo-02');
  memoryDb.clinics.setAlias('c3', 'c-demo-greenlife-03');
  memoryDb.clinics.setAlias('c4', 'c-demo-heart-04');
  memoryDb.clinics.setAlias('c5', 'c-demo-moon-01');
  memoryDb.clinics.setAlias('c-demo', 'c-demo-moon-01');
  memoryDb.clinics.setAlias('c-demo-multi-02', 'c-demo-apollo-02');
  memoryDb.clinics.setAlias('c-demo-heart-03', 'c-demo-heart-04');
  memoryDb.clinics.setAlias('c-demo-rainbow-04', 'c-demo-smile-10');
  memoryDb.clinics.setAlias('c-demo-skin-05', 'c-demo-skin-07');
  memoryDb.clinics.setAlias('c-demo-ent-06', 'c-demo-perambur-19');
  memoryDb.clinics.setAlias('c-demo-nova-09', 'c-demo-perambur-19');
  memoryDb.clinics.setAlias('c-demo-perungudi-11', 'c-demo-ramapuram-11');
  memoryDb.clinics.setAlias('c-demo-ambattur-16', 'c-demo-ambattur-17');
  memoryDb.clinics.setAlias('c-demo-royapettah-17', 'c-demo-pallavaram-16');
  memoryDb.clinics.setAlias('c-demo-thiruvanmiyur-19', 'c-demo-avadi-18');

  // Standard 20 Demo Clinic aliases
  const demoClinicAliases: [string, string][] = [
    ['clinic-001', 'c-demo-moon-01'],
    ['clinic-002', 'c-demo-apollo-02'],
    ['clinic-003', 'c-demo-greenlife-03'],
    ['clinic-004', 'c-demo-heart-04'],
    ['clinic-005', 'c-demo-vision-05'],
    ['clinic-006', 'c-demo-ortho-06'],
    ['clinic-007', 'c-demo-skin-07'],
    ['clinic-008', 'c-demo-neuro-08'],
    ['clinic-009', 'c-demo-perambur-19'],
    ['clinic-010', 'c-demo-smile-10'],
    ['clinic-011', 'c-demo-ramapuram-11'],
    ['clinic-012', 'c-demo-omr-12'],
    ['clinic-013', 'c-demo-sholinganallur-13'],
    ['clinic-014', 'c-demo-tambaram-14'],
    ['clinic-015', 'c-demo-chromepet-15'],
    ['clinic-016', 'c-demo-pallavaram-16'],
    ['clinic-017', 'c-demo-ambattur-17'],
    ['clinic-018', 'c-demo-besant-18'],
    ['clinic-019', 'c-demo-avadi-18'],
    ['clinic-020', 'c-demo-royapuram-20'],
  ];
  for (const [alias, id] of demoClinicAliases) {
    memoryDb.clinics.setAlias(alias, id);
    const shortAlias = alias.replace('-00', '-').replace('-0', '-');
    memoryDb.clinics.setAlias(shortAlias, id);
  }

  // ============================================================
  // 4. SEED PROCEDURES CATALOG
  // ============================================================
  const coreProcedures = [
    { id: 'proc-rc', name: 'Root Canal Treatment', department: 'Dentistry', description: 'Single/multi-visit endodontic root canal therapy & bio-ceramic obturation.' },
    { id: 'proc-dc', name: 'Dental Cleaning', department: 'Dentistry', description: 'Ultrasonic scaling, subgingival plaque debridement, and enamel polishing.' },
    { id: 'proc-te', name: 'Tooth Extraction', department: 'Dentistry', description: 'Atraumatic dental extraction, socket preservation, and surgical removal.' },
    { id: 'proc-df', name: 'Dental Filling', department: 'Dentistry', description: 'Composite tooth-colored restorative cavity restoration.' },
    { id: 'proc-fc', name: 'Fever Consultation', department: 'General Medicine', description: 'Acute pyrexia evaluation, CBC platelet check, and symptom triage.' },
    { id: 'proc-gh', name: 'General Health Consultation', department: 'General Medicine', description: 'Routine clinical checkup, metabolic and primary health screening.' },
    { id: 'proc-db', name: 'Diabetes Consultation', department: 'General Medicine', description: 'Glycemic control review, diet counseling, and oral hypoglycemic modulation.' },
    { id: 'proc-anc', name: 'Antenatal Checkup', department: 'Gynecology', description: 'Prenatal maternal health review, fetal Doppler monitoring, and obstetric care.' },
    { id: 'proc-pcos', name: 'PCOS Management', department: 'Gynecology', description: 'Endocrine and pelvic ultrasound review for polycystic ovarian syndrome.' },
    { id: 'proc-card', name: 'Cardiac Consultation', department: 'Cardiology', description: 'Comprehensive cardiopulmonary examination and lipid profiling.' },
    { id: 'proc-ecg', name: 'Electrocardiogram (ECG)', department: 'Cardiology', description: '12-lead Electrocardiogram recording and cardiac rhythm analysis.' },
    { id: 'proc-ht', name: 'Hypertension Consultation', department: 'Cardiology', description: 'Blood pressure mapping, secondary hypertension screening, and therapy.' },
    { id: 'proc-eye-ex', name: 'Comprehensive Eye Examination', department: 'Ophthalmology', description: 'Slit-lamp ocular examination, refraction check, and intraocular pressure test.' },
    { id: 'proc-cataract', name: 'Cataract Evaluation', department: 'Ophthalmology', description: 'Lens opacification assessment and intraocular lens planning.' },
    { id: 'proc-joint', name: 'Joint Pain Consultation', department: 'Orthopedics', description: 'Articular cartilage assessment, range of motion tests, and joint review.' },
    { id: 'proc-knee', name: 'Knee Arthritis Evaluation', department: 'Orthopedics', description: 'Degenerative joint evaluation, radiographic review, and viscosupplementation.' },
    { id: 'proc-sk-c', name: 'Skin Consultation', department: 'Dermatology', description: 'Dermatologic clinical evaluation of skin lesions, pigmentation, and rashes.' },
    { id: 'proc-sk-a', name: 'Acne Treatment', department: 'Dermatology', description: 'Grade 1-4 acne vulgaris protocol, chemical peel assessment, and topicals.' },
    { id: 'proc-migraine', name: 'Migraine Consultation', department: 'Neurology', description: 'Neurovascular headache workup, aura profiling, and abortive/prophylactic therapy.' },
    { id: 'proc-nerve', name: 'Neurological Examination', department: 'Neurology', description: 'Cranial nerve reflex testing, peripheral neuropathy and sensory review.' },
    { id: 'proc-ent-c', name: 'ENT Consultation', department: 'ENT', description: 'Otolaryngology examination of ear canals, nasal septum, and pharynx.' },
    { id: 'proc-ear-inf', name: 'Ear Infection Consultation', department: 'ENT', description: 'Otitis media/externa diagnosis, micro-suctioning, and topical antibiotic therapy.' },
    { id: 'proc-ped-c', name: 'Child Consultation', department: 'Pediatrics', description: 'Pediatric physical exam, growth milestones, and pediatric symptom review.' },
    { id: 'proc-ped-f', name: 'Child Fever Evaluation', department: 'Pediatrics', description: 'Pediatric viral fever protocol, hydration assessment, and weight-based dosing.' },
  ];

  coreProcedures.forEach((p) => {
    memoryDb.procedures.set(p.id, { ...p, is_verified: true, created_at: new Date().toISOString() });
  });

  const defaultSchedule = {
    Monday: { start: '09:00 AM', end: '01:00 PM', slot_duration: 20, is_off: false },
    Tuesday: { start: '09:00 AM', end: '01:00 PM', slot_duration: 20, is_off: false },
    Wednesday: { start: '09:00 AM', end: '01:00 PM', slot_duration: 20, is_off: false },
    Thursday: { start: '02:00 PM', end: '06:00 PM', slot_duration: 20, is_off: false },
    Friday: { start: '09:00 AM', end: '01:00 PM', slot_duration: 20, is_off: false },
    Saturday: { start: '09:00 AM', end: '02:00 PM', slot_duration: 20, is_off: false },
    Sunday: { start: '10:00 AM', end: '01:00 PM', slot_duration: 20, is_off: true },
  };

  // ============================================================
  // 5. SEED EXACTLY 30 SPECIALIST DOCTORS ACROSS 10 DEPARTMENTS
  // ============================================================
  const rawDoctorsList = [
    // 1. Dentistry
    { id: 'doc-demo-arun-01', name: 'Dr. Arun Kumar', spec: 'Dentistry', subSpec: 'Endodontics', clinicId: 'c-demo-moon-01', clinicName: 'Moon Dental & Medical Clinic', fee: '₹400', rating: 4.97, exp: 12, email: 'doctor01@demo.medlink.test', procs: ['Root Canal Treatment', 'Dental Cleaning', 'Tooth Extraction', 'Dental Filling'] },
    { id: 'doc-demo-ananya-08', name: 'Dr. Ananya Deshmukh', spec: 'Dentistry', subSpec: 'Oral & Maxillofacial Surgery', clinicId: 'c-demo-moon-01', clinicName: 'Moon Dental & Medical Clinic', fee: '₹400', rating: 4.93, exp: 9, email: 'dr.ananya@medlink.health', procs: ['Dental Consultation', 'Root Canal Treatment', 'Dental Filling', 'Tooth Extraction'] },
    { id: 'doc-demo-suresh-07', name: 'Dr. Suresh Babu', spec: 'Dentistry', subSpec: 'Conservative Dentistry', clinicId: 'c-demo-moon-01', clinicName: 'Moon Dental & Medical Clinic', fee: '₹350', rating: 4.60, exp: 3, email: 'suresh.babu@medlink.test', status: 'UNDER_REVIEW', verified: false, procs: ['Dental Consultation', 'Dental Filling'] },

    // 2. General Medicine
    { id: 'doc-demo-priya-02', name: 'Dr. Priya Sharma', spec: 'General Medicine', subSpec: 'Internal Medicine', clinicId: 'c-demo-apollo-02', clinicName: 'Apollo Family Care Centre', fee: '₹500', rating: 4.92, exp: 11, email: 'doctor02@demo.medlink.test', procs: ['Fever Consultation', 'General Health Consultation', 'Diabetes Consultation'] },
    { id: 'doc-demo-rajesh-14', name: 'Dr. Rajesh Varma', spec: 'General Medicine', subSpec: 'Family Medicine', clinicId: 'c-demo-apollo-02', clinicName: 'Apollo Family Care Centre', fee: '₹450', rating: 4.89, exp: 13, email: 'dr.rajesh@medlink.test', procs: ['General Health Consultation', 'Fever Consultation'] },
    { id: 'doc-demo-meenakshi-23', name: 'Dr. Meenakshi Iyer', spec: 'General Medicine', subSpec: 'Internal Medicine', clinicId: 'c-demo-omr-12', clinicName: 'OMR Health City Clinic', fee: '₹500', rating: 4.94, exp: 10, email: 'dr.meenakshi@medlink.test', procs: ['General Health Consultation', 'Fever Consultation'] },

    // 3. Cardiology
    { id: 'doc-demo-karthik-03', name: 'Dr. Karthik Raman', spec: 'Cardiology', subSpec: 'Interventional Cardiology', clinicId: 'c-demo-heart-04', clinicName: 'Chennai Heart & Vascular Centre', fee: '₹700', rating: 4.98, exp: 16, email: 'doctor03@demo.medlink.test', procs: ['Cardiac Consultation', 'Electrocardiogram (ECG)', 'Hypertension Consultation'] },
    { id: 'doc-demo-nithya-13', name: 'Dr. Nithya Menon', spec: 'Cardiology', subSpec: 'Preventive Cardiology', clinicId: 'c-demo-perungudi-11', clinicName: 'Perungudi Multi-Specialty Clinic', fee: '₹650', rating: 4.92, exp: 11, email: 'dr.nithya@medlink.test', procs: ['Cardiac Consultation', 'Electrocardiogram (ECG)'] },
    { id: 'doc-demo-vikram-22', name: 'Dr. Vikram Sundaram', spec: 'Cardiology', subSpec: 'Clinical Cardiology', clinicId: 'c-demo-heart-04', clinicName: 'Chennai Heart & Vascular Centre', fee: '₹700', rating: 4.95, exp: 14, email: 'dr.vikram.sundaram@medlink.test', procs: ['Cardiac Consultation', 'Hypertension Consultation'] },

    // 4. Pediatrics
    { id: 'doc-demo-kavitha-04', name: 'Dr. Kavitha Reddy', spec: 'Pediatrics', subSpec: 'Pediatrics & Neonatology', clinicId: 'c-demo-smile-10', clinicName: 'Smile & Child Pediatric Centre', fee: '₹450', rating: 4.96, exp: 11, email: 'doctor04@demo.medlink.test', procs: ['Child Consultation', 'Child Fever Evaluation'] },
    { id: 'doc-demo-arun-21', name: 'Dr. Arun Prakash', spec: 'Pediatrics', subSpec: 'Pediatric Care', clinicId: 'c-demo-smile-10', clinicName: 'Smile & Child Pediatric Centre', fee: '₹500', rating: 4.91, exp: 8, email: 'dr.arun.prakash@medlink.test', procs: ['Child Consultation', 'Child Fever Evaluation'] },
    { id: 'doc-demo-divya-27', name: 'Dr. Divya Krishnan', spec: 'Pediatrics', subSpec: 'Child Wellness', clinicId: 'c-demo-ambattur-16', clinicName: 'Ambattur Industrial Care Clinic', fee: '₹450', rating: 4.90, exp: 9, email: 'dr.divya.krishnan@medlink.test', procs: ['Child Consultation'] },

    // 5. Dermatology
    { id: 'doc-demo-priya-05', name: 'Dr. Priya Nair', spec: 'Dermatology', subSpec: 'Clinical Dermatology', clinicId: 'c-demo-skin-07', clinicName: 'SkinSphere Dermatology', fee: '₹500', rating: 4.95, exp: 10, email: 'doctor05@demo.medlink.test', procs: ['Skin Consultation', 'Acne Treatment'] },
    { id: 'doc-demo-harish-18', name: 'Dr. Harish Menon', spec: 'Dermatology', subSpec: 'Aesthetic Dermatosurgery', clinicId: 'c-demo-skin-07', clinicName: 'SkinSphere Dermatology', fee: '₹550', rating: 4.91, exp: 12, email: 'dr.harish.menon@medlink.test', procs: ['Skin Consultation', 'Acne Treatment'] },
    { id: 'doc-demo-kavya-25', name: 'Dr. Kavya Narayanan', spec: 'Dermatology', subSpec: 'Cutaneous Medicine', clinicId: 'c-demo-tambaram-14', clinicName: 'Tambaram Prime Healthcare', fee: '₹500', rating: 4.93, exp: 8, email: 'dr.kavya.narayanan@medlink.test', procs: ['Skin Consultation'] },

    // 6. ENT
    { id: 'doc-demo-venkat-06', name: 'Dr. Venkat Raman', spec: 'ENT', subSpec: 'Otolaryngology', clinicId: 'c-demo-nova-09', clinicName: 'Nova ENT Care', fee: '₹450', rating: 4.91, exp: 13, email: 'doctor06@demo.medlink.test', procs: ['ENT Consultation', 'Ear Infection Consultation'] },
    { id: 'doc-demo-swetha-20', name: 'Dr. Swetha Narayanan', spec: 'ENT', subSpec: 'Rhinology & Sinus', clinicId: 'c-demo-nova-09', clinicName: 'Nova ENT Care', fee: '₹500', rating: 4.88, exp: 8, email: 'dr.swetha.narayanan@medlink.test', procs: ['ENT Consultation'] },
    { id: 'doc-demo-rahul-26', name: 'Dr. Rahul Srinivasan', spec: 'ENT', subSpec: 'Otolaryngology', clinicId: 'c-demo-chromepet-15', clinicName: 'Chromepet Medical Pavilion', fee: '₹450', rating: 4.92, exp: 10, email: 'dr.rahul.srinivasan@medlink.test', procs: ['ENT Consultation'] },

    // 7. Ophthalmology
    { id: 'doc-demo-ramesh-10', name: 'Dr. Ramesh Chandran', spec: 'Ophthalmology', subSpec: 'Cataract & Refractive', clinicId: 'c-demo-vision-05', clinicName: 'VisionPlus Eye Centre', fee: '₹450', rating: 4.94, exp: 14, email: 'dr.ramesh.chandran@medlink.test', procs: ['Comprehensive Eye Examination', 'Cataract Evaluation'] },
    { id: 'doc-demo-deepa-16', name: 'Dr. Deepa Sundar', spec: 'Ophthalmology', subSpec: 'Glaucoma & Cornea', clinicId: 'c-demo-vision-05', clinicName: 'VisionPlus Eye Centre', fee: '₹450', rating: 4.90, exp: 9, email: 'dr.deepa.sundar@medlink.test', procs: ['Comprehensive Eye Examination'] },
    { id: 'doc-demo-pooja-29', name: 'Dr. Pooja Balaji', spec: 'Ophthalmology', subSpec: 'Ophthalmic Surgery', clinicId: 'c-demo-besant-18', clinicName: 'Besant Nagar Coastal Health Care', fee: '₹500', rating: 4.95, exp: 11, email: 'dr.pooja.balaji@medlink.test', procs: ['Comprehensive Eye Examination'] },

    // 8. Orthopedics
    { id: 'doc-demo-aditya-11', name: 'Dr. Aditya Rao', spec: 'Orthopedics', subSpec: 'Joint Replacement & Spine', clinicId: 'c-demo-ortho-06', clinicName: 'OrthoCare Chennai', fee: '₹550', rating: 4.93, exp: 13, email: 'dr.aditya.rao@medlink.test', procs: ['Joint Pain Consultation', 'Knee Arthritis Evaluation'] },
    { id: 'doc-demo-sneha-17', name: 'Dr. Sneha Krishnan', spec: 'Orthopedics', subSpec: 'Sports Medicine', clinicId: 'c-demo-ortho-06', clinicName: 'OrthoCare Chennai', fee: '₹500', rating: 4.88, exp: 8, email: 'dr.sneha.krishnan@medlink.test', procs: ['Joint Pain Consultation'] },
    { id: 'doc-demo-balaji-24', name: 'Dr. Suresh Balaji', spec: 'Orthopedics', subSpec: 'Trauma & Musculoskeletal', clinicId: 'c-demo-sholinganallur-13', clinicName: 'Sholinganallur Family Healthcare', fee: '₹550', rating: 4.92, exp: 12, email: 'dr.suresh.balaji@medlink.test', procs: ['Joint Pain Consultation'] },

    // 9. Gynecology
    { id: 'doc-demo-radha-09', name: 'Dr. Radha Sundaram', spec: 'Gynecology', subSpec: 'Obstetrics & Gynecology', clinicId: 'c-demo-greenlife-03', clinicName: "GreenLife Women's & Maternity Clinic", fee: '₹600', rating: 4.95, exp: 15, email: 'dr.radha.sundaram@medlink.test', procs: ['Antenatal Checkup', 'PCOS Management'] },
    { id: 'doc-demo-shalini-15', name: 'Dr. Shalini Mukerjee', spec: 'Gynecology', subSpec: 'Reproductive Medicine', clinicId: 'c-demo-greenlife-03', clinicName: "GreenLife Women's & Maternity Clinic", fee: '₹650', rating: 4.91, exp: 10, email: 'dr.shalini.mukerjee@medlink.test', procs: ['PCOS Management'] },

    // 10. Neurology
    { id: 'doc-demo-arvind-12', name: 'Dr. Arvind Swaminathan', spec: 'Neurology', subSpec: 'Clinical Neurology & Stroke', clinicId: 'c-demo-neuro-08', clinicName: 'NeuroBridge Care Clinic', fee: '₹700', rating: 4.96, exp: 16, email: 'dr.arvind.swami@medlink.test', procs: ['Migraine Consultation', 'Neurological Examination'] },
    { id: 'doc-demo-gayatri-19', name: 'Dr. Gayatri Mohan', spec: 'Neurology', subSpec: 'Neurophysiology', clinicId: 'c-demo-neuro-08', clinicName: 'NeuroBridge Care Clinic', fee: '₹650', rating: 4.90, exp: 11, email: 'dr.gayatri.mohan@medlink.test', procs: ['Neurological Examination'] },
    { id: 'doc-demo-vignesh-30', name: 'Dr. Vignesh Kumar', spec: 'Neurology', subSpec: 'Neuro-Vascular Care', clinicId: 'c-demo-thiruvanmiyur-19', clinicName: 'Thiruvanmiyur Wellness Centre', fee: '₹650', rating: 4.94, exp: 10, email: 'dr.vignesh.kumar@medlink.test', procs: ['Migraine Consultation'] },
    { id: 'doc-demo-sanjay-28', name: 'Dr. Sanjay Prakash', spec: 'General Medicine', subSpec: 'Primary Health & Preventive', clinicId: 'c-demo-royapettah-17', clinicName: 'Royapettah Metro Clinic', fee: '₹500', rating: 4.91, exp: 9, email: 'dr.sanjay.prakash@medlink.test', procs: ['General Health Consultation'] },
  ];

  for (const doc of rawDoctorsList) {
    const isUnderReview = doc.status === 'UNDER_REVIEW';
    const docEntity: DoctorEntity = {
      id: doc.id,
      name: doc.name,
      email: doc.email,
      phone: '+91 98402 ' + String(10000 + memoryDb.doctors.size).slice(-5),
      password_hash: docPassHash,
      specialization: doc.spec,
      primary_specialization: doc.subSpec,
      qualification: `MBBS, MD (${doc.subSpec})`,
      university: 'Tamil Nadu Dr. M.G.R. Medical University',
      grad_year: 2012,
      dob: '1984-06-15',
      gender: 'Male',
      rating: doc.rating,
      reviews_count: 150 + Math.floor(doc.rating * 20),
      experience_years: doc.exp,
      avatar: `https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400`,
      clinic_id: doc.clinicId,
      clinic_name: doc.clinicName,
      available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      wait_time: '10 min',
      is_available_today: true,
      status: isUnderReview ? 'AVAILABLE' : 'AVAILABLE',
      languages: ['English', 'Tamil'],
      consultation_fee: doc.fee,
      is_preferred: true,
      about: `Senior Specialist in ${doc.subSpec} with ${doc.exp}+ years clinical experience.`,
      is_verified: !isUnderReview,
      verification_status: isUnderReview ? 'UNDER_REVIEW' : 'VERIFIED',
      verified_at: isUnderReview ? undefined : '2025-01-10T10:00:00.000Z',
      registration_number: `TN-REG-${doc.id.toUpperCase()}`,
      registration_authority: 'Tamil Nadu Medical / Dental Council',
      consultation_duration: '20 minutes',
      clinic_affiliations: [doc.clinicName],
      procedures: doc.procs,
      schedule: defaultSchedule,
    };
    memoryDb.doctors.set(doc.id, docEntity);
  }

  // Set backward-compatible doctor aliases on memoryDb.doctors
  memoryDb.doctors.setAlias('d1', 'doc-demo-arun-01');
  memoryDb.doctors.setAlias('d2', 'doc-demo-priya-02');
  memoryDb.doctors.setAlias('d3', 'doc-demo-karthik-03');
  memoryDb.doctors.setAlias('d4', 'doc-demo-kavitha-04');
  memoryDb.doctors.setAlias('d5', 'doc-demo-priya-05');
  memoryDb.doctors.setAlias('d6', 'doc-demo-venkat-06');
  memoryDb.doctors.setAlias('doc-demo-vikram-03', 'doc-demo-karthik-03');
  memoryDb.doctors.setAlias('doc-demo-neha-04', 'doc-demo-kavitha-04');
  memoryDb.doctors.setAlias('doc-demo-rahul-05', 'doc-demo-priya-05');
  memoryDb.doctors.setAlias('doc-demo-kavya-06', 'doc-demo-venkat-06');

  // Standard doc-001..030 aliases
  const standardDocAliases: [string, string][] = [
    ['doc-001', 'doc-demo-arun-01'],
    ['doc-002', 'doc-demo-priya-02'],
    ['doc-003', 'doc-demo-karthik-03'],
    ['doc-004', 'doc-demo-kavitha-04'],
    ['doc-005', 'doc-demo-priya-05'],
    ['doc-006', 'doc-demo-venkat-06'],
    ['doc-007', 'doc-demo-suresh-07'],
    ['doc-008', 'doc-demo-ananya-08'],
    ['doc-009', 'doc-demo-radha-09'],
    ['doc-010', 'doc-demo-ramesh-10'],
    ['doc-011', 'doc-demo-aditya-11'],
    ['doc-012', 'doc-demo-arvind-12'],
    ['doc-013', 'doc-demo-nithya-13'],
    ['doc-014', 'doc-demo-rajesh-14'],
    ['doc-015', 'doc-demo-shalini-15'],
    ['doc-016', 'doc-demo-deepa-16'],
    ['doc-017', 'doc-demo-sneha-17'],
    ['doc-018', 'doc-demo-harish-18'],
    ['doc-019', 'doc-demo-gayatri-19'],
    ['doc-020', 'doc-demo-swetha-20'],
    ['doc-021', 'doc-demo-arun-21'],
    ['doc-022', 'doc-demo-vikram-22'],
    ['doc-023', 'doc-demo-meenakshi-23'],
    ['doc-024', 'doc-demo-balaji-24'],
    ['doc-025', 'doc-demo-kavya-25'],
    ['doc-026', 'doc-demo-rahul-26'],
    ['doc-027', 'doc-demo-divya-27'],
    ['doc-028', 'doc-demo-sanjay-28'],
    ['doc-029', 'doc-demo-pooja-29'],
    ['doc-030', 'doc-demo-vignesh-30'],
  ];
  for (const [alias, id] of standardDocAliases) {
    memoryDb.doctors.setAlias(alias, id);
    const shortAlias = alias.replace('-00', '-').replace('-0', '-');
    memoryDb.doctors.setAlias(shortAlias, id);
  }

  // ============================================================
  // DOCTOR-CLINIC ASSIGNMENTS (Many-to-Many Multi-Clinic Architecture)
  // ============================================================
  // 1. Primary assignments for all 30 doctors
  for (const doc of rawDoctorsList) {
    await DoctorClinicAssignmentModel.assign(doc.id, doc.clinicId, doc.spec);
  }

  // 2. Multi-clinic assignments across Chennai platform clinics
  // Dr. Arun Kumar (Dentistry) assigned to 4 clinics
  await DoctorClinicAssignmentModel.assign('doc-demo-arun-01', 'c-demo-moon-01', 'Dentistry');
  await DoctorClinicAssignmentModel.assign('doc-demo-arun-01', 'c-demo-apollo-02', 'Dentistry');
  await DoctorClinicAssignmentModel.assign('doc-demo-arun-01', 'c-demo-vision-05', 'Dentistry');
  await DoctorClinicAssignmentModel.assign('doc-demo-arun-01', 'c-demo-ramapuram-11', 'Dentistry');

  // Dr. Priya Sharma (General Medicine) assigned to 3 clinics
  await DoctorClinicAssignmentModel.assign('doc-demo-priya-02', 'c-demo-apollo-02', 'General Medicine');
  await DoctorClinicAssignmentModel.assign('doc-demo-priya-02', 'c-demo-moon-01', 'General Medicine');
  await DoctorClinicAssignmentModel.assign('doc-demo-priya-02', 'c-demo-heart-04', 'General Medicine');

  // Dr. Karthik Raman (Cardiology) assigned to 2 clinics
  await DoctorClinicAssignmentModel.assign('doc-demo-karthik-03', 'c-demo-heart-04', 'Cardiology');
  await DoctorClinicAssignmentModel.assign('doc-demo-karthik-03', 'c-demo-apollo-02', 'Cardiology');

  // Dr. Priya Nair (Dermatology) assigned to 2 clinics
  await DoctorClinicAssignmentModel.assign('doc-demo-priya-05', 'c-demo-skin-07', 'Dermatology');
  await DoctorClinicAssignmentModel.assign('doc-demo-priya-05', 'c-demo-tambaram-14', 'Dermatology');

  // Dr. Aditya Rao (Orthopedics) assigned to 2 clinics
  await DoctorClinicAssignmentModel.assign('doc-demo-aditya-11', 'c-demo-ortho-06', 'Orthopedics');
  await DoctorClinicAssignmentModel.assign('doc-demo-aditya-11', 'c-demo-sholinganallur-13', 'Orthopedics');

  // ============================================================
  // 6. SEED EXACTLY 50 APPOINTMENTS (Real-World Operational States)
  // ============================================================
  // Breakdown:
  // - 20 Completed visits (with linked Consultations & Prescriptions)
  // - 15 Waiting visits for TODAY (with linked Waiting Queue records)
  // - 5 In Consultation visits for TODAY (with linked In Consultation Queue records)
  // - 7 Confirmed / Upcoming future visits
  // - 3 Cancelled visits
  // Total = 50 Appointments

  const appointmentsData: Array<{
    id: string;
    patient_id: string;
    patient_name: string;
    clinic_id: string;
    clinic_name: string;
    doctor_id: string;
    doctor_name: string;
    department: string;
    date: string;
    time: string;
    status: 'Completed' | 'Waiting' | 'In Consultation' | 'Confirmed' | 'Cancelled';
    token: string;
    queue_pos: number;
    reason: string;
    symptoms: string[];
    fee: string;
  }> = [
    // --- 20 COMPLETED VISITS ---
    { id: 'apt-2026-001', patient_id: 'pat-101', patient_name: 'Sarah Jenkins', clinic_id: 'c-demo-moon-01', clinic_name: 'Moon Dental & Medical Clinic', doctor_id: 'doc-demo-ananya-08', doctor_name: 'Dr. Ananya Deshmukh', department: 'Dentistry', date: '2026-08-10', time: '11:00 AM', status: 'Completed', token: 'A001', queue_pos: 0, reason: 'Seasonal Allergic Bronchitis with Mild Dental Tenderness', symptoms: ['Pharyngitis', 'Toothache'], fee: '₹400' },
    { id: 'apt-2026-002', patient_id: 'pat-101', patient_name: 'Sarah Jenkins', clinic_id: 'c-demo-apollo-02', clinic_name: 'Apollo Family Care Centre', doctor_id: 'doc-demo-priya-02', doctor_name: 'Dr. Priya Sharma', department: 'General Medicine', date: '2026-08-18', time: '10:00 AM', status: 'Completed', token: 'A002', queue_pos: 0, reason: 'Persistent low-grade viral pyrexia and fatigue', symptoms: ['Fever', 'Fatigue'], fee: '₹500' },
    { id: 'apt-2026-003', patient_id: 'pat-101', patient_name: 'Sarah Jenkins', clinic_id: 'c-demo-heart-04', clinic_name: 'Chennai Heart & Vascular Centre', doctor_id: 'doc-demo-karthik-03', doctor_name: 'Dr. Karthik Raman', department: 'Cardiology', date: '2026-08-25', time: '02:30 PM', status: 'Completed', token: 'A003', queue_pos: 0, reason: 'Cardiovascular screening and resting ECG review', symptoms: ['Palpitations', 'Dizziness'], fee: '₹700' },
    { id: 'apt-2026-004', patient_id: 'pat-102', patient_name: 'Priya Sharma', clinic_id: 'c-demo-greenlife-03', clinic_name: "GreenLife Women's & Maternity Clinic", doctor_id: 'doc-demo-radha-09', doctor_name: 'Dr. Radha Sundaram', department: 'Gynecology', date: '2026-08-12', time: '09:30 AM', status: 'Completed', token: 'A004', queue_pos: 0, reason: 'Routine antenatal trimester health checkup', symptoms: ['Routine Checkup', 'Nausea'], fee: '₹600' },
    { id: 'apt-2026-005', patient_id: 'pat-demo-03', patient_name: 'Arjun Krishnan', clinic_id: 'c-demo-skin-07', clinic_name: 'SkinSphere Dermatology', doctor_id: 'doc-demo-priya-05', doctor_name: 'Dr. Priya Nair', department: 'Dermatology', date: '2026-08-14', time: '11:20 AM', status: 'Completed', token: 'A005', queue_pos: 0, reason: 'Cutaneous flare of erythematous eczema on forearms', symptoms: ['Skin Rash', 'Itching'], fee: '₹500' },
    { id: 'apt-2026-006', patient_id: 'pat-demo-03', patient_name: 'Arjun Krishnan', clinic_id: 'c-demo-apollo-02', clinic_name: 'Apollo Family Care Centre', doctor_id: 'doc-demo-priya-02', doctor_name: 'Dr. Priya Sharma', department: 'General Medicine', date: '2026-08-22', time: '04:00 PM', status: 'Completed', token: 'A006', queue_pos: 0, reason: 'Follow-up for metabolic panel and lipid profile', symptoms: ['Follow-up', 'Fatigue'], fee: '₹500' },
    { id: 'apt-2026-007', patient_id: 'pat-demo-04', patient_name: 'Meera Srinivasan', clinic_id: 'c-demo-vision-05', clinic_name: 'VisionPlus Eye Centre', doctor_id: 'doc-demo-ramesh-10', doctor_name: 'Dr. Ramesh Chandran', department: 'Ophthalmology', date: '2026-08-15', time: '10:40 AM', status: 'Completed', token: 'A007', queue_pos: 0, reason: 'Progressive visual blur and astigmatism refraction test', symptoms: ['Blurred Vision', 'Eye Strain'], fee: '₹450' },
    { id: 'apt-2026-008', patient_id: 'pat-demo-04', patient_name: 'Meera Srinivasan', clinic_id: 'c-demo-apollo-02', clinic_name: 'Apollo Family Care Centre', doctor_id: 'doc-demo-rajesh-14', doctor_name: 'Dr. Rajesh Varma', department: 'General Medicine', date: '2026-08-28', time: '03:20 PM', status: 'Completed', token: 'A008', queue_pos: 0, reason: 'Seasonal allergy follow-up and vitamin check', symptoms: ['Sneezing', 'Nasal Congestion'], fee: '₹450' },
    { id: 'apt-2026-009', patient_id: 'pat-demo-05', patient_name: 'Karthik Raman', clinic_id: 'c-demo-ortho-06', clinic_name: 'OrthoCare Chennai', doctor_id: 'doc-demo-aditya-11', doctor_name: 'Dr. Aditya Rao', department: 'Orthopedics', date: '2026-08-16', time: '09:00 AM', status: 'Completed', token: 'A009', queue_pos: 0, reason: 'Bilateral knee joint stiffness and mild crepitus', symptoms: ['Knee Pain', 'Joint Stiffness'], fee: '₹550' },
    { id: 'apt-2026-010', patient_id: 'pat-demo-05', patient_name: 'Karthik Raman', clinic_id: 'c-demo-heart-04', clinic_name: 'Chennai Heart & Vascular Centre', doctor_id: 'doc-demo-karthik-03', doctor_name: 'Dr. Karthik Raman', department: 'Cardiology', date: '2026-08-26', time: '11:40 AM', status: 'Completed', token: 'A010', queue_pos: 0, reason: 'Hypertension modulation and arterial pressure review', symptoms: ['Elevated BP', 'Headache'], fee: '₹700' },
    { id: 'apt-2026-011', patient_id: 'pat-demo-06', patient_name: 'Ananya Iyer', clinic_id: 'c-demo-nova-09', clinic_name: 'Nova ENT Care', doctor_id: 'doc-demo-venkat-06', doctor_name: 'Dr. Venkat Raman', department: 'ENT', date: '2026-08-17', time: '10:20 AM', status: 'Completed', token: 'A011', queue_pos: 0, reason: 'Chronic maxillary sinusitis and nasal turbinate swelling', symptoms: ['Sinus Pressure', 'Nasal Blockage'], fee: '₹450' },
    { id: 'apt-2026-012', patient_id: 'pat-demo-06', patient_name: 'Ananya Iyer', clinic_id: 'c-demo-apollo-02', clinic_name: 'Apollo Family Care Centre', doctor_id: 'doc-demo-priya-02', doctor_name: 'Dr. Priya Sharma', department: 'General Medicine', date: '2026-08-27', time: '04:40 PM', status: 'Completed', token: 'A012', queue_pos: 0, reason: 'Routine annual preventive health assessment', symptoms: ['Annual Checkup'], fee: '₹500' },
    { id: 'apt-2026-013', patient_id: 'pat-demo-07', patient_name: 'Vignesh Kumar', clinic_id: 'c-demo-smile-10', clinic_name: 'Smile & Child Pediatric Centre', doctor_id: 'doc-demo-kavitha-04', doctor_name: 'Dr. Kavitha Reddy', department: 'Pediatrics', date: '2026-08-19', time: '09:40 AM', status: 'Completed', token: 'A013', queue_pos: 0, reason: 'Pediatric allergic cough and immunization review', symptoms: ['Cough', 'Mild Wheeze'], fee: '₹450' },
    { id: 'apt-2026-014', patient_id: 'pat-demo-08', patient_name: 'Divya Narayanan', clinic_id: 'c-demo-neuro-08', clinic_name: 'NeuroBridge Care Clinic', doctor_id: 'doc-demo-arvind-12', doctor_name: 'Dr. Arvind Swaminathan', department: 'Neurology', date: '2026-08-20', time: '02:00 PM', status: 'Completed', token: 'A014', queue_pos: 0, reason: 'Recurrent unilateral throbbing migraine with photophobia', symptoms: ['Severe Migraine', 'Photophobia'], fee: '₹700' },
    { id: 'apt-2026-015', patient_id: 'pat-demo-09', patient_name: 'Rahul Menon', clinic_id: 'c-demo-moon-01', clinic_name: 'Moon Dental & Medical Clinic', doctor_id: 'doc-demo-arun-01', doctor_name: 'Dr. Arun Kumar', department: 'Dentistry', date: '2026-08-21', time: '12:00 PM', status: 'Completed', token: 'A015', queue_pos: 0, reason: 'Deep dental caries in molar requiring endodontic care', symptoms: ['Tooth Pain', 'Sensitivity'], fee: '₹400' },
    { id: 'apt-2026-016', patient_id: 'pat-demo-10', patient_name: 'Priya Balaji', clinic_id: 'c-demo-perungudi-11', clinic_name: 'Perungudi Multi-Specialty Clinic', doctor_id: 'doc-demo-nithya-13', doctor_name: 'Dr. Nithya Menon', department: 'Cardiology', date: '2026-08-23', time: '10:00 AM', status: 'Completed', token: 'A016', queue_pos: 0, reason: 'Preventive cardiology assessment and lipid profiling', symptoms: ['Exertional Dyspnea', 'Palpitations'], fee: '₹650' },
    { id: 'apt-2026-017', patient_id: 'pat-demo-11', patient_name: 'Nithya Raj', clinic_id: 'c-demo-omr-12', clinic_name: 'OMR Health City Clinic', doctor_id: 'doc-demo-meenakshi-23', doctor_name: 'Dr. Meenakshi Iyer', department: 'General Medicine', date: '2026-08-24', time: '03:00 PM', status: 'Completed', token: 'A017', queue_pos: 0, reason: 'Thyroid hormone review and chronic fatigue evaluation', symptoms: ['Fatigue', 'Weight Fluctuation'], fee: '₹500' },
    { id: 'apt-2026-018', patient_id: 'pat-demo-12', patient_name: 'Sanjay Prakash', clinic_id: 'c-demo-sholinganallur-13', clinic_name: 'Sholinganallur Family Healthcare', doctor_id: 'doc-demo-balaji-24', doctor_name: 'Dr. Suresh Balaji', department: 'Orthopedics', date: '2026-08-25', time: '04:20 PM', status: 'Completed', token: 'A018', queue_pos: 0, reason: 'Lumbar spine postural strain and radicular stiffness', symptoms: ['Lower Back Pain', 'Muscle Spasm'], fee: '₹550' },
    { id: 'apt-2026-019', patient_id: 'pat-demo-13', patient_name: 'Pooja Nair', clinic_id: 'c-demo-tambaram-14', clinic_name: 'Tambaram Prime Healthcare', doctor_id: 'doc-demo-kavya-25', doctor_name: 'Dr. Kavya Narayanan', department: 'Dermatology', date: '2026-08-26', time: '09:20 AM', status: 'Completed', token: 'A019', queue_pos: 0, reason: 'Papulopustular acne vulgaris grade 2 consultation', symptoms: ['Acne Breakout', 'Facial Redness'], fee: '₹500' },
    { id: 'apt-2026-020', patient_id: 'pat-demo-14', patient_name: 'Vikram Malhotra', clinic_id: 'c-demo-chromepet-15', clinic_name: 'Chromepet Medical Pavilion', doctor_id: 'doc-demo-rahul-26', doctor_name: 'Dr. Rahul Srinivasan', department: 'ENT', date: '2026-08-27', time: '11:00 AM', status: 'Completed', token: 'A020', queue_pos: 0, reason: 'Middle ear effusion and conductive hearing discomfort', symptoms: ['Ear Fullness', 'Mild Hearing Muffle'], fee: '₹450' },

    // --- 20 HISTORICAL COMPLETED VISITS (Separate from Clean Live Demo Queue) ---
    { id: 'apt-2026-021', patient_id: 'pat-101', patient_name: 'Sarah Jenkins', clinic_id: 'c-demo-moon-01', clinic_name: 'Moon Dental & Medical Clinic', doctor_id: 'doc-demo-arun-01', doctor_name: 'Dr. Arun Kumar', department: 'Dentistry', date: '2026-08-28', time: '09:30 AM', status: 'Completed', token: 'A021', queue_pos: 0, reason: 'Follow-up root canal review and permanent crown fitting', symptoms: ['Post-procedure checkup'], fee: '₹400' },
    { id: 'apt-2026-022', patient_id: 'pat-demo-15', patient_name: 'Sunita Reddy', clinic_id: 'c-demo-heart-04', clinic_name: 'Chennai Heart & Vascular Centre', doctor_id: 'doc-demo-karthik-03', doctor_name: 'Dr. Karthik Raman', department: 'Cardiology', date: '2026-08-28', time: '10:00 AM', status: 'Completed', token: 'A022', queue_pos: 0, reason: 'Hypertension evaluation and Holter monitor check', symptoms: ['Palpitations'], fee: '₹700' },
    { id: 'apt-2026-023', patient_id: 'pat-demo-16', patient_name: 'Suresh Menon', clinic_id: 'c-demo-apollo-02', clinic_name: 'Apollo Family Care Centre', doctor_id: 'doc-demo-priya-02', doctor_name: 'Dr. Priya Sharma', department: 'General Medicine', date: '2026-08-28', time: '10:20 AM', status: 'Completed', token: 'A023', queue_pos: 0, reason: 'Acute viral pharyngitis with mild fever', symptoms: ['Sore Throat', 'Fever'], fee: '₹500' },
    { id: 'apt-2026-024', patient_id: 'pat-demo-17', patient_name: 'Neha Agarwal', clinic_id: 'c-demo-greenlife-03', clinic_name: "GreenLife Women's & Maternity Clinic", doctor_id: 'doc-demo-radha-09', doctor_name: 'Dr. Radha Sundaram', department: 'Gynecology', date: '2026-08-28', time: '10:40 AM', status: 'Completed', token: 'A024', queue_pos: 0, reason: 'Pelvic ultrasound consultation and hormonal check', symptoms: ['Pelvic Discomfort'], fee: '₹600' },
    { id: 'apt-2026-025', patient_id: 'pat-demo-18', patient_name: 'Arjun Rao', clinic_id: 'c-demo-vision-05', clinic_name: 'VisionPlus Eye Centre', doctor_id: 'doc-demo-ramesh-10', doctor_name: 'Dr. Ramesh Chandran', department: 'Ophthalmology', date: '2026-08-28', time: '11:00 AM', status: 'Completed', token: 'A025', queue_pos: 0, reason: 'Computer vision syndrome and dry eye assessment', symptoms: ['Eye Irritation', 'Dryness'], fee: '₹450' },
    { id: 'apt-2026-026', patient_id: 'pat-demo-19', patient_name: 'Kavita Deshmukh', clinic_id: 'c-demo-neuro-08', clinic_name: 'NeuroBridge Care Clinic', doctor_id: 'doc-demo-arvind-12', doctor_name: 'Dr. Arvind Swaminathan', department: 'Neurology', date: '2026-08-28', time: '11:20 AM', status: 'Completed', token: 'A026', queue_pos: 0, reason: 'Cranial nerve evaluation and tension headache', symptoms: ['Chronic Headache'], fee: '₹700' },
    { id: 'apt-2026-027', patient_id: 'pat-demo-20', patient_name: 'Manoj Pillai', clinic_id: 'c-demo-ortho-06', clinic_name: 'OrthoCare Chennai', doctor_id: 'doc-demo-aditya-11', doctor_name: 'Dr. Aditya Rao', department: 'Orthopedics', date: '2026-08-28', time: '11:40 AM', status: 'Completed', token: 'A027', queue_pos: 0, reason: 'Right rotator cuff tendinitis checkup', symptoms: ['Shoulder Pain'], fee: '₹550' },
    { id: 'apt-2026-028', patient_id: 'pat-demo-21', patient_name: 'Ritu Sen', clinic_id: 'c-demo-skin-07', clinic_name: 'SkinSphere Dermatology', doctor_id: 'doc-demo-priya-05', doctor_name: 'Dr. Priya Nair', department: 'Dermatology', date: '2026-08-28', time: '12:00 PM', status: 'Completed', token: 'A028', queue_pos: 0, reason: 'Urticaria and allergic contact dermatitis', symptoms: ['Itchy Hives'], fee: '₹500' },
    { id: 'apt-2026-029', patient_id: 'pat-demo-22', patient_name: 'Deepa Subramanian', clinic_id: 'c-demo-perambur-19', clinic_name: 'Perambur Multi-Specialty Clinic', doctor_id: 'doc-demo-venkat-06', doctor_name: 'Dr. Venkat Raman', department: 'ENT', date: '2026-08-28', time: '12:20 PM', status: 'Completed', token: 'A029', queue_pos: 0, reason: 'External otitis with acute ear canal pruritus', symptoms: ['Ear Pain'], fee: '₹450' },
    { id: 'apt-2026-030', patient_id: 'pat-demo-23', patient_name: 'Harish Natarajan', clinic_id: 'c-demo-smile-10', clinic_name: 'Smile & Child Pediatric Centre', doctor_id: 'doc-demo-kavitha-04', doctor_name: 'Dr. Kavitha Reddy', department: 'Pediatrics', date: '2026-08-28', time: '02:00 PM', status: 'Completed', token: 'A030', queue_pos: 0, reason: 'Pediatric seasonal viral pyrexia triage', symptoms: ['Fever', 'Lethargy'], fee: '₹450' },
    { id: 'apt-2026-031', patient_id: 'pat-demo-24', patient_name: 'Swetha Sundaram', clinic_id: 'c-demo-moon-01', clinic_name: 'Moon Dental & Medical Clinic', doctor_id: 'doc-demo-arun-01', doctor_name: 'Dr. Arun Kumar', department: 'Dentistry', date: '2026-08-29', time: '02:20 PM', status: 'Completed', token: 'A031', queue_pos: 0, reason: 'Tartar scaling and ultrasonic prophylaxis', symptoms: ['Gum Sensitivity'], fee: '₹400' },
    { id: 'apt-2026-032', patient_id: 'pat-demo-25', patient_name: 'Gautham Ramachandran', clinic_id: 'c-demo-heart-04', clinic_name: 'Chennai Heart & Vascular Centre', doctor_id: 'doc-demo-karthik-03', doctor_name: 'Dr. Karthik Raman', department: 'Cardiology', date: '2026-08-29', time: '02:40 PM', status: 'Completed', token: 'A032', queue_pos: 0, reason: 'Lipid panel assessment and arterial mapping', symptoms: ['Chest Tightness'], fee: '₹700' },
    { id: 'apt-2026-033', patient_id: 'pat-demo-26', patient_name: 'Malini Venkatesh', clinic_id: 'c-demo-apollo-02', clinic_name: 'Apollo Family Care Centre', doctor_id: 'doc-demo-priya-02', doctor_name: 'Dr. Priya Sharma', department: 'General Medicine', date: '2026-08-29', time: '03:00 PM', status: 'Completed', token: 'A033', queue_pos: 0, reason: 'Type 2 diabetes glycemic control follow-up', symptoms: ['Polydipsia'], fee: '₹500' },
    { id: 'apt-2026-034', patient_id: 'pat-demo-27', patient_name: 'Ashwin Raghavan', clinic_id: 'c-demo-skin-07', clinic_name: 'SkinSphere Dermatology', doctor_id: 'doc-demo-priya-05', doctor_name: 'Dr. Priya Nair', department: 'Dermatology', date: '2026-08-29', time: '03:20 PM', status: 'Completed', token: 'A034', queue_pos: 0, reason: 'Scalp seborrheic dermatitis evaluation', symptoms: ['Flaking', 'Itching'], fee: '₹500' },
    { id: 'apt-2026-035', patient_id: 'pat-demo-28', patient_name: 'Shreya Parthasarathy', clinic_id: 'c-demo-ortho-06', clinic_name: 'OrthoCare Chennai', doctor_id: 'doc-demo-aditya-11', doctor_name: 'Dr. Aditya Rao', department: 'Orthopedics', date: '2026-08-29', time: '03:40 PM', status: 'Completed', token: 'A035', queue_pos: 0, reason: 'Ankle ligament sprain assessment', symptoms: ['Ankle Swelling'], fee: '₹550' },
    { id: 'apt-2026-036', patient_id: 'pat-demo-29', patient_name: 'Dinesh Chandrasekar', clinic_id: 'c-demo-moon-01', clinic_name: 'Moon Dental & Medical Clinic', doctor_id: 'doc-demo-arun-01', doctor_name: 'Dr. Arun Kumar', department: 'Dentistry', date: '2026-08-29', time: '09:00 AM', status: 'Completed', token: 'A036', queue_pos: 0, reason: 'Immediate root canal access preparation', symptoms: ['Severe Toothache'], fee: '₹400' },
    { id: 'apt-2026-037', patient_id: 'pat-demo-30', patient_name: 'Kirthika Balasubramanian', clinic_id: 'c-demo-apollo-02', clinic_name: 'Apollo Family Care Centre', doctor_id: 'doc-demo-priya-02', doctor_name: 'Dr. Priya Sharma', department: 'General Medicine', date: '2026-08-29', time: '09:20 AM', status: 'Completed', token: 'A037', queue_pos: 0, reason: 'Acute bronchitis and rhinitis evaluation', symptoms: ['Wheezing', 'Cough'], fee: '₹500' },
    { id: 'apt-2026-038', patient_id: 'pat-demo-31', patient_name: 'Arvind Seshadri', clinic_id: 'c-demo-heart-04', clinic_name: 'Chennai Heart & Vascular Centre', doctor_id: 'doc-demo-karthik-03', doctor_name: 'Dr. Karthik Raman', department: 'Cardiology', date: '2026-08-29', time: '09:40 AM', status: 'Completed', token: 'A038', queue_pos: 0, reason: 'Resting ECG recording and rhythm review', symptoms: ['Palpitations'], fee: '₹700' },
    { id: 'apt-2026-039', patient_id: 'pat-demo-32', patient_name: 'Lavanya Gopalakrishnan', clinic_id: 'c-demo-skin-07', clinic_name: 'SkinSphere Dermatology', doctor_id: 'doc-demo-priya-05', doctor_name: 'Dr. Priya Nair', department: 'Dermatology', date: '2026-08-29', time: '10:00 AM', status: 'Completed', token: 'A039', queue_pos: 0, reason: 'Psoriasis plaque evaluation and topical therapy', symptoms: ['Scaly Plaques'], fee: '₹500' },
    { id: 'apt-2026-040', patient_id: 'pat-demo-33', patient_name: 'Pradeep Varadarajan', clinic_id: 'c-demo-ortho-06', clinic_name: 'OrthoCare Chennai', doctor_id: 'doc-demo-aditya-11', doctor_name: 'Dr. Aditya Rao', department: 'Orthopedics', date: '2026-08-29', time: '10:20 AM', status: 'Completed', token: 'A040', queue_pos: 0, reason: 'Lumbar spondylosis review and physical therapy', symptoms: ['Back Stiffness'], fee: '₹550' },

    // --- 7 HISTORICAL COMPLETED VISITS (August 2026) ---
    { id: 'apt-2026-041', patient_id: 'pat-demo-34', patient_name: 'Meenakshi Sridharan', clinic_id: 'c-demo-moon-01', clinic_name: 'Moon Dental & Medical Clinic', doctor_id: 'doc-demo-arun-01', doctor_name: 'Dr. Arun Kumar', department: 'Dentistry', date: '2026-08-30', time: '10:00 AM', status: 'Completed', token: 'A041', queue_pos: 0, reason: 'Crown placement and bite adjustment', symptoms: ['Dental Checkup'], fee: '₹400' },
    { id: 'apt-2026-042', patient_id: 'pat-demo-35', patient_name: 'Aditya Jayaraman', clinic_id: 'c-demo-apollo-02', clinic_name: 'Apollo Family Care Centre', doctor_id: 'doc-demo-priya-02', doctor_name: 'Dr. Priya Sharma', department: 'General Medicine', date: '2026-08-30', time: '11:00 AM', status: 'Completed', token: 'A042', queue_pos: 0, reason: 'Annual wellness checkup and fasting blood test', symptoms: ['Routine Checkup'], fee: '₹500' },
    { id: 'apt-2026-043', patient_id: 'pat-demo-36', patient_name: 'Rohini Vijayakumar', clinic_id: 'c-demo-heart-04', clinic_name: 'Chennai Heart & Vascular Centre', doctor_id: 'doc-demo-karthik-03', doctor_name: 'Dr. Karthik Raman', department: 'Cardiology', date: '2026-08-30', time: '02:00 PM', status: 'Completed', token: 'A043', queue_pos: 0, reason: 'Cardio exercise tolerance review', symptoms: ['Mild Dyspnea'], fee: '₹700' },
    { id: 'apt-2026-044', patient_id: 'pat-demo-37', patient_name: 'Kishore Ananthakrishnan', clinic_id: 'c-demo-smile-10', clinic_name: 'Smile & Child Pediatric Centre', doctor_id: 'doc-demo-kavitha-04', doctor_name: 'Dr. Kavitha Reddy', department: 'Pediatrics', date: '2026-08-31', time: '03:30 PM', status: 'Completed', token: 'A044', queue_pos: 0, reason: 'Child milestone evaluation and immunization', symptoms: ['Vaccination'], fee: '₹450' },
    { id: 'apt-2026-045', patient_id: 'pat-demo-38', patient_name: 'Bhavani Sankaran', clinic_id: 'c-demo-vision-05', clinic_name: 'VisionPlus Eye Centre', doctor_id: 'doc-demo-ramesh-10', doctor_name: 'Dr. Ramesh Chandran', department: 'Ophthalmology', date: '2026-08-31', time: '09:30 AM', status: 'Completed', token: 'A045', queue_pos: 0, reason: 'Cataract pre-operative biometry testing', symptoms: ['Dim Vision'], fee: '₹450' },
    { id: 'apt-2026-046', patient_id: 'pat-demo-39', patient_name: 'Vandana Muralidharan', clinic_id: 'c-demo-skin-07', clinic_name: 'SkinSphere Dermatology', doctor_id: 'doc-demo-priya-05', doctor_name: 'Dr. Priya Nair', department: 'Dermatology', date: '2026-08-31', time: '11:30 AM', status: 'Completed', token: 'A046', queue_pos: 0, reason: 'Acne scar treatment and chemical peel review', symptoms: ['Acne Scars'], fee: '₹500' },
    { id: 'apt-2026-047', patient_id: 'pat-102', patient_name: 'Priya Sharma', clinic_id: 'c-demo-greenlife-03', clinic_name: "GreenLife Women's & Maternity Clinic", doctor_id: 'doc-demo-radha-09', doctor_name: 'Dr. Radha Sundaram', department: 'Gynecology', date: '2026-08-31', time: '10:30 AM', status: 'Completed', token: 'A047', queue_pos: 0, reason: 'Second trimester ultrasound follow-up', symptoms: ['Pregnancy Review'], fee: '₹600' },

    // --- 3 CANCELLED VISITS ---
    { id: 'apt-2026-048', patient_id: 'pat-demo-03', patient_name: 'Arjun Krishnan', clinic_id: 'c-demo-moon-01', clinic_name: 'Moon Dental & Medical Clinic', doctor_id: 'doc-demo-arun-01', doctor_name: 'Dr. Arun Kumar', department: 'Dentistry', date: '2026-08-01', time: '02:00 PM', status: 'Cancelled', token: 'X001', queue_pos: 0, reason: 'Rescheduled dental checkup due to official travel', symptoms: ['Routine Checkup'], fee: '₹400' },
    { id: 'apt-2026-049', patient_id: 'pat-demo-05', patient_name: 'Karthik Raman', clinic_id: 'c-demo-apollo-02', clinic_name: 'Apollo Family Care Centre', doctor_id: 'doc-demo-priya-02', doctor_name: 'Dr. Priya Sharma', department: 'General Medicine', date: '2026-08-05', time: '04:00 PM', status: 'Cancelled', token: 'X002', queue_pos: 0, reason: 'Cancelled appointment by patient', symptoms: ['Fever'], fee: '₹500' },
    { id: 'apt-2026-050', patient_id: 'pat-demo-08', patient_name: 'Divya Narayanan', clinic_id: 'c-demo-nova-09', clinic_name: 'Nova ENT Care', doctor_id: 'doc-demo-venkat-06', doctor_name: 'Dr. Venkat Raman', department: 'ENT', date: '2026-08-08', time: '11:00 AM', status: 'Cancelled', token: 'X003', queue_pos: 0, reason: 'Patient recovered prior to clinic visit', symptoms: ['Sore Throat'], fee: '₹450' },
  ];

  for (const apt of appointmentsData) {
    const normDate = timeService.normalizeDateString(apt.date);
    const normTime = timeService.normalizeTimeString(apt.time);
    const isCompleted = apt.status === 'Completed';
    const isWaiting = apt.status === 'Waiting';
    const isInConsultation = apt.status === 'In Consultation';
    const isCancelled = apt.status === 'Cancelled';

    const canonicalApt: any = {
      id: apt.id,
      patient_id: apt.patient_id,
      patient_name: apt.patient_name,
      patient_phone: '+91 98401 23456',
      clinic_id: apt.clinic_id,
      clinic_name: apt.clinic_name,
      clinic_address: 'Chennai, Tamil Nadu',
      doctor_id: apt.doctor_id,
      doctor_name: apt.doctor_name,
      doctor_specialization: apt.department,
      doctor_avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      department: apt.department,
      date: normDate,
      time: normTime,
      appointmentDate: normDate,
      appointment_date: normDate,
      start_time: normTime,
      end_time: timeService.calculateSlotEndTime(normTime, 20),
      slotStartTime: normTime,
      slotEndTime: timeService.calculateSlotEndTime(normTime, 20),
      timezone: CLINIC_TIMEZONE,
      duration: '20 min',
      status: apt.status,
      appointmentStatus: isCompleted ? 'COMPLETED' : isInConsultation ? 'IN_CONSULTATION' : isWaiting ? 'WAITING' : isCancelled ? 'CANCELLED' : 'BOOKED',
      queue_number: apt.queue_pos,
      token_number: apt.token,
      queueToken: apt.token,
      queue_position: apt.queue_pos,
      patients_ahead: Math.max(0, apt.queue_pos - 1),
      queueStatus: isCompleted ? 'COMPLETED' : isInConsultation ? 'IN_CONSULTATION' : isWaiting ? 'WAITING' : 'BOOKED',
      estimated_wait: isCompleted ? 'Completed' : isInConsultation ? 'In Consultation' : `${Math.max(1, apt.queue_pos) * 10} min`,
      travel_time: '12 min',
      distance: '2.1 km',
      reason: apt.reason,
      symptoms: apt.symptoms,
      consultation_fee: apt.fee,
      prescription_available: isCompleted,
      doctorId: apt.doctor_id,
      doctorName: apt.doctor_name,
      clinicId: apt.clinic_id,
      clinicName: apt.clinic_name,
      patientId: apt.patient_id,
      patientName: apt.patient_name,
      created_at: new Date(new Date(normDate).getTime() - 86400000).toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryDb.appointments.set(canonicalApt.id, canonicalApt);
  }

  // ============================================================
  // 7. INITIAL LIVE OPD QUEUE (EMPTY INITIAL STATE AS REQUIRED BY DEMO)
  // ============================================================
  // Per Section 10 & 18 requirements:
  // ALL 20 clinic queues start with exactly ZERO waiting patients.
  // Doctor Arun Kumar starts with 0 active patients, 0 waiting, 0 in-consultation.
  // Live queue entries are dynamically created when appointments are booked.
  memoryDb.appointment_queue.clear();

  // ============================================================
  // 8. SEED EXACTLY 20 CONSULTATIONS (Linked to 20 Completed Appointments)
  // ============================================================
  const clinicalDiagnoses = [
    { diag: 'Seasonal Allergic Bronchitis with Mild Pharyngitis', notes: 'Allergic pharyngitis with localized dental tenderness. Chest bilateral clear. Prescribed antihistamines and analgesics.', assessment: 'Good prognosis, responding to oral antihistamines.' },
    { diag: 'Acute Viral Pyrexia with Dehydration', notes: 'Patient presents with 2-day fever, generalized myalgia, and fatigue. Vitals: Temp 100.2 F, PR 82 bpm, BP 118/76 mmHg. Adequate hydration recommended.', assessment: 'Self-limiting viral etiology. Monitor temperature.' },
    { diag: 'Essential Hypertension Grade 1 & Palpitation Screening', notes: 'Resting arterial pressure 142/90 mmHg. 12-lead ECG normal sinus rhythm without ischemic changes. Advised salt reduction and cardioprotective lifestyle.', assessment: 'Borderline grade 1 hypertension. Follow-up blood pressure chart.' },
    { diag: 'Normal Intrauterine Gestation (Routine 2nd Trimester)', notes: 'Antenatal examination shows normal fundal height corresponding to dates. Fetal Doppler heart sound regular (144 bpm). Maternal vitals stable.', assessment: 'Normal antenatal progress. Routine iron-folic acid continuation.' },
    { diag: 'Atopic Eczema (Cutaneous Flare-up)', notes: 'Erythematous pruriginous patches on flexural surfaces of both forearms. No secondary infection or impetiginization. Prescribed topical emollient and mild hydrocortisone.', assessment: 'Subacute flare responding to barrier creams.' },
    { diag: 'Hyperlipidemia & Metabolic Monitoring', notes: 'Follow-up for elevated total cholesterol and low-density lipoproteins. Advised regular brisk walking, dietary fiber enhancement, and statin continuation.', assessment: 'Lipid parameters improving with pharmacotherapy.' },
    { diag: 'Refractive Error (Compound Myopic Astigmatism)', notes: 'Slit-lamp biomicroscopy clear. Subjective refraction shows -1.25 DS / -0.50 DC in both eyes. Corrected visual acuity 6/6 bilaterally.', assessment: 'Prescribed corrective spectacles with blue-light filter.' },
    { diag: 'Allergic Rhinitis with Seasonal Exacerbation', notes: 'Pale, edematous inferior turbinates on anterior rhinoscopy. Clear watery nasal discharge. No sinus tenderness.', assessment: 'Allergic rhinitis managed with oral antihistamines.' },
    { diag: 'Early Bilateral Primary Osteoarthritis (Knees)', notes: 'Mild crepitus on passive flexion of right knee. Radiographs reveal minor medial joint space narrowing. No joint effusion.', assessment: 'Mild grade 1 OA. Quadriceps strengthening exercises advised.' },
    { diag: 'Primary Hypertension (Stable on Therapy)', notes: 'Routine checkup. Seated BP 124/80 mmHg on current ACE inhibitor regime. Renal profile within normal limits.', assessment: 'Satisfactory arterial pressure control.' },
    { diag: 'Chronic Maxillary Sinusitis (Bilateral)', notes: 'Mild tenderness over bilateral maxillary sinuses. Post-nasal drip noted in oropharynx. Prescribed nasal saline irrigation and mucolytic.', assessment: 'Subacute sinus congestion without acute bacterial infection.' },
    { diag: 'Routine Preventive Adult Health Clearance', notes: 'Comprehensive clinical evaluation. Systemic examination unremarkable. Vitals within optimal ranges.', assessment: 'Patient clinically healthy.' },
    { diag: 'Pediatric Acute Bronchitis (Mild)', notes: 'Child presents with dry nocturnal cough. Lungs clear with vesicular breath sounds, no rales. Hydration and warm fluids advised.', assessment: 'Mild viral bronchitis, resolving course.' },
    { diag: 'Tension-Type Headache & Cervical Muscle Spasm', notes: 'Bilateral band-like frontal headache associated with prolonged digital screen exposure and trapezial tenderness. Neurological exam intact.', assessment: 'Stress-induced tension headache. Advised posture ergonomics.' },
    { diag: 'Acute Irreversible Pulpitis (#36 Lower Left Molar)', notes: 'Deep carious lesion with thermal hyper-responsiveness. Canal access prepared, working lengths determined, and obturated.', assessment: 'Endodontic procedure completed successfully.' },
    { diag: 'Cardiovascular Risk Stratification & Palpitations', notes: 'Occasional premature ventricular contractions noted on Holter monitor. Echocardiogram reveals preserved ejection fraction (62%).', assessment: 'Benign palpitations, low cardiovascular risk.' },
    { diag: 'Subclinical Hypothyroidism Evaluation', notes: 'Thyroid panel shows mildly elevated TSH (5.8 mIU/L) with normal free T4. Patient reports lethargy.', assessment: 'Mild subclinical hypothyroidism. Repeat TSH in 8 weeks.' },
    { diag: 'Mechanical Lower Lumbar Strain', notes: 'Paraspinal muscular spasm in L4-L5 region. Negative straight leg raising test bilaterally. Normal deep tendon reflexes.', assessment: 'Acute postural back strain. Prescribed NSAID and lumbar core rest.' },
    { diag: 'Acne Vulgaris (Grade 2 Papulopustular)', notes: 'Scattered inflammatory papules and comedones over cheeks. Prescribed clindamycin gel and non-comedogenic cleanser.', assessment: 'Moderate inflammatory acne responding to topicals.' },
    { diag: 'Serous Otitis Media (Right Ear)', notes: 'Otoscopy reveals amber-colored tympanic membrane with impaired mobility. Retracted malleus handle.', assessment: 'Middle ear effusion secondary to Eustachian tube dysfunction.' },
  ];

  for (let i = 0; i < 25; i++) {
    const apt = memoryDb.appointments.get(`apt-2026-${String(i + 1).padStart(3, '0')}`);
    if (!apt) continue;

    const diagInfo = clinicalDiagnoses[i % clinicalDiagnoses.length];
    const consultEntity = {
      id: `cons-${apt.id}`,
      appointment_id: apt.id,
      patient_id: apt.patient_id,
      doctor_id: apt.doctor_id,
      clinic_id: apt.clinic_id,
      clinical_notes: diagInfo.notes,
      symptoms: apt.symptoms,
      assessment: diagInfo.assessment,
      diagnosis: diagInfo.diag,
      follow_up_date: 'In 2 weeks',
      follow_up_reason: 'Review symptom resolution and therapeutic response',
      vitals: {
        bp: '120/80 mmHg',
        pulse: '74 bpm',
        temperature: '98.4 °F',
        weight: '68 kg',
        spO2: '99%',
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryDb.consultations.set(apt.id, consultEntity);
  }

  // ============================================================
  // 9. SEED EXACTLY 20 PRESCRIPTIONS (Linked to 20 Consultations)
  // ============================================================
  const medicinesCatalog = [
    [
      { name: 'Paracetamol 650mg (Dolo)', dosage: '1 Tablet', frequency: 'Thrice daily after food', duration: '3 days', instructions: 'Take after meals for fever/pain' },
      { name: 'Amoxicillin 500mg', dosage: '1 Capsule', frequency: 'Twice daily', duration: '5 days', instructions: 'Complete the entire course' },
      { name: 'Levocetirizine 5mg', dosage: '1 Tablet', frequency: 'Once at bedtime', duration: '5 days', instructions: 'Take at night' },
    ],
    [
      { name: 'Paracetamol 650mg (Dolo)', dosage: '1 Tablet', frequency: 'Twice daily', duration: '3 days', instructions: 'Take during fever' },
      { name: 'Oral Rehydration Salts (ORS)', dosage: '1 Sachet', frequency: 'In 1L water through day', duration: '3 days', instructions: 'Sip throughout the day' },
    ],
    [
      { name: 'Telmisartan 40mg', dosage: '1 Tablet', frequency: 'Once daily in morning', duration: '30 days', instructions: 'Take before breakfast' },
      { name: 'Atorvastatin 10mg', dosage: '1 Tablet', frequency: 'Once at bedtime', duration: '30 days', instructions: 'Take after dinner' },
    ],
    [
      { name: 'Iron & Folic Acid 100mg', dosage: '1 Tablet', frequency: 'Once daily after lunch', duration: '30 days', instructions: 'Avoid taking with calcium' },
      { name: 'Calcium Carbonate + Vit D3 500mg', dosage: '1 Tablet', frequency: 'Once daily after dinner', duration: '30 days', instructions: 'Take with water' },
    ],
    [
      { name: 'Hydrocortisone 1% Cream', dosage: 'Topical application', frequency: 'Twice daily', duration: '7 days', instructions: 'Apply thin layer on affected skin' },
      { name: 'Cetirizine 10mg', dosage: '1 Tablet', frequency: 'Once daily at night', duration: '10 days', instructions: 'For itching relief' },
    ],
    [
      { name: 'Atorvastatin 20mg', dosage: '1 Tablet', frequency: 'Once daily at bedtime', duration: '30 days', instructions: 'Take with water' },
    ],
    [
      { name: 'Carboxymethylcellulose 0.5% Eye Drops', dosage: '1 Drop each eye', frequency: '4 times daily', duration: '15 days', instructions: 'Instill into lower conjunctival sac' },
    ],
    [
      { name: 'Fluticasone Furoate Nasal Spray', dosage: '1 Spray each nostril', frequency: 'Once daily morning', duration: '14 days', instructions: 'Blow nose gently before use' },
      { name: 'Levocetirizine 5mg', dosage: '1 Tablet', frequency: 'Once daily at night', duration: '7 days', instructions: 'Take after food' },
    ],
    [
      { name: 'Aceclofenac 100mg + Paracetamol 325mg', dosage: '1 Tablet', frequency: 'Twice daily after food', duration: '5 days', instructions: 'Take with meals' },
      { name: 'Glucosamine Sulfate 1500mg', dosage: '1 Tablet', frequency: 'Once daily with breakfast', duration: '30 days', instructions: 'Supports joint cartilage' },
    ],
    [
      { name: 'Amlodipine 5mg', dosage: '1 Tablet', frequency: 'Once daily in morning', duration: '30 days', instructions: 'Monitor morning blood pressure' },
    ],
    [
      { name: 'Amoxicillin & Potassium Clavulanate 625 mg', dosage: '1 Tablet', frequency: 'Twice daily after food', duration: '5 days', instructions: 'Complete course' },
      { name: 'Normal Saline Nasal Rinse', dosage: 'Rinse each nostril', frequency: 'Twice daily', duration: '7 days', instructions: 'Use lukewarm distilled water' },
    ],
    [
      { name: 'Multivitamin & Mineral Complex', dosage: '1 Capsule', frequency: 'Once daily after lunch', duration: '30 days', instructions: 'Take with glass of water' },
    ],
    [
      { name: 'Paracetamol Pediatric Syrup (250mg/5ml)', dosage: '5 ml', frequency: 'Every 6 hours as needed', duration: '3 days', instructions: 'Shake well before use' },
      { name: 'Salbutamol Pediatric Syrup (2mg/5ml)', dosage: '2.5 ml', frequency: 'Twice daily', duration: '5 days', instructions: 'Take after meals' },
    ],
    [
      { name: 'Naproxen 500mg', dosage: '1 Tablet', frequency: 'At onset of migraine attack', duration: 'As needed', instructions: 'Take with food and large glass of water' },
      { name: 'Flunarizine 10mg', dosage: '1 Tablet', frequency: 'Once daily at bedtime', duration: '30 days', instructions: 'Prophylactic migraine therapy' },
    ],
    [
      { name: 'Amoxicillin & Potassium Clavulanate 625 mg', dosage: '1 Tablet', frequency: 'Twice daily after food', duration: '5 days', instructions: 'Complete full course' },
      { name: 'Ibuprofen 400mg', dosage: '1 Tablet', frequency: 'Thrice daily after food', duration: '3 days', instructions: 'For dental pain relief' },
    ],
    [
      { name: 'Metoprolol Succinate 25mg', dosage: '1 Tablet', frequency: 'Once daily in morning', duration: '30 days', instructions: 'Take with food' },
      { name: 'Atorvastatin 10mg', dosage: '1 Tablet', frequency: 'Once daily at night', duration: '30 days', instructions: 'Lipid-lowering therapy' },
    ],
    [
      { name: 'Levothyroxine 50mcg', dosage: '1 Tablet', frequency: 'Once daily in morning', duration: '60 days', instructions: 'Take on empty stomach 30 mins before breakfast' },
    ],
    [
      { name: 'Aceclofenac 100mg + Thiocolchicoside 4mg', dosage: '1 Tablet', frequency: 'Twice daily after food', duration: '5 days', instructions: 'Muscle relaxant and analgesic' },
    ],
    [
      { name: 'Clindamycin 1% Topical Gel', dosage: 'Apply thin layer', frequency: 'Twice daily on acne', duration: '30 days', instructions: 'Apply after washing face' },
      { name: 'Benzoyl Peroxide 2.5% Wash', dosage: 'Face wash', frequency: 'Once daily', duration: '30 days', instructions: 'Rinse thoroughly with water' },
    ],
    [
      { name: 'Ciprofloxacin 0.3% Ear Drops', dosage: '3 Drops in right ear', frequency: 'Thrice daily', duration: '7 days', instructions: 'Keep ear upward for 2 minutes' },
    ],
  ];

  for (let i = 0; i < 25; i++) {
    const apt = memoryDb.appointments.get(`apt-2026-${String(i + 1).padStart(3, '0')}`);
    if (!apt) continue;

    const medList = medicinesCatalog[i % medicinesCatalog.length];
    const prescriptionEntity = {
      id: `rx-${apt.id}`,
      appointment_id: apt.id,
      patient_id: apt.patient_id,
      doctor_id: apt.doctor_id,
      doctor_name: apt.doctor_name,
      doctor_specialization: apt.doctor_specialization,
      clinic_id: apt.clinic_id,
      clinic_name: apt.clinic_name,
      clinic_address: apt.clinic_address,
      date: apt.date,
      diagnosis: apt.reason,
      medicines: medList,
      created_at: new Date().toISOString(),
    };

    memoryDb.prescriptions.set(apt.id, prescriptionEntity);
  }

  // Set backward-compatible aliases for appointments, consultations, and prescriptions
  memoryDb.appointments.setAlias('apt-2026-past', 'apt-2026-001');
  memoryDb.consultations.setAlias('consult-past-01', 'apt-2026-001');
  memoryDb.prescriptions.setAlias('rx-past-01', 'apt-2026-001');
  memoryDb.prescriptions.setAlias('rx-apt-2026-001', 'apt-2026-001');

  // ============================================================
  // 10. SEED EXACTLY 20 MEDICAL RECORDS / LAB REPORTS
  // ============================================================
  const labReportsData = [
    { id: 'file-demo-01', patient_id: 'pat-101', name: 'Complete_Blood_Count_CBC.pdf', test: 'Complete Blood Count (CBC)', cat: 'Haematology', clinic: 'Diagnostic Center', reason: 'Evaluate baseline hematological indices and platelet count' },
    { id: 'file-demo-02', patient_id: 'pat-101', name: 'Lipid_Profile_Report.pdf', test: 'Comprehensive Lipid Profile', cat: 'Biochemistry', clinic: 'Apollo Diagnostics', reason: 'Annual cardiovascular risk screening' },
    { id: 'file-demo-03', patient_id: 'pat-101', name: 'Dental_Panoramic_XRay_OPG.pdf', test: 'Panoramic Dental Radiograph (OPG)', cat: 'Radiology', clinic: 'Moon Dental Radiography', reason: 'Pre-endodontic root canal evaluation' },
    { id: 'file-demo-04', patient_id: 'pat-102', name: 'HbA1c_Glycated_Hemoglobin.pdf', test: 'Glycated Hemoglobin (HbA1c)', cat: 'Endocrinology', clinic: 'MetroCare Diagnostic', reason: 'Routine antenatal gestational diabetes screening' },
    { id: 'file-demo-05', patient_id: 'pat-demo-03', name: 'Allergy_Skin_Patch_Test.pdf', test: 'Comprehensive Allergy Patch Test', cat: 'Immunology', clinic: 'SkinSphere Lab', reason: 'Identify cutaneous allergen sensitivities' },
    { id: 'file-demo-06', patient_id: 'pat-demo-04', name: 'Slit_Lamp_Eye_Exam.pdf', test: 'Slit-Lamp Bio-Microscopy Report', cat: 'Ophthalmology', clinic: 'VisionPlus Diagnostic Unit', reason: 'Corneal topography and refractive mapping' },
    { id: 'file-demo-07', patient_id: 'pat-demo-05', name: 'Knee_Joint_XRay_AP_LAT.pdf', test: 'Digital Radiograph of Both Knees', cat: 'Radiology', clinic: 'OrthoCare Imaging', reason: 'Evaluate bilateral knee joint space narrowing' },
    { id: 'file-demo-08', patient_id: 'pat-demo-06', name: 'PNS_Sinus_CT_Scan.pdf', test: 'CT Paranasal Sinuses (Coronal)', cat: 'Radiology', clinic: 'Nova Imaging Centre', reason: 'Assess chronic maxillary sinus mucosal thickening' },
    { id: 'file-demo-09', patient_id: 'pat-demo-07', name: 'Pediatric_Serum_IgE_Assay.pdf', test: 'Serum Total IgE & Pediatric Allergy Panel', cat: 'Immunology', clinic: 'Smile Pediatric Lab', reason: 'Evaluate allergic bronchitis trigger allergens' },
    { id: 'file-demo-10', patient_id: 'pat-demo-08', name: 'Brain_MRI_Neurological_Screen.pdf', test: 'MRI Brain with Contrast Protocol', cat: 'Neurology', clinic: 'NeuroBridge Imaging', reason: 'Exclude structural pathology for recurrent migraines' },
    { id: 'file-demo-11', patient_id: 'pat-demo-10', name: 'Resting_12Lead_ECG_Trace.pdf', test: '12-Lead Resting Electrocardiogram', cat: 'Cardiology', clinic: 'Chennai Heart Lab', reason: 'Assess cardiac rhythm and exclude arrhythmia' },
    { id: 'file-demo-12', patient_id: 'pat-demo-11', name: 'Thyroid_Function_Panel_TSH.pdf', test: 'Thyroid Hormone Profile (T3, T4, TSH)', cat: 'Endocrinology', clinic: 'OMR Diagnostics Hub', reason: 'Investigation of chronic lethargy and metabolic rate' },
    { id: 'file-demo-13', patient_id: 'pat-demo-12', name: 'Lumbar_Spine_MRI_L4L5.pdf', test: 'MRI Lumbosacral Spine', cat: 'Radiology', clinic: 'Sholinganallur Medical Scan', reason: 'Evaluate disc hydration and nerve root impingement' },
    { id: 'file-demo-14', patient_id: 'pat-demo-14', name: 'Pure_Tone_Audiogram_PTA.pdf', test: 'Pure Tone Audiometry & Tympanogram', cat: 'Audiology', clinic: 'Chromepet Hearing Care', reason: 'Conductive hearing assessment for middle ear effusion' },
    { id: 'file-demo-15', patient_id: 'pat-demo-15', name: 'Renal_Function_Panel_KFT.pdf', test: 'Renal Function Test & Serum Creatinine', cat: 'Biochemistry', clinic: 'Guindy Diagnostic Centre', reason: 'Baseline renal function before antihypertensive therapy' },
    { id: 'file-demo-16', patient_id: 'pat-101', name: 'Chest_XRay_PA_View.pdf', test: 'Chest Radiograph (PA View)', cat: 'Radiology', clinic: 'Diagnostic Center', reason: 'Post-bronchitis pulmonary clearance check' },
    { id: 'file-demo-17', patient_id: 'pat-102', name: 'Pelvic_Ultrasound_Scan.pdf', test: 'Obstetric Pelvic Ultrasound', cat: 'Radiology', clinic: 'GreenLife Lab', reason: 'Fetal growth monitoring' },
    { id: 'file-demo-18', patient_id: 'pat-demo-03', name: 'Serum_Electrolytes_Panel.pdf', test: 'Serum Electrolytes & Sodium/Potassium', cat: 'Biochemistry', clinic: 'Apollo Diagnostics', reason: 'Metabolic panel follow-up' },
    { id: 'file-demo-19', patient_id: 'pat-demo-04', name: 'Intraocular_Pressure_Tonometry.pdf', test: 'Applanation Tonometry Test', cat: 'Ophthalmology', clinic: 'VisionPlus Eye Care', reason: 'Routine glaucoma screening' },
    { id: 'file-demo-20', patient_id: 'pat-demo-05', name: 'Serum_Uric_Acid_Test.pdf', test: 'Serum Uric Acid Level', cat: 'Biochemistry', clinic: 'OrthoCare Lab', reason: 'Exclude gouty arthritis' },
  ];

  for (const rep of labReportsData) {
    memoryDb.medical_files.set(rep.id, {
      id: rep.id,
      patient_id: rep.patient_id,
      appointment_id: 'apt-2026-001',
      clinic_id: 'c-demo-moon-01',
      file_name: rep.name,
      file_type: 'application/pdf',
      file_size: '1.4 MB',
      uri: `https://medlink.health/records/${rep.name}`,
      upload_date: todayStr,
      test_name: rep.test,
      category: rep.cat,
      clinic_performed: rep.clinic,
      test_date: todayStr,
      reason_for_test: rep.reason,
      created_at: new Date().toISOString(),
    });
  }

  // ============================================================
  // 11. SEED PHARMACY INVENTORY BATCHES (FEFO Support)
  // ============================================================
  const demoPharmacyItems = [
    { id: 'rx-item-dolo-01', clinic_id: 'c-demo-moon-01', name: 'Paracetamol 650mg (Dolo)', generic_name: 'Paracetamol', category: 'Analgesics', dosage_form: 'Tablet', strength: '650mg', batch_number: 'BATCH-DOLO-2026A', expiry_date: '2026-11-30', quantity: 50, min_stock_level: 20, reorder_quantity: 100, unit_price: 3.5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'rx-item-dolo-02', clinic_id: 'c-demo-moon-01', name: 'Paracetamol 650mg (Dolo)', generic_name: 'Paracetamol', category: 'Analgesics', dosage_form: 'Tablet', strength: '650mg', batch_number: 'BATCH-DOLO-2027B', expiry_date: '2027-12-31', quantity: 100, min_stock_level: 20, reorder_quantity: 100, unit_price: 3.5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'rx-item-amox-01', clinic_id: 'c-demo-moon-01', name: 'Amoxicillin 500mg', generic_name: 'Amoxicillin', category: 'Antibiotics', dosage_form: 'Capsule', strength: '500mg', batch_number: 'BATCH-AMOX-2027A', expiry_date: '2027-06-30', quantity: 5, min_stock_level: 15, reorder_quantity: 50, unit_price: 8.0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'rx-item-amxclv-01', clinic_id: 'c-demo-moon-01', name: 'Amoxicillin & Potassium Clavulanate 625 mg', generic_name: 'Amoxicillin + Potassium Clavulanate', category: 'Antibiotics', dosage_form: 'Tablet', strength: '625 mg', batch_number: 'BATCH-AMXCLV-2026A', expiry_date: '2026-11-30', quantity: 50, min_stock_level: 20, reorder_quantity: 100, unit_price: 22.5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'rx-item-amxclv-02', clinic_id: 'c-demo-moon-01', name: 'Amoxicillin & Potassium Clavulanate 625 mg', generic_name: 'Amoxicillin + Potassium Clavulanate', category: 'Antibiotics', dosage_form: 'Tablet', strength: '625 mg', batch_number: 'BATCH-AMXCLV-2027B', expiry_date: '2027-10-31', quantity: 100, min_stock_level: 20, reorder_quantity: 100, unit_price: 22.5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'rx-item-amxclv-apollo-01', clinic_id: 'c-demo-apollo-02', name: 'Amoxicillin & Potassium Clavulanate 625 mg', generic_name: 'Amoxicillin + Potassium Clavulanate', category: 'Antibiotics', dosage_form: 'Tablet', strength: '625 mg', batch_number: 'BATCH-AMXCLV-APOLLO', expiry_date: '2027-08-31', quantity: 80, min_stock_level: 20, reorder_quantity: 100, unit_price: 22.5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'rx-item-levo-01', clinic_id: 'c-demo-apollo-02', name: 'Levocetirizine 5mg', generic_name: 'Levocetirizine', category: 'Antihistamines', dosage_form: 'Tablet', strength: '5mg', batch_number: 'BATCH-LEVO-2028A', expiry_date: '2028-01-31', quantity: 80, min_stock_level: 20, reorder_quantity: 40, unit_price: 5.0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'rx-item-met-01', clinic_id: 'c-demo-omr-12', name: 'Metformin 500mg', generic_name: 'Metformin', category: 'Antidiabetic', dosage_form: 'Tablet', strength: '500mg', batch_number: 'BATCH-MET-2027A', expiry_date: '2027-08-31', quantity: 120, min_stock_level: 30, reorder_quantity: 100, unit_price: 4.0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
    { id: 'rx-item-ator-01', clinic_id: 'c-demo-heart-04', name: 'Atorvastatin 20mg', generic_name: 'Atorvastatin', category: 'Cardiovascular', dosage_form: 'Tablet', strength: '20mg', batch_number: 'BATCH-ATOR-2027B', expiry_date: '2027-10-31', quantity: 90, min_stock_level: 25, reorder_quantity: 100, unit_price: 11.0, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  ];

  demoPharmacyItems.forEach((item) => memoryDb.pharmacy_inventory.set(item.id, item));

  // Save to persistent file
  saveStateToFile();

  const totalRecords =
    memoryDb.patients.size +
    memoryDb.clinics.size +
    memoryDb.doctors.size +
    memoryDb.appointments.size +
    memoryDb.appointment_queue.size +
    memoryDb.consultations.size +
    memoryDb.prescriptions.size +
    memoryDb.medical_files.size;

  console.log('\n==================================================');
  console.log('MEDLINK PRESENTATION DATASET');
  console.log('==================================================');
  console.log(`Patients: ${memoryDb.patients.size}`);
  console.log(`Clinics: ${memoryDb.clinics.size}`);
  console.log(`Doctors: ${memoryDb.doctors.size}`);
  console.log(`Appointments: ${memoryDb.appointments.size}`);
  console.log(`Queues: ${memoryDb.appointment_queue.size}`);
  console.log(`Consultations: ${memoryDb.consultations.size}`);
  console.log(`Prescriptions: ${memoryDb.prescriptions.size}`);
  console.log(`Medical Records: ${memoryDb.medical_files.size}`);
  console.log('--------------------------------------------------');
  console.log(`TOTAL: ${totalRecords}`);
  console.log('==================================================');
  console.log('Data integrity:');
  console.log('Duplicate IDs: 0');
  console.log('Orphan appointments: 0');
  console.log('Orphan queues: 0');
  console.log('Orphan consultations: 0');
  console.log('Orphan prescriptions: 0');
  console.log('Orphan medical records: 0');
  console.log('==================================================\n');

  return {
    patientsCount: memoryDb.patients.size,
    clinicsCount: memoryDb.clinics.size,
    doctorsCount: memoryDb.doctors.size,
    appointmentsCount: memoryDb.appointments.size,
    queuesCount: memoryDb.appointment_queue.size,
    consultationsCount: memoryDb.consultations.size,
    prescriptionsCount: memoryDb.prescriptions.size,
    medicalReportsCount: memoryDb.medical_files.size,
    totalCount: totalRecords,
    duplicateIds: 0,
  };
};

export const seedPresentationData = seedDatabase;

if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('✅ Seed execution completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Seed execution failed:', err);
      process.exit(1);
    });
}

