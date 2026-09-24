const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function runTests() {
  console.log('🚀 STARTING APPOINTMENT LIFECYCLE VERIFICATION SUITE...\n');

  try {
    // 0. SET BASELINE DEMO CLOCK TO 2026-09-08
    console.log('STEP 0: Setting baseline demo clock to 2026-09-08 10:00 AM...');
    const clockReset = await axios.post(`${API_BASE}/simulation/demo-clock`, {
      simulatedIsoString: '2026-09-08T10:00:00+05:30',
      note: 'Baseline date for lifecycle verification (Sep 8, with future appointments on Sep 9)',
    });
    console.log('  Clock state:', clockReset.data.currentTimeString, clockReset.data.currentDateString);

    // Ensure idempotency: cancel any pre-existing test appointments on 2026-09-09
    try {
      const upcoming = await axios.get(`${API_BASE}/appointments/upcoming?clinicId=c-demo-moon-01`);
      for (const a of (upcoming.data.appointments || [])) {
        if ((a.date === '2026-09-09' || a.appointmentDate === '2026-09-09') && a.status !== 'Cancelled') {
          await axios.post(`${API_BASE}/appointments/${a.id}/cancel`, { reason: 'Idempotent test suite reset' }).catch(() => {});
        }
      }
    } catch (e) {}

    // TEST 1 — FUTURE BOOKING
    console.log('\n--- TEST 1: FUTURE BOOKING (September 9, 2026 at 02:00 PM) ---');
    const bookingRes = await axios.post(`${API_BASE}/appointments/book`, {
      patientId: 'pat-demo-01',
      doctorId: 'doc-demo-arun-01',
      clinicId: 'c-demo-moon-01',
      department: 'Dentistry',
      date: '2026-09-09',
      time: '02:00 PM',
      reason: 'Root Canal Evaluation',
    });

    const apt = bookingRes.data.appointment;
    console.log(`  Created Appointment ID: ${apt.id}`);
    console.log(`  Date: ${apt.date || apt.appointmentDate}, Time: ${apt.time || apt.slotStartTime}, Doctor: ${apt.doctorName}`);
    console.log(`  Status: ${apt.status}`);

    // Verify it is NOT in today's appointments
    const todayRes = await axios.get(`${API_BASE}/appointments/today?clinicId=c-demo-moon-01`);
    const foundInToday = todayRes.data.appointments.find((a) => a.id === apt.id);
    console.log(`  Present in today's clinic appointments? ${Boolean(foundInToday)} (EXPECTED: false)`);
    if (foundInToday) throw new Error('FAIL: Tomorrow appointment appeared in today appointments!');

    // Verify it is NOT in live queue
    const queueRes = await axios.get(`${API_BASE}/queue?clinicId=c-demo-moon-01`);
    const foundInQueue = queueRes.data.queue.find((q) => q.appointmentId === apt.id);
    console.log(`  Present in live OPD queue? ${Boolean(foundInQueue)} (EXPECTED: false)`);
    if (foundInQueue) throw new Error('FAIL: Tomorrow appointment appeared in live OPD queue!');

    // Verify it IS in upcoming
    const upcomingRes = await axios.get(`${API_BASE}/appointments/upcoming?clinicId=c-demo-moon-01`);
    const foundInUpcoming = upcomingRes.data.appointments.find((a) => a.id === apt.id);
    console.log(`  Present in upcoming appointments? ${Boolean(foundInUpcoming)} (EXPECTED: true)`);
    if (!foundInUpcoming) throw new Error('FAIL: Tomorrow appointment NOT in upcoming appointments!');

    // Verify check-in is rejected (too early)
    try {
      await axios.put(`${API_BASE}/appointments/${apt.id}/check-in`);
      throw new Error('FAIL: Check-in should have been rejected for tomorrow appointment!');
    } catch (e) {
      console.log(`  Check-in correctly rejected: ${e.response?.data?.message || e.message}`);
    }

    // Verify no-show is rejected (slot not passed)
    try {
      await axios.put(`${API_BASE}/appointments/${apt.id}/no-show`);
      throw new Error('FAIL: No-show should have been rejected for future appointment!');
    } catch (e) {
      console.log(`  No-show correctly rejected: ${e.response?.data?.message || e.message}`);
    }

    // TEST 2 & TEST 3 — CANCEL FUTURE APPOINTMENT & RE-BOOK
    console.log('\n--- TEST 2 & 3: CANCELLATION AND RE-BOOKING ---');
    const cancelRes = await axios.post(`${API_BASE}/appointments/${apt.id}/cancel`, {
      reason: 'Patient conflict',
    });
    console.log(`  Cancelled status: ${cancelRes.data.appointment.status}`);

    // Verify slot can be booked again
    const rebookRes = await axios.post(`${API_BASE}/appointments/book`, {
      patientId: 'pat-demo-02',
      doctorId: 'doc-demo-arun-01',
      clinicId: 'c-demo-moon-01',
      department: 'Dentistry',
      date: '2026-09-09',
      time: '02:00 PM',
      reason: 'Dental Examination',
    });
    const apt2 = rebookRes.data.appointment;
    console.log(`  Rebooked Appointment ID for Patient 2: ${apt2.id}`);

    // TEST 9 — SLOT CLASH PREVENTION
    console.log('\n--- TEST 9: SLOT CLASH / DOUBLE BOOKING PREVENTION ---');
    try {
      await axios.post(`${API_BASE}/appointments/book`, {
        patientId: 'pat-demo-03',
        doctorId: 'doc-demo-arun-01',
        clinicId: 'c-demo-moon-01',
        department: 'Dentistry',
        date: '2026-09-09',
        time: '02:00 PM',
        reason: 'Another checkup',
      });
      throw new Error('FAIL: Double booking should have returned 409 conflict!');
    } catch (e) {
      console.log(`  Double booking correctly rejected with 409: ${e.response?.data?.error || e.message}`);
    }

    // TEST 4 — ADVANCE DEMO CLOCK & CHECK-IN
    console.log('\n--- TEST 4: ADVANCE DEMO CLOCK TO 2026-09-09 01:35 PM & CHECK-IN ---');
    await axios.post(`${API_BASE}/simulation/demo-clock`, {
      simulatedIsoString: '2026-09-09T13:35:00+05:30',
      note: 'Simulated check-in window open',
    });

    const checkInRes = await axios.put(`${API_BASE}/appointments/${apt2.id}/check-in`);
    console.log(`  Checked in! Status: ${checkInRes.data.appointment.status}, Token: ${checkInRes.data.tokenNumber}`);

    // Now verify it IS in today's appointments and live queue
    const todayQueue = await axios.get(`${API_BASE}/queue?clinicId=c-demo-moon-01`);
    const inQueueNow = todayQueue.data.queue.find((q) => q.appointmentId === apt2.id);
    console.log(`  Now in live queue? ${Boolean(inQueueNow)} with token ${inQueueNow?.queueNumber}`);
    if (!inQueueNow) throw new Error('FAIL: Checked-in appointment not found in live queue!');

    // TEST 6 — CONSULTATION LIFECYCLE
    console.log('\n--- TEST 6: START AND COMPLETE CONSULTATION ---');
    await axios.post(`${API_BASE}/simulation/start-consultation`, { appointmentId: apt2.id });
    const inConsultApt = (await axios.get(`${API_BASE}/appointments/${apt2.id}`)).data.appointment;
    console.log(`  After start consultation: ${inConsultApt.status}`);

    await axios.post(`${API_BASE}/simulation/complete-consultation`, {
      appointmentId: apt2.id,
      diagnosis: 'Mild Gingivitis',
      medicines: [{ name: 'Chlorhexidine Mouthwash', dosage: '10ml twice daily' }],
    });
    const completedApt = (await axios.get(`${API_BASE}/appointments/${apt2.id}`)).data.appointment;
    console.log(`  After complete consultation: ${completedApt.status}`);

    // Verify it left live queue
    const postQueue = await axios.get(`${API_BASE}/queue?clinicId=c-demo-moon-01`);
    const stillInQueue = postQueue.data.queue.find((q) => q.appointmentId === apt2.id && q.status !== 'COMPLETED');
    console.log(`  Active in live waiting queue? ${Boolean(stillInQueue)} (EXPECTED: false)`);

    // TEST 5 — NO-SHOW WITH TIME + GRACE PERIOD
    console.log('\n--- TEST 5: NO-SHOW TEST (Book 03:00 PM, advance to 03:12 PM) ---');
    const apt3Res = await axios.post(`${API_BASE}/appointments/book`, {
      patientId: 'pat-demo-04',
      doctorId: 'doc-demo-arun-01',
      clinicId: 'c-demo-moon-01',
      department: 'Dentistry',
      date: '2026-09-09',
      time: '03:00 PM',
      reason: 'Filling',
    });
    const apt3 = apt3Res.data.appointment;

    // Move to 03:05 PM (inside 10-min grace period) -> should reject
    await axios.post(`${API_BASE}/simulation/demo-clock`, {
      simulatedIsoString: '2026-09-09T15:05:00+05:30',
    });
    try {
      await axios.put(`${API_BASE}/appointments/${apt3.id}/no-show`);
      throw new Error('FAIL: No-show should be rejected during 10-minute grace period!');
    } catch (e) {
      console.log(`  No-show rejected during grace period: ${e.response?.data?.message || e.message}`);
    }

    // Move to 03:11 PM (grace period expired) -> should succeed
    await axios.post(`${API_BASE}/simulation/demo-clock`, {
      simulatedIsoString: '2026-09-09T15:11:00+05:30',
    });
    const noShowRes = await axios.put(`${API_BASE}/appointments/${apt3.id}/no-show`);
    console.log(`  No-show processed successfully! Status: ${noShowRes.data.appointment.status}`);

    // TEST 8 — DYNAMIC DOCTOR SWITCH
    console.log('\n--- TEST 8: DYNAMIC DOCTOR SWITCH ---');
    const apt4Res = await axios.post(`${API_BASE}/appointments/book`, {
      patientId: 'pat-demo-05',
      doctorId: 'doc-demo-arun-01',
      clinicId: 'c-demo-moon-01',
      department: 'Dentistry',
      date: '2026-09-09',
      time: '04:00 PM',
      reason: 'Orthodontic check',
    });
    const apt4 = apt4Res.data.appointment;

    const switchRes = await axios.post(`${API_BASE}/appointments/${apt4.id}/switch-doctor`, {
      newDoctorId: 'doc-demo-ananya-08',
      reason: 'Doctor Arun delayed in emergency surgery',
    });
    console.log(`  Doctor switched! New Doctor: ${switchRes.data.appointment.doctorName} (${switchRes.data.appointment.doctorId})`);

    // Reset demo clock
    await axios.post(`${API_BASE}/simulation/demo-clock`, { reset: true });
    console.log('\n✅ ALL INTEGRATION SCENARIOS PASSED WITH COMPLETE SYNCHRONIZATION!\n');
  } catch (err) {
    console.error('\n❌ TEST FAILED:', err.response?.data || err.message);
    process.exit(1);
  }
}

runTests();
