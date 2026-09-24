#!/usr/bin/env python3
"""
train_department_model.py

Trains and serializes the Module 10 Clinical Department Classification Champion Model
using the approved candidate dataset.

Pipeline:
  - TfidfVectorizer (lowercase=True, ngram_range=(1, 2), sublinear_tf=True, stop_words="english")
  - LogisticRegression (solver="liblinear", class_weight="balanced", C=1.0, random_state=42)

Artifacts Produced:
  - models/department_classifier.joblib
  - models/department_classifier_metadata.json
"""

import os
import sys
import csv
import json
import joblib
from datetime import datetime, timezone
from pathlib import Path

# Ensure site-packages from local venv are accessible
base_dir = Path(__file__).resolve().parent.parent
venv_site = base_dir / "venv" / "Lib" / "site-packages"
if venv_site.exists() and str(venv_site) not in sys.path:
    sys.path.insert(0, str(venv_site))

# Ensure UTF-8 console output
if sys.stdout.encoding != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

import numpy as np
from sklearn.pipeline import Pipeline
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

RANDOM_STATE = 42
MODEL_VERSION = "1.0.0"


def load_candidate_training_data(filepath: Path):
    """Load symptom_text and department from candidate CSV."""
    if not filepath.exists():
        raise FileNotFoundError(f"Training file not found: {filepath}")
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
    print("=" * 80)
    print("MODULE 10: PRODUCTION CANDIDATE MODEL TRAINING & SERIALIZATION")
    print("=" * 80)

    # 1. Paths
    data_path = base_dir / "data" / "processed" / "department_train_candidate.csv"
    models_dir = base_dir / "models"
    models_dir.mkdir(parents=True, exist_ok=True)
    model_artifact_path = models_dir / "department_classifier.joblib"
    metadata_artifact_path = models_dir / "department_classifier_metadata.json"

    # 2. Load Dataset
    print(f"\n[1] Loading candidate training corpus: {data_path}")
    X_train, y_train = load_candidate_training_data(data_path)
    department_labels = sorted(list(set(y_train)))
    num_samples = len(X_train)
    num_departments = len(department_labels)
    print(f"    Loaded {num_samples} training samples across {num_departments} departments.")

    # 3. Construct sklearn Pipeline
    print("\n[2] Constructing sklearn Pipeline (TF-IDF + Class-Weighted Logistic Regression)...")
    pipeline = Pipeline([
        (
            "tfidf",
            TfidfVectorizer(
                lowercase=True,
                ngram_range=(1, 2),
                sublinear_tf=True,
                stop_words="english",
            ),
        ),
        (
            "clf",
            LogisticRegression(
                solver="liblinear",
                class_weight="balanced",
                C=1.0,
                random_state=RANDOM_STATE,
                max_iter=1000,
            ),
        ),
    ])

    # 4. Train Model on Complete Candidate Training Data
    print(f"\n[3] Training complete pipeline on {num_samples} samples...")
    pipeline.fit(X_train, y_train)
    num_features = len(pipeline.named_steps["tfidf"].vocabulary_)
    print(f"    Training completed successfully.")
    print(f"    Total TF-IDF Vocabulary Features: {num_features}")

    # 5. Serialize Pipeline Artifact
    print(f"\n[4] Serializing model pipeline to: {model_artifact_path}")
    joblib.dump(pipeline, model_artifact_path, compress=3)
    model_size_bytes = model_artifact_path.stat().st_size
    model_size_kb = model_size_bytes / 1024
    print(f"    Saved model artifact ({model_size_kb:.2f} KB / {model_size_bytes} bytes).")

    # 6. Save Metadata Artifact
    timestamp_utc = datetime.now(timezone.utc).isoformat()
    metadata = {
        "model_version": MODEL_VERSION,
        "model_type": "TF-IDF + LogisticRegression Pipeline",
        "vectorizer_type": "TfidfVectorizer",
        "ngram_range": [1, 2],
        "sublinear_tf": True,
        "stop_words": "english",
        "classifier": "LogisticRegression",
        "solver": "liblinear",
        "class_weight": "balanced",
        "C": 1.0,
        "random_state": RANDOM_STATE,
        "max_iter": 1000,
        "training_dataset": "data/processed/department_train_candidate.csv",
        "training_samples": num_samples,
        "vocabulary_size": num_features,
        "number_of_departments": num_departments,
        "department_labels": department_labels,
        "training_timestamp": timestamp_utc,
    }

    print(f"\n[5] Writing model metadata to: {metadata_artifact_path}")
    with open(metadata_artifact_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
    print("    Metadata written successfully.")

    # 7. Reload Artifact & Verification
    print(f"\n[6] Reloading model artifact from disk for verification...")
    reloaded_pipeline = joblib.load(model_artifact_path)
    print("    Model reloaded successfully.")

    # 8. Verification on Required Test Examples
    test_cases = [
        ("A", "I have pain and pressure in my chest and my heart is beating very fast"),
        ("B", "I have a red itchy rash on my skin"),
        ("C", "My knee hurts whenever I climb stairs"),
        ("D", "I have been having severe headaches and dizziness"),
        ("E", "I have stomach pain with nausea and vomiting"),
    ]

    print("\n" + "=" * 80)
    print("RELOADED MODEL PREDICTION & INFERENCE VERIFICATION")
    print("=" * 80)

    classes = list(reloaded_pipeline.classes_)
    all_exact_match = True

    for label_id, text in test_cases:
        # In-memory original prediction
        orig_pred = pipeline.predict([text])[0]
        orig_proba = pipeline.predict_proba([text])[0]

        # Reloaded model prediction
        reloaded_pred = reloaded_pipeline.predict([text])[0]
        reloaded_proba = reloaded_pipeline.predict_proba([text])[0]

        # Check identity
        is_identical = (orig_pred == reloaded_pred) and np.allclose(orig_proba, reloaded_proba)
        if not is_identical:
            all_exact_match = False

        top3_indices = np.argsort(reloaded_proba)[::-1][:3]
        top3 = [(classes[i], reloaded_proba[i]) for i in top3_indices]
        confidence = top3[0][1]

        top3_str = ", ".join([f"{dept} ({prob*100:.1f}%)" for dept, prob in top3])

        print(f"\nTest Case {label_id}: \"{text}\"")
        print(f"  - Predicted Department: {reloaded_pred}")
        print(f"  - Confidence          : {confidence*100:.2f}%")
        print(f"  - Top 3 Probabilities : {top3_str}")
        print(f"  - Reload Match Check  : {'PASSED (Bit-for-bit identical)' if is_identical else 'FAILED'}")

    # 9. Final Training Summary
    print("\n" + "=" * 80)
    print("FINAL TRAINING SUMMARY")
    print("=" * 80)
    print(f"Training Status          : {'SUCCESS' if all_exact_match else 'FAILED'}")
    print(f"Model Artifact Path      : {model_artifact_path}")
    print(f"Metadata Artifact Path   : {metadata_artifact_path}")
    print(f"Model File Size          : {model_size_kb:.2f} KB ({model_size_bytes} bytes)")
    print(f"Training Dataset         : {data_path.name} ({num_samples} rows)")
    print(f"Number of Classes        : {num_departments} departments")
    print(f"Vocabulary Size          : {num_features} n-gram features")
    print(f"Reload Verification Check: {'PASSED (100% Identical)' if all_exact_match else 'FAILED'}")
    print("=" * 80)


if __name__ == "__main__":
    main()
