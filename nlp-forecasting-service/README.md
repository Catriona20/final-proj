# NLP & Forecasting Service (`nlp-forecasting-service`)

A Python & FastAPI microservice dedicated to NLP Symptom & Department Recommendation (Module 10) and Demand Forecasting (Module 11) for the Healthcare Platform.

---

## Service Responsibilities

### Module 10: NLP Symptom & Department Recommendation
- **Symptom & Keyword Extraction:** Parses free-text symptoms submitted by patients.
- **Department & Specialist Classification:** Maps symptom patterns to the appropriate medical specialty (Cardiology, Dermatology, Neurology, Gastroenterology, Orthopedics, General Medicine).
- **Emergency Triage Flagging:** Rule-based detection of red-flag symptoms (cardiac arrest indicators, severe respiratory distress, acute stroke indicators, anaphylaxis).
- **Confidence Scoring:** Outputs classification confidence for downstream triage routing.

### Module 11: Demand Forecasting (ML Component)
- **Time-Series Projection:** Projects future medicine consumption based on historical dispensing data.
- **Reorder Quantity Calculation:** Computes recommended replenishment batch sizes with safety stock buffers.

---

## Architecture & Directory Structure

```
nlp-forecasting-service/
├── models/
│   └── __init__.py               # Model weights & artifact loaders placeholder
├── schemas/
│   ├── __init__.py
│   ├── common.py                 # Health & error response schemas
│   ├── symptoms.py               # SymptomAnalysisRequest & SymptomAnalysisResponse
│   └── forecast.py               # DemandForecastRequest & DemandForecastResponse
├── services/
│   ├── __init__.py
│   ├── symptom_classifier.py     # NLP symptom extraction & classification service
│   └── demand_forecaster.py      # Demand projection & reorder suggestion service
├── utils/
│   ├── __init__.py
│   └── emergency_detector.py     # Critical red-flag emergency pattern detector
├── main.py                       # FastAPI entrypoint, middleware, & route declarations
├── requirements.txt              # FastAPI, Uvicorn, scikit-learn, XGBoost, Transformers
├── .env.example                  # Environment configuration template
└── README.md
```

---

## Provisional API Endpoints

### 1. Health Checks
- `GET /health` - Liveness probe
- `GET /ready` - Readiness probe

### 2. NLP Symptom Analysis (Module 10)
- `POST /api/symptoms/analyze`
  - **Input:** `{ "symptoms": "severe chest tightness radiating to left arm", "duration_days": 1 }`
  - **Output:** Extracted keywords, recommended department, recommended specialist, confidence score, emergency flag, and triage reason.

### 3. Pharmacy Demand Forecasting (Module 11)
- `POST /api/forecast/demand`
  - **Input:** `{ "medicine_id": "uuid", "historical_dispensations": [...], "horizon_days": 14 }`
  - **Output:** Daily forecasted demand points, recommended reorder quantity, and model metadata.
