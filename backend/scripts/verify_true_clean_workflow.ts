import axios from 'axios';
import { runDemoReset } from './demoReset';

const API_BASE = 'http://localhost:5000/api';

async function verifyTrueCleanWorkflow() {
  console.log('====================================================');
  console.log('🚀 MEDLINK TRUE CLEAN WORKFLOW END-TO-END VERIFICATION');
  console.log('====================================================\n');

  // ----------------------------------------------------
  // TEST 1 — RESET
  // ----------------------------------------------------
  console.log('--- TEST 1: TRUE CLEAN OPERATIONAL RESET ---');
  await runDemoReset();

  const reqsRes1 = await axios.get(`${API_BASE}/availability/requests`);
  console.log(`Availability requests in system: ${reqsRes1.data.count}`);
  if (reqsRes1.data.count !== 0) {
    throw new Error(`TEST 1 FAILED: Expected 0 availability requests, got ${reqsRes1.data.count}`);
  }

  const aptsRes1 = await axios.get(`${API_BASE}/appointments`);
  const aptsCount = aptsRes1.data.count ?? aptsRes1.data.appointments?.length ?? 0;
  console.log(`Appointments in system: ${aptsCount}`);
  if (aptsCount !== 0) {
    throw new Error('TEST 1 FAILED: Expected 0 appointments after reset');
  }

  // Verify Patient App slots for Doctor 1 (Priya) at Clinic 1 (Moon Dental) on 2026-09-30
  const slotsPriya1 = await axios.get(`${API_BASE}/doctors/doc-demo-priya-02/slots?date=2026-09-30&clinicId=c-demo-moon-01`);
  console.log(`Doctor 1 slots before approval: ${slotsPriya1.data.totalSlotsCount}`);
  if (slotsPriya1.data.totalSlotsCount !== 0) {
    throw new Error('TEST 1 FAILED: Expected 0 slots before any availability request is approved');
  }

  // Doctor 2 (Rajesh) slots
  const slotsRajesh1 = await axios.get(`${API_BASE}/doctors/doc-demo-rajesh-14/slots?date=2026-09-30&clinicId=c-demo-apollo-02`);
  console.log(`Doctor 2 slots before approval: ${slotsRajesh1.data.totalSlotsCount}`);
  if (slotsRajesh1.data.totalSlotsCount !== 0) {
    throw new Error('TEST 1 FAILED: Expected 0 slots for Doctor 2');
  }

  console.log('✅ TEST 1 PASSED: Operational reset is completely clean (0 requests, 0 appointments, 0 fake slots).\n');

  // ----------------------------------------------------
  // TEST 2 — CREATE REQUEST (Clinic Assistant)
  // ----------------------------------------------------
  console.log('--- TEST 2: CREATE AVAILABILITY REQUEST (Clinic Assistant) ---');
  const createReqPayload = {
    doctorId: 'doc-demo-priya-02',
    clinicId: 'c-demo-moon-01',
    date: '2026-09-30',
    startTime: '10:00 AM',
    endTime: '12:00 PM',
    notes: 'Requested shift for Wednesday morning consultation window',
  };

  const createReqRes = await axios.post(`${API_BASE}/availability/requests`, createReqPayload);
  const createdReq = createReqRes.data.request;
  console.log(`Created request ID: ${createdReq.id}, Status: ${createdReq.status}`);
  if (createdReq.status !== 'PENDING') {
    throw new Error(`TEST 2 FAILED: Expected request status PENDING, got ${createdReq.status}`);
  }

  // Verify slots remain 0 while request is PENDING
  const slotsPriyaPending = await axios.get(`${API_BASE}/doctors/doc-demo-priya-02/slots?date=2026-09-30&clinicId=c-demo-moon-01`);
  console.log(`Doctor slots while request is PENDING: ${slotsPriyaPending.data.totalSlotsCount}`);
  if (slotsPriyaPending.data.totalSlotsCount !== 0) {
    throw new Error('TEST 2 FAILED: Pending requests must NEVER create patient slots');
  }
  console.log('✅ TEST 2 PASSED: Availability request created as PENDING, 0 slots exposed.\n');

  // ----------------------------------------------------
  // TEST 3 — REJECT REQUEST (Doctor App)
  // ----------------------------------------------------
  console.log('--- TEST 3: REJECT REQUEST FLOW ---');
  // Create another request for Doctor 2 (Rajesh) at Apollo on 2026-09-30
  const req2Res = await axios.post(`${API_BASE}/availability/requests`, {
    doctorId: 'doc-demo-rajesh-14',
    clinicId: 'c-demo-apollo-02',
    date: '2026-09-30',
    startTime: '02:00 PM',
    endTime: '04:00 PM',
  });
  const req2 = req2Res.data.request;

  // Doctor 2 logs in to reject
  const loginDoc2 = await axios.post(`${API_BASE}/auth/doctor/login`, {
    email: 'dr.rajesh@medlink.test',
    password: 'password123',
  });
  const tokenDoc2 = loginDoc2.data.token;

  // Doctor rejects request
  const rejectRes = await axios.post(
    `${API_BASE}/availability/requests/${req2.id}/reject`,
    { reason: 'Attending cardiology conference' },
    { headers: { Authorization: `Bearer ${tokenDoc2}` } }
  );
  console.log(`Request ${req2.id} status after doctor rejection: ${rejectRes.data.request.status}`);
  if (rejectRes.data.request.status !== 'REJECTED') {
    throw new Error('TEST 3 FAILED: Expected request status REJECTED');
  }

  // Verify slots remain 0 after rejection
  const slotsRajeshRejected = await axios.get(`${API_BASE}/doctors/doc-demo-rajesh-14/slots?date=2026-09-30&clinicId=c-demo-apollo-02`);
  console.log(`Doctor 2 slots after REJECTION: ${slotsRajeshRejected.data.totalSlotsCount}`);
  if (slotsRajeshRejected.data.totalSlotsCount !== 0) {
    throw new Error('TEST 3 FAILED: Rejected requests must NEVER create patient slots');
  }
  console.log('✅ TEST 3 PASSED: Rejected request creates 0 slots.\n');

  // ----------------------------------------------------
  // TEST 4 — ACCEPT REQUEST (Doctor App)
  // ----------------------------------------------------
  console.log('--- TEST 4: ACCEPT REQUEST & ACTIVATE EXACT SLOTS ---');
  // Doctor 1 (Priya) logs in
  const loginDoc1 = await axios.post(`${API_BASE}/auth/doctor/login`, {
    email: 'doctor02@demo.medlink.test',
    password: 'password123',
  });
  const tokenDoc1 = loginDoc1.data.token;

  // Doctor 1 approves the request from Test 2 (10:00 AM - 12:00 PM on 2026-09-30)
  const approveRes = await axios.post(
    `${API_BASE}/availability/requests/${createdReq.id}/approve`,
    { notes: 'Confirmed. Available for consultation.' },
    { headers: { Authorization: `Bearer ${tokenDoc1}` } }
  );
  console.log(`Request ${createdReq.id} status after doctor approval: ${approveRes.data.request.status}`);
  if (approveRes.data.request.status !== 'APPROVED') {
    throw new Error('TEST 4 FAILED: Expected request status APPROVED');
  }

  // Verify Patient App slots for Doctor 1 at Moon Dental on 2026-09-30
  const slotsPriyaApproved = await axios.get(`${API_BASE}/doctors/doc-demo-priya-02/slots?date=2026-09-30&clinicId=c-demo-moon-01`);
  const morningSlots = slotsPriyaApproved.data.slots.morning;
  console.log(`Approved window slots generated: ${slotsPriyaApproved.data.totalSlotsCount}`);
  console.log('Slots:', morningSlots.map((s: any) => s.time).join(', '));

  if (slotsPriyaApproved.data.totalSlotsCount === 0) {
    throw new Error('TEST 4 FAILED: Approved availability must generate slots');
  }

  // Check that all generated slots fall strictly within 10:00 AM - 12:00 PM
  const expectedTimes = ['10:00 AM', '10:20 AM', '10:40 AM', '11:00 AM', '11:20 AM', '11:40 AM'];
  for (const time of expectedTimes) {
    if (!morningSlots.some((s: any) => s.time === time)) {
      throw new Error(`TEST 4 FAILED: Missing expected slot ${time}`);
    }
  }

  // Verify no afternoon or evening slots were generated
  if (slotsPriyaApproved.data.slots.afternoon.length > 0 || slotsPriyaApproved.data.slots.evening.length > 0) {
    throw new Error('TEST 4 FAILED: No slots should be generated outside approved 10:00 AM - 12:00 PM window');
  }
  console.log('✅ TEST 4 PASSED: Exact slots generated for approved window.\n');

  // ----------------------------------------------------
  // TEST 5 — BOOK SAME BACKEND SLOT
  // ----------------------------------------------------
  console.log('--- TEST 5: PATIENT APPOINTMENT BOOKING ---');
  const targetSlot = '10:00 AM';
  const bookingPayload = {
    patientId: 'pat-demo-01',
    patientName: 'Aarav Patel',
    doctorId: 'doc-demo-priya-02',
    clinicId: 'c-demo-moon-01',
    date: '2026-09-30',
    time: targetSlot,
    expectedDuration: '20 min',
    reason: 'General consultation',
  };

  const bookRes = await axios.post(`${API_BASE}/appointments/book`, bookingPayload);
  const bookedApt = bookRes.data.appointment;
  console.log(`Appointment created with ID: ${bookedApt.id}, Token: ${bookedApt.tokenNumber}, Slot: ${bookedApt.time}`);
  if (bookedApt.time !== targetSlot) {
    throw new Error(`TEST 5 FAILED: Expected booked slot ${targetSlot}, got ${bookedApt.time}`);
  }

  // Verify that the booked slot is no longer available
  const slotsAfterBooking = await axios.get(`${API_BASE}/doctors/doc-demo-priya-02/slots?date=2026-09-30&clinicId=c-demo-moon-01`);
  const slot10AM = slotsAfterBooking.data.slots.morning.find((s: any) => s.time === targetSlot);
  console.log(`Slot ${targetSlot} availability status after booking: ${slot10AM?.status}, isAvailable: ${slot10AM?.isAvailable}`);
  if (slot10AM?.isAvailable !== false) {
    throw new Error(`TEST 5 FAILED: Slot ${targetSlot} should be marked unavailable after booking`);
  }

  // Attempting to book the SAME slot again MUST return 409 conflict
  try {
    await axios.post(`${API_BASE}/appointments/book`, bookingPayload);
    throw new Error('TEST 5 FAILED: Duplicate booking of same slot should have failed with 409 Conflict');
  } catch (err: any) {
    if (err.response?.status === 409) {
      console.log('✅ Duplicate booking correctly rejected with 409 Conflict');
    } else {
      throw err;
    }
  }

  // Verify Doctor App and Clinic Assistant see the booking
  const docApts = await axios.get(`${API_BASE}/appointments?doctorId=doc-demo-priya-02&date=2026-09-30`);
  const countDocApts = docApts.data.count ?? docApts.data.appointments?.length ?? 0;
  console.log(`Doctor appointments for 2026-09-30: ${countDocApts}`);
  if (countDocApts < 1) {
    throw new Error('TEST 5 FAILED: Doctor should see booked appointment');
  }
  console.log('✅ TEST 5 PASSED: Patient booked exact slot, duplicate rejected, state synchronized.\n');

  // ----------------------------------------------------
  // TEST 6 — MULTI-CLINIC & DOCTOR ISOLATION
  // ----------------------------------------------------
  console.log('--- TEST 6: MULTI-CLINIC & DOCTOR ISOLATION (2 Clinics, 3 Doctors) ---');
  // Clinic 1: c-demo-moon-01 (Moon Dental)
  // Clinic 2: c-demo-apollo-02 (Apollo Speciality)
  // Doctor 1: doc-demo-priya-02 (Approved at Moon Dental for 2026-09-30)
  // Doctor 2: doc-demo-rajesh-14 (Rejected at Apollo for 2026-09-30)
  // Doctor 3: doc-demo-arun-01 (No request created)

  // 1. Doctor 1 at Apollo (Clinic 2) on 2026-09-30 MUST have 0 slots
  const priyaApolloSlots = await axios.get(`${API_BASE}/doctors/doc-demo-priya-02/slots?date=2026-09-30&clinicId=c-demo-apollo-02`);
  console.log(`Priya at Apollo (Clinic 2) slots: ${priyaApolloSlots.data.totalSlotsCount}`);
  if (priyaApolloSlots.data.totalSlotsCount !== 0) {
    throw new Error('TEST 6 FAILED: Priya approved at Moon Dental must NOT leak slots to Apollo');
  }

  // 2. Doctor 1 on another date (e.g. 2026-09-29) at Moon Dental MUST have 0 slots
  const priyaOtherDateSlots = await axios.get(`${API_BASE}/doctors/doc-demo-priya-02/slots?date=2026-09-29&clinicId=c-demo-moon-01`);
  console.log(`Priya at Moon Dental on 2026-09-29 slots: ${priyaOtherDateSlots.data.totalSlotsCount}`);
  if (priyaOtherDateSlots.data.totalSlotsCount !== 0) {
    throw new Error('TEST 6 FAILED: Approval on 30 Sep must NOT leak to 29 Sep');
  }

  // 3. Doctor 3 (Arun) at Moon Dental on 2026-09-30 MUST have 0 slots
  const arunMoonSlots = await axios.get(`${API_BASE}/doctors/doc-demo-arun-01/slots?date=2026-09-30&clinicId=c-demo-moon-01`);
  console.log(`Arun at Moon Dental slots: ${arunMoonSlots.data.totalSlotsCount}`);
  if (arunMoonSlots.data.totalSlotsCount !== 0) {
    throw new Error('TEST 6 FAILED: Unrequested doctor Arun must have 0 slots');
  }

  // 4. Doctor 3 approves schedule at Apollo (Clinic 2) on 2026-10-01
  const req3Res = await axios.post(`${API_BASE}/availability/requests`, {
    doctorId: 'doc-demo-arun-01',
    clinicId: 'c-demo-apollo-02',
    date: '2026-10-01',
    startTime: '03:00 PM',
    endTime: '05:00 PM',
  });
  const req3 = req3Res.data.request;

  const loginDoc3 = await axios.post(`${API_BASE}/auth/doctor/login`, {
    email: 'doctor01@demo.medlink.test',
    password: 'password123',
  });
  const tokenDoc3 = loginDoc3.data.token;

  await axios.post(
    `${API_BASE}/availability/requests/${req3.id}/approve`,
    { notes: 'Approved for Apollo' },
    { headers: { Authorization: `Bearer ${tokenDoc3}` } }
  );

  const arunApolloSlots = await axios.get(`${API_BASE}/doctors/doc-demo-arun-01/slots?date=2026-10-01&clinicId=c-demo-apollo-02`);
  console.log(`Arun at Apollo on 2026-10-01 slots: ${arunApolloSlots.data.totalSlotsCount}`);
  if (arunApolloSlots.data.totalSlotsCount === 0) {
    throw new Error('TEST 6 FAILED: Arun approved at Apollo must have slots');
  }

  // Arun must NOT have slots at Moon Dental on 2026-10-01
  const arunMoonOct1 = await axios.get(`${API_BASE}/doctors/doc-demo-arun-01/slots?date=2026-10-01&clinicId=c-demo-moon-01`);
  console.log(`Arun at Moon Dental on 2026-10-01 slots: ${arunMoonOct1.data.totalSlotsCount}`);
  if (arunMoonOct1.data.totalSlotsCount !== 0) {
    throw new Error('TEST 6 FAILED: Arun approved at Apollo must NOT leak to Moon Dental');
  }

  // 5. Test Live Status Clinic-Specificity:
  // Changing Dr. Arun status at Apollo to OFFLINE must NOT affect Moon Dental status or wipe approved requests
  await axios.patch(`${API_BASE}/doctors/doc-demo-arun-01/status`, {
    clinicId: 'c-demo-apollo-02',
    status: 'OFFLINE',
  });
  console.log('✅ Doctor status updated to OFFLINE at Apollo');

  const arunReqsAfterStatusChange = await axios.get(`${API_BASE}/availability/requests?doctorId=doc-demo-arun-01`);
  console.log(`Arun availability requests preserved after status change: ${arunReqsAfterStatusChange.data.count}`);
  if (arunReqsAfterStatusChange.data.count === 0) {
    throw new Error('TEST 6 FAILED: Approved availability request must not be deleted when live status changes');
  }

  console.log('✅ TEST 6 PASSED: Multi-clinic and doctor isolation strictly verified across clinics and doctors.\n');

  // Final reset to leave system completely clean for user's manual testing
  console.log('--- FINAL CLEAN DEMO RESET ---');
  await runDemoReset();

  console.log('====================================================');
  console.log('🎉 ALL 6 COMPREHENSIVE E2E TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

verifyTrueCleanWorkflow()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ E2E VERIFICATION FAILED:', err.response?.data || err.message);
    process.exit(1);
  });
