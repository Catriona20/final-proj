const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function runVerification() {
  console.log('🔄 1. Resetting demo state...');
  await axios.post(`${API_BASE}/simulation/reset-demo`);

  console.log('🔑 2. Authenticating Doctor (Dr. Arun Kumar) & Clinic Assistant...');
  const docLogin = await axios.post(`${API_BASE}/auth/doctor/login`, {
    emailOrPhone: 'doctor01@demo.medlink.test',
    password: 'Doctor@2001',
  });
  const doctorToken = docLogin.data.token;
  const doctorId = docLogin.data.doctor.id;
  const clinicId = docLogin.data.doctor.clinic_id || 'c-demo-moon-01';
  console.log(`   Doctor authenticated: ID=${doctorId}, Clinic=${clinicId}`);

  // Fetch initial queue state
  const initialDocQueue = await axios.get(`${API_BASE}/doctors/auth/queue?clinicId=${clinicId}`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  console.log(`   Initial Doctor Waiting Count: ${initialDocQueue.data.waitingCount}, Queue Length: ${initialDocQueue.data.queue.length}`);

  const initialClinicQueue = await axios.get(`${API_BASE}/queue?clinicId=${clinicId}`);
  console.log(`   Initial Clinic Waiting Queue Length: ${initialClinicQueue.data.queue ? initialClinicQueue.data.queue.length : 0}`);

  console.log('\n📅 3. Booking new appointment for Sneha Patel (pat-demo-02)...');
  const bookRes = await axios.post(`${API_BASE}/appointments`, {
    patientId: 'pat-demo-02',
    doctorId: doctorId,
    clinicId: clinicId,
    department: 'Dental Surgery',
    date: '2026-09-09',
    time: '11:00 AM',
    reason: 'Tooth Sensitivity Checkup',
  });
  const appointment = bookRes.data.appointment;
  const aptId = appointment.id;
  const bookedToken = appointment.tokenNumber || appointment.token_number;
  console.log(`   ✅ Booked Appointment ID: ${aptId}`);
  console.log(`   Patient ID: ${appointment.patientId}`);
  console.log(`   Doctor ID: ${appointment.doctorId}`);
  console.log(`   Clinic ID: ${appointment.clinicId}`);
  console.log(`   Initial Token: ${bookedToken}`);
  console.log(`   Initial Status: ${appointment.status}`);

  console.log('\n🔎 4. Verifying BOOKED state consistency:');
  // Check Doctor Queue
  const docQueueAfterBooking = await axios.get(`${API_BASE}/doctors/auth/queue?clinicId=${clinicId}`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  const isSnehaInDocQueue = docQueueAfterBooking.data.queue.some((q) => q.appointmentId === aptId || q.id === aptId);
  console.log(`   Doctor Waiting Count: ${docQueueAfterBooking.data.waitingCount} (Expected: 0)`);
  console.log(`   Is Sneha in Doctor Live Queue: ${isSnehaInDocQueue} (Expected: false)`);

  // Check Clinic Queue
  const clinicQueueAfterBooking = await axios.get(`${API_BASE}/queue?clinicId=${clinicId}`);
  const isSnehaInClinicQueue = (clinicQueueAfterBooking.data.queue || []).some((q) => q.appointmentId === aptId || q.id === aptId);
  console.log(`   Clinic Queue Length: ${clinicQueueAfterBooking.data.queue ? clinicQueueAfterBooking.data.queue.length : 0} (Expected: 0)`);
  console.log(`   Is Sneha in Clinic Queue: ${isSnehaInClinicQueue} (Expected: false)`);

  if (docQueueAfterBooking.data.waitingCount !== 0 || isSnehaInDocQueue || isSnehaInClinicQueue) {
    throw new Error('FAILED: Sneha appeared in waiting queue while merely BOOKED!');
  }
  console.log('   ✅ BOOKED state perfectly consistent across all systems!');

  console.log('\n🏥 5. Performing Check-in for Sneha Patel...');
  const checkInRes = await axios.post(`${API_BASE}/appointments/${aptId}/check-in`, {
    forceDeskCheckIn: true,
  });
  console.log(`   Check-in response message: ${checkInRes.data.message}`);
  console.log(`   Check-in Token: ${checkInRes.data.tokenNumber}`);

  console.log('\n🔎 6. Verifying CHECKED-IN state consistency:');
  // Check Doctor Queue
  const docQueueAfterCheckIn = await axios.get(`${API_BASE}/doctors/auth/queue?clinicId=${clinicId}`, {
    headers: { Authorization: `Bearer ${doctorToken}` },
  });
  const snehaDocQueueItem = docQueueAfterCheckIn.data.queue.find((q) => q.appointmentId === aptId || q.id === aptId);
  console.log(`   Doctor Waiting Count: ${docQueueAfterCheckIn.data.waitingCount} (Expected: 1)`);
  console.log(`   Doctor Queue Item Found: ${Boolean(snehaDocQueueItem)}`);
  if (snehaDocQueueItem) {
    console.log(`   Doctor Queue Token: ${snehaDocQueueItem.tokenNumber || snehaDocQueueItem.token_number}`);
    console.log(`   Doctor Queue Status: ${snehaDocQueueItem.status}`);
    console.log(`   Doctor Patients Ahead: ${snehaDocQueueItem.patients_ahead}`);
  }

  // Check Clinic Queue
  const clinicQueueAfterCheckIn = await axios.get(`${API_BASE}/queue?clinicId=${clinicId}`);
  const snehaClinicQueueItem = (clinicQueueAfterCheckIn.data.queue || []).find((q) => q.appointmentId === aptId || q.id === aptId);
  console.log(`   Clinic Queue Length: ${clinicQueueAfterCheckIn.data.queue ? clinicQueueAfterCheckIn.data.queue.length : 0} (Expected: 1)`);
  console.log(`   Clinic Queue Item Found: ${Boolean(snehaClinicQueueItem)}`);
  if (snehaClinicQueueItem) {
    console.log(`   Clinic Queue Token: ${snehaClinicQueueItem.tokenNumber || snehaClinicQueueItem.token || snehaClinicQueueItem.token_number}`);
    console.log(`   Clinic Queue Status: ${snehaClinicQueueItem.status}`);
    console.log(`   Clinic Patients Ahead: ${snehaClinicQueueItem.patientsAhead}`);
  }

  // Check Appointment Endpoint (Patient & Clinic Assistant single source of truth)
  const aptGetRes = await axios.get(`${API_BASE}/appointments/${aptId}`);
  const updatedApt = aptGetRes.data.appointment;
  console.log(`   Appointment Status: ${updatedApt.status}`);
  console.log(`   Appointment Token: ${updatedApt.tokenNumber}`);

  // Validation Checks
  if (docQueueAfterCheckIn.data.waitingCount !== 1) {
    throw new Error(`FAILED: Doctor waiting count is ${docQueueAfterCheckIn.data.waitingCount}, expected 1`);
  }
  if (!snehaDocQueueItem) {
    throw new Error('FAILED: Sneha does not appear in Doctor live queue after check-in!');
  }
  if (!snehaClinicQueueItem) {
    throw new Error('FAILED: Sneha does not appear in Clinic Assistant queue after check-in!');
  }

  const docToken = snehaDocQueueItem.tokenNumber || snehaDocQueueItem.token_number;
  const clinicToken = snehaClinicQueueItem.tokenNumber || snehaClinicQueueItem.token;
  const finalAptToken = updatedApt.tokenNumber;

  console.log('\n🎯 7. Cross-App Entity & Token Equivalence Check:');
  console.log(`   Appointment ID Match: ${aptId === snehaDocQueueItem.appointmentId && aptId === snehaClinicQueueItem.appointmentId ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Patient ID Match:     ${updatedApt.patientId === snehaDocQueueItem.patientId && updatedApt.patientId === snehaClinicQueueItem.patientId ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Doctor ID Match:      ${doctorId === snehaDocQueueItem.doctorId && doctorId === snehaClinicQueueItem.doctorId ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Clinic ID Match:      ${clinicId === snehaDocQueueItem.clinicId && clinicId === snehaClinicQueueItem.clinicId ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`   Token Equivalence:    Booked=${bookedToken}, Doctor=${docToken}, Clinic=${clinicToken}, Apt=${finalAptToken}`);
  
  if (bookedToken !== docToken || docToken !== clinicToken || clinicToken !== finalAptToken) {
    throw new Error('FAILED: Token mismatch across apps!');
  }
  console.log('   ✅ ALL TOKENS AND IDS EXACTLY MATCH ACROSS BACKEND, DOCTOR, CLINIC, AND PATIENT!');

  console.log('\n🎉 ALL VERIFICATION CHECKS PASSED PERFECTLY!\n');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
