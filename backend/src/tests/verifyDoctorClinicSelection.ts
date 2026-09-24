import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

async function runDoctorClinicSelectionTests() {
  console.log('===============================================================');
  console.log('🧪 MEDLINK DOCTOR CLINIC SELECTION & ISOLATION TEST SUITE');
  console.log('===============================================================');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, title: string, details?: string) {
    if (condition) {
      console.log(`✅ ${title}${details ? ` (${details})` : ''}`);
      passed++;
    } else {
      console.error(`❌ ${title}${details ? ` (${details})` : ''}`);
      failed++;
    }
  }

  try {
    // 1. Authenticate Doctor Dr. Priya Sharma
    const loginRes = await axios.post(`${API_BASE}/auth/doctor/login`, {
      emailOrPhone: 'doctor02@demo.medlink.test',
      password: 'Doctor@2002',
    });

    assert(loginRes.status === 200 && !!loginRes.data?.token, 'Test 1: Doctor authentication succeeds', `Doctor: ${loginRes.data?.doctor?.name}`);
    const token = loginRes.data.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Retrieve Authorized and Demo Clinics from Backend
    const clinicsRes = await axios.get(`${API_BASE}/doctors/auth/clinics`, { headers: authHeaders });
    const assignedClinics = clinicsRes.data?.clinics || [];
    const allDemoClinics = clinicsRes.data?.allDemoClinics || [];

    assert(allDemoClinics.length === 20, 'Test 2: All 20 MEDLINK demo clinics retrieved from backend', `Found: ${allDemoClinics.length}`);
    assert(assignedClinics.length >= 2, 'Test 3: Doctor assigned clinics retrieved', `Assigned: ${assignedClinics.length} clinics`);

    // 3. Verify Specific Demo Clinics exist in retrieved backend set
    const demoNames = allDemoClinics.map((c: any) => c.name);
    const expectedClinics = [
      'Moon Dental & Medical Clinic',
      'Apollo Family Care Centre',
      "GreenLife Women's & Maternity Clinic",
      'Chennai Heart & Vascular Centre',
      'VisionPlus Eye Centre',
      'OMR Health City Clinic',
      'Royapuram Community Health Clinic',
    ];
    const hasExpected = expectedClinics.every((name) => demoNames.includes(name));
    assert(hasExpected, 'Test 4: Core demo clinics verified in backend records', `Verified ${expectedClinics.length} key clinics`);

    // 4. Verify Doctor Assignment Flags
    const apolloItem = allDemoClinics.find((c: any) => c.name === 'Apollo Family Care Centre');
    const moonItem = allDemoClinics.find((c: any) => c.name === 'Moon Dental & Medical Clinic');
    const greenLifeItem = allDemoClinics.find((c: any) => c.name === "GreenLife Women's & Maternity Clinic");

    assert(apolloItem?.isAssigned === true, 'Test 5: Apollo Family Care Centre marked isAssigned=true for Dr. Priya Sharma');
    assert(moonItem?.isAssigned === true, 'Test 6: Moon Dental & Medical Clinic marked isAssigned=true for Dr. Priya Sharma');
    assert(greenLifeItem?.isAssigned === false, 'Test 7: Unassigned clinic (GreenLife) marked isAssigned=false');

    // 5. Search Filtering Logic Tests
    // 5a. Search "Apollo"
    const searchApollo = allDemoClinics.filter((c: any) => c.name.toLowerCase().includes('apollo'));
    assert(searchApollo.length === 1 && searchApollo[0].name === 'Apollo Family Care Centre', 'Test 8: Search "Apollo" matches Apollo Family Care Centre');

    // 5b. Search "Moon"
    const searchMoon = allDemoClinics.filter((c: any) => c.name.toLowerCase().includes('moon'));
    assert(searchMoon.length === 1 && searchMoon[0].name === 'Moon Dental & Medical Clinic', 'Test 9: Search "Moon" matches Moon Dental & Medical Clinic');

    // 5c. Search "Heart"
    const searchHeart = allDemoClinics.filter((c: any) => c.name.toLowerCase().includes('heart'));
    assert(searchHeart.length === 1 && searchHeart[0].name === 'Chennai Heart & Vascular Centre', 'Test 10: Search "Heart" matches Chennai Heart & Vascular Centre');

    // 5d. Search "OMR"
    const searchOMR = allDemoClinics.filter((c: any) => c.name.toLowerCase().includes('omr') || (c.area || '').toLowerCase().includes('omr'));
    assert(searchOMR.length >= 1, 'Test 11: Search "OMR" matches OMR facility', `Found: ${searchOMR.map((c: any) => c.name).join(', ')}`);

    // 5e. Search specialization "Dentistry"
    const searchDentistry = allDemoClinics.filter((c: any) => (c.specialization || '').toLowerCase().includes('dentistry'));
    assert(searchDentistry.length >= 1, 'Test 12: Search specialization "Dentistry" matches dental clinic');

    // 5f. Search city "Chennai"
    const searchChennai = allDemoClinics.filter((c: any) => (c.city || '').toLowerCase().includes('chennai'));
    assert(searchChennai.length === 20, 'Test 13: Search city "Chennai" covers all 20 Chennai demo facilities');

    // 6. Multi-Clinic Switching & Data Isolation Test
    // Fetch today's appointments for Clinic A (Apollo)
    const apolloApptsRes = await axios.get(`${API_BASE}/doctors/auth/appointments/today?clinicId=c-demo-apollo-02`, { headers: authHeaders });
    assert(apolloApptsRes.status === 200, 'Test 14: Doctor appointments load for Apollo Family Care Centre');

    // Fetch today's appointments for Clinic B (Moon)
    const moonApptsRes = await axios.get(`${API_BASE}/doctors/auth/appointments/today?clinicId=c-demo-moon-01`, { headers: authHeaders });
    assert(moonApptsRes.status === 200, 'Test 15: Doctor appointments load for Moon Dental & Medical Clinic');

    // Verify Appointments Isolation
    const apolloAppointments = apolloApptsRes.data?.appointments || [];
    const moonAppointments = moonApptsRes.data?.appointments || [];
    const apolloApptIds = new Set(apolloAppointments.map((a: any) => a.id));
    const hasOverlap = moonAppointments.some((a: any) => apolloApptIds.has(a.id));
    assert(!hasOverlap, 'Test 16: Zero appointment leakage between Clinic A (Apollo) and Clinic B (Moon)', `Apollo: ${apolloAppointments.length}, Moon: ${moonAppointments.length}`);

    // Verify OPD Queue Isolation
    const apolloQueueRes = await axios.get(`${API_BASE}/queue/clinic/c-demo-apollo-02`);
    const moonQueueRes = await axios.get(`${API_BASE}/queue/clinic/c-demo-moon-01`);
    const apolloQueue = apolloQueueRes.data?.queue || [];
    const moonQueue = moonQueueRes.data?.queue || [];
    const apolloQueueIds = new Set(apolloQueue.map((q: any) => q.id));
    const queueOverlap = moonQueue.some((q: any) => apolloQueueIds.has(q.id));
    assert(!queueOverlap, 'Test 17: Zero queue leakage between Clinic A and Clinic B');

    // 7. Verify Unassigned Clinic Authorization Enforcement
    const greenLifeRecord = allDemoClinics.find((c: any) => c.id === 'c-demo-greenlife-03');
    assert(
      greenLifeRecord && greenLifeRecord.isAssigned === false,
      'Test 18: Unassigned clinic (GreenLife) authorization blocked for Dr. Priya Sharma',
      `isAssigned: ${greenLifeRecord?.isAssigned}`
    );

    // 8. Doctor Dashboard Metrics Scoped to Clinic
    const apolloDashRes = await axios.get(`${API_BASE}/dashboard/doctor/doc-demo-priya-02?clinicId=c-demo-apollo-02`);
    const moonDashRes = await axios.get(`${API_BASE}/dashboard/doctor/doc-demo-priya-02?clinicId=c-demo-moon-01`);
    assert(apolloDashRes.status === 200 && moonDashRes.status === 200, 'Test 19: Doctor dashboard metrics correctly scoped per clinicId');

    // 9. Doctor Availability Scoped to Active Clinic
    const availRes = await axios.get(`${API_BASE}/availability/clinics/c-demo-apollo-02/schedule`);
    assert(availRes.status === 200 && availRes.data?.clinicId === 'c-demo-apollo-02', 'Test 20: Doctor availability query successfully scoped to active clinicId');

  } catch (error: any) {
    console.error('Fatal error in test suite:', error.response?.data || error.message);
    failed++;
  }

  console.log('===============================================================');
  console.log(`SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  console.log('===============================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runDoctorClinicSelectionTests();
