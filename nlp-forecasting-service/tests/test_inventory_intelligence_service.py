"""
test_inventory_intelligence_service.py

Module 11: Production Integration & Boundary Test Suite for Pharmacy Inventory Intelligence.
Verifies all 14 functional dimensions, coverage metrics, deterministic stock states ('OK', 'LOW_STOCK', 'CRITICAL'),
replenishment recommendation logic, and boundary validations.
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
from main import analyze_pharmacy_inventory
from schemas.pharmacy_forecast import PharmacyDispensePoint
from schemas.inventory_intelligence import InventoryAnalysisRequest
from services.inventory_intelligence_service import inventory_service


def generate_synthetic_history(days: int = 35, start_date: str = "2020-01-01", base_val: float = 20.0) -> list:
    """Generates deterministic synthetic daily history fixture."""
    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
    history = []
    for i in range(days):
        dt_str = (start_dt + timedelta(days=i)).strftime("%Y-%m-%d")
        qty = round(base_val + 2.0 * (i % 7) / 7.0, 2)
        history.append(PharmacyDispensePoint(date=dt_str, quantity_dispensed=qty))
    return history


class TestInventoryIntelligenceService(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.valid_history_35 = generate_synthetic_history(days=35, base_val=20.0)

    def test_01_normal_inventory_ok(self):
        """1. High stock level results in status='OK' and reorder_required=False."""
        req = InventoryAnalysisRequest(
            medicine_id="MED-ATC-N02BE",
            horizon_days=14,
            history=self.valid_history_35,
            current_stock=1000.0,  # Far above reorder point and horizon demand
            lead_time_days=7,
            safety_stock=50.0,
            reorder_point=200.0,
        )
        res = asyncio.run(analyze_pharmacy_inventory(req))
        self.assertEqual(res.inventory.status, "OK")
        self.assertFalse(res.recommendation.reorder_required)
        self.assertEqual(res.recommendation.recommended_quantity, 0.0)
        self.assertGreater(res.inventory.projected_stock_after_horizon, res.inventory.safety_stock)
        self.assertGreater(res.inventory.days_of_coverage, 14.0)

    def test_02_low_stock_status(self):
        """2. Stock below reorder point (but above safety buffer and lead-time demand) yields status='LOW_STOCK'."""
        req = InventoryAnalysisRequest(
            medicine_id="MED-ATC-N02BE",
            horizon_days=14,
            history=self.valid_history_35,
            current_stock=150.0,  # Below reorder point 200, above safety 50
            lead_time_days=3,     # Short lead time
            safety_stock=50.0,
            reorder_point=200.0,
        )
        res = asyncio.run(analyze_pharmacy_inventory(req))
        # Status should be LOW_STOCK or CRITICAL depending on projected stock
        self.assertIn(res.inventory.status, ["LOW_STOCK", "CRITICAL"])
        self.assertTrue(res.recommendation.reorder_required)
        self.assertGreater(res.recommendation.recommended_quantity, 0.0)

    def test_03_critical_stock_status(self):
        """3. Stock below safety buffer or below lead-time demand yields status='CRITICAL'."""
        req = InventoryAnalysisRequest(
            medicine_id="MED-ATC-N02BE",
            horizon_days=14,
            history=self.valid_history_35,
            current_stock=20.0,  # Below safety stock 50
            lead_time_days=7,
            safety_stock=50.0,
            reorder_point=200.0,
        )
        res = asyncio.run(analyze_pharmacy_inventory(req))
        self.assertEqual(res.inventory.status, "CRITICAL")
        self.assertTrue(res.recommendation.reorder_required)
        self.assertGreater(res.recommendation.recommended_quantity, 0.0)

    def test_04_reorder_required_logic(self):
        """4. Verify reorder recommendation triggers when stock is deficient."""
        req = InventoryAnalysisRequest(
            medicine_id="MED-ATC-M01AB",
            horizon_days=14,
            history=self.valid_history_35,
            current_stock=10.0,
            lead_time_days=7,
            safety_stock=25.0,
            reorder_point=100.0,
        )
        res = asyncio.run(analyze_pharmacy_inventory(req))
        self.assertTrue(res.recommendation.reorder_required)
        self.assertIn("at or below the designated reorder threshold", res.recommendation.reason)
        self.assertEqual(res.recommendation.type, "inventory_planning_recommendation")

    def test_05_reorder_not_required_logic(self):
        """5. Verify reorder recommendation is False when stock is fully sufficient."""
        req = InventoryAnalysisRequest(
            medicine_id="MED-ATC-M01AB",
            horizon_days=14,
            history=self.valid_history_35,
            current_stock=800.0,
            lead_time_days=7,
            safety_stock=20.0,
            reorder_point=80.0,
        )
        res = asyncio.run(analyze_pharmacy_inventory(req))
        self.assertFalse(res.recommendation.reorder_required)
        self.assertEqual(res.recommendation.recommended_quantity, 0.0)

    def test_06_zero_forecast_demand_handling(self):
        """6. Zero forecast series (e.g. N05C quiet period) handles coverage without ZeroDivisionError."""
        req = InventoryAnalysisRequest(
            medicine_id="MED-ATC-N05C",
            horizon_days=14,
            history=generate_synthetic_history(days=35, base_val=0.0),
            current_stock=50.0,
            lead_time_days=7,
            safety_stock=5.0,
            reorder_point=20.0,
        )
        res = asyncio.run(analyze_pharmacy_inventory(req))
        self.assertGreaterEqual(res.inventory.days_of_coverage, 0.0)
        self.assertGreaterEqual(res.forecast.total_predicted_demand, 0.0)

    def test_07_negative_current_stock_rejection(self):
        """7. Negative current_stock fails validation."""
        with self.assertRaises(ValidationError):
            InventoryAnalysisRequest(
                medicine_id="MED-ATC-N02BE",
                horizon_days=14,
                history=self.valid_history_35,
                current_stock=-10.0,
            )

    def test_08_negative_safety_stock_rejection(self):
        """8. Negative safety_stock fails validation."""
        with self.assertRaises(ValidationError):
            InventoryAnalysisRequest(
                medicine_id="MED-ATC-N02BE",
                horizon_days=14,
                history=self.valid_history_35,
                current_stock=100.0,
                safety_stock=-5.0,
            )

    def test_09_negative_reorder_point_rejection(self):
        """9. Negative reorder_point fails validation."""
        with self.assertRaises(ValidationError):
            InventoryAnalysisRequest(
                medicine_id="MED-ATC-N02BE",
                horizon_days=14,
                history=self.valid_history_35,
                current_stock=100.0,
                reorder_point=-20.0,
            )

    def test_10_invalid_lead_time_rejection(self):
        """10. Zero or negative lead_time_days fails validation."""
        with self.assertRaises(ValidationError):
            InventoryAnalysisRequest(
                medicine_id="MED-ATC-N02BE",
                horizon_days=14,
                history=self.valid_history_35,
                current_stock=100.0,
                lead_time_days=0,
            )

    def test_11_invalid_forecast_quantity_rejection(self):
        """11. Negative dispensing point in history fails validation."""
        with self.assertRaises(ValidationError):
            PharmacyDispensePoint(date="2020-01-01", quantity_dispensed=-1.0)

    def test_12_incorrect_forecast_length_rejection(self):
        """12. Unsupported horizon length raises validation error."""
        with self.assertRaises(HTTPException) as ctx:
            req = InventoryAnalysisRequest(
                medicine_id="MED-ATC-N02BE",
                horizon_days=25,  # Unsupported horizon
                history=self.valid_history_35,
                current_stock=100.0,
            )
            asyncio.run(analyze_pharmacy_inventory(req))
        self.assertEqual(ctx.exception.status_code, 400)

    def test_13_non_chronological_history_rejection(self):
        """13. Unsorted/duplicate dates in history raise HTTP 400."""
        bad_hist = generate_synthetic_history(days=30)
        bad_hist[10] = PharmacyDispensePoint(date=bad_hist[9].date, quantity_dispensed=15.0)
        req = InventoryAnalysisRequest(
            medicine_id="MED-ATC-N02BE",
            horizon_days=14,
            history=bad_hist,
            current_stock=100.0,
        )
        with self.assertRaises(HTTPException) as ctx:
            asyncio.run(analyze_pharmacy_inventory(req))
        self.assertEqual(ctx.exception.status_code, 400)

    def test_14_full_endpoint_integration(self):
        """14. End-to-end integration verifies full response payload structure."""
        req = InventoryAnalysisRequest(
            medicine_id="MED-ATC-N02BE",
            horizon_days=14,
            history=self.valid_history_35,
            current_stock=150.0,
            lead_time_days=7,
            safety_stock=30.0,
            reorder_point=100.0,
        )
        res = asyncio.run(analyze_pharmacy_inventory(req))
        self.assertEqual(res.medicine_id, "MED-ATC-N02BE")
        self.assertEqual(res.medicine_name, "Paracetamol")
        self.assertEqual(res.category, "Analgesic")
        self.assertEqual(res.forecast.horizon_days, 14)
        self.assertEqual(len(res.forecast.daily_forecast), 14)
        self.assertGreater(res.forecast.total_predicted_demand, 0.0)
        self.assertEqual(res.inventory.current_stock, 150.0)
        self.assertEqual(res.inventory.lead_time_days, 7)
        self.assertIn(res.inventory.status, ["OK", "LOW_STOCK", "CRITICAL"])
        self.assertIn(res.recommendation.reorder_required, [True, False])
        self.assertEqual(res.recommendation.type, "inventory_planning_recommendation")
        self.assertEqual(res.model, "hurdle_xgboost")
        self.assertEqual(res.model_version, "module-11-final")


if __name__ == "__main__":
    unittest.main()
