#!/usr/bin/env python3
"""
train_department_baseline.py

Production-Scale Baseline Training & Evaluation for Module 10: Medical Department Classification.
Uses TF-IDF Vectorization and Multinomial Logistic Regression.

Evaluation is performed strictly on the held-out test set (data/processed/department_test.csv).
No re-splitting, no cross-validation, no hyperparameter tuning, and no model persistence.
"""

import sys
import os
import csv
from pathlib import Path
from collections import Counter

# Ensure site-packages from local venv are accessible if invoked via standard python
base_dir = Path(__file__).resolve().parent.parent
venv_site = base_dir / "venv" / "Lib" / "site-packages"
if venv_site.exists() and str(venv_site) not in sys.path:
    sys.path.insert(0, str(venv_site))

# Ensure UTF-8 console output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

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
import numpy as np

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


def main():
    data_dir = base_dir / "data" / "processed"
    train_path = data_dir / "department_train.csv"
    test_path = data_dir / "department_test.csv"

    print("=" * 80)
    print("MODULE 10: PRODUCTION-SCALE BASELINE EVALUATION (17 DEPARTMENTS)")
    print("=" * 80)

    # 1. Load Processed Data
    print(f"\n[1] Loading processed training data: {train_path}")
    X_train, y_train = load_processed_csv(train_path)
    print(f"    Loaded {len(X_train)} training samples.")

    print(f"\n[2] Loading processed held-out test data: {test_path}")
    X_test, y_test = load_processed_csv(test_path)
    print(f"    Loaded {len(X_test)} test samples.")

    # Department vocabulary
    all_departments = sorted(list(set(y_train) | set(y_test)))
    print(f"\nTarget platform departments ({len(all_departments)}):")
    print(", ".join(all_departments))

    # 2. Fit TF-IDF ONLY on training data
    print("\n[3] Fitting TfidfVectorizer on training set ONLY (preventing data leakage)...")
    vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1, 2),
        sublinear_tf=True,
        stop_words="english",
    )
    X_train_tfidf = vectorizer.fit_transform(X_train)
    num_features = len(vectorizer.vocabulary_)
    print(f"    Extracted TF-IDF features: {num_features}")

    # 3. Transform test data using fitted vectorizer
    print("\n[4] Transforming held-out test set using fitted vectorizer...")
    X_test_tfidf = vectorizer.transform(X_test)
    print(f"    Test TF-IDF matrix shape: {X_test_tfidf.shape}")

    # 4. Train Logistic Regression Classifier
    print("\n[5] Training LogisticRegression classifier (solver='liblinear', max_iter=1000, random_state=42)...")
    classifier = LogisticRegression(
        solver="liblinear",
        random_state=RANDOM_STATE,
        max_iter=1000,
        C=1.0,
    )
    classifier.fit(X_train_tfidf, y_train)
    print("    Model fitting completed.")

    # 5. Evaluate on Held-out Test Set
    print("\n[6] Evaluating model on untouched held-out test set...")
    y_pred = classifier.predict(X_test_tfidf)

    acc = accuracy_score(y_test, y_pred)
    macro_p = precision_score(y_test, y_pred, average="macro", zero_division=0)
    macro_r = recall_score(y_test, y_pred, average="macro", zero_division=0)
    macro_f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)

    weighted_p = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    weighted_r = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    weighted_f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    # 6. Majority-Class Baseline
    test_counts = Counter(y_test)
    majority_dept, majority_count = test_counts.most_common(1)[0]
    majority_baseline_acc = majority_count / len(y_test)
    improvement_pct = (acc - majority_baseline_acc) * 100
    relative_improvement = ((acc - majority_baseline_acc) / majority_baseline_acc) * 100

    print("\n" + "=" * 80)
    print("OVERALL PERFORMANCE SUMMARY")
    print("=" * 80)
    print(f"Training Samples               : {len(X_train)}")
    print(f"Test Samples (Held-out)        : {len(X_test)}")
    print(f"TF-IDF Feature Dimension       : {num_features}")
    print("-" * 80)
    print(f"Accuracy                       : {acc * 100:.2f}%")
    print(f"Macro Precision                : {macro_p * 100:.2f}%")
    print(f"Macro Recall                   : {macro_r * 100:.2f}%")
    print(f"Macro F1-Score                 : {macro_f1 * 100:.2f}%")
    print("-" * 80)
    print(f"Weighted Precision             : {weighted_p * 100:.2f}%")
    print(f"Weighted Recall                : {weighted_r * 100:.2f}%")
    print(f"Weighted F1-Score              : {weighted_f1 * 100:.2f}%")
    print("-" * 80)
    print(f"Majority-Class Baseline ({majority_dept}): {majority_baseline_acc * 100:.2f}% ({majority_count}/{len(y_test)})")
    print(f"Absolute Improvement over Baseline : +{improvement_pct:.2f}% points")
    print(f"Relative Improvement over Baseline : +{relative_improvement:.2f}%")
    print("=" * 80)

    # 7. Complete Classification Report for all 17 Departments
    print("\n" + "=" * 80)
    print("PER-DEPARTMENT CLASSIFICATION REPORT")
    print("=" * 80)
    report_dict = classification_report(
        y_test, y_pred, labels=all_departments, output_dict=True, zero_division=0
    )
    print(f"{'Department':<20} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10} | {'Support':<8}")
    print("-" * 68)
    for dept in all_departments:
        d_res = report_dict[dept]
        print(f"{dept:<20} | {d_res['precision']*100:>8.2f}% | {d_res['recall']*100:>8.2f}% | {d_res['f1-score']*100:>8.2f}% | {int(d_res['support']):>8}")

    # 8. Rare Classes Spotlight
    rare_classes = [
        "Pediatrics",
        "Gynecology",
        "Hematology",
        "Dentistry",
        "Urology",
        "Endocrinology",
        "Hepatology",
    ]
    print("\n" + "=" * 80)
    print("RARE CLASSES SPOTLIGHT PERFORMANCE")
    print("=" * 80)
    print(f"{'Department':<20} | {'Train N':<8} | {'Test N':<8} | {'Precision':<10} | {'Recall':<10} | {'F1-Score':<10}")
    print("-" * 74)
    train_counts = Counter(y_train)
    for r_dept in rare_classes:
        d_res = report_dict[r_dept]
        tr_n = train_counts.get(r_dept, 0)
        te_n = int(d_res['support'])
        print(f"{r_dept:<20} | {tr_n:>8} | {te_n:>8} | {d_res['precision']*100:>8.2f}% | {d_res['recall']*100:>8.2f}% | {d_res['f1-score']*100:>8.2f}%")

    # 9. Confusion Matrix
    print("\n" + "=" * 80)
    print("CONFUSION MATRIX (Rows: True Department, Columns: Predicted Department)")
    print("=" * 80)
    cm = confusion_matrix(y_test, y_pred, labels=all_departments)
    
    # Abbreviate department headers for clean table alignment
    abbrevs = [d[:4] for d in all_departments]
    header = f"{'True \\ Pred':<16} " + " ".join([f"{a:>4}" for a in abbrevs])
    print(header)
    print("-" * len(header))
    for idx, row in enumerate(cm):
        row_str = f"{all_departments[idx]:<16} " + " ".join([f"{val:>4}" for val in row])
        print(row_str)
    print("=" * 80)
    print("\nKey for Column Abbreviations:")
    for d, a in zip(all_departments, abbrevs):
        print(f"  {a} = {d}")


if __name__ == "__main__":
    main()
