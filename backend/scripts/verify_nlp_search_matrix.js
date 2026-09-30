const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

const TEST_MATRIX = [
  { query: 'root canal', expectedDept: 'Dentistry', expectedClinic: 'Moon Dental' },
  { query: 'tooth pain', expectedDept: 'Dentistry', expectedClinic: 'Moon Dental' },
  { query: 'skin rash', expectedDept: 'Dermatology', expectedClinic: 'SkinSphere' },
  { query: 'chest pain', expectedDept: 'Cardiology', expectedClinic: 'Chennai Heart' },
  { query: 'knee pain', expectedDept: 'Orthopedics', expectedClinic: 'OrthoCare' },
  { query: 'eye irritation', expectedDept: 'Ophthalmology', expectedClinic: 'VisionPlus' },
  { query: 'ear pain', expectedDept: 'ENT', expectedClinic: 'Nova ENT' },
  { query: 'child fever', expectedDept: 'Pediatrics', expectedClinic: 'Smile & Child' },
  { query: 'breathing problem', expectedDept: 'Pulmonology', expectedClinic: 'CarePoint' },
  { query: 'headache', expectedDept: 'Neurology', expectedClinic: 'NeuroBridge' },
  { query: 'stomach pain', expectedDept: 'Gastroenterology', expectedClinic: 'Digestive Health' },
  { query: 'kidney problem', expectedDept: 'Nephrology', expectedClinic: 'RenalCare' },
  { query: 'diabetes', expectedDept: 'Endocrinology', expectedClinic: 'EndoWell' },
  { query: 'urine problem', expectedDept: 'Urology', expectedClinic: 'UroCare' },
  { query: 'back pain physiotherapy', expectedDept: 'Physiotherapy', expectedClinic: 'PhysioMotion' },
  { query: 'anxiety', expectedDept: 'Psychiatry', expectedClinic: 'MindCare' },
  { query: 'pregnancy', expectedDept: 'Gynecology', expectedClinic: 'GreenLife' },
];

async function runMatrix() {
  console.log('🧪 RUNNING 17-DEPARTMENT NLP SEARCH & CROSS-CLINIC MATRIX TEST...\n');
  let passed = 0;
  let failed = 0;

  for (const item of TEST_MATRIX) {
    try {
      // 1. Symptom Analysis endpoint
      const symRes = await axios.post(`${API_BASE}/ai/symptom-analysis`, { query: item.query });
      const dept = symRes.data.analysis.recommended_department || symRes.data.analysis.department;
      
      if (dept !== item.expectedDept) {
        console.error(`❌ [${item.query}]: Expected department ${item.expectedDept}, got ${dept}`);
        failed++;
        continue;
      }

      // 2. Clinic Discovery by department / query
      const discRes = await axios.get(`${API_BASE}/clinics/discovery?query=${encodeURIComponent(item.query)}&department=${encodeURIComponent(dept)}`);
      const clinics = discRes.data.clinics || [];
      const topClinic = clinics.find((c) => c.name.toLowerCase().includes(item.expectedClinic.toLowerCase()));

      if (!topClinic) {
        console.error(`❌ [${item.query}]: Matching clinic ${item.expectedClinic} not found in discovery for ${dept}!`);
        failed++;
        continue;
      }

      // 3. Doctors in the clinic
      const docRes = await axios.get(`${API_BASE}/clinics/${topClinic.id}/doctors`);
      const doctors = docRes.data.doctors || [];
      const specDoc = doctors.find((d) => d.specialization.toLowerCase() === dept.toLowerCase() || d.clinic_id === topClinic.id);

      if (!specDoc) {
        console.error(`❌ [${item.query}]: No doctors found for ${dept} in ${topClinic.name}!`);
        failed++;
        continue;
      }

      // 4. Doctor Available Slots
      const slotRes = await axios.get(`${API_BASE}/doctors/${specDoc.id}/slots?date=2026-09-09`);
      const slots = slotRes.data.slots || {};
      const totalSlots = (slots.morning?.length || 0) + (slots.afternoon?.length || 0) + (slots.evening?.length || 0);

      console.log(`✅ [${item.query.padEnd(24)}] -> Dept: ${dept.padEnd(16)} -> Clinic: ${topClinic.name.padEnd(32)} -> Doctor: ${specDoc.name.padEnd(24)} (${totalSlots} slots)`);
      passed++;
    } catch (err) {
      console.error(`❌ [${item.query}]: Request error:`, err.response?.data || err.message);
      failed++;
    }
  }

  console.log(`\n============================================================`);
  console.log(`RESULTS: ${passed} PASSED, ${failed} FAILED out of ${TEST_MATRIX.length}`);
  console.log(`============================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runMatrix();
