#!/usr/bin/env python3
"""
baseline_forecasting.py

Module 11: Statistical & Heuristic Baseline Demand Forecasting Models.
Provides a uniform forecasting interface for:
1. Naive Last Value (Persistence)
2. 7-Day Moving Average
3. 7-Day Seasonal Naive (Day-of-Week matching)
4. Exponential Smoothing (Holt-Winters / Simple Exponential Smoothing)

Interface Contract:
    forecast(history: np.ndarray, horizon: int) -> np.ndarray
"""

from abc import ABC, abstractmethod
from typing import List, Union
import numpy as np


class BaselineForecaster(ABC):
    """Abstract Base Class for all Module 11 Baseline Demand Forecasters."""

    def __init__(self, name: str):
        self.name = name

    @abstractmethod
    def forecast(self, history: Union[List[float], np.ndarray], horizon: int) -> np.ndarray:
        """
        Generates out-of-sample forecast for 'horizon' periods ahead using
        strictly the observed chronological historical demand.
        """
        pass


class NaiveLastValueForecaster(BaselineForecaster):
    """
    Naive Last Value (Persistence Model):
    Forecasts all future time steps using the most recently observed value:
    y_hat_{t+k} = y_t
    """

    def __init__(self):
        super().__init__("Naive Last Value")

    def forecast(self, history: Union[List[float], np.ndarray], horizon: int) -> np.ndarray:
        arr = np.asarray(history, dtype=np.float64)
        if len(arr) == 0:
            return np.zeros(horizon, dtype=np.float64)
        last_val = arr[-1]
        return np.full(horizon, max(0.0, float(last_val)), dtype=np.float64)


class MovingAverage7DForecaster(BaselineForecaster):
    """
    7-Day Moving Average Forecaster:
    Forecasts all future time steps using the arithmetic mean of the
    last 7 observed days:
    y_hat_{t+k} = (1/7) * sum_{i=0}^6 y_{t-i}
    """

    def __init__(self, window_size: int = 7):
        super().__init__(f"{window_size}-Day Moving Average")
        self.window_size = window_size

    def forecast(self, history: Union[List[float], np.ndarray], horizon: int) -> np.ndarray:
        arr = np.asarray(history, dtype=np.float64)
        if len(arr) == 0:
            return np.zeros(horizon, dtype=np.float64)
        window = arr[-min(len(arr), self.window_size):]
        mean_val = float(np.mean(window))
        return np.full(horizon, max(0.0, mean_val), dtype=np.float64)


class SeasonalNaive7DForecaster(BaselineForecaster):
    """
    7-Day Seasonal Naive Forecaster:
    Forecasts future day t+k using the demand observed exactly 7 days prior
    (capturing day-of-week clinical dispensation cycles):
    y_hat_{t+k} = y_{t - 7 + ((k-1) % 7) + 1}
    """

    def __init__(self, season_length: int = 7):
        super().__init__(f"{season_length}-Day Seasonal Naive")
        self.season_length = season_length

    def forecast(self, history: Union[List[float], np.ndarray], horizon: int) -> np.ndarray:
        arr = np.asarray(history, dtype=np.float64)
        if len(arr) == 0:
            return np.zeros(horizon, dtype=np.float64)

        if len(arr) < self.season_length:
            # Fallback to repeating available history or mean
            last_season = np.pad(arr, (self.season_length - len(arr), 0), mode="edge")
        else:
            last_season = arr[-self.season_length:]

        forecasts = np.zeros(horizon, dtype=np.float64)
        for k in range(horizon):
            season_idx = k % self.season_length
            forecasts[k] = max(0.0, float(last_season[season_idx]))
        return forecasts


class ExponentialSmoothingForecaster(BaselineForecaster):
    """
    Exponential Smoothing Forecaster (Holt's Linear / Simple Exponential Smoothing):
    Captures smoothed level and trend deterministically without ML fitting.
    level_t = alpha * y_t + (1 - alpha) * (level_{t-1} + trend_{t-1})
    trend_t = beta * (level_t - level_{t-1}) + (1 - beta) * trend_{t-1}
    y_hat_{t+k} = level_t + k * trend_t
    """

    def __init__(self, alpha: float = 0.3, beta: float = 0.05, dampening: float = 0.95):
        super().__init__("Exponential Smoothing (Holt)")
        self.alpha = alpha
        self.beta = beta
        self.dampening = dampening

    def forecast(self, history: Union[List[float], np.ndarray], horizon: int) -> np.ndarray:
        arr = np.asarray(history, dtype=np.float64)
        if len(arr) == 0:
            return np.zeros(horizon, dtype=np.float64)

        if len(arr) == 1:
            return np.full(horizon, max(0.0, float(arr[0])), dtype=np.float64)

        # Initialize level and trend
        level = arr[0]
        trend = arr[1] - arr[0]

        for y in arr[1:]:
            prev_level = level
            level = self.alpha * y + (1.0 - self.alpha) * (prev_level + trend)
            trend = self.beta * (level - prev_level) + (1.0 - self.beta) * trend

        # Project forward with dampened trend to avoid explosive forecasts
        forecasts = np.zeros(horizon, dtype=np.float64)
        cumulative_damp = 0.0
        for k in range(1, horizon + 1):
            cumulative_damp += (self.dampening ** k)
            pred = level + trend * cumulative_damp
            forecasts[k - 1] = max(0.0, float(pred))

        return forecasts


def get_all_baselines() -> List[BaselineForecaster]:
    """Returns a list of all instantiable baseline forecasters."""
    return [
        NaiveLastValueForecaster(),
        MovingAverage7DForecaster(window_size=7),
        SeasonalNaive7DForecaster(season_length=7),
        ExponentialSmoothingForecaster(alpha=0.3, beta=0.05, dampening=0.95),
    ]
