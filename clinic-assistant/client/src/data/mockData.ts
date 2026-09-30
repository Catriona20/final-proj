import { Patient } from '../types/patient.js';
import { Doctor } from '../types/doctor.js';
import { Appointment } from '../types/appointment.js';
import { QueueEntry } from '../types/queue.js';
import { WalkIn } from '../types/walkin.js';
import { DashboardSummary } from '../types/dashboard.js';
import { ClinicNotification } from '../types/notification.js';

export const initialPatients: Patient[] = [
  {
    id: 'pat-demo-01',
    name: 'Aarav Sharma',
    phone: '+91 9000000001',
    age: 32,
    gender: 'Male',
    email: 'patient01@demo.medlink.test',
    address: '24, Luz Church Road, Mylapore, Chennai',
    lastVisit: '10 Aug 2026',
    status: 'Active',
    bloodGroup: 'B+',
    emergencyContact: 'Pooja Sharma (Spouse) - +91 9000000091',
    notes: 'Master demo patient account.'
  },
  {
    id: 'pat-demo-02',
    name: 'Sneha Patel',
    phone: '+91 9000000002',
    age: 29,
    gender: 'Female',
    email: 'patient02@demo.medlink.test',
    address: '12, Gandhi Nagar 1st Main Rd, Adyar, Chennai',
    lastVisit: '15 Aug 2026',
    status: 'Active',
    bloodGroup: 'O+',
    emergencyContact: 'Ramesh Patel (Father) - +91 9000000092',
    notes: 'Primary verification patient account.'
  },
  {
    id: 'pat-demo-03',
    name: 'Rajesh Kumar',
    phone: '+91 9000000003',
    age: 52,
    gender: 'Male',
    email: 'patient03@demo.medlink.test',
    address: '18, Venkatnarayana Road, T Nagar, Chennai',
    lastVisit: '18 Aug 2026',
    status: 'Active',
    bloodGroup: 'A+',
    emergencyContact: 'Kavita Kumar (Spouse) - +91 9000000093',
    notes: 'Cardiology patient.'
  },
  {
    id: 'pat-demo-04',
    name: 'Priya Raman',
    phone: '+91 9000000004',
    age: 28,
    gender: 'Female',
    email: 'patient04@demo.medlink.test',
    address: '154, Mount Road, Guindy, Chennai',
    lastVisit: '20 Aug 2026',
    status: 'Active',
    bloodGroup: 'AB+',
    emergencyContact: 'Maya Raman (Mother) - +91 9000000094',
    notes: 'Pediatrics patient.'
  },
  {
    id: 'pat-demo-05',
    name: 'Vikram Malhotra',
    phone: '+91 9000000005',
    age: 45,
    gender: 'Male',
    email: 'patient05@demo.medlink.test',
    address: '42, 100 Feet Bypass Road, Velachery, Chennai',
    lastVisit: '22 Aug 2026',
    status: 'Active',
    bloodGroup: 'O-',
    emergencyContact: 'Deepak Malhotra (Brother) - +91 9000000095',
    notes: 'Dermatology patient.'
  },
  {
    id: 'pat-demo-06',
    name: 'Ananya Iyer',
    phone: '+91 9000000006',
    age: 31,
    gender: 'Female',
    email: 'patient06@demo.medlink.test',
    address: 'Plot 102, 2nd Avenue, Anna Nagar West, Chennai',
    lastVisit: '24 Aug 2026',
    status: 'Active',
    bloodGroup: 'B-',
    emergencyContact: 'Raghav Iyer (Spouse) - +91 9000000096',
    notes: 'ENT patient.'
  },
  {
    id: 'pat-demo-07',
    name: 'Rahul Verma',
    phone: '+91 9000000007',
    age: 38,
    gender: 'Male',
    email: 'patient07@demo.medlink.test',
    address: '77, Chamiers Road, R.A. Puram, Chennai',
    lastVisit: '25 Aug 2026',
    status: 'Active',
    bloodGroup: 'A-',
    emergencyContact: 'Lavanya Verma (Spouse) - +91 9000000097',
    notes: 'Orthopedics patient.'
  },
  {
    id: 'pat-demo-08',
    name: 'Pooja Nair',
    phone: '+91 9000000008',
    age: 26,
    gender: 'Female',
    email: 'patient08@demo.medlink.test',
    address: '33, Ormes Road, Kilpauk, Chennai',
    lastVisit: '28 Aug 2026',
    status: 'Active',
    bloodGroup: 'B+',
    emergencyContact: 'Sarala Nair (Mother) - +91 9000000098',
    notes: 'Gynecology patient.'
  },
  {
    id: 'pat-demo-09',
    name: 'Rahul Menon',
    phone: '+91 9000000009',
    age: 33,
    gender: 'Male',
    email: 'patient09@demo.medlink.test',
    address: '55, Kutchery Road, Mylapore, Chennai',
    lastVisit: '28 Aug 2026',
    status: 'Active',
    bloodGroup: 'O-',
    emergencyContact: 'Deepa Menon (Sister) - +91 9000000099',
    notes: 'Dentistry patient.'
  },
  {
    id: 'pat-demo-10',
    name: 'Priya Balaji',
    phone: '+91 9000000010',
    age: 58,
    gender: 'Female',
    email: 'patient10@demo.medlink.test',
    address: '82, OMR Phase 1, Perungudi, Chennai',
    lastVisit: '27 Aug 2026',
    status: 'Active',
    bloodGroup: 'B+',
    emergencyContact: 'Balaji Varadan (Spouse) - +91 9000000010',
    notes: 'Cardiology patient.'
  },
  {
    id: 'pat-demo-11',
    name: 'Nithya Raj',
    phone: '+91 9000000011',
    age: 27,
    gender: 'Female',
    email: 'patient11@demo.medlink.test',
    address: '104, Rajiv Gandhi Salai, Thoraipakkam, Chennai',
    lastVisit: '26 Aug 2026',
    status: 'Active',
    bloodGroup: 'A+',
    emergencyContact: 'Rajasekar M (Father) - +91 9000000011',
    notes: 'General Medicine patient.'
  },
  {
    id: 'pat-demo-12',
    name: 'Sanjay Prakash',
    phone: '+91 9000000012',
    age: 49,
    gender: 'Male',
    email: 'patient12@demo.medlink.test',
    address: '33, Medavakkam High Road, Sholinganallur, Chennai',
    lastVisit: '25 Aug 2026',
    status: 'Active',
    bloodGroup: 'O+',
    emergencyContact: 'Usha Prakash (Spouse) - +91 9000000012',
    notes: 'Orthopedics patient.'
  },
  {
    id: 'pat-demo-13',
    name: 'Deepa Sundaram',
    phone: '+91 9000000013',
    age: 34,
    gender: 'Female',
    email: 'patient13@demo.medlink.test',
    address: '18, GST Road, West Tambaram, Chennai',
    lastVisit: '24 Aug 2026',
    status: 'Active',
    bloodGroup: 'B+',
    emergencyContact: 'Sundaram V (Father) - +91 9000000013',
    notes: 'Dermatology patient.'
  },
  {
    id: 'pat-demo-14',
    name: 'Vikram Seth',
    phone: '+91 9000000014',
    age: 44,
    gender: 'Male',
    email: 'patient14@demo.medlink.test',
    address: '47, Radha Nagar Main Rd, Chromepet, Chennai',
    lastVisit: '23 Aug 2026',
    status: 'Active',
    bloodGroup: 'AB-',
    emergencyContact: 'Deepak Seth (Brother) - +91 9000000014',
    notes: 'ENT patient.'
  },
  {
    id: 'pat-demo-15',
    name: 'Sunita Reddy',
    phone: '+91 9000000015',
    age: 61,
    gender: 'Female',
    email: 'patient15@demo.medlink.test',
    address: '12, Race Course Road, Guindy, Chennai',
    lastVisit: '22 Aug 2026',
    status: 'Active',
    bloodGroup: 'A+',
    emergencyContact: 'Varun Reddy (Son) - +91 9000000015',
    notes: 'Cardiology patient.'
  },
  {
    id: 'pat-demo-16',
    name: 'Suresh Menon',
    phone: '+91 9000000016',
    age: 63,
    gender: 'Male',
    email: 'patient16@demo.medlink.test',
    address: '25, Ormes Road, Kilpauk, Chennai',
    lastVisit: '21 Aug 2026',
    status: 'Active',
    bloodGroup: 'B+',
    emergencyContact: 'Radhika Menon (Spouse) - +91 9000000016',
    notes: 'General Medicine patient.'
  },
  {
    id: 'pat-demo-17',
    name: 'Neha Agarwal',
    phone: '+91 9000000017',
    age: 30,
    gender: 'Female',
    email: 'patient17@demo.medlink.test',
    address: '71, Whites Road, Royapettah, Chennai',
    lastVisit: '20 Aug 2026',
    status: 'Active',
    bloodGroup: 'O-',
    emergencyContact: 'Sangeeta Agarwal (Mother) - +91 9000000017',
    notes: 'Gynecology patient.'
  },
  {
    id: 'pat-demo-18',
    name: 'Arjun Rao',
    phone: '+91 9000000018',
    age: 36,
    gender: 'Male',
    email: 'patient18@demo.medlink.test',
    address: '15, 5th Avenue, Besant Nagar, Chennai',
    lastVisit: '19 Aug 2026',
    status: 'Active',
    bloodGroup: 'A+',
    emergencyContact: 'Priya Rao (Sister) - +91 9000000018',
    notes: 'Ophthalmology patient.'
  },
  {
    id: 'pat-demo-19',
    name: 'Kavita Deshmukh',
    phone: '+91 9000000019',
    age: 41,
    gender: 'Female',
    email: 'patient19@demo.medlink.test',
    address: '22, East Coast Road, Thiruvanmiyur, Chennai',
    lastVisit: '18 Aug 2026',
    status: 'Active',
    bloodGroup: 'AB+',
    emergencyContact: 'Nitin Deshmukh (Spouse) - +91 9000000019',
    notes: 'Neurology patient.'
  },
  {
    id: 'pat-demo-20',
    name: 'Manoj Pillai',
    phone: '+91 9000000020',
    age: 52,
    gender: 'Male',
    email: 'patient20@demo.medlink.test',
    address: '93, MTH Road, Ambattur Industrial Estate, Chennai',
    lastVisit: '17 Aug 2026',
    status: 'Active',
    bloodGroup: 'B-',
    emergencyContact: 'Usha Pillai (Spouse) - +91 9000000020',
    notes: 'Pediatrics patient.'
  },
  {
    id: 'PAT001',
    name: 'Rahul Kumar',
    phone: '+1 (555) 234-5678',
    age: 42,
    gender: 'Male',
    email: 'rahul.kumar@example.com',
    address: '142 Maple Street, Suite 4B, Metro City',
    lastVisit: '12 Aug 2026',
    status: 'Active',
    bloodGroup: 'O+',
    emergencyContact: 'Sunita Kumar (Wife) - +1 (555) 234-5679',
    notes: 'Hypertension history, scheduled consultation.'
  },
  {
    id: 'PAT002',
    name: 'Priya Sharma (Patient)',
    phone: '+1 (555) 876-5432',
    age: 29,
    gender: 'Female',
    email: 'priya.sharma@example.com',
    address: '88 Oak Avenue, Apt 12, Metro City',
    lastVisit: '15 Aug 2026',
    status: 'Active',
    bloodGroup: 'B+',
    emergencyContact: 'Rohan Sharma (Brother) - +1 (555) 876-5430',
    notes: 'Follow-up consultation.'
  },
  {
    id: 'PAT003',
    name: 'Arjun Patel',
    phone: '+1 (555) 345-6789',
    age: 35,
    gender: 'Male',
    email: 'arjun.patel@example.com',
    address: '24 Pine Boulevard, Metro City',
    lastVisit: '05 Jul 2026',
    status: 'Active',
    bloodGroup: 'A+',
    emergencyContact: 'Anita Patel (Spouse) - +1 (555) 345-6780',
    notes: 'General checkup.'
  },
  {
    id: 'PAT004',
    name: 'Sneha Reddy',
    phone: '+1 (555) 987-6543',
    age: 31,
    gender: 'Female',
    email: 'sneha.reddy@example.com',
    address: '51 Cedar Lane, Metro City',
    lastVisit: '28 Jun 2026',
    status: 'Active',
    bloodGroup: 'AB+',
    emergencyContact: 'Amit Reddy (Husband) - +1 (555) 987-6540',
    notes: 'General review.'
  },
  {
    id: 'PAT005',
    name: 'Amit Verma',
    phone: '+1 (555) 456-7890',
    age: 55,
    gender: 'Male',
    email: 'amit.verma@example.com',
    address: '102 Elm Street, Metro City',
    lastVisit: '18 Aug 2026',
    status: 'Active',
    bloodGroup: 'O-',
    emergencyContact: 'Linda Verma (Wife) - +1 (555) 456-7899',
    notes: 'Follow-up.'
  },
  {
    id: 'PAT006',
    name: 'Neha Singh',
    phone: '+1 (555) 654-3210',
    age: 25,
    gender: 'Female',
    email: 'neha.singh@example.com',
    address: '73 Birch Drive, Metro City',
    lastVisit: '10 Aug 2026',
    status: 'Active',
    bloodGroup: 'A-',
    emergencyContact: 'Kavita Singh (Mother) - +1 (555) 654-3219',
    notes: 'Routine checkup.'
  },
  {
    id: 'PAT007',
    name: 'Robert Brown',
    phone: '+1 (555) 789-0123',
    age: 48,
    gender: 'Male',
    email: 'robert.b@example.com',
    address: '61 Aspen Court, Metro City',
    lastVisit: '12 Aug 2026',
    status: 'Active',
    bloodGroup: 'B-',
    emergencyContact: 'Jessica Brown (Sister) - +1 (555) 789-0129',
    notes: 'Emergency walk-in history.'
  },
  {
    id: 'PAT008',
    name: 'Sarah Miller',
    phone: '+1 (555) 890-1234',
    age: 38,
    gender: 'Female',
    email: 'sarah.miller@example.com',
    address: '94 Willow Way, Metro City',
    lastVisit: '14 Aug 2026',
    status: 'Active',
    bloodGroup: 'O+',
    emergencyContact: 'David Miller (Husband) - +1 (555) 890-1230',
    notes: 'Sore throat history.'
  },
  {
    id: 'PAT009',
    name: 'David Clark',
    phone: '+1 (555) 123-9876',
    age: 50,
    gender: 'Male',
    email: 'david.clark@example.com',
    address: '17 Cypress Street, Metro City',
    lastVisit: '01 Aug 2026',
    status: 'Active',
    bloodGroup: 'AB-',
    emergencyContact: 'Helen Clark (Wife) - +1 (555) 123-9870',
    notes: 'Routine annual physical.'
  },
  {
    id: 'PAT010',
    name: 'Emma Watson',
    phone: '+1 (555) 234-8765',
    age: 31,
    gender: 'Female',
    email: 'emma.watson@example.com',
    address: '83 Magnolia Place, Metro City',
    lastVisit: '14 Jul 2026',
    status: 'Active',
    bloodGroup: 'A+',
    emergencyContact: 'Arthur Watson (Father) - +1 (555) 234-8760',
    notes: 'General health consultation.'
  }
];

export const initialDoctors: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Lee',
    specialization: 'General Medicine',
    status: 'AVAILABLE',
    currentPatients: 0,
    roomNumber: 'Room 101',
    todayAppointmentsCount: 6,
    phone: '+1 (555) 101-0001'
  },
  {
    id: 'doc-2',
    name: 'Dr. Arun Kumar',
    specialization: 'Cardiology',
    status: 'BUSY',
    currentPatients: 1,
    currentPatientName: 'Emma Watson',
    roomNumber: 'Room 104',
    todayAppointmentsCount: 2,
    phone: '+1 (555) 101-0002'
  },
  {
    id: 'doc-3',
    name: 'Dr. Priya Sharma',
    specialization: 'Pediatrics',
    status: 'AVAILABLE',
    currentPatients: 0,
    roomNumber: 'Room 102',
    todayAppointmentsCount: 1,
    phone: '+1 (555) 101-0003'
  },
  {
    id: 'doc-4',
    name: 'Dr. Ahmed Khan',
    specialization: 'Dermatology',
    status: 'OFFLINE',
    currentPatients: 0,
    roomNumber: 'Room 205',
    todayAppointmentsCount: 1,
    phone: '+1 (555) 101-0004'
  },
  {
    id: 'doc-5',
    name: 'Dr. John Wilson',
    specialization: 'Orthopedics',
    status: 'AVAILABLE',
    currentPatients: 0,
    roomNumber: 'Room 108',
    todayAppointmentsCount: 1,
    phone: '+1 (555) 101-0005'
  },
  {
    id: 'doc-6',
    name: 'Dr. Meera Patel',
    specialization: 'ENT',
    status: 'AVAILABLE',
    currentPatients: 0,
    roomNumber: 'Room 105',
    todayAppointmentsCount: 1,
    phone: '+1 (555) 101-0006'
  },
  {
    id: 'doc-7',
    name: 'Dr. David Thomas',
    specialization: 'General Medicine',
    status: 'AVAILABLE',
    currentPatients: 0,
    roomNumber: 'Room 103',
    todayAppointmentsCount: 1,
    phone: '+1 (555) 101-0007'
  }
];

export const initialAppointments: Appointment[] = [
  {
    id: 'APT001',
    patientId: 'PAT001',
    patientName: 'Rahul Kumar',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Lee',
    department: 'General Medicine',
    time: '10:00 AM',
    date: '2026-08-21',
    type: 'Consultation',
    status: 'BOOKED',
    notes: 'Prescription refill & routine BP checkup.'
  },
  {
    id: 'APT002',
    patientId: 'PAT002',
    patientName: 'Priya Sharma',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Lee',
    department: 'General Medicine',
    time: '10:15 AM',
    date: '2026-08-21',
    type: 'Follow-up',
    status: 'BOOKED',
    notes: 'Follow-up on laboratory panel results.'
  },
  {
    id: 'APT003',
    patientId: 'PAT003',
    patientName: 'Arjun Patel',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Lee',
    department: 'General Medicine',
    time: '10:30 AM',
    date: '2026-08-21',
    type: 'Consultation',
    status: 'BOOKED',
    notes: 'General medical consultation.'
  },
  {
    id: 'APT004',
    patientId: 'PAT004',
    patientName: 'Sneha Reddy',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Lee',
    department: 'General Medicine',
    time: '10:45 AM',
    date: '2026-08-21',
    type: 'Consultation',
    status: 'BOOKED',
    notes: 'Mild seasonal allergy and throat check.'
  },
  {
    id: 'APT005',
    patientId: 'PAT005',
    patientName: 'Amit Verma',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Lee',
    department: 'General Medicine',
    time: '11:00 AM',
    date: '2026-08-21',
    type: 'Follow-up',
    status: 'BOOKED',
    notes: 'Post-therapy review.'
  },
  {
    id: 'APT006',
    patientId: 'PAT006',
    patientName: 'Neha Singh',
    doctorId: 'doc-1',
    doctorName: 'Dr. Sarah Lee',
    department: 'General Medicine',
    time: '11:15 AM',
    date: '2026-08-21',
    type: 'Routine Checkup',
    status: 'BOOKED',
    notes: 'Annual preventative screening.'
  },
  {
    id: 'APT007',
    patientId: 'PAT009',
    patientName: 'David Clark',
    doctorId: 'doc-7',
    doctorName: 'Dr. David Thomas',
    department: 'General Medicine',
    time: '01:00 PM',
    date: '2026-08-21',
    type: 'Routine Checkup',
    status: 'BOOKED',
    notes: 'Annual comprehensive health check.'
  },
  {
    id: 'APT008',
    patientId: 'PAT010',
    patientName: 'Emma Watson',
    doctorId: 'doc-2',
    doctorName: 'Dr. Arun Kumar',
    department: 'Cardiology',
    time: '01:30 PM',
    date: '2026-08-21',
    type: 'Consultation',
    status: 'CHECKED_IN',
    notes: 'Cardiology screening and ECG.'
  },
  {
    id: 'APT009',
    patientId: 'PAT007',
    patientName: 'Robert Brown',
    doctorId: 'doc-5',
    doctorName: 'Dr. John Wilson',
    department: 'Orthopedics',
    time: '02:00 PM',
    date: '2026-08-21',
    type: 'Follow-up',
    status: 'BOOKED',
    notes: 'Wrist sprain follow-up.'
  },
  {
    id: 'APT010',
    patientId: 'PAT008',
    patientName: 'Sarah Miller',
    doctorId: 'doc-6',
    doctorName: 'Dr. Meera Patel',
    department: 'ENT',
    time: '02:30 PM',
    date: '2026-08-21',
    type: 'Consultation',
    status: 'BOOKED',
    notes: 'Sinus consultation.'
  }
];

export const initialQueue: QueueEntry[] = [
  {
    id: 'q-1',
    queueNumber: 'A001',
    patientName: 'Rahul Kumar',
    doctorName: 'Dr. Sarah Lee',
    priority: 'NORMAL',
    waitingTime: 0,
    estimatedWait: 0,
    status: 'WAITING',
    appointmentId: 'APT001',
    reason: '10:00 AM Consultation'
  },
  {
    id: 'q-2',
    queueNumber: 'A002',
    patientName: 'Priya Sharma',
    doctorName: 'Dr. Sarah Lee',
    priority: 'NORMAL',
    waitingTime: 5,
    estimatedWait: 15,
    status: 'WAITING',
    appointmentId: 'APT002',
    reason: '10:15 AM Follow-up'
  },
  {
    id: 'q-3',
    queueNumber: 'A003',
    patientName: 'Arjun Patel',
    doctorName: 'Dr. Sarah Lee',
    priority: 'NORMAL',
    waitingTime: 10,
    estimatedWait: 30,
    status: 'WAITING',
    appointmentId: 'APT003',
    reason: '10:30 AM Consultation'
  },
  {
    id: 'q-4',
    queueNumber: 'A004',
    patientName: 'Sneha Reddy',
    doctorName: 'Dr. Sarah Lee',
    priority: 'NORMAL',
    waitingTime: 15,
    estimatedWait: 45,
    status: 'WAITING',
    appointmentId: 'APT004',
    reason: '10:45 AM Consultation'
  },
  {
    id: 'q-5',
    queueNumber: 'E001',
    patientName: 'Robert Brown',
    doctorName: 'Dr. Priya Sharma',
    priority: 'EMERGENCY',
    waitingTime: 2,
    estimatedWait: 0,
    status: 'WAITING',
    walkInId: 'w-1',
    reason: 'Acute Chest Discomfort & Dizziness'
  }
];

export const initialWalkIns: WalkIn[] = [
  {
    id: 'w-1',
    patientName: 'Robert Brown',
    phone: '+1 (555) 789-0123',
    reason: 'Acute chest discomfort & severe dizziness',
    preferredDoctor: 'Dr. Priya Sharma',
    registeredAt: '10:15 AM',
    status: 'WAITING',
    priority: 'EMERGENCY',
    age: 48,
    gender: 'Male'
  },
  {
    id: 'w-2',
    patientName: 'Sarah Miller',
    phone: '+1 (555) 890-1234',
    reason: 'High fever (102°F) and severe sore throat',
    preferredDoctor: 'Dr. Sarah Lee',
    registeredAt: '10:32 AM',
    status: 'WAITING',
    priority: 'URGENT',
    age: 38,
    gender: 'Female'
  },
  {
    id: 'w-3',
    patientName: 'Lucas Gray',
    phone: '+1 (555) 321-7654',
    reason: 'Minor sprain on left wrist during sports',
    preferredDoctor: 'Dr. John Wilson',
    registeredAt: '10:45 AM',
    status: 'WAITING',
    priority: 'NORMAL',
    age: 27,
    gender: 'Male'
  },
  {
    id: 'w-4',
    patientName: 'Elena Rostova',
    phone: '+1 (555) 654-0987',
    reason: 'Seasonal allergic contact dermatitis',
    preferredDoctor: 'Dr. Ahmed Khan',
    registeredAt: '11:05 AM',
    status: 'WAITING',
    priority: 'NORMAL',
    age: 33,
    gender: 'Female'
  },
  {
    id: 'w-5',
    patientName: 'David Clark',
    phone: '+1 (555) 123-9876',
    reason: 'Blood pressure check & prescription renewal',
    preferredDoctor: 'Dr. David Thomas',
    registeredAt: '11:20 AM',
    status: 'WAITING',
    priority: 'NORMAL',
    age: 50,
    gender: 'Male'
  }
];

export const initialNotifications: ClinicNotification[] = [
  {
    id: 'notif-welcome-1',
    patientName: 'Robert Brown',
    doctorName: 'Dr. Priya Sharma',
    type: 'QUEUE_UPDATE',
    title: 'Emergency Triage Enqueued',
    message: 'Robert Brown (E001) placed at top of queue for Dr. Priya Sharma.',
    createdAt: '10:15 AM',
    read: false,
    status: 'ACCEPTED',
    newWaitTime: 0,
    newEta: 'Immediate'
  }
];

export const computeSummary = (
  appointments: Appointment[],
  doctors: Doctor[],
  walkIns: WalkIn[],
  queue: QueueEntry[]
): DashboardSummary => {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const isToday = (apt: Appointment) => {
    if (!apt.date) return true;
    const clean = apt.date.trim();
    if (clean.toLowerCase().startsWith('today')) return true;
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean === todayStr;
    const p = new Date(clean);
    if (!isNaN(p.getTime())) {
      const pStr = `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, '0')}-${String(p.getDate()).padStart(2, '0')}`;
      return pStr === todayStr;
    }
    return false;
  };

  const todayApts = appointments.filter(isToday);
  const total = todayApts.filter(
    (a) => !['CANCELLED', 'CANCELED', 'NO_SHOW'].includes(a.status?.toUpperCase() || '')
  ).length;
  const remaining = todayApts.filter(
    (a) =>
      !['CANCELLED', 'CANCELED', 'COMPLETED', 'NO_SHOW'].includes(a.status?.toUpperCase() || '') &&
      (a.status === 'BOOKED' || a.status === 'WAITING' || a.status === 'CHECKED_IN')
  ).length;
  const checkedIn = todayApts.filter(
    (a) =>
      (a.status === 'CHECKED_IN' || a.status === 'IN_CONSULTATION') &&
      !['CANCELLED', 'CANCELED', 'NO_SHOW'].includes(a.status?.toUpperCase() || '')
  ).length;
  const waiting = queue.filter(
    (q) => q.status === 'WAITING' && !['CANCELLED', 'CANCELED'].includes((q as any).appointmentStatus || '')
  ).length;
  const available = doctors.filter((d) => d.status === 'AVAILABLE' || (d.status as string) !== 'OFFLINE').length;

  return {
    todayAppointments: { total, remaining },
    checkedIn: { total: checkedIn, subtitle: 'Patients checked in today' },
    waiting: { total: waiting, subtitle: 'Currently in waiting queue' },
    availableDoctors: { available, total: doctors.length, subtitle: `Out of ${doctors.length} doctors online` },
    walkIns: { total: walkIns.length, subtitle: "Today's registered walk-ins" },
  };
};
