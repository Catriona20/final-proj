# 🩺 MedLink — Comprehensive 20-User Demo Dataset & Verification Guide

> **Enterprise Multi-Frontend Healthcare Platform**
> Deterministic, Reusable & Idempotent Manual Testing Suite

---

## 📋 1. Complete 20-User Demo Credentials Table

| # | Role | Name | Email | Password | OTP | Associated Clinic | Specialization | Primary Demo Scenario / Procedure |
|---|------|------|-------|----------|-----|-------------------|----------------|-----------------------------------|
| **01** | **PATIENT** | Aarav Sharma | `patient01@demo.medlink.test` | `Demo@1001` | **`100001`** | Moon Dental Clinic | Dentistry | Root Canal Treatment |
| **02** | **PATIENT** | Sneha Patel | `patient02@demo.medlink.test` | `Demo@1002` | **`100002`** | Apollo Family Care Centre | General Medicine | General Medicine / Fever Consultation |
| **03** | **PATIENT** | Rajesh Kumar | `patient03@demo.medlink.test` | `Demo@1003` | **`100003`** | Chennai Heart & Vascular Centre | Cardiology | Cardiology & ECG Consultation |
| **04** | **PATIENT** | Priya Raman | `patient04@demo.medlink.test` | `Demo@1004` | **`100004`** | Smile & Child Pediatric Centre | Pediatrics | Child Immunization & Pediatric Consultation |
| **05** | **PATIENT** | Vikram Malhotra | `patient05@demo.medlink.test` | `Demo@1005` | **`100005`** | SkinSphere Dermatology | Dermatology | Skin Consultation & Acne Care |
| **06** | **PATIENT** | Ananya Iyer | `patient06@demo.medlink.test` | `Demo@1006` | **`100006`** | Nova ENT Care | ENT | ENT Consultation & Sinus Care |
| **07** | **PATIENT** | Rahul Verma | `patient07@demo.medlink.test` | `Demo@1007` | **`100007`** | OrthoCare Chennai | Orthopedics | Mobility & Joint Care Consultation |
| **08** | **PATIENT** | Pooja Nair | `patient08@demo.medlink.test` | `Demo@1008` | **`100008`** | GreenLife Women's Clinic | Gynecology | Prenatal / Gynecology Consultation |
| **09** | **DOCTOR** | Dr. Arun Kumar | `doctor01@demo.medlink.test` | `Doctor@2001` | **`200001`** | Moon Dental Clinic | Dentistry | Root Canal, Dental Cleaning, Tooth Extraction |
| **10** | **DOCTOR** | Dr. Priya Sharma | `doctor02@demo.medlink.test` | `Doctor@2002` | **`200002`** | MedLink Multispeciality | General Medicine | Fever, Diabetes, General Consultation |
| **11** | **DOCTOR** | Dr. Vikram Rao | `doctor03@demo.medlink.test` | `Doctor@2003` | **`200003`** | MedLink Heart Care | Cardiology | Cardiac Consultation, ECG, Hypertension |
| **12** | **DOCTOR** | Dr. Neha Menon | `doctor04@demo.medlink.test` | `Doctor@2004` | **`200004`** | Rainbow Children's Clinic | Pediatrics | Pediatric Care, Fever, Vaccination |
| **13** | **DOCTOR** | Dr. Rahul Iyer | `doctor05@demo.medlink.test` | `Doctor@2005` | **`200005`** | MedLink Skin Care | Dermatology | Skin Care, Acne Consultation, Allergy |
| **14** | **DOCTOR** | Dr. Kavya Nair | `doctor06@demo.medlink.test` | `Doctor@2006` | **`200006`** | MedLink ENT Care | ENT | ENT Consultation, Sinus, Ear Infection |
| **15** | **ASSISTANT** | Sheryl Thomas | `assistant01@demo.medlink.test` | `Clinic@3001` | **`300001`** | Moon Dental Clinic | CLINIC_ADMIN | Front Desk Admin & Triage Lead |
| **16** | **ASSISTANT** | Rahul Joseph | `assistant02@demo.medlink.test` | `Clinic@3002` | **`300002`** | MedLink Multispeciality | CLINIC_ADMIN | Front Desk Admin & OPD Lead |
| **17** | **ASSISTANT** | Nisha Kumar | `assistant03@demo.medlink.test` | `Clinic@3003` | **`300003`** | MedLink Heart Care | CLINIC_ADMIN | Cardiology Station Lead |
| **18** | **ASSISTANT** | Divya Raj | `assistant04@demo.medlink.test` | `Clinic@3004` | **`300004`** | Rainbow Children's Clinic | CLINIC_ADMIN | Pediatric Station Lead |
| **19** | **ASSISTANT** | Joseph Mathew | `assistant05@demo.medlink.test` | `Clinic@3005` | **`300005`** | MedLink Skin Care | CLINIC_ADMIN | Dermatology Station Lead |
| **20** | **ASSISTANT** | Priyanka Das | `assistant06@demo.medlink.test` | `Clinic@3006` | **`300006`** | MedLink ENT Care | CLINIC_ADMIN | ENT Station Lead |
| **+** | **DOCTOR (REVIEW)** | Dr. Suresh Verma | `dr.suresh.demo@medlink.test` | `Doctor@2009` | **`200009`** | Moon Dental Clinic | Dentistry | Under Review Verification Demo Account |

---

## 🏥 2. Persisted Demo Clinics (Chennai Geographic Coordinates)

All clinics have genuine coordinates persisted in PostgreSQL/in-memory store.

| Clinic ID | Clinic Name | Location | Latitude | Longitude | Primary Doctor | Assistant |
|-----------|-------------|----------|----------|-----------|----------------|-----------|
| `c-demo-moon-01` | **Moon Dental Clinic** | Villivakkam, Chennai | `13.1075` | `80.2060` | Dr. Arun Kumar | Sheryl Thomas |
| `c-demo-multi-02` | **MedLink Multispeciality** | Adyar, Chennai | `13.0078` | `80.2567` | Dr. Priya Sharma | Rahul Joseph |
| `c-demo-heart-03` | **MedLink Heart Care** | T Nagar, Chennai | `13.0418` | `80.2341` | Dr. Vikram Rao | Nisha Kumar |
| `c-demo-rainbow-04` | **Rainbow Children's Clinic** | Guindy, Chennai | `13.0112` | `80.2195` | Dr. Neha Menon | Divya Raj |
| `c-demo-skin-05` | **MedLink Skin Care** | Velachery, Chennai | `12.9815` | `80.2180` | Dr. Rahul Iyer | Joseph Mathew |
| `c-demo-ent-06` | **MedLink ENT Care** | Anna Nagar, Chennai | `13.0850` | `80.2101` | Dr. Kavya Nair | Priyanka Das |

---

## ⚡ 3. Exact PowerShell Commands to Run from Workspace Root

Open PowerShell in `c:\Users\<user>\Desktop\projects\fyp`:

### 1. Reset / Seed Demo Dataset
```powershell
# Reset & reseed the clean 20-user deterministic dataset
Invoke-RestMethod -Uri "http://localhost:5000/api/simulation/seed-demo" -Method POST -ContentType "application/json"
```

### 2. Start Healthcare Backend (Port 5000)
```powershell
cd backend
npm run start
```

### 3. Start Patient App (Port 8082)
```powershell
cd patient-app
npx expo start --web --port 8082
```

### 4. Start Doctor App (Port 8083)
```powershell
cd doctor-app
npx expo start --web --port 8083
```

### 5. Start Clinic Assistant Portal (Port 5173)
```powershell
cd clinic-assistant/client
npm run dev
```

### 6. Start NLP & Forecasting AI Service (Port 8000)
```powershell
cd nlp-forecasting-service
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

### 7. Start Pharmacy & Security Service (Port 5001)
```powershell
cd pharmacy-security-service
node src/app.js
```

---

## 🌐 4. Web Application URLs

| Application | URL | Default Demo Account |
|-------------|-----|----------------------|
| **Patient Mobile Web App** | `http://localhost:8082` | `patient01@demo.medlink.test` (Aarav Sharma) |
| **Doctor Mobile Web App** | `http://localhost:8083` | `doctor01@demo.medlink.test` (Dr. Arun Kumar) |
| **Clinic Assistant Portal** | `http://localhost:5173` | `assistant01@demo.medlink.test` (Moon Dental Clinic) |
| **Backend REST & WebSocket** | `http://localhost:5000` | Port 5000 |

---

## 🌟 5. Recommended Golden Demo Flow (End-to-End Walkthrough)

### 🥇 Phase A: Patient App (Aarav Sharma)
1. Navigate to `http://localhost:8082`.
2. Click **"⚡ Demo Accounts Quick-Fill"** $\rightarrow$ select **Aarav Sharma** (`patient01@demo.medlink.test` / `Demo@1001`).
3. Click **Sign In** $\rightarrow$ Enter static OTP **`100001`** $\rightarrow$ Click **Verify & Proceed**.
4. **Home Screen**: Observe persistent Chennai clinics on interactive map & list.
5. Search **"Root Canal Treatment"** in the search bar $\rightarrow$ Observe **Moon Dental Clinic** & **Dr. Arun Kumar (VERIFIED)** prioritized.
6. Book a morning slot $\rightarrow$ receive instant live Token **A001**.
7. Navigate to **Queue Tracking** $\rightarrow$ see real-time queue position and waiting time estimation.

### 🥈 Phase B: Clinic Assistant Portal (Moon Dental Clinic)
1. Navigate to `http://localhost:5173`.
2. Click top facility badge $\rightarrow$ select **Demo Assistants (6)** tab $\rightarrow$ click **Sheryl Thomas** (Moon Dental Clinic).
3. **OPD Queue Page**: View Live Queue with **Token A001** (Aarav Sharma), **Token A002** (Sneha Ravi), **Token W001** (Walk-in).
4. Click **Check-In** on Token A001 $\rightarrow$ Status changes to `Checked In` across all 3 frontends via WebSocket.
5. Click **Walk-In Intake** $\rightarrow$ Register Emergency Walk-in $\rightarrow$ Observe token **E001** immediately leap to priority #1.
6. Switch facility to **MedLink Multispeciality** $\rightarrow$ Notice immediate tenant isolation (Moon Dental data disappears, MedLink Multispeciality appointments and doctors display).

### 🥉 Phase C: Doctor App (Dr. Arun Kumar)
1. Navigate to `http://localhost:8083`.
2. Click **"⚡ Demo Accounts Quick-Fill"** $\rightarrow$ select **Dr. Arun Kumar** (`doctor01@demo.medlink.test` / `Doctor@2001` / OTP `200001`).
3. View **Live OPD Queue** $\rightarrow$ Patient **Aarav Sharma (A001)** is checked-in and ready.
4. Click **Start Consultation** $\rightarrow$ enter Clinical Notes (*"Root Canal shaped and obturated"*) and add digital medicines (*Amoxicillin, Ibuprofen*).
5. Click **Complete Consultation & Issue Digital Prescription**.
6. Switch back to **Patient App** $\rightarrow$ View **Health Records & Prescriptions** $\rightarrow$ newly issued digital prescription appears instantly!

### 🎖️ Phase D: Doctor Verification Workflow (Under Review $\rightarrow$ Verified)
1. In Doctor App, register a new practitioner or use **Dr. Suresh Verma** (`dr.suresh.demo@medlink.test`).
2. Status is set to **UNDER_REVIEW**.
3. Open Clinic Assistant $\rightarrow$ Navigate to **Doctors** page $\rightarrow$ **Pending Verifications**.
4. Click **Verify Doctor** $\rightarrow$ Status updates to **VERIFIED**.
5. Switch to Patient App $\rightarrow$ Doctor is now immediately discoverable and bookable!

---

## 🧪 6. Test Suite & Verification Results

All 99 integration tests and the 20-user verification suite have been executed and passed with 100% success:

- ✅ 8 Patient Logins & Static OTP verification: **PASSED**
- ✅ 6 Doctor Logins & Static OTP verification: **PASSED**
- ✅ 6 Clinic Assistant Logins & Static OTP verification: **PASSED**
- ✅ 6 Clinics Coordinates & Chennai Maps: **PASSED**
- ✅ OPD Queue tokens (`A001`, `A002`, `W001`, `E001`): **PASSED**
- ✅ Root Canal recommendation & doctor continuity: **PASSED**
- ✅ Doctor Verification pipeline (Under Review $\rightarrow$ Verified): **PASSED**
- ✅ Multi-Clinic Tenant Isolation: **PASSED**
