import axios from 'axios';
import { memoryDb } from '../database/db';
import { seedPresentationData } from '../database/seed';
import { startServer } from '../server';

const API_BASE = 'http://localhost:5000/api';
const ROOT_BASE = 'http://localhost:5000';

const ensureServerRunning = async () => {
  try {
    await axios.get(`${ROOT_BASE}/health`, { timeout: 1000 });
  } catch (e) {
    console.log('🚀 Starting server on port 5000 for data integrity tests...');
    await startServer();
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
};

const runDataIntegrityTests = async () => {
  console.log('====================================================');
  console.log('🔬 MEDLINK FYP — DATA INTEGRITY & RELATIONAL VALIDATION');
  console.log('====================================================\n');

  await ensureServerRunning();

  // Re-seed to ensure pristine demo state on both server and test process
  console.log('🌱 Ensuring baseline presentation dataset is seeded...');
  await axios.post(`${API_BASE}/simulation/seed-demo`);
  const seedSummary = await seedPresentationData();

  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testNum: number, desc: string, details?: any) => {
    if (condition) {
      console.log(`✅ Test ${testNum}: ${desc}`);
      if (details) console.log(`   ℹ️ ${JSON.stringify(details)}`);
      passed++;
    } else {
      console.error(`❌ Test ${testNum}: ${desc}`);
      if (details) console.error(`   ⚠️ Details:`, details);
      failed++;
    }
  };

  try {
    // 1. Total seeded records between 200 and 250
    const totalCount = seedSummary.totalCount;
    assert(
      totalCount >= 200 && totalCount <= 250,
      1,
      `Total seeded records between 200 and 250 (Actual: ${totalCount})`,
      {
        patients: seedSummary.patientsCount,
        clinics: seedSummary.clinicsCount,
        doctors: seedSummary.doctorsCount,
        appointments: seedSummary.appointmentsCount,
        queues: seedSummary.queuesCount,
        consultations: seedSummary.consultationsCount,
        prescriptions: seedSummary.prescriptionsCount,
        medicalReports: seedSummary.medicalReportsCount,
        total: totalCount,
      }
    );

    // 2. No duplicate IDs
    const patientIds = Array.from(memoryDb.patients.keys());
    const clinicIds = Array.from(memoryDb.clinics.keys());
    const doctorIds = Array.from(memoryDb.doctors.keys());
    const appointmentIds = Array.from(memoryDb.appointments.keys());
    const queueIds = Array.from(memoryDb.appointment_queue.keys());
    const consultationIds = Array.from(memoryDb.consultations.keys());
    const prescriptionIds = Array.from(memoryDb.prescriptions.keys());
    const fileIds = Array.from(memoryDb.medical_files.keys());

    const hasNoDuplicates = (arr: any[]) => new Set(arr).size === arr.length;
    const allUnique =
      hasNoDuplicates(patientIds) &&
      hasNoDuplicates(clinicIds) &&
      hasNoDuplicates(doctorIds) &&
      hasNoDuplicates(appointmentIds) &&
      hasNoDuplicates(queueIds) &&
      hasNoDuplicates(consultationIds) &&
      hasNoDuplicates(prescriptionIds) &&
      hasNoDuplicates(fileIds);

    assert(allUnique && seedSummary.duplicateIds === 0, 2, 'No duplicate IDs across all collections');

    // 3. No orphan appointments
    const appointments = Array.from(memoryDb.appointments.values());
    const orphanApts = appointments.filter((apt: any) => {
      const p = memoryDb.patients.has(apt.patient_id);
      const d = memoryDb.doctors.has(apt.doctor_id);
      const c = memoryDb.clinics.has(apt.clinic_id);
      return !p || !d || !c;
    });
    assert(orphanApts.length === 0, 3, 'No orphan appointments (all have valid patient, doctor, clinic)');

    // 4. No orphan queues
    const queues = Array.from(memoryDb.appointment_queue.values());
    const orphanQueues = queues.filter((q: any) => {
      const aptExists = memoryDb.appointments.has(q.appointment_id);
      const docExists = memoryDb.doctors.has(q.doctor_id);
      const clinicExists = memoryDb.clinics.has(q.clinic_id);
      return !aptExists || !docExists || !clinicExists;
    });
    assert(orphanQueues.length === 0, 4, 'No orphan queues (all reference valid appointments, doctors, clinics)');

    // 5. No orphan consultations
    const consultations = Array.from(memoryDb.consultations.values());
    const orphanConsultations = consultations.filter((c: any) => {
      const aptExists = memoryDb.appointments.has(c.appointment_id);
      const patExists = memoryDb.patients.has(c.patient_id);
      const docExists = memoryDb.doctors.has(c.doctor_id);
      return !aptExists || !patExists || !docExists;
    });
    assert(orphanConsultations.length === 0, 5, 'No orphan consultations (all reference valid appointment, patient, doctor)');

    // 6. No orphan prescriptions
    const prescriptions = Array.from(memoryDb.prescriptions.values());
    const orphanPrescriptions = prescriptions.filter((rx: any) => {
      const patExists = memoryDb.patients.has(rx.patient_id);
      const docExists = memoryDb.doctors.has(rx.doctor_id);
      return !patExists || !docExists;
    });
    assert(orphanPrescriptions.length === 0, 6, 'No orphan prescriptions (all reference valid patient, doctor)');

    // 7. No orphan medical records
    const files = Array.from(memoryDb.medical_files.values());
    const orphanFiles = files.filter((f: any) => !memoryDb.patients.has(f.patient_id));
    assert(orphanFiles.length === 0, 7, 'No orphan medical records (all reference valid patient)');

    // 8. Every appointment references an existing patient
    const allAptsHaveValidPatients = appointments.every((apt: any) => memoryDb.patients.has(apt.patient_id));
    assert(allAptsHaveValidPatients, 8, 'Every appointment references an existing patient');

    // 9. Every appointment references an existing doctor
    const allAptsHaveValidDoctors = appointments.every((apt: any) => memoryDb.doctors.has(apt.doctor_id));
    assert(allAptsHaveValidDoctors, 9, 'Every appointment references an existing doctor');

    // 10. Every appointment references an existing clinic where supported
    const allAptsHaveValidClinics = appointments.every((apt: any) => memoryDb.clinics.has(apt.clinic_id));
    assert(allAptsHaveValidClinics, 10, 'Every appointment references an existing clinic');

    // 11. Appointment date/time is valid
    const allAptsHaveValidDateTime = appointments.every((apt: any) => {
      const aptDate = apt.appointment_date || apt.appointmentDate || apt.date;
      const aptTime = apt.start_time || apt.slotStartTime || apt.time;
      const hasDate = Boolean(aptDate) && !isNaN(new Date(aptDate).getTime());
      const hasTime = Boolean(aptTime) && aptTime.includes(':');
      return hasDate && hasTime;
    });
    assert(allAptsHaveValidDateTime, 11, 'Appointment date/time is valid (parseable date + start_time present)');

    // 12. Historical appointments appear correctly
    const completedApts = appointments.filter((apt: any) => apt.status === 'Completed');
    const allCompletedHaveHistory = completedApts.length >= 15;
    assert(
      allCompletedHaveHistory,
      12,
      `Historical appointments appear correctly (${completedApts.length} completed appointments on record)`
    );

    // 13. Active appointments have valid queue state
    const waitingQueues = queues.filter((q: any) => ['WAITING', 'Waiting'].includes(q.status));
    const inConsultationQueues = queues.filter((q: any) => ['IN_CONSULTATION', 'In Consultation'].includes(q.status));
    const validQueueStates =
      queues.length === 0 ||
      (queues.every((q: any) => ['WAITING', 'IN_CONSULTATION', 'COMPLETED', 'Waiting', 'In Consultation', 'Completed', 'Called'].includes(q.status)));
    assert(
      validQueueStates,
      13,
      `Active appointments have valid queue state (Live queue items: ${queues.length})`
    );

    // 14. Booking collision prevention works
    console.log('   Testing double booking collision prevention via API...');
    const testDocId = 'doc-demo-priya-02';
    const testClinicId = 'c-demo-apollo-02';
    const testDate = '2026-09-18';
    const testTime = '11:00 AM';

    // First booking
    const bookingRes1 = await axios.post(`${API_BASE}/appointments/book`, {
      patientId: 'pat-101',
      doctorId: testDocId,
      clinicId: testClinicId,
      date: testDate,
      time: testTime,
      slot: testTime,
      consultationType: 'OPD_VISIT',
    });

    // Attempt second booking for identical slot
    let collisionBlocked = false;
    try {
      await axios.post(`${API_BASE}/appointments/book`, {
        patientId: 'pat-demo-002',
        doctorId: testDocId,
        clinicId: testClinicId,
        date: testDate,
        time: testTime,
        slot: testTime,
        consultationType: 'OPD_VISIT',
      });
    } catch (err: any) {
      if (err.response && (err.response.status === 409 || err.response.status === 400)) {
        collisionBlocked = true;
      }
    }
    assert(
      bookingRes1.status === 201 && collisionBlocked,
      14,
      'Booking collision prevention works (first booking succeeds, duplicate returns 409/400 Conflict)'
    );

    // 15. AI patient summary works with multi-visit patients
    const aiPatientSummaryRes = await axios.post(`${API_BASE}/ai/patient-summary`, {
      patientId: 'pat-101',
    });
    const hasSummary = Boolean(aiPatientSummaryRes.data && aiPatientSummaryRes.data.success && aiPatientSummaryRes.data.summary);
    assert(hasSummary, 15, 'AI patient summary works with multi-visit patients', {
      patientId: 'pat-101',
      summary: aiPatientSummaryRes.data.summary?.clinical_narrative?.substring(0, 80) + '...',
    });

    // 16. AI consultation summary works
    const sampleConsultation: any = consultations[0];
    const aiConsultationRes = await axios.post(`${API_BASE}/ai/summarize-consultation`, {
      consultationData: {
        diagnosis: sampleConsultation.diagnosis,
        clinicalNotes: sampleConsultation.clinical_notes,
        symptoms: sampleConsultation.symptoms,
        vitals: sampleConsultation.vitals,
      },
    });
    const hasConsultSummary = Boolean(aiConsultationRes.data && aiConsultationRes.data.success && aiConsultationRes.data.summary);
    assert(hasConsultSummary, 16, 'AI consultation summary works', {
      diagnosis: sampleConsultation.diagnosis,
      impression: aiConsultationRes.data.summary?.clinical_impression,
    });

    // 17. AI prescription explanation works
    const sampleRx: any = prescriptions[0];
    const aiRxRes = await axios.post(`${API_BASE}/ai/explain-prescription`, {
      prescriptionId: sampleRx.id,
      prescriptionData: sampleRx,
    });
    const exp = aiRxRes.data?.explanation;
    const hasRxExplanation = Boolean(
      aiRxRes.data &&
        aiRxRes.data.success &&
        exp &&
        (exp.medicationGuidance || exp.medicines || exp.medications)
    );
    assert(hasRxExplanation, 17, 'AI prescription explanation works', {
      prescriptionId: sampleRx.id,
      provider: exp?.providerUsed || exp?.ai_provider,
    });

    // 18. Medical report summary works
    const sampleFile: any = files[0];
    const aiReportRes = await axios.post(`${API_BASE}/ai/summarize-report`, {
      fileId: sampleFile.id,
      patientId: sampleFile.patient_id,
      fileData: sampleFile,
    });
    const hasReportSummary = Boolean(aiReportRes.data && aiReportRes.data.success && aiReportRes.data.summary);
    assert(hasReportSummary, 18, 'Medical report summary works', {
      fileId: sampleFile.id,
      testName: sampleFile.test_name,
      summary: aiReportRes.data.summary?.summary_text,
    });

    console.log('\n====================================================');
    console.log(`🏁 DATA INTEGRITY VALIDATION COMPLETE: ${passed}/18 PASSED (${failed} FAILED)`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (error: any) {
    console.error('Fatal data integrity test error:', error);
    process.exit(1);
  }
};

runDataIntegrityTests();
