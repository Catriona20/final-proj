# Pharmacy Demand Forecasting API Documentation
**Service:** `nlp-forecasting-service`  
**Module:** Module 11 — Pharmacy Inventory Intelligence & Demand Forecasting  
**Model Architecture:** Two-Stage Hurdle XGBoost (Occurrence Classifier + Magnitude Regressor)  
**Model Version:** `module-11-final`  
**Artifact Path:** `models/pharmacy_forecasting/hurdle_forecaster_h{7,14,30}.joblib`

---

> [!CAUTION]
> **Clinical & Operational Scope Disclaimer:**  
> This forecasting model is strictly an operational demand-planning and inventory intelligence tool. It is **NOT** a clinical diagnostic, prescription validation, or medical treatment recommendation system.

---

## 1. Supported Specifications

### Supported Forecast Horizons
* `7` Days (1-week operational horizon)
* `14` Days (2-week replenishment planning horizon)
* `30` Days (Monthly procurement planning horizon)

### Supported Medicine Catalog (8 Standardized ATC Classes)
```
+------------------+-----------------------+---------------------+
| Medicine ID      | Clinical Name         | Therapeutic Class   |
+------------------+-----------------------+---------------------+
| MED-ATC-M01AB    | Diclofenac            | Anti-inflammatory   |
| MED-ATC-M01AE    | Ibuprofen             | Anti-inflammatory   |
| MED-ATC-N02BA    | Aspirin               | Analgesic           |
| MED-ATC-N02BE    | Paracetamol           | Analgesic           |
| MED-ATC-N05B     | Diazepam              | Anxiolytic          |
| MED-ATC-N05C     | Hypnotic/Sedative     | Sedative            |
| MED-ATC-R03      | Salbutamol            | Respiratory         |
| MED-ATC-R06      | Cetirizine            | Antihistamine       |
+------------------+-----------------------+---------------------+
```

---

## 2. API Endpoints

### Endpoint 1: Single-Medicine Demand Forecast

* **URL:** `/api/pharmacy/forecast`
* **Method:** `POST`
* **Content-Type:** `application/json`

#### Request Body Schema
```json
{
  "medicine_id": "MED-ATC-N02BE",
  "horizon_days": 14,
  "history": [
    {
      "date": "2020-01-01",
      "quantity_dispensed": 25.0
    },
    ...
    {
      "date": "2020-01-28",
      "quantity_dispensed": 30.5
    }
  ]
}
```

#### Response Body Schema (HTTP 200)
```json
{
  "medicine_id": "MED-ATC-N02BE",
  "medicine_name": "Paracetamol",
  "category": "Analgesic",
  "horizon_days": 14,
  "forecast": [
    {
      "date": "2020-01-29",
      "predicted_quantity": 28.45
    },
    {
      "date": "2020-01-30",
      "predicted_quantity": 29.10
    }
  ],
  "model": "hurdle_xgboost",
  "model_version": "module-11-final"
}
```

---

### Endpoint 2: Batch Multi-Medicine Demand Forecast

* **URL:** `/api/pharmacy/forecast/batch`
* **Method:** `POST`
* **Content-Type:** `application/json`

#### Request Body Schema
```json
{
  "horizon_days": 14,
  "history": {
    "MED-ATC-M01AB": [ ... 28+ daily observations ... ],
    "MED-ATC-N02BE": [ ... 28+ daily observations ... ],
    "MED-ATC-N05C":  [ ... 28+ daily observations ... ]
  }
}
```

#### Response Body Schema (HTTP 200)
```json
{
  "horizon_days": 14,
  "model": "hurdle_xgboost",
  "model_version": "module-11-final",
  "forecasts": {
    "MED-ATC-M01AB": {
      "medicine_id": "MED-ATC-M01AB",
      "medicine_name": "Diclofenac",
      "category": "Anti-inflammatory",
      "horizon_days": 14,
      "forecast": [ ... 14 daily forecast points ... ],
      "model": "hurdle_xgboost",
      "model_version": "module-11-final"
    },
    "MED-ATC-N02BE": { ... },
    "MED-ATC-N05C": { ... }
  }
}
```

---

## 3. Strict Input Validation Rules

The service enforces strict healthcare data validation:

1. **`medicine_id` Validation:** Must match one of the 8 supported ATC identifiers. Unrecognized IDs return `HTTP 400 Bad Request`.
2. **`horizon_days` Validation:** Must be one of `7`, `14`, or `30`. Unsupported horizons return `HTTP 400 Bad Request`.
3. **Minimum History Requirement:** The `history` array must contain at least `28` consecutive daily observations to satisfy the 28-day lag and rolling feature windows. Shorter sequences return `HTTP 422 Unprocessable Entity`.
4. **Chronological & Date Continuity Enforcement:**
   * History points must be strictly sorted by date in ascending order.
   * Gaps between consecutive observation dates are strictly prohibited (every calendar day must be present).
   * Duplicate dates return `HTTP 400 Bad Request`.
5. **Non-Negative Quantity Invariant:** Negative dispensing quantities ($q < 0$) or `NaN`/`Inf` values are rejected immediately with `HTTP 422 Unprocessable Entity`.
6. **Non-Negative Forecast Guarantee:** All model predictions are strictly lower-bounded at `0.0` units.

---

## 4. Model Loading & In-Memory Lifecycle

* Models are loaded **once** at service startup using a Singleton `PharmacyForecastingService` pattern.
* Multi-horizon artifacts (`h7`, `h14`, `h30`) reside persistently in memory to achieve sub-millisecond inference latency without file I/O overhead on individual API requests.

---

## 5. Known Operational Limitations

1. **New Medicine Cold-Start:** Series with fewer than 28 days of continuous historical records cannot be forecasted using the ML pipeline and require heuristic initialization.
2. **Extreme Macro Disruption:** Major external disruptions (such as pandemic lockdowns or sudden hospital formulary shifts) outside the historical 25-feature pattern space should be coupled with clinical manager override.
