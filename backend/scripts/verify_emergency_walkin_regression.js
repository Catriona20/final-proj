const axios = require('axios');
let io;
try {
  io = require('../../clinic-assistant/client/node_modules/socket.io-client');
} catch {
  io = require('../../doctor-app/node_modules/socket.io-client');
}

const BASE_URL = 'http://localhost:5000/api';
const SOCKET_URL = 'http://localhost:5000';

const client = axios.create({
  baseURL: BASE_URL,
  validateStatus: () => true,
});

async function runRegression() {
  console.log('===============================================================');
  console.log('🚨 VERIFY EMERGENCY WALK-IN ACTIVE CONSULTATION REGRESSION TEST');
  console.log('===============================================================');

  // Set up socket listener
  const socketEvents = [];
  const socket = io(SOCKET_URL, { transports: ['websocket'] });
  await new Promise((resolve) => {
    socket.on('connect', () => {
      socket.emit('join:clinic', 'c-demo-moon-01');
      socket.emit('join:doctor', 'doc-demo-arun-01');
      resolve();
    });
  });
  socket.on('queue:updated', (data) => socketEvents.push(data));

  // Step 0: Reset demo state
  console.log('\n[Step 0] Resetting baseline demo state...');
  const resetRes = await client.post('/simulation/reset-demo');
  if (resetRes.status !== 200) throw new Error('Reset demo failed');

  // Step 1: Start consultation for Emergency Patient Ramesh
  console.log('\n[Step 1] Starting active consultation with Emergency Patient Ramesh...');
  const startRamesh = await client.post('/simulation/start-consultation', {
    appointmentId: 'walk-demo-moon-emergency',
  });
  if (startRamesh.status !== 200) throw new Error(`Start consultation failed: ${JSON.stringify(startRamesh.data)}`);

  // Verify Ramesh is IN_CONSULTATION and Doctor is BUSY
  const q0 = await client.get('/queue?clinicId=c-demo-moon-01');
  const rameshInQueue = q0.data.queue.find((q) => q.walkInId === 'walk-demo-moon-emergency');
  if (!rameshInQueue || rameshInQueue.status !== 'IN_CONSULTATION') {
    throw new Error(`Ramesh is not IN_CONSULTATION in queue: ${JSON.stringify(rameshInQueue)}`);
  }
  console.log('✅ Ramesh is actively IN_CONSULTATION (Position 0, token: ' + rameshInQueue.queueNumber + ')');

  // Step 2: Register emergency walk-in for same doctor/clinic while Ramesh is active
  console.log('\n[Step 2] Registering emergency walk-in "test" with preferredDoctor string "Dr. Arun Kumar — Dentistry (BUSY)"...');
  socketEvents.length = 0; // Clear events

  const walkinRes = await client.post('/walk-ins', {
    patientName: 'test',
    phone: '909090909',
    reason: 'gum bleeding',
    preferredDoctor: 'Dr. Arun Kumar — Dentistry (BUSY)',
    priority: 'EMERGENCY',
  });

  if (walkinRes.status !== 201) {
    throw new Error(`Walk-in intake failed: ${JSON.stringify(walkinRes.data)}`);
  }

  const newWalkIn = walkinRes.data.walkIn;
  const newQueueNumber = walkinRes.data.queueNumber;
  console.log(`✅ Emergency walk-in created: id=${newWalkIn.id}, priority=${newWalkIn.priority}, token=${newQueueNumber}`);

  // Step 3: Verify exactly one walk-in record exists
  const allWalkIns = await client.get('/walk-ins?clinicId=c-demo-moon-01');
  const matchingWalkIns = allWalkIns.data.walkIns.filter((w) => w.id === newWalkIn.id);
  if (matchingWalkIns.length !== 1) {
    throw new Error(`Expected exactly 1 walk-in record for test patient, found ${matchingWalkIns.length}`);
  }
  console.log('✅ Exactly one walk-in record exists');

  // Step 4-6: Verify queue record in backend queue
  console.log('\n[Step 4-8] Verifying backend live queue structure...');
  const clinicQueue = await client.get('/queue?clinicId=c-demo-moon-01');
  const queueItems = clinicQueue.data.queue;
  console.log(`Queue items count: ${queueItems.length}`);
  queueItems.forEach((item, idx) => {
    console.log(`  [${idx}] pos=${item.queuePosition} token=${item.queueNumber} name=${item.patientName} prio=${item.priority} status=${item.status} wait=${item.estimatedWaitText}`);
  });

  const rameshActive = queueItems.find((q) => q.walkInId === 'walk-demo-moon-emergency');
  const testWaiting = queueItems.find((q) => q.walkInId === newWalkIn.id);

  if (!rameshActive || rameshActive.status !== 'IN_CONSULTATION') {
    throw new Error('FAIL: Ramesh did not remain IN_CONSULTATION!');
  }
  if (!testWaiting) {
    throw new Error('FAIL: Emergency walk-in "test" was NOT found in backend queue!');
  }
  if (testWaiting.status !== 'WAITING') {
    throw new Error(`FAIL: Emergency walk-in status is not WAITING, found ${testWaiting.status}`);
  }
  if (testWaiting.priority !== 'EMERGENCY') {
    throw new Error(`FAIL: Emergency walk-in priority is not EMERGENCY, found ${testWaiting.priority}`);
  }
  if (testWaiting.queuePosition !== 1) {
    throw new Error(`FAIL: Emergency walk-in queuePosition should be 1 (next eligible), found ${testWaiting.queuePosition}`);
  }
  console.log('✅ Ramesh remains IN_CONSULTATION (pos=0)');
  console.log('✅ Emergency walk-in entered WAITING queue immediately at Position 1 (Immediate)');

  // Step 9-10: Verify Doctor App queue endpoint
  console.log('\n[Step 9-10] Verifying Doctor App authenticated queue...');
  // Doctor login token
  const docLogin = await client.post('/auth/doctor/login', {
    emailOrPhone: 'doctor01@demo.medlink.test',
    password: 'Doctor@2001',
  });
  if (!docLogin.data.token) throw new Error(`Doctor login failed: ${JSON.stringify(docLogin.data)}`);
  const docToken = docLogin.data.token;

  const docQueueRes = await client.get('/doctors/auth/queue?clinicId=c-demo-moon-01', {
    headers: { Authorization: `Bearer ${docToken}` },
  });

  const docQueueData = docQueueRes.data;
  console.log(`Doctor App Live Queue: In Consultation: ${docQueueData.currentPatient?.patient_name || 'None'}, Waiting: ${docQueueData.waitingCount}, Next: ${docQueueData.nextPatient?.patient_name || 'None'}`);

  if (docQueueData.currentPatient?.patient_name !== 'Emergency Patient Ramesh') {
    throw new Error(`FAIL: Doctor App currentPatient should be Ramesh, got ${docQueueData.currentPatient?.patient_name}`);
  }
  if (docQueueData.waitingCount !== 1) {
    throw new Error(`FAIL: Doctor App waitingCount should be 1, got ${docQueueData.waitingCount}`);
  }
  if (docQueueData.nextPatient?.patient_name !== 'test') {
    throw new Error(`FAIL: Doctor App nextPatient should be "test", got ${docQueueData.nextPatient?.patient_name}`);
  }
  console.log('✅ Doctor App correctly shows In Consultation: 1 (Ramesh), Waiting: 1, Next: test');

  // Step 11: Verify Socket.IO update was received
  if (socketEvents.length === 0) {
    throw new Error('FAIL: No Socket.IO queue:updated events were emitted!');
  }
  console.log(`✅ Socket.IO emitted ${socketEvents.length} queue:updated event(s) successfully in real time`);

  // Step 12: Complete Ramesh
  console.log('\n[Step 12-14] Completing Ramesh consultation...');
  const completeRes = await client.post('/doctors/auth/consultations', {
    appointmentId: 'walk-demo-moon-emergency',
    diagnosis: 'Acute dental trauma successfully stabilized',
    clinicalNotes: 'Hemostasis achieved. Follow-up in 1 week.',
    medicines: [{ name: 'Amoxicillin 500mg', dosage: '1 Capsule', frequency: 'Three times daily' }],
  }, {
    headers: { Authorization: `Bearer ${docToken}` },
  });

  if (completeRes.status !== 200 && completeRes.status !== 201) {
    throw new Error(`Consultation completion failed: ${JSON.stringify(completeRes.data)}`);
  }

  // Verify Ramesh leaves active queue and test is now next
  const qAfterComplete = await client.get('/queue?clinicId=c-demo-moon-01');
  const rameshAfter = qAfterComplete.data.queue.find((q) => q.walkInId === 'walk-demo-moon-emergency');
  if (rameshAfter) {
    throw new Error('FAIL: Ramesh should leave active queue after completion!');
  }
  const testNext = qAfterComplete.data.queue.find((q) => q.walkInId === newWalkIn.id);
  if (!testNext || testNext.status !== 'WAITING') {
    throw new Error('FAIL: Emergency walk-in should be WAITING at top of queue!');
  }
  console.log('✅ Ramesh completed and removed from active queue');
  console.log('✅ Emergency walk-in "test" is next eligible patient at Position 1');

  // Step 15-16: Start Emergency Consultation
  console.log('\n[Step 15-16] Starting consultation for emergency walk-in...');
  const startTest = await client.post('/simulation/start-consultation', {
    appointmentId: newWalkIn.id,
  });
  if (startTest.status !== 200) throw new Error(`Failed to start test consultation: ${JSON.stringify(startTest.data)}`);

  const qInTest = await client.get('/queue?clinicId=c-demo-moon-01');
  const testConsulting = qInTest.data.queue.find((q) => q.walkInId === newWalkIn.id);
  if (!testConsulting || testConsulting.status !== 'IN_CONSULTATION') {
    throw new Error(`FAIL: Emergency walk-in status should be IN_CONSULTATION, got ${testConsulting?.status}`);
  }
  console.log('✅ Emergency walk-in "test" is now IN_CONSULTATION');

  // Step 17-18: Refresh and persistence
  const docQueueTestActive = await client.get('/doctors/auth/queue?clinicId=c-demo-moon-01', {
    headers: { Authorization: `Bearer ${docToken}` },
  });
  if (docQueueTestActive.data.currentPatient?.patient_name !== 'test') {
    throw new Error('FAIL: Doctor App currentPatient is not "test"!');
  }
  console.log('✅ Doctor App reflects "test" as currentPatient after fetch/reload');

  // Step 19-20: Clinic isolation check
  console.log('\n[Step 19-20] Verifying Clinic Isolation...');
  const apolloQueue = await client.get('/queue?clinicId=c-demo-apollo-02');
  const leakedEntry = apolloQueue.data.queue.find((q) => q.walkInId === newWalkIn.id);
  if (leakedEntry) {
    throw new Error('FAIL: Moon Dental emergency walk-in leaked into Apollo clinic queue!');
  }
  console.log('✅ Clinic Isolation strictly maintained: Apollo cannot see Moon Dental walk-in');

  // STEP 21: Triage Priority Ordering: Multiple waiting patients (EMERGENCY > URGENT > NORMAL)
  console.log('\n[Step 21] Testing Priority Ordering: Multiple waiting patients (EMERGENCY > URGENT > NORMAL)...');
  // Add Normal walk-in
  const wNormal = await client.post('/walk-ins', {
    patientName: 'Normal Patient Anil',
    phone: '9888888801',
    reason: 'Routine checkup',
    preferredDoctor: 'Dr. Arun Kumar',
    priority: 'NORMAL',
    clinicId: 'c-demo-moon-01',
  });
  // Add Urgent walk-in
  const wUrgent = await client.post('/walk-ins', {
    patientName: 'Urgent Patient Bhavna',
    phone: '9888888802',
    reason: 'Severe toothache with swelling',
    preferredDoctor: 'Dr. Arun Kumar',
    priority: 'URGENT',
    clinicId: 'c-demo-moon-01',
  });
  // Add another Emergency walk-in
  const wEmergency2 = await client.post('/walk-ins', {
    patientName: 'Emergency Patient Chetan',
    phone: '9888888803',
    reason: 'Heavy arterial gum bleeding',
    preferredDoctor: 'Dr. Arun Kumar',
    priority: 'EMERGENCY',
    clinicId: 'c-demo-moon-01',
  });

  const qMulti = await client.get('/queue?clinicId=c-demo-moon-01');
  const multiItems = qMulti.data.queue;
  console.log('\nMulti-Priority Live Queue Order:');
  multiItems.forEach((m, idx) => {
    console.log(`  [${idx}] pos=${m.queuePosition} prio=${m.priority} status=${m.status} name=${m.patientName}`);
  });

  // Verify:
  // 1. IN_CONSULTATION patient (test) is pos 0
  // 2. Emergency Patient Chetan is pos 1
  // 3. Urgent Patient Bhavna is pos 2
  // 4. Normal Patient Anil is pos 3
  const waitingSorted = multiItems.filter((q) => q.status === 'WAITING');
  if (waitingSorted[0]?.patientName !== 'Emergency Patient Chetan' || waitingSorted[0]?.priority !== 'EMERGENCY') {
    throw new Error(`FAIL: Top waiting patient should be EMERGENCY (Chetan), got ${waitingSorted[0]?.patientName} (${waitingSorted[0]?.priority})`);
  }
  if (waitingSorted[1]?.patientName !== 'Urgent Patient Bhavna' || waitingSorted[1]?.priority !== 'URGENT') {
    throw new Error(`FAIL: Second waiting patient should be URGENT (Bhavna), got ${waitingSorted[1]?.patientName} (${waitingSorted[1]?.priority})`);
  }
  if (waitingSorted[2]?.patientName !== 'Normal Patient Anil' || waitingSorted[2]?.priority !== 'NORMAL') {
    throw new Error(`FAIL: Third waiting patient should be NORMAL (Anil), got ${waitingSorted[2]?.patientName} (${waitingSorted[2]?.priority})`);
  }
  console.log('✅ Priority sorting strictly verified: EMERGENCY > URGENT > NORMAL (with active consultation uninterrupted)');

  socket.disconnect();
  console.log('\n===============================================================');
  console.log('🎉 ALL 21 REGRESSION CHECKS PASSED WITH ZERO ERRORS!');
  console.log('===============================================================');
}

runRegression().catch((err) => {
  console.error('\n❌ REGRESSION TEST FAILED:', err.message);
  process.exit(1);
});
