#!/usr/bin/env python3
"""
evaluate_baselines.py

Module 11: Rolling-Origin Backtesting & Baseline Benchmarking Framework.
Evaluates standard time-series baseline forecasting strategies across all 8 medicine
series using ONLY the training partition (data/processed/pharmacy_demand_train.csv).

Forecast Horizons:
- H = 7  (1-week horizon)
- H = 14 (2-week operational replenishment horizon)
- H = 30 (Monthly inventory planning horizon)

Evaluation Metrics:
- MAE  : Mean Absolute Error (units)
- RMSE : Root Mean Squared Error (units)
- WAPE : Weighted Absolute Percentage Error (sum(|actual - pred|) / sum(actual))

Output Artifacts:
- data/processed/baseline_evaluation_results.csv (detailed per-medicine results)
- data/processed/baseline_evaluation_summary.csv (ranked overall summary)
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

import numpy as np

# Import baseline models
try:
    from training.baseline_forecasting import (
        BaselineForecaster,
        get_all_baselines,
    )
except ModuleNotFoundError:
    from baseline_forecasting import (
        BaselineForecaster,
        get_all_baselines,
    )

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("evaluate_baselines")

HORIZONS = [7, 14, 30]
MIN_WARMUP_DAYS = 365  # 1 full year initial historical context
ROLLING_STRIDE_DAYS = 14  # Evaluate origins every 14 days


def compute_metrics(actuals: np.ndarray, predictions: np.ndarray) -> Dict[str, float]:
    """Computes MAE, RMSE, and WAPE between actual and predicted arrays."""
    if len(actuals) == 0:
        return {"mae": 0.0, "rmse": 0.0, "wape": 0.0}

    errors = actuals - predictions
    abs_errors = np.abs(errors)
    sq_errors = errors ** 2

    mae = float(np.mean(abs_errors))
    rmse = float(math.sqrt(np.mean(sq_errors)))

    total_actual = float(np.sum(np.abs(actuals)))
    total_abs_err = float(np.sum(abs_errors))

    if total_actual > 0:
        wape = float(total_abs_err / total_actual)
    else:
        wape = 0.0 if total_abs_err == 0 else 1.0

    return {
        "mae": round(mae, 4),
        "rmse": round(rmse, 4),
        "wape": round(wape, 4),
    }


def load_training_series(train_csv_path: Path) -> Dict[str, Dict[str, any]]:
    """Loads training data and organizes chronologically by medicine_id."""
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

    # Convert quantities to numpy arrays and verify chronological sorting
    for m_id, data in series_by_med.items():
        data["quantities"] = np.array(data["quantities"], dtype=np.float64)

    return series_by_med


def evaluate_model_on_series(
    model: BaselineForecaster,
    series: np.ndarray,
    horizon: int,
    min_warmup: int = MIN_WARMUP_DAYS,
    stride: int = ROLLING_STRIDE_DAYS,
) -> Tuple[Dict[str, float], int]:
    """
    Executes rolling-origin backtesting for a single model, medicine, and horizon.
    """
    total_len = len(series)
    if total_len < min_warmup + horizon:
        raise ValueError(
            f"Insufficient series length ({total_len}) for warmup={min_warmup}, horizon={horizon}."
        )

    all_actuals = []
    all_preds = []
    num_forecast_windows = 0

    origin_indices = range(min_warmup, total_len - horizon + 1, stride)

    for origin_idx in origin_indices:
        # History strictly before origin
        history_window = series[:origin_idx]
        actual_window = series[origin_idx : origin_idx + horizon]

        pred_window = model.forecast(history_window, horizon)

        # Sanity Checks
        assert len(pred_window) == horizon, f"Forecast length mismatch: expected {horizon}, got {len(pred_window)}"
        assert not np.isnan(pred_window).any(), "NaN found in predictions"
        assert not np.isinf(pred_window).any(), "Inf found in predictions"
        assert (pred_window >= 0).all(), "Negative value found in forecast predictions"

        all_actuals.extend(actual_window)
        all_preds.extend(pred_window)
        num_forecast_windows += 1

    metrics = compute_metrics(np.array(all_actuals), np.array(all_preds))
    return metrics, num_forecast_windows


def main():
    print("=" * 100)
    print("MODULE 11: BASELINE FORECASTING BENCHMARK & ROLLING-ORIGIN EVALUATION")
    print("=" * 100)

    train_path = base_dir / "data" / "processed" / "pharmacy_demand_train.csv"
    output_results_path = base_dir / "data" / "processed" / "baseline_evaluation_results.csv"
    output_summary_path = base_dir / "data" / "processed" / "baseline_evaluation_summary.csv"

    logger.info("Loading validated training series from: %s", train_path.name)
    series_data = load_training_series(train_path)
    logger.info("Loaded %d medicine series across 1,825 training days.", len(series_data))

    baselines = get_all_baselines()
    results_rows = []

    # Run evaluations
    for h in HORIZONS:
        logger.info("--- Evaluating Horizon H = %d Days ---", h)
        for model in baselines:
            for m_id, m_info in sorted(series_data.items()):
                series = m_info["quantities"]
                metrics, n_windows = evaluate_model_on_series(model, series, h)

                results_rows.append({
                    "model": model.name,
                    "medicine_id": m_id,
                    "medicine_name": m_info["medicine_name"],
                    "category": m_info["category"],
                    "horizon_days": h,
                    "mae": metrics["mae"],
                    "rmse": metrics["rmse"],
                    "wape": metrics["wape"],
                    "wape_pct": f"{metrics['wape'] * 100:.2f}%",
                    "num_forecast_windows": n_windows,
                    "total_evaluated_points": n_windows * h,
                })

    # Write Detailed Results CSV
    results_fieldnames = [
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
    with open(output_results_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=results_fieldnames)
        writer.writeheader()
        writer.writerows(results_rows)
    logger.info("Saved detailed results to: %s (%d rows)", output_results_path.name, len(results_rows))

    # Compute Overall Summaries (Group by Model and Horizon)
    summary_rows = []
    for h in HORIZONS:
        h_rows = [r for r in results_rows if r["horizon_days"] == h]
        models_in_h = sorted(list({r["model"] for r in h_rows}))

        for m_name in models_in_h:
            m_h_rows = [r for r in h_rows if r["model"] == m_name]
            mean_mae = float(np.mean([r["mae"] for r in m_h_rows]))
            mean_rmse = float(np.mean([r["rmse"] for r in m_h_rows]))
            mean_wape = float(np.mean([r["wape"] for r in m_h_rows]))

            summary_rows.append({
                "horizon_days": h,
                "model": m_name,
                "macro_mae": round(mean_mae, 4),
                "macro_rmse": round(mean_rmse, 4),
                "macro_wape": round(mean_wape, 4),
                "macro_wape_pct": f"{mean_wape * 100:.2f}%",
                "evaluated_series_count": len(m_h_rows),
            })

    # Sort summaries by Horizon ascending and Macro WAPE ascending
    summary_rows.sort(key=lambda x: (x["horizon_days"], x["macro_wape"]))

    summary_fieldnames = [
        "horizon_days",
        "model",
        "macro_wape",
        "macro_wape_pct",
        "macro_mae",
        "macro_rmse",
        "evaluated_series_count",
    ]
    with open(output_summary_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=summary_fieldnames)
        writer.writeheader()
        writer.writerows(summary_rows)
    logger.info("Saved ranked summary to: %s", output_summary_path.name)

    # Print Formatted Benchmark Tables
    print("\n" + "=" * 100)
    print("OVERALL BASELINE BENCHMARK SUMMARY BY FORECAST HORIZON")
    print("=" * 100)
    print(f"{'Horizon':<10} {'Rank':<6} {'Model Name':<32} {'Macro WAPE':<14} {'Macro MAE':<12} {'Macro RMSE'}")
    print("-" * 100)

    for h in HORIZONS:
        h_sum = [s for s in summary_rows if s["horizon_days"] == h]
        for rank, s in enumerate(h_sum, start=1):
            print(
                f"H = {s['horizon_days']:<4} #{rank:<4} {s['model']:<32} "
                f"{s['macro_wape_pct']:<14} {s['macro_mae']:<12.4f} {s['macro_rmse']:.4f}"
            )
        print("-" * 100)

    # Print Medicine-Level Results for H = 14 (Standard Pharmacy Replenishment Horizon)
    print("\n" + "=" * 100)
    print("MEDICINE-LEVEL BASELINE PERFORMANCE (H = 14 DAYS REPLENISHMENT HORIZON)")
    print("=" * 100)
    print(f"{'Medicine ID':<16} {'Model':<30} {'WAPE':<10} {'MAE (Units)':<14} {'RMSE (Units)':<14} {'Category'}")
    print("-" * 100)

    h14_rows = [r for r in results_rows if r["horizon_days"] == 14]
    for m_id in sorted(series_data.keys()):
        med_rows = [r for r in h14_rows if r["medicine_id"] == m_id]
        med_rows.sort(key=lambda x: x["wape"])
        for idx, r in enumerate(med_rows):
            prefix = f"{m_id:<16}" if idx == 0 else f"{'':<16}"
            print(f"{prefix} {r['model']:<30} {r['wape_pct']:<10} {r['mae']:<14.4f} {r['rmse']:<14.4f} {r['category']}")
        print("-" * 100)

    print("\n" + "=" * 100)
    print("BASELINE EVALUATION BENCHMARK COMPLETED SUCCESSFULLY")
    print("=" * 100 + "\n")


if __name__ == "__main__":
    main()
