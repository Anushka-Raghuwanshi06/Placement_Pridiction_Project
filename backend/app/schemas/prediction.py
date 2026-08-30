from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime

class PredictionInput(BaseModel):
    cgpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    percentage: Optional[float] = Field(None, ge=0.0, le=100.0)
    backlogs: Optional[int] = Field(None, ge=0)
    aptitude_score: Optional[float] = Field(None, ge=0.0, le=100.0)
    technical_skills: Optional[str] = None
    branch: Optional[str] = None

class FactorImpact(BaseModel):
    feature: str
    impact: str  # "positive", "negative", "neutral"
    weight: float  # -1.0 to 1.0 or percentage points
    description: str

class CompanyEligibility(BaseModel):
    company_name: str
    tier: str
    eligible: bool
    package_lpa: float
    job_role: str
    reasons: List[str]
    missing_skills: List[str]

class PredictionResponse(BaseModel):
    prediction_id: Optional[int] = None
    probability: float  # e.g., 84.5%
    readiness_level: str  # "High Readiness", "Moderate Readiness", "Needs Improvement"
    job_role: str
    contributing_factors: List[FactorImpact]
    skill_gaps: List[str]
    matched_skills: List[str]
    company_eligibility: List[CompanyEligibility]
    recommendations: List[str]
    model_version: str
    latency_ms: float
    disclaimer: str
    created_at: Optional[datetime] = None

class PredictionHistoryOut(BaseModel):
    prediction_id: int
    user_id: int
    user_name: Optional[str] = None
    branch: Optional[str] = None
    probability: float
    readiness_level: str
    job_role: str
    model_version: str
    created_at: datetime

    class Config:
        from_attributes = True
