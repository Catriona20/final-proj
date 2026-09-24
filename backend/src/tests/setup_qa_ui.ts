import axios from 'axios';

const API_BASE = 'http://127.0.0.1:5000/api';
const DOCTOR_ID = 'doc-demo-priya-02';
const CLINIC_ID = 'c-demo-apollo-02';
const TODAY_DATE = '2026-09-21';

async function setup() {
  console.log('Resetting and setting up UI scenario...');
  await axios.post(`${API_BASE}/simulation/reset-demo`);

  const asstLogin = await axios.post(`${API_BASE}/auth/assistant/login`, {
    email: 'assistant02@demo.medlink.test',
    password: 'Clinic@3002',
  });
  const asstToken = asstLogin.data.token;

  const docLogin = await axios.post(`${API_BASE}/auth/doctor/login`, {
    email: 'doctor02@demo.medlink.test',
    password: 'Doctor@2002',
  });
  const docToken = docLogin.data.token;

  const patLogin = await axios.post(`${API_BASE}/auth/login`, {
    email: 'patient02@demo.medlink.test',
    password: 'Demo@1002',
  });
  const patToken = patLogin.data.token;

  // 1. Availability
  const reqRes = await axios.post(
    `${API_BASE}/availability/requests`,
    {
      doctor_id: DOCTOR_ID,
      clinic_id: CLINIC_ID,
      specialty: 'General Medicine',
      date: TODAY_DATE,
      start_time: '08:30 PM',
      end_time: '11:00 PM',
      notes: 'Evening session',
    },
    { headers: { Authorization: `Bearer ${asstToken}` } }
  );
  await axios.post(
    `${API_BASE}/availability/requests/${reqRes.data.request.id}/approve`,
    {},
    { headers: { Authorization: `Bearer ${docToken}` } }
  );

  // 2. Patient books
  const bookRes = await axios.post(
    `${API_BASE}/appointments/book`,
    {
      patientId: 'pat-demo-02',
      patientName: 'Sneha Patel',
      patientPhone: '+91 9000000002',
      doctorId: DOCTOR_ID,
      clinicId: CLINIC_ID,
      department: 'General Medicine',
      date: TODAY_DATE,
      time: '08:50 PM',
      reason: 'Routine consultation',
      expectedDuration: '20 min',
      consultationFee: '₹500',
    },
    { headers: { Authorization: `Bearer ${patToken}` } }
  );
  const aptId = bookRes.data.appointment.id;

  // 3. Check in
  await axios.post(
    `${API_BASE}/appointments/${aptId}/check-in`,
    {},
    { headers: { Authorization: `Bearer ${asstToken}` } }
  );

  // 4. Emergency walk-in
  const em = await axios.post(
    `${API_BASE}/walk-ins`,
    {
      clinicId: CLINIC_ID,
      patientName: 'Emergency Patient 1',
      phone: '+919999999991',
      reason: 'Acute Chest Pain',
      priority: 'EMERGENCY',
      doctorId: DOCTOR_ID,
    },
    { headers: { Authorization: `Bearer ${asstToken}` } }
  );
  const emId = em.data.walkIn?.id || em.data.walkInId;

  // Start consult for emergency patient
  await axios.patch(
    `${API_BASE}/queue/${emId}/status`,
    { status: 'IN_CONSULTATION' },
    { headers: { Authorization: `Bearer ${asstToken}` } }
  );

  // 5. 3 Normal walk-ins
  for (let i = 1; i <= 3; i++) {
    await axios.post(
      `${API_BASE}/walk-ins`,
      {
        clinicId: CLINIC_ID,
        patientName: `Normal Patient ${i}`,
        phone: `+91988888880${i}`,
        reason: `Routine Checkup ${i}`,
        priority: 'NORMAL',
        doctorId: DOCTOR_ID,
      },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );
  }

  console.log('UI Scenario setup complete!');
}

setup();
