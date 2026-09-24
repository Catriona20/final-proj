# 🏥 Clinic Assistant & Receptionist Dashboard

A comprehensive full-stack clinic management system featuring real-time queue management, doctor availability, appointment scheduling, and walk-in triage.

---

## 🚀 Quick Start Guide

### 1. Start the Backend API Server
Open a terminal and run:
```bash
cd server
npm run dev
```
- **Server URL**: [http://localhost:5000](http://localhost:5000)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **API Endpoints**:
  - `/api/dashboard` — Clinic metrics and summary
  - `/api/appointments/today` — Daily appointment schedule
  - `/api/queue` — Real-time waiting queue
  - `/api/doctors` — Doctor availability & status
  - `/api/walk-ins` — Walk-in patient triage

---

### 2. Start the Frontend Application
Open a second terminal and run:
```bash
cd client
npm run dev
```
- **Web App**: [http://localhost:5173](http://localhost:5173)

---

## 🛠️ Tech Stack
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM
- **Backend**: Node.js, Express, TypeScript, tsx
- **Database**: In-memory seed store with PostgreSQL integration ready (`pg`, schema & seed SQL files)
