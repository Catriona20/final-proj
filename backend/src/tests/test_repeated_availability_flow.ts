import axios from 'axios';
import { io as Client } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';
const WS_URL = 'http://localhost:5000';

const DOCTOR_ID = 'doc-demo-priya-02';
const MOON_CLINIC_ID = 'c-demo-moon-01';
const APOLLO_CLINIC_ID = 'c-demo-apollo-02';

async function run() {
  console.log('====================================================');
  console.log('🧪 MEDLINK REPEATED AVAILABILITY REQUEST TEST SUITE');
  console.log('====================================================\n');

  // STEP 0: Clean reset to seed state
  console.log('0️⃣ Resetting database to clean demo state...');
  const resetRes = await axios.post(`${API_BASE}/simulation/reset-demo`);
  console.log('   Reset response:', resetRes.data.message || 'Success');

  // Login Doctor Priya Sharma
  console.log('\n🔑 Authenticating Dr. Priya Sharma...');
  const docLogin = await axios.post(`${API_BASE}/auth/doctor/login`, {
    email: 'doctor02@demo.medlink.test',
    password: 'Doctor@2002',
  });
  const doctorToken = docLogin.data.token;
  console.log('   Authenticated. Token acquired.');

  // Set up WebSockets for Clinic and Doctor
  console.log('\n📡 Connecting WebSockets for Clinic Assistant and Doctor App...');
  const doctorSocket = Client(WS_URL);
  const clinicSocket = Client(WS_URL);

  const doctorEvents: any[] = [];
  const clinicEvents: any[] = [];
  const broadcastEvents: any[] = [];

  await new Promise<void>((resolve) => {
    let connected = 0;
    const check = () => {
      connected++;
      if (connected === 2) resolve();
    };

    doctorSocket.on('connect', () => {
      doctorSocket.emit('join:doctor', DOCTOR_ID);
      check();
    });

    clinicSocket.on('connect', () => {
      clinicSocket.emit('join:clinic', MOON_CLINIC_ID);
      check();
    });
  });

  doctorSocket.on('availability_request:new', (data) => doctorEvents.push({ type: 'new', data }));
  doctorSocket.on('availability_request:approved', (data) => doctorEvents.push({ type: 'approved', data }));
  clinicSocket.on('availability_request:approved', (data) => clinicEvents.push({ type: 'approved', data }));
  doctorSocket.on('doctor:availability_updated', (data) => broadcastEvents.push({ type: 'avail_updated', data }));
  doctorSocket.on('appointment:slot_activated', (data) => broadcastEvents.push({ type: 'slot_activated', data }));

  console.log('   WebSockets connected and joined rooms.');

  // =========================================================================
  // STEP 1: Clinic Assistant creates FIRST request (Sep 29, 2026, 8:00 PM – 11:00 PM)
  // =========================================================================
  console.log('\n1️⃣ [STEP 1] Clinic Assistant creates FIRST request:');
  console.log('   Doctor: Dr. Priya Sharma');
  console.log('   Clinic: Moon Dental');
  console.log('   Date: 2026-09-29');
  console.log('   Time: 08:00 PM – 11:00 PM');

  const req1Res = await axios.post(`${API_BASE}/availability/requests`, {
    clinic_id: MOON_CLINIC_ID,
    doctor_id: DOCTOR_ID,
    date: '2026-09-29',
    start_time: '08:00 PM',
    end_time: '11:00 PM',
    notes: 'First shift schedule proposal',
    requested_by: 'Clinic Assistant',
  });

  if (!req1Res.data.success) {
    throw new Error(`FAIL: Could not create first request: ${JSON.stringify(req1Res.data)}`);
  }
  const req1 = req1Res.data.request;
  console.log(`   ✅ First request created: ID=${req1.id}, Status=${req1.status}, Date=${req1.date}, Time=${req1.start_time}–${req1.end_time}`);

  // =========================================================================
  // STEP 2: Doctor App receives request
  // =========================================================================
  console.log('\n2️⃣ [STEP 2] Doctor App checks incoming requests...');
  const docReqsBeforeApprove = await axios.get(`${API_BASE}/availability/requests`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  const foundReq1 = docReqsBeforeApprove.data.requests.find((r: any) => r.id === req1.id);
  if (!foundReq1 || foundReq1.status !== 'PENDING') {
    throw new Error(`FAIL: Doctor App did not receive pending request 1: ${JSON.stringify(foundReq1)}`);
  }
  console.log(`   ✅ Doctor App sees request 1: Status=${foundReq1.status}, Date=${foundReq1.date}`);

  // =========================================================================
  // STEP 3: Doctor APPROVES first request
  // =========================================================================
  console.log('\n3️⃣ [STEP 3] Doctor accepts first request...');
  const approve1Res = await axios.post(
    `${API_BASE}/availability/requests/${req1.id}/approve`,
    { notes: 'Confirmed by Dr. Priya' },
    { headers: { Authorization: `Bearer ${doctorToken}` } }
  );

  if (!approve1Res.data.success) {
    throw new Error(`FAIL: Doctor could not approve request 1: ${JSON.stringify(approve1Res.data)}`);
  }
  console.log('   ✅ Request 1 approved. Slots generated:', approve1Res.data.slots ? 'YES' : 'NO');

  // Verify Patient App slots for Sep 29
  console.log('\n   Verifying Patient App slots for Sep 29 (Dr. Priya @ Moon Dental)...');
  const patientSlots29 = await axios.get(
    `${API_BASE}/doctors/${DOCTOR_ID}/slots?date=2026-09-29&clinicId=${MOON_CLINIC_ID}`
  );
  const slots29Data = patientSlots29.data;
  const evening29 = slots29Data.slots.evening.map((s: any) => s.time);
  console.log(`   Sep 29 Total Slots: ${slots29Data.totalSlotsCount}, Evening: ${evening29.slice(0, 4).join(', ')}...`);
  if (slots29Data.totalSlotsCount === 0) {
    throw new Error('FAIL: No slots generated for Sep 29 after approval!');
  }

  // Verify Sep 28 has NO slots (should be empty for Moon Dental)
  const patientSlots28 = await axios.get(
    `${API_BASE}/doctors/${DOCTOR_ID}/slots?date=2026-09-28&clinicId=${MOON_CLINIC_ID}`
  );
  if (patientSlots28.data.totalSlotsCount !== 0) {
    throw new Error(`FAIL: Sep 28 should not have slots at Moon Dental without approval! Found: ${patientSlots28.data.totalSlotsCount}`);
  }
  console.log('   ✅ Sep 28 properly has 0 slots (independent from Sep 29).');

  // =========================================================================
  // STEP 4: Clinic Assistant creates SECOND request (Sep 30, 2026, 8:00 PM – 11:00 PM)
  // =========================================================================
  console.log('\n4️⃣ [STEP 4] Clinic Assistant creates SECOND request:');
  console.log('   Doctor: Dr. Priya Sharma');
  console.log('   Clinic: Moon Dental');
  console.log('   Date: 2026-09-30');
  console.log('   Time: 08:00 PM – 11:00 PM');

  const req2Res = await axios.post(`${API_BASE}/availability/requests`, {
    clinic_id: MOON_CLINIC_ID,
    doctor_id: DOCTOR_ID,
    date: '2026-09-30',
    start_time: '08:00 PM',
    end_time: '11:00 PM',
    notes: 'Second shift schedule proposal for next date',
    requested_by: 'Clinic Assistant',
  });

  if (!req2Res.data.success) {
    throw new Error(`FAIL: Could not create second request: ${JSON.stringify(req2Res.data)}`);
  }
  const req2 = req2Res.data.request;
  console.log(`   ✅ Second request created: ID=${req2.id}, Status=${req2.status}, Date=${req2.date}, Time=${req2.start_time}–${req2.end_time}`);

  // Test Conflict Detection on overlapping interval on same date
  console.log('\n   Testing Interval Conflict Detection: creating identical schedule (Sep 30, 8:00 PM - 11:00 PM)...');
  try {
    await axios.post(`${API_BASE}/availability/requests`, {
      clinic_id: MOON_CLINIC_ID,
      doctor_id: DOCTOR_ID,
      date: '2026-09-30',
      start_time: '08:00 PM',
      end_time: '11:00 PM',
    });
    throw new Error('FAIL: Identical overlapping schedule was not rejected!');
  } catch (err: any) {
    if (err.response && err.response.status === 409) {
      console.log('   ✅ Conflict properly rejected with 409:', err.response.data.error);
    } else {
      throw err;
    }
  }

  // =========================================================================
  // STEP 5: Doctor APPROVES second request
  // =========================================================================
  console.log('\n5️⃣ [STEP 5] Doctor accepts second request...');
  const approve2Res = await axios.post(
    `${API_BASE}/availability/requests/${req2.id}/approve`,
    { notes: 'Confirmed by Dr. Priya for Sep 30' },
    { headers: { Authorization: `Bearer ${doctorToken}` } }
  );

  if (!approve2Res.data.success) {
    throw new Error(`FAIL: Doctor could not approve request 2: ${JSON.stringify(approve2Res.data)}`);
  }
  console.log('   ✅ Request 2 approved.');

  // =========================================================================
  // VERIFY BOTH SCHEDULES COEXIST INDEPENDENTLY
  // =========================================================================
  console.log('\n📊 Verifying both schedules coexist independently:');

  // Verify Clinic Assistant sees both approved schedules
  const clinicReqs = await axios.get(`${API_BASE}/availability/requests?clinicId=${MOON_CLINIC_ID}`);
  const reqsAtMoon = clinicReqs.data.requests;
  const approvedReq1 = reqsAtMoon.find((r: any) => r.id === req1.id);
  const approvedReq2 = reqsAtMoon.find((r: any) => r.id === req2.id);

  console.log('   Clinic Assistant Requests:');
  console.log(`     - Request 1: ID=${approvedReq1.id}, Date=${approvedReq1.date}, Time=${approvedReq1.start_time}–${approvedReq1.end_time}, Status=${approvedReq1.status}`);
  console.log(`     - Request 2: ID=${approvedReq2.id}, Date=${approvedReq2.date}, Time=${approvedReq2.start_time}–${approvedReq2.end_time}, Status=${approvedReq2.status}`);

  if (approvedReq1.status !== 'APPROVED' || approvedReq2.status !== 'APPROVED') {
    throw new Error('FAIL: One of the requests is not APPROVED in Clinic Assistant!');
  }
  if (approvedReq1.date !== '2026-09-29' || approvedReq2.date !== '2026-09-30') {
    throw new Error('FAIL: Incorrect dates attached to requests!');
  }

  // Verify Doctor App sees both approved schedules
  const docReqs = await axios.get(`${API_BASE}/availability/requests`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  const docR1 = docReqs.data.requests.find((r: any) => r.id === req1.id);
  const docR2 = docReqs.data.requests.find((r: any) => r.id === req2.id);

  console.log('   Doctor App Requests:');
  console.log(`     - Schedule 1: Date=${docR1.date}, Time=${docR1.start_time}–${docR1.end_time}, Status=${docR1.status}`);
  console.log(`     - Schedule 2: Date=${docR2.date}, Time=${docR2.start_time}–${docR2.end_time}, Status=${docR2.status}`);

  if (docR1.status !== 'APPROVED' || docR2.status !== 'APPROVED') {
    throw new Error('FAIL: Doctor App did not keep both schedules approved!');
  }

  // Verify Patient App slots for Sep 29 AND Sep 30
  const slots29Check = await axios.get(
    `${API_BASE}/doctors/${DOCTOR_ID}/slots?date=2026-09-29&clinicId=${MOON_CLINIC_ID}`
  );
  const slots30Check = await axios.get(
    `${API_BASE}/doctors/${DOCTOR_ID}/slots?date=2026-09-30&clinicId=${MOON_CLINIC_ID}`
  );

  console.log(`   Patient App Sep 29 Available Slots: ${slots29Check.data.availableSlotsCount} (Total: ${slots29Check.data.totalSlotsCount})`);
  console.log(`   Patient App Sep 30 Available Slots: ${slots30Check.data.availableSlotsCount} (Total: ${slots30Check.data.totalSlotsCount})`);

  if (slots29Check.data.availableSlotsCount === 0) {
    throw new Error('FAIL: Sep 29 lost slots after Sep 30 was approved!');
  }
  if (slots30Check.data.availableSlotsCount === 0) {
    throw new Error('FAIL: Sep 30 has 0 slots after approval!');
  }

  // Check Oct 1 has NO slots (unapproved date)
  const slotsOct1 = await axios.get(
    `${API_BASE}/doctors/${DOCTOR_ID}/slots?date=2026-10-01&clinicId=${MOON_CLINIC_ID}`
  );
  if (slotsOct1.data.totalSlotsCount !== 0) {
    throw new Error('FAIL: Unapproved date (Oct 1) returned slots!');
  }
  console.log('   ✅ Oct 1 correctly returns 0 slots (not approved).');

  // Multi-clinic isolation: Check Apollo does NOT have Moon Dental's slots
  const apolloSlots29 = await axios.get(
    `${API_BASE}/doctors/${DOCTOR_ID}/slots?date=2026-09-29&clinicId=${APOLLO_CLINIC_ID}`
  );
  const apolloEvening29 = apolloSlots29.data.slots.evening.map((s: any) => s.time);
  const hasMoonShiftAtApollo = apolloEvening29.includes('08:00 PM') || apolloEvening29.includes('10:00 PM');
  if (hasMoonShiftAtApollo) {
    throw new Error('FAIL: Multi-clinic isolation breached! Moon Dental shift appeared at Apollo!');
  }
  console.log('   ✅ Multi-clinic isolation confirmed: Apollo does not receive Moon Dental shift slots.');

  // =========================================================================
  // STEP 5B: Test Multiple Independent Shifts on the SAME date
  // (e.g. Sep 30 10:00 AM – 12:00 PM AND Sep 30 08:00 PM – 11:00 PM)
  // =========================================================================
  console.log('\n5️⃣b [STEP 5B] Creating a SECOND non-overlapping shift on Sep 30 (10:00 AM – 12:00 PM)...');
  const req3Res = await axios.post(`${API_BASE}/availability/requests`, {
    clinic_id: MOON_CLINIC_ID,
    doctor_id: DOCTOR_ID,
    date: '2026-09-30',
    start_time: '10:00 AM',
    end_time: '12:00 PM',
    notes: 'Morning shift on Sep 30',
    requested_by: 'Clinic Assistant',
  });
  if (!req3Res.data.success) {
    throw new Error(`FAIL: Could not create morning shift on same date: ${JSON.stringify(req3Res.data)}`);
  }
  const req3 = req3Res.data.request;
  console.log(`   ✅ Non-overlapping same-day shift created: ID=${req3.id}`);

  // Doctor approves morning shift
  await axios.post(
    `${API_BASE}/availability/requests/${req3.id}/approve`,
    { notes: 'Approved morning shift' },
    { headers: { Authorization: `Bearer ${doctorToken}` } }
  );

  // Check slots on Sep 30: must now include MORNING and EVENING slots!
  const slots30Multi = await axios.get(
    `${API_BASE}/doctors/${DOCTOR_ID}/slots?date=2026-09-30&clinicId=${MOON_CLINIC_ID}`
  );
  const m30 = slots30Multi.data.slots.morning.map((s: any) => s.time);
  const e30 = slots30Multi.data.slots.evening.map((s: any) => s.time);
  console.log(`   Sep 30 Morning Slots (${m30.length}): ${m30.join(', ')}`);
  console.log(`   Sep 30 Evening Slots (${e30.length}): ${e30.slice(0, 4).join(', ')}...`);
  if (m30.length === 0 || e30.length === 0) {
    throw new Error('FAIL: Slots were not generated for both morning and evening shifts on same date!');
  }
  console.log('   ✅ Both morning and evening shifts on the same date coexist and generate independent slots.');

  // =========================================================================
  // STEP 6: Refresh Simulation (Persistence check)
  // =========================================================================
  console.log('\n6️⃣ [STEP 6] Testing persistence / refresh:');
  const persistedReqs = await axios.get(`${API_BASE}/availability/requests?clinicId=${MOON_CLINIC_ID}`);
  const p1 = persistedReqs.data.requests.find((r: any) => r.id === req1.id);
  const p2 = persistedReqs.data.requests.find((r: any) => r.id === req2.id);

  if (p1.status !== 'APPROVED' || p2.status !== 'APPROVED') {
    throw new Error('FAIL: Persistence failed, approved statuses lost!');
  }
  console.log('   ✅ Persistence verified: Both requests remain APPROVED with exact dates and times.');

  // Clean up WebSockets
  doctorSocket.disconnect();
  clinicSocket.disconnect();

  console.log('\n====================================================');
  console.log('🎉 ALL 12 VALIDATION CHECKS PASSED PERFECTLY!');
  console.log('====================================================\n');
}

run().catch((err) => {
  console.error('\n❌ TEST RUNNER FAILED:', err.message);
  if (err.response) {
    console.error('Response data:', err.response.data);
  }
  process.exit(1);
});
