#!/usr/bin/env python3
"""
cross_validate_department_model.py

5-Fold Stratified Cross-Validation Robustness Evaluation on Training Data ONLY.
Evaluates the champion pipeline: TF-IDF Vectorizer + Class-Weighted Logistic Regression.

Strict Leakage-Free Methodology:
- Evaluates exclusively on data/processed/department_train.csv (4,989 samples).
- department_test.csv is completely excluded and remains untouched.
- A new TfidfVectorizer is fitted separately inside each fold's training split.
"""

import sys
import os
import csv
from pathlib import Path
from collections import Counter

# Ensure site-packages from local venv are accessible before importing third-party libraries
base_dir = Path(__file__).resolve().parent.parent
venv_site = base_dir / "venv" / "Lib" / "site-packages"
if venv_site.exists() and str(venv_site) not in sys.path:
    sys.path.insert(0, str(venv_site))

# Ensure UTF-8 console output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

import numpy as np
from sklearn.model_selection import StratifiedKFold
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
)

RANDOM_STATE = 42
CV_FOLDS = 5


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
    train_path = base_dir / "data" / "processed" / "department_train.csv"

    print("=" * 80)
    print("MODULE 10: 5-FOLD STRATIFIED CROSS-VALIDATION (TRAINING SET ONLY)")
    print("=" * 80)

    # 1. Load Training Data Only
    print(f"\n[1] Loading processed training data: {train_path}")
    X, y = load_processed_csv(train_path)
    X = np.array(X)
    y = np.array(y)
    total_samples = len(X)
    print(f"    Loaded {total_samples} training samples across 17 departments.")
    print("    NOTE: Held-out test set (department_test.csv) is STRICTLY EXCLUDED from CV.")

    # 2. Setup 5-Fold Stratified K-Fold
    skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)

    fold_accuracies = []
    fold_macro_precisions = []
    fold_macro_recalls = []
    fold_macro_f1s = []
    fold_weighted_f1s = []

    print("\n" + "=" * 80)
    print(f"EXECUTING {CV_FOLDS}-FOLD CROSS-VALIDATION (ISOLATED PER-FOLD VECTORIZATION)")
    print("=" * 80)

    for fold_idx, (train_idx, val_idx) in enumerate(skf.split(X, y), 1):
        X_train_fold, X_val_fold = X[train_idx], X[val_idx]
        y_train_fold, y_val_fold = y[train_idx], y[val_idx]

        # Fit TF-IDF ONLY on this fold's training partition
        vectorizer = TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            sublinear_tf=True,
            stop_words="english",
        )
        X_train_tfidf = vectorizer.fit_transform(X_train_fold)
        X_val_tfidf = vectorizer.transform(X_val_fold)
        num_features = len(vectorizer.vocabulary_)

        # Train Class-Weighted Logistic Regression
        classifier = LogisticRegression(
            solver="liblinear",
            random_state=RANDOM_STATE,
            max_iter=1000,
            C=1.0,
            class_weight="balanced",
        )
        classifier.fit(X_train_tfidf, y_train_fold)

        # Evaluate on validation partition
        y_val_pred = classifier.predict(X_val_tfidf)

        acc = accuracy_score(y_val_fold, y_val_pred)
        macro_p = precision_score(y_val_fold, y_val_pred, average="macro", zero_division=0)
        macro_r = recall_score(y_val_fold, y_val_pred, average="macro", zero_division=0)
        macro_f1 = f1_score(y_val_fold, y_val_pred, average="macro", zero_division=0)
        weighted_f1 = f1_score(y_val_fold, y_val_pred, average="weighted", zero_division=0)

        fold_accuracies.append(acc)
        fold_macro_precisions.append(macro_p)
        fold_macro_recalls.append(macro_r)
        fold_macro_f1s.append(macro_f1)
        fold_weighted_f1s.append(weighted_f1)

        print(f"Fold {fold_idx}: Train={len(train_idx)}, Val={len(val_idx)}, Features={num_features:<5} | "
              f"Acc={acc*100:6.2f}% | Macro-P={macro_p*100:6.2f}% | Macro-R={macro_r*100:6.2f}% | "
              f"Macro-F1={macro_f1*100:6.2f}% | Weighted-F1={weighted_f1*100:6.2f}%")

    # 3. Cross-Validation Aggregate Statistics
    mean_acc, std_acc = np.mean(fold_accuracies) * 100, np.std(fold_accuracies) * 100
    mean_macro_p, std_macro_p = np.mean(fold_macro_precisions) * 100, np.std(fold_macro_precisions) * 100
    mean_macro_r, std_macro_r = np.mean(fold_macro_recalls) * 100, np.std(fold_macro_recalls) * 100
    mean_macro_f1, std_macro_f1 = np.mean(fold_macro_f1s) * 100, np.std(fold_macro_f1s) * 100
    mean_weighted_f1, std_weighted_f1 = np.mean(fold_weighted_f1s) * 100, np.std(fold_weighted_f1s) * 100

    min_macro_f1 = np.min(fold_macro_f1s) * 100
    max_macro_f1 = np.max(fold_macro_f1s) * 100

    print("\n" + "=" * 80)
    print("5-FOLD CROSS-VALIDATION SUMMARY RESULTS (TRAINING DATA ONLY)")
    print("=" * 80)
    print(f"{'Metric':<25} | {'Mean ± Std Dev':<22} | {'Min Fold':<10} | {'Max Fold':<10}")
    print("-" * 75)
    print(f"{'Accuracy':<25} | {mean_acc:6.2f}% ± {std_acc:4.2f}%       | {np.min(fold_accuracies)*100:6.2f}%   | {np.max(fold_accuracies)*100:6.2f}%")
    print(f"{'Macro Precision':<25} | {mean_macro_p:6.2f}% ± {std_macro_p:4.2f}%       | {np.min(fold_macro_precisions)*100:6.2f}%   | {np.max(fold_macro_precisions)*100:6.2f}%")
    print(f"{'Macro Recall':<25} | {mean_macro_r:6.2f}% ± {std_macro_r:4.2f}%       | {np.min(fold_macro_recalls)*100:6.2f}%   | {np.max(fold_macro_recalls)*100:6.2f}%")
    print(f"{'Macro F1-Score':<25} | {mean_macro_f1:6.2f}% ± {std_macro_f1:4.2f}%       | {min_macro_f1:6.2f}%   | {max_macro_f1:6.2f}%")
    print(f"{'Weighted F1-Score':<25} | {mean_weighted_f1:6.2f}% ± {std_weighted_f1:4.2f}%       | {np.min(fold_weighted_f1s)*100:6.2f}%   | {np.max(fold_weighted_f1s)*100:6.2f}%")
    print("=" * 80)

    # 4. Comparison against Held-Out Test Set
    heldout_test_macro_f1 = 87.78
    heldout_test_acc = 92.14
    heldout_test_weighted_f1 = 92.07

    print("\n" + "=" * 80)
    print("VALIDATION CONSISTENCY: CROSS-VALIDATION VS HELD-OUT TEST SET")
    print("=" * 80)
    print(f"5-Fold CV Mean Macro F1        : {mean_macro_f1:.2f}% (Range: {min_macro_f1:.2f}% - {max_macro_f1:.2f}%)")
    print(f"Held-out Test Set Macro F1     : {heldout_test_macro_f1:.2f}%")
    print(f"Discrepancy (Held-out - CV)    : {heldout_test_macro_f1 - mean_macro_f1:+.2f}% points")
    print("-" * 80)
    print(f"5-Fold CV Mean Accuracy        : {mean_acc:.2f}% ± {std_acc:.2f}%")
    print(f"Held-out Test Set Accuracy     : {heldout_test_acc:.2f}%")
    print(f"Discrepancy (Held-out - CV)    : {heldout_test_acc - mean_acc:+.2f}% points")
    print("=" * 80)


if __name__ == "__main__":
    main()
