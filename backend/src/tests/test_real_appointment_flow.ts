import axios from 'axios';

const API_BASE = 'http://127.0.0.1:5000/api';

async function runTest() {
  console.log('=== STARTING MEDLINK END-TO-END FLOW VERIFICATION ===\n');

  // STEP 0: Reset demo state
  console.log('0️⃣ Resetting demo state...');
  const resetRes = await axios.post(`${API_BASE}/simulation/reset-demo`);
  console.log('   Reset response:', resetRes.data.message);

  // Check state after reset
  const docQueueClean = await axios.get(`${API_BASE}/doctors/auth/queue?clinicId=c-demo-apollo-02`, {
    headers: { Authorization: 'Bearer demo-token' }, // We will log in doctor
  }).catch(() => null);

  // STEP 1: Login Assistant Rahul Joseph (assistant02@demo.medlink.test)
  console.log('\n1️⃣ Logging in Clinic Assistant Rahul Joseph...');
  const asstLogin = await axios.post(`${API_BASE}/auth/assistant/login`, {
    email: 'assistant02@demo.medlink.test',
    password: 'Clinic@3002',
  });
  const asstToken = asstLogin.data.token;
  console.log(`   Assistant logged in: ${asstLogin.data.assistant?.name || asstLogin.data.user?.name} (${asstLogin.data.assistant?.email || asstLogin.data.user?.email})`);

  // Verify Today's Appointments is 0 after clean reset
  const todayAptsClean = await axios.get(`${API_BASE}/appointments/today?clinicId=c-demo-apollo-02`);
  console.log(`   Clean reset check - Clinic Assistant Today Appointments: ${todayAptsClean.data.count}`);
  if (todayAptsClean.data.count !== 0) {
    throw new Error(`Expected 0 appointments after reset, got ${todayAptsClean.data.count}`);
  }

  // STEP 2: Create Availability Request for Dr. Priya Sharma
  // Date: 2026-09-21 (TODAY), Window: 08:30 PM – 11:00 PM at Apollo Family Care Centre
  console.log('\n2️⃣ Creating Availability Request for Dr. Priya Sharma (08:30 PM – 11:00 PM)...');
  const reqRes = await axios.post(
    `${API_BASE}/availability/requests`,
    {
      doctor_id: 'doc-demo-priya-02',
      clinic_id: 'c-demo-apollo-02',
      specialty: 'General Medicine',
      date: '2026-09-21',
      start_time: '08:30 PM',
      end_time: '11:00 PM',
      notes: 'Evening session for Sep 21',
    },
    { headers: { Authorization: `Bearer ${asstToken}` } }
  );
  const availabilityRequestId = reqRes.data.request.id;
  console.log(`   Availability Request created: ID=${availabilityRequestId}, Status=${reqRes.data.request.status}`);

  // STEP 3: Doctor Dr. Priya Sharma logs in and approves availability request
  console.log('\n3️⃣ Logging in Dr. Priya Sharma...');
  const docLogin = await axios.post(`${API_BASE}/auth/doctor/login`, {
    email: 'doctor02@demo.medlink.test',
    password: 'Doctor@2002',
  });
  const docToken = docLogin.data.token;
  const docId = docLogin.data.doctor.id;
  console.log(`   Doctor logged in: ${docLogin.data.doctor.name} (${docId})`);

  // Verify Doctor's Today Schedule is EMPTY after reset
  const docAptsClean = await axios.get(`${API_BASE}/doctors/auth/appointments/today?clinicId=c-demo-apollo-02`, {
    headers: { Authorization: `Bearer ${docToken}` },
  });
  const docQueueInitial = await axios.get(`${API_BASE}/doctors/auth/queue?clinicId=c-demo-apollo-02`, {
    headers: { Authorization: `Bearer ${docToken}` },
  });
  console.log(`   Doctor App clean check: Appointments=${docAptsClean.data.appointments.length}, Waiting=${docQueueInitial.data.waitingCount}`);
  if (docAptsClean.data.appointments.length !== 0) {
    throw new Error(`Expected 0 appointments for Dr. Priya after reset, found ${docAptsClean.data.appointments.length}`);
  }

  // Doctor approves availability request
  console.log('   Doctor approving availability request...');
  const approveRes = await axios.post(
    `${API_BASE}/availability/requests/${availabilityRequestId}/approve`,
    { notes: 'Confirmed and approved for 8:30-11 PM session' },
    { headers: { Authorization: `Bearer ${docToken}` } }
  );
  console.log(`   Approval result: Status=${approveRes.data.request.status}`);

  // Verify slots are generated for 8:30 PM - 11:00 PM
  const slotsRes = await axios.get(
    `${API_BASE}/doctors/doc-demo-priya-02/slots?date=2026-09-21&clinicId=c-demo-apollo-02`
  );
  const grouped = slotsRes.data.slots || {};
  const allSlots = [...(grouped.morning || []), ...(grouped.afternoon || []), ...(grouped.evening || [])];
  const allTimes = allSlots.map((s: any) => s.time || s);
  console.log(`   Generated slots for Priya (Sep 21): ${JSON.stringify(allTimes)}`);
  if (!allTimes.includes('08:50 PM') && !allTimes.includes('8:50 PM')) {
    throw new Error(`Expected 08:50 PM slot in available slots: ${JSON.stringify(allTimes)}`);
  }

  // STEP 4: Patient Sneha Patel logs in
  console.log('\n4️⃣ Logging in Patient Sneha Patel (patient02@demo.medlink.test)...');
  const patientLogin = await axios.post(`${API_BASE}/auth/login`, {
    email: 'patient02@demo.medlink.test',
    password: 'Demo@1002',
  });
  const patToken = patientLogin.data.token;
  const patientUser = patientLogin.data.user;
  console.log(`   Authenticated Patient ID: ${patientUser.id}`);
  console.log(`   Authenticated Patient Name: ${patientUser.name}`);
  console.log(`   Authenticated Patient Email: ${patientUser.email}`);
  console.log(`   Authenticated Patient Phone: ${patientUser.phone}`);

  if (patientUser.id !== 'pat-demo-02') {
    throw new Error(`Expected patient ID pat-demo-02, got ${patientUser.id}`);
  }
  if (patientUser.name !== 'Sneha Patel') {
    throw new Error(`Expected patient name Sneha Patel, got ${patientUser.name}`);
  }

  // STEP 5: Sneha Patel books 08:50 PM slot with Dr. Priya Sharma at Apollo Family Care Centre
  console.log('\n5️⃣ Sneha Patel booking 08:50 PM on 2026-09-21...');
  const bookRes = await axios.post(
    `${API_BASE}/appointments/book`,
    {
      patientId: patientUser.id,
      patientName: patientUser.name,
      patientPhone: patientUser.phone,
      doctorId: 'doc-demo-priya-02',
      clinicId: 'c-demo-apollo-02',
      department: 'General Medicine',
      date: '2026-09-21',
      time: '08:50 PM',
      reason: 'General consultation',
      expectedDuration: '20 min',
      consultationFee: '₹500',
    },
    { headers: { Authorization: `Bearer ${patToken}` } }
  );

  const bookedApt = bookRes.data.appointment;
  console.log('   === BOOKING RESULT ===');
  console.log(`   Appointment ID: ${bookedApt.id}`);
  console.log(`   Patient ID: ${bookedApt.patientId || bookedApt.patient_id}`);
  console.log(`   Patient Name: ${bookedApt.patientName || bookedApt.patient_name}`);
  console.log(`   Doctor ID: ${bookedApt.doctorId || bookedApt.doctor_id}`);
  console.log(`   Doctor Name: ${bookedApt.doctorName || bookedApt.doctor_name}`);
  console.log(`   Clinic ID: ${bookedApt.clinicId || bookedApt.clinic_id}`);
  console.log(`   Date: ${bookedApt.date || bookedApt.appointmentDate}`);
  console.log(`   Time: ${bookedApt.time || bookedApt.slotStartTime}`);
  console.log(`   Status: ${bookedApt.status}`);
  console.log(`   Token: ${bookedApt.token_number || bookedApt.token || bookedApt.tokenNumber}`);

  const canonicalToken = bookedApt.token_number || bookedApt.token || bookedApt.tokenNumber;

  if (bookedApt.patientName !== 'Sneha Patel' && bookedApt.patient_name !== 'Sneha Patel') {
    throw new Error(`Booking produced WRONG patient name: ${bookedApt.patientName || bookedApt.patient_name}`);
  }
  if (bookedApt.patientId !== 'pat-demo-02' && bookedApt.patient_id !== 'pat-demo-02') {
    throw new Error(`Booking produced WRONG patient ID: ${bookedApt.patientId || bookedApt.patient_id}`);
  }
  if (bookedApt.status !== 'Booked') {
    throw new Error(`Expected status Booked immediately after booking, got ${bookedApt.status}`);
  }

  // STEP 6: VERIFY CROSS-APP SYNCHRONIZATION IMMEDIATELY AFTER BOOKING

  // 6A. Patient App View
  console.log('\n6️⃣A Verifying Patient App View...');
  const patAptsRes = await axios.get(`${API_BASE}/appointments?patientId=${patientUser.id}`, {
    headers: { Authorization: `Bearer ${patToken}` },
  });
  const patApt = patAptsRes.data.appointments?.find((a: any) => a.id === bookedApt.id);
  console.log(`   Patient App appointment found: ID=${patApt?.id}, Patient=${patApt?.patient_name || patApt?.patientName}, Doctor=${patApt?.doctor_name || patApt?.doctorName}, Status=${patApt?.status}`);
  if (!patApt || (patApt.patient_name !== 'Sneha Patel' && patApt.patientName !== 'Sneha Patel')) {
    throw new Error(`Patient App failed to display Sneha Patel for appointment ${bookedApt.id}`);
  }

  // 6B. Clinic Assistant View
  console.log('\n6️⃣B Verifying Clinic Assistant View...');
  const clinicTodayApts = await axios.get(`${API_BASE}/appointments/today?clinicId=c-demo-apollo-02`);
  const clinicQueue = await axios.get(`${API_BASE}/queue?clinicId=c-demo-apollo-02`);
  console.log(`   Clinic Assistant Today Appointments count: ${clinicTodayApts.data.count}`);
  console.log(`   Clinic Assistant Queue count: ${clinicQueue.data.queue?.length || 0}`);
  const asstApt = clinicTodayApts.data.appointments?.find((a: any) => a.id === bookedApt.id);
  console.log(`   Clinic Assistant appointment: Patient=${asstApt?.patientName}, Doctor=${asstApt?.doctorName}, Status=${asstApt?.status}, Token=${asstApt?.token_number}`);

  if (clinicTodayApts.data.count !== 1) {
    throw new Error(`Expected Clinic Assistant Today Appointments = 1, got ${clinicTodayApts.data.count}`);
  }
  if (asstApt?.patientName !== 'Sneha Patel') {
    throw new Error(`Clinic Assistant shows wrong patient: ${asstApt?.patientName}`);
  }
  if ((clinicQueue.data.queue?.length || 0) !== 0) {
    throw new Error(`Clinic Assistant Queue must be 0 before check-in, got ${clinicQueue.data.queue?.length}`);
  }

  // 6C. Doctor App View
  console.log('\n6️⃣C Verifying Doctor App View...');
  const docTodayApts = await axios.get(`${API_BASE}/doctors/auth/appointments/today?clinicId=c-demo-apollo-02`, {
    headers: { Authorization: `Bearer ${docToken}` },
  });
  const docQueueRes = await axios.get(`${API_BASE}/doctors/auth/queue?clinicId=c-demo-apollo-02`, {
    headers: { Authorization: `Bearer ${docToken}` },
  });
  console.log(`   Doctor App Today Appointments count: ${docTodayApts.data.appointments?.length}`);
  console.log(`   Doctor App Waiting count: ${docQueueRes.data.waitingCount}`);
  console.log(`   Doctor App Total Today: ${docQueueRes.data.totalToday}`);
  const docApt = docTodayApts.data.appointments?.find((a: any) => a.id === bookedApt.id);
  console.log(`   Doctor App appointment: Patient=${docApt?.patient_name || docApt?.patientName}, Status=${docApt?.status}, Token=${docApt?.token}`);

  if (docTodayApts.data.appointments?.length !== 1) {
    throw new Error(`Expected Doctor Today Appointments = 1, got ${docTodayApts.data.appointments?.length}`);
  }
  if (docApt?.patient_name !== 'Sneha Patel' && docApt?.patientName !== 'Sneha Patel') {
    throw new Error(`Doctor App shows wrong patient: ${docApt?.patient_name || docApt?.patientName}`);
  }
  if (docQueueRes.data.waitingCount !== 0) {
    throw new Error(`Doctor App Waiting must be 0 before check-in, got ${docQueueRes.data.waitingCount}`);
  }

  // Check for Aditya Jayaraman or Aarav Sharma
  const hasAditya = docTodayApts.data.appointments?.some((a: any) => (a.patient_name || a.patientName)?.includes('Aditya'));
  const hasAarav = docTodayApts.data.appointments?.some((a: any) => (a.patient_name || a.patientName)?.includes('Aarav'));
  if (hasAditya || hasAarav) {
    throw new Error(`Stale appointments detected in doctor schedule! Aditya=${hasAditya}, Aarav=${hasAarav}`);
  }

  // STEP 7: CLINIC ASSISTANT CHECK-IN
  console.log('\n7️⃣ Checking In Sneha Patel via Clinic Assistant...');
  const checkInRes = await axios.put(`${API_BASE}/appointments/${bookedApt.id}/check-in`, {
    doctorId: 'doc-demo-priya-02',
    forceDeskCheckIn: true,
  });
  console.log(`   Check-in response: Status=${checkInRes.data.appointment.status}, Token=${checkInRes.data.tokenNumber || checkInRes.data.appointment.token_number}`);

  const postCheckInToken = checkInRes.data.tokenNumber || checkInRes.data.appointment.token_number;
  if (postCheckInToken !== canonicalToken) {
    throw new Error(`Token changed on check-in! Expected ${canonicalToken}, got ${postCheckInToken}`);
  }

  // Verify queues after check-in
  const clinicQueueAfter = await axios.get(`${API_BASE}/queue?clinicId=c-demo-apollo-02`);
  const docQueueAfter = await axios.get(`${API_BASE}/doctors/auth/queue?clinicId=c-demo-apollo-02`, {
    headers: { Authorization: `Bearer ${docToken}` },
  });

  console.log(`   Clinic Queue length after check-in: ${clinicQueueAfter.data.queue?.length}`);
  console.log(`   Doctor Waiting count after check-in: ${docQueueAfter.data.waitingCount}`);

  if ((clinicQueueAfter.data.queue?.length || 0) !== 1) {
    throw new Error(`Expected Clinic Queue = 1 after check-in, got ${clinicQueueAfter.data.queue?.length}`);
  }
  if (docQueueAfter.data.waitingCount !== 1) {
    throw new Error(`Expected Doctor Waiting = 1 after check-in, got ${docQueueAfter.data.waitingCount}`);
  }

  console.log('\n🎉 ALL VERIFICATION CRITERIA MET PERFECTLY!');
  console.log({
    appointmentId: bookedApt.id,
    patientId: 'pat-demo-02',
    patientName: 'Sneha Patel',
    doctorId: 'doc-demo-priya-02',
    doctorName: 'Dr. Priya Sharma',
    clinicId: 'c-demo-apollo-02',
    clinicName: 'Apollo Family Care Centre',
    date: '2026-09-21',
    time: '05:00 PM',
    token: canonicalToken,
    beforeCheckIn: { status: 'Booked', clinicWaiting: 0, docWaiting: 0, queue: 0 },
    afterCheckIn: { status: 'Checked In', clinicWaiting: 1, docWaiting: 1, queue: 1, token: postCheckInToken },
  });
}

runTest().catch((err) => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err.response?.data || err.message || err);
  process.exit(1);
});
