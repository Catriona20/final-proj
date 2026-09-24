#!/usr/bin/env python3
"""
intermittent_demand_forecaster.py

Module 11: Two-Stage Hurdle Demand Forecaster for Intermittent Pharmacy Sales.
Decomposes demand forecasting into:
- Stage 1: Occurrence Classification P(Demand > 0)
- Stage 2: Magnitude Regression E[Demand | Demand > 0]

Final Forecast:
    y_hat_{t+k} = P(Demand_{t+k} > 0) * Magnitude_{t+k}
"""

import sys
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import numpy as np
import xgboost as xgb
from sklearn.multioutput import MultiOutputClassifier, MultiOutputRegressor

# Ensure local venv site-packages are accessible
base_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(base_dir))

venv_site = base_dir / "venv" / "Lib" / "site-packages"
if venv_site.exists() and str(venv_site) not in sys.path:
    sys.path.insert(0, str(venv_site))


class HurdleXGBoostForecaster:
    """
    Two-Stage Hurdle Forecaster combining:
    1. MultiOutput XGBoost Classifier for occurrence probability.
    2. MultiOutput XGBoost Regressor for positive demand magnitude.
    """

    def __init__(
        self,
        horizon: int,
        n_estimators: int = 50,
        max_depth: int = 4,
        learning_rate: float = 0.05,
        subsample: float = 0.8,
        colsample_bytree: float = 0.8,
        random_state: int = 42,
        threshold: Optional[float] = None,
    ):
        self.horizon = horizon
        self.threshold = threshold  # If None, uses Expected Value: P * Magnitude

        # Stage 1: Occurrence Classifier
        base_clf = xgb.XGBClassifier(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            subsample=subsample,
            colsample_bytree=colsample_bytree,
            tree_method="hist",
            eval_metric="logloss",
            random_state=random_state,
            n_jobs=2,
        )
        self.occurrence_model = MultiOutputClassifier(base_clf, n_jobs=1)

        # Stage 2: Magnitude Regressor
        base_reg = xgb.XGBRegressor(
            n_estimators=n_estimators,
            max_depth=max_depth,
            learning_rate=learning_rate,
            subsample=subsample,
            colsample_bytree=colsample_bytree,
            tree_method="hist",
            random_state=random_state,
            n_jobs=2,
        )
        self.magnitude_model = MultiOutputRegressor(base_reg, n_jobs=1)

    def fit(self, X: np.ndarray, Y: np.ndarray):
        """
        Fits both Stage 1 (Occurrence) and Stage 2 (Magnitude) models.
        """
        # Binary occurrence target: 1 if quantity > 0 else 0
        Y_occ = (Y > 0.0).astype(int)

        # Ensure all columns in Y_occ have at least two classes for classifier fit
        for col_idx in range(Y_occ.shape[1]):
            if len(np.unique(Y_occ[:, col_idx])) < 2:
                # Add synthetic variation at negligible index if necessary
                Y_occ[0, col_idx] = 1 - Y_occ[0, col_idx]

        self.occurrence_model.fit(X, Y_occ)

        # Fit magnitude model on all samples with positive pseudo-weights or raw Y
        self.magnitude_model.fit(X, np.maximum(0.0, Y))
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predicts future demand using Hurdle combination.
        Returns array of shape (N, horizon).
        """
        N = X.shape[0]

        # Get probabilities of positive demand for each step in horizon
        # occurrence_model.predict_proba returns list of length 'horizon', each (N, 2)
        prob_list = self.occurrence_model.predict_proba(X)
        P_occ = np.zeros((N, self.horizon), dtype=np.float64)

        for step_idx in range(self.horizon):
            step_probs = prob_list[step_idx]
            if step_probs.shape[1] == 2:
                P_occ[:, step_idx] = step_probs[:, 1]
            else:
                # Only 1 class was observed during fit
                classes = self.occurrence_model.estimators_[step_idx].classes_
                P_occ[:, step_idx] = 1.0 if (len(classes) > 0 and classes[0] == 1) else 0.0

        # Predict magnitude
        pred_mag = np.maximum(0.0, self.magnitude_model.predict(X))

        if self.threshold is not None:
            # Deterministic thresholding
            mask = (P_occ >= self.threshold).astype(np.float64)
            forecast = mask * pred_mag
        else:
            # Statistical expected value: E[Y] = P(Y > 0) * E[Y | Y > 0]
            forecast = P_occ * pred_mag

        return np.maximum(0.0, forecast)

    def predict_occurrence(self, X: np.ndarray) -> np.ndarray:
        """Returns occurrence probabilities P(demand > 0) of shape (N, horizon)."""
        N = X.shape[0]
        prob_list = self.occurrence_model.predict_proba(X)
        P_occ = np.zeros((N, self.horizon), dtype=np.float64)
        for step_idx in range(self.horizon):
            step_probs = prob_list[step_idx]
            if step_probs.shape[1] == 2:
                P_occ[:, step_idx] = step_probs[:, 1]
            else:
                classes = self.occurrence_model.estimators_[step_idx].classes_
                P_occ[:, step_idx] = 1.0 if (len(classes) > 0 and classes[0] == 1) else 0.0
        return P_occ
