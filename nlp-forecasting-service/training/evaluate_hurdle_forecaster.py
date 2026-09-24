#!/usr/bin/env python3
"""
evaluate_hurdle_forecaster.py

Module 11: Intermittent-Demand & Hurdle Forecaster Evaluation.
Evaluates the Two-Stage Hurdle XGBoost Demand Forecaster using rolling-origin
backtesting and produces a 3-way benchmark comparison:
  1. 7-Day Moving Average Baseline
  2. Standard Direct XGBoost Regressor
  3. Two-Stage Hurdle XGBoost Forecaster

Output Artifacts:
- data/processed/hurdle_xgboost_results.csv
- data/processed/baseline_xgboost_hurdle_comparison.csv
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
from sklearn.metrics import precision_score, recall_score, f1_score

from training.pharmacy_forecasting_features import (
    FEATURE_NAMES,
    extract_single_origin_features,
    build_dataset_matrix,
)
from training.intermittent_demand_forecaster import HurdleXGBoostForecaster

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("evaluate_hurdle")

HORIZONS = [7, 14, 30]
MIN_WARMUP_DAYS = 365
ROLLING_STRIDE_DAYS = 14


def compute_metrics(actuals: np.ndarray, predictions: np.ndarray) -> Dict[str, float]:
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


def evaluate_hurdle_rolling(
    series_data: Dict[str, Dict[str, any]],
    horizon: int,
    min_warmup: int = MIN_WARMUP_DAYS,
    stride: int = ROLLING_STRIDE_DAYS,
    threshold: float = 0.5,
) -> Tuple[List[Dict[str, any]], Dict[str, Dict[str, float]]]:
    """
    Evaluates Hurdle model across rolling origins.
    """
    first_med = next(iter(series_data.values()))
    total_len = len(first_med["quantities"])
    origin_indices = list(range(min_warmup, total_len - horizon + 1, stride))

    per_med_actuals: Dict[str, List[float]] = {m: [] for m in series_data}
    per_med_preds: Dict[str, List[float]] = {m: [] for m in series_data}
    per_med_probs: Dict[str, List[float]] = {m: [] for m in series_data}
    num_windows = 0

    logger.info("Executing Hurdle rolling backtest across %d origins for H = %d...", len(origin_indices), horizon)

    current_model = None
    last_trained_origin = -1

    for origin_idx in origin_indices:
        if current_model is None or (origin_idx - last_trained_origin) >= 28:
            X_train, Y_train, _ = build_dataset_matrix(
                series_data,
                horizon=horizon,
                start_origin_idx=28,
                end_origin_idx=origin_idx - 1,
            )

            current_model = HurdleXGBoostForecaster(
                horizon=horizon,
                n_estimators=45,
                max_depth=4,
                learning_rate=0.05,
                subsample=0.8,
                colsample_bytree=0.8,
                random_state=42,
                threshold=threshold,
            )
            current_model.fit(X_train, Y_train)
            last_trained_origin = origin_idx

        for m_id, m_data in series_data.items():
            history = m_data["quantities"][:origin_idx]
            actual_window = m_data["quantities"][origin_idx : origin_idx + horizon]
            origin_date = datetime.strptime(m_data["dates"][origin_idx], "%Y-%m-%d")

            feat = extract_single_origin_features(history, origin_date, m_id).reshape(1, -1)
            pred_window = current_model.predict(feat)[0]
            prob_window = current_model.predict_occurrence(feat)[0]

            per_med_actuals[m_id].extend(actual_window)
            per_med_preds[m_id].extend(pred_window)
            per_med_probs[m_id].extend(prob_window)

        num_windows += 1

    results = []
    occurrence_stats = {}

    for m_id, m_data in sorted(series_data.items()):
        act = np.array(per_med_actuals[m_id])
        prd = np.array(per_med_preds[m_id])
        prb = np.array(per_med_probs[m_id])

        metrics = compute_metrics(act, prd)

        # Occurrence classification metrics
        act_binary = (act > 0).astype(int)
        pred_binary = (prb >= threshold).astype(int)

        prec = float(precision_score(act_binary, pred_binary, zero_division=0))
        rec = float(recall_score(act_binary, pred_binary, zero_division=0))
        f1 = float(f1_score(act_binary, pred_binary, zero_division=0))

        actual_zeros = int(np.sum(act_binary == 0))
        pred_zeros = int(np.sum(pred_binary == 0))

        occurrence_stats[m_id] = {
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
            "actual_zeros": actual_zeros,
            "pred_zeros": pred_zeros,
            "total_points": len(act),
            "zero_rate": round(actual_zeros / len(act) * 100, 2),
        }

        results.append({
            "model": "Two-Stage Hurdle XGBoost",
            "medicine_id": m_id,
            "medicine_name": m_data["medicine_name"],
            "category": m_data["category"],
            "horizon_days": horizon,
            "mae": metrics["mae"],
            "rmse": metrics["rmse"],
            "wape": metrics["wape"],
            "wape_pct": f"{metrics['wape'] * 100:.2f}%",
            "occ_f1": round(f1, 4),
            "num_forecast_windows": num_windows,
            "total_evaluated_points": num_windows * horizon,
        })

    return results, occurrence_stats


def main():
    print("=" * 100)
    print("MODULE 11: TWO-STAGE HURDLE XGBOOST EVALUATION & 3-WAY BENCHMARK")
    print("=" * 100)

    train_path = base_dir / "data" / "processed" / "pharmacy_demand_train.csv"
    baseline_results_path = base_dir / "data" / "processed" / "baseline_evaluation_results.csv"
    xgb_results_path = base_dir / "data" / "processed" / "xgboost_evaluation_results.csv"
    hurdle_results_path = base_dir / "data" / "processed" / "hurdle_xgboost_results.csv"
    comparison_path = base_dir / "data" / "processed" / "baseline_xgboost_hurdle_comparison.csv"

    series_data = load_training_series(train_path)
    all_hurdle_results = []
    occ_stats_by_horizon = {}

    for h in HORIZONS:
        logger.info("Evaluating Hurdle Forecaster for Horizon H = %d...", h)
        hurdle_h_results, occ_stats = evaluate_hurdle_rolling(series_data, horizon=h, threshold=0.5)
        all_hurdle_results.extend(hurdle_h_results)
        occ_stats_by_horizon[h] = occ_stats

    # Save Hurdle Results CSV
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
        "occ_f1",
        "num_forecast_windows",
        "total_evaluated_points",
    ]
    with open(hurdle_results_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_hurdle_results)
    logger.info("Saved Hurdle results to: %s", hurdle_results_path.name)

    # Load Baseline and Standard XGBoost Results
    baseline_map = {}
    if baseline_results_path.exists():
        with open(baseline_results_path, "r", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                if "Moving Average" in r["model"]:
                    key = (r["medicine_id"], int(r["horizon_days"]))
                    baseline_map[key] = {
                        "mae": float(r["mae"]),
                        "rmse": float(r["rmse"]),
                        "wape": float(r["wape"]),
                    }

    xgb_map = {}
    if xgb_results_path.exists():
        with open(xgb_results_path, "r", encoding="utf-8") as f:
            for r in csv.DictReader(f):
                key = (r["medicine_id"], int(r["horizon_days"]))
                xgb_map[key] = {
                    "mae": float(r["mae"]),
                    "rmse": float(r["rmse"]),
                    "wape": float(r["wape"]),
                }

    # Generate 3-Way Comparison Table
    comparison_rows = []
    for hr in all_hurdle_results:
        key = (hr["medicine_id"], hr["horizon_days"])
        b = baseline_map.get(key, {"mae": 0.0, "rmse": 0.0, "wape": 0.0})
        x = xgb_map.get(key, {"mae": 0.0, "rmse": 0.0, "wape": 0.0})

        comparison_rows.append({
            "medicine_id": hr["medicine_id"],
            "medicine_name": hr["medicine_name"],
            "category": hr["category"],
            "horizon_days": hr["horizon_days"],
            "baseline_7d_wape": b["wape"],
            "baseline_7d_mae": b["mae"],
            "baseline_7d_rmse": b["rmse"],
            "standard_xgb_wape": x["wape"],
            "standard_xgb_mae": x["mae"],
            "standard_xgb_rmse": x["rmse"],
            "hurdle_xgb_wape": hr["wape"],
            "hurdle_xgb_mae": hr["mae"],
            "hurdle_xgb_rmse": hr["rmse"],
            "hurdle_vs_baseline_gain_pct": round(((b["wape"] - hr["wape"]) / b["wape"] * 100), 2) if b["wape"] > 0 else 0.0,
            "hurdle_vs_xgb_gain_pct": round(((x["wape"] - hr["wape"]) / x["wape"] * 100), 2) if x["wape"] > 0 else 0.0,
        })

    comp_fieldnames = [
        "medicine_id",
        "medicine_name",
        "category",
        "horizon_days",
        "baseline_7d_wape",
        "baseline_7d_mae",
        "baseline_7d_rmse",
        "standard_xgb_wape",
        "standard_xgb_mae",
        "standard_xgb_rmse",
        "hurdle_xgb_wape",
        "hurdle_xgb_mae",
        "hurdle_xgb_rmse",
        "hurdle_vs_baseline_gain_pct",
        "hurdle_vs_xgb_gain_pct",
    ]
    with open(comparison_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=comp_fieldnames)
        writer.writeheader()
        writer.writerows(comparison_rows)
    logger.info("Saved 3-way comparison to: %s", comparison_path.name)

    # Print 3-Way Summary Table
    print("\n" + "=" * 100)
    print("3-WAY MACRO PERFORMANCE COMPARISON: BASELINE vs. STANDARD XGB vs. HURDLE XGB")
    print("=" * 100)
    print(f"{'Horizon':<10} {'Metric':<8} {'Baseline (7D-MA)':<18} {'Standard XGB':<18} {'Hurdle XGB':<18} {'Hurdle vs Base Gain'}")
    print("-" * 100)

    for h in HORIZONS:
        c_h = [r for r in comparison_rows if r["horizon_days"] == h]
        base_wape = float(np.mean([r["baseline_7d_wape"] for r in c_h]))
        xgb_wape = float(np.mean([r["standard_xgb_wape"] for r in c_h]))
        hrd_wape = float(np.mean([r["hurdle_xgb_wape"] for r in c_h]))

        base_mae = float(np.mean([r["baseline_7d_mae"] for r in c_h]))
        xgb_mae = float(np.mean([r["standard_xgb_mae"] for r in c_h]))
        hrd_mae = float(np.mean([r["hurdle_xgb_mae"] for r in c_h]))

        base_rmse = float(np.mean([r["baseline_7d_rmse"] for r in c_h]))
        xgb_rmse = float(np.mean([r["standard_xgb_rmse"] for r in c_h]))
        hrd_rmse = float(np.mean([r["hurdle_xgb_rmse"] for r in c_h]))

        gain_wape = ((base_wape - hrd_wape) / base_wape * 100) if base_wape > 0 else 0.0

        print(f"H = {h:<6} WAPE     {base_wape*100:<17.2f}% {xgb_wape*100:<17.2f}% {hrd_wape*100:<17.2f}% {gain_wape:+6.2f}%")
        print(f"{'':<10} MAE      {base_mae:<18.4f} {xgb_mae:<18.4f} {hrd_mae:<18.4f} {((base_mae - hrd_mae)/base_mae*100):+6.2f}%")
        print(f"{'':<10} RMSE     {base_rmse:<18.4f} {xgb_rmse:<18.4f} {hrd_rmse:<18.4f} {((base_rmse - hrd_rmse)/base_rmse*100):+6.2f}%")
        print("-" * 100)

    # Print In-Depth Intermittent Diagnostics for N05C and R03 (H = 14)
    print("\n" + "=" * 100)
    print("INTERMITTENT OCCURRENCE & DEMAND DIAGNOSTICS (H = 14 DAYS)")
    print("=" * 100)
    print(f"{'Medicine ID':<16} {'Zero Rate':<12} {'Precision':<12} {'Recall':<10} {'F1-Score':<10} {'Actual 0s / Pred 0s':<22} {'Hurdle WAPE'}")
    print("-" * 100)

    for m_id in ["MED-ATC-N05C", "MED-ATC-R03"]:
        stats = occ_stats_by_horizon[14][m_id]
        h_row = next(r for r in all_hurdle_results if r["medicine_id"] == m_id and r["horizon_days"] == 14)
        print(
            f"{m_id:<16} {stats['zero_rate']}%{'':<6} {stats['precision']:<12.4f} {stats['recall']:<10.4f} "
            f"{stats['f1']:<10.4f} {stats['actual_zeros']} / {stats['pred_zeros']:<16} {h_row['wape_pct']}"
        )
    print("=" * 100 + "\n")


if __name__ == "__main__":
    main()
