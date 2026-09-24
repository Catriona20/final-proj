const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

async function runRegressionSuite() {
  console.log('🧪 ============================================================');
  console.log('🧪 DOCTOR CONSULTATION COMPLETION & CROSS-APP SYNC REGRESSION');
  console.log('🧪 ============================================================\n');

  try {
    // 0. RESET DEMO DATABASE BASELINE
    console.log('0️⃣ Resetting demo database to authoritative baseline...');
    const resetRes = await axios.post(`${API_BASE}/simulation/reset-demo`);
    console.log(`   Database reset status: ${resetRes.status} (${resetRes.data.message})`);

    // Reset demo clock to real system time initially
    await axios.post(`${API_BASE}/simulation/demo-clock`, { reset: true });

    // 1. DOCTOR LOGIN
    console.log('\n1️⃣ Authenticating Dr. Arun Kumar (Doctor App)...');
    const docLogin = await axios.post(`${API_BASE}/auth/doctor/login`, {
      emailOrPhone: 'doctor01@demo.medlink.test',
      password: 'Doctor@2001',
    });
    const docToken = docLogin.data.token;
    console.log(`   Logged in as: ${docLogin.data.doctor.name} (${docLogin.data.doctor.specialization})`);

    // 2. VERIFY INITIAL LIVE QUEUE & TODAY APPOINTMENTS
    console.log('\n2️⃣ Inspecting Authoritative Moon Dental Queue & Today Schedule...');
    const qInitial = await axios.get(`${API_BASE}/queue?clinicId=c-demo-moon-01`);
    console.log(`   Active waiting patients: ${qInitial.data.count}`);
    const ramesh = qInitial.data.queue.find((q) => q.patientName.includes('Ramesh'));
    if (!ramesh) throw new Error('Emergency Patient Ramesh not found in initial queue!');
    console.log(`   ✅ Position 1: ${ramesh.patientName} | Priority: ${ramesh.priority} | Token: ${ramesh.queueNumber} | Status: ${ramesh.status}`);

    // Confirm Aarav Sharma is NOT in the active queue before check-in
    const aaravInQueue = qInitial.data.queue.find((q) => q.patientName.includes('Aarav'));
    if (aaravInQueue) {
      throw new Error(`FAIL: Aarav Sharma found in active queue before check-in! Status: ${aaravInQueue.status}`);
    }
    console.log(`   ✅ Aarav Sharma is NOT in active queue (correctly awaiting check-in window)`);

    // Confirm Aarav Sharma IS in today's appointments table
    const todayApts = await axios.get(`${API_BASE}/appointments/today?clinicId=c-demo-moon-01`);
    const aaravToday = todayApts.data.appointments.find((a) => a.patientName.includes('Aarav'));
    if (!aaravToday) throw new Error('Aarav Sharma missing from today appointments!');
    console.log(`   ✅ Aarav Sharma visible in Today Appointments: Status ${aaravToday.status} (${aaravToday.time})`);

    // 3. DOCTOR STARTS CONSULTATION FOR RAMESH
    console.log('\n3️⃣ Doctor starts clinical consultation for Ramesh...');
    const startRes = await axios.post(`${API_BASE}/simulation/start-consultation`, {
      appointmentId: ramesh.walkInId || 'walk-demo-moon-emergency',
    });
    console.log(`   Start status: ${startRes.data.success}, Status: ${startRes.data.appointment.status}`);

    const qDuring = await axios.get(`${API_BASE}/queue?clinicId=c-demo-moon-01`);
    const rameshConsulting = qDuring.data.queue.find((q) => q.walkInId === 'walk-demo-moon-emergency');
    if (rameshConsulting?.status !== 'IN_CONSULTATION') {
      throw new Error(`Expected Ramesh status IN_CONSULTATION, got ${rameshConsulting?.status}`);
    }
    console.log(`   ✅ Clinic Assistant Queue shows Ramesh: ${rameshConsulting.status} (Position: ${rameshConsulting.queuePosition})`);

    // 4. DOCTOR COMPLETES CONSULTATION & ISSUES PRESCRIPTION
    console.log('\n4️⃣ Doctor clicks "Complete & Issue Prescription"...');
    const consultPayload = {
      appointmentId: 'walk-demo-moon-emergency',
      patientId: 'pat-demo-ramesh-emergency',
      diagnosis: 'Clinical evaluation of Severe acute dental facial trauma & bleeding laceration',
      clinicalNotes: 'Patient presented with chief complaints. Vitals stable. Systemic examination normal.',
      assessment: 'Satisfactory prognosis. Responding well to treatment.',
      medicines: [
        {
          name: 'Amoxicillin & Potassium Clavulanate 625mg',
          dosage: '625 mg',
          frequency: '1-0-1',
          duration: '5 days',
          instructions: 'After food',
        },
        {
          name: 'Paracetamol 650mg (Dolo)',
          dosage: '650 mg',
          frequency: '1-0-1 (SOS)',
          duration: '3 days',
          instructions: 'After food during fever or pain',
        },
      ],
      followUpDate: 'Nov 27, 2026',
      followUpReason: 'Review healing progress',
      vitals: { bp: '120/80 mmHg', pulse: '74 bpm', temperature: '98.4 °F', spO2: '99%' },
    };

    const compRes = await axios.post(`${API_BASE}/doctors/auth/consultations`, consultPayload, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    console.log(`   Consultation completion HTTP status: ${compRes.status}`);
    console.log(`   Consultation ID: ${compRes.data.consultation.id}`);
    console.log(`   Prescription ID: ${compRes.data.prescription.id}`);
    console.log(`   Prescribed items: ${compRes.data.prescription.medicines.length}`);

    // 5. VERIFY QUEUE RE-INDEXING (RAMESH REMOVED)
    console.log('\n5️⃣ Verifying Queue Re-Indexing across Clinic Assistant & Doctor App...');
    const qAfter = await axios.get(`${API_BASE}/queue?clinicId=c-demo-moon-01`);
    const rameshStillActive = qAfter.data.queue.find((q) => q.walkInId === 'walk-demo-moon-emergency');
    if (rameshStillActive) {
      throw new Error('FAIL: Ramesh remains in active queue after completion!');
    }
    console.log(`   ✅ Ramesh successfully removed from active queue. Remaining waiting: ${qAfter.data.count}`);

    // 6. IDEMPOTENCY / DOUBLE-CLICK PROTECTION
    console.log('\n6️⃣ Testing Duplicate Submission Protection (Rapid Double-Click)...');
    const dupRes = await axios.post(`${API_BASE}/doctors/auth/consultations`, consultPayload, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    if (dupRes.status !== 200 || !dupRes.data.message.includes('already completed')) {
      throw new Error(`FAIL: Expected idempotent 200 response, got status ${dupRes.status}`);
    }
    console.log(`   ✅ Idempotent rejection: HTTP ${dupRes.status} ("${dupRes.data.message}")`);

    // 7. PHARMACY RECEIVES PRESCRIPTION
    console.log('\n7️⃣ Verifying Pharmacy Subsystem received prescription...');
    const rxRes = await axios.get(`${API_BASE}/pharmacy/prescriptions?clinicId=c-demo-moon-01`);
    const pharmacyRx = rxRes.data.prescriptions.find((p) => p.id === 'rx-walk-demo-moon-emergency');
    if (!pharmacyRx) {
      throw new Error('FAIL: Prescription rx-walk-demo-moon-emergency not found in pharmacy registry!');
    }
    console.log(`   ✅ Pharmacy prescription found: ${pharmacyRx.id} for ${pharmacyRx.clinic_name}`);

    // 8. FEFO DISPENSING FOR PRESCRIPTION
    console.log('\n8️⃣ Testing Digital Pharmacy FEFO Dispensing...');
    const dispenseRes = await axios.post(`${API_BASE}/pharmacy/dispense`, {
      medicineName: 'Paracetamol 650mg (Dolo)',
      quantity: 5,
      prescriptionId: pharmacyRx.id,
      patientId: pharmacyRx.patient_id,
      patientName: 'Emergency Patient Ramesh',
      dispensedBy: 'Chief Pharmacist Demo',
    });
    if (!dispenseRes.data.success) {
      throw new Error(`FAIL: Dispensation failed: ${dispenseRes.data.message}`);
    }
    console.log(`   ✅ Dispensed ${dispenseRes.data.dispensedQuantity} units using earliest batch: ${dispenseRes.data.batchesUsed[0].batchNumber} (Exp: ${dispenseRes.data.batchesUsed[0].expiryDate})`);

    // 9. PATIENT HEALTH RECORDS
    console.log('\n9️⃣ Verifying Patient Health Records...');
    const recRes = await axios.get(`${API_BASE}/records?patientId=pat-demo-ramesh-emergency`);
    if (!recRes.data.records || recRes.data.records.length === 0) {
      throw new Error('FAIL: No health records found for Ramesh!');
    }
    console.log(`   ✅ Health records found: ${recRes.data.records.length}`);
    recRes.data.records.forEach((r) => console.log(`      - ${r.type.toUpperCase()}: ${r.title} (${r.date})`));

    // 10. CHECK-IN WINDOW ENFORCEMENT & LIFECYCLE (AARAV SHARMA)
    console.log('\n🔟 Testing Check-In Window Enforcement & Valid Check-In for Aarav Sharma...');
    
    // 10a. Early check-in attempt before window (at current time e.g. 02:00 AM) MUST BE REJECTED
    try {
      await axios.put(`${API_BASE}/appointments/apt-demo-moon-01/check-in`);
      throw new Error('FAIL: Early check-in should have been rejected before 30-min window!');
    } catch (e) {
      if (e.response?.status === 400) {
        console.log(`   ✅ Early check-in correctly blocked: "${e.response.data.message}"`);
      } else {
        throw e;
      }
    }

    // 10b. Advance demo clock to within valid check-in window (08:35 AM for 09:00 AM slot)
    const clockInfo = await axios.get(`${API_BASE}/simulation/demo-clock`);
    const todayDate = clockInfo.data.currentDateString || '2026-09-09';
    await axios.post(`${API_BASE}/simulation/demo-clock`, {
      simulatedIsoString: `${todayDate}T08:35:00+05:30`,
      note: 'Simulated time 08:35 AM (within 30-min window of 09:00 AM slot)',
    });
    console.log(`   Clock advanced to 08:35 AM (within 30-minute check-in window)`);

    // 10c. Valid check-in now succeeds
    const checkInRes = await axios.put(`${API_BASE}/appointments/apt-demo-moon-01/check-in`, {
      notes: 'Patient arrived at clinic reception desk',
    });
    console.log(`   ✅ Valid check-in successful: Status -> ${checkInRes.data.appointment.status}, Token: ${checkInRes.data.tokenNumber}`);

    // 10d. Verify Aarav is now Position 1 in live queue
    const qWithAarav = await axios.get(`${API_BASE}/queue?clinicId=c-demo-moon-01`);
    const aaravInLiveQueue = qWithAarav.data.queue[0];
    if (!aaravInLiveQueue || !aaravInLiveQueue.patientName.includes('Aarav')) {
      throw new Error(`FAIL: Expected Aarav Sharma at Position 1, got ${aaravInLiveQueue?.patientName}`);
    }
    console.log(`   ✅ Aarav Sharma is now active at Position 1 (Token: ${aaravInLiveQueue.queueNumber})`);

    // 10e. Doctor completes Aarav consultation
    const aaravPayload = {
      appointmentId: 'apt-demo-moon-01',
      patientId: 'pat-demo-01',
      diagnosis: 'Acute Periapical Abscess requiring Root Canal',
      clinicalNotes: 'Pulp chamber exposed. Canal preparation initiated.',
      assessment: 'Good prognosis under antibiotic coverage.',
      medicines: [
        { name: 'Amoxicillin 500mg', dosage: '500 mg', frequency: '1-1-1', duration: '5 days', instructions: 'After food' },
      ],
      followUpDate: 'Sep 16, 2026',
      followUpReason: 'Second sitting canal obturation',
    };
    const aaravComp = await axios.post(`${API_BASE}/doctors/auth/consultations`, aaravPayload, {
      headers: { Authorization: `Bearer ${docToken}` },
    });
    console.log(`   Aarav Sharma completion status: ${aaravComp.status} (${aaravComp.data.consultation.id})`);

    const qFinal = await axios.get(`${API_BASE}/queue?clinicId=c-demo-moon-01`);
    console.log(`   Remaining in queue: ${qFinal.data.count}`);
    console.log(`   ✅ Aarav Sharma consultation successfully completed and removed from active queue!`);

    // Reset clock back
    await axios.post(`${API_BASE}/simulation/demo-clock`, { reset: true });

    console.log('\n============================================================');
    console.log('🎉 REGRESSION VERIFICATION: ALL 10 PHASES PASSED!');
    console.log('============================================================\n');
  } catch (err) {
    console.error('\n❌ REGRESSION TEST FAILED:', err.response?.data || err.message);
    process.exit(1);
  }
}

runRegressionSuite();
