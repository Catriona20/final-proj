import http from 'http';

function request(options, body) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

const EXPECTED_PATIENTS = [
  { id: 'pat-demo-01', name: 'Aarav Sharma', email: 'patient01@demo.medlink.test', pass: 'Demo@1001', otp: '100001' },
  { id: 'pat-demo-02', name: 'Sneha Patel', email: 'patient02@demo.medlink.test', pass: 'Demo@1002', otp: '100002' },
  { id: 'pat-demo-03', name: 'Rajesh Kumar', email: 'patient03@demo.medlink.test', pass: 'Demo@1003', otp: '100003' },
  { id: 'pat-demo-04', name: 'Priya Raman', email: 'patient04@demo.medlink.test', pass: 'Demo@1004', otp: '100004' },
  { id: 'pat-demo-05', name: 'Vikram Malhotra', email: 'patient05@demo.medlink.test', pass: 'Demo@1005', otp: '100005' },
  { id: 'pat-demo-06', name: 'Ananya Iyer', email: 'patient06@demo.medlink.test', pass: 'Demo@1006', otp: '100006' },
  { id: 'pat-demo-07', name: 'Rahul Verma', email: 'patient07@demo.medlink.test', pass: 'Demo@1007', otp: '100007' },
  { id: 'pat-demo-08', name: 'Pooja Nair', email: 'patient08@demo.medlink.test', pass: 'Demo@1008', otp: '100008' },
];

const EXPECTED_CLINICS_COUNT = 17;

const results = [];

function recordResult(checkName, passed, details) {
  results.push({ checkName, passed, details });
  const statusStr = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${statusStr} — ${checkName}: ${details}`);
}

async function verifyCleanDemoState() {
  console.log('================================================================');
  console.log('🏥 MEDLINK DEMO DATASET & CLEAN RESET VERIFICATION SUITE');
  console.log('================================================================\n');

  try {
    // 1. Reset Demo Environment
    console.log('1️⃣ Triggering Demo Reset (/api/simulation/reset-demo)...');
    const resetRes = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/simulation/reset-demo',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {}
    );
    const resetOk = resetRes.status === 200 && resetRes.data?.success === true;
    recordResult('Demo Environment Reset Endpoint', resetOk, `Status ${resetRes.status}, message: ${resetRes.data?.message || resetRes.raw}`);

    // Fetch entity lists for thorough relational checks
    const seedCheck = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/simulation/seed-demo',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {}
    );
    const entities = seedCheck.data?.demoEntities || {};

    // Re-trigger clean reset to ensure test runs on clean reset state
    const cleanReset = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/simulation/reset-demo',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      },
      {}
    );
    const resetState = cleanReset.data?.state || {};

    // 2. Expected Number of Patient Accounts
    const patientList = entities.patients || [];
    const hasAtLeast8Patients = patientList.length >= 8;
    recordResult(
      'Expected Number of Patient Accounts',
      hasAtLeast8Patients,
      `Found ${patientList.length} patient accounts (minimum 8 required)`
    );

    // 3. Every Patient Has Unique ID
    const patientIds = new Set(patientList.map((p) => p.id));
    const uniqueIds = patientIds.size === patientList.length;
    recordResult('Unique Patient IDs', uniqueIds, `All ${patientList.length} patient accounts have distinct IDs`);

    // 4. Every Patient Has Unique Email
    const patientEmails = new Set(patientList.map((p) => p.email?.toLowerCase()));
    const uniqueEmails = patientEmails.size === patientList.length;
    recordResult('Unique Patient Emails', uniqueEmails, `All ${patientList.length} patient accounts have distinct emails`);

    // 5. Quick-Fill Accounts Map to Correct Authenticated Patient
    console.log('\n2️⃣ Verifying Patient Authentications & Quick-Fill Identity Parity...');
    let allQuickFillMatch = true;
    for (const exp of EXPECTED_PATIENTS) {
      const loginRes = await request(
        {
          hostname: '127.0.0.1',
          port: 5000,
          path: '/api/auth/login',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        { email: exp.email, password: exp.pass }
      );

      const authUser = loginRes.data?.user;
      const idMatch = authUser?.id === exp.id;
      const nameMatch = authUser?.name === exp.name;
      const emailMatch = authUser?.email?.toLowerCase() === exp.email.toLowerCase();

      if (!idMatch || !nameMatch || !emailMatch) {
        allQuickFillMatch = false;
        console.log(`   ❌ Identity mismatch for ${exp.email}: expected [${exp.id}, ${exp.name}], got [${authUser?.id}, ${authUser?.name}]`);
      } else {
        console.log(`   ✓ ${exp.name} (${exp.email}) authenticated as user ID ${authUser.id}`);
      }
    }
    recordResult('Quick-Fill Accounts Identity Parity', allQuickFillMatch, 'All 8 Quick-Fill accounts authenticate as the exact specified patient name and ID');

    // 6. Canonical Dr Arun Flow Verification
    console.log('\n3️⃣ Verifying Canonical Dr. Arun Kumar Relationship...');
    const doctorList = entities.doctors || [];
    const drArun = doctorList.find((d) => d.id === 'doc-demo-arun-01');
    const drArunOk =
      drArun &&
      drArun.name === 'Dr. Arun Kumar' &&
      drArun.specialization === 'Dentistry' &&
      drArun.clinic_id === 'c-demo-moon-01' &&
      drArun.clinic_name === 'Moon Dental Clinic';
    recordResult(
      'Canonical Dr. Arun Identity & Affiliation',
      !!drArunOk,
      drArun ? `${drArun.name} (ID: ${drArun.id}) -> ${drArun.specialization} at ${drArun.clinic_name} (${drArun.clinic_id})` : 'Dr. Arun not found!'
    );

    // 7. All Demo Clinics Exist (17 Chennai Clinics)
    console.log('\n4️⃣ Verifying Clinics Network...');
    const clinicList = entities.clinics || [];
    const has17Clinics = clinicList.length >= EXPECTED_CLINICS_COUNT;
    recordResult('All Demo Clinics Exist', has17Clinics, `Found ${clinicList.length} clinics across Chennai (expected 17)`);

    // 8. All Demo Doctors Exist
    const hasDoctors = doctorList.length >= 40;
    recordResult('All Demo Doctors Exist', hasDoctors, `Found ${doctorList.length} specialist doctors (expected >= 40)`);

    // 9. All Clinic Assistants Exist
    const assistantList = patientList.filter((p) => p.role === 'CLINIC_ADMIN');
    const hasAssistants = assistantList.length >= 17;
    recordResult('All Clinic Assistants Exist', hasAssistants, `Found ${assistantList.length} clinic assistants for facilities (expected 17)`);

    // 10. No Stale Queue Entries after Reset
    console.log('\n5️⃣ Verifying Transactional Clean State After Reset...');
    const queueCheck = await request(
      {
        hostname: '127.0.0.1',
        port: 5000,
        path: '/api/queue?clinicId=c-demo-moon-01',
        method: 'GET',
      }
    );
    const moonQueue = queueCheck.data?.queue || [];
    const zeroQueue = moonQueue.length === 0 && resetState.active_queues === 0;
    recordResult('No Stale Queue Entries', zeroQueue, `Active queues after reset: ${resetState.active_queues} (Moon Dental queue length: ${moonQueue.length})`);

    // 11. No Stale Active Consultations
    const zeroActiveConsultations = resetState.active_consultations === 0;
    recordResult('No Stale Active Consultations', zeroActiveConsultations, `Active in-session consultations after reset: ${resetState.active_consultations}`);

    // 12. No Stale Walk-Ins
    const zeroWalkIns = resetState.walk_ins === 0;
    recordResult('No Stale Walk-Ins', zeroWalkIns, `Active walk-in entries after reset: ${resetState.walk_ins}`);

    // 13. No Stale Notifications
    const zeroNotifications = resetState.notifications === 0;
    recordResult('No Stale Notifications', zeroNotifications, `Stored notifications after reset: ${resetState.notifications}`);

    // 14. No Stale Slot Locks
    const zeroSlotLocks = resetState.slot_locks === 0;
    recordResult('No Stale Slot Locks', zeroSlotLocks, `Active booking locks after reset: ${resetState.slot_locks}`);

    // 15. No Orphan Appointments & Referential Integrity
    const appointmentList = entities.appointments || [];
    const validPatientIds = new Set(patientList.map((p) => p.id));
    const validDoctorIds = new Set(doctorList.map((d) => d.id));
    const validClinicIds = new Set(clinicList.map((c) => c.id));

    let noOrphanApt = true;
    for (const apt of appointmentList) {
      if (!validPatientIds.has(apt.patient_id)) {
        noOrphanApt = false;
        console.log(`   ❌ Appointment ${apt.id} references nonexistent patient ${apt.patient_id}`);
      }
      if (!validDoctorIds.has(apt.doctor_id)) {
        noOrphanApt = false;
        console.log(`   ❌ Appointment ${apt.id} references nonexistent doctor ${apt.doctor_id}`);
      }
      if (!validClinicIds.has(apt.clinic_id)) {
        noOrphanApt = false;
        console.log(`   ❌ Appointment ${apt.id} references nonexistent clinic ${apt.clinic_id}`);
      }
    }
    recordResult('No Orphan Appointments / Referential Integrity', noOrphanApt, `Verified referential integrity for all ${appointmentList.length} baseline appointments`);

    // Final Summary
    console.log('\n================================================================');
    console.log('📊 FINAL VERIFICATION RESULTS SUMMARY:');
    console.log('================================================================');
    const passedCount = results.filter((r) => r.passed).length;
    const totalCount = results.length;
    console.log(`Total Checks: ${totalCount} | Passed: ${passedCount} | Failed: ${totalCount - passedCount}\n`);

    for (const r of results) {
      console.log(`  [${r.passed ? 'PASS' : 'FAIL'}] ${r.checkName}`);
    }

    if (passedCount === totalCount) {
      console.log('\n🎉 ALL 15 MANDATORY DEMO DATASET REQUIREMENTS PASSED PERFECTLY!\n');
      process.exit(0);
    } else {
      console.error('\n⚠️ SOME VERIFICATION CHECKS FAILED. SEE DETAILS ABOVE.\n');
      process.exit(1);
    }
  } catch (err) {
    console.error('💥 Fatal error in verification script:', err);
    process.exit(1);
  }
}

verifyCleanDemoState();
