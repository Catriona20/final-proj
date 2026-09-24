import axios from 'axios';
import { io, Socket } from 'socket.io-client';

const API_BASE = 'http://127.0.0.1:5000/api';
const SOCKET_URL = 'http://127.0.0.1:5000';

async function runTests() {
  console.log('=== STARTING DOCTOR AVAILABILITY REQUEST SCOPING TESTS ===\n');

  // STEP 0: Reset demo state
  console.log('0️⃣ Resetting demo environment...');
  const resetRes = await axios.post(`${API_BASE}/simulation/reset-demo`);
  console.log(`   Reset complete: ${resetRes.data.message}\n`);

  // STEP 1: Login Clinic Assistant Rahul Joseph (assistant02@demo.medlink.test)
  console.log('1️⃣ Logging in Clinic Assistant Rahul Joseph...');
  const asstLogin = await axios.post(`${API_BASE}/auth/assistant/login`, {
    email: 'assistant02@demo.medlink.test',
    password: 'Clinic@3002',
  });
  const asstToken = asstLogin.data.token;
  console.log('   Assistant logged in successfully.\n');

  // STEP 2: Create Priya's request and Karthik's request at Apollo Family Care Centre
  console.log('2️⃣ Creating Availability Requests at Apollo Family Care Centre...');
  // Request 1: Dr. Priya Sharma (5:00 PM – 7:00 PM)
  const priyaReqRes = await axios.post(
    `${API_BASE}/availability/requests`,
    {
      doctor_id: 'doc-demo-priya-02',
      clinic_id: 'c-demo-apollo-02',
      specialty: 'General Medicine',
      date: '2026-09-21',
      start_time: '05:00 PM',
      end_time: '07:00 PM',
      notes: 'Evening session for Priya',
    },
    { headers: { Authorization: `Bearer ${asstToken}` } }
  );
  const priyaRequestId = priyaReqRes.data.request.id;
  console.log(`   Priya request created: ID=${priyaRequestId}, Doctor=${priyaReqRes.data.request.doctor_name}`);

  // Request 2: Dr. Karthik Raman (10:00 AM – 1:00 PM)
  const karthikReqRes = await axios.post(
    `${API_BASE}/availability/requests`,
    {
      doctor_id: 'doc-demo-karthik-03',
      clinic_id: 'c-demo-apollo-02',
      specialty: 'Cardiology',
      date: '2026-09-21',
      start_time: '10:00 AM',
      end_time: '01:00 PM',
      notes: 'Morning cardiology session for Karthik',
    },
    { headers: { Authorization: `Bearer ${asstToken}` } }
  );
  const karthikRequestId = karthikReqRes.data.request.id;
  console.log(`   Karthik request created: ID=${karthikRequestId}, Doctor=${karthikReqRes.data.request.doctor_name}\n`);

  // STEP 3: Login Dr. Priya Sharma and Dr. Karthik Raman
  console.log('3️⃣ Logging in Doctors...');
  const priyaLogin = await axios.post(`${API_BASE}/auth/doctor/login`, {
    email: 'doctor02@demo.medlink.test',
    password: 'Doctor@2002',
  });
  const priyaToken = priyaLogin.data.token;
  console.log(`   Dr. Priya Sharma logged in: ID=${priyaLogin.data.doctor.id}`);

  const karthikLogin = await axios.post(`${API_BASE}/auth/doctor/login`, {
    email: 'doctor03@demo.medlink.test',
    password: 'Doctor@2003',
  });
  const karthikToken = karthikLogin.data.token;
  console.log(`   Dr. Karthik Raman logged in: ID=${karthikLogin.data.doctor.id}\n`);

  // ==========================================
  // TEST 1: Login as Priya -> Only Priya request visible
  // ==========================================
  console.log('🧪 TEST 1: Priya views Availability Requests...');
  const priyaViewRes = await axios.get(`${API_BASE}/availability/requests`, {
    headers: { Authorization: `Bearer ${priyaToken}` },
  });
  const priyaRequests = priyaViewRes.data.requests;
  console.log(`   Priya sees ${priyaRequests.length} request(s):`, priyaRequests.map((r: any) => `${r.doctor_name} (${r.doctor_id})`));
  const priyaHasKarthik = priyaRequests.some((r: any) => r.doctor_id === 'doc-demo-karthik-03' || r.doctor_name?.includes('Karthik'));
  const priyaHasPriya = priyaRequests.some((r: any) => r.id === priyaRequestId);
  if (priyaHasKarthik) {
    throw new Error('TEST 1 FAILED: Priya can see Karthik request!');
  }
  if (!priyaHasPriya) {
    throw new Error('TEST 1 FAILED: Priya cannot see her own request!');
  }
  console.log('   ✅ TEST 1 PASSED: Priya only sees Priya request.\n');

  // ==========================================
  // TEST 2: Login as Karthik -> Only Karthik request visible
  // ==========================================
  console.log('🧪 TEST 2: Karthik views Availability Requests...');
  const karthikViewRes = await axios.get(`${API_BASE}/availability/requests`, {
    headers: { Authorization: `Bearer ${karthikToken}` },
  });
  const karthikRequests = karthikViewRes.data.requests;
  console.log(`   Karthik sees ${karthikRequests.length} request(s):`, karthikRequests.map((r: any) => `${r.doctor_name} (${r.doctor_id})`));
  const karthikHasPriya = karthikRequests.some((r: any) => r.doctor_id === 'doc-demo-priya-02' || r.doctor_name?.includes('Priya'));
  const karthikHasKarthik = karthikRequests.some((r: any) => r.id === karthikRequestId);
  if (karthikHasPriya) {
    throw new Error('TEST 2 FAILED: Karthik can see Priya request!');
  }
  if (!karthikHasKarthik) {
    throw new Error('TEST 2 FAILED: Karthik cannot see his own request!');
  }
  console.log('   ✅ TEST 2 PASSED: Karthik only sees Karthik request.\n');

  // ==========================================
  // TEST 3: Clinic Assistant -> Both requests visible
  // ==========================================
  console.log('🧪 TEST 3: Clinic Assistant views Availability Requests...');
  const asstViewRes = await axios.get(`${API_BASE}/availability/requests?clinicId=c-demo-apollo-02`);
  const asstRequests = asstViewRes.data.requests;
  console.log(`   Clinic Assistant sees ${asstRequests.length} request(s):`, asstRequests.map((r: any) => `${r.doctor_name} (${r.doctor_id})`));
  const asstHasPriya = asstRequests.some((r: any) => r.id === priyaRequestId);
  const asstHasKarthik = asstRequests.some((r: any) => r.id === karthikRequestId);
  if (!asstHasPriya || !asstHasKarthik) {
    throw new Error(`TEST 3 FAILED: Clinic Assistant must see both requests! Priya=${asstHasPriya}, Karthik=${asstHasKarthik}`);
  }
  console.log('   ✅ TEST 3 PASSED: Clinic Assistant sees both requests.\n');

  // ==========================================
  // TEST 4: Priya attempts to approve Karthik's request directly -> 403 Forbidden
  // ==========================================
  console.log('🧪 TEST 4: Priya attempts to approve Karthik\'s request...');
  let unauthorizedApprovalFailed = false;
  try {
    await axios.post(
      `${API_BASE}/availability/requests/${karthikRequestId}/approve`,
      { notes: 'Priya attempting unauthorized approval of Karthik' },
      { headers: { Authorization: `Bearer ${priyaToken}` } }
    );
  } catch (err: any) {
    if (err.response?.status === 403) {
      unauthorizedApprovalFailed = true;
      console.log(`   Correctly rejected with 403 Forbidden: "${err.response.data.error}"`);
    } else {
      throw new Error(`TEST 4 FAILED: Expected 403, got ${err.response?.status}`);
    }
  }
  if (!unauthorizedApprovalFailed) {
    throw new Error('TEST 4 FAILED: Priya was able to approve Karthik\'s request!');
  }
  console.log('   ✅ TEST 4 PASSED: 403 Forbidden enforced.\n');

  // ==========================================
  // TEST 5: Karthik approves Karthik's request -> Success
  // ==========================================
  console.log('🧪 TEST 5: Karthik approves his own request...');
  const karthikApproveRes = await axios.post(
    `${API_BASE}/availability/requests/${karthikRequestId}/approve`,
    { notes: 'Approved by Dr. Karthik' },
    { headers: { Authorization: `Bearer ${karthikToken}` } }
  );
  if (karthikApproveRes.data.request.status !== 'APPROVED') {
    throw new Error(`TEST 5 FAILED: Expected APPROVED, got ${karthikApproveRes.data.request.status}`);
  }
  console.log(`   ✅ TEST 5 PASSED: Karthik successfully approved his request (Status: ${karthikApproveRes.data.request.status}).\n`);

  // ==========================================
  // TEST 6: Priya approves Priya's request -> Success
  // ==========================================
  console.log('🧪 TEST 6: Priya approves her own request...');
  const priyaApproveRes = await axios.post(
    `${API_BASE}/availability/requests/${priyaRequestId}/approve`,
    { notes: 'Approved by Dr. Priya' },
    { headers: { Authorization: `Bearer ${priyaToken}` } }
  );
  if (priyaApproveRes.data.request.status !== 'APPROVED') {
    throw new Error(`TEST 6 FAILED: Expected APPROVED, got ${priyaApproveRes.data.request.status}`);
  }
  console.log(`   ✅ TEST 6 PASSED: Priya successfully approved her request (Status: ${priyaApproveRes.data.request.status}).\n`);

  // ==========================================
  // TEST 7 & 8: Socket.IO Delivery Isolation
  // ==========================================
  console.log('🧪 TESTS 7 & 8: Socket.IO Targeted Delivery Verification...');
  const priyaSocket: Socket = io(SOCKET_URL, { transports: ['websocket'], reconnection: false });
  const karthikSocket: Socket = io(SOCKET_URL, { transports: ['websocket'], reconnection: false });

  const priyaReceivedEvents: any[] = [];
  const karthikReceivedEvents: any[] = [];

  priyaSocket.on('availability_request:new', (data: any) => {
    priyaReceivedEvents.push(data);
  });
  karthikSocket.on('availability_request:new', (data: any) => {
    karthikReceivedEvents.push(data);
  });

  await new Promise<void>((resolve) => {
    let connected = 0;
    const check = () => {
      connected++;
      if (connected === 2) resolve();
    };
    priyaSocket.on('connect', () => {
      priyaSocket.emit('join:doctor', 'doc-demo-priya-02');
      check();
    });
    karthikSocket.on('connect', () => {
      karthikSocket.emit('join:doctor', 'doc-demo-karthik-03');
      check();
    });
  });

  // Brief pause to ensure backend socket.join room processing completes
  await new Promise((r) => setTimeout(r, 200));

  // Create a new request for Priya
  console.log('   Creating new request for Dr. Priya Sharma...');
  await axios.post(
    `${API_BASE}/availability/requests`,
    {
      doctor_id: 'doc-demo-priya-02',
      clinic_id: 'c-demo-apollo-02',
      specialty: 'General Medicine',
      date: '2026-09-22',
      start_time: '02:00 PM',
      end_time: '04:00 PM',
      notes: 'Priya afternoon window',
    },
    { headers: { Authorization: `Bearer ${asstToken}` } }
  );

  // Wait 500ms
  await new Promise((r) => setTimeout(r, 500));

  // Verify TEST 7: Priya received it, Karthik did NOT
  const priyaCount1: number = priyaReceivedEvents.length;
  const karthikCount1: number = karthikReceivedEvents.length;
  if (priyaCount1 !== 1 || priyaReceivedEvents[0].doctor_id !== 'doc-demo-priya-02') {
    throw new Error(`TEST 7 FAILED: Priya socket did not receive event! (received ${priyaCount1})`);
  }
  if (karthikCount1 !== 0) {
    throw new Error(`TEST 7 FAILED: Karthik socket erroneously received Priya's event!`);
  }
  console.log('   ✅ TEST 7 PASSED: Only Priya received her real-time availability request.');

  // Create a new request for Karthik
  console.log('   Creating new request for Dr. Karthik Raman...');
  await axios.post(
    `${API_BASE}/availability/requests`,
    {
      doctor_id: 'doc-demo-karthik-03',
      clinic_id: 'c-demo-apollo-02',
      specialty: 'Cardiology',
      date: '2026-09-22',
      start_time: '03:00 PM',
      end_time: '05:00 PM',
      notes: 'Karthik afternoon window',
    },
    { headers: { Authorization: `Bearer ${asstToken}` } }
  );

  // Wait 500ms
  await new Promise((r) => setTimeout(r, 500));

  // Verify TEST 8: Karthik received it, Priya did NOT receive another
  const priyaCount2: number = priyaReceivedEvents.length;
  const karthikCount2: number = karthikReceivedEvents.length;
  if (karthikCount2 !== 1 || karthikReceivedEvents[0].doctor_id !== 'doc-demo-karthik-03') {
    throw new Error(`TEST 8 FAILED: Karthik socket did not receive event! (received ${karthikCount2})`);
  }
  if (priyaCount2 !== 1) {
    throw new Error(`TEST 8 FAILED: Priya socket erroneously received Karthik's event!`);
  }
  console.log('   ✅ TEST 8 PASSED: Only Karthik received his real-time availability request.\n');

  priyaSocket.disconnect();
  karthikSocket.disconnect();

  console.log('🎉 ALL 8 DOCTOR AVAILABILITY SCOPING TESTS PASSED PERFECTLY!\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST SUITE FAILED:', err.response?.data || err.message || err);
  process.exit(1);
});
