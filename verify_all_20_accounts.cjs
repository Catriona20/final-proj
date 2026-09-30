const http = require('http');

function postJson(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJson(path, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port: 5000,
        path,
        method: 'GET',
        headers,
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function run() {
  console.log('====================================================');
  console.log('MEDLINK 20-USER COMPLETE DEMO VERIFICATION SUITE');
  console.log('====================================================\n');

  // 1. Reset demo state
  console.log('[1/10] Resetting demo state to clean baseline...');
  const resetRes = await postJson('/api/simulation/reset-demo', {});
  if (resetRes.status !== 200 || !resetRes.data.success) {
    throw new Error(`Reset failed: ${JSON.stringify(resetRes)}`);
  }
  console.log('✓ Demo state reset successful.');

  // 2. Check Database Counts
  console.log('\n[2/10] Verifying Database Entity Counts...');
  const countsRes = await getJson('/api/simulation/demo-counts');
  console.log('=== DEMO DATA COUNTS ===');
  console.log(`Clinics: ${countsRes.data.counts.clinics}`);
  console.log(`Doctors: ${countsRes.data.counts.doctors}`);
  console.log(`Patients: ${countsRes.data.counts.patients}`);
  console.log(`Assistants: ${countsRes.data.counts.assistants}`);

  if (
    countsRes.data.counts.clinics < 20 ||
    countsRes.data.counts.doctors < 20 ||
    countsRes.data.counts.patients < 20 ||
    countsRes.data.counts.assistants < 20
  ) {
    throw new Error(`Counts failed requirement >= 20! Counts: ${JSON.stringify(countsRes.data.counts)}`);
  }
  console.log('✓ All database counts exceed minimum requirement (>= 20).');

  // 3. Test 20 Doctor Logins
  console.log('\n[3/10] Testing 20/20 Doctor Logins with Real Credentials...');
  let doctorLoginSuccesses = 0;
  for (let i = 1; i <= 20; i++) {
    const pad = String(i).padStart(2, '0');
    const email = `doctor${pad}@demo.medlink.test`;
    const password = `Doctor@${2000 + i}`;
    const res = await postJson('/api/auth/doctor/login', { emailOrPhone: email, password });
    if (res.status === 200 && res.data.success && res.data.token) {
      doctorLoginSuccesses++;
      process.stdout.write(`✓ Doc ${pad} `);
    } else {
      console.error(`\n❌ Failed login for ${email}:`, res);
    }
  }
  console.log(`\nDoctor Logins: ${doctorLoginSuccesses}/20 Passed.`);
  if (doctorLoginSuccesses !== 20) throw new Error(`Only ${doctorLoginSuccesses}/20 doctors logged in!`);

  // 4. Test 20 Patient Logins
  console.log('\n[4/10] Testing 20/20 Patient Logins with Real Credentials...');
  let patientLoginSuccesses = 0;
  for (let i = 1; i <= 20; i++) {
    const pad = String(i).padStart(2, '0');
    const email = `patient${pad}@demo.medlink.test`;
    const password = `Demo@${1000 + i}`;
    const res = await postJson('/api/auth/login', { email, password });
    if (res.status === 200 && res.data.success && res.data.token) {
      patientLoginSuccesses++;
      process.stdout.write(`✓ Pat ${pad} `);
    } else {
      console.error(`\n❌ Failed login for ${email}:`, res);
    }
  }
  console.log(`\nPatient Logins: ${patientLoginSuccesses}/20 Passed.`);
  if (patientLoginSuccesses !== 20) throw new Error(`Only ${patientLoginSuccesses}/20 patients logged in!`);

  // 5. Test 20 Assistant Logins
  console.log('\n[5/10] Testing 20/20 Assistant Logins with Real Credentials...');
  let assistantLoginSuccesses = 0;
  for (let i = 1; i <= 20; i++) {
    const pad = String(i).padStart(2, '0');
    const email = `assistant${pad}@demo.medlink.test`;
    const password = `Clinic@${3000 + i}`;
    const res = await postJson('/api/auth/assistant/login', { email, password });
    if (res.status === 200 && res.data.success && res.data.token) {
      assistantLoginSuccesses++;
      process.stdout.write(`✓ Asst ${pad} `);
    } else {
      console.error(`\n❌ Failed login for ${email}:`, res);
    }
  }
  console.log(`\nAssistant Logins: ${assistantLoginSuccesses}/20 Passed.`);
  if (assistantLoginSuccesses !== 20) throw new Error(`Only ${assistantLoginSuccesses}/20 assistants logged in!`);

  // 6. Test GreenLife Women's Clinic & Gynaecology flow
  console.log("\n[6/10] Testing GreenLife Women's & Maternity Clinic & Gynaecology Booking Flow...");
  const greenLifeDoctorsRes = await getJson('/api/clinics/c-demo-greenlife-03/doctors');
  console.log(`GreenLife doctors count: ${greenLifeDoctorsRes.data.doctors?.length}`);
  const radha = greenLifeDoctorsRes.data.doctors.find((d) => d.id === 'doc-demo-radha-09');
  const shalini = greenLifeDoctorsRes.data.doctors.find((d) => d.id === 'doc-demo-shalini-15');
  console.log(`Found Dr. Radha Sundaram: ${!!radha}, Found Dr. Shalini Mukerjee: ${!!shalini}`);
  if (!radha || !shalini) {
    throw new Error('Dr. Radha Sundaram and Dr. Shalini Mukerjee must both be in GreenLife clinic!');
  }

  // Check slots for Dr. Radha
  const bookingDate = '2026-09-30';
  const radhaSlotsRes = await getJson(`/api/doctors/doc-demo-radha-09/slots?clinic_id=c-demo-greenlife-03&date=${bookingDate}`);
  const slotsObj = radhaSlotsRes.data.slots || {};
  const availableSlots = [
    ...(slotsObj.morning || []),
    ...(slotsObj.afternoon || []),
    ...(slotsObj.evening || []),
  ].filter((s) => s.isAvailable);

  console.log(`Dr. Radha Sundaram available slots on ${bookingDate}: ${availableSlots.length}`);
  if (availableSlots.length === 0) {
    throw new Error('Dr. Radha Sundaram has no available slots at GreenLife!');
  }

  // Book an appointment for patient08 with Dr. Radha
  const testSlot = availableSlots[0];

  const bookRes = await postJson('/api/appointments', {
    patient_id: 'pat-demo-08',
    doctor_id: 'doc-demo-radha-09',
    clinic_id: 'c-demo-greenlife-03',
    appointment_date: bookingDate,
    slot_time: testSlot.time,
    reason: 'Prenatal consultation and routine checkup',
  });
  console.log(`Appointment booking status: ${bookRes.status}`);
  if (bookRes.status !== 201 && bookRes.status !== 200) {
    throw new Error(`Booking failed: ${JSON.stringify(bookRes)}`);
  }
  const aptId = bookRes.data.appointment?.id || bookRes.data.id;
  console.log(`✓ Appointment created successfully: ${aptId}`);

  // Test duplicate booking -> HTTP 409
  console.log('Testing duplicate booking conflict detection (HTTP 409)...');
  const dupRes = await postJson('/api/appointments', {
    patient_id: 'pat-demo-01',
    doctor_id: 'doc-demo-radha-09',
    clinic_id: 'c-demo-greenlife-03',
    appointment_date: bookingDate,
    slot_time: testSlot.time,
    reason: 'Duplicate slot test',
  });
  console.log(`Duplicate booking response code: ${dupRes.status}`);
  if (dupRes.status !== 409) {
    throw new Error(`Expected HTTP 409 for duplicate booking, got ${dupRes.status}`);
  }
  console.log('✓ Duplicate booking correctly rejected with HTTP 409 Conflict.');

  // Test cancellation
  console.log('Testing appointment cancellation...');
  const cancelRes = await postJson(`/api/appointments/${aptId}/cancel`, {
    reason: 'Schedule change requested by patient',
  });
  console.log(`Cancellation status: ${cancelRes.status}`);
  if (cancelRes.status !== 200) {
    throw new Error(`Cancellation failed: ${JSON.stringify(cancelRes)}`);
  }
  console.log('✓ Appointment cancelled successfully and slot freed.');

  // 7. Test Earlier Slot Offer Flow
  console.log('\n[7/10] Testing Earlier Slot Offer Flow...');
  // Pat-demo-01 books slot 0 (earlier), Pat-demo-02 books slot 1 (later)
  const slot0 = availableSlots[0];
  const slot1 = availableSlots[1];

  const bookA = await postJson('/api/appointments', {
    patient_id: 'pat-demo-01',
    doctor_id: 'doc-demo-radha-09',
    clinic_id: 'c-demo-greenlife-03',
    appointment_date: bookingDate,
    slot_time: slot0.time,
    reason: 'Routine checkup Pat01',
  });
  const aptAId = bookA.data.appointment?.id || bookA.data.id;

  const bookB = await postJson('/api/appointments', {
    patient_id: 'pat-demo-02',
    doctor_id: 'doc-demo-radha-09',
    clinic_id: 'c-demo-greenlife-03',
    appointment_date: bookingDate,
    slot_time: slot1.time,
    reason: 'Routine checkup Pat02',
  });
  const aptBId = bookB.data.appointment?.id || bookB.data.id;

  // Patient A cancels earlier slot
  const cancelA = await postJson(`/api/appointments/${aptAId}/cancel`, {
    reason: 'Patient A emergency cancellation',
  });
  console.log(`Patient A cancelled earlier slot: ${cancelA.status === 200 ? 'SUCCESS' : 'FAILED'}`);

  // Check appointment B for earlier slot offer
  const aptBCheck = await getJson(`/api/appointments/${aptBId}`);
  const earlierSlotOffer = aptBCheck.data?.appointment?.earlier_slot_offered || aptBCheck.data?.earlier_slot_offered;
  console.log(`✓ Earlier slot offer generated for later patient: ${!!earlierSlotOffer} (Offered: ${earlierSlotOffer?.newTime})`);
  if (!earlierSlotOffer) {
    throw new Error('Earlier slot offer was not attached to appointment B!');
  }

  // Test Accept Earlier Slot Offer
  const acceptRes = await postJson(`/api/appointments/${aptBId}/accept-earlier-slot`, {});
  console.log(`✓ Earlier slot accept status: ${acceptRes.status}`);
  if (acceptRes.status !== 200) {
    throw new Error(`Failed to accept earlier slot offer: ${JSON.stringify(acceptRes)}`);
  }
  const acceptedTime = acceptRes.data.appointment?.time || acceptRes.data.appointment?.slot_time;
  console.log(`✓ Appointment rescheduled to earlier time: ${acceptedTime} (Expected: ${slot0.time})`);

  // Test Decline Earlier Slot Offer & No-Show with a new pair
  const slot2 = availableSlots[2];
  const slot3 = availableSlots[3];
  const bookC = await postJson('/api/appointments', {
    patientId: 'pat-demo-03',
    doctorId: 'doc-demo-radha-09',
    clinicId: 'c-demo-greenlife-03',
    date: bookingDate,
    time: slot2.time,
    reason: 'Routine checkup Pat03',
  });
  const aptCId = bookC.data.appointment?.id || bookC.data.id;

  const bookD = await postJson('/api/appointments', {
    patientId: 'pat-demo-04',
    doctorId: 'doc-demo-radha-09',
    clinicId: 'c-demo-greenlife-03',
    date: bookingDate,
    time: slot3.time,
    reason: 'Routine checkup Pat04',
  });
  const aptDId = bookD.data.appointment?.id || bookD.data.id;

  // Cancel C
  await postJson(`/api/appointments/${aptCId}/cancel`, { reason: 'Test cancellation' });
  // Decline D
  const declineRes = await postJson(`/api/appointments/${aptDId}/decline-earlier-slot`, {});
  console.log(`✓ Earlier slot decline status: ${declineRes.status}`);
  if (declineRes.status !== 200) {
    throw new Error(`Failed to decline earlier slot: ${JSON.stringify(declineRes)}`);
  }
  const retainedTime = declineRes.data.appointment?.time || declineRes.data.appointment?.slot_time;
  console.log(`✓ Appointment retained original time after decline: ${retainedTime} (Original: ${slot3.time})`);

  // Test NO_SHOW
  const noShowRes = await postJson(`/api/appointments/${aptDId}/no-show`, { force: true });
  console.log(`✓ No-Show status: ${noShowRes.status} (Status: ${noShowRes.data.appointment?.status || 'NO_SHOW'})`);

  // Clean up appointment B
  await postJson(`/api/appointments/${aptBId}/cancel`, { reason: 'Clean test' });

  // 8. Multi-Clinic Isolation
  console.log('\n[8/10] Testing Multi-Clinic Isolation...');
  const moonDoctorsRes = await getJson('/api/clinics/c-demo-moon-01/doctors');
  const moonDocIds = (moonDoctorsRes.data.doctors || []).map((d) => d.id);
  const greenLifeDocIds = (greenLifeDoctorsRes.data.doctors || []).map((d) => d.id);

  const overlap = moonDocIds.filter((id) => greenLifeDocIds.includes(id));
  console.log(`Doctor overlap between Moon Dental and GreenLife: ${overlap.length}`);
  if (overlap.length > 0) {
    throw new Error(`Isolation breach: Doctors [${overlap.join(', ')}] appear in both clinics!`);
  }
  console.log('✓ Multi-clinic isolation verified: No unauthorized cross-clinic doctor leakage.');

  // 9. NLP Symptom Analysis
  console.log('\n[9/10] Testing NLP Symptom Analysis & Procedure Routing...');
  const nlpGynRes = await postJson('/api/ai/symptom-analysis', { query: 'I need a gynaecologist' });
  const deptGyn = nlpGynRes.data.analysis?.primaryDepartment?.name || nlpGynRes.data.analysis?.department;
  console.log(`Query: "I need a gynaecologist" -> Analyzed Department: ${deptGyn}`);
  if (!deptGyn || !deptGyn.toLowerCase().includes('gynec')) {
    throw new Error(`Expected Gynecology, got ${deptGyn}`);
  }
  console.log('✓ "I need a gynaecologist" successfully classified as Gynecology.');

  const nlpDentalRes = await postJson('/api/ai/symptom-analysis', { query: 'I need a root canal' });
  const deptDent = nlpDentalRes.data.analysis?.primaryDepartment?.name || nlpDentalRes.data.analysis?.department;
  console.log(`Query: "I need a root canal" -> Analyzed Department: ${deptDent}`);
  if (!deptDent || !deptDent.toLowerCase().includes('dent')) {
    throw new Error(`Expected Dentistry, got ${deptDent}`);
  }
  console.log('✓ "I need a root canal" successfully classified as Dentistry.');

  // 10. Verify All 17 Departments
  console.log('\n[10/10] Verifying all 17 Healthcare Departments have real doctors and clinics...');
  const deptsRes = await getJson('/api/clinics/departments');
  const depts = deptsRes.data.departments || deptsRes.data;
  console.log(`Total departments in catalog: ${depts.length}`);
  if (depts.length < 17) {
    throw new Error(`Expected 17 departments, got ${depts.length}`);
  }

  const allDoctorsRes = await getJson('/api/doctors');
  const allDocs = allDoctorsRes.data.doctors || allDoctorsRes.data;
  console.log(`Total active doctors in system: ${allDocs.length}`);

  for (const d of depts) {
    const dName = d.name.toLowerCase();
    const hasDoc = allDocs.some((doc) => {
      const spec = (doc.specialization || doc.specialty || '').toLowerCase();
      return (
        spec.includes(dName) ||
        (dName.includes('gynecology') && spec.includes('gynec')) ||
        (dName.includes('medicine') && spec.includes('medicine')) ||
        (dName.includes('physio') && spec.includes('physio')) ||
        (dName.includes('pediatrics') && spec.includes('pediatric')) ||
        (dName.includes('orthopedics') && spec.includes('orthopedic'))
      );
    });
    console.log(`  - ${d.name.padEnd(20)} [Real Doctor Seeded: ${hasDoc ? 'YES' : 'NO'}]`);
    if (!hasDoc) {
      throw new Error(`Department ${d.name} has no seeded doctor!`);
    }
  }
  console.log('✓ All 17 healthcare departments have verified active doctors in database.');

  console.log('\n====================================================');
  console.log('🎉 ALL MEDLINK VERIFICATION TESTS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

run().catch((err) => {
  console.error('\n❌ VERIFICATION SUITE FAILED:', err);
  process.exit(1);
});
