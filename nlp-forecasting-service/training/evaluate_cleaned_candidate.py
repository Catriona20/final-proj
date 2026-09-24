#!/usr/bin/env python3
"""
evaluate_cleaned_candidate.py

Evaluates the impact of the ontology and data-cleaning candidate dataset against
the original baseline model on the exact same 2,019 retained held-out test rows.

Experiment A: Cleaned Candidate Model
  - Train: data/processed/department_train_candidate.csv (4,785 rows)
  - Test:  data/processed/department_test_candidate.csv  (2,019 rows)

Experiment B: Fair Baseline Comparison
  - Train: data/processed/department_train.csv (4,989 rows)
  - Test:  data/processed/department_test_candidate.csv  (2,019 rows)

Model Configuration (Locked Champion):
  - TF-IDF Vectorizer (ngram_range=(1,2), sublinear_tf=True, stop_words="english")
  - Logistic Regression (solver="liblinear", C=1.0, class_weight="balanced", random_state=42)
"""

import sys
import os
import csv
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
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)

RANDOM_STATE = 42


def load_processed_csv(filepath: Path):
    """Load symptom_text and department from processed CSV."""
    if not filepath.exists():
        raise FileNotFoundError(f"File not found: {filepath}")
    texts, labels = [], []
    with open(filepath, "r", encoding="utf-8") as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if len(row) >= 2:
                texts.append(row[0])
                labels.append(row[1])
    return texts, labels


def train_and_eval(X_train, y_train, X_test, y_test, all_departments):
    """Fit TF-IDF + class-weighted LogisticRegression on train and evaluate on test."""
    vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1, 2),
        sublinear_tf=True,
        stop_words="english",
    )
    X_train_tfidf = vectorizer.fit_transform(X_train)
    X_test_tfidf = vectorizer.transform(X_test)

    classifier = LogisticRegression(
        solver="liblinear",
        random_state=RANDOM_STATE,
        max_iter=1000,
        C=1.0,
        class_weight="balanced",
    )
    classifier.fit(X_train_tfidf, y_train)
    y_pred = classifier.predict(X_test_tfidf)
    y_prob = classifier.predict_proba(X_test_tfidf)

    acc = accuracy_score(y_test, y_pred)
    macro_p = precision_score(y_test, y_pred, average="macro", zero_division=0)
    macro_r = recall_score(y_test, y_pred, average="macro", zero_division=0)
    macro_f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)

    weighted_p = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    weighted_r = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    weighted_f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    rep = classification_report(
        y_test,
        y_pred,
        labels=all_departments,
        output_dict=True,
        zero_division=0,
    )
    cm = confusion_matrix(y_test, y_pred, labels=all_departments)

    return {
        "accuracy": acc,
        "macro_precision": macro_p,
        "macro_recall": macro_r,
        "macro_f1": macro_f1,
        "weighted_precision": weighted_p,
        "weighted_recall": weighted_r,
        "weighted_f1": weighted_f1,
        "y_pred": y_pred,
        "y_prob": y_prob,
        "report": rep,
        "confusion_matrix": cm,
        "classes": list(classifier.classes_),
        "num_features": len(vectorizer.vocabulary_),
    }


def main():
    processed_dir = base_dir / "data" / "processed"
    orig_train_path = processed_dir / "department_train.csv"
    orig_test_path = processed_dir / "department_test.csv"
    cand_train_path = processed_dir / "department_train_candidate.csv"
    cand_test_path = processed_dir / "department_test_candidate.csv"

    print("=" * 90)
    print("MODULE 10: ONTOLOGY CANDIDATE EVALUATION & COMPARATIVE BENCHMARK")
    print("=" * 90)

    # 1. Load Datasets
    print("\n[1] Loading Datasets...")
    X_orig_tr, y_orig_tr = load_processed_csv(orig_train_path)
    X_orig_te, y_orig_te = load_processed_csv(orig_test_path)
    X_cand_tr, y_cand_tr = load_processed_csv(cand_train_path)
    X_cand_te, y_cand_te = load_processed_csv(cand_test_path)

    print(f"    - Original Training Data  : {len(X_orig_tr)} rows ({orig_train_path.name})")
    print(f"    - Original Test Data      : {len(X_orig_te)} rows ({orig_test_path.name})")
    print(f"    - Candidate Training Data : {len(X_cand_tr)} rows ({cand_train_path.name})")
    print(f"    - Candidate Test Data     : {len(X_cand_te)} rows ({cand_test_path.name})")

    all_departments = sorted(list(set(y_orig_tr) | set(y_orig_te) | set(y_cand_tr) | set(y_cand_te)))
    print(f"    - Departments Evaluated   : {len(all_departments)} departments")

    # 2. Experiment A: Cleaned Candidate Model
    print("\n" + "=" * 90)
    print("EXPERIMENT A: CLEANED CANDIDATE MODEL (Train=4,785, Test=2,019)")
    print("=" * 90)
    cand_results = train_and_eval(X_cand_tr, y_cand_tr, X_cand_te, y_cand_te, all_departments)

    print(f"Features Extracted   : {cand_results['num_features']}")
    print(f"Accuracy             : {cand_results['accuracy']*100:.2f}%")
    print(f"Macro Precision      : {cand_results['macro_precision']*100:.2f}%")
    print(f"Macro Recall         : {cand_results['macro_recall']*100:.2f}%")
    print(f"Macro F1-Score       : {cand_results['macro_f1']*100:.2f}%")
    print(f"Weighted Precision   : {cand_results['weighted_precision']*100:.2f}%")
    print(f"Weighted Recall      : {cand_results['weighted_recall']*100:.2f}%")
    print(f"Weighted F1-Score    : {cand_results['weighted_f1']*100:.2f}%")

    # 3. Experiment B: Fair Baseline Comparison (Original Model on same 2,019 test rows)
    print("\n" + "=" * 90)
    print("EXPERIMENT B: ORIGINAL MODEL EVALUATED ON SAME 2,019 RETAINED TEST ROWS")
    print("=" * 90)
    orig_on_retained = train_and_eval(X_orig_tr, y_orig_tr, X_cand_te, y_cand_te, all_departments)

    print(f"Features Extracted   : {orig_on_retained['num_features']}")
    print(f"Accuracy             : {orig_on_retained['accuracy']*100:.2f}%")
    print(f"Macro Precision      : {orig_on_retained['macro_precision']*100:.2f}%")
    print(f"Macro Recall         : {orig_on_retained['macro_recall']*100:.2f}%")
    print(f"Macro F1-Score       : {orig_on_retained['macro_f1']*100:.2f}%")
    print(f"Weighted Precision   : {orig_on_retained['weighted_precision']*100:.2f}%")
    print(f"Weighted Recall      : {orig_on_retained['weighted_recall']*100:.2f}%")
    print(f"Weighted F1-Score    : {orig_on_retained['weighted_f1']*100:.2f}%")

    # 4. Comparative Summary Table
    print("\n" + "=" * 90)
    print("COMPARATIVE BENCHMARK: ORIGINAL VS. CLEANED CANDIDATE ON SAME 2,019 HELD-OUT ROWS")
    print("=" * 90)
    metrics = [
        ("Accuracy", orig_on_retained["accuracy"], cand_results["accuracy"]),
        ("Macro Precision", orig_on_retained["macro_precision"], cand_results["macro_precision"]),
        ("Macro Recall", orig_on_retained["macro_recall"], cand_results["macro_recall"]),
        ("Macro F1", orig_on_retained["macro_f1"], cand_results["macro_f1"]),
        ("Weighted Precision", orig_on_retained["weighted_precision"], cand_results["weighted_precision"]),
        ("Weighted Recall", orig_on_retained["weighted_recall"], cand_results["weighted_recall"]),
        ("Weighted F1", orig_on_retained["weighted_f1"], cand_results["weighted_f1"]),
    ]
    print(f"{'Metric':<22} | {'Original Model (2,019 rows)':<28} | {'Cleaned Candidate Model':<24} | {'Difference':<12}")
    print("-" * 90)
    for name, orig_val, cand_val in metrics:
        diff = (cand_val - orig_val) * 100
        sign = "+" if diff > 0 else ""
        print(f"{name:<22} | {orig_val*100:>26.2f}% | {cand_val*100:>22.2f}% | {sign}{diff:>10.2f}%")

    # 5. Department-Level F1 Comparison Table
    print("\n" + "=" * 90)
    print("PER-DEPARTMENT F1-SCORE & RECALL COMPARISON")
    print("=" * 90)
    print(f"{'Department':<20} | {'Test N':<8} | {'Orig F1':<10} | {'Cand F1':<10} | {'Delta F1':<10} | {'Orig Recall':<12} | {'Cand Recall':<12} | {'Delta Rec':<10}")
    print("-" * 90)
    cand_test_counts = Counter(y_cand_te)
    for dept in all_departments:
        n = cand_test_counts[dept]
        o_f1 = orig_on_retained["report"][dept]["f1-score"] * 100
        c_f1 = cand_results["report"][dept]["f1-score"] * 100
        d_f1 = c_f1 - o_f1
        sign_f1 = "+" if d_f1 > 0 else ""

        o_rec = orig_on_retained["report"][dept]["recall"] * 100
        c_rec = cand_results["report"][dept]["recall"] * 100
        d_rec = c_rec - o_rec
        sign_rec = "+" if d_rec > 0 else ""

        print(f"{dept:<20} | {n:>8} | {o_f1:>9.2f}% | {c_f1:>9.2f}% | {sign_f1}{d_f1:>8.2f}% | {o_rec:>11.2f}% | {c_rec:>11.2f}% | {sign_rec}{d_rec:>8.2f}%")

    # 6. Complete Classification Report for Cleaned Candidate Model
    print("\n" + "=" * 90)
    print("DETAILED CLASSIFICATION REPORT: CLEANED CANDIDATE MODEL")
    print("=" * 90)
    print(f"{'Department':<20} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}")
    print("-" * 65)
    for dept in all_departments:
        p = cand_results["report"][dept]["precision"] * 100
        r = cand_results["report"][dept]["recall"] * 100
        f1 = cand_results["report"][dept]["f1-score"] * 100
        sup = cand_results["report"][dept]["support"]
        print(f"{dept:<20} | {p:>9.2f}% | {r:>9.2f}% | {f1:>9.2f}% | {sup:>8}")

    # 7. Key Department Confusion Matrix Analysis
    print("\n" + "=" * 90)
    print("ERROR & CROSS-SPECIALTY CONFUSION AUDIT (CANDIDATE MODEL)")
    print("=" * 90)
    cand_errors = []
    for idx, (txt, actual, pred) in enumerate(zip(X_cand_te, y_cand_te, cand_results["y_pred"])):
        if actual != pred:
            cand_errors.append((actual, pred, txt))

    print(f"Total Errors in Candidate Model: {len(cand_errors)} / {len(X_cand_te)} (Error Rate: {len(cand_errors)/len(X_cand_te)*100:.2f}%)")
    err_pairs = Counter([(a, p) for a, p, _ in cand_errors])
    print("\nTop 10 Error Pairs (Actual -> Predicted):")
    for (a, p), count in err_pairs.most_common(10):
        print(f"  {a:<20} -> {p:<20} : {count} errors")


if __name__ == "__main__":
    main()
