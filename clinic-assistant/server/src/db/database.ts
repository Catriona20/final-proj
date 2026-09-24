import { Patient, Doctor, Appointment, QueueEntry, WalkIn } from '../types/index.js';

// In-Memory Seed Store
export class ClinicDatabaseStore {
  public patients: Patient[] = [
    { id: 'PAT001', name: 'Rahul Kumar', phone: '+1 (555) 234-5678', age: 42, gender: 'Male', email: 'rahul.kumar@example.com' },
    { id: 'PAT002', name: 'Ananya Sharma', phone: '+1 (555) 876-5432', age: 29, gender: 'Female', email: 'ananya.sharma@example.com' },
    { id: 'PAT003', name: 'John Mathew', phone: '+1 (555) 345-6789', age: 35, gender: 'Male', email: 'john.mathew@example.com' },
    { id: 'PAT004', name: 'Sneha Patel', phone: '+1 (555) 987-6543', age: 31, gender: 'Female', email: 'sneha.patel@example.com' },
    { id: 'PAT005', name: 'Michael Brown', phone: '+1 (555) 456-7890', age: 55, gender: 'Male', email: 'michael.b@example.com' },
    { id: 'PAT006', name: 'Sophia Martinez', phone: '+1 (555) 654-3210', age: 25, gender: 'Female', email: 'sophia.m@example.com' },
    { id: 'PAT007', name: 'Robert Brown', phone: '+1 (555) 789-0123', age: 48, gender: 'Male', email: 'robert.b@example.com' },
    { id: 'PAT008', name: 'Sarah Miller', phone: '+1 (555) 890-1234', age: 38, gender: 'Female', email: 'sarah.miller@example.com' },
    { id: 'PAT009', name: 'David Clark', phone: '+1 (555) 123-9876', age: 50, gender: 'Male', email: 'david.clark@example.com' },
    { id: 'PAT010', name: 'Emma Watson', phone: '+1 (555) 234-8765', age: 31, gender: 'Female', email: 'emma.watson@example.com' },
    { id: 'PAT011', name: 'Lucas Gray', phone: '+1 (555) 321-7654', age: 27, gender: 'Male', email: 'lucas.gray@example.com' },
    { id: 'PAT012', name: 'Priya Verma', phone: '+1 (555) 432-8765', age: 62, gender: 'Female', email: 'priya.verma@example.com' },
    { id: 'PAT013', name: 'Vikram Malhotra', phone: '+1 (555) 543-9876', age: 45, gender: 'Male', email: 'vikram.m@example.com' },
    { id: 'PAT014', name: 'Elena Rostova', phone: '+1 (555) 654-0987', age: 33, gender: 'Female', email: 'elena.rostova@example.com' }
  ];

  public doctors: Doctor[] = [
    {
      id: 'doc-1',
      name: 'Dr. Sarah Lee',
      specialization: 'General Medicine',
      status: 'AVAILABLE',
      currentPatients: 0,
      roomNumber: 'Room 101'
    },
    {
      id: 'doc-2',
      name: 'Dr. Arun Kumar',
      specialization: 'Cardiology',
      status: 'BUSY',
      currentPatients: 1,
      roomNumber: 'Room 104'
    },
    {
      id: 'doc-3',
      name: 'Dr. Priya Sharma',
      specialization: 'Pediatrics',
      status: 'AVAILABLE',
      currentPatients: 0,
      roomNumber: 'Room 102'
    },
    {
      id: 'doc-4',
      name: 'Dr. Ahmed Khan',
      specialization: 'Dermatology',
      status: 'OFFLINE',
      currentPatients: 0,
      roomNumber: 'Room 205'
    },
    {
      id: 'doc-5',
      name: 'Dr. John Wilson',
      specialization: 'Orthopedics',
      status: 'AVAILABLE',
      currentPatients: 0,
      roomNumber: 'Room 108'
    },
    {
      id: 'doc-6',
      name: 'Dr. Meera Patel',
      specialization: 'ENT',
      status: 'AVAILABLE',
      currentPatients: 0,
      roomNumber: 'Room 105'
    },
    {
      id: 'doc-7',
      name: 'Dr. David Thomas',
      specialization: 'General Medicine',
      status: 'BUSY',
      currentPatients: 1,
      roomNumber: 'Room 103'
    }
  ];

  public appointments: Appointment[] = [
    {
      id: 'APT001',
      patientId: 'PAT001',
      patientName: 'Rahul Kumar',
      doctorId: 'doc-1',
      doctorName: 'Dr. Sarah Lee',
      time: '09:00 AM',
      type: 'Consultation',
      status: 'COMPLETED'
    },
    {
      id: 'APT002',
      patientId: 'PAT002',
      patientName: 'Ananya Sharma',
      doctorId: 'doc-2',
      doctorName: 'Dr. Arun Kumar',
      time: '09:30 AM',
      type: 'Follow-up',
      status: 'CHECKED_IN'
    },
    {
      id: 'APT003',
      patientId: 'PAT003',
      patientName: 'John Mathew',
      doctorId: 'doc-3',
      doctorName: 'Dr. Priya Sharma',
      time: '10:00 AM',
      type: 'Consultation',
      status: 'WAITING'
    },
    {
      id: 'APT004',
      patientId: 'PAT004',
      patientName: 'Sneha Patel',
      doctorId: 'doc-4',
      doctorName: 'Dr. Ahmed Khan',
      time: '10:30 AM',
      type: 'Consultation',
      status: 'BOOKED'
    },
    {
      id: 'APT005',
      patientId: 'PAT005',
      patientName: 'Michael Brown',
      doctorId: 'doc-5',
      doctorName: 'Dr. John Wilson',
      time: '11:00 AM',
      type: 'Follow-up',
      status: 'NO_SHOW'
    },
    {
      id: 'APT006',
      patientId: 'PAT006',
      patientName: 'Sophia Martinez',
      doctorId: 'doc-6',
      doctorName: 'Dr. Meera Patel',
      time: '11:30 AM',
      type: 'Consultation',
      status: 'BOOKED'
    },
    {
      id: 'APT007',
      patientId: 'PAT009',
      patientName: 'David Clark',
      doctorId: 'doc-7',
      doctorName: 'Dr. David Thomas',
      time: '01:00 PM',
      type: 'Routine Checkup',
      status: 'BOOKED'
    },
    {
      id: 'APT008',
      patientId: 'PAT010',
      patientName: 'Emma Watson',
      doctorId: 'doc-1',
      doctorName: 'Dr. Sarah Lee',
      time: '01:30 PM',
      type: 'Consultation',
      status: 'BOOKED'
    },
    {
      id: 'APT009',
      patientId: 'PAT013',
      patientName: 'Vikram Malhotra',
      doctorId: 'doc-2',
      doctorName: 'Dr. Arun Kumar',
      time: '02:00 PM',
      type: 'Consultation',
      status: 'BOOKED'
    },
    {
      id: 'APT010',
      patientId: 'PAT012',
      patientName: 'Priya Verma',
      doctorId: 'doc-3',
      doctorName: 'Dr. Priya Sharma',
      time: '02:30 PM',
      type: 'Follow-up',
      status: 'BOOKED'
    }
  ];

  public queueEntries: QueueEntry[] = [
    {
      id: 'q-1',
      queueNumber: 'A001',
      patientName: 'Rahul Kumar',
      doctorName: 'Dr. Sarah Lee',
      priority: 'NORMAL',
      waitingTime: 5,
      estimatedWait: 10,
      status: 'WAITING',
      appointmentId: 'APT001'
    },
    {
      id: 'q-2',
      queueNumber: 'A002',
      patientName: 'Ananya Sharma',
      doctorName: 'Dr. Arun Kumar',
      priority: 'NORMAL',
      waitingTime: 12,
      estimatedWait: 15,
      status: 'WAITING',
      appointmentId: 'APT002'
    },
    {
      id: 'q-3',
      queueNumber: 'E001',
      patientName: 'Robert Brown',
      doctorName: 'Dr. Priya Sharma',
      priority: 'EMERGENCY',
      waitingTime: 2,
      estimatedWait: 0,
      status: 'WAITING'
    },
    {
      id: 'q-4',
      queueNumber: 'U001',
      patientName: 'John Mathew',
      doctorName: 'Dr. Sarah Lee',
      priority: 'URGENT',
      waitingTime: 18,
      estimatedWait: 20,
      status: 'WAITING',
      appointmentId: 'APT003'
    },
    {
      id: 'q-5',
      queueNumber: 'A003',
      patientName: 'Sarah Miller',
      doctorName: 'Dr. David Thomas',
      priority: 'NORMAL',
      waitingTime: 8,
      estimatedWait: 25,
      status: 'WAITING'
    }
  ];

  public walkIns: WalkIn[] = [
    {
      id: 'w-1',
      patientName: 'Robert Brown',
      phone: '+1 (555) 789-0123',
      reason: 'Acute chest discomfort & severe dizziness',
      preferredDoctor: 'Dr. Priya Sharma',
      registeredAt: '10:15 AM',
      status: 'WAITING',
      priority: 'EMERGENCY'
    },
    {
      id: 'w-2',
      patientName: 'Sarah Miller',
      phone: '+1 (555) 890-1234',
      reason: 'High fever (102°F) and severe sore throat',
      preferredDoctor: 'Dr. Sarah Lee',
      registeredAt: '10:32 AM',
      status: 'WAITING',
      priority: 'URGENT'
    },
    {
      id: 'w-3',
      patientName: 'Lucas Gray',
      phone: '+1 (555) 321-7654',
      reason: 'Minor sprain on left wrist during sports',
      preferredDoctor: 'Dr. John Wilson',
      registeredAt: '10:45 AM',
      status: 'WAITING',
      priority: 'NORMAL'
    },
    {
      id: 'w-4',
      patientName: 'Elena Rostova',
      phone: '+1 (555) 654-0987',
      reason: 'Seasonal allergic contact dermatitis',
      preferredDoctor: 'Dr. Ahmed Khan',
      registeredAt: '11:05 AM',
      status: 'WAITING',
      priority: 'NORMAL'
    },
    {
      id: 'w-5',
      patientName: 'David Clark',
      phone: '+1 (555) 123-9876',
      reason: 'Blood pressure check & prescription renewal',
      preferredDoctor: 'Dr. David Thomas',
      registeredAt: '11:20 AM',
      status: 'WAITING',
      priority: 'NORMAL'
    }
  ];
}

export const dbStore = new ClinicDatabaseStore();
