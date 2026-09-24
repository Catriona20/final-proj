import axios from 'axios';
import { memoryDb, loadStateFromFile } from '../src/database/db';
import { timeService } from '../src/services/timeService';

async function runDemoStatus() {
  console.log('📊 Querying MedLink System State...\n');

  let onlineData: any = null;
  try {
    const res = await axios.get('http://localhost:5000/api/dashboard', { timeout: 2000 });
    if (res.data && res.data.success) {
      onlineData = res.data;
    }
  } catch {
    // offline or backend not ready
  }

  loadStateFromFile();
  const todayStr = timeService.getTodayDateString();

  const allApts = Array.from(memoryDb.appointments.values());
  const todayApts = allApts.filter((a: any) => {
    const d = timeService.normalizeDateString(a.date || a.appointmentDate);
    return d === todayStr;
  });
  const todayCheckedIn = todayApts.filter((a: any) =>
    ['CHECKED_IN', 'IN_CONSULTATION', 'Checked In', 'In Consultation'].includes(a.status || a.appointmentStatus)
  );
  const todayWaiting = todayApts.filter((a: any) =>
    ['WAITING', 'Waiting', 'CHECKED_IN', 'Checked In'].includes(a.status || a.appointmentStatus)
  );

  console.log('==================================================');
  console.log('MEDLINK DEMO DATA STATUS REPORT');
  console.log('==================================================');
  console.log(`Backend Server: ${onlineData ? '🟢 ONLINE (http://localhost:5000)' : '🟡 LOCAL STORAGE (offline)'}`);
  console.log(`Clinic Clock Date: ${todayStr} (Asia/Kolkata)`);
  console.log('--------------------------------------------------');
  console.log('MASTER ENTITIES:');
  console.log(`  Clinics: ${memoryDb.clinics.size}`);
  console.log(`  Doctors: ${memoryDb.doctors.size}`);
  console.log(`  Patients: ${memoryDb.patients.size}`);
  console.log(`  Clinic Assistants: 20`);
  console.log(`  Medicine Batches: ${memoryDb.pharmacy_inventory.size}`);
  console.log(`  Historical Consultations: ${memoryDb.consultations.size}`);
  console.log(`  Historical Prescriptions: ${memoryDb.prescriptions.size}`);
  console.log('--------------------------------------------------');
  console.log("TODAY'S OPERATIONAL STATE:");
  console.log(`  Total Today's Appointments: ${todayApts.length}`);
  console.log(`  Checked In: ${todayCheckedIn.length}`);
  console.log(`  Waiting Queue Entries: ${memoryDb.appointment_queue.size}`);
  console.log(`  Today's Walk-in Registrations: ${memoryDb.walk_ins.size}`);
  console.log(`  Pending Availability Requests: ${memoryDb.availability_requests.size}`);
  console.log(`  In-App Notifications: ${memoryDb.notifications.size}`);
  console.log(`  Pharmacy Dispensations: ${memoryDb.pharmacy_dispensations.size}`);
  console.log('--------------------------------------------------');
  console.log('CLINIC BREAKDOWN (Sample):');
  const sampleClinics = [
    { id: 'c-demo-moon-01', name: 'Moon Dental & Medical Clinic' },
    { id: 'c-demo-apollo-02', name: 'Apollo Family Care Centre' },
    { id: 'c-demo-greenlife-03', name: "GreenLife Women's & Maternity Clinic" },
  ];
  for (const c of sampleClinics) {
    const cApts = todayApts.filter((a: any) => a.clinic_id === c.id || a.clinic_name?.toLowerCase().includes(c.id.toLowerCase()));
    const cWalks = Array.from(memoryDb.walk_ins.values()).filter((w: any) => w.clinic_id === c.id);
    console.log(`  [${c.name} (${c.id})]:`);
    console.log(`    Today's Appointments: ${cApts.length} | Walk-ins: ${cWalks.length}`);
  }
  console.log('==================================================\n');
}

if (require.main === module) {
  runDemoStatus()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Status report error:', err);
      process.exit(1);
    });
}

export { runDemoStatus };
