"""
pharmacy_forecasting_service.py

Module 11: Production Service Layer for Pharmacy Demand Forecasting.
Loads and serves the frozen Two-Stage Hurdle XGBoost Champion Model.

Features:
- In-memory artifact caching (Singleton pattern).
- Input validation (ATC IDs, horizons, date continuity, non-negativity).
- Single & Batch multi-horizon forecasting (H = 7, 14, 30 days).
"""

from __future__ import annotations

import json
import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import joblib
import numpy as np

from schemas.pharmacy_forecast import (
    PharmacyDispensePoint,
    ForecastPoint,
    PharmacyForecastRequest,
    PharmacyForecastResponse,
    PharmacyBatchForecastRequest,
    PharmacyBatchForecastResponse,
)
from training.pharmacy_forecasting_features import extract_single_origin_features
from training.intermittent_demand_forecaster import HurdleXGBoostForecaster

logger = logging.getLogger("pharmacy_forecasting_service")

# Supported ATC Medicine Catalog
SUPPORTED_MEDICINES: Dict[str, Dict[str, str]] = {
    "MED-ATC-M01AB": {"name": "Diclofenac", "category": "Anti-inflammatory"},
    "MED-ATC-M01AE": {"name": "Ibuprofen", "category": "Anti-inflammatory"},
    "MED-ATC-N02BA": {"name": "Aspirin", "category": "Analgesic"},
    "MED-ATC-N02BE": {"name": "Paracetamol", "category": "Analgesic"},
    "MED-ATC-N05B":  {"name": "Diazepam", "category": "Anxiolytic"},
    "MED-ATC-N05C":  {"name": "Hypnotic/Sedative", "category": "Sedative"},
    "MED-ATC-R03":   {"name": "Salbutamol", "category": "Respiratory"},
    "MED-ATC-R06":   {"name": "Cetirizine", "category": "Antihistamine"},
}

SUPPORTED_HORIZONS = [7, 14, 30]
MIN_HISTORY_DAYS = 28


class PharmacyForecastingService:
    """Production service managing model loading, validation, and inference."""

    def __init__(self, models_dir: Optional[Path] = None):
        if models_dir is None:
            models_dir = Path(__file__).resolve().parent.parent / "models" / "pharmacy_forecasting"
        self.models_dir = models_dir
        self.models: Dict[int, HurdleXGBoostForecaster] = {}
        self.metadata: Dict[str, any] = {}
        self._load_artifacts()

    def _load_artifacts(self) -> None:
        """Loads frozen Hurdle model artifacts and metadata into memory once."""
        if not self.models_dir.exists():
            logger.warning("Models directory not found at: %s", self.models_dir)
            return

        # Load metadata
        meta_path = self.models_dir / "hurdle_metadata.json"
        if meta_path.exists():
            with open(meta_path, "r", encoding="utf-8") as f:
                self.metadata = json.load(f)
            logger.info("Loaded Hurdle forecaster metadata: version=%s", self.metadata.get("version"))

        # Load models for all horizons
        for h in SUPPORTED_HORIZONS:
            model_path = self.models_dir / f"hurdle_forecaster_h{h}.joblib"
            if model_path.exists():
                self.models[h] = joblib.load(model_path)
                logger.info("Loaded frozen Hurdle artifact for H=%d (%s)", h, model_path.name)
            else:
                logger.warning("Artifact missing for H=%d: %s", h, model_path.name)

    def validate_request_inputs(
        self,
        medicine_id: str,
        horizon_days: int,
        history: List[PharmacyDispensePoint],
    ) -> Tuple[np.ndarray, datetime]:
        """
        Validates medicine_id, horizon, and historical dispensing timeline.
        Returns (historical_quantities_array, forecast_origin_date).
        """
        # 1. Validate Medicine ID
        if medicine_id not in SUPPORTED_MEDICINES:
            raise ValueError(
                f"Unsupported medicine_id '{medicine_id}'. Supported IDs: {list(SUPPORTED_MEDICINES.keys())}"
            )

        # 2. Validate Horizon
        if horizon_days not in SUPPORTED_HORIZONS:
            raise ValueError(
                f"Unsupported horizon_days '{horizon_days}'. Supported horizons: {SUPPORTED_HORIZONS}"
            )

        # 3. Check model readiness
        if horizon_days not in self.models:
            raise RuntimeError(f"Forecasting model artifact for H={horizon_days} is not loaded.")

        # 4. Validate History Length
        if len(history) < MIN_HISTORY_DAYS:
            raise ValueError(
                f"Insufficient historical data: provided {len(history)} days, minimum required is {MIN_HISTORY_DAYS} days."
            )

        # 5. Parse and Validate Date Continuity and Ordering
        parsed_dates: List[datetime] = []
        quantities: List[float] = []

        for idx, point in enumerate(history):
            # Parse Date
            try:
                dt = datetime.strptime(point.date.strip(), "%Y-%m-%d")
            except ValueError:
                raise ValueError(f"Malformed date at index {idx}: '{point.date}'. Expected ISO format 'YYYY-MM-DD'.")

            # Validate Non-Negative Quantity
            q = float(point.quantity_dispensed)
            if np.isnan(q) or np.isinf(q) or q < 0:
                raise ValueError(f"Invalid quantity at index {idx} ({point.date}): {q}. Must be non-negative float.")

            parsed_dates.append(dt)
            quantities.append(q)

        # Validate strictly chronological and unbroken daily sequence
        for i in range(1, len(parsed_dates)):
            diff_days = (parsed_dates[i] - parsed_dates[i - 1]).days
            if diff_days <= 0:
                raise ValueError(
                    f"History dates are not strictly ascending or contain duplicates: '{parsed_dates[i-1].strftime('%Y-%m-%d')}' followed by '{parsed_dates[i].strftime('%Y-%m-%d')}'."
                )
            if diff_days > 1:
                raise ValueError(
                    f"History has date gap between '{parsed_dates[i-1].strftime('%Y-%m-%d')}' and '{parsed_dates[i].strftime('%Y-%m-%d')}'. Timeline must be continuous daily observations."
                )

        # Forecast origin is the day immediately following the last historical observation
        last_date = parsed_dates[-1]
        origin_date = last_date + timedelta(days=1)
        quantities_arr = np.array(quantities, dtype=np.float64)

        return quantities_arr, origin_date

    def forecast_medicine_demand(self, payload: PharmacyForecastRequest) -> PharmacyForecastResponse:
        """
        Executes frozen Two-Stage Hurdle model inference for a single medicine.
        """
        quantities, origin_date = self.validate_request_inputs(
            payload.medicine_id,
            payload.horizon_days,
            payload.history,
        )

        # Extract 25 leakage-safe features from pre-origin history
        features = extract_single_origin_features(quantities, origin_date, payload.medicine_id).reshape(1, -1)

        # Model inference
        model = self.models[payload.horizon_days]
        raw_predictions = model.predict(features)[0]

        # Construct daily forecast points
        forecast_points: List[ForecastPoint] = []
        for step in range(payload.horizon_days):
            step_date = (origin_date + timedelta(days=step)).strftime("%Y-%m-%d")
            pred_qty = max(0.0, float(raw_predictions[step]))
            forecast_points.append(ForecastPoint(date=step_date, predicted_quantity=round(pred_qty, 2)))

        med_meta = SUPPORTED_MEDICINES[payload.medicine_id]
        return PharmacyForecastResponse(
            medicine_id=payload.medicine_id,
            medicine_name=med_meta["name"],
            category=med_meta["category"],
            horizon_days=payload.horizon_days,
            forecast=forecast_points,
            model="hurdle_xgboost",
            model_version="module-11-final",
        )

    def forecast_batch_demand(self, payload: PharmacyBatchForecastRequest) -> PharmacyBatchForecastResponse:
        """
        Executes frozen Two-Stage Hurdle model inference across multiple medicines.
        """
        if payload.horizon_days not in SUPPORTED_HORIZONS:
            raise ValueError(f"Unsupported horizon_days '{payload.horizon_days}'. Supported horizons: {SUPPORTED_HORIZONS}")

        if not payload.history:
            raise ValueError("Batch history dictionary cannot be empty.")

        forecasts_map: Dict[str, PharmacyForecastResponse] = {}

        for med_id, med_history in payload.history.items():
            req = PharmacyForecastRequest(
                medicine_id=med_id,
                horizon_days=payload.horizon_days,
                history=med_history,
            )
            forecasts_map[med_id] = self.forecast_medicine_demand(req)

        return PharmacyBatchForecastResponse(
            horizon_days=payload.horizon_days,
            model="hurdle_xgboost",
            model_version="module-11-final",
            forecasts=forecasts_map,
        )


# Global Singleton Service Instance
pharmacy_forecast_service = PharmacyForecastingService()
