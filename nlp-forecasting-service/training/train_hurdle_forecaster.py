#!/usr/bin/env python3
"""
train_hurdle_forecaster.py

Module 11: Two-Stage Hurdle Forecaster Training Pipeline.
Trains Occurrence Classification + Magnitude Regression models
for H = 7, H = 14, and H = 30 days using strictly data/processed/pharmacy_demand_train.csv.

Output Artifacts:
- models/pharmacy_forecasting/hurdle_forecaster_h7.joblib
- models/pharmacy_forecasting/hurdle_forecaster_h14.joblib
- models/pharmacy_forecasting/hurdle_forecaster_h30.joblib
- models/pharmacy_forecasting/hurdle_metadata.json
"""

import sys
import csv
import json
import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List

# Ensure UTF-8 console output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

# Ensure project root and local venv site-packages are accessible
base_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(base_dir))

venv_site = base_dir / "venv" / "Lib" / "site-packages"
if venv_site.exists() and str(venv_site) not in sys.path:
    sys.path.insert(0, str(venv_site))

import joblib
import numpy as np

from training.pharmacy_forecasting_features import (
    FEATURE_NAMES,
    MEDICINE_ENCODING,
    build_dataset_matrix,
)
from training.intermittent_demand_forecaster import HurdleXGBoostForecaster

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("train_hurdle_forecaster")

HORIZONS = [7, 14, 30]


def load_training_series(train_csv_path: Path) -> Dict[str, Dict[str, any]]:
    if not train_csv_path.exists():
        raise FileNotFoundError(f"Training dataset not found at: {train_csv_path}")

    series_by_med: Dict[str, Dict[str, any]] = {}
    with open(train_csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            m_id = row["medicine_id"].strip()
            if m_id not in series_by_med:
                series_by_med[m_id] = {
                    "medicine_name": row["medicine_name"].strip(),
                    "category": row["category"].strip(),
                    "dates": [],
                    "quantities": [],
                }
            series_by_med[m_id]["dates"].append(row["date"].strip())
            series_by_med[m_id]["quantities"].append(float(row["quantity_dispensed"]))

    for m_id, data in series_by_med.items():
        data["quantities"] = np.array(data["quantities"], dtype=np.float64)

    return series_by_med


def train_hurdle_models():
    print("=" * 90)
    print("MODULE 11: TRAINING TWO-STAGE HURDLE DEMAND FORECASTERS")
    print("=" * 90)

    train_path = base_dir / "data" / "processed" / "pharmacy_demand_train.csv"
    models_dir = base_dir / "models" / "pharmacy_forecasting"
    models_dir.mkdir(parents=True, exist_ok=True)

    logger.info("Loading training series from: %s", train_path.name)
    series_data = load_training_series(train_path)

    metadata = {
        "model_family": "Two-Stage Hurdle XGBoost Demand Forecaster",
        "version": "1.0.0",
        "training_dataset": "data/processed/pharmacy_demand_train.csv",
        "training_sample_days": 1825,
        "medicines_count": len(series_data),
        "medicines": list(series_data.keys()),
        "feature_count": len(FEATURE_NAMES),
        "feature_names": FEATURE_NAMES,
        "medicine_encoding": MEDICINE_ENCODING,
        "hyperparameters": {
            "n_estimators": 50,
            "max_depth": 4,
            "learning_rate": 0.05,
            "subsample": 0.8,
            "colsample_bytree": 0.8,
            "random_state": 42,
            "threshold": None,
        },
        "trained_horizons": HORIZONS,
        "created_at_utc": datetime.now(timezone.utc).isoformat(),
    }

    for h in HORIZONS:
        logger.info("Building feature matrix for Horizon H = %d days...", h)
        X_train, Y_train, _ = build_dataset_matrix(series_data, horizon=h, start_origin_idx=28)
        logger.info("  Training Matrix: X shape = %s, Y shape = %s", X_train.shape, Y_train.shape)

        hurdle_model = HurdleXGBoostForecaster(
            horizon=h,
            n_estimators=50,
            max_depth=4,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            threshold=None,
        )

        logger.info("Fitting Hurdle Model (Occurrence Classifier + Magnitude Regressor for H = %d)...", h)
        hurdle_model.fit(X_train, Y_train)

        model_file = models_dir / f"hurdle_forecaster_h{h}.joblib"
        joblib.dump(hurdle_model, model_file, compress=3)
        file_size_kb = model_file.stat().st_size / 1024
        logger.info("Serialized Hurdle artifact: %s (%.2f KB)", model_file.name, file_size_kb)

    meta_file = models_dir / "hurdle_metadata.json"
    with open(meta_file, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4)
    logger.info("Saved Hurdle metadata to: %s", meta_file.name)

    print("\n" + "=" * 90)
    print("HURDLE MODEL TRAINING & SERIALIZATION COMPLETED")
    print("=" * 90 + "\n")


if __name__ == "__main__":
    train_hurdle_models()
