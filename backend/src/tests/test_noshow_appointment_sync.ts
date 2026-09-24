import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE = 'http://127.0.0.1:5000/api';
const SOCKET_URL = 'http://127.0.0.1:5000';

const DOCTOR_ID = 'doc-demo-priya-02';
const CLINIC_ID = 'c-demo-apollo-02';

async function runNoShowSyncTest() {
  console.log('========================================================================');
  console.log('🧪 RUNNING NO-SHOW APPOINTMENT STATE SYNCHRONIZATION TEST');
  console.log('========================================================================\n');

  // Socket.IO event capture
  const receivedSocketEvents: { event: string; data: any }[] = [];
  const socket: Socket = io(SOCKET_URL, {
    transports: ['websocket'],
    reconnection: false,
  });

  await new Promise<void>((resolve, reject) => {
    socket.on('connect', () => {
      console.log(`🔌 Connected to WebSocket: ${socket.id}`);
      socket.emit('join:clinic', CLINIC_ID);
      socket.emit('join:doctor', DOCTOR_ID);
      resolve();
    });
    socket.on('connect_error', (err) => reject(err));
  });

  socket.on('appointment:no_show', (data) => {
    receivedSocketEvents.push({ event: 'appointment:no_show', data });
  });
  socket.on('appointment:status', (data) => {
    receivedSocketEvents.push({ event: 'appointment:status', data });
  });
  socket.on('queue:updated', (data) => {
    receivedSocketEvents.push({ event: 'queue:updated', data });
  });

  try {
    // -------------------------------------------------------------------------
    // STEP 0: Reset demo state to clean baseline
    // -------------------------------------------------------------------------
    console.log('0️⃣ Resetting demo environment...');
    await axios.post(`${API_BASE}/simulation/reset-demo`);
    console.log('   ✅ Environment reset complete.');

    // -------------------------------------------------------------------------
    // STEP 1: Authenticate doctor & assistant, setup availability for today
    // -------------------------------------------------------------------------
    console.log('\n1️⃣ Setting up doctor schedule & approving availability for today...');
    const healthRes = await axios.get(`${API_BASE}/health`);
    const todayDate = healthRes.data.clinicTime?.split('T')[0] || new Date().toISOString().split('T')[0];

    const docLogin = await axios.post(`${API_BASE}/auth/doctor/login`, {
      email: 'doctor02@demo.medlink.test',
      password: 'Doctor@2002',
    });
    const docToken = docLogin.data.token;

    const asstLogin = await axios.post(`${API_BASE}/auth/assistant/login`, {
      email: 'assistant02@demo.medlink.test',
      password: 'Clinic@3002',
    });
    const asstToken = asstLogin.data.token;

    const reqRes = await axios.post(
      `${API_BASE}/availability/requests`,
      {
        doctor_id: DOCTOR_ID,
        clinic_id: CLINIC_ID,
        specialty: 'General Medicine',
        date: todayDate,
        start_time: '08:00 AM',
        end_time: '04:00 PM',
        notes: 'Morning and afternoon clinic',
      },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );
    const reqId = reqRes.data.request.id;

    await axios.post(
      `${API_BASE}/availability/requests/${reqId}/approve`,
      {},
      { headers: { Authorization: `Bearer ${docToken}` } }
    );
    console.log('   ✅ Doctor availability approved for today.');

    // -------------------------------------------------------------------------
    // STEP 2: Create 3 sequential appointments and check them into waiting queue
    // -------------------------------------------------------------------------
    console.log('\n2️⃣ Creating 3 appointments and checking in to active queue...');
    const apt1Res = await axios.post(`${API_BASE}/appointments`, {
      patientId: 'pat-101',
      patientName: 'Aarav Patel',
      doctorId: DOCTOR_ID,
      clinicId: CLINIC_ID,
      department: 'General Medicine',
      date: todayDate,
      time: '09:00 AM',
      type: 'General Consultation',
    });
    const apt1Id = apt1Res.data.appointment.id;

    const apt2Res = await axios.post(`${API_BASE}/appointments`, {
      patientId: 'pat-102',
      patientName: 'Sneha Rao',
      doctorId: DOCTOR_ID,
      clinicId: CLINIC_ID,
      department: 'General Medicine',
      date: todayDate,
      time: '09:30 AM',
      type: 'General Consultation',
    });
    const apt2Id = apt2Res.data.appointment.id;

    const apt3Res = await axios.post(`${API_BASE}/appointments`, {
      patientId: 'pat-demo-03',
      patientName: 'Vikram Malhotra',
      doctorId: DOCTOR_ID,
      clinicId: CLINIC_ID,
      department: 'General Medicine',
      date: todayDate,
      time: '10:00 AM',
      type: 'General Consultation',
    });
    const apt3Id = apt3Res.data.appointment.id;

    console.log(`   ✅ Created appointments: ${apt1Id}, ${apt2Id}, ${apt3Id}`);

    // Check in all 3 patients into the active waiting queue
    await axios.post(`${API_BASE}/appointments/${apt1Id}/check-in`, { doctorId: DOCTOR_ID });
    await axios.post(`${API_BASE}/appointments/${apt2Id}/check-in`, { doctorId: DOCTOR_ID });
    await axios.post(`${API_BASE}/appointments/${apt3Id}/check-in`, { doctorId: DOCTOR_ID });
    console.log('   ✅ Checked in all 3 patients.');

    // -------------------------------------------------------------------------
    // STEP 3: Verify Initial State Before No-Show
    // -------------------------------------------------------------------------
    console.log('\n3️⃣ Verifying initial state before No-Show...');
    
    // Check appointment 1 state
    const apt1Before = await axios.get(`${API_BASE}/appointments/${apt1Id}`);
    if (apt1Before.data.appointment.status === 'NO_SHOW') {
      throw new Error(`Appointment ${apt1Id} should not be NO_SHOW before test action.`);
    }
    console.log(`   ✅ Appointment 1 initial status: ${apt1Before.data.appointment.status}`);

    // Check active queue before
    const queueBefore = await axios.get(`${API_BASE}/queue?clinicId=${CLINIC_ID}&doctorId=${DOCTOR_ID}`);
    const queueItemsBefore = queueBefore.data.queue || [];
    const p1InQueue = queueItemsBefore.find((q: any) => q.appointmentId === apt1Id);
    const p2InQueue = queueItemsBefore.find((q: any) => q.appointmentId === apt2Id);
    const p3InQueue = queueItemsBefore.find((q: any) => q.appointmentId === apt3Id);

    if (!p1InQueue) throw new Error('Patient 1 must be in active queue initially.');
    if (!p2InQueue) throw new Error('Patient 2 must be in active queue initially.');
    if (!p3InQueue) throw new Error('Patient 3 must be in active queue initially.');

    console.log(`   ✅ Initial queue positions: P1 pos=${p1InQueue.queuePosition}, P2 pos=${p2InQueue.queuePosition}, P3 pos=${p3InQueue.queuePosition}`);
    if (p1InQueue.queuePosition !== 1 || p2InQueue.queuePosition !== 2 || p3InQueue.queuePosition !== 3) {
      throw new Error(`Initial queue positions must be 1, 2, 3. Got: ${p1InQueue.queuePosition}, ${p2InQueue.queuePosition}, ${p3InQueue.queuePosition}`);
    }

    // Verify UI action availability logic before No-Show
    const statusBefore = apt1Before.data.appointment.status;
    const canCheckInBefore = statusBefore === 'BOOKED';
    const canMarkNoShowBefore = ['BOOKED', 'CHECKED_IN', 'Waiting', 'WAITING'].includes(statusBefore);
    if (!canMarkNoShowBefore) {
      throw new Error('No-Show action must be available for active appointment before transition.');
    }
    console.log(`   ✅ Pre-transition action state: canCheckIn=${canCheckInBefore}, canMarkNoShow=${canMarkNoShowBefore}`);

    // -------------------------------------------------------------------------
    // STEP 4: Execute No-Show Request (staff forceNoShow)
    // -------------------------------------------------------------------------
    console.log('\n4️⃣ Executing No-Show request...');
    const noShowRes = await axios.put(`${API_BASE}/appointments/${apt1Id}/no-show`, {
      force: true,
      forceNoShow: true,
    });

    if (noShowRes.status !== 200 || !noShowRes.data.success) {
      throw new Error(`No-show request failed: ${JSON.stringify(noShowRes.data)}`);
    }
    if (noShowRes.data.appointment.status !== 'NO_SHOW') {
      throw new Error(`No-show response appointment.status is ${noShowRes.data.appointment.status}, expected NO_SHOW`);
    }
    console.log(`   ✅ No-show request succeeded with status: ${noShowRes.data.appointment.status}`);

    // Allow async socket broadcasts to process
    await new Promise((r) => setTimeout(r, 200));

    // -------------------------------------------------------------------------
    // STEP 5: Verify Persisted NO_SHOW Status (Single Appointment & Today List)
    // -------------------------------------------------------------------------
    console.log('\n5️⃣ Verifying persisted NO_SHOW status in backend and appointment list...');
    
    // Check single appointment query
    const apt1After = await axios.get(`${API_BASE}/appointments/${apt1Id}`);
    if (apt1After.data.appointment.status !== 'NO_SHOW') {
      throw new Error(`Persisted appointment status is '${apt1After.data.appointment.status}', expected 'NO_SHOW'`);
    }
    console.log(`   ✅ Single appointment GET /appointments/${apt1Id} confirms status: ${apt1After.data.appointment.status}`);

    // Check clinic assistant appointment list (GET /appointments/today?clinicId=...)
    const todayListRes = await axios.get(`${API_BASE}/appointments/today?clinicId=${CLINIC_ID}`);
    const aptsInToday = todayListRes.data.appointments || [];
    const apt1InList = aptsInToday.find((a: any) => a.id === apt1Id);

    if (!apt1InList) {
      throw new Error(`Appointment ${apt1Id} must remain in today appointments list.`);
    }
    if (apt1InList.status !== 'NO_SHOW') {
      throw new Error(`Appointment list reflects status '${apt1InList.status}', expected 'NO_SHOW'`);
    }
    console.log(`   ✅ Clinic Assistant appointment list reflects canonical status: ${apt1InList.status}`);

    // -------------------------------------------------------------------------
    // STEP 6: Verify No-Show and Check-In Actions are NO LONGER Available
    // -------------------------------------------------------------------------
    console.log('\n6️⃣ Verifying action availability in UI logic for NO_SHOW appointment...');
    const postStatus = apt1InList.status;
    const canCheckInAfter = postStatus === 'BOOKED';
    const canMarkNoShowAfter = postStatus === 'BOOKED' || postStatus === 'CHECKED_IN';
    if (canCheckInAfter || canMarkNoShowAfter) {
      throw new Error(`Actions still available! canCheckIn=${canCheckInAfter}, canMarkNoShow=${canMarkNoShowAfter}`);
    }
    console.log(`   ✅ Check-In action available: ${canCheckInAfter} (EXPECTED FALSE)`);
    console.log(`   ✅ No-Show action available: ${canMarkNoShowAfter} (EXPECTED FALSE)`);

    // -------------------------------------------------------------------------
    // STEP 7: Verify Patient is ABSENT from Active Waiting Queue
    // -------------------------------------------------------------------------
    console.log('\n7️⃣ Verifying patient is absent from active queue...');
    const queueAfter = await axios.get(`${API_BASE}/queue?clinicId=${CLINIC_ID}&doctorId=${DOCTOR_ID}`);
    const queueItemsAfter = queueAfter.data.queue || [];
    const p1InQueueAfter = queueItemsAfter.find((q: any) => q.appointmentId === apt1Id);

    if (p1InQueueAfter) {
      throw new Error(`Patient 1 (${apt1Id}) is still in active queue: ${JSON.stringify(p1InQueueAfter)}`);
    }
    console.log(`   ✅ Patient 1 is completely absent from active waiting queue.`);

    // -------------------------------------------------------------------------
    // STEP 8: Verify Remaining Queue Positions & Wait Times Rebalanced Correctly
    // -------------------------------------------------------------------------
    console.log('\n8️⃣ Verifying rebalanced queue positions and wait times...');
    const p2InQueueAfter = queueItemsAfter.find((q: any) => q.appointmentId === apt2Id);
    const p3InQueueAfter = queueItemsAfter.find((q: any) => q.appointmentId === apt3Id);

    if (!p2InQueueAfter) throw new Error('Patient 2 must remain in active queue.');
    if (!p3InQueueAfter) throw new Error('Patient 3 must remain in active queue.');

    console.log(`   ✅ Patient 2 advanced to queue position: ${p2InQueueAfter.queuePosition} (patientsAhead=${p2InQueueAfter.patientsAhead})`);
    console.log(`   ✅ Patient 3 advanced to queue position: ${p3InQueueAfter.queuePosition} (patientsAhead=${p3InQueueAfter.patientsAhead})`);

    if (p2InQueueAfter.queuePosition !== 1 || p2InQueueAfter.patientsAhead !== 0) {
      throw new Error(`Patient 2 expected queuePosition=1, patientsAhead=0, got pos=${p2InQueueAfter.queuePosition}, ahead=${p2InQueueAfter.patientsAhead}`);
    }
    if (p3InQueueAfter.queuePosition !== 2 || p3InQueueAfter.patientsAhead !== 1) {
      throw new Error(`Patient 3 expected queuePosition=2, patientsAhead=1, got pos=${p3InQueueAfter.queuePosition}, ahead=${p3InQueueAfter.patientsAhead}`);
    }

    // -------------------------------------------------------------------------
    // STEP 9: Verify Socket.IO Real-time Events
    // -------------------------------------------------------------------------
    console.log('\n9️⃣ Verifying Socket.IO synchronization events...');
    const noShowEvent = receivedSocketEvents.find((e) => e.event === 'appointment:no_show' && e.data.appointmentId === apt1Id);
    const statusEvent = receivedSocketEvents.find((e) => e.event === 'appointment:status' && e.data.appointmentId === apt1Id);
    const queueUpdatedEvent = receivedSocketEvents.find((e) => e.event === 'queue:updated');

    if (!noShowEvent) throw new Error('Missing appointment:no_show event via Socket.IO');
    if (!statusEvent) throw new Error('Missing appointment:status event via Socket.IO');
    if (!queueUpdatedEvent) throw new Error('Missing queue:updated event via Socket.IO');

    console.log(`   ✅ appointment:no_show event received with status: ${noShowEvent.data.status || noShowEvent.data.appointmentStatus}`);
    console.log(`   ✅ appointment:status event received with status: ${statusEvent.data.status || statusEvent.data.appointmentStatus}`);
    console.log(`   ✅ queue:updated event received successfully.`);

    console.log('\n========================================================================');
    console.log('🎉 ALL NO-SHOW SYNCHRONIZATION TESTS PASSED PERFECTLY!');
    console.log('========================================================================');
  } finally {
    socket.disconnect();
  }
}

runNoShowSyncTest().catch((err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  if (err.response?.data) {
    console.error('Response data:', err.response.data);
  }
  process.exit(1);
});
