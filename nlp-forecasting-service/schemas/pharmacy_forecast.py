"""
pharmacy_forecast.py

Module 11: Production Pydantic Schemas for Pharmacy Demand Forecasting API.
"""

from typing import List, Dict, Optional
from pydantic import BaseModel, Field, field_validator


class PharmacyDispensePoint(BaseModel):
    """Historical observation point for pharmacy dispensing."""
    date: str = Field(..., description="Observation date in ISO-8601 YYYY-MM-DD format", example="2019-10-01")
    quantity_dispensed: float = Field(..., ge=0.0, description="Quantity of medicine dispensed (must be non-negative)", example=25.0)

    @field_validator("quantity_dispensed")
    def validate_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("quantity_dispensed must be non-negative (>= 0.0)")
        return v


class ForecastPoint(BaseModel):
    """Daily forecasted demand point."""
    date: str = Field(..., description="Forecast date in ISO-8601 YYYY-MM-DD format", example="2019-10-02")
    predicted_quantity: float = Field(..., ge=0.0, description="Predicted demand quantity in units", example=24.50)


class PharmacyForecastRequest(BaseModel):
    """Request payload for single-medicine demand forecasting."""
    medicine_id: str = Field(..., description="Standardized ATC Medicine ID", example="MED-ATC-N02BE")
    horizon_days: int = Field(default=14, description="Forecast horizon in days (7, 14, or 30)", example=14)
    history: List[PharmacyDispensePoint] = Field(..., min_length=28, description="Chronological daily historical dispensations (minimum 28 days required)")


class PharmacyForecastResponse(BaseModel):
    """Response payload for single-medicine demand forecasting."""
    medicine_id: str = Field(..., description="Standardized ATC Medicine ID", example="MED-ATC-N02BE")
    medicine_name: str = Field(..., description="Clinical generic name", example="Paracetamol")
    category: str = Field(..., description="Therapeutic category", example="Analgesic")
    horizon_days: int = Field(..., description="Forecast horizon in days", example=14)
    forecast: List[ForecastPoint] = Field(..., description="Chronological daily forecast points")
    model: str = Field(default="hurdle_xgboost", description="Model architecture identifier")
    model_version: str = Field(default="module-11-final", description="Model release version")


class PharmacyBatchForecastRequest(BaseModel):
    """Request payload for batch multi-medicine demand forecasting."""
    horizon_days: int = Field(default=14, description="Forecast horizon in days (7, 14, or 30)", example=14)
    history: Dict[str, List[PharmacyDispensePoint]] = Field(..., description="Dictionary mapping medicine_id to chronological daily history")


class PharmacyBatchForecastResponse(BaseModel):
    """Response payload for batch multi-medicine demand forecasting."""
    horizon_days: int = Field(..., description="Forecast horizon in days", example=14)
    model: str = Field(default="hurdle_xgboost", description="Model architecture identifier")
    model_version: str = Field(default="module-11-final", description="Model release version")
    forecasts: Dict[str, PharmacyForecastResponse] = Field(..., description="Dictionary mapping medicine_id to forecast response")
