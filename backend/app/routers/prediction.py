import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.student import StudentProfile, AcademicRecord, SkillResume
from app.models.prediction import Prediction
from app.schemas.prediction import PredictionInput, PredictionResponse, PredictionHistoryOut
from app.core.rbac import get_current_user
from app.core.audit import log_audit_event
from app.ml.service import predict_student_placement

router = APIRouter(prefix="/prediction", tags=["ML Prediction Engine"])

@router.post("/predict", response_model=PredictionResponse)
def trigger_prediction(
    custom_input: Optional[PredictionInput] = None,
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Fetch student's persisted profile data if not fully overridden
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.user_id).first()
    academic = db.query(AcademicRecord).filter(AcademicRecord.user_id == current_user.user_id).first()
    skills_obj = db.query(SkillResume).filter(SkillResume.user_id == current_user.user_id).first()

    # Determine values to use
    cgpa = (custom_input.cgpa if custom_input and custom_input.cgpa is not None 
            else (academic.cgpa if academic else 7.5))
    percentage = (custom_input.percentage if custom_input and custom_input.percentage is not None 
                 else (academic.percentage if academic else 75.0))
    backlogs = (custom_input.backlogs if custom_input and custom_input.backlogs is not None 
                else (academic.backlogs if academic else 0))
    aptitude_score = (custom_input.aptitude_score if custom_input and custom_input.aptitude_score is not None 
                     else (academic.aptitude_score if academic else 70.0))
    technical_skills = (custom_input.technical_skills if custom_input and custom_input.technical_skills 
                        else (skills_obj.technical_skills if skills_obj else "Python, SQL, React"))
    branch = (custom_input.branch if custom_input and custom_input.branch 
              else (profile.branch if profile else "Computer Science & Engineering"))

    # Execute ML Prediction Service (< 100ms)
    result = predict_student_placement(
        db=db,
        user=current_user,
        cgpa=cgpa,
        percentage=percentage,
        backlogs=backlogs,
        aptitude_score=aptitude_score,
        technical_skills=technical_skills,
        branch=branch
    )

    log_audit_event(
        db=db,
        actor=current_user,
        action_type="PREDICTION_REQUEST",
        target_entity="prediction",
        target_id=str(result["prediction_id"]),
        details=f"Calculated placement probability: {result['probability']}% ({result['readiness_level']}) in {result['latency_ms']}ms",
        request=request
    )

    return result

@router.get("/history", response_model=List[PredictionHistoryOut])
def get_prediction_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    preds = db.query(Prediction).filter(
        Prediction.user_id == current_user.user_id
    ).order_by(Prediction.created_at.desc()).limit(20).all()

    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.user_id).first()
    branch_name = profile.branch if profile else "Engineering"

    results = []
    for p in preds:
        results.append({
            "prediction_id": p.prediction_id,
            "user_id": p.user_id,
            "user_name": current_user.name,
            "branch": branch_name,
            "probability": p.probability,
            "readiness_level": p.readiness_level,
            "job_role": p.job_role,
            "model_version": p.model_version,
            "created_at": p.created_at
        })

    return results

@router.get("/latest")
def get_latest_prediction(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    pred = db.query(Prediction).filter(
        Prediction.user_id == current_user.user_id
    ).order_by(Prediction.created_at.desc()).first()

    if not pred:
        return None

    factors = json.loads(pred.contributing_factors) if pred.contributing_factors else []
    skill_gaps = json.loads(pred.skill_gaps) if pred.skill_gaps else []

    return {
        "prediction_id": pred.prediction_id,
        "probability": pred.probability,
        "readiness_level": pred.readiness_level,
        "job_role": pred.job_role,
        "contributing_factors": factors,
        "skill_gaps": skill_gaps,
        "model_version": pred.model_version,
        "created_at": pred.created_at
    }
