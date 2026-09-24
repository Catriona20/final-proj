# Pharmacy Inventory Intelligence & Reorder Planning API
**Service:** `nlp-forecasting-service`  
**Module:** Module 11 — Pharmacy Inventory Intelligence Layer  
**Engine Layer:** Deterministic Operational Analytics over Two-Stage Hurdle XGBoost Demand Projections  
**Endpoint:** `POST /api/pharmacy/inventory/analyze`

---

> [!CAUTION]
> **Clinical & Operational Scope Disclaimer:**  
> This inventory intelligence system is strictly an **operational decision-support tool for inventory planning and supply chain replenishment**. It does **NOT** evaluate clinical medical necessity, prescription validity, treatment appropriateness, diagnostic urgency, or patient-specific care plans.

---

## 1. Distinction: Demand Forecasting vs. Inventory Planning

```
+-------------------------------------------------------------------------------------------------------------+
|                                      ARCHITECTURE & RESPONSIBILITY LAYERS                                    |
+-------------------------------------------------------------------------------------------------------------+
| 1. STATISTICAL DEMAND FORECASTING (ML Layer)                                                                |
|    - Goal: Estimates expected daily drug dispensation volume (y_hat) based on historical time-series patterns.|
|    - Model: Two-Stage Hurdle XGBoost (Occurrence Classifier + Magnitude Regressor).                         |
|    - Scope: Pure statistical quantity projection without regard to inventory constraints.                   |
+-------------------------------------------------------------------------------------------------------------+
                                                       │
                                                       ▼
+-------------------------------------------------------------------------------------------------------------+
| 2. INVENTORY INTELLIGENCE & REORDER PLANNING (Business Layer)                                               |
|    - Goal: Evaluates on-hand stock health, buffer safety, and replenishment requirements.                   |
|    - Logic: Deterministic inventory formulas consuming explicit operational parameters.                     |
|    - Scope: Generates replenishment recommendations without executing automated purchase orders.           |
+-------------------------------------------------------------------------------------------------------------+
```

---

## 2. Mathematical Formulations & Inventory Metrics

Given:
* Forecast horizon: $H \in \{7, 14, 30\}$ days
* Predicted daily demand vector: $\hat{\mathbf{y}} = [\hat{y}_1, \hat{y}_2, \dots, \hat{y}_H]$
* Current physical stock on hand: $S_{\text{current}} \ge 0$
* Designated safety stock buffer: $S_{\text{safety}} \ge 0$
* Designated reorder threshold: $S_{\text{reorder}} \ge 0$
* Supplier replenishment lead time: $L > 0$ days

### 1. Cumulative Predicted Demand ($D_{\text{total}}$)
$$D_{\text{total}} = \sum_{t=1}^{H} \hat{y}_t$$

### 2. Average Daily Demand ($\bar{D}$)
$$\bar{D} = \frac{D_{\text{total}}}{H}$$

### 3. Days of Inventory Coverage
$$\text{Days of Coverage} = \begin{cases} \frac{S_{\text{current}}}{\bar{D}}, & \text{if } \bar{D} > 0 \\ 999.0, & \text{if } \bar{D} = 0 \text{ and } S_{\text{current}} > 0 \\ 0.0, & \text{if } \bar{D} = 0 \text{ and } S_{\text{current}} = 0 \end{cases}$$

### 4. Lead-Time Demand ($D_{\text{LT}}$)
$$D_{\text{LT}} = \begin{cases} \sum_{t=1}^{L} \hat{y}_t, & \text{if } L \le H \\ \bar{D} \times L, & \text{if } L > H \text{ (extrapolated)} \end{cases}$$

### 5. Projected Ending Stock ($S_{\text{projected}}$)
$$S_{\text{projected}} = S_{\text{current}} - D_{\text{total}}$$
*(Note: A negative value indicates projected stockout / inventory shortage within the horizon)*

---

## 3. Deterministic Stock Status Rules

```
+----------------+--------------------------------------------------------------------------------------------+
| Status Code    | Deterministic Operational Trigger Condition                                               |
+----------------+--------------------------------------------------------------------------------------------+
| CRITICAL       | S_current <= S_safety  OR  S_projected < 0.0  OR  S_current < D_LT                          |
| LOW_STOCK      | S_current <= S_reorder (and not meeting CRITICAL criteria)                                  |
| OK             | S_current > S_reorder  AND  S_projected >= S_safety                                         |
+----------------+--------------------------------------------------------------------------------------------+
```

---

## 4. Reorder Planning Recommendation Logic

Replenishment recommendations are generated strictly when warranted by inventory deficit:

1. **Reorder Trigger:**
   $$\text{Trigger Reorder} \iff (S_{\text{current}} \le S_{\text{reorder}}) \lor (S_{\text{projected}} < S_{\text{safety}})$$

2. **Recommended Reorder Quantity ($Q_{\text{rec}}$):**
   * Target inventory buffer: $S_{\text{target}} = D_{\text{total}} + S_{\text{safety}}$
   * Net deficit: $\Delta = S_{\text{target}} - S_{\text{current}}$
   * $Q_{\text{rec}} = \max(0.0, \text{round}(\Delta, 2))$
   * *(If $Q_{\text{rec}} = 0$ but $S_{\text{current}} \le S_{\text{reorder}}$, fallback target: $\max(0.0, S_{\text{reorder}} + S_{\text{safety}} - S_{\text{current}})$)*

3. **Recommendation Category:**
   * Labeled strictly as `"type": "inventory_planning_recommendation"`.
   * Clear operational justification string included in `reason`.

---

## 5. API Endpoint Specifications

### A. Database-Backed Mode (`pharmacy-security-service` Gateway)

* **URL:** `/api/pharmacy/inventory/analyze`
* **Method:** `POST`
* **Content-Type:** `application/json`
* **Authentication:** `Bearer <JWT_TOKEN>` (Role: `doctor` or `admin`)

In database-backed mode, only `medicine_id` (SKU or UUID) and `horizon_days` are required. The system automatically retrieves on-hand stock, reorder thresholds, safety buffers, supplier lead time, and recent historical dispensing records from PostgreSQL.

#### Minimal Database-Backed Request
```json
{
  "medicine_id": "MED-ATC-N02BE",
  "horizon_days": 14
}
```

#### Simulation Override Request (Optional What-If Testing)
Any inventory parameter can be explicitly overridden in the request for scenario modeling:
```json
{
  "medicine_id": "MED-ATC-N02BE",
  "horizon_days": 14,
  "current_stock": 500.0,
  "lead_time_days": 10,
  "safety_stock": 45.0,
  "reorder_point": 120.0
}
```

### B. Admin Inventory Policy Configuration

* **URL:** `/api/pharmacy/medicines/:medicine_id/inventory-policy`
* **Method:** `PATCH`
* **Authentication:** `Bearer <JWT_TOKEN>` (Role: strictly `admin`)

#### Request Body Schema
```json
{
  "reorder_threshold": 160,
  "safety_stock": 35,
  "supplier_lead_time_days": 8
}
```

---

## 6. Role-Based Access Control (RBAC)

```
+--------------------------+---------------------+-----------------------+-----------------------------+-------------------------------+
| Role                     | View Inventory      | Create/Update Stock   | Configure Reorder Thresholds| Run Inventory Intelligence/ML |
+--------------------------+---------------------+-----------------------+-----------------------------+-------------------------------+
| DOCTOR / DOCTOR'S OFFICE | YES (Full access)   | YES (Via Dispensing)  | READ-ONLY (Catalog defaults)| YES (Full forecasting access)|
| ADMIN                    | YES (Global access) | YES (Full batch CRUD) | YES (Can update thresholds) | YES (Full forecasting access) |
| PATIENT                  | NO (Restricted)     | NO (Restricted)       | NO (Restricted)             | NO (Restricted)               |
+--------------------------+---------------------+-----------------------+-----------------------------+-------------------------------+
```

---

## 7. System Boundaries & Operational Limitations

1. **Single-Facility / Clinic Architecture:** The current platform operates as a unified single-clinic facility without multi-clinic tenancy partitioning.
2. **Operational Decision Support:** Recommendations are purely mathematical outputs of the configured thresholds and do not execute automated procurement orders.
3. **Cold-Start Medicines:** Series with fewer than 28 days of continuous historical records cannot be forecasted using the statistical engine.
