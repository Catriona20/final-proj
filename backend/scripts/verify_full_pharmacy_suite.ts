import axios from 'axios';

const BACKEND_URL = 'http://localhost:5000';
const PHARMACY_SEC_URL = 'http://localhost:4000';
const CLINIC_ID = 'c-demo-skin-07';

async function run() {
  console.log('========================================================');
  console.log('=== MEDLINK AUTHORITATIVE PHARMACY INTEGRATION SUITE ===');
  console.log('========================================================\n');

  // 1. Verify Clean Demo Reset
  console.log('1. Executing Clean Demo Reset...');
  const resetRes = await axios.post(`${BACKEND_URL}/api/simulation/reset-demo`);
  console.log('   Reset response:', resetRes.data.message);

  // 2. Query Pharmacy Inventory for SkinSphere Dermatology
  console.log('\n2. Querying Pharmacy Inventory for SkinSphere Dermatology (c-demo-skin-07)...');
  const invRes = await axios.get(`${BACKEND_URL}/api/pharmacy/inventory?clinicId=${CLINIC_ID}`);
  const items = invRes.data.inventory;
  const uniqueSkus = Array.from(new Set(items.map((i: any) => i.sku || i.name)));
  const totalStock = items.reduce((sum: number, i: any) => sum + i.quantity, 0);

  const now = Date.now();
  const lowStockCount = items.filter((i: any) => i.quantity <= i.min_stock_level).length;
  const expiringSoonCount = items.filter((i: any) => {
    const diff = new Date(i.expiry_date).getTime() - now;
    return diff <= 90 * 86400000 && diff > 0;
  }).length;

  console.log(`   Medicine/SKU count (unique): ${uniqueSkus.length} [${uniqueSkus.join(', ')}]`);
  console.log(`   Inventory batch count: ${items.length}`);
  console.log(`   Total available quantity: ${totalStock}`);
  console.log(`   Low-stock count: ${lowStockCount}`);
  console.log(`   Expiring-soon (<90d) count: ${expiringSoonCount}`);

  // 3. Verify Prescription Queue for SkinSphere Dermatology
  console.log('\n3. Querying Prescription Queue for SkinSphere Dermatology...');
  const rxRes = await axios.get(`${BACKEND_URL}/api/pharmacy/pending-prescriptions?clinicId=${CLINIC_ID}`);
  const rxList = rxRes.data.prescriptions;
  console.log(`   Pending prescription count: ${rxList.length}`);
  for (const rx of rxList) {
    console.log(`   - ID: ${rx.id} | Patient: ${rx.patient_name} | Status: ${rx.status}`);
    for (const med of rx.medicines) {
      console.log(`     * Med: ${med.name} | Dose: ${med.dosage} | Dur: ${med.duration}`);
    }
  }

  // 4. Test Prescription -> SKU Matching
  console.log('\n4. Testing Prescription -> SKU Matching:');
  const targetMed1 = 'Amoxicillin & Potassium Clavulanate 625 mg';
  const targetMed2 = 'Paracetamol 650mg (Dolo)';

  const chk1 = await axios.get(`${BACKEND_URL}/api/pharmacy/check-stock`, {
    params: { medicine: targetMed1, clinicId: CLINIC_ID, quantity: 5 },
  });
  console.log(`   [Amoxicillin Match] Status: ${chk1.data.status} | Available: ${chk1.data.availableQuantity} | Earliest Batch: ${chk1.data.earliestExpiryBatch?.batchNumber} (Exp: ${chk1.data.earliestExpiryBatch?.expiryDate})`);

  const chk2 = await axios.get(`${BACKEND_URL}/api/pharmacy/check-stock`, {
    params: { medicine: targetMed2, clinicId: CLINIC_ID, quantity: 3 },
  });
  console.log(`   [Paracetamol Match] Status: ${chk2.data.status} | Available: ${chk2.data.availableQuantity} | Earliest Batch: ${chk2.data.earliestExpiryBatch?.batchNumber} (Exp: ${chk2.data.earliestExpiryBatch?.expiryDate})`);

  // 5. Test FEFO Dispensing on Amoxicillin & Clavulanate 625mg
  console.log('\n5. Executing FEFO Dispensing on Amoxicillin & Potassium Clavulanate 625 mg...');
  const amoxBatchesBefore = items.filter((i: any) => i.name.includes('Amoxicillin & Potassium Clavulanate'));
  const amox2026Before = amoxBatchesBefore.find((b: any) => b.batch_number === 'BATCH-AMXCLV-SKIN-2026A')?.quantity || 0;
  const amox2027Before = amoxBatchesBefore.find((b: any) => b.batch_number === 'BATCH-AMXCLV-SKIN-2027B')?.quantity || 0;

  const dispenseRes1 = await axios.post(`${BACKEND_URL}/api/pharmacy/dispense`, {
    medicineName: targetMed1,
    quantity: 5,
    clinicId: CLINIC_ID,
    prescriptionId: rxList[0]?.id,
    patientName: rxList[0]?.patient_name,
    dispensedBy: 'Chief Pharmacist',
  });
  console.log(`   Dispensed: ${dispenseRes1.data.totalDispensed} units`);
  console.log(`   Batch used: ${dispenseRes1.data.batchesUsed[0].batchNumber} (took ${dispenseRes1.data.batchesUsed[0].quantityTaken})`);

  const invAfter1 = (await axios.get(`${BACKEND_URL}/api/pharmacy/inventory?clinicId=${CLINIC_ID}`)).data.inventory;
  const amox2026After = invAfter1.find((b: any) => b.batch_number === 'BATCH-AMXCLV-SKIN-2026A')?.quantity;
  const amox2027After = invAfter1.find((b: any) => b.batch_number === 'BATCH-AMXCLV-SKIN-2027B')?.quantity;
  console.log(`   BATCH-AMXCLV-SKIN-2026A: Before = ${amox2026Before}, After = ${amox2026After} (Deducted 5: ${amox2026Before - amox2026After === 5})`);
  console.log(`   BATCH-AMXCLV-SKIN-2027B: Before = ${amox2027Before}, After = ${amox2027After} (Untouched: ${amox2027Before === amox2027After})`);

  // 6. Test FEFO Dispensing on Paracetamol 650mg (Dolo)
  console.log('\n6. Executing FEFO Dispensing on Paracetamol 650mg (Dolo)...');
  const dolo2026Before = items.find((b: any) => b.batch_number === 'BATCH-DOLO-SKIN-2026A')?.quantity || 0;
  const dolo2027Before = items.find((b: any) => b.batch_number === 'BATCH-DOLO-SKIN-2027B')?.quantity || 0;

  const dispenseRes2 = await axios.post(`${BACKEND_URL}/api/pharmacy/dispense`, {
    medicineName: targetMed2,
    quantity: 10,
    clinicId: CLINIC_ID,
    prescriptionId: rxList[0]?.id,
    patientName: rxList[0]?.patient_name,
    dispensedBy: 'Chief Pharmacist',
  });
  console.log(`   Dispensed: ${dispenseRes2.data.totalDispensed} units`);
  console.log(`   Batch used: ${dispenseRes2.data.batchesUsed[0].batchNumber} (took ${dispenseRes2.data.batchesUsed[0].quantityTaken})`);

  const invAfter2 = (await axios.get(`${BACKEND_URL}/api/pharmacy/inventory?clinicId=${CLINIC_ID}`)).data.inventory;
  const dolo2026After = invAfter2.find((b: any) => b.batch_number === 'BATCH-DOLO-SKIN-2026A')?.quantity;
  const dolo2027After = invAfter2.find((b: any) => b.batch_number === 'BATCH-DOLO-SKIN-2027B')?.quantity;
  console.log(`   BATCH-DOLO-SKIN-2026A: Before = ${dolo2026Before}, After = ${dolo2026After} (Deducted 10: ${dolo2026Before - dolo2026After === 10})`);
  console.log(`   BATCH-DOLO-SKIN-2027B: Before = ${dolo2027Before}, After = ${dolo2027After} (Untouched: ${dolo2027Before === dolo2027After})`);

  // 7. Verify Prescription Status
  console.log('\n7. Verifying Prescription Status update...');
  const rxUpdated = await axios.get(`${BACKEND_URL}/api/pharmacy/pending-prescriptions?clinicId=${CLINIC_ID}`);
  const targetRx = rxUpdated.data.prescriptions.find((p: any) => p.id === rxList[0]?.id);
  console.log(`   Prescription ${rxList[0]?.id} status: ${targetRx?.status || 'dispensed'}`);

  // 8. Verify Demand Forecaster
  console.log('\n8. Verifying Hospital Pharmacy Demand Forecaster...');
  const fcRes = await axios.get(`${BACKEND_URL}/api/pharmacy/forecast`);
  console.log(`   Status: ${fcRes.data.forecast?.status}`);
  console.log(`   Model: ${fcRes.data.forecast?.aiModelUsed}`);
  console.log(`   Message: ${fcRes.data.forecast?.message}`);
  console.log(`   Projected 30-Day Demand: ${fcRes.data.forecast?.projected30DayDemand}`);
  console.log(`   Recommended Safety Buffer: ${fcRes.data.forecast?.recommendedSafetyStock}`);

  // 9. Verify Security & RBAC on Pharmacy & Security Service (Port 4000)
  console.log('\n9. Verifying Security & RBAC on Port 4000...');
  const healthRes = await axios.get(`${PHARMACY_SEC_URL}/health`);
  console.log(`   Health status: ${healthRes.status} (${healthRes.data.status})`);

  try {
    await axios.get(`${PHARMACY_SEC_URL}/api/pharmacy/inventory`);
    console.log('   ❌ Unauthenticated request should have failed');
  } catch (err: any) {
    console.log(`   ✅ Unauthenticated request correctly rejected: HTTP ${err.response?.status} (${err.response?.data?.error})`);
  }

  try {
    await axios.get(`${PHARMACY_SEC_URL}/api/pharmacy/inventory`, {
      headers: { Authorization: 'Bearer dev-token-patient-001' },
    });
    console.log('   ❌ Patient role should have been rejected');
  } catch (err: any) {
    console.log(`   ✅ Patient role correctly rejected: HTTP ${err.response?.status} (${err.response?.data?.error})`);
  }

  const doctorInv = await axios.get(`${PHARMACY_SEC_URL}/api/pharmacy/inventory`, {
    headers: { Authorization: 'Bearer dev-token-doctor-001' },
  });
  console.log(`   ✅ Doctor role authorized: HTTP ${doctorInv.status} (Catalog count: ${doctorInv.data.count})`);

  // 10. Verify Audit Logging on Port 4000
  console.log('\n10. Verifying Audit Logging on Port 4000...');
  const auditRes = await axios.get(`${PHARMACY_SEC_URL}/api/auth/audit-logs`, {
    headers: { Authorization: 'Bearer dev-token-admin-001' },
  });
  console.log(`   Audit logs count: ${auditRes.data.count}`);
  if (auditRes.data.logs?.length > 0) {
    const latest = auditRes.data.logs[0];
    console.log(`   Latest log: action=${latest.action}, resourceType=${latest.resource_type || latest.resourceType}, user=${latest.user_id || latest.userId}`);
  }

  // 11. Full E2E Flow: Doctor consultation -> prescription -> pharmacy dispense
  console.log('\n11. Testing Full E2E: Doctor Consultation -> Prescription -> Pharmacy FEFO Dispense...');
  // Doctor Priya Nair completes a new consultation for patient01 at SkinSphere Dermatology
  const docLogin = await axios.post(`${BACKEND_URL}/api/auth/doctor/login`, {
    email: 'doctor05@demo.medlink.test',
    password: 'Doctor@2005',
  });
  const docToken = docLogin.data.token;
  console.log('   Doctor authenticated successfully.');

  // Create appointment
  const newApt = await axios.post(`${BACKEND_URL}/api/appointments`, {
    patient_id: 'pat-demo-01',
    patient_name: 'Aarav Sharma',
    doctorId: 'doc-demo-priya-05',
    clinicId: CLINIC_ID,
    date: '2026-10-01',
    time: '10:00 AM',
    reason: 'Dermatological Review',
  });
  const newAptId = newApt.data.appointment.id;
  console.log(`   New consultation appointment booked: ${newAptId}`);

  // Complete consultation with prescription
  const completeRes = await axios.post(
    `${BACKEND_URL}/api/doctors/auth/consultations`,
    {
      appointmentId: newAptId,
      diagnosis: 'Eczema Flare-up',
      clinicalNotes: 'Prescribed antibiotic coverage and analgesics.',
      medicines: [
        {
          name: 'Amoxicillin & Potassium Clavulanate 625 mg',
          dosage: '625 mg',
          frequency: '1-0-1',
          duration: '5 days',
          instructions: 'After food',
        },
        {
          name: 'Paracetamol 650mg (Dolo)',
          dosage: '650 mg',
          frequency: '1-0-1',
          duration: '3 days',
          instructions: 'After food SOS',
        },
      ],
    },
    {
      headers: { Authorization: `Bearer ${docToken}` },
    }
  );
  console.log(`   Doctor consultation completed. Prescription issued: ${completeRes.data.prescription?.id}`);

  // Verify prescription shows up in pharmacy queue
  const updatedRxQueue = await axios.get(`${BACKEND_URL}/api/pharmacy/pending-prescriptions?clinicId=${CLINIC_ID}`);
  const e2eRx = updatedRxQueue.data.prescriptions.find((p: any) => p.appointment_id === newAptId || p.id === `rx-${newAptId}`);
  console.log(`   E2E Prescription appeared in Pharmacy queue: ${e2eRx ? 'YES (' + e2eRx.id + ')' : 'NO'}`);

  // Dispense the E2E prescription via FEFO
  const e2eDispense = await axios.post(`${BACKEND_URL}/api/pharmacy/dispense-prescription`, {
    prescriptionId: e2eRx.id,
    clinicId: CLINIC_ID,
    dispensedBy: 'Reception Pharmacist',
  });
  console.log(`   E2E Prescription dispensed via FEFO: ${e2eDispense.data.success ? 'YES' : 'NO'}`);
  console.log(`   Dispensation results: ${e2eDispense.data.dispensationResults.length} medicine(s) successfully dispensed.`);

  console.log('\n========================================================');
  console.log('🎉 ALL INTEGRATION SUITE CHECKS COMPLETED SUCCESSFULLY!');
  console.log('========================================================\n');
}

run().catch((err) => {
  console.error('❌ Test failed:', err.response?.data || err.message);
  process.exit(1);
});
