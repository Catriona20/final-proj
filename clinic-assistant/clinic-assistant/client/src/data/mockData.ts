import { Patient } from '../types/patient.js';
import { Doctor } from '../types/doctor.js';
import { Appointment } from '../types/appointment.js';
import { QueueEntry } from '../types/queue.js';
import { WalkIn } from '../types/walkin.js';
import { DashboardSummary } from '../types/dashboard.js';
import { ClinicNotification } from '../types/notification.js';

export const initialPatients: Patient[] = [
  {
    id: 'PAT001',
    name: 'Rahul Kumar',
    phone: '+1 (555) 234-5678',
    age: 42,
    gender: 'Male',
    email: 'rahul.kumar@example.com',
    address: '142 Maple Street, Suite 4B, Metro City',
    lastVisit: '12 Aug 2026',
    status: 'In Queue',
    bloodGroup: 'O+',
    emergencyContact: 'Sunita Kumar (Wife) - +1 (555) 234-5679',
    notes: 'Hypertension history, scheduled 10:00 AM consultation with Dr. Sarah Lee.'
  },
  {
    id: 'PAT002',
    name: 'Priya Sharma',
    phone: '+1 (555) 876-5432',
    age: 29,
    gender: 'Female',
    email: 'priya.sharma@example.com',
    address: '88 Oak Avenue, Apt 12, Metro City',
    lastVisit: 'Today',
    status: 'In Queue',
    bloodGroup: 'B+',
    emergencyContact: 'Rohan Sharma (Brother) - +1 (555) 876-5430',
    notes: 'Follow-up consultation scheduled for 10:15 AM with Dr. Sarah Lee.'
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
    status: 'In Queue',
    bloodGroup: 'A+',
    emergencyContact: 'Anita Patel (Spouse) - +1 (555) 345-6780',
    notes: 'General checkup scheduled for 10:30 AM with Dr. Sarah Lee.'
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
    status: 'In Queue',
    bloodGroup: 'AB+',
    emergencyContact: 'Amit Reddy (Husband) - +1 (555) 987-6540',
    notes: 'General review scheduled for 10:45 AM with Dr. Sarah Lee.'
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
    status: 'Scheduled',
    bloodGroup: 'O-',
    emergencyContact: 'Linda Verma (Wife) - +1 (555) 456-7899',
    notes: 'Follow-up scheduled for 11:00 AM with Dr. Sarah Lee.'
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
    status: 'Scheduled',
    bloodGroup: 'A-',
    emergencyContact: 'Kavita Singh (Mother) - +1 (555) 654-3219',
    notes: 'Routine checkup scheduled for 11:15 AM with Dr. Sarah Lee.'
  },
  {
    id: 'PAT007',
    name: 'Robert Brown',
    phone: '+1 (555) 789-0123',
    age: 48,
    gender: 'Male',
    email: 'robert.b@example.com',
    address: '61 Aspen Court, Metro City',
    lastVisit: 'Today',
    status: 'In Queue',
    bloodGroup: 'B-',
    emergencyContact: 'Jessica Brown (Sister) - +1 (555) 789-0129',
    notes: 'Emergency walk-in: sudden acute dizziness and fever.'
  },
  {
    id: 'PAT008',
    name: 'Sarah Miller',
    phone: '+1 (555) 890-1234',
    age: 38,
    gender: 'Female',
    email: 'sarah.miller@example.com',
    address: '94 Willow Way, Metro City',
    lastVisit: 'Today',
    status: 'In Queue',
    bloodGroup: 'O+',
    emergencyContact: 'David Miller (Husband) - +1 (555) 890-1230',
    notes: 'Urgent walk-in: severe sore throat and headache.'
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
    status: 'Scheduled',
    bloodGroup: 'AB-',
    emergencyContact: 'Helen Clark (Wife) - +1 (555) 123-9870',
    notes: 'Routine annual physical and blood work review.'
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
    status: 'Scheduled',
    bloodGroup: 'A+',
    emergencyContact: 'Arthur Watson (Father) - +1 (555) 234-8760',
    notes: 'General health consultation.'
  },
  {
    id: 'PAT011',
    name: 'Lucas Gray',
    phone: '+1 (555) 321-7654',
    age: 27,
    gender: 'Male',
    email: 'lucas.gray@example.com',
    address: '49 Spruce Road, Metro City',
    lastVisit: 'Today',
    status: 'In Queue',
    bloodGroup: 'O+',
    emergencyContact: 'Claire Gray (Mother) - +1 (555) 321-7650',
    notes: 'Walk-in: minor sprain on left wrist.'
  },
  {
    id: 'PAT012',
    name: 'Priya Verma',
    phone: '+1 (555) 432-8765',
    age: 62,
    gender: 'Female',
    email: 'priya.verma@example.com',
    address: '110 Redwood Terrace, Metro City',
    lastVisit: '20 Aug 2026',
    status: 'Scheduled',
    bloodGroup: 'B+',
    emergencyContact: 'Sanjay Verma (Son) - +1 (555) 432-8760',
    notes: 'Pediatric family clinic consultation.'
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
  const total = appointments.length;
  const remaining = appointments.filter((a) => a.status === 'BOOKED' || a.status === 'WAITING').length;
  const checkedIn = appointments.filter(
    (a) => a.status === 'CHECKED_IN' || a.status === 'WAITING' || a.status === 'IN_CONSULTATION'
  ).length;
  const waiting = queue.filter((q) => q.status === 'WAITING').length;
  const available = doctors.filter((d) => d.status === 'AVAILABLE').length;

  return {
    todayAppointments: { total, remaining },
    checkedIn: { total: checkedIn, subtitle: 'Patients checked in today' },
    waiting: { total: waiting, subtitle: 'Currently in waiting queue' },
    availableDoctors: { available, total: doctors.length, subtitle: `Out of ${doctors.length} doctors online` },
    walkIns: { total: walkIns.length, subtitle: "Today's registered walk-ins" },
  };
};
