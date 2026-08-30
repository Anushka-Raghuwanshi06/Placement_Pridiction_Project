import time
import json
from pathlib import Path
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from sqlalchemy.orm import Session

from app.config import settings
from app.models.model_version import ModelVersion
from app.models.company import Company
from app.models.prediction import Prediction
from app.models.notification import Notification
from app.models.user import User
from app.ml.pipeline import PlacementMLPipeline

# In-memory cache for loaded model artifact
_CACHED_MODEL = None
_CACHED_MODEL_VERSION = None

def get_active_model(db: Session):
    global _CACHED_MODEL, _CACHED_MODEL_VERSION

    active_entry = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    if not active_entry:
        # Fallback to any latest model
        active_entry = db.query(ModelVersion).order_by(ModelVersion.created_at.desc()).first()

    if not active_entry:
        return None, "Default-Heuristic"

    if _CACHED_MODEL is not None and _CACHED_MODEL_VERSION == active_entry.version_name:
        return _CACHED_MODEL, active_entry.version_name

    # Load from disk
    model_path = Path(active_entry.artifact_path)
    if model_path.exists():
        _CACHED_MODEL = PlacementMLPipeline.load_artifact(str(model_path))
        _CACHED_MODEL_VERSION = active_entry.version_name
        return _CACHED_MODEL, active_entry.version_name
    
    return None, active_entry.version_name

def invalidate_model_cache():
    global _CACHED_MODEL, _CACHED_MODEL_VERSION
    _CACHED_MODEL = None
    _CACHED_MODEL_VERSION = None

def calculate_contributing_factors(cgpa: float, backlogs: int, aptitude: float, skills_str: str) -> List[Dict[str, Any]]:
    factors = []
    skills = [s.strip().lower() for s in skills_str.split(",") if s.strip()]

    # CGPA Impact
    if cgpa >= 8.5:
        factors.append({
            "feature": "Academic Excellence (CGPA)",
            "impact": "positive",
            "weight": round((cgpa - 7.0) * 12.0, 1),
            "description": f"Outstanding CGPA of {cgpa:.2f} significantly boosts shortlist probability."
        })
    elif cgpa >= 7.0:
        factors.append({
            "feature": "Academic Foundation (CGPA)",
            "impact": "positive",
            "weight": round((cgpa - 6.0) * 8.0, 1),
            "description": f"Good CGPA of {cgpa:.2f} clears baseline criteria for most Tier-1 & Tier-2 recruiters."
        })
    else:
        factors.append({
            "feature": "CGPA Threshold",
            "impact": "negative",
            "weight": -round((7.0 - cgpa) * 15.0, 1),
            "description": f"CGPA of {cgpa:.2f} is below the 7.0 cutoff for top product firms."
        })

    # Backlogs Impact
    if backlogs == 0:
        factors.append({
            "feature": "Clean Academic Record (Zero Backlogs)",
            "impact": "positive",
            "weight": 14.5,
            "description": "Zero active backlogs ensures immediate eligibility for 100% of campus drives."
        })
    elif backlogs == 1:
        factors.append({
            "feature": "Active Backlogs",
            "impact": "negative",
            "weight": -18.0,
            "description": "1 active backlog disqualifies from strict Tier-1 recruiters."
        })
    else:
        factors.append({
            "feature": "Multiple Backlogs",
            "impact": "negative",
            "weight": -round(backlogs * 22.0, 1),
            "description": f"{backlogs} active backlogs severely restrict eligibility."
        })

    # Aptitude Score Impact
    if aptitude >= 80.0:
        factors.append({
            "feature": "High Aptitude & Problem Solving",
            "impact": "positive",
            "weight": round((aptitude - 60.0) * 0.4, 1),
            "description": f"Score of {aptitude:.1f}% indicates high probability of passing Round 1 OA."
        })
    elif aptitude >= 60.0:
        factors.append({
            "feature": "Moderate Aptitude Readiness",
            "impact": "neutral",
            "weight": 5.0,
            "description": f"Aptitude score of {aptitude:.1f}% meets standard baseline."
        })
    else:
        factors.append({
            "feature": "Aptitude Assessment Gap",
            "impact": "negative",
            "weight": -round((60.0 - aptitude) * 0.5, 1),
            "description": f"Aptitude score of {aptitude:.1f}% poses a risk in preliminary screening."
        })

    # Technical Skills Impact
    high_value_skills = {"python", "java", "c++", "data structures", "dsa", "react", "sql", "node.js", "system design", "aws", "docker"}
    matched_hv = [s for s in skills if s in high_value_skills]
    if len(matched_hv) >= 4:
        factors.append({
            "feature": "In-Demand Tech Stack",
            "impact": "positive",
            "weight": round(len(matched_hv) * 4.5, 1),
            "description": f"Proficiency in core skills ({', '.join(matched_hv[:3])}...) matches industry demand."
        })
    elif len(matched_hv) >= 2:
        factors.append({
            "feature": "Core Technical Skills",
            "impact": "positive",
            "weight": 8.0,
            "description": f"Matches standard requirements with {', '.join(matched_hv)}."
        })
    else:
        factors.append({
            "feature": "Skill Repertoire Depth",
            "impact": "negative",
            "weight": -12.0,
            "description": "Needs additional industry skills (e.g., DSA, Cloud, SQL) to stand out."
        })

    return factors

def evaluate_company_eligibility(cgpa: float, backlogs: int, skills_str: str, companies: List[Company]) -> List[Dict[str, Any]]:
    student_skills = set(s.strip().lower() for s in skills_str.split(",") if s.strip())
    results = []

    for comp in companies:
        reasons = []
        missing_skills = []
        eligible = True

        # Check CGPA
        if cgpa < comp.minimum_cgpa:
            eligible = False
            reasons.append(f"Min CGPA required: {comp.minimum_cgpa} (Your: {cgpa:.2f})")

        # Check Backlogs
        if backlogs > comp.backlog_allowed:
            eligible = False
            reasons.append(f"Max backlogs allowed: {comp.backlog_allowed} (Your: {backlogs})")

        # Check Skills
        req_skills = [s.strip() for s in comp.required_skills.split(",") if s.strip()]
        for req in req_skills:
            if req.lower() not in student_skills:
                missing_skills.append(req)

        if missing_skills:
            if len(missing_skills) > len(req_skills) // 2:
                eligible = False
                reasons.append(f"Missing core skills: {', '.join(missing_skills)}")
            else:
                reasons.append(f"Recommended to acquire: {', '.join(missing_skills)}")

        if eligible and not reasons:
            reasons.append("All eligibility criteria fully satisfied!")

        results.append({
            "company_name": comp.name,
            "tier": comp.tier,
            "eligible": eligible,
            "package_lpa": comp.package_lpa,
            "job_role": comp.job_role,
            "reasons": reasons,
            "missing_skills": missing_skills
        })

    return sorted(results, key=lambda x: (not x["eligible"], -x["package_lpa"]))

def generate_recommendations(readiness_level: str, backlogs: int, aptitude: float, missing_skills: List[str]) -> List[str]:
    recs = []
    if backlogs > 0:
        recs.append(f"Clear your {backlogs} active backlog(s) in upcoming re-examinations to unlock Tier-1 company drives.")
    if aptitude < 70.0:
        recs.append("Practice daily quantitative aptitude and logical reasoning mock tests on platforms like IndiaBIX or LeetCode.")
    if missing_skills:
        top_missing = missing_skills[:3]
        recs.append(f"Complete hands-on projects focusing on high-demand skills: {', '.join(top_missing)}.")
    if readiness_level == "High Readiness":
        recs.append("Engage in peer mock interviews focusing on System Design, Data Structures, and behavioral STAR stories.")
    else:
        recs.append("Build and deploy a full-stack portfolio project with live links to showcase on your resume.")
    return recs

def predict_student_placement(
    db: Session,
    user: User,
    cgpa: float,
    percentage: float,
    backlogs: int,
    aptitude_score: float,
    technical_skills: str,
    branch: Optional[str] = None
) -> Dict[str, Any]:
    start_time = time.time()

    # Load active model
    model, model_version_name = get_active_model(db)

    # Prepare single row DataFrame
    input_df = pd.DataFrame([{
        "cgpa": float(cgpa),
        "percentage": float(percentage),
        "backlogs": int(backlogs),
        "aptitude_score": float(aptitude_score),
        "technical_skills": str(technical_skills)
    }])

    probability = 50.0
    if model is not None:
        try:
            proba_arr = model.predict_proba(input_df)[0]
            probability = float(proba_arr[1] * 100.0)
        except Exception as e:
            # Fallback heuristic if pipeline error
            base = (cgpa / 10.0) * 45.0 + (aptitude_score / 100.0) * 35.0 - (backlogs * 15.0)
            probability = max(5.0, min(98.0, base + 20.0))
    else:
        # Heuristic calculation
        base = (cgpa / 10.0) * 45.0 + (aptitude_score / 100.0) * 35.0 - (backlogs * 15.0)
        probability = max(5.0, min(98.0, base + 20.0))

    probability = round(probability, 1)

    # Determine readiness level
    if probability >= 75.0:
        readiness_level = "High Readiness"
        suggested_role = "Senior Software Development Engineer (SDE I)"
    elif probability >= 50.0:
        readiness_level = "Moderate Readiness"
        suggested_role = "Associate Software Engineer / Analyst"
    else:
        readiness_level = "Needs Improvement"
        suggested_role = "Junior Technical Trainee / Support Engineer"

    # Calculate contributing factors
    factors = calculate_contributing_factors(cgpa, backlogs, aptitude_score, technical_skills)

    # Evaluate target companies
    companies = db.query(Company).all()
    company_elig = evaluate_company_eligibility(cgpa, backlogs, technical_skills, companies)

    # Collect skill gaps
    all_missing_skills = []
    for comp in company_elig:
        for sk in comp["missing_skills"]:
            if sk not in all_missing_skills:
                all_missing_skills.append(sk)

    student_skills_list = [s.strip() for s in technical_skills.split(",") if s.strip()]
    recommendations = generate_recommendations(readiness_level, backlogs, aptitude_score, all_missing_skills)

    # Persist prediction to database
    prediction_record = Prediction(
        user_id=user.user_id,
        probability=probability,
        readiness_level=readiness_level,
        job_role=suggested_role,
        contributing_factors=json.dumps(factors),
        skill_gaps=json.dumps(all_missing_skills),
        model_version=model_version_name
    )
    db.add(prediction_record)

    # Trigger Notification for student (Module 8)
    notif = Notification(
        user_id=user.user_id,
        title="Placement Prediction Updated",
        message=f"Your placement likelihood is calculated at {probability}% ({readiness_level}). Check your updated skill gaps and company matches.",
        type="prediction"
    )
    db.add(notif)
    db.commit()
    db.refresh(prediction_record)

    elapsed_ms = round((time.time() - start_time) * 1000, 2)

    return {
        "prediction_id": prediction_record.prediction_id,
        "probability": probability,
        "readiness_level": readiness_level,
        "job_role": suggested_role,
        "contributing_factors": factors,
        "skill_gaps": all_missing_skills,
        "matched_skills": student_skills_list,
        "company_eligibility": company_elig,
        "recommendations": recommendations,
        "model_version": model_version_name,
        "latency_ms": elapsed_ms,
        "disclaimer": settings.ADVISORY_DISCLAIMER,
        "created_at": prediction_record.created_at
    }
