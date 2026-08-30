from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class SystemStatsOut(BaseModel):
    total_students: int
    total_faculty: int
    total_predictions: int
    avg_placement_probability: float
    high_readiness_count: int
    moderate_readiness_count: int
    needs_improvement_count: int
    total_companies: int
    active_model: str
    active_model_accuracy: float

class BranchReadinessStats(BaseModel):
    branch: str
    student_count: int
    avg_probability: float
    avg_cgpa: float
    high_readiness_pct: float

class AggregateReportOut(BaseModel):
    system_stats: SystemStatsOut
    branch_stats: List[BranchReadinessStats]
    cgpa_distribution: Dict[str, int]
    top_skills: List[Dict[str, Any]]
    recent_predictions: List[Dict[str, Any]]

class AuditLogOut(BaseModel):
    log_id: int
    actor_id: Optional[int] = None
    actor_email: Optional[str] = None
    actor_role: Optional[str] = None
    action_type: str
    target_entity: str
    target_id: Optional[str] = None
    details: Optional[str] = None
    ip_address: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True

class ModelVersionOut(BaseModel):
    model_id: int
    version_name: str
    algorithm: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    is_active: bool
    artifact_path: str
    features_list: str
    created_at: datetime

    class Config:
        from_attributes = True
