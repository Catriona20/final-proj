import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE = 'http://127.0.0.1:5000/api';
const SOCKET_URL = 'http://127.0.0.1:5000';

const DOCTOR_ID = 'doc-demo-priya-02';
const CLINIC_ID = 'c-demo-apollo-02';
const TODAY_DATE = '2026-09-21';

async function runTests() {
  console.log('================================================================');
  console.log('🩺 RUNNING DOCTOR CONSULTATION STATUS & QUEUE WORKLOAD FLOW TEST');
  console.log('================================================================\n');

  // Socket.IO tracking
  const receivedDoctorEvents: any[] = [];
  const receivedQueueEvents: any[] = [];

  const socket: Socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: false,
  });

  await new Promise<void>((resolve, reject) => {
    socket.on('connect', () => {
      console.log(`🔌 Connected to WebSocket: ${socket.id}`);
      socket.emit('join:clinic', CLINIC_ID);
      socket.emit('join:doctor', DOCTOR_ID);
      resolve();
    });
    socket.on('connect_error', (err) => reject(err));
  });

  socket.on('doctor:availability_updated', (data) => {
    console.log('   📡 [Socket] doctor:availability_updated received:', data);
    receivedDoctorEvents.push(data);
  });

  socket.on('queue:updated', (data) => {
    console.log('   📡 [Socket] queue:updated received');
    receivedQueueEvents.push(data);
  });

  try {
    // -------------------------------------------------------------
    // STEP 0: Reset demo state
    // -------------------------------------------------------------
    console.log('\n0️⃣ Resetting demo environment...');
    await axios.post(`${API_BASE}/simulation/reset-demo`);
    console.log('   ✅ Environment reset complete.');

    // -------------------------------------------------------------
    // STEP 1: Login Doctor & Clinic Assistant
    // -------------------------------------------------------------
    console.log('\n1️⃣ Authenticating credentials...');
    const docLogin = await axios.post(`${API_BASE}/auth/doctor/login`, {
      email: 'doctor02@demo.medlink.test',
      password: 'Doctor@2002',
    });
    const docToken = docLogin.data.token;

    const asstLogin = await axios.post(`${API_BASE}/auth/assistant/login`, {
      email: 'assistant02@demo.medlink.test',
      password: 'Clinic@3002',
    });
    const asstToken = asstLogin.data.token;
    console.log('   ✅ Tokens acquired.');

    // -------------------------------------------------------------
    // STEP 2: Create & Approve Doctor Availability for Today
    // -------------------------------------------------------------
    console.log('\n2️⃣ Creating and approving doctor availability schedule...');
    const reqRes = await axios.post(
      `${API_BASE}/availability/requests`,
      {
        doctor_id: DOCTOR_ID,
        clinic_id: CLINIC_ID,
        specialty: 'General Medicine',
        date: TODAY_DATE,
        start_time: '05:00 PM',
        end_time: '08:00 PM',
        notes: 'Evening session',
      },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );
    const reqId = reqRes.data.request.id;

    await axios.post(
      `${API_BASE}/availability/requests/${reqId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${docToken}` } }
    );
    console.log('   ✅ Availability approved.');

    // -------------------------------------------------------------
    // STEP 3: Verify initial state - Doctor is AVAILABLE with 0 active, 0 waiting
    // -------------------------------------------------------------
    console.log('\n3️⃣ Verifying initial AVAILABLE state...');
    const initDocsRes = await axios.get(`${API_BASE}/doctors?clinicId=${CLINIC_ID}`);
    const priyaDocInit = initDocsRes.data.doctors.find((d: any) => d.id === DOCTOR_ID);
    console.log(`   Priya Status: ${priyaDocInit.status}`);
    console.log(`   Priya Current Patients: ${priyaDocInit.currentPatients}`);
    console.log(`   Priya Waiting Count: ${priyaDocInit.waitingCount}`);

    if (priyaDocInit.status !== 'AVAILABLE') {
      throw new Error(`Expected AVAILABLE status but got ${priyaDocInit.status}`);
    }
    if (priyaDocInit.waitingCount !== 0) {
      throw new Error(`Expected 0 waiting patients but got ${priyaDocInit.waitingCount}`);
    }
    console.log('   ✅ Initial AVAILABLE state verified.');

    // -------------------------------------------------------------
    // STEP 4: Setup Scenario - 1 Active Consultation (Emergency Patient) + 5 Waiting Patients
    // -------------------------------------------------------------
    console.log('\n4️⃣ Populating 1 active consultation (Emergency Patient) + 5 waiting queue patients...');
    
    // Create walk-ins for Priya
    // Patient 0: Active in consultation (Emergency)
    const p0 = await axios.post(
      `${API_BASE}/walk-ins`,
      {
        clinicId: CLINIC_ID,
        patientName: 'Emergency Patient',
        phone: '+919000000099',
        reason: 'Acute Chest Pain',
        priority: 'EMERGENCY',
        doctorId: DOCTOR_ID,
      },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );
    const p0Id = p0.data.walkIn?.id || p0.data.walkInId;

    // Start consultation for p0
    await axios.patch(
      `${API_BASE}/queue/${p0Id}/status`,
      { status: 'IN_CONSULTATION' },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );

    // Create 5 waiting patients
    const waitingNames = ['Ananya Sen', 'Vikram Patel', 'Deepa Rao', 'Manoj Kumar', 'Sunita Reddy'];
    for (const name of waitingNames) {
      await axios.post(
        `${API_BASE}/walk-ins`,
        {
          clinicId: CLINIC_ID,
          patientName: name,
          phone: '+919000000088',
          reason: 'Routine Checkup',
          priority: 'NORMAL',
          doctorId: DOCTOR_ID,
        },
        { headers: { Authorization: `Bearer ${asstToken}` } }
      );
    }

    // -------------------------------------------------------------
    // STEP 5: Verify Active Consultation + 5 Waiting Patients State
    // -------------------------------------------------------------
    console.log('\n5️⃣ Verifying active consultation state in Doctor API and Queue API...');
    const queueRes = await axios.get(`${API_BASE}/queue?clinicId=${CLINIC_ID}&doctorId=${DOCTOR_ID}&date=${TODAY_DATE}`);
    const queueList = queueRes.data.queue;
    console.log(`   Queue list count: ${queueList.length}`);
    const activeQ = queueList.find((q: any) => q.status === 'IN_CONSULTATION');
    const waitingQ = queueList.filter((q: any) => q.status === 'WAITING');

    console.log(`   Active in queue: ${activeQ?.patientName} (${activeQ?.status})`);
    console.log(`   Waiting count in queue: ${waitingQ.length}`);

    if (!activeQ || activeQ.patientName !== 'Emergency Patient') {
      throw new Error(`Expected active patient to be 'Emergency Patient', got: ${activeQ?.patientName}`);
    }
    if (waitingQ.length !== 5) {
      throw new Error(`Expected 5 waiting patients, got: ${waitingQ.length}`);
    }

    const docRosterRes = await axios.get(`${API_BASE}/doctors?clinicId=${CLINIC_ID}`);
    const priyaRoster = docRosterRes.data.doctors.find((d: any) => d.id === DOCTOR_ID);

    console.log(`   Doctor Roster Status: ${priyaRoster.status}`);
    console.log(`   Doctor Roster Active Patient: ${priyaRoster.currentPatientName}`);
    console.log(`   Doctor Roster Current Patients: ${priyaRoster.currentPatients}`);
    console.log(`   Doctor Roster Waiting Count: ${priyaRoster.waitingCount}`);

    if (priyaRoster.status !== 'BUSY') {
      throw new Error(`CRITICAL BUG: Doctor status is '${priyaRoster.status}' during active consultation, expected 'BUSY'!`);
    }
    if (priyaRoster.currentPatientName !== 'Emergency Patient') {
      throw new Error(`Expected currentPatientName to be 'Emergency Patient', got: '${priyaRoster.currentPatientName}'`);
    }
    if (priyaRoster.waitingCount !== 5) {
      throw new Error(`Expected waitingCount to be 5, got: ${priyaRoster.waitingCount}`);
    }
    console.log('   ✅ ACTIVE CONSULTATION + 5 WAITING QUEUE verified accurately.');

    // -------------------------------------------------------------
    // STEP 6: Emergency Arrival while Consultation is Active
    // -------------------------------------------------------------
    console.log('\n6️⃣ Testing Emergency Priority Arrival during active consultation...');
    const emergWalkIn = await axios.post(
      `${API_BASE}/walk-ins`,
      {
        clinicId: CLINIC_ID,
        patientName: 'New Urgent Emergency',
        phone: '+919000000077',
        reason: 'Trauma Injury',
        priority: 'EMERGENCY',
        doctorId: DOCTOR_ID,
      },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );

    const queueAfterEmerg = (await axios.get(`${API_BASE}/queue?clinicId=${CLINIC_ID}&doctorId=${DOCTOR_ID}&date=${TODAY_DATE}`)).data.queue;
    const activeAfterEmerg = queueAfterEmerg.find((q: any) => q.status === 'IN_CONSULTATION');
    const waitingAfterEmerg = queueAfterEmerg.filter((q: any) => q.status === 'WAITING');

    console.log(`   Active patient after new emergency arrival: ${activeAfterEmerg?.patientName}`);
    console.log(`   First waiting patient in line: ${waitingAfterEmerg[0]?.patientName} (Priority: ${waitingAfterEmerg[0]?.priority})`);
    console.log(`   Total waiting count: ${waitingAfterEmerg.length}`);

    if (activeAfterEmerg?.patientName !== 'Emergency Patient') {
      throw new Error(`Active consultation was interrupted! Found: ${activeAfterEmerg?.patientName}`);
    }
    if (waitingAfterEmerg[0]?.patientName !== 'New Urgent Emergency') {
      throw new Error(`Emergency patient is not first in queue! Found: ${waitingAfterEmerg[0]?.patientName}`);
    }
    if (waitingAfterEmerg.length !== 6) {
      throw new Error(`Expected 6 waiting patients, got: ${waitingAfterEmerg.length}`);
    }
    console.log('   ✅ Emergency arrival prioritized correctly without interrupting active consultation.');

    // -------------------------------------------------------------
    // STEP 7: Complete Active Consultation
    // -------------------------------------------------------------
    console.log('\n7️⃣ Completing active consultation for Emergency Patient...');
    await axios.patch(
      `${API_BASE}/queue/${p0Id}/status`,
      { status: 'COMPLETED' },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );

    const queueAfterComplete = (await axios.get(`${API_BASE}/queue?clinicId=${CLINIC_ID}&doctorId=${DOCTOR_ID}&date=${TODAY_DATE}`)).data.queue;
    const docAfterComplete = (await axios.get(`${API_BASE}/doctors?clinicId=${CLINIC_ID}`)).data.doctors.find((d: any) => d.id === DOCTOR_ID);

    console.log(`   Doctor Status after complete: ${docAfterComplete.status}`);
    console.log(`   Doctor Active Patient after complete: ${docAfterComplete.currentPatientName || 'None'}`);
    console.log(`   Waiting count after complete: ${docAfterComplete.waitingCount}`);

    // Call next patient
    console.log('   Calling next patient from queue...');
    const nextPatientId = waitingAfterEmerg[0].id;
    await axios.patch(
      `${API_BASE}/queue/${nextPatientId}/status`,
      { status: 'IN_CONSULTATION' },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );

    const docAfterNext = (await axios.get(`${API_BASE}/doctors?clinicId=${CLINIC_ID}`)).data.doctors.find((d: any) => d.id === DOCTOR_ID);
    console.log(`   Doctor Status with next patient: ${docAfterNext.status}`);
    console.log(`   Doctor Active Patient: ${docAfterNext.currentPatientName}`);
    console.log(`   Doctor Waiting Count: ${docAfterNext.waitingCount}`);

    if (docAfterNext.status !== 'BUSY') {
      throw new Error(`Expected BUSY status for next patient, got: ${docAfterNext.status}`);
    }
    if (docAfterNext.currentPatientName !== 'New Urgent Emergency') {
      throw new Error(`Expected active patient 'New Urgent Emergency', got: ${docAfterNext.currentPatientName}`);
    }
    if (docAfterNext.waitingCount !== 5) {
      throw new Error(`Expected 5 waiting patients remaining, got: ${docAfterNext.waitingCount}`);
    }
    console.log('   ✅ Next patient transition and waiting count decrement verified.');

    // -------------------------------------------------------------
    // STEP 8: Socket.IO Verification
    // -------------------------------------------------------------
    console.log('\n8️⃣ Verifying Socket.IO real-time event broadcasts...');
    console.log(`   Total doctor availability events captured: ${receivedDoctorEvents.length}`);
    console.log(`   Total queue events captured: ${receivedQueueEvents.length}`);

    if (receivedDoctorEvents.length === 0) {
      throw new Error('No doctor availability Socket.IO events were emitted during status changes!');
    }
    if (receivedQueueEvents.length === 0) {
      throw new Error('No queue Socket.IO events were emitted during queue changes!');
    }
    console.log('   ✅ Real-time Socket.IO broadcasts verified.');

    console.log('\n================================================================');
    console.log('🎉 ALL DOCTOR WORKLOAD & CONSULTATION STATUS TESTS PASSED 100%!');
    console.log('================================================================\n');
  } finally {
    socket.disconnect();
  }
}

runTests()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('\n❌ TEST FAILED:', err.message || err);
    if (err.response?.data) {
      console.error('API Error Response:', JSON.stringify(err.response.data, null, 2));
    }
    process.exit(1);
  });
