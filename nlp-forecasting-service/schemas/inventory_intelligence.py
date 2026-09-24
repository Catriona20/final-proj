"""
inventory_intelligence.py

Module 11: Production Pydantic Schemas for Pharmacy Inventory Intelligence & Reorder Planning.
"""

from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from schemas.pharmacy_forecast import PharmacyDispensePoint, ForecastPoint


class InventoryForecastSummary(BaseModel):
    """Summary of demand forecast output."""
    horizon_days: int = Field(..., description="Forecast horizon in days")
    total_predicted_demand: float = Field(..., ge=0.0, description="Cumulative predicted demand over horizon (units)")
    average_daily_demand: float = Field(..., ge=0.0, description="Mean predicted daily demand (units/day)")
    daily_forecast: List[ForecastPoint] = Field(..., description="Daily forecasted points")


class InventoryMetrics(BaseModel):
    """Operational inventory calculation metrics."""
    current_stock: float = Field(..., ge=0.0, description="Current physical stock on hand (units)")
    lead_time_days: int = Field(..., gt=0, description="Supplier replenishment lead time (days)")
    lead_time_demand: float = Field(..., ge=0.0, description="Expected demand over lead time (units)")
    safety_stock: float = Field(..., ge=0.0, description="Designated safety stock buffer (units)")
    reorder_point: float = Field(..., ge=0.0, description="Designated reorder threshold (units)")
    projected_stock_after_horizon: float = Field(..., description="Projected ending stock after forecast horizon (can be negative indicating shortage)")
    days_of_coverage: float = Field(..., ge=0.0, description="Estimated days of inventory coverage remaining")
    status: str = Field(..., description="Operational stock status: 'OK', 'LOW_STOCK', or 'CRITICAL'")


class ReorderRecommendation(BaseModel):
    """Operational inventory replenishment planning recommendation."""
    reorder_required: bool = Field(..., description="Flag indicating if reorder is recommended")
    recommended_quantity: float = Field(..., ge=0.0, description="Suggested reorder quantity (units)")
    reason: str = Field(..., description="Operational justification for the recommendation")
    type: str = Field(default="inventory_planning_recommendation", description="Recommendation category")


class InventoryAnalysisRequest(BaseModel):
    """Request payload for pharmacy inventory intelligence analysis."""
    medicine_id: str = Field(..., description="Standardized ATC Medicine ID", example="MED-ATC-N02BE")
    horizon_days: int = Field(default=14, description="Forecast horizon in days (7, 14, or 30)", example=14)
    history: List[PharmacyDispensePoint] = Field(..., min_length=28, description="Chronological daily historical dispensations (minimum 28 days required)")
    current_stock: float = Field(..., ge=0.0, description="Current on-hand inventory count (units)", example=150.0)
    lead_time_days: int = Field(default=7, gt=0, description="Supplier lead time in days", example=7)
    safety_stock: float = Field(default=30.0, ge=0.0, description="Safety stock threshold (units)", example=30.0)
    reorder_point: float = Field(default=100.0, ge=0.0, description="Reorder trigger threshold (units)", example=100.0)

    @field_validator("current_stock", "safety_stock", "reorder_point")
    def validate_non_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Inventory stock parameters must be non-negative (>= 0.0)")
        return v


class InventoryAnalysisResponse(BaseModel):
    """Response payload containing demand forecast and inventory intelligence analysis."""
    medicine_id: str = Field(..., description="Standardized ATC Medicine ID", example="MED-ATC-N02BE")
    medicine_name: str = Field(..., description="Clinical generic name", example="Paracetamol")
    category: str = Field(..., description="Therapeutic category", example="Analgesic")
    forecast: InventoryForecastSummary = Field(..., description="Demand forecast summary and daily breakdown")
    inventory: InventoryMetrics = Field(..., description="Operational inventory health metrics")
    recommendation: ReorderRecommendation = Field(..., description="Operational replenishment planning recommendation")
    model: str = Field(default="hurdle_xgboost", description="Demand forecasting model identifier")
    model_version: str = Field(default="module-11-final", description="Model release version")
