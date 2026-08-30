import os
import shutil
import json
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.config import settings
from app.models.user import User
from app.models.student import StudentProfile, AcademicRecord, SkillResume
from app.models.prediction import Prediction
from app.schemas.student import (
    StudentProfileCreate, StudentProfileUpdate, StudentProfileOut,
    AcademicRecordCreate, AcademicRecordUpdate, AcademicRecordOut,
    SkillResumeCreate, SkillResumeUpdate, SkillResumeOut,
    FullStudentBundle
)
from app.core.rbac import get_current_user, require_role
from app.core.audit import log_audit_event

router = APIRouter(prefix="/student", tags=["Student Management"])

@router.get("/bundle", response_model=FullStudentBundle)
def get_student_bundle(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.user_id).first()
    academic = db.query(AcademicRecord).filter(AcademicRecord.user_id == current_user.user_id).first()
    skills = db.query(SkillResume).filter(SkillResume.user_id == current_user.user_id).first()
    latest_pred = db.query(Prediction).filter(Prediction.user_id == current_user.user_id).order_by(Prediction.created_at.desc()).first()

    pred_dict = None
    if latest_pred:
        pred_dict = {
            "prediction_id": latest_pred.prediction_id,
            "probability": latest_pred.probability,
            "readiness_level": latest_pred.readiness_level,
            "job_role": latest_pred.job_role,
            "model_version": latest_pred.model_version,
            "created_at": latest_pred.created_at.isoformat(),
            "contributing_factors": json.loads(latest_pred.contributing_factors) if latest_pred.contributing_factors else []
        }

    return {
        "user_id": current_user.user_id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "profile": profile,
        "academic": academic,
        "skills": skills,
        "latest_prediction": pred_dict
    }

@router.get("/profile", response_model=StudentProfileOut)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.user_id).first()
    if not profile:
        profile = StudentProfile(user_id=current_user.user_id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    return profile

@router.put("/profile", response_model=StudentProfileOut)
def update_profile(
    profile_in: StudentProfileUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == current_user.user_id).first()
    if not profile:
        profile = StudentProfile(user_id=current_user.user_id)
        db.add(profile)

    profile.branch = profile_in.branch
    profile.semester = profile_in.semester
    profile.phone = profile_in.phone
    profile.date_of_birth = profile_in.date_of_birth

    db.commit()
    db.refresh(profile)

    log_audit_event(
        db=db,
        actor=current_user,
        action_type="UPDATE_STUDENT_PROFILE",
        target_entity="student_profile",
        target_id=str(profile.profile_id),
        details=f"Updated profile branch={profile.branch}, sem={profile.semester}",
        request=request
    )
    return profile

@router.get("/academic", response_model=AcademicRecordOut)
def get_academic(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    academic = db.query(AcademicRecord).filter(AcademicRecord.user_id == current_user.user_id).first()
    if not academic:
        academic = AcademicRecord(user_id=current_user.user_id)
        db.add(academic)
        db.commit()
        db.refresh(academic)
    return academic

@router.put("/academic", response_model=AcademicRecordOut)
def update_academic(
    academic_in: AcademicRecordUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Server-side validation
    if not (0.0 <= academic_in.cgpa <= 10.0):
        raise HTTPException(status_code=400, detail="CGPA must be between 0.0 and 10.0")
    if academic_in.backlogs < 0:
        raise HTTPException(status_code=400, detail="Backlogs count cannot be negative")
    if not (0.0 <= academic_in.percentage <= 100.0):
        raise HTTPException(status_code=400, detail="Percentage must be between 0.0 and 100.0")
    if not (0.0 <= academic_in.aptitude_score <= 100.0):
        raise HTTPException(status_code=400, detail="Aptitude score must be between 0.0 and 100.0")

    academic = db.query(AcademicRecord).filter(AcademicRecord.user_id == current_user.user_id).first()
    if not academic:
        academic = AcademicRecord(user_id=current_user.user_id)
        db.add(academic)

    academic.cgpa = round(academic_in.cgpa, 2)
    academic.percentage = round(academic_in.percentage, 1)
    academic.backlogs = int(academic_in.backlogs)
    academic.aptitude_score = round(academic_in.aptitude_score, 1)

    db.commit()
    db.refresh(academic)

    log_audit_event(
        db=db,
        actor=current_user,
        action_type="UPDATE_ACADEMIC_RECORD",
        target_entity="academic_record",
        target_id=str(academic.record_id),
        details=f"Updated academic: CGPA={academic.cgpa}, Backlogs={academic.backlogs}, Aptitude={academic.aptitude_score}",
        request=request
    )
    return academic

@router.get("/skills", response_model=SkillResumeOut)
def get_skills(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    skills = db.query(SkillResume).filter(SkillResume.user_id == current_user.user_id).first()
    if not skills:
        skills = SkillResume(user_id=current_user.user_id)
        db.add(skills)
        db.commit()
        db.refresh(skills)
    return skills

@router.put("/skills", response_model=SkillResumeOut)
def update_skills(
    skills_in: SkillResumeUpdate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not skills_in.technical_skills.strip():
        raise HTTPException(status_code=400, detail="Technical skills cannot be empty.")

    skills = db.query(SkillResume).filter(SkillResume.user_id == current_user.user_id).first()
    if not skills:
        skills = SkillResume(user_id=current_user.user_id)
        db.add(skills)

    skills.technical_skills = skills_in.technical_skills
    skills.certifications = skills_in.certifications
    db.commit()
    db.refresh(skills)

    log_audit_event(
        db=db,
        actor=current_user,
        action_type="UPDATE_SKILLS",
        target_entity="skill_resume",
        target_id=str(skills.skill_resume_id),
        details="Updated technical skills and certifications",
        request=request
    )
    return skills

@router.post("/resume/upload", response_model=SkillResumeOut)
def upload_resume(
    file: UploadFile = File(...),
    request: Request = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    allowed_extensions = [".pdf", ".docx", ".doc"]
    ext = Path(file.filename).suffix.lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type '{ext}'. Only PDF and DOCX files are permitted."
        )

    # Clean file name
    safe_filename = f"resume_{current_user.user_id}_{int(os.path.getmtime(settings.RESUME_DIR) if os.path.exists(settings.RESUME_DIR) else 1000)}{ext}"
    dest_path = settings.RESUME_DIR / safe_filename

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    skills = db.query(SkillResume).filter(SkillResume.user_id == current_user.user_id).first()
    if not skills:
        skills = SkillResume(user_id=current_user.user_id)
        db.add(skills)

    skills.resume_path = str(dest_path)
    db.commit()
    db.refresh(skills)

    log_audit_event(
        db=db,
        actor=current_user,
        action_type="UPLOAD_RESUME",
        target_entity="skill_resume",
        target_id=str(skills.skill_resume_id),
        details=f"Uploaded resume file {file.filename}",
        request=request
    )
    return skills
