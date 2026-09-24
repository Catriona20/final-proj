# Module 10: Final Production Regression Validation Report

**Overall Verdict:** **FAIL**

- **Model Version:** `nlp-dept-clf-v2.0.0`
- **Production Artifact:** `models/department_classifier.joblib`
- **Metadata File:** `models/department_classifier_metadata.json`
- **Validation Timestamp:** 2026-08-23 13:35:04 UTC

---

## 1. Test Suite Summary Matrix

| Test Suite Component | Status | Details |
| :--- | :--- | :--- |
| **Model Version Verification** | **PASSED** | Version=nlp-dept-clf-v2.0.0 |
| **17-Department Routing Coverage** | **FAILED** | 13/17 departments routed correctly |
| **Emergency Triage Safety Layer** | **PASSED** | 6/4 emergency cases triggered correctly |
| **Rule E Abstention Handling** | **PASSED** | 4/4 test cases properly abstained |
| **Pydantic Schema Validation (min_length=3)** | **PASSED** | All malformed/short payloads intercepted before inference |
| **Official Rule E Benchmark (Held-out Test)** | **PASSED** | Coverage=91.38%, Selective Acc=97.99%, Errors=37 |
| **Live FastAPI HTTP Socket Endpoints (/health, /ready, /analyze)** | **PASSED** | All HTTP probes, symptom analysis, and 422 error handlers verified |

---

## 2. 17-Department Routing Coverage

| Department | Target Specialist | Routing Status | Predicted Department | Conf Score | Margin | Test Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Cardiology** | Cardiologist | `recommended` | Cardiology | 0.79 | 0.73 | **PASSED** |
| **Dentistry** | Dentist | `recommended` | Dentistry | 0.73 | 0.62 | **PASSED** |
| **Dermatology** | Dermatologist | `recommended` | Dermatology | 0.85 | 0.83 | **PASSED** |
| **ENT** | ENT Specialist | `recommended` | ENT | 0.76 | 0.68 | **PASSED** |
| **Endocrinology** | Endocrinologist | `requires_further_assessment` | None | 0.35 | 0.05 | **FAILED** |
| **Gastroenterology** | Gastroenterologist | `recommended` | Gastroenterology | 0.74 | 0.69 | **PASSED** |
| **General Medicine** | General Physician | `recommended` | General Medicine | 0.49 | 0.33 | **PASSED** |
| **Gynecology** | Gynecologist | `recommended` | Gynecology | 0.52 | 0.42 | **PASSED** |
| **Hematology** | Hematologist | `recommended` | Hematology | 0.60 | 0.56 | **PASSED** |
| **Hepatology** | Hepatologist | `recommended` | Hepatology | 0.72 | 0.63 | **PASSED** |
| **Neurology** | Neurologist | `recommended` | Neurology | 0.58 | 0.52 | **PASSED** |
| **Ophthalmology** | Ophthalmologist | `recommended` | Ophthalmology | 0.83 | 0.81 | **PASSED** |
| **Orthopedics** | Orthopedic Surgeon | `recommended` | Orthopedics | 0.83 | 0.82 | **PASSED** |
| **Pediatrics** | Pediatrician | `requires_further_assessment` | None | 0.25 | 0.14 | **FAILED** |
| **Psychiatry** | Psychiatrist | `requires_further_assessment` | None | 0.16 | 0.02 | **FAILED** |
| **Pulmonology** | Pulmonologist | `recommended` | Pulmonology | 0.71 | 0.67 | **PASSED** |
| **Urology** | Urologist | `requires_further_assessment` | None | 0.27 | 0.03 | **FAILED** |

---

## 3. Emergency Triage Safety Layer

| Emergency Case | Symptom Text | Is Emergency | Emergency Reason | Routing Status | Recommended Dept | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Respiratory Emergency** | *"I cannot breathe and I am gasping for air"* | `True` | Potential severe respiratory distress | `recommended` | Pulmonology | **PASSED** |
| **Cardiac Emergency** | *"I have crushing chest pain radiating to left arm with heavy sweating"* | `True` | Potential acute cardiovascular emergency | `recommended` | Cardiology | **PASSED** |
| **Stroke Emergency** | *"Patient has sudden weakness and facial drooping with slurred speech"* | `True` | Potential acute stroke symptoms | `requires_further_assessment` | None | **PASSED** |
| **Neurological Emergency** | *"The patient passed out and is having a seizure"* | `True` | Neurological emergency / altered consciousness | `requires_further_assessment` | None | **PASSED** |
| **Anaphylaxis Emergency** | *"Severe anaphylaxis reaction with swelling of throat after insect sting"* | `True` | Severe allergic reaction / anaphylaxis | `recommended` | Pulmonology | **PASSED** |
| **Hemorrhage Emergency** | *"I am vomiting blood and experiencing severe bleeding"* | `True` | Critical hemorrhagic state | `recommended` | Gynecology | **PASSED** |

---

## 4. Rule E Abstention on OOD & Ambiguous Inputs

| Case | Input Text | Routing Status | Recommended Department | Conf Score | Margin | Result |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **OOD Greeting** | *"hello"* | `requires_further_assessment` | None | 0.14 | 0.03 | **PASSED** |
| **OOD Conversational** | *"what is your favorite movie?"* | `requires_further_assessment` | None | 0.18 | 0.04 | **PASSED** |
| **Multi-specialty ambiguous** | *"I have been having severe headaches and dizziness"* | `requires_further_assessment` | None | 0.26 | 0.16 | **PASSED** |
| **Vague constitutional** | *"I have burning while urinating"* | `requires_further_assessment` | None | 0.21 | 0.04 | **PASSED** |

---

## 5. Official Rule E Benchmark (Locked Held-Out Test Set)

- **Test Corpus:** `data/processed/department_test_candidate.csv` ($N = 2,019$)
- **Accepted Samples:** 1,845 (**91.38% Coverage**)
- **Abstained Samples:** 174 (**8.62% Abstention Rate**)
- **Selective Accuracy on Accepted:** **97.99%**
- **Selective Errors Remaining:** 37 (**2.01% Error Rate**)

---

## 6. Failed Tests List

The following tests failed:

- ❌ 17-Dept Routing Failed for Endocrinology: Got None (requires_further_assessment)
- ❌ 17-Dept Routing Failed for Pediatrics: Got None (requires_further_assessment)
- ❌ 17-Dept Routing Failed for Psychiatry: Got None (requires_further_assessment)
- ❌ 17-Dept Routing Failed for Urology: Got None (requires_further_assessment)
---

## 7. Production Artifact & Dataset Immutability Verification

- `models/department_classifier.joblib`: Verified intact (v2.0.0, 4.96 MB).
- `models/department_classifier_metadata.json`: Verified intact.
- `data/processed/department_train_candidate.csv`: Verified intact (4,785 rows).
- `data/processed/department_test_candidate.csv`: Verified intact (2,019 rows).
- `services/symptom_classifier.py`: Verified intact.
- `schemas/symptoms.py`: Verified intact.
- `utils/emergency_detector.py`: Verified intact.
