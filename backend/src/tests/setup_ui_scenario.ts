import axios from 'axios';

const API_BASE = 'http://127.0.0.1:5000/api';
const DOCTOR_ID = 'doc-demo-priya-02';
const CLINIC_ID = 'c-demo-apollo-02';
const TODAY_DATE = '2026-09-21';

async function setup() {
  console.log('Resetting and seeding UI scenario...');
  await axios.post(`${API_BASE}/simulation/reset-demo`);

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

  // 1. Create and approve schedule
  const reqRes = await axios.post(
    `${API_BASE}/availability/requests`,
    {
      doctor_id: DOCTOR_ID,
      clinic_id: CLINIC_ID,
      specialty: 'General Medicine',
      date: TODAY_DATE,
      start_time: '05:00 PM',
      end_time: '08:00 PM',
      notes: 'Evening session',
    },
    { headers: { Authorization: `Bearer ${asstToken}` } }
  );
  await axios.post(
    `${API_BASE}/availability/requests/${reqRes.data.request.id}/approve`,
    {},
    { headers: { Authorization: `Bearer ${docToken}` } }
  );

  // 2. Active emergency patient in consultation
  const p0 = await axios.post(
    `${API_BASE}/walk-ins`,
    {
      clinicId: CLINIC_ID,
      patientName: 'Emergency Patient',
      phone: '+919000000099',
      reason: 'Acute Chest Pain',
      priority: 'EMERGENCY',
      doctorId: DOCTOR_ID,
    },
    { headers: { Authorization: `Bearer ${asstToken}` } }
  );
  await axios.patch(
    `${API_BASE}/queue/${p0.data.walkIn.id}/status`,
    { status: 'IN_CONSULTATION' },
    { headers: { Authorization: `Bearer ${asstToken}` } }
  );

  // 3. 5 Waiting patients
  const waitingNames = ['Ananya Sen', 'Vikram Patel', 'Deepa Rao', 'Manoj Kumar', 'Sunita Reddy'];
  for (const name of waitingNames) {
    await axios.post(
      `${API_BASE}/walk-ins`,
      {
        clinicId: CLINIC_ID,
        patientName: name,
        phone: '+919000000088',
        reason: 'Routine Checkup',
        priority: 'NORMAL',
        doctorId: DOCTOR_ID,
      },
      { headers: { Authorization: `Bearer ${asstToken}` } }
    );
  }

  console.log('✅ UI Scenario seeded: 1 Active Consultation (Emergency Patient) + 5 Waiting patients.');
}

setup().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
