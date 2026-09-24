import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE = 'http://127.0.0.1:5000/api';
const SOCKET_URL = 'http://127.0.0.1:5000';

const DOCTOR_ID = 'doc-demo-priya-02';
const CLINIC_ID = 'c-demo-apollo-02';
const TODAY_DATE = '2026-09-21';
const SLOT_TIME = '08:45 PM';
const START_TIME = '08:30 PM';
const END_TIME = '11:00 PM';

async function runTests() {
  console.log('========================================================================');
  console.log('🧪 RUNNING PATIENT LIVE QUEUE & DUPLICATE BOOKING QA TEST SUITE');
  console.log('========================================================================\n');

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

  socket.on('queue:updated', (data) => {
    receivedQueueEvents.push(data);
  });

  try {
    // -------------------------------------------------------------
    // STEP 0: Reset demo state
    // -------------------------------------------------------------
    console.log('0️⃣ Resetting demo environment...');
    await axios.post(`${API_BASE}/simulation/reset-demo`);
    console.log('   ✅ Environment reset complete.');

    // -------------------------------------------------------------
    // STEP 1: Authenticate Patient, Doctor, Clinic Assistant
    // -------------------------------------------------------------
    console.log('\n1️⃣ Authenticating credentials...');
    const patLogin = await axios.post(`${API_BASE}/auth/login`, {
      email: 'patient02@demo.medlink.test',
      password: 'Demo@1002',
    });
    const patToken = patLogin.data.token;
    const patientUser = patLogin.data.user;
    const patientId = patientUser.id; // 'pat-demo-02'
    console.log(`   ✅ Patient authenticated: ${patientUser.name} (${patientId})`);

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
    console.log('   ✅ Doctor & Assistant tokens acquired.');

    // -------------------------------------------------------------
    // STEP 2: Create & Approve Doctor Availability for Today
    // -------------------------------------------------------------
    console.log('\n2️⃣ Creating & approving doctor availability schedule...');
    const reqRes = await axios.post(
      `${API_BASE}/availability/requests`,
      {
        doctor_id: DOCTOR_ID,
        clinic_id: CLINIC_ID,
        specialty: 'General Medicine',
        date: TODAY_DATE,
        start_time: START_TIME,
        end_time: END_TIME,
        notes: 'Late evening clinic session',
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
    // STEP 3: Patient books available slot (CASE A: Valid Booking)
    // -------------------------------------------------------------
    console.log(`\n3️⃣ CASE A: Valid Appointment Booking (${SLOT_TIME})...`);
    const bookRes = await axios.post(
      `${API_BASE}/appointments/book`,
      {
        patientId: patientUser.id,
        patientName: patientUser.name,
        patientPhone: patientUser.phone,
        doctorId: DOCTOR_ID,
        clinicId: CLINIC_ID,
        department: 'General Medicine',
        date: TODAY_DATE,
        time: SLOT_TIME,
        reason: 'Mild fever and routine consultation',
        expectedDuration: '20 min',
        consultationFee: '₹500',
      },
      { headers: { Authorization: `Bearer ${patToken}` } }
    );

    const bookedApt = bookRes.data.appointment;
    console.log(`   ✅ Appointment created successfully! ID: ${bookedApt.id}, Token: ${bookedApt.tokenNumber || bookedApt.token_number}`);
    if (!bookedApt.id || !(bookedApt.tokenNumber || bookedApt.token_number)) {
      throw new Error('Appointment missing ID or token number');
    }

    // Verify patient appointment list
    const patAptsRes = await axios.get(`${API_BASE}/appointments/patient/${patientId}`, {
      headers: { Authorization: `Bearer ${patToken}` },
    });
    const appointmentsList = patAptsRes.data.appointments || patAptsRes.data;
    const foundApt = appointmentsList.find((a: any) => a.id === bookedApt.id);
    if (!foundApt) {
      throw new Error('Booked appointment not found in patient appointment query!');
    }
    console.log('   ✅ Appointment verified in patient appointments query.');

    // -------------------------------------------------------------
    // STEP 4: Duplicate Booking (CASE B: Exact Same Patient & Slot)
    // -------------------------------------------------------------
    console.log('\n4️⃣ CASE B: Duplicate Booking Attempt (Same Patient & Slot)...');
    let duplicateRejected = false;
    try {
      await axios.post(
        `${API_BASE}/appointments/book`,
        {
          patientId: patientUser.id,
          patientName: patientUser.name,
          patientPhone: patientUser.phone,
          doctorId: DOCTOR_ID,
          clinicId: CLINIC_ID,
          department: 'General Medicine',
          date: TODAY_DATE,
          time: SLOT_TIME,
          reason: 'Trying to book duplicate',
          expectedDuration: '20 min',
          consultationFee: '₹500',
        },
        { headers: { Authorization: `Bearer ${patToken}` } }
      );
    } catch (err: any) {
      if (err.response?.status === 409 && err.response?.data?.code === 'DUPLICATE_BOOKING') {
        duplicateRejected = true;
        console.log(`   ✅ Duplicate correctly rejected with HTTP 409 DUPLICATE_BOOKING: "${err.response.data.error || err.response.data.message}"`);
      } else {
        throw new Error(`Unexpected duplicate error response: status ${err.response?.status}, data: ${JSON.stringify(err.response?.data)}`);
      }
    }
    if (!duplicateRejected) {
      throw new Error('Duplicate booking was NOT rejected!');
    }

    // Verify no second appointment created
    const patAptsAfterDup = await axios.get(`${API_BASE}/appointments/patient/${patientId}`, {
      headers: { Authorization: `Bearer ${patToken}` },
    });
    const afterList = patAptsAfterDup.data.appointments || patAptsAfterDup.data;
    const matchingApts = afterList.filter((a: any) => (a.date === TODAY_DATE || a.appointment_date === TODAY_DATE) && (a.time === SLOT_TIME || a.slot_time === SLOT_TIME));
    if (matchingApts.length !== 1) {
      throw new Error(`Expected exactly 1 appointment for slot, found: ${matchingApts.length}`);
    }
    console.log('   ✅ Confirmed no duplicate appointment records created.');

    // -------------------------------------------------------------
    // STEP 5: Check-in Patient into Queue
    // -------------------------------------------------------------
    console.log('\n5️⃣ Checking in Patient into Live Queue...');
    const checkinRes = await axios.post(
      `${API_BASE}/appointments/${bookedApt.id}/check-in`,
      {},
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );
    console.log(`   ✅ Patient checked in: Status ${checkinRes.data.appointment?.status}`);

    // -------------------------------------------------------------
    // STEP 6: Add Emergency Patient & Start Consultation
    // -------------------------------------------------------------
    console.log('\n6️⃣ Adding Emergency Patient Walk-in & Starting Consultation...');
    const p0 = await axios.post(
      `${API_BASE}/walk-ins`,
      {
        clinicId: CLINIC_ID,
        patientName: 'Emergency Patient 1',
        phone: '+919999999991',
        reason: 'Acute Chest Pain',
        priority: 'EMERGENCY',
        doctorId: DOCTOR_ID,
      },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );
    const p0Id = p0.data.walkIn?.id || p0.data.walkInId;
    console.log(`   ✅ Emergency patient added: ID ${p0Id}`);

    // Start consultation for Emergency Patient
    await axios.patch(
      `${API_BASE}/queue/${p0Id}/status`,
      { status: 'IN_CONSULTATION' },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );
    console.log('   ✅ Emergency Patient consultation started (Doctor BUSY).');

    // -------------------------------------------------------------
    // STEP 7: Verify Patient Live Queue State (BUG 2 Verification)
    // -------------------------------------------------------------
    console.log('\n7️⃣ Verifying Patient Live Queue State (1 in consult, Patient waiting)...');
    const patQueueCheck = await axios.get(`${API_BASE}/appointments/patient/${patientId}`, {
      headers: { Authorization: `Bearer ${patToken}` },
    });
    const liveList = patQueueCheck.data.appointments || patQueueCheck.data;
    const patientLiveApt = liveList.find((a: any) => a.id === bookedApt.id);
    console.log('   📊 Patient Appointment live queue payload:', {
      status: patientLiveApt.status,
      queuePosition: patientLiveApt.queuePosition,
      patientsAhead: patientLiveApt.patientsAhead,
      estimatedWait: patientLiveApt.estimatedWait,
      currentServingToken: patientLiveApt.currentServingToken,
      currentServingPatient: patientLiveApt.currentServingPatient,
    });

    if (patientLiveApt.patientsAhead !== 1) {
      throw new Error(`Expected patientsAhead to be 1 (Emergency patient is currently in consultation), but got ${patientLiveApt.patientsAhead}`);
    }
    if (!patientLiveApt.currentServingPatient?.includes('Emergency Patient')) {
      throw new Error(`Expected currentServingPatient to be 'Emergency Patient 1', got '${patientLiveApt.currentServingPatient}'`);
    }
    console.log('   ✅ SUCCESS: patientsAhead is correctly 1 and currentServingPatient is Emergency Patient 1!');

    // -------------------------------------------------------------
    // STEP 8: Add 3 Normal Walk-ins Behind Patient
    // -------------------------------------------------------------
    console.log('\n8️⃣ Adding 3 Normal Walk-in Patients...');
    for (let i = 1; i <= 3; i++) {
      await axios.post(
        `${API_BASE}/walk-ins`,
        {
          clinicId: CLINIC_ID,
          patientName: `Normal Patient ${i}`,
          phone: `+91988888880${i}`,
          reason: `Normal checkup ${i}`,
          priority: 'NORMAL',
          doctorId: DOCTOR_ID,
        },
        { headers: { Authorization: `Bearer ${asstToken}` } }
      );
    }
    console.log('   ✅ 3 Normal walk-ins added.');

    // Verify Patient's position remains 2 (patientsAhead = 1)
    const patientAfterNormal = await axios.get(`${API_BASE}/appointments/patient/${patientId}`, {
      headers: { Authorization: `Bearer ${patToken}` },
    });
    const patNormList = patientAfterNormal.data.appointments || patientAfterNormal.data;
    const patientAfterNormalApt = patNormList.find((a: any) => a.id === bookedApt.id);
    if (patientAfterNormalApt.patientsAhead !== 1) {
      throw new Error(`Expected patientsAhead to remain 1 after normal walk-ins behind patient, but got ${patientAfterNormalApt.patientsAhead}`);
    }
    console.log('   ✅ Verified patient still has exactly 1 patient ahead.');

    // -------------------------------------------------------------
    // STEP 9: Add 2nd Emergency Patient while Consultation is Active
    // -------------------------------------------------------------
    console.log('\n9️⃣ Adding 2nd Emergency Patient during active consultation...');
    const emerg2Res = await axios.post(
      `${API_BASE}/walk-ins`,
      {
        clinicId: CLINIC_ID,
        patientName: 'Emergency Patient 2',
        phone: '+919999999992',
        reason: 'Trauma & breathing difficulty',
        priority: 'EMERGENCY',
        doctorId: DOCTOR_ID,
      },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );
    const p2Id = emerg2Res.data.walkIn?.id || emerg2Res.data.walkInId;
    console.log(`   ✅ 2nd Emergency Patient added (ID: ${p2Id}).`);

    // Because a new emergency patient jumped ahead in WAITING queue:
    // Emergency 1 is IN_CONSULTATION
    // Emergency 2 is WAITING (pos 2)
    // Patient is WAITING (pos 3) -> patientsAhead should now be 2
    const patientAfterEmerg2 = await axios.get(`${API_BASE}/appointments/patient/${patientId}`, {
      headers: { Authorization: `Bearer ${patToken}` },
    });
    const patEmerg2List = patientAfterEmerg2.data.appointments || patientAfterEmerg2.data;
    const patientAfterEmerg2Apt = patEmerg2List.find((a: any) => a.id === bookedApt.id);
    console.log('   📊 Patient after 2nd Emergency:', {
      queuePosition: patientAfterEmerg2Apt.queuePosition,
      patientsAhead: patientAfterEmerg2Apt.patientsAhead,
    });
    if (patientAfterEmerg2Apt.patientsAhead !== 2) {
      throw new Error(`Expected patientsAhead to be 2 after 2nd emergency patient, got ${patientAfterEmerg2Apt.patientsAhead}`);
    }
    console.log('   ✅ SUCCESS: Dynamic emergency priority correctly pushed patientsAhead to 2!');

    // -------------------------------------------------------------
    // STEP 10: Complete Emergency 1 & Advance to Emergency 2
    // -------------------------------------------------------------
    console.log('\n🔟 Completing Emergency 1 consultation & advancing to Emergency 2...');
    await axios.patch(
      `${API_BASE}/queue/${p0Id}/status`,
      { status: 'COMPLETED' },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );
    await axios.patch(
      `${API_BASE}/queue/${p2Id}/status`,
      { status: 'IN_CONSULTATION' },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );

    // Now Emergency 2 is IN_CONSULTATION, Patient is WAITING (pos 2) -> patientsAhead should be 1
    const patientAfterEmerg1Done = await axios.get(`${API_BASE}/appointments/patient/${patientId}`, {
      headers: { Authorization: `Bearer ${patToken}` },
    });
    const patEmerg1DoneList = patientAfterEmerg1Done.data.appointments || patientAfterEmerg1Done.data;
    const patientAfterEmerg1DoneApt = patEmerg1DoneList.find((a: any) => a.id === bookedApt.id);
    console.log('   📊 Patient after Emergency 1 completion:', {
      currentServingPatient: patientAfterEmerg1DoneApt.currentServingPatient,
      patientsAhead: patientAfterEmerg1DoneApt.patientsAhead,
    });
    if (patientAfterEmerg1DoneApt.patientsAhead !== 1) {
      throw new Error(`Expected patientsAhead to be 1 while Emergency 2 is in consultation, got ${patientAfterEmerg1DoneApt.patientsAhead}`);
    }
    console.log('   ✅ SUCCESS: patientsAhead is 1 while Emergency 2 is in consultation.');

    // -------------------------------------------------------------
    // STEP 11: Complete Emergency 2 & Advance to Patient
    // -------------------------------------------------------------
    console.log('\n1️⃣1️⃣ Completing Emergency 2 -> Patient becomes IN_CONSULTATION...');
    await axios.patch(
      `${API_BASE}/queue/${p2Id}/status`,
      { status: 'COMPLETED' },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );
    await axios.patch(
      `${API_BASE}/queue/${bookedApt.id}/status`,
      { status: 'IN_CONSULTATION' },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );

    // Now Patient should be IN_CONSULTATION (or next up / patientsAhead = 0)
    const patientConsulting = await axios.get(`${API_BASE}/appointments/patient/${patientId}`, {
      headers: { Authorization: `Bearer ${patToken}` },
    });
    const patConsultList = patientConsulting.data.appointments || patientConsulting.data;
    const patientConsultingApt = patConsultList.find((a: any) => a.id === bookedApt.id);
    console.log('   📊 Patient when active:', {
      status: patientConsultingApt.status,
      patientsAhead: patientConsultingApt.patientsAhead,
      currentServingPatient: patientConsultingApt.currentServingPatient,
    });
    if (patientConsultingApt.patientsAhead !== 0) {
      throw new Error(`Expected patientsAhead to be 0 for Patient, got ${patientConsultingApt.patientsAhead}`);
    }
    console.log('   ✅ SUCCESS: Patient is now actively IN_CONSULTATION with 0 patients ahead!');

    // -------------------------------------------------------------
    // STEP 12: Doctor Workload Status Check
    // -------------------------------------------------------------
    console.log('\n1️⃣2️⃣ Verifying Doctor Workload is dynamically BUSY...');
    const docStatusRes = await axios.get(`${API_BASE}/doctors?clinicId=${CLINIC_ID}`);
    const priyaDoctor = docStatusRes.data.doctors.find((d: any) => d.id === DOCTOR_ID);
    console.log('   🩺 Dr. Priya Sharma workload status:', {
      status: priyaDoctor.status,
      currentPatientName: priyaDoctor.currentPatientName,
      waitingCount: priyaDoctor.waitingCount,
    });
    if (priyaDoctor.status !== 'BUSY') {
      throw new Error(`Expected Dr. Priya to be BUSY, got ${priyaDoctor.status}`);
    }
    console.log('   ✅ Doctor Workload dynamically verified: BUSY.');

    // -------------------------------------------------------------
    // STEP 13: Complete Patient Consultation
    // -------------------------------------------------------------
    console.log('\n1️⃣3️⃣ Completing Patient consultation...');
    await axios.patch(
      `${API_BASE}/queue/${bookedApt.id}/status`,
      { status: 'COMPLETED' },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );

    const patientFinal = await axios.get(`${API_BASE}/appointments/patient/${patientId}`, {
      headers: { Authorization: `Bearer ${patToken}` },
    });
    const patFinalList = patientFinal.data.appointments || patientFinal.data;
    const patientFinalApt = patFinalList.find((a: any) => a.id === bookedApt.id);
    console.log('   📊 Patient final status:', patientFinalApt.status);
    if (patientFinalApt.status !== 'COMPLETED' && patientFinalApt.status !== 'Completed') {
      throw new Error(`Expected status COMPLETED, got ${patientFinalApt.status}`);
    }
    console.log('   ✅ SUCCESS: Appointment marked COMPLETED.');

    console.log('\n========================================================================');
    console.log('🎉 ALL PATIENT LIVE QUEUE & DUPLICATE BOOKING TESTS PASSED PERFECTLY!');
    console.log('========================================================================\n');
  } finally {
    socket.disconnect();
  }
}

runTests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  if (err.response) {
    console.error('   Response Status:', err.response.status);
    console.error('   Response Data:', err.response.data);
  }
  process.exit(1);
});
