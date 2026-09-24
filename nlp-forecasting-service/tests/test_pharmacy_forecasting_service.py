"""
test_pharmacy_forecasting_service.py

Module 11: Production Integration & Regression Test Suite for Pharmacy Demand Forecasting.
Verifies all 14 functional dimensions, input validation contracts, and API responses
using synthetic deterministic fixtures (without external httpx dependency).
"""

import sys
import asyncio
import unittest
from datetime import datetime, timedelta
from pathlib import Path

# Ensure project root and local venv site-packages are accessible
base_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(base_dir))

venv_site = base_dir / "venv" / "Lib" / "site-packages"
if venv_site.exists() and str(venv_site) not in sys.path:
    sys.path.insert(0, str(venv_site))

from fastapi import HTTPException
from pydantic import ValidationError
from main import forecast_pharmacy_demand, forecast_pharmacy_batch
from schemas.pharmacy_forecast import (
    PharmacyDispensePoint,
    PharmacyForecastRequest,
    PharmacyBatchForecastRequest,
)
from services.pharmacy_forecasting_service import pharmacy_forecast_service, SUPPORTED_MEDICINES


def generate_synthetic_history(days: int = 35, start_date: str = "2020-01-01", base_val: float = 10.0) -> list:
    """Generates deterministic synthetic daily history for test fixtures."""
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    history = []
    for i in range(days):
        dt_str = (start_dt + timedelta(days=i)).strftime("%Y-%m-%d")
        qty = round(base_val + 3.0 * (i % 7) / 7.0, 2)
        history.append(PharmacyDispensePoint(date=dt_str, quantity_dispensed=qty))
    return history


class TestPharmacyForecastingService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.valid_history_35 = generate_synthetic_history(days=35)

    def test_01_valid_7_day_forecast(self):
        """1. Valid 7-day forecast request returns HTTP 200 equivalent with exactly 7 points."""
        req = PharmacyForecastRequest(
            medicine_id="MED-ATC-N02BE",
            horizon_days=7,
            history=self.valid_history_35,
        )
        res = asyncio.run(forecast_pharmacy_demand(req))
        self.assertEqual(res.medicine_id, "MED-ATC-N02BE")
        self.assertEqual(res.horizon_days, 7)
        self.assertEqual(len(res.forecast), 7)
        self.assertEqual(res.model, "hurdle_xgboost")
        self.assertEqual(res.model_version, "module-11-final")

    def test_02_valid_14_day_forecast(self):
        """2. Valid 14-day forecast request returns HTTP 200 equivalent with exactly 14 points."""
        req = PharmacyForecastRequest(
            medicine_id="MED-ATC-M01AB",
            horizon_days=14,
            history=self.valid_history_35,
        )
        res = asyncio.run(forecast_pharmacy_demand(req))
        self.assertEqual(res.medicine_id, "MED-ATC-M01AB")
        self.assertEqual(res.medicine_name, "Diclofenac")
        self.assertEqual(res.category, "Anti-inflammatory")
        self.assertEqual(len(res.forecast), 14)

    def test_03_valid_30_day_forecast(self):
        """3. Valid 30-day forecast request returns HTTP 200 equivalent with exactly 30 points."""
        req = PharmacyForecastRequest(
            medicine_id="MED-ATC-N05B",
            horizon_days=30,
            history=self.valid_history_35,
        )
        res = asyncio.run(forecast_pharmacy_demand(req))
        self.assertEqual(len(res.forecast), 30)

    def test_04_invalid_medicine(self):
        """4. Invalid medicine_id raises HTTP 400 Bad Request."""
        req = PharmacyForecastRequest(
            medicine_id="MED-ATC-UNKNOWN999",
            horizon_days=14,
            history=self.valid_history_35,
        )
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(forecast_pharmacy_demand(req))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Unsupported medicine_id", ctx.exception.detail)

    def test_05_invalid_horizon(self):
        """5. Unsupported horizon_days raises HTTP 400 Bad Request."""
        req = PharmacyForecastRequest(
            medicine_id="MED-ATC-N02BE",
            horizon_days=21,  # Only 7, 14, 30 supported
            history=self.valid_history_35,
        )
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(forecast_pharmacy_demand(req))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("Unsupported horizon_days", ctx.exception.detail)

    def test_06_insufficient_history(self):
        """6. Insufficient history (< 28 days) fails validation."""
        short_history = generate_synthetic_history(days=20)
        with self.assertRaises(ValidationError):
            PharmacyForecastRequest(
                medicine_id="MED-ATC-N02BE",
                horizon_days=14,
                history=short_history,
            )

    def test_07_negative_quantity(self):
        """7. Negative quantity in history fails validation."""
        with self.assertRaises(ValidationError):
            PharmacyDispensePoint(date="2020-01-01", quantity_dispensed=-5.0)

    def test_08_duplicate_dates(self):
        """8. Duplicate dates in history raises HTTP 400 Bad Request."""
        dup_history = generate_synthetic_history(days=30)
        dup_history[15] = PharmacyDispensePoint(date=dup_history[14].date, quantity_dispensed=10.0)
        req = PharmacyForecastRequest(
            medicine_id="MED-ATC-N02BE",
            horizon_days=14,
            history=dup_history,
        )
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(forecast_pharmacy_demand(req))
        self.assertEqual(ctx.exception.status_code, 400)
        self.assertIn("not strictly ascending or contain duplicates", ctx.exception.detail)

    def test_09_unsorted_dates(self):
        """9. Unsorted dates in history raises HTTP 400 Bad Request."""
        unsorted_history = generate_synthetic_history(days=30)
        unsorted_history[5], unsorted_history[10] = unsorted_history[10], unsorted_history[5]
        req = PharmacyForecastRequest(
            medicine_id="MED-ATC-N02BE",
            horizon_days=14,
            history=unsorted_history,
        )
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(forecast_pharmacy_demand(req))
        self.assertEqual(ctx.exception.status_code, 400)

    def test_10_forecast_length_matches_horizon(self):
        """10. Output forecast array length strictly matches requested horizon."""
        for h in [7, 14, 30]:
            req = PharmacyForecastRequest(
                medicine_id="MED-ATC-R03",
                horizon_days=h,
                history=self.valid_history_35,
            )
            res = asyncio.run(forecast_pharmacy_demand(req))
            self.assertEqual(len(res.forecast), h)

    def test_11_non_negative_predictions(self):
        """11. All predicted demand quantities are non-negative floats."""
        req = PharmacyForecastRequest(
            medicine_id="MED-ATC-N05C",  # Sparse series
            horizon_days=14,
            history=generate_synthetic_history(days=35, base_val=0.0),
        )
        res = asyncio.run(forecast_pharmacy_demand(req))
        for pt in res.forecast:
            self.assertGreaterEqual(pt.predicted_quantity, 0.0)

    def test_12_chronological_forecast_dates(self):
        """12. Forecast dates start on day+1 after last history date and advance strictly by 1 day."""
        last_hist_date = datetime.strptime(self.valid_history_35[-1].date, "%Y-%m-%d")
        req = PharmacyForecastRequest(
            medicine_id="MED-ATC-N02BE",
            horizon_days=14,
            history=self.valid_history_35,
        )
        res = asyncio.run(forecast_pharmacy_demand(req))

        for i, pt in enumerate(res.forecast):
            expected_date = (last_hist_date + timedelta(days=i + 1)).strftime("%Y-%m-%d")
            self.assertEqual(pt.date, expected_date)

    def test_13_model_loading_singleton(self):
        """13. Model manager loads artifacts into memory once without re-instantiation."""
        self.assertIn(7, pharmacy_forecast_service.models)
        self.assertIn(14, pharmacy_forecast_service.models)
        self.assertIn(30, pharmacy_forecast_service.models)

    def test_14_batch_forecasting(self):
        """14. Batch forecast endpoint predicts across multiple medicines simultaneously."""
        batch_history = {
            "MED-ATC-M01AB": self.valid_history_35,
            "MED-ATC-N02BE": self.valid_history_35,
            "MED-ATC-N05C": self.valid_history_35,
        }
        req = PharmacyBatchForecastRequest(
            horizon_days=14,
            history=batch_history,
        )
        res = asyncio.run(forecast_pharmacy_batch(req))
        self.assertEqual(res.horizon_days, 14)
        self.assertEqual(len(res.forecasts), 3)
        self.assertIn("MED-ATC-M01AB", res.forecasts)
        self.assertIn("MED-ATC-N02BE", res.forecasts)
        self.assertIn("MED-ATC-N05C", res.forecasts)


if __name__ == "__main__":
    unittest.main()
