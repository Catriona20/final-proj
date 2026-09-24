"""
Module 10: NLP Symptom & Department Recommendation - Baseline ML Training Pipeline
===================================================================================

This script implements the initial supervised baseline for medical department classification.

Core Architectural Principles:
------------------------------
1. Dataset Splitting (Generalization):
   We split the dataset into an 80% training set and a 20% test set using stratified sampling.
   Stratification guarantees that all six medical departments are proportionally represented
   in both training and evaluation subsets, avoiding class imbalance artifacts during validation.
   The held-out test set simulates real-world unseen patient symptom narratives to measure
   how well the model generalizes rather than memorizing training samples.

2. TF-IDF Representation & Data Leakage Prevention:
   Term Frequency-Inverse Document Frequency (TF-IDF) converts raw text into numerical feature vectors
   by weighting words based on their frequency in an individual narrative relative to their document
   frequency across the corpus.
   CRITICAL: The TfidfVectorizer is fitted ONLY on the training split (X_train).
   Fitting vectorizers or scalers on the entire dataset before splitting leaks test set vocabulary,
   document frequencies, and token distributions into the model, artificially inflating test scores.

3. Logistic Regression Classifier:
   Logistic Regression with a multinomial/cross-entropy formulation models the log-odds of a symptom
   narrative belonging to each medical department class as a linear combination of its TF-IDF features.
   It provides calibrated probability distributions across departments, serving as an interpretable,
   highly efficient, and solid baseline for clinical text classification.

4. Evaluation Metrics:
   - Accuracy: Overall proportion of correct department predictions.
   - Precision: Out of all predictions made for Department X, how many were actually Department X
     (measures false positive rate / avoiding misrouting patients to incorrect departments).
   - Recall (Sensitivity): Out of all true Department X cases, how many did the model correctly identify
     (measures false negative rate / avoiding missed specialist assignments).
   - F1-Score: Harmonic mean of precision and recall, balancing precision and sensitivity.
   - Confusion Matrix: Grid detailing exact cross-department misclassifications.
"""

import os
import csv
from collections import Counter
from typing import List, Tuple, Dict, Any

from sklearn.model_selection import train_test_split, StratifiedKFold, cross_validate
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
    confusion_matrix,
)

# Fixed random seed for complete experimental reproducibility
RANDOM_STATE = 42
TEST_SPLIT_SIZE = 0.20
CV_FOLDS = 5


def load_and_validate_dataset(csv_path: str) -> Tuple[List[str], List[str]]:
    """
    Loads and validates the symptom-to-department dataset from a CSV file.
    Validates column headers, checks for null values, and detects duplicates.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Dataset not found at path: {csv_path}")

    X_raw: List[str] = []
    y_raw: List[str] = []
    missing_count = 0

    with open(csv_path, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        
        # 1. Validate required fields
        expected_fields = {"symptom_text", "department"}
        if not expected_fields.issubset(set(reader.fieldnames or [])):
            raise ValueError(f"CSV header mismatch. Expected {expected_fields}, got {reader.fieldnames}")

        for row_idx, row in enumerate(reader, start=1):
            text = (row.get("symptom_text") or "").strip()
            dept = (row.get("department") or "").strip()

            if not text or not dept:
                missing_count += 1
                continue

            X_raw.append(text)
            y_raw.append(dept)

    # 2. Dataset summary statistics
    total_samples = len(X_raw)
    dept_distribution = Counter(y_raw)
    duplicate_texts = [text for text, count in Counter(X_raw).items() if count > 1]

    print("=" * 70)
    print("DATASET VALIDATION & SUMMARY")
    print("=" * 70)
    print(f"Dataset path:                {csv_path}")
    print(f"Total valid samples:         {total_samples}")
    print(f"Missing / corrupted values:  {missing_count}")
    print(f"Duplicate symptom texts:     {len(duplicate_texts)}")
    print("\nSamples per medical department:")
    for dept, count in sorted(dept_distribution.items()):
        print(f"  - {dept:<20}: {count} samples")
    print("=" * 70)

    return X_raw, y_raw


def run_training_pipeline():
    """
    Executes the train/test split, TF-IDF vectorization, Logistic Regression fitting,
    and comprehensive multiclass performance evaluation.
    """
    # 1. Locate dataset
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    dataset_path = os.path.join(base_dir, "data", "symptom_department_dataset.csv")

    X, y = load_and_validate_dataset(dataset_path)

    # 2. Stratified Train / Test Split
    # We split data BEFORE any feature transformation to ensure no test data leaks into the vectorizer.
    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=TEST_SPLIT_SIZE,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    print("\n" + "=" * 70)
    print("TRAIN / TEST SPLIT (80/20 Stratified)")
    print("=" * 70)
    print(f"Training set size:  {len(X_train)} samples ({len(X_train)/len(X)*100:.1f}%)")
    print(f"Test set size:      {len(X_test)} samples ({len(X_test)/len(X)*100:.1f}%)")
    print("\nClass distribution in Test Set (Stratification check):")
    for dept, count in sorted(Counter(y_test).items()):
        print(f"  - {dept:<20}: {count} samples")
    print("=" * 70)

    # 3. Text Feature Extraction (TF-IDF)
    # TfidfVectorizer converts text tokens to weighted numerical features.
    # ngram_range=(1, 2) captures both single keywords ("rash", "headache") and word pairs ("chest pain", "shortness breath").
    # Sublinear TF dampens term frequency scaling (1 + log(tf)).
    vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1, 2),
        sublinear_tf=True,
        stop_words="english",
    )

    # Fit vectorizer ONLY on training set to prevent data leakage
    X_train_tfidf = vectorizer.fit_transform(X_train)
    # Transform test set using the already-fitted training vocabulary
    X_test_tfidf = vectorizer.transform(X_test)

    print(f"\nExtracted TF-IDF vocabulary size (from X_train only): {len(vectorizer.vocabulary_)} features")

    # 4. Model Training: Logistic Regression
    # Logistic Regression fits a linear decision boundary on the sparse TF-IDF feature space.
    # Using L2 regularization and max_iter=1000 ensures stable convergence.
    classifier = LogisticRegression(
        solver="liblinear",
        random_state=RANDOM_STATE,
        max_iter=1000,
        C=1.0,
    )
    classifier.fit(X_train_tfidf, y_train)

    # 5. Model Evaluation on Unseen Test Data
    y_pred = classifier.predict(X_test_tfidf)

    accuracy = accuracy_score(y_test, y_pred)
    macro_precision = precision_score(y_test, y_pred, average="macro", zero_division=0)
    weighted_precision = precision_score(y_test, y_pred, average="weighted", zero_division=0)
    macro_recall = recall_score(y_test, y_pred, average="macro", zero_division=0)
    weighted_recall = recall_score(y_test, y_pred, average="weighted", zero_division=0)
    macro_f1 = f1_score(y_test, y_pred, average="macro", zero_division=0)
    weighted_f1 = f1_score(y_test, y_pred, average="weighted", zero_division=0)

    # Unique target class labels in sorted order
    labels = sorted(list(set(y)))

    print("\n" + "=" * 70)
    print("BASELINE MODEL EVALUATION METRICS (On Unseen X_test)")
    print("=" * 70)
    print(f"Overall Accuracy:       {accuracy * 100:.2f}%")
    print(f"Macro Precision:        {macro_precision * 100:.2f}% | Weighted: {weighted_precision * 100:.2f}%")
    print(f"Macro Recall:           {macro_recall * 100:.2f}% | Weighted: {weighted_recall * 100:.2f}%")
    print(f"Macro F1-Score:         {macro_f1 * 100:.2f}% | Weighted: {weighted_f1 * 100:.2f}%")
    print("=" * 70)

    # 6. Detailed Classification Report per Department
    report = classification_report(y_test, y_pred, labels=labels, zero_division=0)
    print("\nDETAILED CLASSIFICATION REPORT BY DEPARTMENT:")
    print("-" * 70)
    print(report)

    # 7. Confusion Matrix
    cm = confusion_matrix(y_test, y_pred, labels=labels)
    print("CONFUSION MATRIX (Rows: True Department, Columns: Predicted Department):")
    print("-" * 70)
    
    # Format confusion matrix with clear column headers
    header_str = f"{'True \\ Pred':<18}" + "".join([f"{dept[:5]:>8}" for dept in labels])
    print(header_str)
    print("-" * len(header_str))
    for idx, row in enumerate(cm):
        row_str = f"{labels[idx]:<18}" + "".join([f"{val:>8}" for val in row])
        print(row_str)
    print("=" * 70)

    # 8. Stratified 5-Fold Cross-Validation Robustness Evaluation
    # Pipeline encapsulates vectorization and modeling to prevent data leakage across CV folds.
    cv_pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            sublinear_tf=True,
            stop_words="english",
        )),
        ("classifier", LogisticRegression(
            solver="liblinear",
            random_state=RANDOM_STATE,
            max_iter=1000,
            C=1.0,
        )),
    ])

    skf = StratifiedKFold(n_splits=CV_FOLDS, shuffle=True, random_state=RANDOM_STATE)
    cv_scoring = {
        "accuracy": "accuracy",
        "precision_macro": "precision_macro",
        "recall_macro": "recall_macro",
        "f1_macro": "f1_macro",
    }

    cv_results = cross_validate(
        cv_pipeline,
        X,
        y,
        cv=skf,
        scoring=cv_scoring,
        return_train_score=False,
    )

    print("\n" + "=" * 70)
    print(f"5-FOLD STRATIFIED CROSS-VALIDATION ROBUSTNESS EVALUATION ({CV_FOLDS} Folds)")
    print("=" * 70)
    print(f"{'Fold':<10}{'Accuracy':<15}{'Macro Precision':<20}{'Macro Recall':<18}{'Macro F1':<15}")
    print("-" * 70)

    for fold_idx in range(CV_FOLDS):
        acc = cv_results["test_accuracy"][fold_idx] * 100
        prec = cv_results["test_precision_macro"][fold_idx] * 100
        rec = cv_results["test_recall_macro"][fold_idx] * 100
        f1 = cv_results["test_f1_macro"][fold_idx] * 100
        print(f"Fold {fold_idx + 1:<5}{acc:>7.2f}%{prec:>18.2f}%{rec:>16.2f}%{f1:>13.2f}%")

    print("-" * 70)
    mean_acc = np.mean(cv_results["test_accuracy"]) * 100
    std_acc = np.std(cv_results["test_accuracy"]) * 100
    mean_prec = np.mean(cv_results["test_precision_macro"]) * 100
    std_prec = np.std(cv_results["test_precision_macro"]) * 100
    mean_rec = np.mean(cv_results["test_recall_macro"]) * 100
    std_rec = np.std(cv_results["test_recall_macro"]) * 100
    mean_f1 = np.mean(cv_results["test_f1_macro"]) * 100
    std_f1 = np.std(cv_results["test_f1_macro"]) * 100

    print(f"{'Mean':<10}{mean_acc:>7.2f}%{mean_prec:>18.2f}%{mean_rec:>16.2f}%{mean_f1:>13.2f}%")
    print(f"{'Std Dev':<10}{std_acc:>7.2f}%{std_prec:>18.2f}%{std_rec:>16.2f}%{std_f1:>13.2f}%")
    print("=" * 70)


if __name__ == "__main__":
    run_training_pipeline()
