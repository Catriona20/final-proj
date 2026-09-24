#!/usr/bin/env python3
"""
evaluate_xgboost.py

Module 11: Machine-Learning Forecaster Evaluation & Benchmark Comparison.
Evaluates the feature-engineered XGBoost Direct Multi-Horizon Regressors
using strict rolling-origin backtesting over the training period, and produces
a direct side-by-side comparison against the 7-Day Moving Average champion baseline.

Output Artifacts:
- data/processed/xgboost_evaluation_results.csv
- data/processed/baseline_vs_xgboost.csv
"""

import sys
import csv
import math
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple

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
import xgboost as xgb
from sklearn.multioutput import MultiOutputRegressor

from training.pharmacy_forecasting_features import (
    FEATURE_NAMES,
    extract_single_origin_features,
    build_dataset_matrix,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("evaluate_xgboost")

HORIZONS = [7, 14, 30]
MIN_WARMUP_DAYS = 365
ROLLING_STRIDE_DAYS = 14


def compute_metrics(actuals: np.ndarray, predictions: np.ndarray) -> Dict[str, float]:
    """Computes MAE, RMSE, and WAPE."""
    errors = actuals - predictions
    abs_errors = np.abs(errors)
    sq_errors = errors ** 2

    mae = float(np.mean(abs_errors))
    rmse = float(math.sqrt(np.mean(sq_errors)))

    total_actual = float(np.sum(np.abs(actuals)))
    total_abs_err = float(np.sum(abs_errors))

    wape = float(total_abs_err / total_actual) if total_actual > 0 else 0.0

    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "wape": round(wape, 4),
    }


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


def evaluate_xgboost_rolling(
    series_data: Dict[str, Dict[str, any]],
    horizon: int,
    min_warmup: int = MIN_WARMUP_DAYS,
    stride: int = ROLLING_STRIDE_DAYS,
) -> List[Dict[str, any]]:
    """
    Evaluates XGBoost under expanding-window rolling backtesting:
    For each origin, fits on historical data prior to origin (or expanding window)
    and predicts out-of-sample forward H steps.
    """
    first_med = next(iter(series_data.values()))
    total_len = len(first_med["quantities"])
    origin_indices = list(range(min_warmup, total_len - horizon + 1, stride))

    # Track actuals and predictions per medicine
    per_med_actuals: Dict[str, List[float]] = {m: [] for m in series_data}
    per_med_preds: Dict[str, List[float]] = {m: [] for m in series_data}
    num_windows = 0

    logger.info("Executing rolling backtest across %d origins for H = %d...", len(origin_indices), horizon)

    current_model = None
    last_trained_origin = -1

    for origin_idx in origin_indices:
        # Retrain every 28 days (every 2 origins) or on first origin to ensure strict anti-leakage while running quickly
        if current_model is None or (origin_idx - last_trained_origin) >= 28:
            X_train, Y_train, _ = build_dataset_matrix(
                series_data,
                horizon=horizon,
                start_origin_idx=28,
                end_origin_idx=origin_idx - 1,
            )

            base_estimator = xgb.XGBRegressor(
                n_estimators=50,
                max_depth=4,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                tree_method="hist",
                random_state=42,
                n_jobs=2,
            )
            current_model = MultiOutputRegressor(base_estimator, n_jobs=1)
            current_model.fit(X_train, Y_train)
            last_trained_origin = origin_idx

        # Predict out-of-sample for each medicine at this origin
        for m_id, m_data in series_data.items():
            history = m_data["quantities"][:origin_idx]
            actual_window = m_data["quantities"][origin_idx : origin_idx + horizon]
            origin_date = datetime.strptime(m_data["dates"][origin_idx], "%Y-%m-%d")

            feat = extract_single_origin_features(history, origin_date, m_id).reshape(1, -1)
            pred_window = current_model.predict(feat)[0]
            # Clip negative predictions to zero
            pred_window = np.maximum(0.0, pred_window)

            # Sanity assertions
            assert len(pred_window) == horizon
            assert not np.isnan(pred_window).any()
            assert not np.isinf(pred_window).any()

            per_med_actuals[m_id].extend(actual_window)
            per_med_preds[m_id].extend(pred_window)

        num_windows += 1

    # Compute metrics per medicine
    results = []
    for m_id, m_data in sorted(series_data.items()):
        act = np.array(per_med_actuals[m_id])
        prd = np.array(per_med_preds[m_id])
        metrics = compute_metrics(act, prd)
        results.append({
            "model": "XGBoost Regressor",
            "medicine_id": m_id,
            "medicine_name": m_data["medicine_name"],
            "category": m_data["category"],
            "horizon_days": horizon,
            "mae": metrics["mae"],
            "rmse": metrics["rmse"],
            "wape": metrics["wape"],
            "wape_pct": f"{metrics['wape'] * 100:.2f}%",
            "num_forecast_windows": num_windows,
            "total_evaluated_points": num_windows * horizon,
        })

    return results


def main():
    print("=" * 100)
    print("MODULE 11: XGBOOST REGRESSOR ROLLING BACKTEST & BASELINE COMPARISON")
    print("=" * 100)

    train_path = base_dir / "data" / "processed" / "pharmacy_demand_train.csv"
    baseline_results_path = base_dir / "data" / "processed" / "baseline_evaluation_results.csv"
    xgb_results_path = base_dir / "data" / "processed" / "xgboost_evaluation_results.csv"
    comparison_path = base_dir / "data" / "processed" / "baseline_vs_xgboost.csv"

    series_data = load_training_series(train_path)
    all_xgb_results = []

    for h in HORIZONS:
        logger.info("Evaluating XGBoost for Horizon H = %d...", h)
        xgb_h_results = evaluate_xgboost_rolling(series_data, horizon=h)
        all_xgb_results.extend(xgb_h_results)

    # Save XGBoost evaluation results
    fieldnames = [
        "model",
        "medicine_id",
        "medicine_name",
        "category",
        "horizon_days",
        "mae",
        "rmse",
        "wape",
        "wape_pct",
        "num_forecast_windows",
        "total_evaluated_points",
    ]
    with open(xgb_results_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_xgb_results)
    logger.info("Saved XGBoost results to: %s", xgb_results_path.name)

    # Load baseline results for 7-Day Moving Average
    baseline_7d_map: Dict[Tuple[str, int], Dict[str, float]] = {}
    if baseline_results_path.exists():
        with open(baseline_results_path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for r in reader:
                if "Moving Average" in r["model"]:
                    key = (r["medicine_id"], int(r["horizon_days"]))
                    baseline_7d_map[key] = {
                        "mae": float(r["mae"]),
                        "rmse": float(r["rmse"]),
                        "wape": float(r["wape"]),
                    }

    # Generate Comparison Table
    comparison_rows = []
    for xr in all_xgb_results:
        key = (xr["medicine_id"], xr["horizon_days"])
        b_metrics = baseline_7d_map.get(key, {"mae": 0.0, "rmse": 0.0, "wape": 0.0})

        b_wape = b_metrics["wape"]
        x_wape = xr["wape"]
        abs_imp_wape = b_wape - x_wape
        rel_imp_wape_pct = (abs_imp_wape / b_wape * 100) if b_wape > 0 else 0.0

        comparison_rows.append({
            "medicine_id": xr["medicine_id"],
            "medicine_name": xr["medicine_name"],
            "category": xr["category"],
            "horizon_days": xr["horizon_days"],
            "baseline_model": "7-Day Moving Average",
            "baseline_wape": b_wape,
            "baseline_mae": b_metrics["mae"],
            "baseline_rmse": b_metrics["rmse"],
            "xgboost_wape": x_wape,
            "xgboost_mae": xr["mae"],
            "xgboost_rmse": xr["rmse"],
            "abs_wape_gain": round(abs_imp_wape, 4),
            "rel_wape_gain_pct": round(rel_imp_wape_pct, 2),
        })

    comp_fieldnames = [
        "medicine_id",
        "medicine_name",
        "category",
        "horizon_days",
        "baseline_model",
        "baseline_wape",
        "baseline_mae",
        "baseline_rmse",
        "xgboost_wape",
        "xgboost_mae",
        "xgboost_rmse",
        "abs_wape_gain",
        "rel_wape_gain_pct",
    ]
    with open(comparison_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=comp_fieldnames)
        writer.writeheader()
        writer.writerows(comparison_rows)
    logger.info("Saved baseline vs. XGBoost comparison to: %s", comparison_path.name)

    # Print Summary Tables
    print("\n" + "=" * 100)
    print("OVERALL MACRO PERFORMANCE: 7-DAY MOVING AVERAGE vs. XGBOOST")
    print("=" * 100)
    print(f"{'Horizon':<10} {'Metric':<10} {'Baseline (7D-MA)':<20} {'XGBoost Regressor':<20} {'Absolute Gain':<16} {'Relative Gain'}")
    print("-" * 100)

    for h in HORIZONS:
        c_h = [r for r in comparison_rows if r["horizon_days"] == h]
        base_wape = float(np.mean([r["baseline_wape"] for r in c_h]))
        xgb_wape = float(np.mean([r["xgboost_wape"] for r in c_h]))
        base_mae = float(np.mean([r["baseline_mae"] for r in c_h]))
        xgb_mae = float(np.mean([r["xgboost_mae"] for r in c_h]))
        base_rmse = float(np.mean([r["baseline_rmse"] for r in c_h]))
        xgb_rmse = float(np.mean([r["xgboost_rmse"] for r in c_h]))

        wape_gain = base_wape - xgb_wape
        wape_rel = (wape_gain / base_wape * 100) if base_wape > 0 else 0.0

        print(f"H = {h:<6} WAPE       {base_wape*100:<19.2f}% {xgb_wape*100:<19.2f}% {wape_gain*100:<+15.2f}% {wape_rel:+6.2f}%")
        print(f"{'':<10} MAE        {base_mae:<20.4f} {xgb_mae:<20.4f} {base_mae - xgb_mae:<+16.4f} {(base_mae - xgb_mae)/base_mae*100:+6.2f}%")
        print(f"{'':<10} RMSE       {base_rmse:<20.4f} {xgb_rmse:<20.4f} {base_rmse - xgb_rmse:<+16.4f} {(base_rmse - xgb_rmse)/base_rmse*100:+6.2f}%")
        print("-" * 100)

    # Print Medicine-Level Comparison for H = 14 Days (Standard Replenishment Horizon)
    print("\n" + "=" * 100)
    print("MEDICINE-LEVEL COMPARISON FOR H = 14 DAYS (REPLENISHMENT PLANNING HORIZON)")
    print("=" * 100)
    print(f"{'Medicine ID':<16} {'Name':<14} {'Category':<18} {'Baseline WAPE':<16} {'XGBoost WAPE':<16} {'Rel Gain %':<12} {'Winner'}")
    print("-" * 100)

    h14_comp = [r for r in comparison_rows if r["horizon_days"] == 14]
    for r in h14_comp:
        winner = "XGBoost" if r["xgboost_wape"] < r["baseline_wape"] else "Baseline"
        print(
            f"{r['medicine_id']:<16} {r['medicine_name']:<14} {r['category']:<18} "
            f"{r['baseline_wape']*100:<15.2f}% {r['xgboost_wape']*100:<15.2f}% "
            f"{r['rel_wape_gain_pct']:<+11.2f}% {winner}"
        )
    print("=" * 100)
    print("EVALUATION AND BENCHMARKING COMPLETED SUCCESSFULLY")
    print("=" * 100 + "\n")


if __name__ == "__main__":
    main()
