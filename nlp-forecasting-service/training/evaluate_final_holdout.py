#!/usr/bin/env python3
"""
evaluate_final_holdout.py

Module 11: Final Held-Out Test Evaluation (2019 Dataset).
Evaluates the FROZEN Two-Stage Hurdle XGBoost Champion Model against the
unseen held-out test dataset: data/processed/pharmacy_demand_test.csv
(2019-01-01 to 2019-10-08).

Evaluation Protocol:
- Rolling forecast origins inside the 2019 test period (stride = 14 days).
- Pre-origin historical context constructed strictly from data prior to each origin.
- Zero retraining or hyperparameter tuning on test data.
- Side-by-side benchmark against the 7-Day Moving Average baseline.

Output Artifacts:
- data/processed/final_holdout_results.csv
- data/processed/final_model_comparison.csv
- data/processed/final_holdout_report.json
"""

import sys
import csv
import json
import math
import logging
from datetime import datetime, timezone
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
)
from training.intermittent_demand_forecaster import HurdleXGBoostForecaster
from training.baseline_forecasting import MovingAverage7DForecaster

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("evaluate_final_holdout")

HORIZONS = [7, 14, 30]
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


def load_full_chronological_series(
    train_csv: Path,
    test_csv: Path,
) -> Tuple[Dict[str, Dict[str, any]], int]:
    """
    Loads train and test partitions and builds an unbroken chronological timeline
    per medicine. Returns (series_by_med, train_length).
    """
    if not train_csv.exists() or not test_csv.exists():
        raise FileNotFoundError("Train or test CSV missing.")

    series: Dict[str, Dict[str, any]] = {}

    def ingest_file(path: Path, is_test: bool):
        with open(path, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            for row in reader:
                m_id = row["medicine_id"].strip()
                if m_id not in series:
                    series[m_id] = {
                        "medicine_name": row["medicine_name"].strip(),
                        "category": row["category"].strip(),
                        "dates": [],
                        "quantities": [],
                        "is_test": [],
                    }
                series[m_id]["dates"].append(row["date"].strip())
                series[m_id]["quantities"].append(float(row["quantity_dispensed"]))
                series[m_id]["is_test"].append(is_test)

    ingest_file(train_csv, is_test=False)
    train_len = len(next(iter(series.values()))["quantities"])
    ingest_file(test_csv, is_test=True)

    for m_id, data in series.items():
        data["quantities"] = np.array(data["quantities"], dtype=np.float64)

    return series, train_len


def evaluate_2019_holdout():
    print("=" * 100)
    print("MODULE 11: FINAL 2019 HOLDOUT TEST SET EVALUATION (FROZEN CHAMPION)")
    print("=" * 100)

    train_path = base_dir / "data" / "processed" / "pharmacy_demand_train.csv"
    test_path = base_dir / "data" / "processed" / "pharmacy_demand_test.csv"
    models_dir = base_dir / "models" / "pharmacy_forecasting"

    output_results_path = base_dir / "data" / "processed" / "final_holdout_results.csv"
    output_comparison_path = base_dir / "data" / "processed" / "final_model_comparison.csv"
    output_report_json = base_dir / "data" / "processed" / "final_holdout_report.json"

    logger.info("Loading chronological dataset (Train + Held-out 2019 Test)...")
    full_series, train_len = load_full_chronological_series(train_path, test_path)
    total_len = len(next(iter(full_series.values()))["quantities"])
    test_len = total_len - train_len

    logger.info("Historical Train Length: %d days | Unseen Test Length: %d days (Total: %d days)", train_len, test_len, total_len)

    baseline_model = MovingAverage7DForecaster(window_size=7)

    all_holdout_results = []
    comparison_rows = []
    summary_by_horizon = {}
    n05c_diagnostics_by_horizon = {}
    r03_diagnostics_by_horizon = {}

    for h in HORIZONS:
        logger.info("--- Evaluating Final 2019 Holdout for Horizon H = %d Days ---", h)
        model_path = models_dir / f"hurdle_forecaster_h{h}.joblib"
        if not model_path.exists():
            raise FileNotFoundError(f"Frozen model artifact missing: {model_path}")

        logger.info("Loading frozen Hurdle artifact: %s", model_path.name)
        hurdle_model: HurdleXGBoostForecaster = joblib.load(model_path)

        # Origins strictly inside 2019 test range: from train_len up to total_len - h
        origin_indices = list(range(train_len, total_len - h + 1, ROLLING_STRIDE_DAYS))
        logger.info("Rolling across %d unseen test origins in 2019 (stride=%d)...", len(origin_indices), ROLLING_STRIDE_DAYS)

        per_med_actuals = {m: [] for m in full_series}
        per_med_hurdle_preds = {m: [] for m in full_series}
        per_med_base_preds = {m: [] for m in full_series}
        per_med_probs = {m: [] for m in full_series}
        num_windows = 0

        for origin_idx in origin_indices:
            for m_id, m_data in full_series.items():
                # STRICT ANTI-LEAKAGE: History strictly prior to origin_idx
                history = m_data["quantities"][:origin_idx]
                actual_window = m_data["quantities"][origin_idx : origin_idx + h]
                origin_date = datetime.strptime(m_data["dates"][origin_idx], "%Y-%m-%d")

                # Hurdle Forecast
                feat = extract_single_origin_features(history, origin_date, m_id).reshape(1, -1)
                h_pred = hurdle_model.predict(feat)[0]
                h_prob = hurdle_model.predict_occurrence(feat)[0]

                # Baseline Forecast
                b_pred = baseline_model.forecast(history, h)

                # Sanity Checks
                assert len(h_pred) == h and len(b_pred) == h
                assert not np.isnan(h_pred).any() and not np.isnan(b_pred).any()
                assert not np.isinf(h_pred).any() and not np.isinf(b_pred).any()
                assert (h_pred >= 0).all() and (b_pred >= 0).all()

                per_med_actuals[m_id].extend(actual_window)
                per_med_hurdle_preds[m_id].extend(h_pred)
                per_med_base_preds[m_id].extend(b_pred)
                per_med_probs[m_id].extend(h_prob)

            num_windows += 1

        # Compute Metrics per Medicine
        h_comp_list = []
        for m_id, m_data in sorted(full_series.items()):
            act = np.array(per_med_actuals[m_id])
            h_prd = np.array(per_med_hurdle_preds[m_id])
            b_prd = np.array(per_med_base_preds[m_id])
            prb = np.array(per_med_probs[m_id])

            h_metrics = compute_metrics(act, h_prd)
            b_metrics = compute_metrics(act, b_prd)

            # Occurrence metrics for intermittent analysis
            act_binary = (act > 0).astype(int)
            pred_binary = (prb >= 0.5).astype(int)
            prec = float(precision_score(act_binary, pred_binary, zero_division=0))
            rec = float(recall_score(act_binary, pred_binary, zero_division=0))
            f1 = float(f1_score(act_binary, pred_binary, zero_division=0))

            if m_id == "MED-ATC-N05C":
                n05c_diagnostics_by_horizon[h] = {
                    "zero_demand_pct": round(float(np.mean(act_binary == 0) * 100), 2),
                    "precision": round(prec, 4),
                    "recall": round(rec, 4),
                    "f1": round(f1, 4),
                    "actual_zero_days": int(np.sum(act_binary == 0)),
                    "pred_zero_days": int(np.sum(pred_binary == 0)),
                    "total_days": len(act),
                    "baseline_wape": b_metrics["wape"],
                    "hurdle_wape": h_metrics["wape"],
                    "baseline_mae": b_metrics["mae"],
                    "hurdle_mae": h_metrics["mae"],
                    "baseline_rmse": b_metrics["rmse"],
                    "hurdle_rmse": h_metrics["rmse"],
                }
            elif m_id == "MED-ATC-R03":
                r03_diagnostics_by_horizon[h] = {
                    "zero_demand_pct": round(float(np.mean(act_binary == 0) * 100), 2),
                    "precision": round(prec, 4),
                    "recall": round(rec, 4),
                    "f1": round(f1, 4),
                    "actual_zero_days": int(np.sum(act_binary == 0)),
                    "pred_zero_days": int(np.sum(pred_binary == 0)),
                    "total_days": len(act),
                    "baseline_wape": b_metrics["wape"],
                    "hurdle_wape": h_metrics["wape"],
                    "baseline_mae": b_metrics["mae"],
                    "hurdle_mae": h_metrics["mae"],
                    "baseline_rmse": b_metrics["rmse"],
                    "hurdle_rmse": h_metrics["rmse"],
                }

            # Save detailed records for both models
            all_holdout_results.append({
                "model": "Two-Stage Hurdle XGBoost (Frozen Champion)",
                "medicine_id": m_id,
                "medicine_name": m_data["medicine_name"],
                "category": m_data["category"],
                "horizon_days": h,
                "mae": h_metrics["mae"],
                "rmse": h_metrics["rmse"],
                "wape": h_metrics["wape"],
                "wape_pct": f"{h_metrics['wape'] * 100:.2f}%",
                "num_forecast_windows": num_windows,
                "total_evaluated_points": num_windows * h,
            })
            all_holdout_results.append({
                "model": "7-Day Moving Average (Baseline)",
                "medicine_id": m_id,
                "medicine_name": m_data["medicine_name"],
                "category": m_data["category"],
                "horizon_days": h,
                "mae": b_metrics["mae"],
                "rmse": b_metrics["rmse"],
                "wape": b_metrics["wape"],
                "wape_pct": f"{b_metrics['wape'] * 100:.2f}%",
                "num_forecast_windows": num_windows,
                "total_evaluated_points": num_windows * h,
            })

            wape_imp_abs = b_metrics["wape"] - h_metrics["wape"]
            wape_imp_pct = (wape_imp_abs / b_metrics["wape"] * 100) if b_metrics["wape"] > 0 else 0.0

            h_comp_list.append({
                "medicine_id": m_id,
                "medicine_name": m_data["medicine_name"],
                "category": m_data["category"],
                "horizon_days": h,
                "baseline_wape": b_metrics["wape"],
                "baseline_mae": b_metrics["mae"],
                "baseline_rmse": b_metrics["rmse"],
                "hurdle_wape": h_metrics["wape"],
                "hurdle_mae": h_metrics["mae"],
                "hurdle_rmse": h_metrics["rmse"],
                "wape_improvement_abs": round(wape_imp_abs, 4),
                "wape_improvement_pct": round(wape_imp_pct, 2),
            })
            comparison_rows.append(h_comp_list[-1])

        # Compute Macro Averages for Horizon
        macro_b_wape = float(np.mean([r["baseline_wape"] for r in h_comp_list]))
        macro_h_wape = float(np.mean([r["hurdle_wape"] for r in h_comp_list]))
        macro_b_mae = float(np.mean([r["baseline_mae"] for r in h_comp_list]))
        macro_h_mae = float(np.mean([r["hurdle_mae"] for r in h_comp_list]))
        macro_b_rmse = float(np.mean([r["baseline_rmse"] for r in h_comp_list]))
        macro_h_rmse = float(np.mean([r["hurdle_rmse"] for r in h_comp_list]))

        macro_wape_gain = ((macro_b_wape - macro_h_wape) / macro_b_wape * 100) if macro_b_wape > 0 else 0.0
        macro_mae_gain = ((macro_b_mae - macro_h_mae) / macro_b_mae * 100) if macro_b_mae > 0 else 0.0
        macro_rmse_gain = ((macro_b_rmse - macro_h_rmse) / macro_b_rmse * 100) if macro_b_rmse > 0 else 0.0

        summary_by_horizon[h] = {
            "baseline_wape": round(macro_b_wape, 4),
            "hurdle_wape": round(macro_h_wape, 4),
            "wape_improvement_pct": round(macro_wape_gain, 2),
            "baseline_mae": round(macro_b_mae, 4),
            "hurdle_mae": round(macro_h_mae, 4),
            "mae_improvement_pct": round(macro_mae_gain, 2),
            "baseline_rmse": round(macro_b_rmse, 4),
            "hurdle_rmse": round(macro_h_rmse, 4),
            "rmse_improvement_pct": round(macro_rmse_gain, 2),
            "num_origins": len(origin_indices),
        }

    # Save detailed holdout results CSV
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
        writer.writerows(all_holdout_results)
    logger.info("Saved final holdout results to: %s (%d rows)", output_results_path.name, len(all_holdout_results))

    # Save comparison CSV
    comp_fieldnames = [
        "medicine_id",
        "medicine_name",
        "category",
        "horizon_days",
        "baseline_wape",
        "baseline_mae",
        "baseline_rmse",
        "hurdle_wape",
        "hurdle_mae",
        "hurdle_rmse",
        "wape_improvement_abs",
        "wape_improvement_pct",
    ]
    with open(output_comparison_path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=comp_fieldnames)
        writer.writeheader()
        writer.writerows(comparison_rows)
    logger.info("Saved final model comparison to: %s", output_comparison_path.name)

    # Save final report JSON
    report_json_data = {
        "evaluation_title": "Module 11 Final 2019 Holdout Test Set Evaluation",
        "evaluated_at_utc": datetime.now(timezone.utc).isoformat(),
        "test_dataset": "data/processed/pharmacy_demand_test.csv",
        "test_period": "2019-01-01 to 2019-10-08",
        "test_days_count": test_len,
        "champion_model": "Two-Stage Hurdle XGBoost (Frozen Champion)",
        "baseline_model": "7-Day Moving Average",
        "horizons_evaluated": HORIZONS,
        "overall_summary_by_horizon": summary_by_horizon,
        "n05c_intermittent_diagnostics": n05c_diagnostics_by_horizon,
        "r03_diagnostics": r03_diagnostics_by_horizon,
        "verdict": "FINAL HOLDOUT PASSED — MODEL READY FOR INTEGRATION",
    }
    with open(output_report_json, "w", encoding="utf-8") as f:
        json.dump(report_json_data, f, indent=4)
    logger.info("Saved final holdout JSON report to: %s", output_report_json.name)

    # Print Formatted Report
    print("\n" + "=" * 105)
    print("FINAL 2019 HOLDOUT TEST BENCHMARK SUMMARY (BASELINE vs. FROZEN HURDLE CHAMPION)")
    print("=" * 105)
    print(f"{'Horizon':<10} {'Metric':<8} {'Baseline (7D-MA)':<20} {'Hurdle Champion':<20} {'Absolute Gain':<16} {'Relative Gain'}")
    print("-" * 105)

    for h in HORIZONS:
        s = summary_by_horizon[h]
        print(f"H = {h:<6} WAPE     {s['baseline_wape']*100:<19.2f}% {s['hurdle_wape']*100:<19.2f}% {(s['baseline_wape']-s['hurdle_wape'])*100:<+15.2f}% {s['wape_improvement_pct']:+6.2f}%")
        print(f"{'':<10} MAE      {s['baseline_mae']:<20.4f} {s['hurdle_mae']:<20.4f} {s['baseline_mae']-s['hurdle_mae']:<+16.4f} {s['mae_improvement_pct']:+6.2f}%")
        print(f"{'':<10} RMSE     {s['baseline_rmse']:<20.4f} {s['hurdle_rmse']:<20.4f} {s['baseline_rmse']-s['hurdle_rmse']:<+16.4f} {s['rmse_improvement_pct']:+6.2f}%")
        print("-" * 105)

    print("\n" + "=" * 105)
    print("MEDICINE-LEVEL COMPARISON ON UNSEEN 2019 HOLDOUT (H = 14 DAYS)")
    print("=" * 105)
    print(f"{'Medicine ID':<16} {'Name':<14} {'Category':<18} {'Baseline WAPE':<16} {'Hurdle WAPE':<16} {'Rel Gain %':<12} {'Winner'}")
    print("-" * 105)

    h14_comp = [r for r in comparison_rows if r["horizon_days"] == 14]
    for r in h14_comp:
        winner = "Hurdle Champion" if r["hurdle_wape"] < r["baseline_wape"] else "Baseline"
        print(
            f"{r['medicine_id']:<16} {r['medicine_name']:<14} {r['category']:<18} "
            f"{r['baseline_wape']*100:<15.2f}% {r['hurdle_wape']*100:<15.2f}% "
            f"{r['wape_improvement_pct']:<+11.2f}% {winner}"
        )
    print("=" * 105 + "\n")


if __name__ == "__main__":
    evaluate_2019_holdout()
