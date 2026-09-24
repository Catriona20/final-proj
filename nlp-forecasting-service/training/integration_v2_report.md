# Module 10: Production v2.0.0 Service Integration Report

## 1. Executive Summary

- **Model Version:** `nlp-dept-clf-v2.0.0`
- **Model Artifact:** `models/department_classifier.joblib` (FeatureUnion: Word TF-IDF (1,2) + Char TF-IDF (3,5) + Logistic Regression)
- **Service State:** Successfully loaded and operational.
- **Rule E Decision Criterion:** $\text{Accept if } P_{\text{top1}} \ge 0.35 \text{ AND } \Delta P \ge 0.10$
- **Health & Readiness Endpoints:** `GET /health` (200 OK) & `GET /ready` (200 OK).

---

## 2. Files Modified & Immutability Verification

| File | Status | Notes |
| :--- | :--- | :--- |
| `services/symptom_classifier.py` | **Modified** | Updated to extract word vocabulary from FeatureUnion and execute v2.0.0 pipeline inference. |
| `models/department_classifier.joblib` | **Unchanged (v2.0.0)** | Serialized production champion pipeline. |
| `models/department_classifier_metadata.json` | **Unchanged (v2.0.0)** | Production metadata record. |
| `data/processed/department_train_candidate.csv` | **Unchanged** | 4,785 training samples. |
| `data/processed/department_test_candidate.csv` | **Unchanged** | 2,019 held-out test samples. |
| `schemas/symptoms.py` | **Unchanged** | Retains extended `routing_status` and `confidence_margin` schema. |
| `utils/emergency_detector.py` | **Unchanged** | Independent emergency triage detector. |
| `main.py` | **Unchanged** | FastAPI route handlers. |

---

## 3. Detailed Test Case Predictions (Cases A - L)

| Case | Input Narrative | Routing Status | Recommended Dept | Specialist | Conf Score | Top-2 Dept | Margin | Emergency | Emergency Reason |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **A** | *"I have pain and pressure in my chest and my heart is beating very fast"* | `recommended` | **Cardiology** | Cardiologist | 0.79 (78.8%) | Pulmonology (5.8%) | 0.73 | `False` | None |
| **B** | *"I have a red itchy rash on my skin"* | `recommended` | **Dermatology** | Dermatologist | 0.86 (85.7%) | Orthopedics (1.5%) | 0.84 | `False` | None |
| **C** | *"My knee hurts whenever I climb stairs"* | `recommended` | **Orthopedics** | Orthopedic Surgeon | 0.83 (82.9%) | Neurology (1.6%) | 0.81 | `False` | None |
| **D** | *"I have been having severe headaches and dizziness"* | `requires_further_assessment` | ***None*** | *None* | 0.26 (26.0%) | Pulmonology (9.7%) | 0.16 | `False` | None |
| **E** | *"I have stomach pain with nausea and vomiting"* | `recommended` | **Gastroenterology** | Gastroenterologist | 0.77 (77.4%) | Orthopedics (5.4%) | 0.72 | `False` | None |
| **F** | *"I cannot breathe and I am gasping for air"* | `recommended` | **Pulmonology** | Pulmonologist | 0.74 (73.8%) | Orthopedics (2.8%) | 0.71 | `True` | Potential severe respiratory distress |
| **G** | *"hello"* | `requires_further_assessment` | ***None*** | *None* | 0.14 (14.3%) | Dermatology (11.6%) | 0.03 | `False` | None |
| **H** | *"My heart hurts 💔 so much, can't take it"* | `recommended` | **Cardiology** | Cardiologist | 0.86 (85.6%) | Orthopedics (3.3%) | 0.82 | `False` | None |
| **I** | *"my skin is itchy and I have a red rash"* | `recommended` | **Dermatology** | Dermatologist | 0.84 (83.8%) | Hematology (1.8%) | 0.82 | `False` | None |
| **J** | *"my lower back hurts after lifting something heavy"* | `recommended` | **Orthopedics** | Orthopedic Surgeon | 0.66 (65.9%) | Gastroenterology (4.0%) | 0.62 | `False` | None |
| **K** | *"I have blurry vision in my left eye"* | `recommended` | **Ophthalmology** | Ophthalmologist | 0.86 (86.3%) | Cardiology (2.6%) | 0.84 | `False` | None |
| **L** | *"I have burning while urinating"* | `requires_further_assessment` | ***None*** | *None* | 0.21 (20.7%) | Orthopedics (16.6%) | 0.04 | `False` | None |

---

## 4. Specific Safety & Ambiguity Verifications

1. **Case D ('headaches and dizziness'):**
   - Raw prediction: Neurology ($P = 25.99\%$, Margin $= 16.25\%$).
   - Rule E Decision: `requires_further_assessment` (properly abstained due to $P < 0.35$).

2. **Case F ('cannot breathe and I am gasping for air'):**
   - Emergency Status: `is_emergency = true` with reason *'Potential severe respiratory distress'*.
   - Model Prediction: Pulmonology ($P = 73.80\%$).
   - Verification: Emergency detector operated completely independently from ML routing.

3. **Case G ('hello'):**
   - Raw prediction: Orthopedics ($P = 14.27\%$, Margin $= 2.64\%$).
   - Rule E Decision: `requires_further_assessment` (properly abstained on out-of-distribution input).

4. **Case H ('My heart hurts 💔 so much, can't take it'):**
   - Raw prediction: Cardiology ($P = 85.56\%$, Margin $= 82.21\%$).
   - Rule E Decision: `recommended` -> Cardiology.
   - Finding: Confirms known limitation of pure n-gram matching on metaphorical heartbreak.

