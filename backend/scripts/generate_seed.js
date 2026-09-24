// Script to generate the comprehensive 17-clinic, 20-patient, multi-department seed.ts
const fs = require('fs');
const path = require('path');

const seedContent = `import bcrypt from 'bcryptjs';
import { memoryDb, saveStateToFile } from './db';
import { PatientEntity, ClinicEntity, DoctorEntity, DepartmentEntity, AppointmentEntity } from './models';
import { timeService, CLINIC_TIMEZONE } from '../services/timeService';

export const seedDatabase = async (): Promise<void> => {
  console.log('🌱 Seeding MedLink deterministic 20-user, 17-clinic multi-specialty demo dataset...');

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
  // 1. SEED 20 DEMO PATIENTS WITH AUTH ACCOUNTS
  // ============================================================
  const patientProfiles = [
    { id: 'pat-demo-01', name: 'Aarav Sharma', email: 'patient01@demo.medlink.test', phone: '+91 9000000001', age: 32, gender: 'Male', blood: 'B+', locality: 'Mylapore', address: '24, Luz Church Road, Mylapore, Chennai', spec: 'Dentistry', doc: 'Dr. Arun Kumar', contact: '+91 9000000091 (Pooja Sharma - Spouse)' },
    { id: 'pat-demo-02', name: 'Sneha Patel', email: 'patient02@demo.medlink.test', phone: '+91 9000000002', age: 29, gender: 'Female', blood: 'O+', locality: 'Adyar', address: '12, Gandhi Nagar 1st Main Rd, Adyar, Chennai', spec: 'General Medicine', doc: 'Dr. Priya Sharma', contact: '+91 9000000092 (Ramesh Patel - Father)' },
    { id: 'pat-demo-03', name: 'Rajesh Kumar', email: 'patient03@demo.medlink.test', phone: '+91 9000000003', age: 52, gender: 'Male', blood: 'A+', locality: 'T Nagar', address: '18, Venkatnarayana Road, T Nagar, Chennai', spec: 'Cardiology', doc: 'Dr. Karthik Raman', contact: '+91 9000000093 (Kavita Kumar - Spouse)' },
    { id: 'pat-demo-04', name: 'Priya Raman', email: 'patient04@demo.medlink.test', phone: '+91 9000000004', age: 28, gender: 'Female', blood: 'AB+', locality: 'Guindy', address: '154, Mount Road, Guindy, Chennai', spec: 'Pediatrics', doc: 'Dr. Kavitha Reddy', contact: '+91 9000000094 (Maya Raman - Mother)' },
    { id: 'pat-demo-05', name: 'Vikram Malhotra', email: 'patient05@demo.medlink.test', phone: '+91 9000000005', age: 45, gender: 'Male', blood: 'O-', locality: 'Velachery', address: '42, 100 Feet Bypass Road, Velachery, Chennai', spec: 'Dermatology', doc: 'Dr. Priya Nair', contact: '+91 9000000095 (Deepak Malhotra - Brother)' },
    { id: 'pat-demo-06', name: 'Ananya Iyer', email: 'patient06@demo.medlink.test', phone: '+91 9000000006', age: 31, gender: 'Female', blood: 'B-', locality: 'Anna Nagar', address: 'Plot 102, 2nd Avenue, Anna Nagar West, Chennai', spec: 'ENT', doc: 'Dr. Venkat Raman', contact: '+91 9000000096 (Raghav Iyer - Spouse)' },
    { id: 'pat-demo-07', name: 'Rahul Verma', email: 'patient07@demo.medlink.test', phone: '+91 9000000007', age: 38, gender: 'Male', blood: 'A-', locality: 'R.A. Puram', address: '77, Chamiers Road, R.A. Puram, Chennai', spec: 'Orthopedics', doc: 'Dr. Aditya Rao', contact: '+91 9000000097 (Lavanya Verma - Spouse)' },
    { id: 'pat-demo-08', name: 'Pooja Nair', email: 'patient08@demo.medlink.test', phone: '+91 9000000008', age: 26, gender: 'Female', blood: 'B+', locality: 'Kilpauk', address: '33, Ormes Road, Kilpauk, Chennai', spec: 'Gynecology', doc: 'Dr. Radha Sundaram', contact: '+91 9000000098 (Sarala Nair - Mother)' },
    { id: 'pat-demo-09', name: 'Karthik Subramanian', email: 'patient09@demo.medlink.test', phone: '+91 9000000009', age: 41, gender: 'Male', blood: 'O+', locality: 'Nungambakkam', address: '88, Sterling Road, Nungambakkam, Chennai', spec: 'Cardiology', doc: 'Dr. Karthik Raman', contact: '+91 9000000099 (Vidya Subramanian - Spouse)' },
    { id: 'pat-demo-10', name: 'Divya Krishnan', email: 'patient10@demo.medlink.test', phone: '+91 9000000010', age: 36, gender: 'Female', blood: 'A+', locality: 'Porur', address: '15, Mount Poonamallee Rd, Porur, Chennai', spec: 'Pediatrics', doc: 'Dr. Kavitha Reddy', contact: '+91 9000000100 (Hari Krishnan - Spouse)' },
    { id: 'pat-demo-11', name: 'Amit Shah', email: 'patient11@demo.medlink.test', phone: '+91 9000000011', age: 48, gender: 'Male', blood: 'B+', locality: 'Mogappair', address: '22, Nolambur Main Road, Mogappair, Chennai', spec: 'ENT', doc: 'Dr. Venkat Raman', contact: '+91 9000000101 (Chirag Shah - Brother)' },
    { id: 'pat-demo-12', name: 'Meera Joshi', email: 'patient12@demo.medlink.test', phone: '+91 9000000012', age: 24, gender: 'Female', blood: 'AB-', locality: 'Besant Nagar', address: '5th Avenue, Besant Nagar, Chennai', spec: 'Psychiatry', doc: 'Dr. Siddharth Sen', contact: '+91 9000000102 (Arvind Joshi - Father)' },
    { id: 'pat-demo-13', name: 'Rohan Gupta', email: 'patient13@demo.medlink.test', phone: '+91 9000000013', age: 33, gender: 'Male', blood: 'O+', locality: 'Aminjikarai', address: '64, Poonamallee High Rd, Aminjikarai, Chennai', spec: 'Orthopedics', doc: 'Dr. Aditya Rao', contact: '+91 9000000103 (Shweta Gupta - Spouse)' },
    { id: 'pat-demo-14', name: 'Sunita Reddy', email: 'patient14@demo.medlink.test', phone: '+91 9000000014', age: 58, gender: 'Female', blood: 'A+', locality: 'Saidapet', address: '9, Jeenis Road, Saidapet, Chennai', spec: 'Urology', doc: 'Dr. Dinesh Karthikeyan', contact: '+91 9000000104 (Varun Reddy - Son)' },
    { id: 'pat-demo-15', name: 'Suresh Menon', email: 'patient15@demo.medlink.test', phone: '+91 9000000015', age: 62, gender: 'Male', blood: 'B+', locality: 'Egmore', address: '44, Gandhi Irwin Road, Egmore, Chennai', spec: 'Nephrology', doc: 'Dr. Balaji Natarajan', contact: '+91 9000000105 (Radhika Menon - Spouse)' },
    { id: 'pat-demo-16', name: 'Neha Agarwal', email: 'patient16@demo.medlink.test', phone: '+91 9000000016', age: 29, gender: 'Female', blood: 'O-', locality: 'Koyambedu', address: '71, Jawaharlal Nehru Rd, Koyambedu, Chennai', spec: 'Physiotherapy', doc: 'Dr. Antony Raj', contact: '+91 9000000106 (Sangeeta Agarwal - Mother)' },
    { id: 'pat-demo-17', name: 'Arjun Rao', email: 'patient17@demo.medlink.test', phone: '+91 9000000017', age: 35, gender: 'Male', blood: 'A+', locality: 'Villivakkam', address: '11, Red Hills Road, Villivakkam, Chennai', spec: 'Dentistry', doc: 'Dr. Arun Kumar', contact: '+91 9000000107 (Priya Rao - Sister)' },
    { id: 'pat-demo-18', name: 'Kavita Deshmukh', email: 'patient18@demo.medlink.test', phone: '+91 9000000018', age: 42, gender: 'Female', blood: 'AB+', locality: 'Mylapore', address: '108, Royapettah High Rd, Mylapore, Chennai', spec: 'Gastroenterology', doc: 'Dr. Manoj Kulkarni', contact: '+91 9000000108 (Nitin Deshmukh - Spouse)' },
    { id: 'pat-demo-19', name: 'Manoj Pillai', email: 'patient19@demo.medlink.test', phone: '+91 9000000019', age: 50, gender: 'Male', blood: 'B-', locality: 'Velachery', address: '29, Dhandeeswaram Main Rd, Velachery, Chennai', spec: 'Pulmonology', doc: 'Dr. Sanjay Krishnan', contact: '+91 9000000109 (Usha Pillai - Spouse)' },
    { id: 'pat-demo-20', name: 'Ritu Sen', email: 'patient20@demo.medlink.test', phone: '+91 9000000020', age: 27, gender: 'Female', blood: 'O+', locality: 'Adyar', address: '8, Lattice Bridge Rd, Adyar, Chennai', spec: 'Endocrinology', doc: 'Dr. Kiran Chawla', contact: '+91 9000000110 (Debashis Sen - Father)' },
  ];

  for (const p of patientProfiles) {
    const patientEntity: PatientEntity = {
      id: p.id,
      name: p.name,
      email: p.email,
      phone: p.phone,
      password_hash: genericPassHash,
      blood_group: p.blood,
      age: p.age,
      gender: p.gender,
      avatar: \`https://images.unsplash.com/photo-\${1500000000000 + p.age * 12345}?auto=format&fit=crop&q=80&w=200\`,
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

  // Continuity test fixtures for pat-101 and pat-102
  const patDemo1 = memoryDb.patients.get('pat-demo-01');
  const patDemo2 = memoryDb.patients.get('pat-demo-02');
  if (patDemo1) {
    memoryDb.patients.set('pat-101', {
      ...patDemo1,
      id: 'pat-101',
      name: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      phone: '+91 98401 23456',
      blood_group: 'O+',
    });
  }
  if (patDemo2) {
    memoryDb.patients.set('pat-102', {
      ...patDemo2,
      id: 'pat-102',
      name: 'Priya Sharma',
      email: 'priya.sharma@example.com',
      phone: '+91 98401 23457',
      blood_group: 'A+',
    });
  }

  // Saved location for pat-demo-01
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

  // ============================================================
  // 2. SEED ALL 17 CLINICAL DEPARTMENTS
  // ============================================================
  const departmentsData: Array<{ id: string; name: string; icon: string; desc: string; keywords: string[]; symptoms: string[] }> = [
    { id: 'dept-dent', name: 'Dentistry', icon: '🦷', desc: 'Oral hygiene, toothache, root canal therapy, cavity fillings, cleaning & dental restorations', keywords: ['Dentist', 'Toothache', 'Teeth', 'Root Canal', 'Cleaning', 'Cavity', 'Dental Filling', 'Tooth Extraction'], symptoms: ['Toothache', 'Tooth Sensitivity', 'Bleeding Gums', 'Jaw Pain', 'Cavity Pain'] },
    { id: 'dept-gen', name: 'General Medicine', icon: '🩺', desc: 'Comprehensive adult health, acute viral fever, metabolic screening, and preventive primary care', keywords: ['General Physician', 'Fever', 'Cough', 'Internal Medicine', 'Primary Care', 'Family Doctor'], symptoms: ['Fever', 'Fatigue', 'Cold / Cough', 'Body Ache', 'Headache'] },
    { id: 'dept-gyn', name: 'Gynecology', icon: '🌸', desc: 'Women\\'s reproductive health, prenatal checkups, PCOS management, and hormonal evaluations', keywords: ['Gynecologist', 'Pregnancy', 'Obstetrics', 'PCOS', 'Women\\'s Health', 'Maternity'], symptoms: ['Pregnancy Checkup', 'Pelvic Pain', 'Irregular Periods', 'Hormonal Imbalance'] },
    { id: 'dept-cardio', name: 'Cardiology', icon: '❤️', desc: 'Heart health, resting ECG, arterial pressure, lipid profiles, and cardiovascular diagnostics', keywords: ['Cardiologist', 'Heart', 'ECG', 'Hypertension', 'Chest Pain', 'Cardiac Consultation'], symptoms: ['Chest Pain', 'Palpitations', 'High BP', 'Shortness of Breath', 'Dizziness'] },
    { id: 'dept-opht', name: 'Ophthalmology', icon: '👁️', desc: 'Visual acuity, slit-lamp bio-microscopy, cataract checks, glaucoma, and refractive corrections', keywords: ['Ophthalmologist', 'Eye Specialist', 'Vision', 'Cataract', 'Glaucoma', 'Eye Irritation'], symptoms: ['Eye Irritation', 'Blurred Vision', 'Red Eyes', 'Watery Eyes', 'Eye Strain'] },
    { id: 'dept-ortho', name: 'Orthopedics', icon: '🦴', desc: 'Bone fractures, joint pain, spine care, sports injuries, and arthritis management', keywords: ['Orthopedic', 'Bone', 'Joint Pain', 'Back Pain', 'Fracture', 'Knee Pain'], symptoms: ['Knee Pain', 'Lower Back Pain', 'Joint Swelling', 'Shoulder Stiffness'] },
    { id: 'dept-derma', name: 'Dermatology', icon: '✨', desc: 'Skin rashes, acne treatment, eczema, psoriasis, cutaneous allergy, and dermatosurgery', keywords: ['Dermatologist', 'Skin', 'Acne', 'Rash', 'Eczema', 'Hair Fall'], symptoms: ['Skin Rash', 'Severe Acne', 'Itching / Redness', 'Eczema Flare', 'Scalp Flaking'] },
    { id: 'dept-neuro', name: 'Neurology', icon: '🧠', desc: 'Cranial nerve evaluation, migraine therapy, neuro-vascular health, and vertigo management', keywords: ['Neurologist', 'Migraine', 'Brain', 'Headache', 'Nerve', 'Dizziness', 'Vertigo'], symptoms: ['Headache and Dizziness', 'Severe Migraine', 'Numbness / Tingling', 'Vertigo', 'Tremors'] },
    { id: 'dept-ent', name: 'ENT', icon: '👂', desc: 'Ear infections, otoscopy, sinus disorders, throat discomfort, and audiometric evaluations', keywords: ['ENT Specialist', 'Ear Pain', 'Ear Infection', 'Sinus', 'Throat', 'Hearing'], symptoms: ['Ear Pain', 'Ear Infection', 'Sore Throat', 'Nasal Blockage', 'Sinus Pressure'] },
    { id: 'dept-pedia', name: 'Pediatrics', icon: '👶', desc: 'Infant and child wellness, developmental milestones, pediatric fevers, and immunization', keywords: ['Pediatrician', 'Child Fever', 'Child Specialist', 'Vaccination', 'Infant Care'], symptoms: ['Child Fever', 'Pediatric Cough', 'Loss of Appetite', 'Child Vomiting'] },
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
  // 3. SEED EXACT 17 CHENNAI CLINICS
  // ============================================================
  const demoClinics: ClinicEntity[] = [
    {
      id: 'c-demo-moon-01',
      name: 'Moon Dental Clinic',
      address: '142 Dental Avenue, Villivakkam, Chennai',
      latitude: 13.1075,
      longitude: 80.206,
      rating: 4.97,
      reviews_count: 284,
      image: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=800&q=80',
      category: 'Dentistry',
      doctors_count: 3,
      open_hours: '09:00 AM – 08:30 PM',
      phone: '+91 44 2611 0001',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '5 min wait',
      consultation_fee: '₹400',
      departments: ['Dentistry'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-apollo-02',
      name: 'Apollo Family Care Centre',
      address: '88 Healthcare Blvd, Anna Nagar, Chennai',
      latitude: 13.0850,
      longitude: 80.2101,
      rating: 4.91,
      reviews_count: 310,
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
      category: 'General Medicine',
      doctors_count: 2,
      open_hours: '08:00 AM – 09:00 PM',
      phone: '+91 44 2621 0002',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '10 min wait',
      consultation_fee: '₹500',
      departments: ['General Medicine'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-greenlife-03',
      name: "GreenLife Women's Clinic",
      address: '25 Maternity Way, Kilpauk, Chennai',
      latitude: 13.0827,
      longitude: 80.2407,
      rating: 4.93,
      reviews_count: 180,
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
      category: 'Gynecology',
      doctors_count: 2,
      open_hours: '09:00 AM – 07:30 PM',
      phone: '+91 44 2641 0003',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '12 min wait',
      consultation_fee: '₹600',
      departments: ['Gynecology'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-heart-04',
      name: 'Chennai Heart & Vascular Centre',
      address: '42 Cardio Boulevard, Nungambakkam, Chennai',
      latitude: 13.0569,
      longitude: 80.2425,
      rating: 4.98,
      reviews_count: 420,
      image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
      category: 'Cardiology',
      doctors_count: 2,
      open_hours: '08:00 AM – 09:00 PM',
      phone: '+91 44 2821 0004',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '10 min wait',
      consultation_fee: '₹700',
      departments: ['Cardiology'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-vision-05',
      name: 'VisionPlus Eye Centre',
      address: '19 Optics Road, T. Nagar, Chennai',
      latitude: 13.0418,
      longitude: 80.2341,
      rating: 4.92,
      reviews_count: 215,
      image: 'https://images.unsplash.com/photo-1580281657527-47f249e8f4df?auto=format&fit=crop&w=800&q=80',
      category: 'Ophthalmology',
      doctors_count: 2,
      open_hours: '09:00 AM – 08:00 PM',
      phone: '+91 44 2834 0005',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '8 min wait',
      consultation_fee: '₹450',
      departments: ['Ophthalmology'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-ortho-06',
      name: 'OrthoCare Chennai',
      address: '56 Spine Avenue, Aminjikarai, Chennai',
      latitude: 13.0722,
      longitude: 80.2183,
      rating: 4.89,
      reviews_count: 175,
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      category: 'Orthopedics',
      doctors_count: 2,
      open_hours: '09:00 AM – 08:30 PM',
      phone: '+91 44 2661 0006',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '15 min wait',
      consultation_fee: '₹550',
      departments: ['Orthopedics'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-skin-07',
      name: 'SkinSphere Dermatology',
      address: '14 Derma Plaza, Adyar, Chennai',
      latitude: 13.0078,
      longitude: 80.2567,
      rating: 4.94,
      reviews_count: 260,
      image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=800&q=80',
      category: 'Dermatology',
      doctors_count: 2,
      open_hours: '09:30 AM – 08:00 PM',
      phone: '+91 44 2441 0007',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '10 min wait',
      consultation_fee: '₹500',
      departments: ['Dermatology'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-neuro-08',
      name: 'NeuroBridge Clinic',
      address: '73 Neuro Street, Guindy, Chennai',
      latitude: 13.0112,
      longitude: 80.2195,
      rating: 4.95,
      reviews_count: 190,
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      category: 'Neurology',
      doctors_count: 2,
      open_hours: '09:00 AM – 07:00 PM',
      phone: '+91 44 2235 0008',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '15 min wait',
      consultation_fee: '₹700',
      departments: ['Neurology'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-nova-09',
      name: 'Nova ENT Care',
      address: '38 Sinus Lane, Mogappair, Chennai',
      latitude: 13.0837,
      longitude: 80.1754,
      rating: 4.88,
      reviews_count: 155,
      image: 'https://images.unsplash.com/photo-1578496479914-7ef3b0193be3?auto=format&fit=crop&w=800&q=80',
      category: 'ENT',
      doctors_count: 2,
      open_hours: '09:00 AM – 08:00 PM',
      phone: '+91 44 2656 0009',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '10 min wait',
      consultation_fee: '₹450',
      departments: ['ENT'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-smile-10',
      name: 'Smile & Child Pediatric Centre',
      address: '10 Pediatric Square, Porur, Chennai',
      latitude: 13.0382,
      longitude: 80.1565,
      rating: 4.96,
      reviews_count: 340,
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
      category: 'Pediatrics',
      doctors_count: 2,
      open_hours: '08:30 AM – 08:30 PM',
      phone: '+91 44 2476 0010',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '5 min wait',
      consultation_fee: '₹450',
      departments: ['Pediatrics'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-pulmo-11',
      name: 'CarePoint Pulmonology',
      address: '61 Bronchial Way, Velachery, Chennai',
      latitude: 12.9815,
      longitude: 80.2180,
      rating: 4.91,
      reviews_count: 145,
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
      category: 'Pulmonology',
      doctors_count: 2,
      open_hours: '09:00 AM – 07:30 PM',
      phone: '+91 44 2243 0011',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '10 min wait',
      consultation_fee: '₹600',
      departments: ['Pulmonology'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-renal-12',
      name: 'RenalCare Clinic',
      address: '18 Dialysis Enclave, Egmore, Chennai',
      latitude: 13.0732,
      longitude: 80.2609,
      rating: 4.94,
      reviews_count: 165,
      image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=800&q=80',
      category: 'Nephrology',
      doctors_count: 2,
      open_hours: '08:00 AM – 08:00 PM',
      phone: '+91 44 2819 0012',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '12 min wait',
      consultation_fee: '₹650',
      departments: ['Nephrology'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-digestive-13',
      name: 'Digestive Health Centre',
      address: '92 Gastro Street, Mylapore, Chennai',
      latitude: 13.0338,
      longitude: 80.2677,
      rating: 4.92,
      reviews_count: 230,
      image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=800&q=80',
      category: 'Gastroenterology',
      doctors_count: 2,
      open_hours: '09:00 AM – 08:00 PM',
      phone: '+91 44 2498 0013',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '10 min wait',
      consultation_fee: '₹550',
      departments: ['Gastroenterology'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-endowell-14',
      name: 'EndoWell Clinic',
      address: '33 Hormone Avenue, Adyar, Chennai',
      latitude: 13.0012,
      longitude: 80.2550,
      rating: 4.93,
      reviews_count: 210,
      image: 'https://images.unsplash.com/photo-1578496479914-7ef3b0193be3?auto=format&fit=crop&w=800&q=80',
      category: 'Endocrinology',
      doctors_count: 2,
      open_hours: '08:30 AM – 07:30 PM',
      phone: '+91 44 2442 0014',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '8 min wait',
      consultation_fee: '₹600',
      departments: ['Endocrinology'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-uro-15',
      name: 'UroCare Chennai',
      address: '47 Uro Complex, Saidapet, Chennai',
      latitude: 13.0213,
      longitude: 80.2231,
      rating: 4.90,
      reviews_count: 180,
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      category: 'Urology',
      doctors_count: 2,
      open_hours: '09:00 AM – 08:30 PM',
      phone: '+91 44 2435 0015',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '15 min wait',
      consultation_fee: '₹650',
      departments: ['Urology'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-physio-16',
      name: 'PhysioMotion Rehabilitation',
      address: '82 Movement Blvd, Koyambedu, Chennai',
      latitude: 13.0694,
      longitude: 80.1948,
      rating: 4.95,
      reviews_count: 195,
      image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=800&q=80',
      category: 'Physiotherapy',
      doctors_count: 2,
      open_hours: '08:00 AM – 08:00 PM',
      phone: '+91 44 2479 0016',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '5 min wait',
      consultation_fee: '₹450',
      departments: ['Physiotherapy'],
      created_at: new Date().toISOString(),
    },
    {
      id: 'c-demo-mind-17',
      name: 'MindCare Psychiatry Centre',
      address: '15 Serenity Road, Besant Nagar, Chennai',
      latitude: 13.0002,
      longitude: 80.2667,
      rating: 4.98,
      reviews_count: 240,
      image: 'https://images.unsplash.com/photo-1580281657527-47f249e8f4df?auto=format&fit=crop&w=800&q=80',
      category: 'Psychiatry',
      doctors_count: 2,
      open_hours: '10:00 AM – 08:00 PM',
      phone: '+91 44 2491 0017',
      is_open: true,
      is_popular: true,
      is_nearby: true,
      wait_time: '10 min wait',
      consultation_fee: '₹800',
      departments: ['Psychiatry'],
      created_at: new Date().toISOString(),
    },
  ];

  demoClinics.forEach((c) => {
    memoryDb.clinics.set(c.id, c);
  });

  // Backward compatibility aliases for automated tests and existing flows
  memoryDb.clinics.set('c-demo-multi-02', { ...demoClinics[1], id: 'c-demo-multi-02' });
  memoryDb.clinics.set('c-demo-heart-03', { ...demoClinics[3], id: 'c-demo-heart-03' });
  memoryDb.clinics.set('c-demo-rainbow-04', { ...demoClinics[9], id: 'c-demo-rainbow-04' });
  memoryDb.clinics.set('c-demo-skin-05', { ...demoClinics[6], id: 'c-demo-skin-05' });
  memoryDb.clinics.set('c-demo-ent-06', { ...demoClinics[8], id: 'c-demo-ent-06' });
  memoryDb.clinics.set('c1', { ...demoClinics[1], id: 'c1' });
  memoryDb.clinics.set('c-demo', { ...demoClinics[0], id: 'c-demo' });
  memoryDb.clinics.set('c5', { ...demoClinics[0], id: 'c5' });

  // ============================================================
  // 4. SEED PROCEDURES CATALOG
  // ============================================================
  const coreProcedures = [
    // Dentistry
    { id: 'proc-rc', name: 'Root Canal Treatment', department: 'Dentistry', description: 'Single/multi-visit endodontic root canal therapy & bio-ceramic obturation.' },
    { id: 'proc-dc', name: 'Dental Cleaning', department: 'Dentistry', description: 'Ultrasonic scaling, subgingival plaque debridement, and enamel polishing.' },
    { id: 'proc-te', name: 'Tooth Extraction', department: 'Dentistry', description: 'Atraumatic dental extraction, socket preservation, and surgical removal.' },
    { id: 'proc-df', name: 'Dental Filling', department: 'Dentistry', description: 'Composite tooth-colored restorative cavity restoration.' },
    
    // General Medicine
    { id: 'proc-fc', name: 'Fever Consultation', department: 'General Medicine', description: 'Acute pyrexia evaluation, CBC platelet check, and symptom triage.' },
    { id: 'proc-gh', name: 'General Health Consultation', department: 'General Medicine', description: 'Routine clinical checkup, metabolic and primary health screening.' },
    { id: 'proc-db', name: 'Diabetes Consultation', department: 'General Medicine', description: 'Glycemic control review, diet counseling, and oral hypoglycemic modulation.' },

    // Gynecology
    { id: 'proc-anc', name: 'Antenatal Checkup', department: 'Gynecology', description: 'Prenatal maternal health review, fetal Doppler monitoring, and obstetric care.' },
    { id: 'proc-pcos', name: 'PCOS Management', department: 'Gynecology', description: 'Endocrine and pelvic ultrasound review for polycystic ovarian syndrome.' },

    // Cardiology
    { id: 'proc-card', name: 'Cardiac Consultation', department: 'Cardiology', description: 'Comprehensive cardiopulmonary examination and lipid profiling.' },
    { id: 'proc-ecg', name: 'Electrocardiogram (ECG)', department: 'Cardiology', description: '12-lead Electrocardiogram recording and cardiac rhythm analysis.' },
    { id: 'proc-ht', name: 'Hypertension Consultation', department: 'Cardiology', description: 'Blood pressure mapping, secondary hypertension screening, and therapy.' },

    // Ophthalmology
    { id: 'proc-eye-ex', name: 'Comprehensive Eye Examination', department: 'Ophthalmology', description: 'Slit-lamp ocular examination, refraction check, and intraocular pressure test.' },
    { id: 'proc-cataract', name: 'Cataract Evaluation', department: 'Ophthalmology', description: 'Lens opacification assessment and intraocular lens planning.' },

    // Orthopedics
    { id: 'proc-joint', name: 'Joint Pain Consultation', department: 'Orthopedics', description: 'Articular cartilage assessment, range of motion tests, and joint review.' },
    { id: 'proc-knee', name: 'Knee Arthritis Evaluation', department: 'Orthopedics', description: 'Degenerative joint evaluation, radiographic review, and viscosupplementation.' },

    // Dermatology
    { id: 'proc-sk-c', name: 'Skin Consultation', department: 'Dermatology', description: 'Dermatologic clinical evaluation of skin lesions, pigmentation, and rashes.' },
    { id: 'proc-sk-a', name: 'Acne Treatment', department: 'Dermatology', description: 'Grade 1-4 acne vulgaris protocol, chemical peel assessment, and topicals.' },

    // Neurology
    { id: 'proc-migraine', name: 'Migraine Consultation', department: 'Neurology', description: 'Neurovascular headache workup, aura profiling, and abortive/prophylactic therapy.' },
    { id: 'proc-nerve', name: 'Neurological Examination', department: 'Neurology', description: 'Cranial nerve reflex testing, peripheral neuropathy and sensory review.' },

    // ENT
    { id: 'proc-ent-c', name: 'ENT Consultation', department: 'ENT', description: 'Otolaryngology examination of ear canals, nasal septum, and pharynx.' },
    { id: 'proc-ear-inf', name: 'Ear Infection Consultation', department: 'ENT', description: 'Otitis media/externa diagnosis, micro-suctioning, and topical antibiotic therapy.' },

    // Pediatrics
    { id: 'proc-ped-c', name: 'Child Consultation', department: 'Pediatrics', description: 'Pediatric physical exam, growth milestones, and pediatric symptom review.' },
    { id: 'proc-ped-f', name: 'Child Fever Evaluation', department: 'Pediatrics', description: 'Pediatric viral fever protocol, hydration assessment, and weight-based dosing.' },

    // Pulmonology
    { id: 'proc-asthma', name: 'Asthma Consultation', department: 'Pulmonology', description: 'Airflow obstruction review, metered-dose inhaler optimization, and allergy workup.' },
    { id: 'proc-spiro', name: 'Spirometry Breathing Test', department: 'Pulmonology', description: 'Forced expiratory volume (FEV1) testing and pulmonary function analysis.' },

    // Nephrology
    { id: 'proc-renal', name: 'Renal Function Review', department: 'Nephrology', description: 'Glomerular filtration rate (eGFR) profiling, proteinuria check, and kidney health.' },

    // Gastroenterology
    { id: 'proc-gerd', name: 'Acidity & GERD Consultation', department: 'Gastroenterology', description: 'Gastroesophageal reflux evaluation, gastric mucosa assessment, and PPI therapy.' },
    { id: 'proc-ab-pain', name: 'Abdominal Pain Evaluation', department: 'Gastroenterology', description: 'Comprehensive gastrointestinal workup, mesenteric palpation, and ultrasound triage.' },

    // Endocrinology
    { id: 'proc-endo-db', name: 'Diabetes Management', department: 'Endocrinology', description: 'HbA1c glycemic profiling, continuous glucose review, and insulin adjustment.' },
    { id: 'proc-thyroid', name: 'Thyroid Evaluation', department: 'Endocrinology', description: 'Free T3/T4, TSH hormonal mapping, and thyroid nodule clinical assessment.' },

    // Urology
    { id: 'proc-k-stone', name: 'Kidney Stone Management', department: 'Urology', description: 'Renal calculus ultrasound review, medical expulsive therapy, and lithotripsy check.' },
    { id: 'proc-uti', name: 'Urinary Tract Consultation', department: 'Urology', description: 'Dysuria workup, urine microscopy analysis, and targeted antimicrobial care.' },

    // Physiotherapy
    { id: 'proc-physio-rehab', name: 'Musculoskeletal Rehabilitation', department: 'Physiotherapy', description: 'Manual therapy, biomechanical alignment, posture correction, and exercise protocol.' },
    { id: 'proc-back-physio', name: 'Back Pain Physiotherapy', department: 'Physiotherapy', description: 'Lumbar core stabilization, decompression therapy, and therapeutic ultrasound.' },

    // Psychiatry
    { id: 'proc-psych-eval', name: 'Anxiety & Depression Assessment', department: 'Psychiatry', description: 'Clinical psychometric evaluation, cognitive assessment, and therapeutic counseling.' },
    { id: 'proc-stress', name: 'Stress & Sleep Consultation', department: 'Psychiatry', description: 'Sleep architecture analysis, circadian modulation, and psychotherapy guidance.' },
  ];

  coreProcedures.forEach((p) => {
    memoryDb.procedures.set(p.id, { ...p, is_verified: true, created_at: new Date().toISOString() });
  });

  // Default doctor weekly schedule
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
  // 5. SEED SPECIALIST DOCTORS ACROSS ALL 17 CLINICS
  // ============================================================
  const rawDoctorsList = [
    // Dentistry (Moon Dental Clinic)
    { id: 'doc-demo-arun-01', name: 'Dr. Arun Kumar', spec: 'Dentistry', subSpec: 'Endodontics', clinicId: 'c-demo-moon-01', clinicName: 'Moon Dental Clinic', fee: '₹400', rating: 4.97, exp: 11, procs: ['Root Canal Treatment', 'Dental Cleaning', 'Tooth Extraction', 'Dental Filling'] },
    { id: 'doc-demo-ananya-08', name: 'Dr. Ananya Deshmukh', email: 'dr.ananya@medlink.health', spec: 'Dentistry', subSpec: 'Oral & Maxillofacial Surgery', clinicId: 'c-demo-moon-01', clinicName: 'Moon Dental Clinic', fee: '₹400', rating: 4.93, exp: 8, procs: ['Dental Consultation', 'Root Canal Treatment', 'Dental Filling', 'Tooth Extraction'] },
    { id: 'doc-demo-suresh-09', name: 'Dr. Suresh Verma', spec: 'Dentistry', subSpec: 'Conservative Dentistry', clinicId: 'c-demo-moon-01', clinicName: 'Moon Dental Clinic', fee: '₹350', rating: 4.88, exp: 6, procs: ['Dental Consultation', 'Dental Filling', 'Dental Cleaning'] },
    
    // General Medicine (Apollo Family Care Centre)
    { id: 'doc-demo-priya-02', name: 'Dr. Priya Sharma', spec: 'General Medicine', subSpec: 'Internal Medicine', clinicId: 'c-demo-apollo-02', clinicName: 'Apollo Family Care Centre', fee: '₹500', rating: 4.92, exp: 10, procs: ['Fever Consultation', 'General Health Consultation', 'Diabetes Consultation'] },
    { id: 'doc-demo-rajesh-12', name: 'Dr. Rajesh Varma', spec: 'General Medicine', subSpec: 'Family Medicine', clinicId: 'c-demo-apollo-02', clinicName: 'Apollo Family Care Centre', fee: '₹450', rating: 4.89, exp: 12, procs: ['General Health Consultation', 'Fever Consultation'] },

    // Gynecology (GreenLife Women's Clinic)
    { id: 'doc-demo-radha-14', name: 'Dr. Radha Sundaram', spec: 'Gynecology', subSpec: 'Obstetrics & Gynecology', clinicId: 'c-demo-greenlife-03', clinicName: "GreenLife Women's Clinic", fee: '₹600', rating: 4.95, exp: 14, procs: ['Antenatal Checkup', 'PCOS Management', 'Pregnancy Consultation'] },
    { id: 'doc-demo-shalini-15', name: 'Dr. Shalini Mukerjee', spec: 'Gynecology', subSpec: 'Reproductive Endocrinology', clinicId: 'c-demo-greenlife-03', clinicName: "GreenLife Women's Clinic", fee: '₹650', rating: 4.91, exp: 9, procs: ['PCOS Management', 'Gynecology Consultation'] },

    // Cardiology (Chennai Heart & Vascular Centre)
    { id: 'doc-demo-karthik-03', name: 'Dr. Karthik Raman', spec: 'Cardiology', subSpec: 'Interventional Cardiology', clinicId: 'c-demo-heart-04', clinicName: 'Chennai Heart & Vascular Centre', fee: '₹700', rating: 4.98, exp: 16, procs: ['Cardiac Consultation', 'Electrocardiogram (ECG)', 'Hypertension Consultation'] },
    { id: 'doc-demo-nithya-16', name: 'Dr. Nithya Menon', spec: 'Cardiology', subSpec: 'Preventive Cardiology', clinicId: 'c-demo-heart-04', clinicName: 'Chennai Heart & Vascular Centre', fee: '₹650', rating: 4.92, exp: 11, procs: ['Cardiac Consultation', 'Electrocardiogram (ECG)'] },

    // Ophthalmology (VisionPlus Eye Centre)
    { id: 'doc-demo-ramesh-18', name: 'Dr. Ramesh Chandran', spec: 'Ophthalmology', subSpec: 'Cataract & Refractive', clinicId: 'c-demo-vision-05', clinicName: 'VisionPlus Eye Centre', fee: '₹450', rating: 4.94, exp: 13, procs: ['Comprehensive Eye Examination', 'Cataract Evaluation'] },
    { id: 'doc-demo-deepa-19', name: 'Dr. Deepa Sundar', spec: 'Ophthalmology', subSpec: 'Glaucoma & Cornea', clinicId: 'c-demo-vision-05', clinicName: 'VisionPlus Eye Centre', fee: '₹450', rating: 4.90, exp: 8, procs: ['Comprehensive Eye Examination', 'Eye Examination'] },

    // Orthopedics (OrthoCare Chennai)
    { id: 'doc-demo-aditya-20', name: 'Dr. Aditya Rao', spec: 'Orthopedics', subSpec: 'Joint Replacement & Trauma', clinicId: 'c-demo-ortho-06', clinicName: 'OrthoCare Chennai', fee: '₹550', rating: 4.93, exp: 12, procs: ['Joint Pain Consultation', 'Knee Arthritis Evaluation'] },
    { id: 'doc-demo-sneha-21', name: 'Dr. Sneha Krishnan', spec: 'Orthopedics', subSpec: 'Sports Medicine', clinicId: 'c-demo-ortho-06', clinicName: 'OrthoCare Chennai', fee: '₹500', rating: 4.88, exp: 7, procs: ['Joint Pain Consultation', 'Sports Injury Consultation'] },

    // Dermatology (SkinSphere Dermatology)
    { id: 'doc-demo-priya-05', name: 'Dr. Priya Nair', spec: 'Dermatology', subSpec: 'Clinical Dermatology', clinicId: 'c-demo-skin-07', clinicName: 'SkinSphere Dermatology', fee: '₹500', rating: 4.95, exp: 9, procs: ['Skin Consultation', 'Acne Treatment', 'Allergy Evaluation'] },
    { id: 'doc-demo-harish-23', name: 'Dr. Harish Menon', spec: 'Dermatology', subSpec: 'Aesthetic Dermatosurgery', clinicId: 'c-demo-skin-07', clinicName: 'SkinSphere Dermatology', fee: '₹550', rating: 4.91, exp: 11, procs: ['Skin Consultation', 'Acne Treatment'] },

    // Neurology (NeuroBridge Clinic)
    { id: 'doc-demo-arvind-25', name: 'Dr. Arvind Swaminathan', spec: 'Neurology', subSpec: 'Clinical Neurology & Stroke', clinicId: 'c-demo-neuro-08', clinicName: 'NeuroBridge Clinic', fee: '₹700', rating: 4.96, exp: 15, procs: ['Migraine Consultation', 'Neurological Examination', 'Headache Consultation'] },
    { id: 'doc-demo-gayatri-26', name: 'Dr. Gayatri Mohan', spec: 'Neurology', subSpec: 'Neurophysiology', clinicId: 'c-demo-neuro-08', clinicName: 'NeuroBridge Clinic', fee: '₹650', rating: 4.90, exp: 10, procs: ['Neurological Examination', 'Migraine Consultation'] },

    // ENT (Nova ENT Care)
    { id: 'doc-demo-venkat-06', name: 'Dr. Venkat Raman', spec: 'ENT', subSpec: 'Otolaryngology', clinicId: 'c-demo-nova-09', clinicName: 'Nova ENT Care', fee: '₹450', rating: 4.91, exp: 12, procs: ['ENT Consultation', 'Ear Infection Consultation', 'Sinus Evaluation'] },
    { id: 'doc-demo-swetha-27', name: 'Dr. Swetha Narayanan', spec: 'ENT', subSpec: 'Rhinology & Sinus Surgery', clinicId: 'c-demo-nova-09', clinicName: 'Nova ENT Care', fee: '₹500', rating: 4.87, exp: 7, procs: ['ENT Consultation', 'Sinus Evaluation'] },

    // Pediatrics (Smile & Child Pediatric Centre)
    { id: 'doc-demo-kavitha-04', name: 'Dr. Kavitha Reddy', spec: 'Pediatrics', subSpec: 'Pediatrics & Neonatology', clinicId: 'c-demo-smile-10', clinicName: 'Smile & Child Pediatric Centre', fee: '₹450', rating: 4.96, exp: 10, procs: ['Child Consultation', 'Child Fever Evaluation', 'Pediatric Vaccination'] },
    { id: 'doc-demo-arun-p-28', name: 'Dr. Arun Prakash', spec: 'Pediatrics', subSpec: 'Pediatric Pulmonology', clinicId: 'c-demo-smile-10', clinicName: 'Smile & Child Pediatric Centre', fee: '₹500', rating: 4.92, exp: 8, procs: ['Child Consultation', 'Child Fever Evaluation'] },

    // Pulmonology (CarePoint Pulmonology)
    { id: 'doc-demo-sanjay-29', name: 'Dr. Sanjay Krishnan', spec: 'Pulmonology', subSpec: 'Pulmonary & Critical Care', clinicId: 'c-demo-pulmo-11', clinicName: 'CarePoint Pulmonology', fee: '₹600', rating: 4.94, exp: 13, procs: ['Asthma Consultation', 'Spirometry Breathing Test', 'Breathing Problem Consultation'] },
    { id: 'doc-demo-preeti-30', name: 'Dr. Preeti Varghese', spec: 'Pulmonology', subSpec: 'Respiratory Medicine', clinicId: 'c-demo-pulmo-11', clinicName: 'CarePoint Pulmonology', fee: '₹550', rating: 4.89, exp: 9, procs: ['Asthma Consultation', 'Spirometry Breathing Test'] },

    // Nephrology (RenalCare Clinic)
    { id: 'doc-demo-balaji-31', name: 'Dr. Balaji Natarajan', spec: 'Nephrology', subSpec: 'Nephrology & Renal Care', clinicId: 'c-demo-renal-12', clinicName: 'RenalCare Clinic', fee: '₹650', rating: 4.95, exp: 14, procs: ['Renal Function Review', 'Kidney Consultation', 'Nephrology Consultation'] },
    { id: 'doc-demo-malini-32', name: 'Dr. Malini Sridhar', spec: 'Nephrology', subSpec: 'Clinical Nephrology', clinicId: 'c-demo-renal-12', clinicName: 'RenalCare Clinic', fee: '₹600', rating: 4.90, exp: 8, procs: ['Renal Function Review', 'Kidney Consultation'] },

    // Gastroenterology (Digestive Health Centre)
    { id: 'doc-demo-manoj-33', name: 'Dr. Manoj Kulkarni', spec: 'Gastroenterology', subSpec: 'Gastroenterology & Hepatology', clinicId: 'c-demo-digestive-13', clinicName: 'Digestive Health Centre', fee: '₹550', rating: 4.93, exp: 11, procs: ['Acidity & GERD Consultation', 'Abdominal Pain Evaluation', 'Stomach Pain Consultation'] },
    { id: 'doc-demo-lakshmi-34', name: 'Dr. Lakshmi Narayanan', spec: 'Gastroenterology', subSpec: 'Digestive Endoscopy', clinicId: 'c-demo-digestive-13', clinicName: 'Digestive Health Centre', fee: '₹600', rating: 4.88, exp: 10, procs: ['Acidity & GERD Consultation', 'Abdominal Pain Evaluation'] },

    // Endocrinology (EndoWell Clinic)
    { id: 'doc-demo-kiran-35', name: 'Dr. Kiran Chawla', spec: 'Endocrinology', subSpec: 'Endocrinology & Diabetology', clinicId: 'c-demo-endowell-14', clinicName: 'EndoWell Clinic', fee: '₹600', rating: 4.95, exp: 12, procs: ['Diabetes Management', 'Thyroid Evaluation', 'Endocrinology Consultation'] },
    { id: 'doc-demo-reka-36', name: 'Dr. Rekha Gopal', spec: 'Endocrinology', subSpec: 'Metabolic Disorders', clinicId: 'c-demo-endowell-14', clinicName: 'EndoWell Clinic', fee: '₹550', rating: 4.90, exp: 9, procs: ['Diabetes Management', 'Thyroid Evaluation'] },

    // Urology (UroCare Chennai)
    { id: 'doc-demo-dinesh-37', name: 'Dr. Dinesh Karthikeyan', spec: 'Urology', subSpec: 'Urology & Andrology', clinicId: 'c-demo-uro-15', clinicName: 'UroCare Chennai', fee: '₹650', rating: 4.93, exp: 14, procs: ['Kidney Stone Management', 'Urinary Tract Consultation', 'Urine Problem Consultation'] },
    { id: 'doc-demo-madhav-38', name: 'Dr. Madhavan Pillai', spec: 'Urology', subSpec: 'Endourology & Lithotripsy', clinicId: 'c-demo-uro-15', clinicName: 'UroCare Chennai', fee: '₹600', rating: 4.89, exp: 10, procs: ['Kidney Stone Management', 'Urinary Tract Consultation'] },

    // Physiotherapy (PhysioMotion Rehabilitation)
    { id: 'doc-demo-antony-39', name: 'Dr. Antony Raj', spec: 'Physiotherapy', subSpec: 'Musculoskeletal & Sports Physio', clinicId: 'c-demo-physio-16', clinicName: 'PhysioMotion Rehabilitation', fee: '₹450', rating: 4.96, exp: 11, procs: ['Musculoskeletal Rehabilitation', 'Back Pain Physiotherapy', 'Physiotherapy Consultation'] },
    { id: 'doc-demo-saranya-40', name: 'Dr. Saranya Devi', spec: 'Physiotherapy', subSpec: 'Post-Op Rehab & Mobility', clinicId: 'c-demo-physio-16', clinicName: 'PhysioMotion Rehabilitation', fee: '₹400', rating: 4.92, exp: 7, procs: ['Musculoskeletal Rehabilitation', 'Back Pain Physiotherapy'] },

    // Psychiatry (MindCare Psychiatry Centre)
    { id: 'doc-demo-siddharth-41', name: 'Dr. Siddharth Sen', spec: 'Psychiatry', subSpec: 'Adult Psychiatry & Psychotherapy', clinicId: 'c-demo-mind-17', clinicName: 'MindCare Psychiatry Centre', fee: '₹800', rating: 4.98, exp: 15, procs: ['Anxiety & Depression Assessment', 'Stress & Sleep Consultation', 'Psychiatry Consultation'] },
    { id: 'doc-demo-tanvi-42', name: 'Dr. Tanvi Hegde', spec: 'Psychiatry', subSpec: 'Cognitive Behavioral Therapy', clinicId: 'c-demo-mind-17', clinicName: 'MindCare Psychiatry Centre', fee: '₹750', rating: 4.94, exp: 8, procs: ['Anxiety & Depression Assessment', 'Stress & Sleep Consultation'] },
  ];

  for (const doc of rawDoctorsList) {
    const docEntity: DoctorEntity = {
      id: doc.id,
      name: doc.name,
      email: (doc as any).email ? (doc as any).email : \`\${doc.id}@demo.medlink.test\`,
      phone: '+91 90000000' + String(10 + memoryDb.doctors.size).slice(-2),
      password_hash: docPassHash,
      specialization: doc.spec,
      primary_specialization: doc.subSpec,
      qualification: \`MBBS, MD (\${doc.subSpec})\`,
      university: 'Tamil Nadu Dr. M.G.R. Medical University',
      grad_year: 2012,
      dob: '1984-06-15',
      gender: 'Male',
      rating: doc.rating,
      reviews_count: 150 + Math.floor(doc.rating * 20),
      experience_years: doc.exp,
      avatar: \`https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400\`,
      clinic_id: doc.clinicId,
      clinic_name: doc.clinicName,
      available_days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      wait_time: '10 min',
      is_available_today: true,
      status: 'AVAILABLE',
      languages: ['English', 'Tamil'],
      consultation_fee: doc.fee,
      is_preferred: true,
      about: \`Senior Specialist in \${doc.subSpec} with \${doc.exp}+ years clinical experience.\`,
      is_verified: true,
      verification_status: 'VERIFIED',
      verified_at: '2025-01-10T10:00:00.000Z',
      registration_number: \`TN-REG-\${doc.id.toUpperCase()}\`,
      registration_authority: 'Tamil Nadu Medical / Dental Council',
      consultation_duration: '20 minutes',
      clinic_affiliations: [doc.clinicName],
      procedures: doc.procs,
      schedule: defaultSchedule,
    };

    memoryDb.doctors.set(doc.id, docEntity);
  }

  // Continuity aliases for doctors
  memoryDb.doctors.set('d1', memoryDb.doctors.get('doc-demo-arun-01')!);
  memoryDb.doctors.set('d2', memoryDb.doctors.get('doc-demo-priya-02')!);
  memoryDb.doctors.set('d3', memoryDb.doctors.get('doc-demo-karthik-03')!);
  memoryDb.doctors.set('d4', memoryDb.doctors.get('doc-demo-kavitha-04')!);
  memoryDb.doctors.set('d5', memoryDb.doctors.get('doc-demo-priya-05')!);
  memoryDb.doctors.set('d6', memoryDb.doctors.get('doc-demo-venkat-06')!);
  memoryDb.doctors.set('doc-demo-vikram-03', memoryDb.doctors.get('doc-demo-karthik-03')!);

  // Doctor under review fixture for verifications test
  const reviewDoc: DoctorEntity = {
    id: 'doc-demo-suresh-07',
    name: 'Dr. Suresh Babu',
    email: 'suresh.babu@medlink.test',
    phone: '+91 9000000088',
    password_hash: docPassHash,
    specialization: 'Dentistry',
    primary_specialization: 'Conservative Dentistry',
    qualification: 'BDS, MDS',
    university: 'Saveetha Dental College',
    grad_year: 2021,
    rating: 4.6,
    reviews_count: 8,
    experience_years: 3,
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
    clinic_id: 'c-demo-moon-01',
    clinic_name: 'Moon Dental Clinic',
    available_days: ['Mon', 'Tue', 'Wed'],
    wait_time: '15 min',
    is_available_today: true,
    status: 'AVAILABLE',
    languages: ['English', 'Tamil'],
    consultation_fee: '₹350',
    about: 'Newly registered dentist pending administrator verification.',
    is_verified: false,
    verification_status: 'UNDER_REVIEW',
    registration_number: 'TN-DENT-PENDING-9912',
    registration_authority: 'Tamil Nadu Dental Council',
    consultation_duration: '20 minutes',
    clinic_affiliations: ['Moon Dental Clinic'],
    procedures: ['Dental Consultation', 'Root Canal Treatment', 'Dental Filling'],
    schedule: defaultSchedule,
  };
  memoryDb.doctors.set(reviewDoc.id, reviewDoc);

  // ============================================================
  // 6. SEED CLINIC ASSISTANTS & ADMINS FOR CLINICS
  // ============================================================
  const assistantsList = [
    { id: 'asst-demo-01', name: 'Sheryl Thomas', email: 'assistant01@demo.medlink.test', phone: '+91 9000000021', clinicId: 'c-demo-moon-01', clinicName: 'Moon Dental Clinic' },
    { id: 'asst-demo-02', name: 'Rahul Joseph', email: 'assistant02@demo.medlink.test', phone: '+91 9000000022', clinicId: 'c-demo-apollo-02', clinicName: 'Apollo Family Care Centre' },
    { id: 'asst-demo-03', name: 'Nisha Kumar', email: 'assistant03@demo.medlink.test', phone: '+91 9000000023', clinicId: 'c-demo-greenlife-03', clinicName: "GreenLife Women's Clinic" },
    { id: 'asst-demo-04', name: 'Ravi Shankar', email: 'assistant04@demo.medlink.test', phone: '+91 9000000024', clinicId: 'c-demo-heart-04', clinicName: 'Chennai Heart & Vascular Centre' },
    { id: 'asst-demo-05', name: 'Deepak Raj', email: 'assistant05@demo.medlink.test', phone: '+91 9000000025', clinicId: 'c-demo-vision-05', clinicName: 'VisionPlus Eye Centre' },
    { id: 'asst-demo-06', name: 'Lavanya S', email: 'assistant06@demo.medlink.test', phone: '+91 9000000026', clinicId: 'c-demo-ortho-06', clinicName: 'OrthoCare Chennai' },
  ];

  for (const asst of assistantsList) {
    memoryDb.patients.set(asst.id, {
      id: asst.id,
      name: asst.name,
      email: asst.email,
      phone: asst.phone,
      password_hash: asstPassHash,
      role: 'CLINIC_ADMIN',
      clinic_id: asst.clinicId,
      clinic_name: asst.clinicName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  // ============================================================
  // 7. SEED CROSS-CLINIC REALISTIC APPOINTMENTS
  // ============================================================
  const rawAppointments = [
    // Today Booked appointments at Moon Dental Clinic (Upcoming before check-in window)
    {
      id: 'apt-demo-moon-01',
      patient_id: 'pat-demo-01',
      patient_name: 'Aarav Sharma',
      patient_phone: '+91 9000000001',
      clinic_id: 'c-demo-moon-01',
      clinic_name: 'Moon Dental Clinic',
      clinic_address: 'Villivakkam, Chennai',
      doctor_id: 'doc-demo-arun-01',
      doctor_name: 'Dr. Arun Kumar',
      doctor_specialization: 'Dentistry',
      doctor_avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      department: 'Dentistry',
      date: todayStr,
      time: '09:00 AM',
      duration: '20 min',
      status: 'Booked',
      queue_number: undefined,
      token_number: '',
      queue_position: 0,
      patients_ahead: 0,
      estimated_wait: '',
      travel_time: '8 min',
      distance: '1.2 km',
      reason: 'Root canal assessment and localized pain',
      symptoms: ['Toothache', 'Sensitivity to Cold'],
      consultation_fee: '₹400',
      prescription_available: false,
    },
    {
      id: 'apt-demo-moon-02',
      patient_id: 'pat-demo-02',
      patient_name: 'Sneha Patel',
      patient_phone: '+91 9000000002',
      clinic_id: 'c-demo-moon-01',
      clinic_name: 'Moon Dental Clinic',
      clinic_address: 'Villivakkam, Chennai',
      doctor_id: 'doc-demo-arun-01',
      doctor_name: 'Dr. Arun Kumar',
      doctor_specialization: 'Dentistry',
      doctor_avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      department: 'Dentistry',
      date: todayStr,
      time: '09:20 AM',
      duration: '20 min',
      status: 'Booked',
      queue_number: undefined,
      token_number: '',
      queue_position: 0,
      patients_ahead: 0,
      estimated_wait: '',
      travel_time: '12 min',
      distance: '2.5 km',
      reason: 'Dental cleaning & tartar removal',
      symptoms: ['Bleeding Gums'],
      consultation_fee: '₹400',
      prescription_available: false,
    },
    // Today Booked appointment at Apollo Family Care Centre
    {
      id: 'apt-demo-apollo-01',
      patient_id: 'pat-demo-03',
      patient_name: 'Rajesh Kumar',
      patient_phone: '+91 9000000003',
      clinic_id: 'c-demo-apollo-02',
      clinic_name: 'Apollo Family Care Centre',
      clinic_address: 'Anna Nagar, Chennai',
      doctor_id: 'doc-demo-priya-02',
      doctor_name: 'Dr. Priya Sharma',
      doctor_specialization: 'General Medicine',
      doctor_avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400',
      department: 'General Medicine',
      date: todayStr,
      time: '09:00 AM',
      duration: '20 min',
      status: 'Booked',
      queue_number: undefined,
      token_number: '',
      queue_position: 0,
      patients_ahead: 0,
      estimated_wait: '',
      travel_time: '5 min',
      distance: '0.8 km',
      reason: 'Acute seasonal fever and chills',
      symptoms: ['Fever', 'Fatigue'],
      consultation_fee: '₹500',
      prescription_available: false,
    },
    // Completed consultation at GreenLife Women's Clinic
    {
      id: 'apt-demo-green-01',
      patient_id: 'pat-demo-08',
      patient_name: 'Pooja Nair',
      patient_phone: '+91 9000000008',
      clinic_id: 'c-demo-greenlife-03',
      clinic_name: "GreenLife Women's Clinic",
      clinic_address: 'Kilpauk, Chennai',
      doctor_id: 'doc-demo-radha-14',
      doctor_name: 'Dr. Radha Sundaram',
      doctor_specialization: 'Gynecology',
      doctor_avatar: 'https://images.unsplash.com/photo-1594824813586-728b7e283286?auto=format&fit=crop&q=80&w=400',
      department: 'Gynecology',
      date: todayStr,
      time: '08:30 AM',
      duration: '20 min',
      status: 'Completed',
      queue_number: 1,
      token_number: 'W001',
      queue_position: 0,
      patients_ahead: 0,
      estimated_wait: 'Done',
      travel_time: '15 min',
      distance: '3.1 km',
      reason: 'Routine prenatal follow-up',
      symptoms: ['Routine Checkup'],
      consultation_fee: '₹600',
      prescription_available: true,
    },
    // Past historical consultation for Aarav Sharma
    {
      id: 'apt-demo-moon-past',
      patient_id: 'pat-demo-01',
      patient_name: 'Aarav Sharma',
      patient_phone: '+91 9000000001',
      clinic_id: 'c-demo-moon-01',
      clinic_name: 'Moon Dental Clinic',
      clinic_address: 'Villivakkam, Chennai',
      doctor_id: 'doc-demo-arun-01',
      doctor_name: 'Dr. Arun Kumar',
      doctor_specialization: 'Dentistry',
      doctor_avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      department: 'Dentistry',
      date: '2026-08-10',
      time: '10:00 AM',
      duration: '20 min',
      status: 'Completed',
      queue_number: 1,
      token_number: 'A001',
      queue_position: 0,
      patients_ahead: 0,
      estimated_wait: 'Done',
      travel_time: '10 min',
      distance: '1.2 km',
      reason: 'Primary emergency consultation for severe molar pulpitis',
      symptoms: ['Toothache', 'Gum Swelling'],
      consultation_fee: '₹400',
      prescription_available: true,
    },
    // Integration test fixture apt-2026-001 (Completed historical visit)
    {
      id: 'apt-2026-001',
      patient_id: 'pat-101',
      patient_name: 'Sarah Jenkins',
      patient_phone: '+91 98401 23456',
      clinic_id: 'c-demo-moon-01',
      clinic_name: 'Moon Dental Clinic',
      clinic_address: 'Villivakkam, Chennai',
      doctor_id: 'doc-demo-ananya-08',
      doctor_name: 'Dr. Ananya Deshmukh',
      doctor_specialization: 'Dentistry',
      doctor_avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400',
      department: 'Dentistry',
      date: todayStr,
      time: '11:00 AM',
      duration: '20 min',
      status: 'Completed',
      queue_number: 1,
      token_number: '#01',
      queue_position: 0,
      patients_ahead: 0,
      estimated_wait: 'Completed',
      travel_time: '10 min',
      distance: '1.2 km',
      reason: 'Consultation for Seasonal Allergic Bronchitis with Mild Pharyngitis',
      symptoms: ['Pharyngitis', 'Toothache'],
      consultation_fee: '₹400',
      prescription_available: true,
    },
  ];

  for (const apt of rawAppointments) {
    const normDate = timeService.normalizeDateString(apt.date);
    const normTime = timeService.normalizeTimeString(apt.time);
    const canonicalApt: any = {
      ...apt,
      appointmentDate: normDate,
      slotStartTime: normTime,
      slotEndTime: timeService.calculateSlotEndTime(normTime, 20),
      timezone: CLINIC_TIMEZONE,
      appointmentStatus: (['Checked In', 'CHECKED_IN'].includes(apt.status) ? 'CHECKED_IN' : (['In Consultation', 'IN_CONSULTATION'].includes(apt.status) ? 'IN_CONSULTATION' : (['Completed', 'COMPLETED'].includes(apt.status) ? 'COMPLETED' : (['Booked', 'BOOKED'].includes(apt.status) ? 'BOOKED' : 'WAITING')))) as any,
      queueToken: apt.token_number || undefined,
      queueStatus: (apt.status === 'Completed' || apt.status === 'COMPLETED') ? 'COMPLETED' : (['In Consultation', 'IN_CONSULTATION'].includes(apt.status) ? 'IN_CONSULTATION' : (['Checked In', 'CHECKED_IN', 'Waiting', 'WAITING'].includes(apt.status) ? 'WAITING' : 'BOOKED')),
      doctorId: apt.doctor_id,
      doctorName: apt.doctor_name,
      clinicId: apt.clinic_id,
      clinicName: apt.clinic_name,
      patientId: apt.patient_id,
      patientName: apt.patient_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    memoryDb.appointments.set(canonicalApt.id, canonicalApt);

    if (timeService.isToday(normDate) && ['CHECKED_IN', 'WAITING', 'Checked In', 'Waiting'].includes(apt.status)) {
      memoryDb.appointment_queue.set(canonicalApt.id, {
        id: \`queue-\${canonicalApt.id}\`,
        clinic_id: canonicalApt.clinic_id,
        doctor_id: canonicalApt.doctor_id,
        appointment_id: canonicalApt.id,
        token_number: canonicalApt.token_number,
        queue_position: canonicalApt.queue_position,
        patients_ahead: canonicalApt.patients_ahead,
        status: canonicalApt.status,
        estimated_wait_minutes: parseInt(canonicalApt.estimated_wait, 10) || 10,
        updated_at: new Date().toISOString(),
      });
    }
  }

  // ============================================================
  // 8. SEED LIVE QUEUE WALK-INS & EMERGENCY (MOON DENTAL CLINIC)
  // ============================================================
  const rameshPatient = {
    id: 'pat-demo-ramesh-emergency',
    name: 'Emergency Patient Ramesh',
    email: 'ramesh.emergency@demo.medlink.test',
    phone: '+91 9000000039',
    password_hash: genericPassHash,
    blood_group: 'O+',
    age: 26,
    gender: 'Male',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    address: '14, Market Road, Villivakkam, Chennai',
    emergency_contact: '+91 9000000099 (Suresh Kumar - Father)',
    notifications_enabled: true,
    theme_preference: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  memoryDb.patients.set(rameshPatient.id, rameshPatient);

  const emergencyDemo = {
    id: 'walk-demo-moon-emergency',
    clinic_id: 'c-demo-moon-01',
    doctor_id: 'doc-demo-arun-01',
    patient_id: 'pat-demo-ramesh-emergency',
    patient_name: 'Emergency Patient Ramesh',
    patient_phone: '+91 9000000039',
    age: 26,
    gender: 'Male',
    reason: 'Severe acute dental facial trauma & bleeding laceration',
    priority: 'EMERGENCY',
    token_number: 'E-Wncy',
    status: 'WAITING',
    queue_position: 1, // Priority 1 moves to top of live queue
    estimated_wait_minutes: 0,
    created_at: new Date().toISOString(),
  };
  memoryDb.walk_ins.set(emergencyDemo.id, emergencyDemo);

  // ============================================================
  // 9. SEED PRESCRIPTIONS & CONSULTATIONS
  // ============================================================
  memoryDb.consultations.set('apt-2026-001', {
    id: 'cons-apt-2026-001',
    appointment_id: 'apt-2026-001',
    patient_id: 'pat-101',
    doctor_id: 'doc-demo-ananya-08',
    clinic_id: 'c-demo-moon-01',
    clinical_notes: 'Allergic pharyngitis with localized toothache. Prescribed antihistamine and analgesics.',
    symptoms: ['Seasonal Allergic Bronchitis with Mild Pharyngitis'],
    assessment: 'Seasonal allergic bronchitis & mild localized dental tenderness',
    diagnosis: 'Seasonal Allergic Bronchitis with Mild Pharyngitis',
    follow_up_date: 'In 1 week',
    follow_up_reason: 'Review symptom resolution',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  memoryDb.prescriptions.set('apt-2026-001', {
    id: 'rx-apt-2026-001',
    appointment_id: 'apt-2026-001',
    patient_id: 'pat-101',
    doctor_id: 'doc-demo-ananya-08',
    doctor_name: 'Dr. Ananya Deshmukh',
    doctor_specialization: 'Dentistry',
    clinic_id: 'c-demo-moon-01',
    clinic_name: 'Moon Dental Clinic',
    clinic_address: 'Villivakkam, Chennai',
    date: todayStr,
    diagnosis: 'Seasonal Allergic Bronchitis with Mild Pharyngitis',
    medicines: [
      {
        name: 'Paracetamol 650mg (Dolo)',
        dosage: '1 Tablet',
        frequency: 'Thrice daily',
        duration: '3 days',
        instructions: 'Take after meals',
      },
      {
        name: 'Amoxicillin 500mg',
        dosage: '1 Capsule',
        frequency: 'Twice daily',
        duration: '5 days',
        instructions: 'Complete course',
      },
      {
        name: 'Levocetirizine 5mg',
        dosage: '1 Tablet',
        frequency: 'Once at bedtime',
        duration: '5 days',
        instructions: 'Take at night',
      },
    ],
    created_at: new Date().toISOString(),
  });

  // Health records file for pat-101 / pat-demo-01
  memoryDb.medical_files.set('file-demo-01', {
    id: 'file-demo-01',
    patient_id: 'pat-101',
    appointment_id: 'apt-2026-001',
    clinic_id: 'c-demo-moon-01',
    file_name: 'Complete_Blood_Count_CBC.pdf',
    file_type: 'application/pdf',
    file_size: '1.2 MB',
    uri: 'https://medlink.health/records/cbc_sample.pdf',
    upload_date: todayStr,
    test_name: 'Complete Blood Count (CBC)',
    category: 'Diagnostic report',
    clinic_performed: 'Diagnostic Center',
    test_date: todayStr,
    reason_for_test: 'Evaluate baseline hematological indices and platelet count',
    created_at: new Date().toISOString(),
  });

  // ============================================================
  // 10. SEED PHARMACY INVENTORY & FEFO BATCHES
  // ============================================================
  const demoPharmacyItems = [
    // Moon Dental Clinic FEFO Batches
    {
      id: 'rx-item-dolo-01',
      clinic_id: 'c-demo-moon-01',
      name: 'Paracetamol 650mg (Dolo)',
      generic_name: 'Paracetamol',
      category: 'Analgesics',
      dosage_form: 'Tablet',
      strength: '650mg',
      batch_number: 'BATCH-DOLO-2026A',
      expiry_date: '2026-11-30', // Earlier expiry -> dispensed first (FEFO)
      quantity: 50,
      min_stock_level: 20,
      reorder_quantity: 100,
      unit_price: 3.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'rx-item-dolo-02',
      clinic_id: 'c-demo-moon-01',
      name: 'Paracetamol 650mg (Dolo)',
      generic_name: 'Paracetamol',
      category: 'Analgesics',
      dosage_form: 'Tablet',
      strength: '650mg',
      batch_number: 'BATCH-DOLO-2027B',
      expiry_date: '2027-12-31', // Later expiry
      quantity: 100,
      min_stock_level: 20,
      reorder_quantity: 100,
      unit_price: 3.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'rx-item-amox-01',
      clinic_id: 'c-demo-moon-01',
      name: 'Amoxicillin 500mg',
      generic_name: 'Amoxicillin',
      category: 'Antibiotics',
      dosage_form: 'Capsule',
      strength: '500mg',
      batch_number: 'BATCH-AMOX-2027A',
      expiry_date: '2027-06-30',
      quantity: 5, // LOW_STOCK for inventory tests
      min_stock_level: 15,
      reorder_quantity: 50,
      unit_price: 8.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Canonical Doctor Consultation FEFO Batches: Amoxicillin & Potassium Clavulanate 625 mg
    {
      id: 'rx-item-amxclv-01',
      clinic_id: 'c-demo-moon-01',
      name: 'Amoxicillin & Potassium Clavulanate 625 mg',
      generic_name: 'Amoxicillin + Potassium Clavulanate',
      category: 'Antibiotics',
      dosage_form: 'Tablet',
      strength: '625 mg',
      batch_number: 'BATCH-AMXCLV-2026A',
      expiry_date: '2026-11-30', // Earlier expiry -> FEFO selected first
      quantity: 50,
      min_stock_level: 20,
      reorder_quantity: 100,
      unit_price: 22.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'rx-item-amxclv-02',
      clinic_id: 'c-demo-moon-01',
      name: 'Amoxicillin & Potassium Clavulanate 625 mg',
      generic_name: 'Amoxicillin + Potassium Clavulanate',
      category: 'Antibiotics',
      dosage_form: 'Tablet',
      strength: '625 mg',
      batch_number: 'BATCH-AMXCLV-2027B',
      expiry_date: '2027-10-31', // Later expiry -> FEFO selected second
      quantity: 100,
      min_stock_level: 20,
      reorder_quantity: 100,
      unit_price: 22.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'rx-item-amxclv-apollo-01',
      clinic_id: 'c-demo-apollo-02',
      name: 'Amoxicillin & Potassium Clavulanate 625 mg',
      generic_name: 'Amoxicillin + Potassium Clavulanate',
      category: 'Antibiotics',
      dosage_form: 'Tablet',
      strength: '625 mg',
      batch_number: 'BATCH-AMXCLV-APOLLO',
      expiry_date: '2027-08-31',
      quantity: 80,
      min_stock_level: 20,
      reorder_quantity: 100,
      unit_price: 22.5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    // Apollo Family Care Centre Items
    {
      id: 'rx-item-levo-01',
      clinic_id: 'c-demo-apollo-02',
      name: 'Levocetirizine 5mg',
      generic_name: 'Levocetirizine',
      category: 'Antihistamines',
      dosage_form: 'Tablet',
      strength: '5mg',
      batch_number: 'BATCH-LEVO-2028A',
      expiry_date: '2028-01-31',
      quantity: 80,
      min_stock_level: 20,
      reorder_quantity: 40,
      unit_price: 5.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'rx-item-met-01',
      clinic_id: 'c-demo-endowell-14',
      name: 'Metformin 500mg',
      generic_name: 'Metformin',
      category: 'Antidiabetic',
      dosage_form: 'Tablet',
      strength: '500mg',
      batch_number: 'BATCH-MET-2027A',
      expiry_date: '2027-08-31',
      quantity: 120,
      min_stock_level: 30,
      reorder_quantity: 100,
      unit_price: 4.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: 'rx-item-ator-01',
      clinic_id: 'c-demo-heart-04',
      name: 'Atorvastatin 20mg',
      generic_name: 'Atorvastatin',
      category: 'Cardiovascular',
      dosage_form: 'Tablet',
      strength: '20mg',
      batch_number: 'BATCH-ATOR-2027B',
      expiry_date: '2027-10-31',
      quantity: 90,
      min_stock_level: 25,
      reorder_quantity: 100,
      unit_price: 11.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  demoPharmacyItems.forEach((item) => memoryDb.pharmacy_inventory.set(item.id, item));

  // Save to persistent file
  saveStateToFile();

  console.log('✅ MedLink deterministic multi-clinic demo database seeded successfully:');
  console.log(\`   - Patients: \${memoryDb.patients.size}\`);
  console.log(\`   - Clinics: \${memoryDb.clinics.size} (17 full-specialty Chennai clinics)\`);
  console.log(\`   - Doctors: \${memoryDb.doctors.size}\`);
  console.log(\`   - Departments: \${memoryDb.departments.size}\`);
  console.log(\`   - Procedures: \${memoryDb.procedures.size}\`);
  console.log(\`   - Appointments: \${memoryDb.appointments.size}\`);
  console.log(\`   - Pharmacy SKUs: \${memoryDb.pharmacy_inventory.size}\`);
};
`;

const targetPath = path.join(__dirname, '..', 'src', 'database', 'seed.ts');
fs.writeFileSync(targetPath, seedContent, 'utf8');
console.log('Successfully wrote new seed.ts at', targetPath);
