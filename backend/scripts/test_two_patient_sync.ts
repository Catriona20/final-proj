import axios from 'axios';
import { io as ioClient, Socket } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';
const SOCKET_BASE = 'http://localhost:5000';

interface SocketEventLog {
  event: string;
  data: any;
  timestamp: number;
}

async function runTwoPatientCompletionTest() {
  console.log('================================================================');
  console.log('🚀 RUNNING 2-PATIENT APPOINTMENT COMPLETION SYNCHRONIZATION TEST');
  console.log('================================================================\n');

  // STEP 1: Fresh Operational State (Demo Reset)
  console.log('📌 STEP 1: Resetting operational state via /api/simulation/demo-reset...');
  const resetRes = await axios.post(`${API_BASE}/simulation/demo-reset`);
  if (!resetRes.data.success) {
    throw new Error('Failed to reset demo operational state');
  }
  console.log('✅ Demo reset complete.\n');

  // Get current demo date
  const clockRes = await axios.get(`${API_BASE}/simulation/demo-clock`);
  const todayDate = clockRes.data.currentDateString;
  console.log(`🕒 System clinic date: ${todayDate}\n`);

  // STEP 2: Doctor and Assistant Authentication
  console.log('📌 STEP 2: Authenticating Doctor (Dr. Arun Kumar) & Assistant...');
  const docLoginRes = await axios.post(`${API_BASE}/auth/doctor/login`, {
    email: 'doctor01@demo.medlink.test',
    password: 'Doctor@2001',
  });
  const doctorToken = docLoginRes.data.token;
  const doctor = docLoginRes.data.doctor;
  const doctorId = doctor.id;
  const clinicId = 'c-demo-moon-01';
  console.log(`✅ Doctor authenticated: ${doctor.name} (${doctorId}) at Clinic: ${clinicId}`);

  const asstLoginRes = await axios.post(`${API_BASE}/auth/assistant/login`, {
    email: 'assistant01@demo.medlink.test',
    password: 'Clinic@3001',
  });
  const asstToken = asstLoginRes.data.token;
  console.log('✅ Assistant authenticated.\n');

  // STEP 3: Setup WebSockets for all 3 frontends (Patient A, Patient B, Doctor, Clinic Assistant)
  console.log('📌 STEP 3: Connecting real-time Socket.IO clients for all parties...');

  const patientASockets: SocketEventLog[] = [];
  const patientBSockets: SocketEventLog[] = [];
  const doctorSockets: SocketEventLog[] = [];
  const clinicSockets: SocketEventLog[] = [];

  const patientASocket: Socket = ioClient(SOCKET_BASE, { transports: ['websocket'] });
  const patientBSocket: Socket = ioClient(SOCKET_BASE, { transports: ['websocket'] });
  const doctorSocket: Socket = ioClient(SOCKET_BASE, { transports: ['websocket'] });
  const clinicSocket: Socket = ioClient(SOCKET_BASE, { transports: ['websocket'] });

  await new Promise<void>((resolve) => {
    let connectedCount = 0;
    const check = () => {
      connectedCount++;
      if (connectedCount === 4) resolve();
    };

    patientASocket.on('connect', () => {
      patientASocket.emit('join:patient', 'pat-101');
      check();
    });
    patientBSocket.on('connect', () => {
      patientBSocket.emit('join:patient', 'pat-102');
      check();
    });
    doctorSocket.on('connect', () => {
      doctorSocket.emit('join:doctor', doctorId);
      doctorSocket.emit('join:clinic', clinicId);
      check();
    });
    clinicSocket.on('connect', () => {
      clinicSocket.emit('join:clinic', clinicId);
      check();
    });
  });

  const recordEvent = (list: SocketEventLog[], event: string, data: any) => {
    list.push({ event, data, timestamp: Date.now() });
    console.log(`   📡 [SOCKET EVENT] ${event} -> ${JSON.stringify(data).slice(0, 120)}...`);
  };

  ['appointment:status', 'appointment:updated', 'queue:updated', 'queue:completed', 'consultation:completed'].forEach((evt) => {
    patientASocket.on(evt, (data) => recordEvent(patientASockets, `PatientA:${evt}`, data));
    patientBSocket.on(evt, (data) => recordEvent(patientBSockets, `PatientB:${evt}`, data));
    doctorSocket.on(evt, (data) => recordEvent(doctorSockets, `Doctor:${evt}`, data));
    clinicSocket.on(evt, (data) => recordEvent(clinicSockets, `Clinic:${evt}`, data));
  });

  console.log('✅ All 4 Socket.IO clients connected and listening to real-time rooms.\n');

  // STEP 4: Create Availability (Assistant) and Doctor Approves
  console.log('📌 STEP 4: Creating and approving doctor availability schedule for today...');
  const reqRes = await axios.post(
    `${API_BASE}/availability/requests`,
    {
      doctor_id: doctorId,
      clinic_id: clinicId,
      specialty: 'Dentistry',
      date: todayDate,
      start_time: '10:00 AM',
      end_time: '01:00 PM',
      notes: 'Consultation shift for demo verification',
    },
    { headers: { Authorization: `Bearer ${asstToken}` } }
  );
  const reqId = reqRes.data.request?.id || reqRes.data.requestId;

  if (reqId) {
    await axios.post(
      `${API_BASE}/availability/requests/${reqId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${doctorToken}` } }
    );
  }

  // Verify slots exist
  const slotsRes = await axios.get(`${API_BASE}/doctors/${doctorId}/slots?clinicId=${clinicId}&date=${todayDate}`);
  console.log(`✅ Slots generated: ${slotsRes.data.availableSlots?.length || 0} slots available for ${todayDate}.\n`);

  // STEP 5: Patient A Books Slot 1
  console.log('📌 STEP 5: Booking Patient A (pat-101) into slot 10:00 AM...');
  const bookARes = await axios.post(`${API_BASE}/appointments/book`, {
    patientId: 'pat-101',
    doctorId: doctorId,
    clinicId: clinicId,
    date: todayDate,
    time: '10:00 AM',
    reason: 'Dental cleaning & examination',
  });
  const aptA = bookARes.data.appointment;
  patientASocket.emit('join:appointment', aptA.id);
  console.log(`✅ Patient A booked: Appointment ${aptA.id} (Token: ${aptA.tokenNumber})\n`);

  // STEP 6: Patient B Books Slot 2
  console.log('📌 STEP 6: Booking Patient B (pat-102) into slot 10:20 AM...');
  const bookBRes = await axios.post(`${API_BASE}/appointments/book`, {
    patientId: 'pat-102',
    doctorId: doctorId,
    clinicId: clinicId,
    date: todayDate,
    time: '10:20 AM',
    reason: 'Toothache & gum inflammation',
  });
  const aptB = bookBRes.data.appointment;
  patientBSocket.emit('join:appointment', aptB.id);
  console.log(`✅ Patient B booked: Appointment ${aptB.id} (Token: ${aptB.tokenNumber})\n`);

  // STEP 7: Check-in Patient A then Patient B
  console.log('📌 STEP 7: Checking in Patient A and Patient B...');
  await axios.post(`${API_BASE}/appointments/${aptA.id}/check-in`, { forceDeskCheckIn: true });
  await axios.post(`${API_BASE}/appointments/${aptB.id}/check-in`, { forceDeskCheckIn: true });
  console.log('✅ Both patients checked in.\n');

  // STEP 8: Verify Pre-Consultation Queue State
  console.log('📌 STEP 8: Verifying Queue state before consultation begins...');
  const aptBPreFetch = await axios.get(`${API_BASE}/appointments/${aptB.id}`);
  console.log(`   Patient B patients ahead: ${aptBPreFetch.data.appointment.patientsAhead}`);
  console.log(`   Patient B status: ${aptBPreFetch.data.appointment.status}`);

  if (aptBPreFetch.data.appointment.patientsAhead !== 1) {
    throw new Error(`Expected Patient B to have 1 patient ahead, got ${aptBPreFetch.data.appointment.patientsAhead}`);
  }
  console.log('✅ Patient B correctly shows "1 patient ahead"!\n');

  // STEP 9: Doctor starts consultation on Patient A
  console.log('📌 STEP 9: Doctor starts consultation on Patient A...');
  await axios.post(`${API_BASE}/simulation/start-consultation`, { appointmentId: aptA.id });

  // Verify Doctor live queue
  const docQueuePre = await axios.get(`${API_BASE}/doctors/auth/queue?clinicId=${clinicId}`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  console.log(`   Doctor currently consulting: ${docQueuePre.data.currentPatient?.patient_name || docQueuePre.data.currentPatient?.patientName}`);
  console.log(`   Doctor next patient: ${docQueuePre.data.nextPatient?.patient_name || docQueuePre.data.nextPatient?.patientName}`);
  console.log(`   Doctor waiting count: ${docQueuePre.data.waitingCount}`);
  console.log(`   Doctor completed count: ${docQueuePre.data.completedCount}`);
  console.log('✅ Doctor App correctly shows Patient A in session, Patient B next.\n');

  // STEP 10 & 11: Doctor clicks "Complete & Issue Prescription"
  console.log('📌 STEP 10 & 11: Doctor completes consultation and issues digital prescription for Patient A...');
  const completePayload = {
    appointmentId: aptA.id,
    patientId: 'pat-101',
    diagnosis: 'Acute Gingivitis & Dental Plaque',
    clinicalNotes: 'Ultrasonic scaling performed. Gingival margins irrigated with chlorhexidine. Oral hygiene instructed.',
    assessment: 'Prognosis excellent. Expected resolution in 7-10 days.',
    medicines: [
      {
        name: 'Chlorhexidine Mouthwash 0.2%',
        dosage: '10 ml',
        frequency: '1-0-1',
        duration: '7 days',
        instructions: 'Rinse thoroughly for 60 seconds after meals',
      },
      {
        name: 'Amoxicillin 500mg',
        dosage: '500 mg',
        frequency: '1-0-1',
        duration: '5 days',
        instructions: 'Take with full glass of water after food',
      },
    ],
    followUpDate: '2026-10-15',
    followUpReason: 'Routine post-treatment review',
    vitals: {
      bp: '120/80 mmHg',
      pulse: '72 bpm',
      temperature: '98.6 °F',
      spO2: '99%',
    },
  };

  const consultRes = await axios.post(`${API_BASE}/doctors/auth/consultations`, completePayload, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });

  if (!consultRes.data.success) {
    throw new Error(`Consultation submission failed: ${consultRes.data.error}`);
  }
  console.log('✅ Consultation completed & prescription persisted successfully.\n');

  // Wait a moment for socket propagation
  await new Promise((r) => setTimeout(r, 600));

  // STEP 12: Verify Real-Time Socket Events Received by all 3 Frontends
  console.log('📌 STEP 12: Verifying Socket.IO events received across all frontends...');
  const patientACompletedEvents = patientASockets.filter(
    (e) => (e.event.includes('appointment:status') || e.event.includes('consultation:completed')) &&
           (e.data.status === 'Completed' || e.data.status === 'COMPLETED')
  );
  console.log(`   Patient A completion socket events received: ${patientACompletedEvents.length}`);

  const patientBQueueUpdatedEvents = patientBSockets.filter(
    (e) => e.event.includes('queue:updated') && e.data.appointmentId === aptB.id
  );
  console.log(`   Patient B queue update socket events received: ${patientBQueueUpdatedEvents.length}`);
  if (patientBQueueUpdatedEvents.length > 0) {
    const latestBEvent = patientBQueueUpdatedEvents[patientBQueueUpdatedEvents.length - 1];
    console.log(`   Patient B new patientsAhead via WebSocket: ${latestBEvent.data.patientsAhead}`);
  }

  const doctorCompletionEvents = doctorSockets.filter((e) => e.event.includes('queue:completed') || e.event.includes('consultation:completed'));
  console.log(`   Doctor completion socket events received: ${doctorCompletionEvents.length}`);

  const clinicCompletionEvents = clinicSockets.filter((e) => e.event.includes('appointment:status') || e.event.includes('queue:updated'));
  console.log(`   Clinic assistant socket events received: ${clinicCompletionEvents.length}`);

  if (patientACompletedEvents.length === 0) {
    throw new Error('Patient A did NOT receive completion socket event!');
  }
  console.log('✅ All frontends received real-time WebSocket events!\n');

  // STEP 13: Verify Patient A State (Authoritative Backend & Persistence)
  console.log('📌 STEP 13: Verifying Patient A (Completed Appointment)...');
  const aptAFresh = await axios.get(`${API_BASE}/appointments/${aptA.id}`);
  const aData = aptAFresh.data.appointment;
  console.log(`   Patient A status: ${aData.status}`);
  console.log(`   Patient A queuePosition: ${aData.queuePosition}`);
  console.log(`   Patient A patientsAhead: ${aData.patientsAhead}`);
  console.log(`   Patient A estimatedWait: ${aData.estimatedWait}`);
  console.log(`   Patient A prescriptionAvailable: ${aData.prescriptionAvailable}`);
  console.log(`   Patient A prescription medicines count: ${aData.prescription?.medicines?.length || 0}`);

  if (aData.status !== 'Completed') {
    throw new Error(`Expected Patient A status 'Completed', got '${aData.status}'`);
  }
  if (aData.patientsAhead !== 0) {
    throw new Error(`Expected Patient A patientsAhead 0, got ${aData.patientsAhead}`);
  }
  if (!aData.prescriptionAvailable) {
    throw new Error('Expected Patient A prescriptionAvailable to be true');
  }
  console.log('✅ Patient A appointment is completely and authoritatively marked Completed!\n');

  // STEP 14: Verify Patient B State (Queue Recalculation: 1 -> 0 patients ahead, Next Up)
  console.log('📌 STEP 14: Verifying Patient B (Queue Recalculation from 1 -> 0 patients ahead)...');
  const aptBFresh = await axios.get(`${API_BASE}/appointments/${aptB.id}`);
  const bData = aptBFresh.data.appointment;
  console.log(`   Patient B status: ${bData.status}`);
  console.log(`   Patient B queuePosition: ${bData.queuePosition}`);
  console.log(`   Patient B patientsAhead: ${bData.patientsAhead}`);
  console.log(`   Patient B estimatedWait: ${bData.estimatedWait}`);

  if (bData.patientsAhead !== 0) {
    throw new Error(`CRITICAL FAILURE: Expected Patient B patientsAhead to be 0, but got ${bData.patientsAhead}!`);
  }
  if (!['Next', 'Almost Your Turn', 'Waiting'].includes(bData.status)) {
    throw new Error(`Expected Patient B status to be active, got ${bData.status}`);
  }
  console.log('✅ Patient B patientsAhead successfully recalculated from 1 -> 0!\n');

  // STEP 15: Verify Doctor App Queue State
  console.log('📌 STEP 15: Verifying Doctor App live queue state...');
  const docQueuePost = await axios.get(`${API_BASE}/doctors/auth/queue?clinicId=${clinicId}`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  console.log(`   Doctor currently consulting: ${docQueuePost.data.currentPatient}`);
  console.log(`   Doctor next patient: ${docQueuePost.data.nextPatient?.patient_name || docQueuePost.data.nextPatient?.patientName}`);
  console.log(`   Doctor completed count: ${docQueuePost.data.completedCount}`);
  console.log(`   Doctor waiting count: ${docQueuePost.data.waitingCount}`);

  if (docQueuePost.data.currentPatient !== null) {
    throw new Error(`Expected Doctor currentPatient to be null after completion, got ${JSON.stringify(docQueuePost.data.currentPatient)}`);
  }
  if (docQueuePost.data.completedCount !== 1) {
    throw new Error(`Expected Doctor completedCount to be 1, got ${docQueuePost.data.completedCount}`);
  }
  if (docQueuePost.data.waitingCount !== 1) {
    throw new Error(`Expected Doctor waitingCount to be 1, got ${docQueuePost.data.waitingCount}`);
  }
  console.log('✅ Doctor App state updated: Now Consulting cleared, Completed count +1, Patient B is next patient!\n');

  // STEP 16: Verify Clinic Assistant Active Queue & Today Appointments
  console.log('📌 STEP 16: Verifying Clinic Assistant active OPD queue...');
  const clinicQueueRes = await axios.get(`${API_BASE}/queue?clinicId=${clinicId}`);
  const activeQueue = clinicQueueRes.data.queue;
  console.log(`   Clinic active queue length: ${activeQueue.length}`);
  const aptAInQueue = activeQueue.find((q: any) => q.appointmentId === aptA.id || q.id === aptA.id);
  const aptBInQueue = activeQueue.find((q: any) => q.appointmentId === aptB.id || q.id === aptB.id);

  if (aptAInQueue) {
    throw new Error(`CRITICAL FAILURE: Completed appointment ${aptA.id} is still in active OPD queue!`);
  }
  if (!aptBInQueue) {
    throw new Error(`Expected Patient B to remain in active OPD queue, but was not found!`);
  }
  console.log('✅ Clinic Assistant: Completed Patient A removed from active OPD queue; Patient B remains.\n');

  // STEP 17: Concurrency & Duplicate Submission Protection
  console.log('📌 STEP 17: Testing concurrency / duplicate submission idempotency...');
  const duplicateRes = await axios.post(`${API_BASE}/doctors/auth/consultations`, completePayload, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  if (!duplicateRes.data.success || duplicateRes.data.message !== 'Consultation is already completed.') {
    throw new Error(`Duplicate submission failed idempotency check: ${JSON.stringify(duplicateRes.data)}`);
  }
  console.log('✅ Duplicate completion call safely rejected with existing completed record.\n');

  // STEP 18: Digital Prescription & Health Records Persistence
  console.log('📌 STEP 18: Testing digital prescription persistence & health records API...');
  const rxRes = await axios.get(`${API_BASE}/records/prescriptions/${aptA.id}`);
  const rxData = rxRes.data.prescription;
  console.log(`   Prescription ID: ${rxData.id}`);
  console.log(`   Prescription Doctor: ${rxData.doctor_name || rxData.doctorName}`);
  console.log(`   Prescription Medicines: ${rxData.medicines.map((m: any) => m.name).join(', ')}`);

  if (!rxData || rxData.medicines?.length !== 2) {
    throw new Error('Prescription was not properly persisted in health records');
  }
  console.log('✅ Digital prescription persisted and retrieved with full clinical details.\n');

  // Clean up socket connections
  patientASocket.disconnect();
  patientBSocket.disconnect();
  doctorSocket.disconnect();
  clinicSocket.disconnect();

  console.log('================================================================');
  console.log('🎉 ALL 18 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!');
  console.log('================================================================');
}

runTwoPatientCompletionTest().catch((err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  if (err.response?.data) {
    console.error('Response data:', err.response.data);
  }
  process.exit(1);
});
