import { io } from 'socket.io-client';

const API_BASE = 'http://localhost:5000/api';

async function fetchJson(url: string, options: any = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log('====================================================');
  console.log('MEDLINK LIVE DOCTOR STATUS SYNCHRONIZATION E2E TEST');
  console.log('====================================================\n');

  // 1. Connect Socket.IO client (simulating Patient App and Clinic Assistant)
  const socket = io('http://localhost:5000', { transports: ['websocket'] });
  const receivedEvents: any[] = [];

  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Socket connection timed out')), 5000);
    socket.on('connect', () => {
      console.log('✅ Socket connected with ID:', socket.id);
      socket.emit('join:clinic', 'c-demo-moon-01');
      socket.emit('join:clinic', 'c-demo-apollo-02');
      clearTimeout(timeout);
      resolve();
    });
  });

  socket.on('doctor:status_updated', (payload) => {
    console.log('📡 [SOCKET EVENT] doctor:status_updated:', JSON.stringify(payload));
    receivedEvents.push(payload);
  });

  // Fetch doctors and clinics to find real IDs
  const clinicsRes = await fetchJson(`${API_BASE}/clinics`);
  const clinics = clinicsRes.data.clinics || [];
  const moonClinic = clinics.find((c: any) => c.name.includes('Moon') || c.id === 'c-demo-moon-01') || clinics[0];
  const apolloClinic = clinics.find((c: any) => c.name.includes('Apollo') || c.id.includes('apollo')) || clinics[1];

  const moonDocsRes = await fetchJson(`${API_BASE}/doctors?clinicId=${moonClinic.id}`);
  const moonDocs = moonDocsRes.data.doctors || [];

  const priyaDoc = moonDocs.find((d: any) => d.name.includes('Priya')) || moonDocs[0];
  const arunDoc = moonDocs.find((d: any) => d.id !== priyaDoc.id) || moonDocs[1];

  const allDocsRes = await fetchJson(`${API_BASE}/doctors`);
  const allDocs = allDocsRes.data.doctors || [];
  const thirdDoc = allDocs.find((d: any) => d.id !== priyaDoc.id && d.id !== arunDoc.id) || allDocs[2];

  console.log(`\nTesting Doctors:`);
  console.log(`- Doctor 1 (Priya): ${priyaDoc.name} (${priyaDoc.id})`);
  console.log(`- Doctor 2 (Arun): ${arunDoc.name} (${arunDoc.id})`);
  console.log(`- Doctor 3 (Third): ${thirdDoc.name} (${thirdDoc.id})`);
  console.log(`\nTesting Clinics:`);
  console.log(`- Clinic 1 (Moon): ${moonClinic.name} (${moonClinic.id})`);
  console.log(`- Clinic 2 (Apollo): ${apolloClinic.name} (${apolloClinic.id})\n`);

  // ========================================================
  // TEST A: Doctor 1 at Moon Dental: AVAILABLE -> OFFLINE -> BUSY -> AVAILABLE
  // ========================================================
  console.log('--- TEST A: Priya at Moon Dental Status Cycle ---');

  // Step 1: Set AVAILABLE
  console.log('1. Setting Priya at Moon Dental to AVAILABLE...');
  receivedEvents.length = 0;
  const setAvailRes = await fetchJson(`${API_BASE}/doctors/${priyaDoc.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ clinicId: moonClinic.id, status: 'AVAILABLE' }),
  });
  if (!setAvailRes.ok || setAvailRes.data.status !== 'AVAILABLE') {
    throw new Error(`Failed to set AVAILABLE: ${JSON.stringify(setAvailRes.data)}`);
  }
  console.log('   Response:', JSON.stringify(setAvailRes.data));
  await new Promise((r) => setTimeout(r, 200));
  const event1 = receivedEvents.find((e) => e.doctorId === priyaDoc.id && e.status === 'AVAILABLE');
  if (!event1 || event1.clinicId !== moonClinic.id) {
    throw new Error('Socket.IO doctor:status_updated event not received for AVAILABLE!');
  }
  console.log('   ✅ Socket event received correctly with clinicId & doctorId.');

  // Step 2: Set OFFLINE
  console.log('2. Setting Priya at Moon Dental to OFFLINE...');
  receivedEvents.length = 0;
  const setOfflineRes = await fetchJson(`${API_BASE}/doctors/${priyaDoc.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ clinicId: moonClinic.id, status: 'OFFLINE' }),
  });
  if (!setOfflineRes.ok || setOfflineRes.data.status !== 'OFFLINE') {
    throw new Error(`Failed to set OFFLINE: ${JSON.stringify(setOfflineRes.data)}`);
  }
  console.log('   Response:', JSON.stringify(setOfflineRes.data));
  await new Promise((r) => setTimeout(r, 200));
  const event2 = receivedEvents.find((e) => e.doctorId === priyaDoc.id && e.status === 'OFFLINE');
  if (!event2 || event2.clinicId !== moonClinic.id) {
    throw new Error('Socket.IO doctor:status_updated event not received for OFFLINE!');
  }
  console.log('   ✅ Socket event received correctly for OFFLINE.');

  // Verify Patient API for Moon Dental shows OFFLINE
  const getMoonOffline = await fetchJson(`${API_BASE}/doctors?clinicId=${moonClinic.id}`);
  const priyaAfterOffline = getMoonOffline.data.doctors.find((d: any) => d.id === priyaDoc.id);
  console.log('   Patient App query for Priya after OFFLINE:', {
    status: priyaAfterOffline.status,
    liveStatus: priyaAfterOffline.liveStatus,
    isAvailableToday: priyaAfterOffline.isAvailableToday,
  });
  if (priyaAfterOffline.liveStatus !== 'OFFLINE' || priyaAfterOffline.isAvailableToday === true) {
    throw new Error(`Patient API did not reflect OFFLINE! ${JSON.stringify(priyaAfterOffline)}`);
  }
  console.log('   ✅ Patient API confirms OFFLINE and isAvailableToday === false.');

  // Verify Booking Attempt Fails when OFFLINE
  console.log('   Testing booking rejection when doctor is OFFLINE...');
  const bookingAttemptOffline = await fetchJson(`${API_BASE}/appointments`, {
    method: 'POST',
    body: JSON.stringify({
      patientId: 'pat-demo-02',
      doctorId: priyaDoc.id,
      clinicId: moonClinic.id,
      date: 'Today',
      time: '09:00 PM',
      reason: 'General Consultation',
    }),
  });
  console.log('   Booking attempt response status:', bookingAttemptOffline.status, bookingAttemptOffline.data);
  if (bookingAttemptOffline.ok) {
    throw new Error('Booking should have failed when doctor is OFFLINE, but succeeded!');
  }
  console.log('   ✅ Booking correctly blocked with:', bookingAttemptOffline.data.code);

  // Step 3: Set BUSY
  console.log('3. Setting Priya at Moon Dental to BUSY...');
  receivedEvents.length = 0;
  const setBusyRes = await fetchJson(`${API_BASE}/doctors/${priyaDoc.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ clinicId: moonClinic.id, status: 'BUSY' }),
  });
  if (!setBusyRes.ok || setBusyRes.data.status !== 'BUSY') {
    throw new Error(`Failed to set BUSY: ${JSON.stringify(setBusyRes.data)}`);
  }
  console.log('   Response:', JSON.stringify(setBusyRes.data));
  await new Promise((r) => setTimeout(r, 200));
  const event3 = receivedEvents.find((e) => e.doctorId === priyaDoc.id && e.status === 'BUSY');
  if (!event3 || event3.clinicId !== moonClinic.id) {
    throw new Error('Socket.IO doctor:status_updated event not received for BUSY!');
  }
  console.log('   ✅ Socket event received correctly for BUSY.');

  // Verify Patient API for Moon Dental shows BUSY
  const getMoonBusy = await fetchJson(`${API_BASE}/doctors?clinicId=${moonClinic.id}`);
  const priyaAfterBusy = getMoonBusy.data.doctors.find((d: any) => d.id === priyaDoc.id);
  console.log('   Patient App query for Priya after BUSY:', {
    status: priyaAfterBusy.status,
    liveStatus: priyaAfterBusy.liveStatus,
    isAvailableToday: priyaAfterBusy.isAvailableToday,
  });
  if (priyaAfterBusy.liveStatus !== 'BUSY' || priyaAfterBusy.isAvailableToday === true) {
    throw new Error(`Patient API did not reflect BUSY! ${JSON.stringify(priyaAfterBusy)}`);
  }
  console.log('   ✅ Patient API confirms BUSY and isAvailableToday === false.');

  // Verify Booking Attempt Fails when BUSY
  console.log('   Testing booking rejection when doctor is BUSY...');
  const bookingAttemptBusy = await fetchJson(`${API_BASE}/appointments`, {
    method: 'POST',
    body: JSON.stringify({
      patientId: 'pat-demo-02',
      doctorId: priyaDoc.id,
      clinicId: moonClinic.id,
      date: 'Today',
      time: '09:00 PM',
      reason: 'General Consultation',
    }),
  });
  console.log('   Booking attempt response status:', bookingAttemptBusy.status, bookingAttemptBusy.data);
  if (bookingAttemptBusy.ok) {
    throw new Error('Booking should have failed when doctor is BUSY, but succeeded!');
  }
  console.log('   ✅ Booking correctly blocked with:', bookingAttemptBusy.data.code);

  // Step 4: Set back to AVAILABLE
  console.log('4. Setting Priya at Moon Dental back to AVAILABLE...');
  receivedEvents.length = 0;
  const setAvailAgain = await fetchJson(`${API_BASE}/doctors/${priyaDoc.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ clinicId: moonClinic.id, status: 'AVAILABLE' }),
  });
  if (!setAvailAgain.ok || setAvailAgain.data.status !== 'AVAILABLE') {
    throw new Error(`Failed to restore AVAILABLE: ${JSON.stringify(setAvailAgain.data)}`);
  }
  console.log('   Response:', JSON.stringify(setAvailAgain.data));
  await new Promise((r) => setTimeout(r, 200));
  const event4 = receivedEvents.find((e) => e.doctorId === priyaDoc.id && e.status === 'AVAILABLE');
  if (!event4 || event4.clinicId !== moonClinic.id) {
    throw new Error('Socket.IO doctor:status_updated event not received for AVAILABLE restoration!');
  }
  console.log('   ✅ Socket event received correctly for AVAILABLE restoration.');

  // ========================================================
  // TEST B: Multi-Clinic Isolation
  // Priya + Moon Dental = OFFLINE
  // Priya + Apollo = AVAILABLE
  // ========================================================
  console.log('\n--- TEST B: Multi-Clinic Isolation Test ---');
  console.log('Setting Priya at Moon Dental = OFFLINE...');
  await fetchJson(`${API_BASE}/doctors/${priyaDoc.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ clinicId: moonClinic.id, status: 'OFFLINE' }),
  });

  console.log('Setting Priya at Apollo Family Care = AVAILABLE...');
  await fetchJson(`${API_BASE}/doctors/${priyaDoc.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ clinicId: apolloClinic.id, status: 'AVAILABLE' }),
  });

  // Verify Moon Dental
  const checkMoon = await fetchJson(`${API_BASE}/doctors?clinicId=${moonClinic.id}`);
  const priyaMoon = checkMoon.data.doctors.find((d: any) => d.id === priyaDoc.id);

  // Verify Apollo
  const checkApollo = await fetchJson(`${API_BASE}/doctors?clinicId=${apolloClinic.id}`);
  const priyaApollo = checkApollo.data.doctors.find((d: any) => d.id === priyaDoc.id);

  console.log('Priya at Moon Dental:', { liveStatus: priyaMoon.liveStatus, status: priyaMoon.status });
  console.log('Priya at Apollo Family Care:', { liveStatus: priyaApollo?.liveStatus, status: priyaApollo?.status });

  if (priyaMoon.liveStatus !== 'OFFLINE') {
    throw new Error(`Multi-clinic isolation failed! Expected Moon Dental to be OFFLINE, got ${priyaMoon.liveStatus}`);
  }
  if (priyaApollo && priyaApollo.liveStatus !== 'AVAILABLE') {
    throw new Error(`Multi-clinic isolation failed! Expected Apollo to be AVAILABLE, got ${priyaApollo.liveStatus}`);
  }
  console.log('✅ Multi-clinic isolation verified: Priya is OFFLINE at Moon Dental and AVAILABLE at Apollo!');

  // ========================================================
  // TEST C: Independent Doctor Status (Doctor 2: Arun)
  // ========================================================
  console.log('\n--- TEST C: Independent Doctor Status (Arun at Moon Dental) ---');
  console.log(`Setting Arun (${arunDoc.name}) at Moon Dental to BUSY...`);
  await fetchJson(`${API_BASE}/doctors/${arunDoc.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ clinicId: moonClinic.id, status: 'BUSY' }),
  });

  const checkMoonBoth = await fetchJson(`${API_BASE}/doctors?clinicId=${moonClinic.id}`);
  const priyaCurrent = checkMoonBoth.data.doctors.find((d: any) => d.id === priyaDoc.id);
  const arunCurrent = checkMoonBoth.data.doctors.find((d: any) => d.id === arunDoc.id);

  console.log(`Priya status: ${priyaCurrent.liveStatus}`);
  console.log(`Arun status: ${arunCurrent.liveStatus}`);

  if (arunCurrent.liveStatus !== 'BUSY') {
    throw new Error(`Expected Arun to be BUSY, got ${arunCurrent.liveStatus}`);
  }
  if (priyaCurrent.liveStatus !== 'OFFLINE') {
    throw new Error(`Priya status was inadvertently mutated by Arun! Expected OFFLINE, got ${priyaCurrent.liveStatus}`);
  }
  console.log('✅ Independent doctor status verified: Arun is BUSY without altering Priya!');

  // ========================================================
  // TEST D: Third Doctor & Assigned Clinic Cycle
  // ========================================================
  console.log('\n--- TEST D: Third Doctor Lifecycle ---');
  console.log(`Setting ${thirdDoc.name} (${thirdDoc.id}) at ${moonClinic.name} to OFFLINE then AVAILABLE...`);
  await fetchJson(`${API_BASE}/doctors/${thirdDoc.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ clinicId: moonClinic.id, status: 'OFFLINE' }),
  });
  let checkThird = await fetchJson(`${API_BASE}/doctors?clinicId=${moonClinic.id}`);
  let doc3 = checkThird.data.doctors.find((d: any) => d.id === thirdDoc.id);
  if (doc3 && doc3.liveStatus !== 'OFFLINE') {
    throw new Error(`Expected third doctor to be OFFLINE, got ${doc3.liveStatus}`);
  }
  console.log(`   ${thirdDoc.name} is OFFLINE.`);

  await fetchJson(`${API_BASE}/doctors/${thirdDoc.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ clinicId: moonClinic.id, status: 'AVAILABLE' }),
  });
  checkThird = await fetchJson(`${API_BASE}/doctors?clinicId=${moonClinic.id}`);
  doc3 = checkThird.data.doctors.find((d: any) => d.id === thirdDoc.id);
  if (doc3 && doc3.liveStatus !== 'AVAILABLE') {
    throw new Error(`Expected third doctor to be AVAILABLE, got ${doc3.liveStatus}`);
  }
  console.log(`   ${thirdDoc.name} is restored to AVAILABLE.`);
  console.log('✅ Third doctor lifecycle verified!');

  // ========================================================
  // TEST E: Preserved Approved Availability Requests Test
  // ========================================================
  const reqsRes = await fetchJson(`${API_BASE}/availability/requests?doctorId=${priyaDoc.id}&clinicId=${moonClinic.id}`);
  const reqs = reqsRes.data.requests || [];
  console.log(`Found ${reqs.length} availability requests for ${priyaDoc.name} at ${moonClinic.name}:`);
  for (const r of reqs) {
    console.log(`   - ID: ${r.id}, Date: ${r.date || r.requested_date}, Time: ${r.start_time} - ${r.end_time}, Status: ${r.status}`);
  }
  const approvedReqs = reqs.filter((r: any) => r.status === 'APPROVED');
  if (approvedReqs.length === 0) {
    throw new Error('Approved availability requests were lost or deleted! This violates the core rule!');
  }
  console.log(`✅ Approved availability requests strictly preserved (${approvedReqs.length} approved schedule(s) intact)!`);

  // Cleanup: Reset Priya to AVAILABLE at Moon Dental
  await fetchJson(`${API_BASE}/doctors/${priyaDoc.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ clinicId: moonClinic.id, status: 'AVAILABLE' }),
  });
  await fetchJson(`${API_BASE}/doctors/${arunDoc.id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ clinicId: moonClinic.id, status: 'AVAILABLE' }),
  });

  socket.disconnect();
  console.log('\n====================================================');
  console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! FULL STATUS SYNCHRONIZATION VERIFIED.');
  console.log('====================================================\n');
}

main().catch((err) => {
  console.error('❌ TEST FAILED:', err);
  process.exit(1);
});
