import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const testCases = [
  { query: 'root canal', expectedDept: 'Dentistry' },
  { query: 'toothache', expectedDept: 'Dentistry' },
  { query: 'gum bleeding', expectedDept: 'Dentistry' },
  { query: 'chest pain', expectedDept: 'Cardiology' },
  { query: 'palpitations', expectedDept: 'Cardiology' },
  { query: 'acne', expectedDept: 'Dermatology' },
  { query: 'skin rash', expectedDept: 'Dermatology' },
  { query: 'ear pain', expectedDept: 'ENT' },
  { query: 'sinus', expectedDept: 'ENT' },
  { query: 'blurred vision', expectedDept: 'Ophthalmology' },
  { query: 'dry eyes', expectedDept: 'Ophthalmology' },
  { query: 'knee pain', expectedDept: 'Orthopedics' },
  { query: 'back pain', expectedDept: 'Orthopedics' },
  { query: 'child fever', expectedDept: 'Pediatrics' },
  { query: 'irregular periods', expectedDept: 'Gynecology' },
  { query: 'migraine', expectedDept: 'Neurology' },
  { query: 'stomach pain', expectedDept: 'Gastroenterology' },
  { query: 'fever', expectedDept: 'General Medicine' },
];

async function runPart31Tests() {
  console.log('============================================================');
  console.log('🔬 VERIFYING PART 31 — NLP DEPARTMENT ACCURACY SUITE');
  console.log('============================================================\n');

  let passed = 0;
  let failed = 0;

  for (const tc of testCases) {
    try {
      const res = await axios.post(`${API_BASE}/ai/symptom-analysis`, {
        query: tc.query,
      });

      const analysis = res.data?.analysis;
      const dept = analysis?.recommended_department || analysis?.department;

      if (dept && dept.toLowerCase() === tc.expectedDept.toLowerCase()) {
        console.log(`✅ "${tc.query}" -> ${dept} (Confidence: ${Math.round((analysis.confidence || 0.95) * 100)}%)`);
        passed++;
      } else {
        console.error(`❌ "${tc.query}" FAILED! Expected: ${tc.expectedDept}, Got: ${dept}`);
        failed++;
      }
    } catch (err) {
      console.error(`❌ "${tc.query}" Request Error:`, err.message);
      failed++;
    }
  }

  console.log('\n============================================================');
  console.log(`Results: ${passed}/${testCases.length} Passed, ${failed} Failed`);
  console.log('============================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runPart31Tests();
