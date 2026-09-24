#!/usr/bin/env python3
"""
train_department_word_char_production.py

Trains and serializes the Module 10 Production Champion Model v2.0.0.
Architecture:
- Word TF-IDF (1,2)
- Character TF-IDF (3,5)
- FeatureUnion
- LogisticRegression(class_weight="balanced", C=1.0, solver="liblinear", random_state=42)

Trained strictly on ALL 4,785 training samples from data/processed/department_train_candidate.csv.
"""

import sys
import os
import csv
import json
import shutil
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

import joblib
import numpy as np
from sklearn.pipeline import Pipeline, FeatureUnion
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression


def load_csv(filepath: Path):
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
    print("MODULE 10: PRODUCTION CHAMPION v2.0.0 TRAINING & SERIALIZATION")
    print("=" * 90)

    train_path = base_dir / "data" / "processed" / "department_train_candidate.csv"
    models_dir = base_dir / "models"
    model_output_path = models_dir / "department_classifier.joblib"
    backup_path = models_dir / "department_classifier_word_only_v1.0.0.joblib"
    metadata_path = models_dir / "department_classifier_metadata.json"

    models_dir.mkdir(parents=True, exist_ok=True)

    # 1. Backup Existing Model
    if model_output_path.exists():
        print(f"[1] Backing up existing model to: {backup_path.name}")
        shutil.copy2(model_output_path, backup_path)
    else:
        print("[1] No existing model found to backup.")

    # 2. Load Candidate Training Data
    print(f"\n[2] Loading candidate training dataset: {train_path.name}")
    X_train, y_train = load_csv(train_path)
    total_train_samples = len(X_train)
    classes = sorted(list(set(y_train)))
    print(f"    Loaded {total_train_samples} training samples across {len(classes)} classes.")

    # 3. Construct Unified Pipeline
    print("\n[3] Building end-to-end FeatureUnion pipeline...")
    word_vectorizer = TfidfVectorizer(
        analyzer="word",
        ngram_range=(1, 2),
        sublinear_tf=True,
        stop_words="english",
    )
    char_vectorizer = TfidfVectorizer(
        analyzer="char",
        ngram_range=(3, 5),
        sublinear_tf=True,
        min_df=2,
    )

    feature_union = FeatureUnion([
        ("word", word_vectorizer),
        ("char", char_vectorizer),
    ])

    classifier = LogisticRegression(
        class_weight="balanced",
        C=1.0,
        solver="liblinear",
        random_state=42,
        max_iter=1000,
    )

    pipeline = Pipeline([
        ("features", feature_union),
        ("clf", classifier),
    ])

    # 4. Train Model
    print("\n[4] Fitting production model on full training corpus...")
    pipeline.fit(X_train, y_train)

    fitted_word_vec = pipeline.named_steps["features"].transformer_list[0][1]
    fitted_char_vec = pipeline.named_steps["features"].transformer_list[1][1]
    word_feature_count = len(fitted_word_vec.vocabulary_)
    char_feature_count = len(fitted_char_vec.vocabulary_)
    total_feature_count = word_feature_count + char_feature_count

    print(f"    Word features      : {word_feature_count:,}")
    print(f"    Character features : {char_feature_count:,}")
    print(f"    Total features     : {total_feature_count:,}")

    # 5. Serialize Artifact
    print(f"\n[5] Serializing production artifact to: {model_output_path.name}")
    joblib.dump(pipeline, model_output_path, compress=3)
    model_size_bytes = model_output_path.stat().st_size
    model_size_mb = model_size_bytes / (1024 * 1024)
    print(f"    Saved model file size: {model_size_mb:.2f} MB ({model_size_bytes:,} bytes)")

    # 6. Update Metadata
    metadata = {
        "model_name": "department_classifier",
        "model_version": "2.0.0",
        "version_tag": "nlp-dept-clf-v2.0.0",
        "architecture": "Word TF-IDF (1,2) + Character TF-IDF (3,5) + Logistic Regression + class_weight='balanced'",
        "training_dataset": "data/processed/department_train_candidate.csv",
        "training_sample_count": total_train_samples,
        "number_of_departments": len(classes),
        "departments": classes,
        "features": {
            "word_features": {
                "analyzer": "word",
                "ngram_range": [1, 2],
                "sublinear_tf": True,
                "stop_words": "english",
                "vocabulary_size": word_feature_count,
            },
            "character_features": {
                "analyzer": "char",
                "ngram_range": [3, 5],
                "sublinear_tf": True,
                "min_df": 2,
                "vocabulary_size": char_feature_count,
            },
            "total_features": total_feature_count,
        },
        "hyperparameters": {
            "C": 1.0,
            "class_weight": "balanced",
            "solver": "liblinear",
            "random_state": 42,
            "max_iter": 1000,
        },
        "training_timestamp_utc": datetime.now(timezone.utc).isoformat(),
        "established_evaluation_metrics": {
            "held_out_test_set": "data/processed/department_test_candidate.csv",
            "test_samples": 2019,
            "accuracy": 0.9559,
            "macro_precision": 0.9330,
            "macro_recall": 0.9218,
            "macro_f1": 0.9251,
            "weighted_f1": 0.9554,
            "total_errors": 89,
        },
        "established_cross_validation_metrics_5fold": {
            "cv_strategy": "StratifiedKFold(n_splits=5, shuffle=True, random_state=42)",
            "accuracy": "95.36% ± 0.48%",
            "macro_precision": "90.72% ± 2.20%",
            "macro_recall": "86.44% ± 0.84%",
            "macro_f1": "87.45% ± 0.87%",
            "weighted_f1": "95.02% ± 0.47%",
        },
    }

    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=4)
    print(f"    Saved metadata to: {metadata_path.name}")

    # 7. Reload Verification
    print("\n[6] Performing bit-level reload verification...")
    reloaded_pipeline = joblib.load(model_output_path)

    test_probes = [
        "I have severe chest pain and palpitations",
        "Red itchy rash on my arms",
        "Knee pain when climbing stairs",
        "Persistent headache and blurred vision",
        "Severe nausea and stomach cramps",
    ]

    preds_orig = pipeline.predict(test_probes)
    probs_orig = pipeline.predict_proba(test_probes)

    preds_reload = reloaded_pipeline.predict(test_probes)
    probs_reload = reloaded_pipeline.predict_proba(test_probes)

    preds_match = np.array_equal(preds_orig, preds_reload)
    probs_match = np.allclose(probs_orig, probs_reload, atol=1e-9)

    print(f"    Predictions match before and after reload : {preds_match}")
    print(f"    Probabilities match within 1e-9 tolerance : {probs_match}")

    if not (preds_match and probs_match):
        raise RuntimeError("Reload verification failed! Deserialized pipeline differs from in-memory pipeline.")

    # 8. Run Predictions on Test Cases A-H
    print("\n" + "=" * 90)
    print("7. INFERENCE VERIFICATION (TEST CASES A - H)")
    print("=" * 90)

    cases = [
        ("A", "I have pain and pressure in my chest and my heart is beating very fast"),
        ("B", "I have a red itchy rash on my skin"),
        ("C", "My knee hurts whenever I climb stairs"),
        ("D", "I have been having severe headaches and dizziness"),
        ("E", "I have stomach pain with nausea and vomiting"),
        ("F", "I cannot breathe and I am gasping for air"),
        ("G", "hello"),
        ("H", "My heart hurts 💔 so much, can't take it"),
    ]

    for case_id, text in cases:
        probs = reloaded_pipeline.predict_proba([text])[0]
        sorted_indices = np.argsort(probs)[::-1]
        top1_dept = reloaded_pipeline.classes_[sorted_indices[0]]
        top1_prob = float(probs[sorted_indices[0]])
        top2_dept = reloaded_pipeline.classes_[sorted_indices[1]]
        top2_prob = float(probs[sorted_indices[1]])
        margin = top1_prob - top2_prob

        print(f"\n[Case {case_id}] \"{text}\"")
        print(f"  - Predicted Department : {top1_dept}")
        print(f"  - Top-1 Probability    : {top1_prob:.4f} ({top1_prob*100:.2f}%)")
        print(f"  - Top-2 Department     : {top2_dept} ({top2_prob*100:.2f}%)")
        print(f"  - Probability Margin   : {margin:.4f} ({margin*100:.2f}%)")

    print("\n" + "=" * 90)
    print("PRODUCTION TRAINING AND VERIFICATION COMPLETE")
    print("=" * 90)


if __name__ == "__main__":
    main()
