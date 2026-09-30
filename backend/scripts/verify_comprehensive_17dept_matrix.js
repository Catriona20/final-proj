/**
 * MedLink Comprehensive 17-Department Verification Matrix
 * 
 * Validates:
 * 1. 17 Canonical Departments x 3 Query Types (51 queries):
 *    - Query A: Direct Specialist Request
 *    - Query B: Natural Symptom Phrase
 *    - Query C: Alternate Wording / Synonym
 * 2. 8 Required Gynecology variations:
 *    - 'I need a gynaecologist', 'I need a gynecologist', 'I want to see a gynecologist', etc.
 * 3. Strict Clinic Filtering (Zero cross-department leakage, non-matching demo clinics never appear)
 * 4. 2-Tier Demo-First Ranking (Matching demo clinics Tier 1, other Chennai clinics Tier 2)
 * 5. Geolocation / Location Change (Manapakkam vs Adyar vs Anna Nagar with real Haversine distances)
 * 6. Procedure-Aware Doctor Matching ('I need a root canal' -> Dr. Arun Kumar Endodontics)
 * 7. Approved Slots Integration (Doctors assigned, approved availability schedules, >0 available slots)
 * 8. Real Appointment Booking (2 different doctors across 2 different clinics)
 */

const BASE_URL = 'http://localhost:5000';
const NLP_URL = 'http://localhost:8000';

const CANONICAL_17_DEPARTMENTS = [
  'General Medicine',
  'Dentistry',
  'Dermatology',
  'Cardiology',
  'Orthopedics',
  'Ophthalmology',
  'ENT',
  'Pediatrics',
  'Pulmonology',
  'Neurology',
  'Gastroenterology',
  'Nephrology',
  'Endocrinology',
  'Urology',
  'Physiotherapy',
  'Psychiatry',
  'Gynecology'
];

// 51 Test Queries covering every department with 3 styles
const TEST_MATRIX_51 = [
  // 1. General Medicine
  { dept: 'General Medicine', type: 'A (Direct Specialist)', query: 'I need a general physician' },
  { dept: 'General Medicine', type: 'B (Natural Symptom)', query: 'I have mild body aches and weakness' },
  { dept: 'General Medicine', type: 'C (Alternate/Synonym)', query: 'family doctor consultation' },

  // 2. Dentistry
  { dept: 'Dentistry', type: 'A (Direct Specialist)', query: 'I need a dentist' },
  { dept: 'Dentistry', type: 'B (Natural Symptom)', query: 'I have severe tooth pain and bleeding gums' },
  { dept: 'Dentistry', type: 'C (Alternate/Synonym)', query: 'dental surgeon checkup' },

  // 3. Dermatology
  { dept: 'Dermatology', type: 'A (Direct Specialist)', query: 'I need a dermatologist' },
  { dept: 'Dermatology', type: 'B (Natural Symptom)', query: 'I have an itchy red skin rash on my arms' },
  { dept: 'Dermatology', type: 'C (Alternate/Synonym)', query: 'skin doctor consultation' },

  // 4. Cardiology
  { dept: 'Cardiology', type: 'A (Direct Specialist)', query: 'I need a cardiologist' },
  { dept: 'Cardiology', type: 'B (Natural Symptom)', query: 'I have severe chest pain and breathlessness' },
  { dept: 'Cardiology', type: 'C (Alternate/Synonym)', query: 'heart specialist appointment' },

  // 5. Orthopedics
  { dept: 'Orthopedics', type: 'A (Direct Specialist)', query: 'I need an orthopedic doctor' },
  { dept: 'Orthopedics', type: 'B (Natural Symptom)', query: 'I have severe joint pain and knee swelling' },
  { dept: 'Orthopedics', type: 'C (Alternate/Synonym)', query: 'bone specialist consultation' },

  // 6. Ophthalmology
  { dept: 'Ophthalmology', type: 'A (Direct Specialist)', query: 'I need an ophthalmologist' },
  { dept: 'Ophthalmology', type: 'B (Natural Symptom)', query: 'I have blurry vision and eye irritation' },
  { dept: 'Ophthalmology', type: 'C (Alternate/Synonym)', query: 'eye specialist clinic' },

  // 7. ENT
  { dept: 'ENT', type: 'A (Direct Specialist)', query: 'I need an ENT specialist' },
  { dept: 'ENT', type: 'B (Natural Symptom)', query: 'I have severe ear pain and throat irritation' },
  { dept: 'ENT', type: 'C (Alternate/Synonym)', query: 'ear nose throat doctor' },

  // 8. Pediatrics
  { dept: 'Pediatrics', type: 'A (Direct Specialist)', query: 'I need a pediatrician' },
  { dept: 'Pediatrics', type: 'B (Natural Symptom)', query: 'My baby has high fever and cough' },
  { dept: 'Pediatrics', type: 'C (Alternate/Synonym)', query: 'child specialist doctor' },

  // 9. Pulmonology
  { dept: 'Pulmonology', type: 'A (Direct Specialist)', query: 'I need a pulmonologist' },
  { dept: 'Pulmonology', type: 'B (Natural Symptom)', query: 'I have chronic cough and wheezing' },
  { dept: 'Pulmonology', type: 'C (Alternate/Synonym)', query: 'lung specialist consultation' },

  // 10. Neurology
  { dept: 'Neurology', type: 'A (Direct Specialist)', query: 'I need a neurologist' },
  { dept: 'Neurology', type: 'B (Natural Symptom)', query: 'I have frequent migraines and dizziness' },
  { dept: 'Neurology', type: 'C (Alternate/Synonym)', query: 'nerve specialist checkup' },

  // 11. Gastroenterology
  { dept: 'Gastroenterology', type: 'A (Direct Specialist)', query: 'I need a gastroenterologist' },
  { dept: 'Gastroenterology', type: 'B (Natural Symptom)', query: 'I have chronic stomach pain and acid reflux' },
  { dept: 'Gastroenterology', type: 'C (Alternate/Synonym)', query: 'digestive specialist doctor' },

  // 12. Nephrology
  { dept: 'Nephrology', type: 'A (Direct Specialist)', query: 'I need a nephrologist' },
  { dept: 'Nephrology', type: 'B (Natural Symptom)', query: 'I have high creatinine and kidney swelling' },
  { dept: 'Nephrology', type: 'C (Alternate/Synonym)', query: 'kidney specialist consultation' },

  // 13. Endocrinology
  { dept: 'Endocrinology', type: 'A (Direct Specialist)', query: 'I need an endocrinologist' },
  { dept: 'Endocrinology', type: 'B (Natural Symptom)', query: 'I have uncontrolled blood sugar and diabetes' },
  { dept: 'Endocrinology', type: 'C (Alternate/Synonym)', query: 'hormone and thyroid specialist' },

  // 14. Urology
  { dept: 'Urology', type: 'A (Direct Specialist)', query: 'I need a urologist' },
  { dept: 'Urology', type: 'B (Natural Symptom)', query: 'I have burning urination and kidney stone pain' },
  { dept: 'Urology', type: 'C (Alternate/Synonym)', query: 'urinary bladder specialist' },

  // 15. Physiotherapy
  { dept: 'Physiotherapy', type: 'A (Direct Specialist)', query: 'I need a physiotherapist' },
  { dept: 'Physiotherapy', type: 'B (Natural Symptom)', query: 'I need rehabilitation for lower back stiffness' },
  { dept: 'Physiotherapy', type: 'C (Alternate/Synonym)', query: 'physical therapy clinic' },

  // 16. Psychiatry
  { dept: 'Psychiatry', type: 'A (Direct Specialist)', query: 'I need a psychiatrist' },
  { dept: 'Psychiatry', type: 'B (Natural Symptom)', query: 'I have severe anxiety panic attacks and depression' },
  { dept: 'Psychiatry', type: 'C (Alternate/Synonym)', query: 'mental health doctor' },

  // 17. Gynecology
  { dept: 'Gynecology', type: 'A (Direct Specialist)', query: 'I need a gynaecologist' },
  { dept: 'Gynecology', type: 'B (Natural Symptom)', query: 'I have severe menstrual cramps and pregnancy nausea' },
  { dept: 'Gynecology', type: 'C (Alternate/Synonym)', query: 'women\'s health doctor' }
];

// Required 8 Gynecology variations
const GYNECOLOGY_TESTS = [
  'I need a gynaecologist',
  'I need a gynecologist',
  'I want to see a gynecologist',
  'I need a women\'s health doctor',
  'I need an OB-GYN',
  'I need an obstetrician',
  'I need a doctor for women\'s health',
  'I need a pregnancy specialist'
];

async function runValidation() {
  console.log('================================================================');
  console.log('  MEDLINK COMPREHENSIVE 17-DEPARTMENT & GYNAECOLOGY MATRIX TEST ');
  console.log('================================================================\n');

  let passedTests = 0;
  let failedTests = 0;

  // -------------------------------------------------------------------------
  // TEST SECTION 1: REQUIRED 8 GYNAECOLOGY INTENT VARIATIONS
  // -------------------------------------------------------------------------
  console.log('--- TEST SECTION 1: 8 SPECIFIC GYNAECOLOGY INTENT VARIATIONS ---');
  for (const q of GYNECOLOGY_TESTS) {
    const res = await fetch(`${BASE_URL}/api/ai/symptom-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms: q })
    });
    const data = await res.json();
    const dept = data.analysis?.department;
    const conf = data.analysis?.confidence;
    const isGyn = dept === 'Gynecology';

    if (isGyn && conf >= 0.85) {
      console.log(`  ✅ [PASS] "${q}" => ${dept} (conf: ${(conf * 100).toFixed(0)}%)`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] "${q}" => ${dept} (conf: ${conf})`);
      failedTests++;
    }
  }

  // -------------------------------------------------------------------------
  // TEST SECTION 2: ALL 17 DEPARTMENTS x 3 QUERY TYPES (51 QUERIES)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SECTION 2: 17 DEPARTMENTS x 3 QUERY TYPES (51 QUERIES) ---');
  for (const item of TEST_MATRIX_51) {
    const res = await fetch(`${BASE_URL}/api/ai/symptom-analysis`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptoms: item.query })
    });
    const data = await res.json();
    const predictedDept = data.analysis?.department;
    const conf = data.analysis?.confidence;
    const isMatch = predictedDept === item.dept;

    if (isMatch) {
      console.log(`  ✅ [PASS] [${item.dept.padEnd(16)}] [${item.type.padEnd(23)}] "${item.query}" => ${predictedDept} (${(conf*100).toFixed(0)}%)`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] [${item.dept.padEnd(16)}] [${item.type.padEnd(23)}] "${item.query}" => Got: ${predictedDept} (Expected: ${item.dept})`);
      failedTests++;
    }
  }

  // -------------------------------------------------------------------------
  // TEST SECTION 3: CLINIC FILTERING & 2-TIER DEMO-FIRST RANKING
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SECTION 3: CLINIC FILTERING & 2-TIER DEMO-FIRST RANKING ---');
  for (const dept of CANONICAL_17_DEPARTMENTS) {
    const res = await fetch(`${BASE_URL}/api/clinics/discovery?department=${encodeURIComponent(dept)}&latitude=13.0205&longitude=80.1635`);
    const data = await res.json();
    const clinics = data.clinics || [];

    if (clinics.length === 0) {
      console.error(`  ❌ [FAIL] No clinics returned for department: ${dept}`);
      failedTests++;
      continue;
    }

    // Verify all returned clinics genuinely support the department
    let hasCrossLeakage = false;
    for (const c of clinics) {
      const depts = c.departments || [];
      const specs = c.specialties || [];
      const match = depts.some(d => d.toLowerCase() === dept.toLowerCase()) ||
                    specs.some(s => s.toLowerCase() === dept.toLowerCase());
      if (!match) {
        hasCrossLeakage = true;
        console.error(`    ❌ Leakage: Clinic "${c.name}" does NOT support ${dept}!`);
      }
    }

    // Verify Tier 1 (demo) appears before Tier 2 (non-demo)
    let seenNonDemo = false;
    let tierViolation = false;
    for (const c of clinics) {
      const isDemo = c.isDemoClinic || c.isDemo || c.source === 'MEDLINK_DEMO' || c.source === 'medlink_demo';
      if (!isDemo) {
        seenNonDemo = true;
      } else if (seenNonDemo) {
        tierViolation = true;
        console.error(`    ❌ Tier violation: Demo clinic "${c.name}" appeared AFTER a non-demo clinic!`);
      }
    }

    // Verify a non-matching demo clinic (e.g. Moon Dental) is never returned for other departments
    let nonMatchingDemoFound = false;
    if (dept !== 'Dentistry') {
      const moon = clinics.find(c => (c.name || '').toLowerCase().includes('moon dental'));
      if (moon) {
        nonMatchingDemoFound = true;
        console.error(`    ❌ Violation: Moon Dental appeared in ${dept} search!`);
      }
    }

    if (!hasCrossLeakage && !tierViolation && !nonMatchingDemoFound) {
      const firstClinic = clinics[0];
      const isDemo = firstClinic.source === 'MEDLINK_DEMO' || firstClinic.isDemoClinic;
      console.log(`  ✅ [PASS] [${dept.padEnd(16)}] Returned ${clinics.length} clinics. First: "${firstClinic.name}" (Demo: ${isDemo}, dist: ${firstClinic.distance})`);
      passedTests++;
    } else {
      failedTests++;
    }
  }

  // -------------------------------------------------------------------------
  // TEST SECTION 4: GEOLOCATION / LOCATION CHANGE DISTANCE RECALCULATION
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SECTION 4: GEOLOCATION RECALCULATION ACROSS CHENNAI ---');
  const locManapakkam = { name: 'Manapakkam', lat: 13.0205, lng: 80.1635 };
  const locAdyar = { name: 'Adyar', lat: 13.0078, lng: 80.2567 };
  const locAnnaNagar = { name: 'Anna Nagar', lat: 13.0850, lng: 80.2101 };

  const resMana = await (await fetch(`${BASE_URL}/api/clinics/discovery?department=Gynecology&latitude=${locManapakkam.lat}&longitude=${locManapakkam.lng}`)).json();
  const resAdyar = await (await fetch(`${BASE_URL}/api/clinics/discovery?department=Gynecology&latitude=${locAdyar.lat}&longitude=${locAdyar.lng}`)).json();
  const resAnna = await (await fetch(`${BASE_URL}/api/clinics/discovery?department=Gynecology&latitude=${locAnnaNagar.lat}&longitude=${locAnnaNagar.lng}`)).json();

  const cMana = resMana.clinics?.[0];
  const cAdyar = resAdyar.clinics?.[0];
  const cAnna = resAnna.clinics?.[0];

  const mMana = cMana?.distanceMeters || 0;
  const mAdyar = cAdyar?.distanceMeters || 0;
  const mAnna = cAnna?.distanceMeters || 0;

  console.log(`  GreenLife Clinic from Manapakkam: ${cMana?.distance} (Meters: ${mMana}, ETA: ${cMana?.travelTime})`);
  console.log(`  GreenLife Clinic from Adyar:      ${cAdyar?.distance} (Meters: ${mAdyar}, ETA: ${cAdyar?.travelTime})`);
  console.log(`  GreenLife Clinic from Anna Nagar: ${cAnna?.distance} (Meters: ${mAnna}, ETA: ${cAnna?.travelTime})`);

  if (mMana !== mAdyar && mAdyar !== mAnna && mMana > 0 && mAdyar > 0) {
    console.log('  ✅ [PASS] Distances and ETAs dynamically recalculate according to patient coordinates.');
    passedTests++;
  } else {
    console.error('  ❌ [FAIL] Distances did not vary across coordinates.');
    failedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST SECTION 5: PROCEDURE-AWARE DOCTOR MATCHING
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SECTION 5: PROCEDURE-AWARE DOCTOR MATCHING ---');
  const procRes = await fetch(`${BASE_URL}/api/doctors?procedure=root canal`);
  const procData = await procRes.json();
  const matchedDocs = procData.doctors || [];
  const arun = matchedDocs.find(d => (d.name || '').includes('Arun Kumar'));

  if (arun && (arun.specialization === 'Dentistry' || arun.department === 'Dentistry') && arun.procedures?.some(p => p.toLowerCase().includes('root canal'))) {
    console.log(`  ✅ [PASS] "root canal" matched doctor: ${arun.name} (Specialty: ${arun.specialization}, Clinic: ${arun.clinic_name || arun.clinicName})`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] "root canal" did not match Dr. Arun Kumar appropriately.`);
    failedTests++;
  }

  // -------------------------------------------------------------------------
  // TEST SECTION 6: APPROVED SLOTS INTEGRATION FOR ALL 17 DEPARTMENTS
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SECTION 6: APPROVED SLOTS FOR ALL 17 DEMO CLINICS ---');
  const DEMO_CLINICS_17 = [
    { id: 'c-demo-moon-01', dept: 'Dentistry', docId: 'doc-demo-arun-01' },
    { id: 'c-demo-apollo-02', dept: 'General Medicine', docId: 'doc-demo-priya-02' },
    { id: 'c-demo-greenlife-03', dept: 'Gynecology', docId: 'doc-demo-radha-09' },
    { id: 'c-demo-heart-04', dept: 'Cardiology', docId: 'doc-demo-karthik-07' },
    { id: 'c-demo-vision-05', dept: 'Ophthalmology', docId: 'doc-demo-ramesh-15' },
    { id: 'c-demo-ortho-06', dept: 'Orthopedics', docId: 'doc-demo-aditya-17' },
    { id: 'c-demo-skin-07', dept: 'Dermatology', docId: 'doc-demo-priya-19' },
    { id: 'c-demo-neuro-08', dept: 'Neurology', docId: 'doc-demo-arvind-21' },
    { id: 'c-demo-nova-09', dept: 'ENT', docId: 'doc-demo-venkat-23' },
    { id: 'c-demo-smile-10', dept: 'Pediatrics', docId: 'doc-demo-kavitha-25' },
    { id: 'c-demo-pulmo-11', dept: 'Pulmonology', docId: 'doc-demo-sanjay-29' },
    { id: 'c-demo-renal-12', dept: 'Nephrology', docId: 'doc-demo-balaji-31' },
    { id: 'c-demo-digestive-13', dept: 'Gastroenterology', docId: 'doc-demo-manoj-33' },
    { id: 'c-demo-endowell-14', dept: 'Endocrinology', docId: 'doc-demo-kiran-35' },
    { id: 'c-demo-uro-15', dept: 'Urology', docId: 'doc-demo-dinesh-37' },
    { id: 'c-demo-physio-16', dept: 'Physiotherapy', docId: 'doc-demo-antony-39' },
    { id: 'c-demo-mind-17', dept: 'Psychiatry', docId: 'doc-demo-siddharth-41' }
  ];

  for (const c of DEMO_CLINICS_17) {
    const slotsRes = await fetch(`${BASE_URL}/api/availability/clinics/${c.id}/slots?date=2026-09-30`);
    const slotsData = await slotsRes.json();
    const availableSlots = (slotsData.slots || []).filter(s => s.isAvailable);

    if (availableSlots.length > 0) {
      console.log(`  ✅ [PASS] [${c.dept.padEnd(16)}] Clinic: ${c.id} has ${availableSlots.length} approved available slots on 2026-09-30`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] [${c.dept.padEnd(16)}] Clinic: ${c.id} has NO available slots!`);
      failedTests++;
    }
  }

  // -------------------------------------------------------------------------
  // TEST SECTION 7: APPOINTMENT BOOKING VERIFICATION (2 DOCTORS, 2 CLINICS)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST SECTION 7: END-TO-END BOOKING (2 DOCTORS, 2 CLINICS) ---');
  
  // Booking 1: Dr. Radha Sundaram (Gynecology at GreenLife)
  const book1Res = await fetch(`${BASE_URL}/api/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId: 'pat-demo-01',
      doctorId: 'doc-demo-radha-09',
      clinicId: 'c-demo-greenlife-03',
      date: '2026-09-30',
      time: '10:00 AM',
      type: 'CONSULTATION',
      department: 'Gynecology',
      notes: 'Automated 17-department test booking 1'
    })
  });
  const book1Data = await book1Res.json();
  if (book1Data.success || book1Data.appointment) {
    console.log(`  ✅ [PASS] Booking 1 Succeeded: Dr. Radha Sundaram at GreenLife Clinic (ID: ${book1Data.appointment?.id || book1Data.id})`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] Booking 1 Failed:`, book1Data);
    failedTests++;
  }

  // Booking 2: Dr. Arun Kumar (Dentistry at Moon Dental)
  const book2Res = await fetch(`${BASE_URL}/api/appointments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientId: 'pat-demo-02',
      doctorId: 'doc-demo-arun-01',
      clinicId: 'c-demo-moon-01',
      date: '2026-09-30',
      time: '11:00 AM',
      type: 'CONSULTATION',
      department: 'Dentistry',
      notes: 'Automated 17-department test booking 2'
    })
  });
  const book2Data = await book2Res.json();
  if (book2Data.success || book2Data.appointment) {
    console.log(`  ✅ [PASS] Booking 2 Succeeded: Dr. Arun Kumar at Moon Dental Clinic (ID: ${book2Data.appointment?.id || book2Data.id})`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] Booking 2 Failed:`, book2Data);
    failedTests++;
  }

  // -------------------------------------------------------------------------
  // FINAL SCOREBOARD
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log(`FINAL RESULTS: ${passedTests} PASSED, ${failedTests} FAILED out of ${passedTests + failedTests}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runValidation().catch(err => {
  console.error('Fatal error running validation:', err);
  process.exit(1);
});
