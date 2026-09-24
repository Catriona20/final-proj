#!/usr/bin/env python3
"""
analyze_confidence.py

Comprehensive Empirical Confidence & Abstention Analysis for Module 10 Department Classifier.
Evaluates raw Logistic Regression posterior probabilities and top-1/top-2 margins on the
held-out candidate test set (data/processed/department_test_candidate.csv, N=2,019).
"""

import sys
import os
import csv
import json
import joblib
from pathlib import Path
from collections import Counter, defaultdict

# Ensure site-packages from local venv are accessible
base_dir = Path(__file__).resolve().parent.parent
venv_site = base_dir / "venv" / "Lib" / "site-packages"
if venv_site.exists() and str(venv_site) not in sys.path:
    sys.path.insert(0, str(venv_site))

# Ensure UTF-8 console output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

import numpy as np

def load_csv(filepath: Path):
    """Load symptom_text and department from CSV."""
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    texts, labels = [], []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        next(reader)
        for row in reader:
            if len(row) >= 2:
                texts.append(row[0])
                labels.append(row[1])
    return texts, labels


def main():
    print("=" * 90)
    print("MODULE 10: CONFIDENCE & ABSTENTION EMPIRICAL AUDIT")
    print("=" * 90)

    model_path = base_dir / "models" / "department_classifier.joblib"
    test_path = base_dir / "data" / "processed" / "department_test_candidate.csv"

    if not model_path.exists():
        raise FileNotFoundError(f"Model artifact not found at {model_path}")
    if not test_path.exists():
        raise FileNotFoundError(f"Test data not found at {test_path}")

    # 1. Load Model and Test Data
    print(f"\n[1] Loading model: {model_path.name}")
    pipeline = joblib.load(model_path)
    print(f"[2] Loading test dataset: {test_path.name}")
    X_test, y_test = load_csv(test_path)
    total_samples = len(X_test)
    classes = list(pipeline.classes_)
    print(f"    Loaded {total_samples} test examples across {len(classes)} classes.")

    # 2. Run Inference
    print("\n[3] Running inference on all test examples...")
    probabilities = pipeline.predict_proba(X_test)
    predictions = pipeline.predict(X_test)

    records = []
    for idx, (text, y_true, y_pred, probs) in enumerate(zip(X_test, y_test, predictions, probabilities)):
        sorted_indices = np.argsort(probs)[::-1]
        top1_class = classes[sorted_indices[0]]
        top1_prob = float(probs[sorted_indices[0]])
        top2_class = classes[sorted_indices[1]]
        top2_prob = float(probs[sorted_indices[1]])
        margin = top1_prob - top2_prob
        is_correct = (y_true == y_pred)

        records.append({
            "index": idx,
            "text": text,
            "true_dept": y_true,
            "pred_dept": y_pred,
            "top1_class": top1_class,
            "top1_prob": top1_prob,
            "top2_class": top2_class,
            "top2_prob": top2_prob,
            "margin": margin,
            "is_correct": is_correct,
            "top3": [(classes[sorted_indices[i]], float(probs[sorted_indices[i]])) for i in range(3)],
        })

    top1_probs = np.array([r["top1_prob"] for r in records])
    margins = np.array([r["margin"] for r in records])
    is_corrects = np.array([r["is_correct"] for r in records])
    total_correct = int(np.sum(is_corrects))
    total_incorrect = total_samples - total_correct
    overall_accuracy = total_correct / total_samples

    # 1. Overall Confidence Statistics
    print("\n" + "=" * 90)
    print("1. OVERALL TOP-1 CONFIDENCE (RAW PROBABILITY) STATISTICS")
    print("=" * 90)
    print(f"Total Test Samples   : {total_samples}")
    print(f"Overall Accuracy     : {overall_accuracy*100:.2f}% ({total_correct} correct, {total_incorrect} incorrect)")
    print(f"Mean Confidence      : {np.mean(top1_probs):.4f} ({np.mean(top1_probs)*100:.2f}%)")
    print(f"Median Confidence    : {np.median(top1_probs):.4f} ({np.median(top1_probs)*100:.2f}%)")
    print(f"Std Dev Confidence   : {np.std(top1_probs):.4f}")
    print(f"Min Confidence       : {np.min(top1_probs):.4f} ({np.min(top1_probs)*100:.2f}%)")
    print(f"Max Confidence       : {np.max(top1_probs):.4f} ({np.max(top1_probs)*100:.2f}%)")

    # 2. Confidence Distribution Buckets
    print("\n" + "=" * 90)
    print("2. TOP-1 CONFIDENCE DISTRIBUTION BUCKETS")
    print("=" * 90)
    buckets = [
        ("< 0.10", 0.0, 0.10),
        ("0.10 - 0.20", 0.10, 0.20),
        ("0.20 - 0.30", 0.20, 0.30),
        ("0.30 - 0.40", 0.30, 0.40),
        ("0.40 - 0.50", 0.40, 0.50),
        ("0.50 - 0.60", 0.50, 0.60),
        ("0.60 - 0.70", 0.60, 0.70),
        ("0.70 - 0.80", 0.70, 0.80),
        ("0.80 - 0.90", 0.80, 0.90),
        ("0.90 - 1.00", 0.90, 1.001),
    ]
    print(f"{'Bucket':<14} | {'Samples':<8} | {'% of Test':<10} | {'Correct':<8} | {'Incorrect':<10} | {'Accuracy':<10}")
    print("-" * 75)
    for label, low, high in buckets:
        mask = (top1_probs >= low) & (top1_probs < high)
        n = int(np.sum(mask))
        pct = (n / total_samples) * 100
        corr = int(np.sum(is_corrects[mask]))
        inc = n - corr
        acc_str = f"{corr / n * 100:.2f}%" if n > 0 else "N/A"
        print(f"{label:<14} | {n:>8} | {pct:>9.2f}% | {corr:>8} | {inc:>10} | {acc_str:>10}")

    # 3. Candidate Abstention Thresholds
    print("\n" + "=" * 90)
    print("3. CANDIDATE ABSTENTION THRESHOLD EVALUATION (P >= Threshold)")
    print("=" * 90)
    thresholds = [0.30, 0.40, 0.50, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80, 0.85, 0.90]
    print(f"{'Threshold':<10} | {'Accepted':<9} | {'Abstained':<10} | {'Coverage %':<11} | {'Abstention %':<13} | {'Selective Acc':<14} | {'Selective Error Rate':<20}")
    print("-" * 95)
    for thresh in thresholds:
        accepted_mask = top1_probs >= thresh
        acc_n = int(np.sum(accepted_mask))
        abs_n = total_samples - acc_n
        cov_pct = (acc_n / total_samples) * 100
        abs_pct = (abs_n / total_samples) * 100
        corr_acc = int(np.sum(is_corrects[accepted_mask]))
        sel_acc = (corr_acc / acc_n * 100) if acc_n > 0 else 0.0
        sel_err = 100.0 - sel_acc if acc_n > 0 else 0.0
        print(f"{thresh:<10.2f} | {acc_n:>9} | {abs_n:>10} | {cov_pct:>10.2f}% | {abs_pct:>12.2f}% | {sel_acc:>13.2f}% | {sel_err:>19.2f}%")

    # 4. Top-1 vs. Top-2 Probability Margin Analysis
    print("\n" + "=" * 90)
    print("4. TOP-1 / TOP-2 PROBABILITY MARGIN (P_top1 - P_top2) STATISTICS & BUCKETS")
    print("=" * 90)
    print(f"Mean Margin          : {np.mean(margins):.4f} ({np.mean(margins)*100:.2f}%)")
    print(f"Median Margin        : {np.median(margins):.4f} ({np.median(margins)*100:.2f}%)")
    print(f"Std Dev Margin       : {np.std(margins):.4f}")
    print(f"Min Margin           : {np.min(margins):.4f}")
    print(f"Max Margin           : {np.max(margins):.4f}")

    print("\nMargin Distribution Buckets:")
    print(f"{'Margin Bucket':<14} | {'Samples':<8} | {'% of Test':<10} | {'Correct':<8} | {'Incorrect':<10} | {'Accuracy':<10}")
    print("-" * 75)
    for label, low, high in buckets:
        mask = (margins >= low) & (margins < high)
        n = int(np.sum(mask))
        pct = (n / total_samples) * 100
        corr = int(np.sum(is_corrects[mask]))
        inc = n - corr
        acc_str = f"{corr / n * 100:.2f}%" if n > 0 else "N/A"
        print(f"{label:<14} | {n:>8} | {pct:>9.2f}% | {corr:>8} | {inc:>10} | {acc_str:>10}")

    print("\nMargin Candidate Abstention Thresholds (Margin >= Threshold):")
    print(f"{'Margin Thresh':<14} | {'Accepted':<9} | {'Abstained':<10} | {'Coverage %':<11} | {'Abstention %':<13} | {'Selective Acc':<14} | {'Selective Error Rate':<20}")
    print("-" * 95)
    for thresh in [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80]:
        accepted_mask = margins >= thresh
        acc_n = int(np.sum(accepted_mask))
        abs_n = total_samples - acc_n
        cov_pct = (acc_n / total_samples) * 100
        abs_pct = (abs_n / total_samples) * 100
        corr_acc = int(np.sum(is_corrects[accepted_mask]))
        sel_acc = (corr_acc / acc_n * 100) if acc_n > 0 else 0.0
        sel_err = 100.0 - sel_acc if acc_n > 0 else 0.0
        print(f"{thresh:<14.2f} | {acc_n:>9} | {abs_n:>10} | {cov_pct:>10.2f}% | {abs_pct:>12.2f}% | {sel_acc:>13.2f}% | {sel_err:>19.2f}%")

    # 5. Department-Level Confidence Report
    print("\n" + "=" * 90)
    print("5. PER-DEPARTMENT CONFIDENCE & ACCURACY BREAKDOWN")
    print("=" * 90)
    print(f"{'Department':<20} | {'Support':<8} | {'Mean Conf':<10} | {'Median Conf':<12} | {'Min Conf':<9} | {'Accuracy':<10} | {'Errors':<8}")
    print("-" * 88)
    dept_records = defaultdict(list)
    for r in records:
        dept_records[r["true_dept"]].append(r)

    for dept in sorted(classes):
        d_recs = dept_records[dept]
        sup = len(d_recs)
        d_probs = np.array([r["top1_prob"] for r in d_recs])
        d_corr = sum(1 for r in d_recs if r["is_correct"])
        d_err = sup - d_corr
        d_acc = d_corr / sup * 100 if sup > 0 else 0.0
        mean_c = np.mean(d_probs) * 100 if sup > 0 else 0.0
        med_c = np.median(d_probs) * 100 if sup > 0 else 0.0
        min_c = np.min(d_probs) * 100 if sup > 0 else 0.0
        print(f"{dept:<20} | {sup:>8} | {mean_c:>9.2f}% | {med_c:>11.2f}% | {min_c:>8.2f}% | {d_acc:>9.2f}% | {d_err:>8}")

    # 6. 30 Lowest-Confidence Predictions
    print("\n" + "=" * 90)
    print("6. TOP 30 LOWEST-CONFIDENCE TEST PREDICTIONS")
    print("=" * 90)
    lowest_conf = sorted(records, key=lambda r: r["top1_prob"])[:30]
    for i, r in enumerate(lowest_conf, 1):
        status_str = "CORRECT" if r["is_correct"] else "INCORRECT"
        top3_str = ", ".join([f"{dept} ({p*100:.1f}%)" for dept, p in r["top3"]])
        print(f"\n[{i:2d}] Status: {status_str} | Top-1: {r['top1_class']} ({r['top1_prob']*100:.2f}%) | Top-2: {r['top2_class']} ({r['top2_prob']*100:.2f}%) | Margin: {r['margin']*100:.2f}%")
        print(f"     Actual Dept: {r['true_dept']} | Pred Dept: {r['pred_dept']}")
        print(f"     Narrative  : \"{r['text']}\"")
        print(f"     Top-3 Dist : [{top3_str}]")

    # 7. 30 Highest-Confidence INCORRECT Predictions
    print("\n" + "=" * 90)
    print("7. TOP 30 HIGHEST-CONFIDENCE INCORRECT PREDICTIONS (Confident Errors)")
    print("=" * 90)
    incorrect_records = [r for r in records if not r["is_correct"]]
    highest_conf_errors = sorted(incorrect_records, key=lambda r: r["top1_prob"], reverse=True)[:30]
    for i, r in enumerate(highest_conf_errors, 1):
        top3_str = ", ".join([f"{dept} ({p*100:.1f}%)" for dept, p in r["top3"]])
        print(f"\n[{i:2d}] Top-1 Conf: {r['top1_prob']*100:.2f}% | Top-2: {r['top2_class']} ({r['top2_prob']*100:.2f}%) | Margin: {r['margin']*100:.2f}%")
        print(f"     Actual Dept: {r['true_dept']} -> Predicted Dept: {r['pred_dept']}")
        print(f"     Narrative  : \"{r['text']}\"")
        print(f"     Top-3 Dist : [{top3_str}]")


if __name__ == "__main__":
    main()
