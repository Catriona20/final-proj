# Pharmacy Security Service (`pharmacy-security-service`)

A modular Node.js & Express service responsible for security operations (Module 12) and pharmacy inventory & dispensing management (Module 11) within the Healthcare Platform.

---

## Service Responsibilities

### Module 11: Pharmacy Inventory & Forecasting (Backend Core)
- **Medicines Catalog:** Management of pharmaceutical master catalog, pricing, categories, and reorder thresholds.
- **Batch Tracking & Stock:** Batch numbers, quantities, location bins, and expiry dates.
- **Stock Alerts:** Automated detection of low-stock thresholds and expiring batches.
- **Dispensing:** Transaction-safe dispensing linked to prescriptions and batch inventory deductions.
- **Historical Dispensing Data:** Tracking dispensations for time-series demand forecasting.

### Module 12: Security, Notification Integration & AI Analytics
- **Authentication & RBAC:** Single unified authentication model supporting exactly 3 primary roles: `patient`, `doctor`, `admin`.
- **Audit Logging:** Immutable audit records of authentication, inventory movements, and system actions.
- **AI Analytics & Feedback:** Ingestion and logging of symptom triage predictions, user accuracy feedback, and model performance metrics.
- **Notification Event Boundary:** Clean event triggering to the teammate's Notification Service (Email/SMS/WhatsApp delivery).

---

## Architecture & Directory Structure

```
pharmacy-security-service/
├── src/
│   ├── config/
│   │   └── database.js               # PostgreSQL connection pool & lifecycle management
│   ├── controllers/
│   │   ├── healthController.js       # Health & DB readiness probes
│   │   ├── authController.js         # Authentication, profile, & audit logging
│   │   ├── pharmacyController.js     # Medicines, inventory, alerts, & dispensing
│   │   └── analyticsController.js    # AI prediction logging, feedback, & evaluation
│   ├── db/
│   │   ├── migrations/
│   │   │   ├── 001_initial_schema.sql # DDL: users (3 roles), medicines, inventory, prescriptions
│   │   │   └── 002_dispensing_audit_analytics.sql # DDL: dispensations, audit_logs, ai_logs, feedback
│   │   ├── seeds/
│   │   │   └── 001_seed_dev_data.sql  # Development fixtures for all tables
│   │   ├── migrate.js                # Migration runner
│   │   └── seed.js                   # Seed data runner
│   ├── middleware/
│   │   ├── authMiddleware.js         # JWT authenticate & authorize(role) RBAC middleware
│   │   ├── errorHandler.js           # Centralized error handler
│   │   └── notFoundHandler.js        # 404 handler
│   ├── routes/
│   │   ├── index.js                  # Top-level route aggregator
│   │   ├── healthRoutes.js           # /health, /health/db
│   │   ├── authRoutes.js             # /api/auth/*
│   │   ├── pharmacyRoutes.js         # /api/pharmacy/*
│   │   └── analyticsRoutes.js        # /api/analytics/*
│   ├── services/
│   │   ├── index.js                  # Service layer aggregator
│   │   ├── authService.js            # User management & audit querying
│   │   ├── pharmacyService.js        # Inventory transactions & stock alert queries
│   │   ├── analyticsService.js       # AI prediction logging & feedback analytics
│   │   └── notificationClient.js     # Outbound event dispatch stub to Notification Service
│   └── utils/
│       └── auditLogger.js            # Immutable audit logging helper
├── .env.example                      # Environment template
├── package.json
└── README.md
```

---

## Role-Based Access Control (RBAC)

The platform supports 3 primary roles:
1. `patient`: Access to own profile, personal prescriptions, AI symptom triage, and prediction feedback.
2. `doctor`: Medicine catalog, batch inventory visibility, stock alerts, prescription dispensing, and symptom triage analytics.
3. `admin`: Full administrative control, catalog modifications, batch stock adjustments, audit logs, and AI evaluation metrics.

---

## Provisional API Endpoints

### 1. Health Checks
- `GET /health` - Service liveness
- `GET /health/db` - PostgreSQL connection latency & status

### 2. Authentication & Security (Module 12)
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate and retrieve token
- `GET /api/auth/me` - Authenticated user profile (All roles)
- `GET /api/auth/audit-logs` - System audit log history (`admin` only)

### 3. Pharmacy & Inventory (Module 11)
- `GET /api/pharmacy/medicines` - Medicine catalog (`patient`, `doctor`, `admin`)
- `GET /api/pharmacy/inventory` - Batch-level inventory (`doctor`, `admin`)
- `GET /api/pharmacy/alerts/low-stock` - Low stock threshold alerts (`doctor`, `admin`)
- `GET /api/pharmacy/alerts/expiring` - Batches nearing expiry (`doctor`, `admin`)
- `POST /api/pharmacy/dispense` - Record dispensation & deduct stock (`doctor`, `admin`)

### 4. AI Analytics & Feedback (Module 12)
- `POST /api/analytics/symptoms/log` - Ingest symptom prediction log
- `POST /api/analytics/symptoms/feedback` - Submit accuracy feedback (`patient`, `doctor`, `admin`)
- `GET /api/analytics/models/performance` - Model evaluation metrics (`admin` only)

---

## Team Integration Boundaries

- **Notification Service (Teammate Owned):** Delivery via Email, SMS, WhatsApp is handled externally. Our service dispatches event payloads via `notificationClient.js`.
- **Map / Clinic Service (Teammate Owned):** Geolocation, distance matrix, and map rendering are handled externally.
