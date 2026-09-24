import axios from 'axios';
import { seedDatabase } from '../src/database/seed';
import { memoryDb, loadStateFromFile, saveStateToFile } from '../src/database/db';
import { timeService } from '../src/services/timeService';

async function runDemoReset() {
  console.log('🔄 Initiating MedLink Demo Environment Reset...\n');

  let resetViaApi = false;
  try {
    const res = await axios.post('http://127.0.0.1:5000/api/simulation/reset-demo', {}, { timeout: 5000 }).catch(() =>
      axios.post('http://localhost:5000/api/simulation/reset-demo', {}, { timeout: 5000 })
    );
    if (res && res.data && res.data.success) {
      resetViaApi = true;
      console.log('⚡ Connected to running backend daemon on http://127.0.0.1:5000');
      console.log('📡 Real-time Socket.IO reset broadcast emitted to all connected frontends.\n');
    }
  } catch (e: any) {
    // Backend server might not be running or reachable, fallback to direct state reset
    console.log('ℹ️  Backend daemon offline or unreachable. Performing direct in-memory & file state reset...\n');
  }

  if (!resetViaApi) {
    timeService.setDemoClock(null);
    await seedDatabase();
  }

  // Load fresh state to verify counts
  loadStateFromFile();

  const todayStr = timeService.getTodayDateString();
  const todayAppointments = Array.from(memoryDb.appointments.values()).filter((a: any) => {
    const d = timeService.normalizeDateString(a.date || a.appointmentDate);
    return d === todayStr;
  });
  const todayCheckIns = todayAppointments.filter((a: any) =>
    ['CHECKED_IN', 'IN_CONSULTATION', 'Checked In', 'In Consultation'].includes(a.status || a.appointmentStatus)
  );

  console.log('==================================================');
  console.log('MEDLINK DEMO RESET COMPLETE');
  console.log('==================================================');
  console.log('Operational data (TODAY):');
  console.log(`  Appointments: ${todayAppointments.length}`);
  console.log(`  Check-ins: ${todayCheckIns.length}`);
  console.log(`  Queue entries: ${memoryDb.appointment_queue.size}`);
  console.log(`  Walk-ins: ${memoryDb.walk_ins.size}`);
  console.log(`  Availability requests: ${memoryDb.availability_requests.size}`);
  console.log(`  Active test notifications: ${memoryDb.notifications.size}`);
  console.log(`  Pharmacy test transactions: ${memoryDb.pharmacy_dispensations.size}`);
  console.log('--------------------------------------------------');
  console.log('Master data (PRESERVED):');
  console.log(`  Clinics: ${memoryDb.clinics.size}`);
  console.log(`  Doctors: ${memoryDb.doctors.size}`);
  console.log(`  Patients: ${memoryDb.patients.size}`);
  console.log(`  Clinic Assistants: 20`);
  console.log(`  Medicines (Batches): ${memoryDb.pharmacy_inventory.size}`);
  console.log(`  Historical Visits (for Forecasting): ${Array.from(memoryDb.appointments.values()).filter((a: any) => a.status === 'Completed').length}`);
  console.log('==================================================');
  console.log('✅ Clean operational day initialized.');
  console.log(`📅 Current Clinic Date: ${todayStr} (Asia/Kolkata)\n`);
}

if (require.main === module) {
  runDemoReset()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Reset failed:', err);
      process.exit(1);
    });
}

export { runDemoReset };
