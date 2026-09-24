"""
nlp-forecasting-service
FastAPI service for NLP Symptom & Department Recommendation (Module 10)
and Pharmacy Demand Forecasting (Module 11).

All configuration is loaded strictly from environment variables.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings, SettingsConfigDict

from schemas.common import HealthResponse, ErrorResponse
from schemas.symptoms import SymptomAnalysisRequest, SymptomAnalysisResponse
from schemas.forecast import DemandForecastRequest, DemandForecastResponse
from schemas.pharmacy_forecast import (
    PharmacyForecastRequest,
    PharmacyForecastResponse,
    PharmacyBatchForecastRequest,
    PharmacyBatchForecastResponse,
)
from schemas.inventory_intelligence import (
    InventoryAnalysisRequest,
    InventoryAnalysisResponse,
)
from services.symptom_classifier import symptom_service
from services.demand_forecaster import forecasting_service
from services.pharmacy_forecasting_service import pharmacy_forecast_service
from services.inventory_intelligence_service import inventory_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("nlp-forecasting-service")


class Settings(BaseSettings):
    """Service configuration, populated from environment variables / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", protected_namespaces=())

    service_name: str = "nlp-forecasting-service"
    host: str = "0.0.0.0"
    port: int = 8000
    log_level: str = "info"
    cors_origin: str = "*"

    # Optional model registry / external configuration
    model_registry_url: str | None = None
    model_registry_api_key: str | None = None


settings = Settings()

app = FastAPI(
    title="NLP & Forecasting Service",
    description="Microservice providing NLP Symptom & Department Recommendation (Module 10) and Pharmacy Demand Forecasting (Module 11).",
    version="0.2.0",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin] if settings.cors_origin != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health() -> HealthResponse:
    """Liveness probe."""
    return HealthResponse(status="healthy", service=settings.service_name)


@app.get("/ready", response_model=HealthResponse, tags=["Health"])
async def ready() -> HealthResponse:
    """Readiness probe."""
    return HealthResponse(status="ready", service=settings.service_name)


# ---------------------------------------------------------------------------
# Module 10: NLP Symptom & Department Recommendation
# ---------------------------------------------------------------------------
@app.post(
    "/api/symptoms/analyze",
    response_model=SymptomAnalysisResponse,
    responses={422: {"model": ErrorResponse}},
    tags=["Module 10 - NLP Symptoms"],
)
async def analyze_symptoms(payload: SymptomAnalysisRequest) -> SymptomAnalysisResponse:
    """
    Analyzes patient symptoms from text input:
    - Extracts key symptom terminology
    - Classifies the recommended medical department and specialist
    - Evaluates red-flag patterns for emergency triage
    """
    try:
        logger.info("Analyzing symptoms narrative (length: %d chars)", len(payload.symptoms))
        result = symptom_service.analyze_symptoms(payload)
        return result
    except Exception as e:
        logger.error("Error during symptom analysis: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal error during symptom analysis.")


# ---------------------------------------------------------------------------
# Module 11: Production Pharmacy Demand Forecasting (Two-Stage Hurdle XGBoost)
# ---------------------------------------------------------------------------
@app.post(
    "/api/pharmacy/forecast",
    response_model=PharmacyForecastResponse,
    responses={400: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    tags=["Module 11 - Production Pharmacy Forecasting"],
)
async def forecast_pharmacy_demand(payload: PharmacyForecastRequest) -> PharmacyForecastResponse:
    """
    Generates multi-horizon pharmaceutical demand predictions using the
    frozen Two-Stage Hurdle XGBoost Champion Model:
    - Occurrence classifier filters zero-demand periods
    - Magnitude regressor projects positive dispensing volume
    - Guaranteed non-negative, chronological forecast output
    """
    try:
        logger.info("Generating pharmacy demand forecast for medicine_id=%s, horizon=%d", payload.medicine_id, payload.horizon_days)
        result = pharmacy_forecast_service.forecast_medicine_demand(payload)
        return result
    except ValueError as ve:
        logger.warning("Validation error in pharmacy forecast request: %s", str(ve))
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error("Error during pharmacy demand forecasting: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal error during pharmacy demand forecasting.")


@app.post(
    "/api/pharmacy/forecast/batch",
    response_model=PharmacyBatchForecastResponse,
    responses={400: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    tags=["Module 11 - Production Pharmacy Forecasting"],
)
async def forecast_pharmacy_batch(payload: PharmacyBatchForecastRequest) -> PharmacyBatchForecastResponse:
    """
    Generates batch multi-horizon pharmaceutical demand predictions
    across multiple medicine series.
    """
    try:
        logger.info("Generating batch pharmacy demand forecast for %d medicines, horizon=%d", len(payload.history), payload.horizon_days)
        result = pharmacy_forecast_service.forecast_batch_demand(payload)
        return result
    except ValueError as ve:
        logger.warning("Validation error in batch pharmacy forecast request: %s", str(ve))
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error("Error during batch pharmacy forecasting: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal error during batch pharmacy demand forecasting.")


@app.post(
    "/api/pharmacy/inventory/analyze",
    response_model=InventoryAnalysisResponse,
    responses={400: {"model": ErrorResponse}, 422: {"model": ErrorResponse}},
    tags=["Module 11 - Production Inventory Intelligence"],
)
async def analyze_pharmacy_inventory(payload: InventoryAnalysisRequest) -> InventoryAnalysisResponse:
    """
    Generates integrated demand forecast and inventory intelligence analysis:
    - Obtains frozen Hurdle XGBoost forecast
    - Computes coverage days, lead-time demand, and ending stock
    - Evaluates deterministic stock status ('OK', 'LOW_STOCK', 'CRITICAL')
    - Provides operational replenishment planning recommendations
    """
    try:
        logger.info(
            "Analyzing pharmacy inventory health for medicine_id=%s, horizon=%d, stock=%.2f",
            payload.medicine_id,
            payload.horizon_days,
            payload.current_stock,
        )
        result = inventory_service.analyze_inventory_health(payload)
        return result
    except ValueError as ve:
        logger.warning("Validation error in inventory analysis request: %s", str(ve))
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error("Error during pharmacy inventory analysis: %s", str(e))
        raise HTTPException(status_code=500, detail="Internal error during pharmacy inventory analysis.")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host=settings.host, port=settings.port, reload=True)

