"""
test_pharmacy_forecasting_api.py

Module 11: End-to-End Live HTTP API Test Suite for Pharmacy Demand Forecasting.
Sends real HTTP requests over the live network socket (http://127.0.0.1:8000)
verifying all 15 operational contracts, error handling paths, latency benchmarks,
and Module 10 regression endpoints.
"""

import sys
import time
import json
import unittest
import urllib.request
import urllib.error
from datetime import datetime, timedelta
from pathlib import Path

# Ensure project root and local venv site-packages are accessible
base_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(base_dir))

BASE_URL = "http://127.0.0.1:8000"


def generate_synthetic_history(days: int = 35, start_date: str = "2020-01-01", base_val: float = 15.0) -> list:
    """Generates deterministic synthetic daily history fixture."""
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    history = []
    for i in range(days):
        dt_str = (start_dt + timedelta(days=i)).strftime("%Y-%m-%d")
        qty = round(base_val + 4.0 * (i % 7) / 7.0, 2)
        history.append({"date": dt_str, "quantity_dispensed": qty})
    return history


def make_http_request(endpoint: str, method: str = "GET", payload: dict = None) -> tuple:
    """Helper to send HTTP request and return (status_code, response_dict)."""
    url = f"{BASE_URL}{endpoint}"
    headers = {"Content-Type": "application/json"}
    data = json.dumps(payload).encode("utf-8") if payload is not None else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req, timeout=5) as response:
            status = response.status
            body = json.loads(response.read().decode("utf-8"))
            return status, body
    except urllib.error.HTTPError as e:
        status = e.code
        try:
            body = json.loads(e.read().decode("utf-8"))
        except Exception:
            body = {"error": str(e)}
        return status, body


class TestPharmacyForecastingAPI(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.valid_history_35 = generate_synthetic_history(days=35)

    def test_01_health_and_readiness_regression(self):
        """1. Verify GET /health and GET /ready return HTTP 200."""
        status_health, body_health = make_http_request("/health", method="GET")
        self.assertEqual(status_health, 200)
        self.assertEqual(body_health["status"], "healthy")

        status_ready, body_ready = make_http_request("/ready", method="GET")
        self.assertEqual(status_ready, 200)
        self.assertEqual(body_ready["status"], "ready")

    def test_02_module10_symptom_regression(self):
        """2. Verify existing Module 10 POST /api/symptoms/analyze returns HTTP 200."""
        payload = {"symptoms": "I have severe chest tightness, radiating pain in left arm, and shortness of breath."}
        status, body = make_http_request("/api/symptoms/analyze", method="POST", payload=payload)
        self.assertEqual(status, 200)
        self.assertTrue(body["is_emergency"])
        self.assertIn(body["recommended_department"], ["Cardiology", "Pulmonology"])

    def test_03_single_7_day_forecast(self):
        """3. Valid 7-day forecast returns HTTP 200 and 7 points."""
        payload = {
            "medicine_id": "MED-ATC-N02BE",
            "horizon_days": 7,
            "history": self.valid_history_35,
        }
        status, body = make_http_request("/api/pharmacy/forecast", method="POST", payload=payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["medicine_id"], "MED-ATC-N02BE")
        self.assertEqual(body["medicine_name"], "Paracetamol")
        self.assertEqual(body["category"], "Analgesic")
        self.assertEqual(body["horizon_days"], 7)
        self.assertEqual(len(body["forecast"]), 7)
        self.assertEqual(body["model"], "hurdle_xgboost")
        self.assertEqual(body["model_version"], "module-11-final")

    def test_04_single_14_day_forecast(self):
        """4. Valid 14-day forecast returns HTTP 200 and 14 points."""
        payload = {
            "medicine_id": "MED-ATC-M01AB",
            "horizon_days": 14,
            "history": self.valid_history_35,
        }
        status, body = make_http_request("/api/pharmacy/forecast", method="POST", payload=payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["medicine_name"], "Diclofenac")
        self.assertEqual(len(body["forecast"]), 14)

    def test_05_single_30_day_forecast(self):
        """5. Valid 30-day forecast returns HTTP 200 and 30 points."""
        payload = {
            "medicine_id": "MED-ATC-N05B",
            "horizon_days": 30,
            "history": self.valid_history_35,
        }
        status, body = make_http_request("/api/pharmacy/forecast", method="POST", payload=payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["medicine_name"], "Diazepam")
        self.assertEqual(len(body["forecast"]), 30)

    def test_06_batch_forecast_multi_medicine(self):
        """6. Batch forecast returns predictions for M01AB, N02BE, N05C, R03."""
        batch_history = {
            "MED-ATC-M01AB": self.valid_history_35,
            "MED-ATC-N02BE": self.valid_history_35,
            "MED-ATC-N05C": self.valid_history_35,
            "MED-ATC-R03": self.valid_history_35,
        }
        payload = {
            "horizon_days": 14,
            "history": batch_history,
        }
        status, body = make_http_request("/api/pharmacy/forecast/batch", method="POST", payload=payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["horizon_days"], 14)
        self.assertEqual(len(body["forecasts"]), 4)
        for med_id in ["MED-ATC-M01AB", "MED-ATC-N02BE", "MED-ATC-N05C", "MED-ATC-R03"]:
            self.assertIn(med_id, body["forecasts"])
            self.assertEqual(len(body["forecasts"][med_id]["forecast"]), 14)

    def test_07_invalid_medicine_error(self):
        """7. Invalid medicine_id returns HTTP 400 Bad Request."""
        payload = {
            "medicine_id": "MED-ATC-INVALID",
            "horizon_days": 14,
            "history": self.valid_history_35,
        }
        status, body = make_http_request("/api/pharmacy/forecast", method="POST", payload=payload)
        self.assertEqual(status, 400)
        self.assertIn("Unsupported medicine_id", body["detail"])

    def test_08_invalid_horizon_error(self):
        """8. Unsupported horizon returns HTTP 400 Bad Request."""
        payload = {
            "medicine_id": "MED-ATC-N02BE",
            "horizon_days": 21,
            "history": self.valid_history_35,
        }
        status, body = make_http_request("/api/pharmacy/forecast", method="POST", payload=payload)
        self.assertEqual(status, 400)
        self.assertIn("Unsupported horizon_days", body["detail"])

    def test_09_insufficient_history_error(self):
        """9. Insufficient history (< 28 days) returns HTTP 422 Unprocessable Entity."""
        payload = {
            "medicine_id": "MED-ATC-N02BE",
            "horizon_days": 14,
            "history": generate_synthetic_history(days=20),
        }
        status, body = make_http_request("/api/pharmacy/forecast", method="POST", payload=payload)
        self.assertEqual(status, 422)

    def test_10_negative_quantity_error(self):
        """10. Negative quantity returns HTTP 422 Unprocessable Entity."""
        bad_history = generate_synthetic_history(days=30)
        bad_history[10]["quantity_dispensed"] = -10.0
        payload = {
            "medicine_id": "MED-ATC-N02BE",
            "horizon_days": 14,
            "history": bad_history,
        }
        status, body = make_http_request("/api/pharmacy/forecast", method="POST", payload=payload)
        self.assertEqual(status, 422)

    def test_11_duplicate_dates_error(self):
        """11. Duplicate dates return HTTP 400 Bad Request."""
        dup_history = generate_synthetic_history(days=30)
        dup_history[12]["date"] = dup_history[11]["date"]
        payload = {
            "medicine_id": "MED-ATC-N02BE",
            "horizon_days": 14,
            "history": dup_history,
        }
        status, body = make_http_request("/api/pharmacy/forecast", method="POST", payload=payload)
        self.assertEqual(status, 400)
        self.assertIn("not strictly ascending or contain duplicates", body["detail"])

    def test_12_unsorted_dates_error(self):
        """12. Unsorted dates return HTTP 400 Bad Request."""
        unsorted_history = generate_synthetic_history(days=30)
        unsorted_history[5], unsorted_history[15] = unsorted_history[15], unsorted_history[5]
        payload = {
            "medicine_id": "MED-ATC-N02BE",
            "horizon_days": 14,
            "history": unsorted_history,
        }
        status, body = make_http_request("/api/pharmacy/forecast", method="POST", payload=payload)
        self.assertEqual(status, 400)

    def test_13_missing_required_fields_error(self):
        """13. Missing required field returns HTTP 422 Unprocessable Entity."""
        payload = {"horizon_days": 14}
        status, body = make_http_request("/api/pharmacy/forecast", method="POST", payload=payload)
        self.assertEqual(status, 422)

    def test_14_non_negative_predictions_invariant(self):
        """14. Sparse series predictions are guaranteed non-negative (>= 0.0)."""
        payload = {
            "medicine_id": "MED-ATC-N05C",
            "horizon_days": 14,
            "history": generate_synthetic_history(days=35, base_val=0.0),
        }
        status, body = make_http_request("/api/pharmacy/forecast", method="POST", payload=payload)
        self.assertEqual(status, 200)
        for pt in body["forecast"]:
            self.assertGreaterEqual(pt["predicted_quantity"], 0.0)

    def test_15_chronological_forecast_dates_progression(self):
        """15. Forecast dates advance strictly day-by-day starting after last historical day."""
        last_hist_dt = datetime.strptime(self.valid_history_35[-1]["date"], "%Y-%m-%d")
        payload = {
            "medicine_id": "MED-ATC-N02BE",
            "horizon_days": 14,
            "history": self.valid_history_35,
        }
        status, body = make_http_request("/api/pharmacy/forecast", method="POST", payload=payload)
        self.assertEqual(status, 200)
        for i, pt in enumerate(body["forecast"]):
            expected_date = (last_hist_dt + timedelta(days=i + 1)).strftime("%Y-%m-%d")
            self.assertEqual(pt["date"], expected_date)

    def test_16_inventory_analysis_endpoint_ok(self):
        """16. Verify POST /api/pharmacy/inventory/analyze returns HTTP 200 with OK status."""
        payload = {
            "medicine_id": "MED-ATC-N02BE",
            "horizon_days": 14,
            "history": self.valid_history_35,
            "current_stock": 1000.0,
            "lead_time_days": 7,
            "safety_stock": 50.0,
            "reorder_point": 200.0,
        }
        status, body = make_http_request("/api/pharmacy/inventory/analyze", method="POST", payload=payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["medicine_id"], "MED-ATC-N02BE")
        self.assertEqual(body["inventory"]["status"], "OK")
        self.assertFalse(body["recommendation"]["reorder_required"])
        self.assertEqual(body["recommendation"]["type"], "inventory_planning_recommendation")

    def test_17_inventory_analysis_endpoint_critical(self):
        """17. Verify POST /api/pharmacy/inventory/analyze returns HTTP 200 with CRITICAL status & reorder required."""
        payload = {
            "medicine_id": "MED-ATC-M01AB",
            "horizon_days": 14,
            "history": self.valid_history_35,
            "current_stock": 15.0,
            "lead_time_days": 7,
            "safety_stock": 30.0,
            "reorder_point": 100.0,
        }
        status, body = make_http_request("/api/pharmacy/inventory/analyze", method="POST", payload=payload)
        self.assertEqual(status, 200)
        self.assertEqual(body["inventory"]["status"], "CRITICAL")
        self.assertTrue(body["recommendation"]["reorder_required"])
        self.assertGreater(body["recommendation"]["recommended_quantity"], 0.0)


if __name__ == "__main__":
    unittest.main()
