#!/usr/bin/env python3
"""
pharmacy_forecasting_features.py

Module 11: Feature Engineering Pipeline for Pharmacy Demand Forecasting.
Constructs leakage-safe feature representations from chronological time series:
- Lag features (1, 2, 3, 7, 14, 21, 28)
- Rolling statistics (Mean & Std over 7, 14, 28 days with shift(1) protection)
- Calendar & seasonal features (Day of week, day of month, week of year, month, quarter, is_weekend)
- Intermittent-demand features (Zero counts, days since non-zero demand, recent non-zero mean)
- Medicine categorical encoding
"""

import sys
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import numpy as np

# Canonical Medicine ID to Index Mapping
MEDICINE_ENCODING: Dict[str, int] = {
    "MED-ATC-M01AB": 0,
    "MED-ATC-M01AE": 1,
    "MED-ATC-N02BA": 2,
    "MED-ATC-N02BE": 3,
    "MED-ATC-N05B":  4,
    "MED-ATC-N05C":  5,
    "MED-ATC-R03":   6,
    "MED-ATC-R06":   7,
}

FEATURE_NAMES = [
    # Medicine encoding
    "medicine_code",
    # Lag features
    "lag_1",
    "lag_2",
    "lag_3",
    "lag_7",
    "lag_14",
    "lag_21",
    "lag_28",
    # Rolling features (strictly prior to target origin)
    "rolling_mean_7",
    "rolling_mean_14",
    "rolling_mean_28",
    "rolling_std_7",
    "rolling_std_14",
    "rolling_std_28",
    # Calendar features
    "day_of_week",
    "day_of_month",
    "week_of_year",
    "month",
    "quarter",
    "is_weekend",
    # Intermittent demand features
    "zero_count_7",
    "zero_count_14",
    "zero_count_28",
    "days_since_nonzero_demand",
    "recent_nonzero_mean_28",
]


def extract_single_origin_features(
    history: np.ndarray,
    origin_date: datetime,
    medicine_id: str,
) -> np.ndarray:
    """
    Extracts a 1D feature vector for a specific medicine at a specific forecast origin date.
    STRICT ANTI-LEAKAGE GUARANTEE: Uses only elements from 'history' (strictly prior to origin).
    """
    if len(history) < 28:
        raise ValueError(f"History length ({len(history)}) is shorter than minimum required lag window (28 days).")

    med_code = MEDICINE_ENCODING.get(medicine_id, -1)

    # 1. Lag features
    lag_1 = float(history[-1])
    lag_2 = float(history[-2])
    lag_3 = float(history[-3])
    lag_7 = float(history[-7])
    lag_14 = float(history[-14])
    lag_21 = float(history[-21])
    lag_28 = float(history[-28])

    # 2. Rolling features (using last 7, 14, 28 observed values in history)
    w7 = history[-7:]
    w14 = history[-14:]
    w28 = history[-28:]

    rolling_mean_7 = float(np.mean(w7))
    rolling_mean_14 = float(np.mean(w14))
    rolling_mean_28 = float(np.mean(w28))

    rolling_std_7 = float(np.std(w7))
    rolling_std_14 = float(np.std(w14))
    rolling_std_28 = float(np.std(w28))

    # 3. Calendar features for the forecast origin date
    dow = origin_date.weekday()  # 0=Monday, 6=Sunday
    dom = origin_date.day
    woy = origin_date.isocalendar()[1]
    month = origin_date.month
    quarter = (month - 1) // 3 + 1
    is_weekend = 1.0 if dow in [5, 6] else 0.0

    # 4. Intermittent demand features
    zero_count_7 = float(np.sum(w7 == 0.0))
    zero_count_14 = float(np.sum(w14 == 0.0))
    zero_count_28 = float(np.sum(w28 == 0.0))

    # Days since non-zero demand (look back from end of history)
    days_since_nonzero = 0.0
    for idx in range(len(history) - 1, -1, -1):
        if history[idx] > 0.0:
            break
        days_since_nonzero += 1.0

    # Mean of non-zero demand in last 28 days
    nonzero_w28 = w28[w28 > 0.0]
    recent_nonzero_mean_28 = float(np.mean(nonzero_w28)) if len(nonzero_w28) > 0 else 0.0

    feat_vector = np.array([
        float(med_code),
        lag_1,
        lag_2,
        lag_3,
        lag_7,
        lag_14,
        lag_21,
        lag_28,
        rolling_mean_7,
        rolling_mean_14,
        rolling_mean_28,
        rolling_std_7,
        rolling_std_14,
        rolling_std_28,
        float(dow),
        float(dom),
        float(woy),
        float(month),
        float(quarter),
        is_weekend,
        zero_count_7,
        zero_count_14,
        zero_count_28,
        days_since_nonzero,
        recent_nonzero_mean_28,
    ], dtype=np.float64)

    return feat_vector


def build_dataset_matrix(
    series_by_med: Dict[str, Dict[str, any]],
    horizon: int,
    start_origin_idx: int = 28,
    end_origin_idx: Optional[int] = None,
) -> Tuple[np.ndarray, np.ndarray, List[Tuple[str, str]]]:
    """
    Constructs feature matrix X (N, n_features) and target matrix Y (N, horizon)
    for direct multi-step forecasting across all medicines.
    """
    X_list = []
    Y_list = []
    meta_list = []

    for m_id, m_data in series_by_med.items():
        dates = m_data["dates"]
        quantities = m_data["quantities"]
        total_days = len(quantities)

        max_idx = total_days - horizon if end_origin_idx is None else min(end_origin_idx, total_days - horizon)

        for origin_idx in range(start_origin_idx, max_idx + 1):
            history = quantities[:origin_idx]
            target_future = quantities[origin_idx : origin_idx + horizon]
            origin_date_dt = datetime.strptime(dates[origin_idx], "%Y-%m-%d")

            feat = extract_single_origin_features(history, origin_date_dt, m_id)

            X_list.append(feat)
            Y_list.append(target_future)
            meta_list.append((m_id, dates[origin_idx]))

    X = np.array(X_list, dtype=np.float64)
    Y = np.array(Y_list, dtype=np.float64)

    # Sanity checks
    assert not np.isnan(X).any(), "NaN detected in feature matrix X"
    assert not np.isnan(Y).any(), "NaN detected in target matrix Y"
    assert not np.isinf(X).any(), "Inf detected in feature matrix X"
    assert not np.isinf(Y).any(), "Inf detected in target matrix Y"

    return X, Y, meta_list
