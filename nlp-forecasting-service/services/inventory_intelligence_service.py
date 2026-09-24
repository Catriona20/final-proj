"""
inventory_intelligence_service.py

Module 11: Inventory Intelligence & Operational Reorder Planning Service.
Processes demand forecast vectors alongside explicit operational inventory parameters
to compute stock health metrics, coverage projections, and reorder planning recommendations.
"""

from __future__ import annotations

import logging
from typing import Dict, List, Tuple
import numpy as np

from schemas.pharmacy_forecast import (
    ForecastPoint,
    PharmacyForecastRequest,
    PharmacyForecastResponse,
)
from schemas.inventory_intelligence import (
    InventoryForecastSummary,
    InventoryMetrics,
    ReorderRecommendation,
    InventoryAnalysisRequest,
    InventoryAnalysisResponse,
)
from services.pharmacy_forecasting_service import pharmacy_forecast_service

logger = logging.getLogger("inventory_intelligence_service")


class InventoryIntelligenceService:
    """Service computing deterministic inventory analytics and replenishment recommendations."""

    def analyze_inventory_health(
        self,
        payload: InventoryAnalysisRequest,
    ) -> InventoryAnalysisResponse:
        """
        1. Obtains the frozen ML forecast from PharmacyForecastingService.
        2. Computes coverage, lead-time demand, ending stock, and operational status.
        3. Generates deterministic inventory planning recommendations.
        """
        # Validate inventory parameters
        if payload.current_stock < 0:
            raise ValueError(f"current_stock cannot be negative: {payload.current_stock}")
        if payload.safety_stock < 0:
            raise ValueError(f"safety_stock cannot be negative: {payload.safety_stock}")
        if payload.reorder_point < 0:
            raise ValueError(f"reorder_point cannot be negative: {payload.reorder_point}")
        if payload.lead_time_days <= 0:
            raise ValueError(f"lead_time_days must be strictly positive: {payload.lead_time_days}")

        # 1. Obtain Forecast from Champion ML Forecaster
        forecast_req = PharmacyForecastRequest(
            medicine_id=payload.medicine_id,
            horizon_days=payload.horizon_days,
            history=payload.history,
        )
        forecast_res = pharmacy_forecast_service.forecast_medicine_demand(forecast_req)

        daily_forecast_points = forecast_res.forecast
        daily_quantities = np.array([pt.predicted_quantity for pt in daily_forecast_points], dtype=np.float64)

        # 2. Compute Demand Metrics
        total_predicted_demand = float(np.sum(daily_quantities))
        average_daily_demand = float(total_predicted_demand / payload.horizon_days)

        # 3. Compute Days of Inventory Coverage
        if average_daily_demand > 0:
            days_of_coverage = float(payload.current_stock / average_daily_demand)
        else:
            days_of_coverage = 999.0 if payload.current_stock > 0 else 0.0

        # 4. Compute Lead-Time Demand
        if payload.lead_time_days <= payload.horizon_days:
            lead_time_demand = float(np.sum(daily_quantities[:payload.lead_time_days]))
        else:
            # Extrapolate using average daily demand
            lead_time_demand = float(average_daily_demand * payload.lead_time_days)
            logger.info("Lead time (%d days) exceeds horizon (%d days); extrapolated lead time demand.", payload.lead_time_days, payload.horizon_days)

        # 5. Projected Ending Stock after horizon
        projected_stock_after_horizon = float(payload.current_stock - total_predicted_demand)

        # 6. Determine Operational Stock Status
        # Rules:
        # - CRITICAL: current_stock <= safety_stock OR projected_stock < 0 OR current_stock < lead_time_demand
        # - LOW_STOCK: current_stock <= reorder_point (and not CRITICAL)
        # - OK: current_stock > reorder_point AND projected_stock >= safety_stock
        if (
            payload.current_stock <= payload.safety_stock
            or projected_stock_after_horizon < 0
            or payload.current_stock < lead_time_demand
        ):
            status = "CRITICAL"
        elif payload.current_stock <= payload.reorder_point:
            status = "LOW_STOCK"
        else:
            status = "OK"

        # 7. Generate Replenishment Recommendation
        # Trigger reorder if stock <= reorder_point OR projected ending stock < safety_stock
        reorder_required = False
        recommended_quantity = 0.0
        reason = "Current stock and projected inventory levels are adequate throughout the forecast horizon."

        if payload.current_stock <= payload.reorder_point:
            reorder_required = True
            # Replenish to satisfy horizon demand plus safety buffer
            target_stock_position = total_predicted_demand + payload.safety_stock
            deficit = target_stock_position - payload.current_stock
            recommended_quantity = max(0.0, float(round(deficit, 2)))
            if recommended_quantity == 0.0:
                recommended_quantity = max(0.0, float(round(payload.reorder_point + payload.safety_stock - payload.current_stock, 2)))
            reason = f"Current stock ({payload.current_stock:.2f} units) is at or below the designated reorder threshold ({payload.reorder_point:.2f} units)."
        elif projected_stock_after_horizon < payload.safety_stock:
            reorder_required = True
            deficit = (payload.safety_stock - projected_stock_after_horizon)
            recommended_quantity = max(0.0, float(round(deficit, 2)))
            reason = f"Projected ending stock ({projected_stock_after_horizon:.2f} units) drops below the designated safety buffer ({payload.safety_stock:.2f} units) within {payload.horizon_days} days."

        forecast_summary = InventoryForecastSummary(
            horizon_days=payload.horizon_days,
            total_predicted_demand=round(total_predicted_demand, 2),
            average_daily_demand=round(average_daily_demand, 2),
            daily_forecast=daily_forecast_points,
        )

        inventory_metrics = InventoryMetrics(
            current_stock=round(payload.current_stock, 2),
            lead_time_days=payload.lead_time_days,
            lead_time_demand=round(lead_time_demand, 2),
            safety_stock=round(payload.safety_stock, 2),
            reorder_point=round(payload.reorder_point, 2),
            projected_stock_after_horizon=round(projected_stock_after_horizon, 2),
            days_of_coverage=round(days_of_coverage, 2),
            status=status,
        )

        recommendation = ReorderRecommendation(
            reorder_required=reorder_required,
            recommended_quantity=round(recommended_quantity, 2),
            reason=reason,
            type="inventory_planning_recommendation",
        )

        return InventoryAnalysisResponse(
            medicine_id=payload.medicine_id,
            medicine_name=forecast_res.medicine_name,
            category=forecast_res.category,
            forecast=forecast_summary,
            inventory=inventory_metrics,
            recommendation=recommendation,
            model="hurdle_xgboost",
            model_version="module-11-final",
        )


# Global Singleton Service Instance
inventory_service = InventoryIntelligenceService()
