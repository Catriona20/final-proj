const axios = require('axios');
const assert = require('assert');

const API_BASE = 'http://localhost:5000/api';

async function main() {
  console.log('================================================================');
  console.log('🧪 MEDLINK CROSS-MODULE DATA INTEGRITY & HEALTH RECORDS VERIFICATION');
  console.log('================================================================\n');

  // Step 0: Reset demo state for a clean, deterministic run
  console.log('0. Resetting demo state...');
  const resetRes = await axios.post(`${API_BASE}/simulation/reset-demo`);
  assert.strictEqual(resetRes.data.success, true);
  console.log('   ✓ Demo state reset successfully.\n');

  // Set demo clock to 2026-09-09 10:00 AM for deterministic testing
  await axios.post(`${API_BASE}/simulation/demo-clock`, {
    simulatedIsoString: '2026-09-09T10:00:00+05:30',
  });

  // Step 1: Login as Sneha Patel (pat-demo-02)
  console.log('1. Authenticating Sneha Patel (pat-demo-02)...');
  const snehaLogin = await axios.post(`${API_BASE}/auth/login`, {
    email: 'patient02@demo.medlink.test',
    password: 'password123',
  });
  assert.strictEqual(snehaLogin.data.success, true);
  const snehaToken = snehaLogin.data.token;
  const snehaUser = snehaLogin.data.user;
  assert.strictEqual(snehaUser.id, 'pat-demo-02');
  console.log(`   ✓ Authenticated: ${snehaUser.name} (${snehaUser.id})\n`);

  // Step 2: Login as Doctor Dr. Arun Kumar (doc-demo-arun-01)
  console.log('2. Authenticating Dr. Arun Kumar (doc-demo-arun-01)...');
  const arunLogin = await axios.post(`${API_BASE}/auth/doctor/login`, {
    emailOrPhone: 'doctor01@demo.medlink.test',
    password: 'password123',
    clinicId: 'c-demo-moon-01',
  });
  assert.strictEqual(arunLogin.data.success, true);
  const arunToken = arunLogin.data.token;
  const arunDoc = arunLogin.data.doctor;
  assert.strictEqual(arunDoc.id, 'doc-demo-arun-01');
  console.log(`   ✓ Authenticated Doctor: ${arunDoc.name} (${arunDoc.id}) at ${arunDoc.clinic_name}\n`);

  // Step 3: Book Appointment for Sneha Patel with Dr. Arun Kumar at Moon Dental Clinic
  console.log('3. Booking Appointment for Sneha Patel with Dr. Arun Kumar...');
  const bookingRes = await axios.post(
    `${API_BASE}/appointments/book`,
    {
      patientId: 'pat-demo-02',
      patientName: 'Sneha Patel',
      patientPhone: '+91 9000000002',
      doctorId: 'doc-demo-arun-01',
      clinicId: 'c-demo-moon-01',
      department: 'Dentistry',
      date: '2026-09-09',
      time: '11:00 AM',
      reason: 'Root Canal Treatment Assessment',
      symptoms: ['Toothache', 'Sensitivity'],
    },
    { headers: { Authorization: `Bearer ${snehaToken}` } }
  );
  assert.strictEqual(bookingRes.data.success, true);
  const appointment = bookingRes.data.appointment;
  const appointmentId = appointment.id;
  console.log(`   ✓ Appointment Booked: ID ${appointmentId}, Token ${appointment.token_number || appointment.queueToken}\n`);

  // Step 4: Patient Check-In
  console.log('4. Checking in Sneha Patel...');
  const checkInRes = await axios.post(
    `${API_BASE}/appointments/${appointmentId}/check-in`,
    { forceDeskCheckIn: true },
    { headers: { Authorization: `Bearer ${snehaToken}` } }
  );
  assert.strictEqual(checkInRes.data.success, true);
  console.log('   ✓ Checked in to queue.\n');

  // Step 5: Doctor Consultation & Prescription Creation
  console.log('5. Doctor Arun Kumar performing consultation & issuing prescription...');
  const consultationRes = await axios.post(
    `${API_BASE}/doctors/auth/consultations`,
    {
      appointmentId,
      patientId: 'pat-demo-02',
      clinicId: 'c-demo-moon-01',
      diagnosis: 'Severe Dental Caries & Pulpitis',
      clinicalNotes: 'Endodontic procedure initiated. Prescribed antibiotic and analgesic coverage.',
      symptoms: ['Severe tooth pain', 'Mild gum inflammation'],
      assessment: 'Acute pulpitis requiring multi-visit RCT.',
      followUpDate: '2026-09-16',
      followUpReason: 'Second RCT sitting for obturation',
      medicines: [
        {
          name: 'Amoxicillin & Potassium Clavulanate 625 mg',
          dosage: '625 mg',
          frequency: '1-0-1',
          duration: '5 days',
          instructions: 'Take after meals',
        },
        {
          name: 'Ketorolac Tromethamine 10mg (Ketorol-DT)',
          dosage: '10 mg',
          frequency: 'SOS (as needed)',
          duration: '3 days',
          instructions: 'Disperse tablet in half glass of water',
        },
      ],
    },
    { headers: { Authorization: `Bearer ${arunToken}` } }
  );
  assert.strictEqual(consultationRes.data.success, true);
  const createdPrescription = consultationRes.data.prescription;
  console.log(`   ✓ Consultation completed. Prescription ID: ${createdPrescription.id}\n`);

  // Step 6: Verify Pharmacy received the prescription
  console.log('6. Checking Pharmacy pending prescriptions...');
  const pharmacyRes = await axios.get(`${API_BASE}/pharmacy/pending-prescriptions?clinicId=c-demo-moon-01`);
  assert.strictEqual(pharmacyRes.data.success, true);
  const pharmacyRx = pharmacyRes.data.prescriptions.find((p) => p.appointment_id === appointmentId || p.id === createdPrescription.id);
  assert.ok(pharmacyRx, 'Prescription must exist in pharmacy queue');
  assert.strictEqual(pharmacyRx.patient_name, 'Sneha Patel');
  assert.strictEqual(pharmacyRx.doctor_name, 'Dr. Arun Kumar');
  console.log(`   ✓ Pharmacy verified prescription for ${pharmacyRx.patient_name} by ${pharmacyRx.doctor_name}.\n`);

  // Step 7: Call GET /api/records as Sneha Patel (using token & query param)
  console.log('7. Calling GET /api/records for Sneha Patel...');
  const snehaRecordsRes = await axios.get(`${API_BASE}/records`, {
    headers: { Authorization: `Bearer ${snehaToken}` },
  });
  assert.strictEqual(snehaRecordsRes.data.success, true);
  const snehaRecords = snehaRecordsRes.data.records;
  const snehaVisits = snehaRecordsRes.data.visits;

  console.log(`   Total records returned: ${snehaRecords.length}`);
  console.log(`   Total visits returned: ${snehaVisits.length}`);

  // ================================================================
  // 12 MANDATORY CHECKS
  // ================================================================
  console.log('\n================================================================');
  console.log('📋 VERIFYING 12 MANDATORY REQUIREMENTS');
  console.log('================================================================\n');

  const results = {};

  // Check 1: Sneha's appointment doctor = Dr. Arun Kumar
  const snehaAppt = (await axios.get(`${API_BASE}/appointments/${appointmentId}`, {
    headers: { Authorization: `Bearer ${snehaToken}` },
  })).data.appointment;
  const check1 = snehaAppt.doctor_name === 'Dr. Arun Kumar' || snehaAppt.doctorName === 'Dr. Arun Kumar';
  results['1. Sneha appointment doctor = Dr. Arun Kumar'] = check1 ? 'PASS' : 'FAIL';
  console.log(`Check 1: Sneha appointment doctor = Dr. Arun Kumar: ${check1 ? '✅ PASS' : '❌ FAIL'} (${snehaAppt.doctor_name || snehaAppt.doctorName})`);

  // Check 2: Sneha's consultation doctor = Dr. Arun Kumar
  const consultation = consultationRes.data.consultation;
  const check2 = consultation.doctor_id === 'doc-demo-arun-01';
  results['2. Sneha consultation doctor = Dr. Arun Kumar'] = check2 ? 'PASS' : 'FAIL';
  console.log(`Check 2: Sneha consultation doctor = Dr. Arun Kumar: ${check2 ? '✅ PASS' : '❌ FAIL'} (${consultation.doctor_id})`);

  // Check 3: Sneha's prescription doctor = Dr. Arun Kumar
  const check3 = createdPrescription.doctor_name === 'Dr. Arun Kumar' && createdPrescription.doctor_id === 'doc-demo-arun-01';
  results['3. Sneha prescription doctor = Dr. Arun Kumar'] = check3 ? 'PASS' : 'FAIL';
  console.log(`Check 3: Sneha prescription doctor = Dr. Arun Kumar: ${check3 ? '✅ PASS' : '❌ FAIL'} (${createdPrescription.doctor_name})`);

  // Check 4: Sneha's prescription appointmentId points to Sneha's actual appointment
  const check4 = createdPrescription.appointment_id === appointmentId;
  results['4. Sneha prescription appointmentId matches'] = check4 ? 'PASS' : 'FAIL';
  console.log(`Check 4: Sneha prescription appointmentId points to Sneha actual appointment: ${check4 ? '✅ PASS' : '❌ FAIL'} (${createdPrescription.appointment_id})`);

  // Check 5: Sneha's prescription patientId = pat-demo-02
  const check5 = createdPrescription.patient_id === 'pat-demo-02';
  results['5. Sneha prescription patientId = pat-demo-02'] = check5 ? 'PASS' : 'FAIL';
  console.log(`Check 5: Sneha prescription patientId = pat-demo-02: ${check5 ? '✅ PASS' : '❌ FAIL'} (${createdPrescription.patient_id})`);

  // Check 6: Sneha's clinicId = c-demo-moon-01
  const check6 = createdPrescription.clinic_id === 'c-demo-moon-01' && snehaAppt.clinic_id === 'c-demo-moon-01';
  results['6. Sneha clinicId = c-demo-moon-01'] = check6 ? 'PASS' : 'FAIL';
  console.log(`Check 6: Sneha clinicId = c-demo-moon-01: ${check6 ? '✅ PASS' : '❌ FAIL'} (${createdPrescription.clinic_id})`);

  // Check 7: Sneha's completed consultation creates exactly one corresponding visit
  const check7 = snehaVisits.length === 1 && (snehaVisits[0].appointmentId === appointmentId);
  results['7. Exactly one corresponding visit created'] = check7 ? 'PASS' : 'FAIL';
  console.log(`Check 7: Sneha completed consultation creates exactly one corresponding visit: ${check7 ? '✅ PASS' : '❌ FAIL'} (Count: ${snehaVisits.length})`);

  // Check 8: Patient Health Records displays that same visit
  const visit = snehaVisits[0];
  const check8 = visit && visit.doctorName === 'Dr. Arun Kumar' && visit.clinicName === 'Moon Dental Clinic' && visit.status === 'Completed';
  results['8. Health Records displays that same visit'] = check8 ? 'PASS' : 'FAIL';
  console.log(`Check 8: Patient Health Records displays that same visit: ${check8 ? '✅ PASS' : '❌ FAIL'} (Doctor: ${visit?.doctorName}, Clinic: ${visit?.clinicName})`);

  // Check 9: Patient Health Records displays that same prescription
  const rxRecord = snehaRecords.find((r) => r.type === 'prescription');
  const check9 =
    rxRecord &&
    rxRecord.doctor === 'Dr. Arun Kumar' &&
    rxRecord.clinic === 'Moon Dental Clinic' &&
    rxRecord.medicines.some((m) => m.name.includes('Amoxicillin & Potassium Clavulanate 625 mg'));
  results['9. Health Records displays that same prescription'] = check9 ? 'PASS' : 'FAIL';
  console.log(`Check 9: Patient Health Records displays that same prescription: ${check9 ? '✅ PASS' : '❌ FAIL'} (Title: ${rxRecord?.title}, Medicines: ${rxRecord?.medicines?.map(m => m.name).join(', ')})`);

  // Check 10: Dr. Ananya Deshmukh's prescription cannot appear under Sneha
  const ananyaRx = snehaRecords.find((r) => (r.doctor && r.doctor.includes('Ananya')) || (r.title && r.title.includes('Ananya')));
  const check10 = ananyaRx === undefined;
  results['10. Dr. Ananya Deshmukh prescription cannot appear under Sneha'] = check10 ? 'PASS' : 'FAIL';
  console.log(`Check 10: Dr. Ananya Deshmukh prescription cannot appear under Sneha: ${check10 ? '✅ PASS' : '❌ FAIL'} (Found: ${ananyaRx ? ananyaRx.title : 'None'})`);

  // Check 11: Refreshing Patient App does not change displayed doctor/prescription
  const refreshRecordsRes = await axios.get(`${API_BASE}/records?patientId=pat-demo-02`, {
    headers: { Authorization: `Bearer ${snehaToken}` },
  });
  const refreshedRxRecord = refreshRecordsRes.data.records.find((r) => r.type === 'prescription');
  const check11 =
    refreshedRxRecord &&
    refreshedRxRecord.doctor === 'Dr. Arun Kumar' &&
    refreshRecordsRes.data.visits.length === 1 &&
    refreshRecordsRes.data.visits[0].doctorName === 'Dr. Arun Kumar';
  results['11. Refresh does not change doctor/prescription'] = check11 ? 'PASS' : 'FAIL';
  console.log(`Check 11: Refreshing does not change displayed doctor/prescription: ${check11 ? '✅ PASS' : '❌ FAIL'}`);

  // Check 12: Another patient's prescription cannot leak into Sneha's record
  // Sarah Jenkins (pat-101) has prescription rx-apt-2026-001
  const sarahRxInSneha = snehaRecords.find((r) => r.id === 'rx-apt-2026-001' || r.appointmentId === 'apt-2026-001');
  const check12 = sarahRxInSneha === undefined;
  results['12. Other patient prescription cannot leak into Sneha'] = check12 ? 'PASS' : 'FAIL';
  console.log(`Check 12: Another patient prescription cannot leak into Sneha: ${check12 ? '✅ PASS' : '❌ FAIL'}`);

  console.log('\n================================================================');
  console.log('SUMMARY TABLE:');
  console.log('================================================================');
  let allPassed = true;
  for (const [desc, res] of Object.entries(results)) {
    console.log(`${res === 'PASS' ? '✅' : '❌'} ${desc}: ${res}`);
    if (res !== 'PASS') allPassed = false;
  }

  if (allPassed) {
    console.log('\n🎉 ALL 12 MANDATORY CHECKS PASSED!\n');
    process.exit(0);
  } else {
    console.log('\n❌ SOME CHECKS FAILED!\n');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Test execution error:', err.response ? err.response.data : err.message);
  process.exit(1);
});
