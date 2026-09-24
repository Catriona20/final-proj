from typing import List, Optional
from pydantic import BaseModel, Field


class HistoricalDispensePoint(BaseModel):
    date: str
    quantity: int


class ForecastDemandPoint(BaseModel):
    date: str
    predicted_quantity: float


class DemandForecastRequest(BaseModel):
    medicine_id: str = Field(..., description="UUID or identifier of the medicine")
    historical_dispensations: List[HistoricalDispensePoint] = Field(default_factory=list)
    horizon_days: int = Field(default=14, ge=1, le=90, description="Forecast horizon in days")


class DemandForecastResponse(BaseModel):
    medicine_id: str
    forecasted_demand: List[ForecastDemandPoint]
    recommended_reorder_quantity: int
    model_name: str = "xgboost-demand-v0.1.0"
