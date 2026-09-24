const http = require('http');

function request(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, text: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting Demo Identity, Queue Token & Deduplication Regression Suite...\n');

  // Step 0: Reset demo state
  console.log('--- Step 0: Reset Demo State ---');
  const resetRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/simulation/reset-demo',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (resetRes.status !== 200 || !resetRes.data.success) {
    throw new Error(`Reset failed: ${JSON.stringify(resetRes.data)}`);
  }
  console.log('✅ Demo state reset successfully.\n');

  // Step 1: Verify Demo Patient Authentication & Identity Scoping
  console.log('--- Step 1: Patient Identity & Scoping Audit ---');
  const patientsToTest = [
    { email: 'patient01@demo.medlink.test', expectedName: 'Aarav Sharma', expectedId: 'pat-demo-01' },
    { email: 'patient02@demo.medlink.test', expectedName: 'Sneha Patel', expectedId: 'pat-demo-02' },
    { email: 'patient03@demo.medlink.test', expectedName: 'Rajesh Kumar', expectedId: 'pat-demo-03' },
  ];

  const patientTokens = {};

  for (const p of patientsToTest) {
    const loginRes = await request(
      {
        hostname: 'localhost',
        port: 5000,
        path: '/api/auth/login',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      { email: p.email, password: 'password123' }
    );

    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error(`Login failed for ${p.email}: ${JSON.stringify(loginRes.data)}`);
    }

    const token = loginRes.data.token;
    const user = loginRes.data.user;
    patientTokens[p.expectedId] = token;

    if (user.name !== p.expectedName || user.id !== p.expectedId) {
      throw new Error(`Identity mismatch for ${p.email}: got id=${user.id}, name="${user.name}", expected id=${p.expectedId}, name="${p.expectedName}"`);
    }
    console.log(`✅ ${p.expectedName} authenticated cleanly: id=${user.id}`);

    // Fetch appointments scoped to this patient
    const aptRes = await request({
      hostname: 'localhost',
      port: 5000,
      path: `/api/appointments?patientId=${p.expectedId}`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (aptRes.status !== 200) {
      throw new Error(`Failed to fetch appointments for ${p.expectedName}: ${aptRes.status}`);
    }

    const apts = aptRes.data.appointments || aptRes.data || [];
    // Verify none of the appointments belong to other patients
    for (const a of apts) {
      const aptPatientId = a.patient_id || a.patientId;
      if (aptPatientId && aptPatientId !== p.expectedId) {
        throw new Error(`LEAK DETECTED: ${p.expectedName} received appointment belonging to ${aptPatientId}!`);
      }
    }
    console.log(`✅ ${p.expectedName} has ${apts.length} appointments, all strictly scoped to ${p.expectedId}.`);
  }

  // Step 2: Test Booking Idempotency
  console.log('\n--- Step 2: Booking Idempotency & Deduplication ---');
  const clockRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/simulation/demo-clock',
    method: 'GET',
  });
  const todayDate = clockRes.data.currentDateString;
  console.log(`Current clinic date: ${todayDate}`);

  const aaravToken = patientTokens['pat-demo-01'];
  const bookingPayload = {
    patientId: 'pat-demo-01',
    patientName: 'Aarav Sharma',
    doctorId: 'doc-demo-arun-01',
    doctorName: 'Dr. Arun Kumar',
    clinicId: 'c-demo-moon-01',
    clinicName: 'Moon Dental Clinic',
    date: todayDate,
    time: '11:00 AM',
    type: 'In-person',
    notes: 'Routine dental checkup idempotency test',
  };

  // First booking
  const bookRes1 = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/appointments/book',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aaravToken}`,
      },
    },
    bookingPayload
  );

  if (bookRes1.status !== 200 && bookRes1.status !== 201) {
    throw new Error(`Initial booking failed: ${JSON.stringify(bookRes1.data)}`);
  }
  const apt1 = bookRes1.data.appointment;
  console.log(`✅ Booking 1 succeeded: aptId=${apt1.id}, token=${apt1.token_number || apt1.token}`);

  // Duplicate booking attempt (same patient, doctor, clinic, date, time)
  const bookRes2 = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/appointments/book',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${aaravToken}`,
      },
    },
    bookingPayload
  );

  if (bookRes2.status !== 200 && bookRes2.status !== 201) {
    throw new Error(`Duplicate booking call crashed: ${JSON.stringify(bookRes2.data)}`);
  }
  const apt2 = bookRes2.data.appointment;
  if (apt2.id !== apt1.id) {
    throw new Error(`Duplicate booking created duplicate appointment! ID 1=${apt1.id}, ID 2=${apt2.id}`);
  }
  console.log(`✅ Booking idempotency verified: returned existing appointment ${apt2.id} without creating duplicate.`);

  // Verify appointments list for Aarav has exactly 1 appointment with this ID
  const verifyAptsRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: `/api/appointments?patientId=pat-demo-01`,
    method: 'GET',
    headers: { 'Authorization': `Bearer ${aaravToken}` },
  });
  const aaravApts = verifyAptsRes.data.appointments || verifyAptsRes.data || [];
  const matches = aaravApts.filter((a) => a.id === apt1.id);
  if (matches.length !== 1) {
    throw new Error(`Expected exactly 1 appointment in list for id=${apt1.id}, found ${matches.length}`);
  }
  console.log(`✅ Aarav appointments list verified clean: exactly 1 entry for ${apt1.id}`);

  // Step 3: Check-in, Queue Token Contract & Queue Uniqueness
  console.log('\n--- Step 3: Check-in, Canonical Queue Token & Queue State ---');
  // Check-in Aarav's appointment
  const checkinRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: `/api/appointments/${apt1.id}/check-in`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { doctorId: 'doc-demo-arun-01', forceDeskCheckIn: true }
  );

  if (checkinRes.status !== 200) {
    throw new Error(`Check-in failed: ${JSON.stringify(checkinRes.data)}`);
  }
  console.log(`✅ Appointment ${apt1.id} checked in successfully.`);

  // Doctor login
  const docLogin = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/doctor/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    },
    { emailOrPhone: 'doctor01@demo.medlink.test', password: 'password123' }
  );
  if (docLogin.status !== 200 || !docLogin.data.token) {
    throw new Error(`Doctor login failed: ${JSON.stringify(docLogin.data)}`);
  }
  const docToken = docLogin.data.token;

  // Doctor live queue
  const queueRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/doctors/auth/queue?clinicId=c-demo-moon-01',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${docToken}` },
  });
  if (queueRes.status !== 200) {
    throw new Error(`Failed to fetch doctor queue: ${queueRes.status}`);
  }

  const queueItems = queueRes.data.queue || [];
  console.log(`✅ Doctor live queue fetched: ${queueItems.length} items.`);

  const tokenRegex = /^[A-Z0-9-]+$/;
  for (const item of queueItems) {
    // Check canonical contract
    if (!item.token || !tokenRegex.test(item.token) || item.token.includes('undefined')) {
      throw new Error(`INVALID QUEUE TOKEN: "${item.token}" in item ${JSON.stringify(item)}`);
    }
    if (!item.patientId || !item.doctorId || !item.clinicId) {
      throw new Error(`MISSING REQUIRED QUEUE FIELD in item: ${JSON.stringify(item)}`);
    }
  }
  console.log(`✅ All ${queueItems.length} queue items have valid, non-undefined canonical tokens and complete contracts.`);

  // Verify our checked-in appointment is in the queue exactly once
  const queuedMatches = queueItems.filter((q) => q.appointmentId === apt1.id);
  if (queuedMatches.length !== 1) {
    throw new Error(`Expected exactly 1 queue entry for ${apt1.id}, found ${queuedMatches.length}`);
  }
  console.log(`✅ Checked-in appointment is present in queue exactly once with token ${queuedMatches[0].token}.`);

  // Step 4: Consultation Lifecycle & Queue Removal
  console.log('\n--- Step 4: Consultation Lifecycle & Active Queue Removal ---');
  // Start consultation
  const startRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/simulation/start-consultation',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${docToken}`,
      },
    },
    { appointmentId: apt1.id }
  );
  if (startRes.status !== 200) {
    throw new Error(`Start consultation failed: ${JSON.stringify(startRes.data)}`);
  }
  console.log(`✅ Consultation started for ${apt1.id}.`);

  // Complete consultation
  const completeRes = await request(
    {
      hostname: 'localhost',
      port: 5000,
      path: '/api/doctors/auth/consultations',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${docToken}`,
      },
    },
    {
      appointmentId: apt1.id,
      patientId: 'pat-demo-01',
      doctorId: 'doc-demo-arun-01',
      clinicId: 'c-demo-moon-01',
      diagnosis: 'Routine dental checkup complete - healthy teeth',
      prescription: 'Fluoride toothpaste twice daily',
      notes: 'No cavities found',
    }
  );
  if (completeRes.status !== 200 && completeRes.status !== 201) {
    throw new Error(`Complete consultation failed: ${JSON.stringify(completeRes.data)}`);
  }
  console.log(`✅ Consultation completed for ${apt1.id}.`);

  // Verify live queue no longer has this completed appointment
  const queueAfterRes = await request({
    hostname: 'localhost',
    port: 5000,
    path: '/api/doctors/auth/queue?clinicId=c-demo-moon-01',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${docToken}` },
  });
  const queueAfterItems = queueAfterRes.data.queue || [];
  const stillInQueue = queueAfterItems.filter((q) => q.appointmentId === apt1.id);
  if (stillInQueue.length > 0) {
    throw new Error(`COMPLETED APPOINTMENT STILL IN ACTIVE QUEUE! Found ${stillInQueue.length} entries.`);
  }
  if (queueAfterRes.data.currentPatient && queueAfterRes.data.currentPatient.appointmentId === apt1.id) {
    throw new Error(`COMPLETED APPOINTMENT STILL LISTED AS CURRENT PATIENT!`);
  }
  console.log(`✅ Active queue correctly cleared completed appointment ${apt1.id} (remaining active: ${queueAfterItems.length}).`);

  console.log('\n🎉 ALL REGRESSION TESTS PASSED CLEANLY!\n');
}

runTests().catch((err) => {
  console.error('\n❌ REGRESSION TEST FAILED:', err);
  process.exit(1);
});
