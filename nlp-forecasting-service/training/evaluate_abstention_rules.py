#!/usr/bin/env python3
"""
evaluate_abstention_rules.py

Evaluates candidate multi-criteria abstention rules for Module 10 Department Classifier.
Compares single-threshold vs. dual-criterion (Top-1 Probability + Margin) strategies
on the 2,019 held-out candidate test examples.
"""

import sys
import os
import csv
import json
import joblib
from pathlib import Path
from collections import Counter

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
    print("MODULE 10: ABSTENTION RULES EVALUATION & COMPARATIVE BENCHMARK")
    print("=" * 90)

    model_path = base_dir / "models" / "department_classifier.joblib"
    test_path = base_dir / "data" / "processed" / "department_test_candidate.csv"

    # 1. Load Model and Test Data
    pipeline = joblib.load(model_path)
    X_test, y_test = load_csv(test_path)
    total_samples = len(X_test)
    classes = list(pipeline.classes_)

    # 2. Run Inference
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
    total_baseline_correct = int(np.sum(is_corrects))
    total_baseline_errors = total_samples - total_baseline_correct

    print(f"Total Test Samples   : {total_samples}")
    print(f"Baseline Correct     : {total_baseline_correct} ({total_baseline_correct/total_samples*100:.2f}%)")
    print(f"Baseline Errors      : {total_baseline_errors} ({total_baseline_errors/total_samples*100:.2f}%)")

    # 3. Define the 5 Rules
    rules = [
        ("RULE A", "top1 >= 0.30", lambda p, m: p >= 0.30),
        ("RULE B", "top1 >= 0.40", lambda p, m: p >= 0.40),
        ("RULE C", "top1 >= 0.30 AND margin >= 0.10", lambda p, m: (p >= 0.30) & (m >= 0.10)),
        ("RULE D", "top1 >= 0.40 AND margin >= 0.10", lambda p, m: (p >= 0.40) & (m >= 0.10)),
        ("RULE E", "top1 >= 0.35 AND margin >= 0.10", lambda p, m: (p >= 0.35) & (m >= 0.10)),
    ]

    rule_results = []

    print("\n" + "=" * 90)
    print("DETAILED METRICS PER ABSTENTION RULE")
    print("=" * 90)

    for rule_id, rule_desc, rule_fn in rules:
        accepted_mask = rule_fn(top1_probs, margins)
        accepted_n = int(np.sum(accepted_mask))
        abstained_n = total_samples - accepted_n

        coverage_pct = (accepted_n / total_samples) * 100
        abstention_pct = (abstained_n / total_samples) * 100

        correct_accepted = int(np.sum(is_corrects[accepted_mask]))
        incorrect_accepted = accepted_n - correct_accepted

        selective_acc = (correct_accepted / accepted_n * 100) if accepted_n > 0 else 0.0
        selective_err = 100.0 - selective_acc if accepted_n > 0 else 0.0

        errors_removed = total_baseline_errors - incorrect_accepted
        pct_errors_removed = (errors_removed / total_baseline_errors) * 100

        res_dict = {
            "rule_id": rule_id,
            "rule_desc": rule_desc,
            "accepted": accepted_n,
            "abstained": abstained_n,
            "coverage_pct": coverage_pct,
            "abstention_pct": abstention_pct,
            "correct_accepted": correct_accepted,
            "incorrect_accepted": incorrect_accepted,
            "selective_acc": selective_acc,
            "selective_err": selective_err,
            "errors_removed": errors_removed,
            "pct_errors_removed": pct_errors_removed,
            "accepted_mask": accepted_mask,
        }
        rule_results.append(res_dict)

        print(f"\n--- {rule_id}: {rule_desc} ---")
        print(f"  1. Total Test Samples        : {total_samples}")
        print(f"  2. Accepted Samples          : {accepted_n}")
        print(f"  3. Abstained Samples         : {abstained_n}")
        print(f"  4. Coverage %                : {coverage_pct:.2f}%")
        print(f"  5. Abstention %              : {abstention_pct:.2f}%")
        print(f"  6. Correct Accepted Preds    : {correct_accepted}")
        print(f"  7. Incorrect Accepted Preds  : {incorrect_accepted}")
        print(f"  8. Selective Accuracy        : {selective_acc:.2f}%")
        print(f"  9. Selective Error Rate      : {selective_err:.2f}%")
        print(f"  10. % Original Errors Removed: {pct_errors_removed:.2f}% ({errors_removed} / {total_baseline_errors})")
        print(f"  11. Remaining Accepted Errors: {incorrect_accepted}")

    # 4. Comparison Table
    print("\n" + "=" * 90)
    print("COMPARISON BENCHMARK TABLE")
    print("=" * 90)
    print(f"{'Rule':<8} | {'Criterion':<32} | {'Coverage':<10} | {'Abstention':<12} | {'Selective Acc':<14} | {'Selective Err':<14} | {'Errors Removed':<16}")
    print("-" * 115)
    for r in rule_results:
        print(
            f"{r['rule_id']:<8} | {r['rule_desc']:<32} | {r['coverage_pct']:>9.2f}% | {r['abstention_pct']:>11.2f}% | "
            f"{r['selective_acc']:>13.2f}% | {r['selective_err']:>13.2f}% | {r['errors_removed']:>3} ({r['pct_errors_removed']:.1f}%)"
        )

    # 5. Low Top-1 & Low Margin Intersection
    print("\n" + "=" * 90)
    print("INTERSECTION ANALYSIS: (top1 < 0.40 AND margin < 0.10)")
    print("=" * 90)
    inter_mask = (top1_probs < 0.40) & (margins < 0.10)
    inter_n = int(np.sum(inter_mask))
    inter_corr = int(np.sum(is_corrects[inter_mask]))
    inter_inc = inter_n - inter_corr
    inter_acc = (inter_corr / inter_n * 100) if inter_n > 0 else 0.0

    print(f"Samples satisfying (top1 < 0.40 AND margin < 0.10): {inter_n} ({inter_n/total_samples*100:.2f}% of test set)")
    print(f"  - Correct Predictions   : {inter_corr}")
    print(f"  - Incorrect Predictions : {inter_inc}")
    print(f"  - Empirical Accuracy    : {inter_acc:.2f}% (Error Rate: {100.0 - inter_acc:.2f}%)")

    # 6. Top 30 Cases Abstained by Rule D
    print("\n" + "=" * 90)
    print("TOP 30 SAMPLES ABSTAINED BY RULE D (top1 < 0.40 OR margin < 0.10)")
    print("=" * 90)
    rule_d_res = next(r for r in rule_results if r["rule_id"] == "RULE D")
    abstained_d_indices = np.where(~rule_d_res["accepted_mask"])[0]
    abstained_d_records = [records[i] for i in abstained_d_indices]

    # Sort by lowest margin first
    abstained_d_sorted = sorted(abstained_d_records, key=lambda r: r["margin"])[:30]

    for i, r in enumerate(abstained_d_sorted, 1):
        status_str = "CORRECT" if r["is_correct"] else "INCORRECT"
        top3_str = ", ".join([f"{dept} ({p*100:.1f}%)" for dept, p in r["top3"]])
        print(f"\n[{i:2d}] Status: {status_str} | Top-1: {r['top1_class']} ({r['top1_prob']*100:.2f}%) | Top-2: {r['top2_class']} ({r['top2_prob']*100:.2f}%) | Margin: {r['margin']*100:.2f}%")
        print(f"     Actual: {r['true_dept']} | Pred: {r['pred_dept']}")
        print(f"     Text  : \"{r['text']}\"")
        print(f"     Top-3 : [{top3_str}]")

    # 7. Top 30 High-Confidence Errors NOT Caught by Any Rule (Rule D accepted errors)
    print("\n" + "=" * 90)
    print("TOP 30 HIGH-CONFIDENCE ERRORS THAT ESCAPE ALL RULES (top1 >= 0.40 AND margin >= 0.10 AND incorrect)")
    print("=" * 90)
    uncaught_mask = (top1_probs >= 0.40) & (margins >= 0.10) & (~is_corrects)
    uncaught_indices = np.where(uncaught_mask)[0]
    uncaught_records = [records[i] for i in uncaught_indices]
    uncaught_sorted = sorted(uncaught_records, key=lambda r: r["top1_prob"], reverse=True)[:30]

    print(f"Total High-Confidence Errors Escaping Rule D: {len(uncaught_records)} errors")
    for i, r in enumerate(uncaught_sorted, 1):
        top3_str = ", ".join([f"{dept} ({p*100:.1f}%)" for dept, p in r["top3"]])
        print(f"\n[{i:2d}] Top-1 Conf: {r['top1_prob']*100:.2f}% | Top-2: {r['top2_class']} ({r['top2_prob']*100:.2f}%) | Margin: {r['margin']*100:.2f}%")
        print(f"     Actual: {r['true_dept']} -> Predicted: {r['pred_dept']}")
        print(f"     Text  : \"{r['text']}\"")
        print(f"     Top-3 : [{top3_str}]")


if __name__ == "__main__":
    main()
