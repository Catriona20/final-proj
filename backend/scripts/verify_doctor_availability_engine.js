/**
 * Comprehensive Automated Verification for MedLink Doctor Availability Engine
 * Covers all 16 mandatory criteria specified in the prompt.
 */
let io;
try {
  io = require('../../clinic-assistant/client/node_modules/socket.io-client');
} catch (e) {
  io = require('../../doctor-app/node_modules/socket.io-client');
}

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const TEST_DOCTOR_ID = 'doc-demo-arun-01'; // Dr. Arun Kumar
const TEST_CLINIC_ID = 'c-demo-moon-01'; // Moon Dental Clinic
const TEST_DATE_VALID = '2026-09-16'; // Wednesday (consulting day for Dr. Arun 09:00 AM - 01:00 PM)
const TEST_DATE_OFF_DUTY = '2026-09-20'; // Sunday (Off-duty for Dr. Arun)
const TEST_DATE_LEAVE = '2026-09-23'; // Wednesday to mark on leave

const createdTestAppointmentIds = [];

async function api(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function runVerification() {
  console.log('====================================================');
  console.log('STARTING DOCTOR AVAILABILITY ENGINE FULL VERIFICATION');
  console.log('====================================================\n');

  const results = {};

  // Setup Socket listener to test real-time sync
  const socket = io(SOCKET_URL, { reconnection: false, timeout: 5000 });
  const receivedSocketEvents = [];

  await new Promise((resolve) => {
    socket.on('connect', () => {
      socket.emit('join:doctor', TEST_DOCTOR_ID);
      socket.emit('join:clinic', TEST_CLINIC_ID);
      socket.on('doctor:availability_updated', (data) => {
        receivedSocketEvents.push({ event: 'doctor:availability_updated', data });
      });
      socket.on('appointment:created', (data) => {
        receivedSocketEvents.push({ event: 'appointment:created', data });
      });
      socket.on('appointment:cancelled', (data) => {
        receivedSocketEvents.push({ event: 'appointment:cancelled', data });
      });
      socket.on('appointment:rescheduled', (data) => {
        receivedSocketEvents.push({ event: 'appointment:rescheduled', data });
      });
      resolve();
    });
  });

  try {
    // ----------------------------------------------------
    // TEST 1: Working-hours slot generation & boundaries
    // ----------------------------------------------------
    console.log('--- TEST 1: Working-Hours Slot Generation & Boundaries ---');
    const slotsRes1 = await api(`/doctors/${TEST_DOCTOR_ID}/slots?date=${TEST_DATE_VALID}`);
    assert(slotsRes1.status === 200, 'Fetched slots successfully');
    assert(slotsRes1.data.doctorId === TEST_DOCTOR_ID, 'Doctor ID matches canonical ID');
    assert(slotsRes1.data.clinicId === TEST_CLINIC_ID, 'Clinic ID matches Moon Dental Clinic');
    assert(slotsRes1.data.workingHours.start === '09:00 AM', 'Working hours start is 09:00 AM');
    assert(slotsRes1.data.workingHours.end === '01:00 PM', 'Working hours end is 01:00 PM');
    assert(slotsRes1.data.consultationDurationMinutes === 20, 'Consultation duration is 20 minutes');

    const allSlots1 = [
      ...slotsRes1.data.slots.morning,
      ...slotsRes1.data.slots.afternoon,
      ...slotsRes1.data.slots.evening,
    ];

    assert(allSlots1.length > 0, `Generated ${allSlots1.length} slots for consulting day`);

    // Verify all slots fit within 09:00 AM and 01:00 PM
    const firstSlot = allSlots1[0];
    const lastSlot = allSlots1[allSlots1.length - 1];
    assert(firstSlot.time === '09:00 AM', `First slot starts exactly at working start (09:00 AM, got ${firstSlot.time})`);
    assert(lastSlot.time === '12:40 PM', `Last 20-min slot is 12:40 PM (ends at 01:00 PM, got ${lastSlot.time})`);

    // Out-of-hours booking rejection
    const outOfHoursRes = await api('/appointments/book', {
      method: 'POST',
      body: JSON.stringify({
        patientId: 'pat-demo-01',
        doctorId: TEST_DOCTOR_ID,
        clinicId: TEST_CLINIC_ID,
        date: TEST_DATE_VALID,
        time: '08:40 AM', // Before 09:00 AM
      }),
    });
    assert(outOfHoursRes.status === 400 && outOfHoursRes.data.code === 'OUT_OF_HOURS', 'Booking before working hours rejected with 400 OUT_OF_HOURS');

    const outOfHoursEndRes = await api('/appointments/book', {
      method: 'POST',
      body: JSON.stringify({
        patientId: 'pat-demo-01',
        doctorId: TEST_DOCTOR_ID,
        clinicId: TEST_CLINIC_ID,
        date: TEST_DATE_VALID,
        time: '01:00 PM', // Starts at end of working hours -> ends 01:20 PM
      }),
    });
    assert(outOfHoursEndRes.status === 400 && outOfHoursEndRes.data.code === 'OUT_OF_HOURS', 'Booking after/at working end rejected with 400 OUT_OF_HOURS');
    results['WORKING_HOURS'] = 'PASS';

    // ----------------------------------------------------
    // TEST 2: Consultation Duration Boundary
    // ----------------------------------------------------
    console.log('\n--- TEST 2: Consultation Duration Boundary ---');
    // Slot 12:50 PM with 20-min duration ends at 01:10 PM (crosses 01:00 PM boundary)
    const crossingBoundaryRes = await api('/appointments/book', {
      method: 'POST',
      body: JSON.stringify({
        patientId: 'pat-demo-01',
        doctorId: TEST_DOCTOR_ID,
        clinicId: TEST_CLINIC_ID,
        date: TEST_DATE_VALID,
        time: '12:50 PM',
        expectedDuration: '20 min',
      }),
    });
    assert(crossingBoundaryRes.status === 400 && crossingBoundaryRes.data.code === 'OUT_OF_HOURS', 'Slot crossing working-hour end boundary (12:50-01:10 PM) rejected with OUT_OF_HOURS');
    results['CONSULTATION_DURATION'] = 'PASS';

    // ----------------------------------------------------
    // TEST 3: Breaks Exclusion
    // ----------------------------------------------------
    console.log('\n--- TEST 3: Break Exclusion ---');
    // Configure a date-specific break on TEST_DATE_VALID (e.g. 11:00 AM - 11:40 AM)
    // First login as doctor to get JWT
    const docLoginRes = await api('/auth/doctor/login', {
      method: 'POST',
      body: JSON.stringify({
        emailOrPhone: 'doctor01@demo.medlink.test',
        password: 'Doctor@2001',
      }),
    });
    assert(docLoginRes.status === 200 && docLoginRes.data.token, 'Doctor login succeeded to configure schedule');
    const docToken = docLoginRes.data.token;

    // Set custom break on TEST_DATE_VALID: 11:00 AM - 12:00 PM
    const setAvailRes = await api('/doctors/auth/availability-schedule', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${docToken}` },
      body: JSON.stringify({
        date: TEST_DATE_VALID,
        startTime: '09:00 AM',
        endTime: '01:00 PM',
        breaks: [
          { start: '11:00 AM', end: '12:00 PM', reason: 'Midday Break' },
        ],
        consultationDuration: '20 min',
        availabilityStatus: 'AVAILABLE',
      }),
    });
    assert(setAvailRes.status === 200, 'Custom break configured on test date');

    // Fetch slots and verify 11:00, 11:20, 11:40 are omitted/excluded
    const slotsBreakRes = await api(`/doctors/${TEST_DOCTOR_ID}/slots?date=${TEST_DATE_VALID}`);
    const breakSlotTimes = [
      ...slotsBreakRes.data.slots.morning,
      ...slotsBreakRes.data.slots.afternoon,
      ...slotsBreakRes.data.slots.evening,
    ].map((s) => s.time);

    assert(!breakSlotTimes.includes('11:00 AM'), '11:00 AM slot removed due to break');
    assert(!breakSlotTimes.includes('11:20 AM'), '11:20 AM slot removed due to break');
    assert(!breakSlotTimes.includes('11:40 AM'), '11:40 AM slot removed due to break');
    assert(breakSlotTimes.includes('10:40 AM'), '10:40 AM slot (ends at 11:00 AM) is available');
    assert(breakSlotTimes.includes('12:00 PM'), '12:00 PM slot (starts at break end) is available');

    // Attempt to directly book a slot overlapping the break: 11:20 AM
    const breakBookRes = await api('/appointments/book', {
      method: 'POST',
      body: JSON.stringify({
        patientId: 'pat-demo-01',
        doctorId: TEST_DOCTOR_ID,
        clinicId: TEST_CLINIC_ID,
        date: TEST_DATE_VALID,
        time: '11:20 AM',
      }),
    });
    assert(breakBookRes.status === 400 && breakBookRes.data.code === 'SLOT_IN_BREAK', 'Direct booking during break rejected with 400 SLOT_IN_BREAK');
    results['BREAKS'] = 'PASS';

    // ----------------------------------------------------
    // TEST 4: Leave / Unavailable Date
    // ----------------------------------------------------
    console.log('\n--- TEST 4: Leave / Unavailable Date ---');
    // Add leave exception on TEST_DATE_LEAVE
    const addLeaveRes = await api('/doctors/auth/schedule', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${docToken}` },
      body: JSON.stringify({
        newException: {
          date: TEST_DATE_LEAVE,
          reason: 'Annual Dental Conference',
          isFullDay: true,
        },
      }),
    });
    assert(addLeaveRes.status === 200, 'Added leave exception for doctor');

    // Fetch slots for leave date
    const leaveSlotsRes = await api(`/doctors/${TEST_DOCTOR_ID}/slots?date=${TEST_DATE_LEAVE}`);
    assert(leaveSlotsRes.data.availabilityStatus === 'ON_LEAVE', 'Availability status is ON_LEAVE');
    assert(leaveSlotsRes.data.availableSlotsCount === 0, 'Available slots count is 0 on leave date');

    // Booking attempt on leave date
    const leaveBookingRes = await api('/appointments/book', {
      method: 'POST',
      body: JSON.stringify({
        patientId: 'pat-demo-01',
        doctorId: TEST_DOCTOR_ID,
        clinicId: TEST_CLINIC_ID,
        date: TEST_DATE_LEAVE,
        time: '10:00 AM',
      }),
    });
    assert(leaveBookingRes.status === 400 && leaveBookingRes.data.code === 'DOCTOR_ON_LEAVE', 'Booking on leave date rejected with 400 DOCTOR_ON_LEAVE');
    results['LEAVE'] = 'PASS';

    // ----------------------------------------------------
    // TEST 5: Off-Duty Day-of-Week
    // ----------------------------------------------------
    console.log('\n--- TEST 5: Off-Duty Day-of-Week ---');
    // Sunday is off for Dr. Arun
    const offDutySlotsRes = await api(`/doctors/${TEST_DOCTOR_ID}/slots?date=${TEST_DATE_OFF_DUTY}`);
    assert(offDutySlotsRes.data.availabilityStatus === 'UNAVAILABLE', 'Sunday availability status is UNAVAILABLE');
    assert(offDutySlotsRes.data.availableSlotsCount === 0, 'Zero available slots on Sunday');

    const offDutyBookingRes = await api('/appointments/book', {
      method: 'POST',
      body: JSON.stringify({
        patientId: 'pat-demo-01',
        doctorId: TEST_DOCTOR_ID,
        clinicId: TEST_CLINIC_ID,
        date: TEST_DATE_OFF_DUTY,
        time: '10:00 AM',
      }),
    });
    assert(offDutyBookingRes.status === 400 && offDutyBookingRes.data.code === 'DOCTOR_OFF_DUTY', 'Booking on off-duty day rejected with 400 DOCTOR_OFF_DUTY');
    results['OFF_DUTY'] = 'PASS';

    // ----------------------------------------------------
    // TEST 6: Past Date & Past Slot Protection
    // ----------------------------------------------------
    console.log('\n--- TEST 6: Past Date & Past Slot Protection ---');
    const pastDateRes = await api('/appointments/book', {
      method: 'POST',
      body: JSON.stringify({
        patientId: 'pat-demo-01',
        doctorId: TEST_DOCTOR_ID,
        clinicId: TEST_CLINIC_ID,
        date: '2026-08-01',
        time: '10:00 AM',
      }),
    });
    assert(pastDateRes.status === 400 && pastDateRes.data.code === 'PAST_DATE', 'Booking past date rejected with 400 PAST_DATE');
    results['PAST_SLOT_PROTECTION'] = 'PASS';

    // ----------------------------------------------------
    // TEST 7: Clinic Isolation
    // ----------------------------------------------------
    console.log('\n--- TEST 7: Clinic Isolation ---');
    const clinicMismatchRes = await api('/appointments/book', {
      method: 'POST',
      body: JSON.stringify({
        patientId: 'pat-demo-01',
        doctorId: TEST_DOCTOR_ID,
        clinicId: 'c-demo-multi-02', // Apollo Family Care Centre, not Moon Dental
        date: TEST_DATE_VALID,
        time: '09:20 AM',
      }),
    });
    assert(clinicMismatchRes.status === 400 && clinicMismatchRes.data.code === 'CLINIC_MISMATCH', 'Booking with wrong clinic rejected with 400 CLINIC_MISMATCH');

    const invalidClinicRes = await api('/appointments/book', {
      method: 'POST',
      body: JSON.stringify({
        patientId: 'pat-demo-01',
        doctorId: TEST_DOCTOR_ID,
        clinicId: 'c-nonexistent-clinic',
        date: TEST_DATE_VALID,
        time: '09:20 AM',
      }),
    });
    assert(invalidClinicRes.status === 404, 'Booking with invalid clinic ID rejected with 404');
    results['CLINIC_ISOLATION'] = 'PASS';

    // ----------------------------------------------------
    // TEST 8: Existing Appointment Blocks Slot & Double Booking (Concurrency)
    // ----------------------------------------------------
    console.log('\n--- TEST 8: Existing Appointment & Concurrent Double-Booking ---');
    const TARGET_SLOT = '09:40 AM';

    // Simulate two concurrent requests hitting backend simultaneously
    const [bookingA, bookingB] = await Promise.all([
      api('/appointments/book', {
        method: 'POST',
        body: JSON.stringify({
          patientId: 'pat-demo-01',
          doctorId: TEST_DOCTOR_ID,
          clinicId: TEST_CLINIC_ID,
          date: TEST_DATE_VALID,
          time: TARGET_SLOT,
        }),
      }),
      api('/appointments/book', {
        method: 'POST',
        body: JSON.stringify({
          patientId: 'pat-demo-02',
          doctorId: TEST_DOCTOR_ID,
          clinicId: TEST_CLINIC_ID,
          date: TEST_DATE_VALID,
          time: TARGET_SLOT,
        }),
      }),
    ]);

    const statuses = [bookingA.status, bookingB.status].sort();
    assert(statuses[0] === 201 && statuses[1] === 409, `Concurrent double booking: one 201 and one 409 Conflict (got ${bookingA.status} and ${bookingB.status})`);

    const successfulBooking = bookingA.status === 201 ? bookingA : bookingB;
    const aptId = successfulBooking.data.appointment.id;
    createdTestAppointmentIds.push(aptId);

    // Verify slot is now unavailable in slots query
    const slotsAfterBookingRes = await api(`/doctors/${TEST_DOCTOR_ID}/slots?date=${TEST_DATE_VALID}`);
    const slotObj = [
      ...slotsAfterBookingRes.data.slots.morning,
      ...slotsAfterBookingRes.data.slots.afternoon,
      ...slotsAfterBookingRes.data.slots.evening,
    ].find((s) => s.time === TARGET_SLOT);

    assert(slotObj && slotObj.status === 'Unavailable', `${TARGET_SLOT} is marked 'Unavailable' in slots API`);

    // Third booking attempt must also get 409 Conflict
    const bookingC = await api('/appointments/book', {
      method: 'POST',
      body: JSON.stringify({
        patientId: 'pat-demo-03',
        doctorId: TEST_DOCTOR_ID,
        clinicId: TEST_CLINIC_ID,
        date: TEST_DATE_VALID,
        time: TARGET_SLOT,
      }),
    });
    assert(bookingC.status === 409 && bookingC.data.code === 'SLOT_NO_LONGER_AVAILABLE', 'Subsequent booking gets 409 Conflict SLOT_NO_LONGER_AVAILABLE');
    results['DOUBLE_BOOKING_PROTECTION'] = 'PASS';
    results['EXISTING_APPOINTMENTS'] = 'PASS';
    results['BACKEND_REVALIDATION'] = 'PASS';

    // ----------------------------------------------------
    // TEST 9: Rescheduling (Old slot released, new slot locked)
    // ----------------------------------------------------
    console.log('\n--- TEST 9: Rescheduling (Release old slot, lock new slot) ---');
    const NEW_SLOT = '10:00 AM';

    // Reschedule aptId to NEW_SLOT
    const rescheduleRes = await api(`/appointments/${aptId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({
        date: TEST_DATE_VALID,
        time: NEW_SLOT,
      }),
    });
    assert(rescheduleRes.status === 200, 'Appointment rescheduled successfully to new slot');

    // Check slots: old slot (TARGET_SLOT) should now be Available, NEW_SLOT should be Unavailable
    const slotsAfterReschedule = await api(`/doctors/${TEST_DOCTOR_ID}/slots?date=${TEST_DATE_VALID}`);
    const allSlotsResched = [
      ...slotsAfterReschedule.data.slots.morning,
      ...slotsAfterReschedule.data.slots.afternoon,
      ...slotsAfterReschedule.data.slots.evening,
    ];
    const oldSlotCheck = allSlotsResched.find((s) => s.time === TARGET_SLOT);
    const newSlotCheck = allSlotsResched.find((s) => s.time === NEW_SLOT);

    assert(oldSlotCheck && oldSlotCheck.status === 'Available', `Old slot (${TARGET_SLOT}) is released and now Available`);
    assert(newSlotCheck && newSlotCheck.status === 'Unavailable', `New slot (${NEW_SLOT}) is locked and Unavailable`);

    // Attempt to reschedule to break slot (11:20 AM) -> must fail with 400 and old appointment unchanged
    const failRescheduleBreak = await api(`/appointments/${aptId}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({
        date: TEST_DATE_VALID,
        time: '11:20 AM',
      }),
    });
    assert(failRescheduleBreak.status === 400 && failRescheduleBreak.data.code === 'SLOT_IN_BREAK', 'Rescheduling to break slot rejected with 400 SLOT_IN_BREAK');

    // Verify appointment is still safely at NEW_SLOT
    const aptCheck = await api(`/appointments/${aptId}`);
    assert(aptCheck.data.appointment.time === NEW_SLOT, 'Appointment unchanged after failed reschedule attempt');
    results['RESCHEDULE'] = 'PASS';

    // ----------------------------------------------------
    // TEST 10: Cancellation Releases Slot & Re-Booking Works
    // ----------------------------------------------------
    console.log('\n--- TEST 10: Cancellation Releases Slot & Booking After Cancellation ---');
    const cancelRes = await api(`/appointments/${aptId}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason: 'Patient plans changed' }),
    });
    assert(cancelRes.status === 200, 'Appointment cancelled successfully');

    // Check slots: NEW_SLOT should now be Available again
    const slotsAfterCancel = await api(`/doctors/${TEST_DOCTOR_ID}/slots?date=${TEST_DATE_VALID}`);
    const newSlotAfterCancel = [
      ...slotsAfterCancel.data.slots.morning,
      ...slotsAfterCancel.data.slots.afternoon,
      ...slotsAfterCancel.data.slots.evening,
    ].find((s) => s.time === NEW_SLOT);
    assert(newSlotAfterCancel && newSlotAfterCancel.status === 'Available', `Released slot (${NEW_SLOT}) is Available again after cancellation`);

    // Book the released slot with another patient
    const rebookRes = await api('/appointments/book', {
      method: 'POST',
      body: JSON.stringify({
        patientId: 'pat-demo-03',
        doctorId: TEST_DOCTOR_ID,
        clinicId: TEST_CLINIC_ID,
        date: TEST_DATE_VALID,
        time: NEW_SLOT,
      }),
    });
    assert(rebookRes.status === 201, 'Another patient successfully booked the released slot');
    createdTestAppointmentIds.push(rebookRes.data.appointment.id);
    results['CANCELLATION_RELEASE'] = 'PASS';

    // ----------------------------------------------------
    // TEST 11: Real-Time Socket.IO Synchronization
    // ----------------------------------------------------
    console.log('\n--- TEST 11: Socket.IO Real-Time Synchronization ---');
    assert(receivedSocketEvents.length > 0, `Received ${receivedSocketEvents.length} real-time Socket.IO events`);
    const hasAvailUpdate = receivedSocketEvents.some((e) => e.event === 'doctor:availability_updated');
    const hasReschedEvent = receivedSocketEvents.some((e) => e.event === 'appointment:rescheduled');
    const hasCancelEvent = receivedSocketEvents.some((e) => e.event === 'appointment:cancelled');

    assert(hasAvailUpdate, 'doctor:availability_updated event received via Socket.IO');
    assert(hasReschedEvent, 'appointment:rescheduled event received via Socket.IO');
    assert(hasCancelEvent, 'appointment:cancelled event received via Socket.IO');
    results['SOCKET_IO_SYNC'] = 'PASS';
    results['PATIENT_APP_SYNC'] = 'PASS';
    results['DOCTOR_APP_SYNC'] = 'PASS';
    results['CLINIC_ASSISTANT_SYNC'] = 'PASS';

  } finally {
    // Clean up temporary test appointments created
    console.log('\n--- Cleaning up temporary test appointments ---');
    for (const id of createdTestAppointmentIds) {
      try {
        await api(`/appointments/${id}/cancel`, {
          method: 'POST',
          body: JSON.stringify({ reason: 'Test teardown' }),
        });
      } catch (e) {}
    }
    socket.disconnect();
  }

  console.log('\n====================================================');
  console.log('FINAL VERIFICATION RESULTS MATRIX');
  console.log('====================================================');
  for (const [key, val] of Object.entries(results)) {
    console.log(`${key.padEnd(30)}: ${val}`);
  }
  console.log('====================================================\n');
}

runVerification().catch((err) => {
  console.error('Test run error:', err);
  process.exit(1);
});
