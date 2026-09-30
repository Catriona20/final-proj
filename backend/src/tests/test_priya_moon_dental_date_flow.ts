import axios from 'axios';
import { io as ClientSocket, Socket } from 'socket.io-client';

const API_BASE = 'http://127.0.0.1:5000/api';
const ROOT_BASE = 'http://127.0.0.1:5000';

async function runCleanAvailabilityTest() {
  console.log('======================================================================');
  console.log('🧪 VERIFYING FORCE-FIX: AVAILABILITY DATE PERSISTENCE & APPROVAL SYNC');
  console.log('======================================================================\n');

  // Step 0: Reset demo state
  console.log('0️⃣ Resetting demo environment...');
  const resetRes = await axios.post(`${API_BASE}/simulation/reset-demo`);
  console.log(`   Demo reset result: ${resetRes.data.message}\n`);

  // Step 1: Connect WebSocket
  console.log('1️⃣ Connecting WebSocket to capture real-time events...');
  const socket: Socket = ClientSocket(ROOT_BASE, {
    transports: ['websocket'],
    reconnection: false,
  });

  const capturedApprovedEvents: any[] = [];
  socket.on('connect', () => {
    socket.emit('join:clinic', 'c-demo-moon-01');
    socket.emit('join:doctor', 'doc-demo-priya-02');
  });
  socket.on('availability_request:approved', (data: any) => {
    capturedApprovedEvents.push(data);
  });

  await new Promise((resolve) => setTimeout(resolve, 600));

  // Step 2: Clinic Assistant logins at Moon Dental
  console.log('2️⃣ Logging in Clinic Assistant Sheryl Thomas (Moon Dental)...');
  const asstLogin = await axios.post(`${API_BASE}/auth/assistant/login`, {
    email: 'assistant01@demo.medlink.test',
    password: 'Clinic@3001',
  });
  const asstToken = asstLogin.data.token;
  console.log('   Assistant logged in successfully.\n');

  // Step 3: Create Availability Request for Dr. Priya Sharma at Moon Dental for 2026-09-28
  console.log('3️⃣ Creating Availability Request for Dr. Priya at Moon Dental...');
  const createRes = await axios.post(
    `${API_BASE}/availability/requests`,
    {
      doctor_id: 'doc-demo-priya-02',
      clinic_id: 'c-demo-moon-01',
      specialty: 'General Medicine',
      date: '2026-09-28',
      start_time: '08:00 PM',
      end_time: '11:00 PM',
      notes: 'Evening session at Moon Dental',
    },
    { headers: { Authorization: `Bearer ${asstToken}` } }
  );

  const createdReq = createRes.data.request;
  console.log('   Created Request:', {
    id: createdReq.id,
    doctor: createdReq.doctor_name,
    clinic: createdReq.clinic_name,
    date: createdReq.date,
    requested_date: createdReq.requested_date,
    start_time: createdReq.start_time,
    end_time: createdReq.end_time,
    status: createdReq.status,
  });

  if (!createdReq.date || createdReq.date !== '2026-09-28') {
    throw new Error(`FAIL: created request date is '${createdReq.date}', expected '2026-09-28'`);
  }
  if (!createdReq.requested_date || createdReq.requested_date !== '2026-09-28') {
    throw new Error(`FAIL: created request requested_date is '${createdReq.requested_date}', expected '2026-09-28'`);
  }
  console.log('   ✅ Request creation date preserved: 2026-09-28\n');

  // Step 4: Login Dr. Priya Sharma
  console.log('4️⃣ Logging in Dr. Priya Sharma...');
  const priyaLogin = await axios.post(`${API_BASE}/auth/doctor/login`, {
    email: 'doctor02@demo.medlink.test',
    password: 'Doctor@2002',
  });
  const priyaToken = priyaLogin.data.token;
  console.log('   Dr. Priya Sharma logged in.\n');

  // Step 5: Priya fetches requests (Doctor App view before approval)
  console.log('5️⃣ Dr. Priya checks incoming availability requests...');
  const priyaReqsRes = await axios.get(`${API_BASE}/availability/requests`, {
    headers: { Authorization: `Bearer ${priyaToken}` },
  });
  const priyaPending = priyaReqsRes.data.requests.find((r: any) => r.id === createdReq.id);
  if (!priyaPending) {
    throw new Error('FAIL: Priya cannot find her pending request');
  }
  if (priyaPending.date !== '2026-09-28') {
    throw new Error(`FAIL: Pending request date in Doctor App is '${priyaPending.date}', expected '2026-09-28'`);
  }
  console.log('   Doctor App Pending View Date:', priyaPending.date);
  console.log('   ✅ Doctor App correctly sees Date: 2026-09-28\n');

  // Step 6: Dr. Priya APPROVES the request
  console.log('6️⃣ Dr. Priya APPROVES the availability request...');
  const approveRes = await axios.post(
    `${API_BASE}/availability/requests/${createdReq.id}/approve`,
    { notes: 'Approved by Dr. Priya' },
    { headers: { Authorization: `Bearer ${priyaToken}` } }
  );

  const approvedReq = approveRes.data.request;
  console.log('   Approved Request Response:', {
    id: approvedReq.id,
    date: approvedReq.date,
    requested_date: approvedReq.requested_date,
    start_time: approvedReq.start_time,
    end_time: approvedReq.end_time,
    status: approvedReq.status,
  });

  if (approvedReq.date !== '2026-09-28') {
    throw new Error(`FAIL: Approved request date in response is '${approvedReq.date}', expected '2026-09-28'`);
  }
  if (approvedReq.status !== 'APPROVED') {
    throw new Error(`FAIL: Status is '${approvedReq.status}', expected 'APPROVED'`);
  }
  console.log('   ✅ Approval endpoint response preserved Date: 2026-09-28\n');

  // Step 7: Verify Socket.IO payload
  console.log('7️⃣ Verifying Socket.IO real-time approval broadcast payload...');
  await new Promise((resolve) => setTimeout(resolve, 600));
  if (capturedApprovedEvents.length === 0) {
    throw new Error('FAIL: No availability_request:approved event captured over Socket.IO');
  }
  const socketPayload = capturedApprovedEvents[0];
  console.log('   Captured Socket Event Payload:', {
    id: socketPayload.id,
    clinicId: socketPayload.clinicId || socketPayload.clinic_id,
    doctorId: socketPayload.doctorId || socketPayload.doctor_id,
    date: socketPayload.date,
    startTime: socketPayload.startTime || socketPayload.start_time,
    endTime: socketPayload.endTime || socketPayload.end_time,
    status: socketPayload.status,
  });
  if (socketPayload.date !== '2026-09-28') {
    throw new Error(`FAIL: Socket.IO event date is '${socketPayload.date}', expected '2026-09-28'`);
  }
  console.log('   ✅ Socket.IO payload carries Date: 2026-09-28\n');

  // Step 8: Doctor App view after refresh / re-fetch
  console.log('8️⃣ Verifying Doctor App persisted state after approval...');
  const priyaAfterRes = await axios.get(`${API_BASE}/availability/requests`, {
    headers: { Authorization: `Bearer ${priyaToken}` },
  });
  const priyaApproved = priyaAfterRes.data.requests.find((r: any) => r.id === createdReq.id);
  if (!priyaApproved) {
    throw new Error('FAIL: Approved request not found in Doctor App');
  }
  if (priyaApproved.date !== '2026-09-28') {
    throw new Error(`FAIL: Persisted request date in Doctor App is '${priyaApproved.date}', expected '2026-09-28'`);
  }
  if (priyaApproved.status !== 'APPROVED') {
    throw new Error(`FAIL: Status is '${priyaApproved.status}', expected 'APPROVED'`);
  }
  console.log('   Doctor App Approved Request Card:', {
    facility: priyaApproved.clinic_name,
    doctor: priyaApproved.doctor_name,
    date: priyaApproved.date,
    shiftWindow: `${priyaApproved.start_time} – ${priyaApproved.end_time}`,
    status: priyaApproved.status,
  });
  console.log('   ✅ Doctor App displays Date: 28 Sep 2026 (2026-09-28) & APPROVED\n');

  // Step 9: Clinic Assistant view after refresh / re-fetch
  console.log('9️⃣ Verifying Clinic Assistant persisted state after approval...');
  const clinicReqsRes = await axios.get(`${API_BASE}/availability/requests?clinicId=c-demo-moon-01`);
  const clinicApproved = clinicReqsRes.data.requests.find((r: any) => r.id === createdReq.id);
  if (!clinicApproved) {
    throw new Error('FAIL: Approved request not found in Clinic Assistant');
  }
  if (clinicApproved.date !== '2026-09-28') {
    throw new Error(`FAIL: Persisted request date in Clinic Assistant is '${clinicApproved.date}', expected '2026-09-28'`);
  }
  if (clinicApproved.status !== 'APPROVED') {
    throw new Error(`FAIL: Status is '${clinicApproved.status}', expected 'APPROVED'`);
  }
  console.log('   Clinic Assistant Approved Request Card:', {
    facility: clinicApproved.clinic_name,
    doctor: clinicApproved.doctor_name,
    date: clinicApproved.date,
    shiftWindow: `${clinicApproved.start_time} – ${clinicApproved.end_time}`,
    status: clinicApproved.status,
  });
  console.log('   ✅ Clinic Assistant displays Date: 28 Sep 2026 (2026-09-28) & APPROVED\n');

  // Step 10: Patient App slot generation on September 28, 2026
  console.log('🔟 Verifying Patient App slot generation on 2026-09-28 (Dr. Priya @ Moon Dental)...');
  const slotsSep28Res = await axios.get(
    `${API_BASE}/doctors/doc-demo-priya-02/slots?date=2026-09-28&clinicId=c-demo-moon-01`
  );
  const slots28 = slotsSep28Res.data.slots;
  console.log('   Slots for 2026-09-28:', {
    morningCount: slots28.morning.length,
    afternoonCount: slots28.afternoon.length,
    eveningCount: slots28.evening.length,
    eveningSlots: slots28.evening.map((s: any) => s.time),
  });

  if (slots28.morning.length !== 0 || slots28.afternoon.length !== 0) {
    throw new Error('FAIL: Morning or afternoon slots generated outside the 8:00 PM - 11:00 PM shift window');
  }
  if (slots28.evening.length === 0) {
    throw new Error('FAIL: Expected evening slots between 8:00 PM and 11:00 PM, got 0');
  }
  console.log('   ✅ Patient App has slots ONLY from 8:00 PM – 11:00 PM on 28 Sep 2026\n');

  // Step 11: Patient App date matching on September 29, 2026 (NO SLOTS)
  console.log('1️⃣1️⃣ Verifying Patient App slot isolation on 2026-09-29 (Different Date)...');
  const slotsSep29Res = await axios.get(
    `${API_BASE}/doctors/doc-demo-priya-02/slots?date=2026-09-29&clinicId=c-demo-moon-01`
  );
  const slots29 = slotsSep29Res.data.slots;
  console.log('   Slots for 2026-09-29:', {
    morningCount: slots29.morning.length,
    afternoonCount: slots29.afternoon.length,
    eveningCount: slots29.evening.length,
  });

  if (slots29.morning.length !== 0 || slots29.afternoon.length !== 0 || slots29.evening.length !== 0) {
    throw new Error('FAIL: Slots appeared for 2026-09-29 when availability was only approved for 2026-09-28');
  }
  console.log('   ✅ Patient App has ZERO slots for 29 Sep 2026 ("No confirmed doctor availability for this date")\n');

  // Step 12: Multi-Clinic Isolation Check (Apollo & Heart on 2026-09-28)
  console.log('1️⃣2️⃣ Verifying Multi-Clinic Isolation on 2026-09-28 across unrelated clinics...');
  const slotsApolloRes = await axios.get(
    `${API_BASE}/doctors/doc-demo-priya-02/slots?date=2026-09-28&clinicId=c-demo-apollo-02`
  );
  const slotsApollo = slotsApolloRes.data.slots;
  // Moon Dental approved 8 PM - 11 PM must NOT appear at Apollo
  if (slotsApollo.evening.length !== 0) {
    throw new Error('FAIL: Moon Dental 8 PM - 11 PM availability leaked to Apollo Clinic evening slots');
  }

  // Other visiting clinics without approved requests must have 0 slots
  const slotsHeartRes = await axios.get(
    `${API_BASE}/doctors/doc-demo-priya-02/slots?date=2026-09-28&clinicId=c-demo-heart-04`
  );
  const slotsHeart = slotsHeartRes.data.slots;
  if (slotsHeart.morning.length !== 0 || slotsHeart.afternoon.length !== 0 || slotsHeart.evening.length !== 0) {
    throw new Error('FAIL: Moon Dental availability leaked to Heart Clinic');
  }
  console.log('   ✅ Multi-clinic isolation verified: Moon Dental 8-11 PM does NOT appear for Apollo or Heart\n');

  socket.disconnect();
  console.log('🎉 ALL 12 VERIFICATION CHECKS PASSED WITH 100% SUCCESS!\n');
}

runCleanAvailabilityTest().catch((err) => {
  console.error('❌ TEST FAILED:', err.message);
  process.exit(1);
});
