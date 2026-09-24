from typing import List, Optional
from pydantic import BaseModel, Field


class SymptomAnalysisRequest(BaseModel):
    symptoms: str = Field(..., description="Free-text narrative of patient symptoms", min_length=3)
    duration_days: Optional[int] = Field(default=None, description="Reported symptom duration in days")


class SymptomAnalysisResponse(BaseModel):
    routing_status: str = Field(..., description="Routing status: 'recommended' or 'requires_further_assessment'")
    extracted_keywords: List[str] = Field(default_factory=list, description="Extracted key symptom terms")
    recommended_department: Optional[str] = Field(default=None, description="Recommended medical department")
    recommended_specialist: Optional[str] = Field(default=None, description="Recommended specialist type")
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Raw top-1 model posterior probability")
    confidence_margin: float = Field(..., ge=0.0, le=1.0, description="Difference between top-1 and top-2 probabilities")
    is_emergency: bool = Field(default=False, description="Flag indicating potential urgent/critical medical state")
    emergency_reason: Optional[str] = Field(default=None, description="Reason for emergency triage flag if applicable")
    model_version: str = Field(default="nlp-dept-clf-v1.0.0", description="Version of the model that generated prediction")
