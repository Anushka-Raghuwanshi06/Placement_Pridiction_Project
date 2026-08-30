import json
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.student import StudentProfile, AcademicRecord, SkillResume
from app.models.faculty import FacultyStudentAssignment
from app.models.prediction import Prediction
from app.schemas.faculty import (
    StudentSummaryForFaculty,
    UpdateFacultyNoteRequest,
    AssignStudentRequest
)
from app.core.rbac import get_current_user, require_role
from app.core.audit import log_audit_event

router = APIRouter(prefix="/faculty", tags=["Faculty Readiness Monitoring"])

@router.get("/students", response_model=List[StudentSummaryForFaculty])
def get_assigned_students(
    branch: Optional[str] = Query(None),
    readiness: Optional[str] = Query(None),
    risk_status: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_role(["faculty", "admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(FacultyStudentAssignment).filter(
        FacultyStudentAssignment.faculty_id == current_user.user_id
    )

    assignments = query.all()
    results = []

    for assign in assignments:
        student = assign.student
        if not student:
            continue

        prof = student.student_profile
        acad = student.academic_record
        skills = student.skill_resume
        latest_pred = db.query(Prediction).filter(
            Prediction.user_id == student.user_id
        ).order_by(Prediction.created_at.desc()).first()

        # Apply Filters
        if branch and prof and prof.branch.lower() != branch.lower():
            continue
        if risk_status and assign.risk_status.lower() != risk_status.lower():
            continue
        if readiness and latest_pred and latest_pred.readiness_level.lower() != readiness.lower():
            continue
        if search:
            s_low = search.lower()
            if s_low not in student.name.lower() and s_low not in student.email.lower():
                continue

        results.append({
            "assignment_id": assign.assignment_id,
            "student_id": student.user_id,
            "name": student.name,
            "email": student.email,
            "branch": prof.branch if prof else "N/A",
            "semester": prof.semester if prof else 7,
            "cgpa": acad.cgpa if acad else 0.0,
            "backlogs": acad.backlogs if acad else 0,
            "aptitude_score": acad.aptitude_score if acad else 0.0,
            "technical_skills": skills.technical_skills if skills else "N/A",
            "latest_probability": latest_pred.probability if latest_pred else None,
            "readiness_level": latest_pred.readiness_level if latest_pred else "Not Evaluated",
            "risk_status": assign.risk_status,
            "mentor_notes": assign.mentor_notes,
            "assigned_date": assign.assigned_date
        })

    return results

@router.get("/overview")
def get_faculty_overview(
    current_user: User = Depends(require_role(["faculty", "admin"])),
    db: Session = Depends(get_db)
):
    assignments = db.query(FacultyStudentAssignment).filter(
        FacultyStudentAssignment.faculty_id == current_user.user_id
    ).all()

    total_assigned = len(assignments)
    at_risk = sum(1 for a in assignments if a.risk_status in ["At Risk", "High Attention"])
    
    probabilities = []
    high_ready = 0
    mod_ready = 0
    needs_imp = 0

    for a in assignments:
        pred = db.query(Prediction).filter(Prediction.user_id == a.student_id).order_by(Prediction.created_at.desc()).first()
        if pred:
            probabilities.append(pred.probability)
            if pred.readiness_level == "High Readiness":
                high_ready += 1
            elif pred.readiness_level == "Moderate Readiness":
                mod_ready += 1
            else:
                needs_imp += 1

    avg_prob = round(sum(probabilities) / len(probabilities), 1) if probabilities else 0.0

    return {
        "total_assigned": total_assigned,
        "at_risk_count": at_risk,
        "avg_cohort_probability": avg_prob,
        "high_readiness_count": high_ready,
        "moderate_readiness_count": mod_ready,
        "needs_improvement_count": needs_imp
    }

@router.put("/students/{student_id}/notes")
def update_mentoring_notes(
    student_id: int,
    note_data: UpdateFacultyNoteRequest,
    request: Request,
    current_user: User = Depends(require_role(["faculty", "admin"])),
    db: Session = Depends(get_db)
):
    assignment = db.query(FacultyStudentAssignment).filter(
        FacultyStudentAssignment.faculty_id == current_user.user_id,
        FacultyStudentAssignment.student_id == student_id
    ).first()

    if not assignment:
        raise HTTPException(status_code=404, detail="Student is not assigned to you.")

    assignment.mentor_notes = note_data.mentor_notes
    if note_data.risk_status:
        assignment.risk_status = note_data.risk_status

    db.commit()

    log_audit_event(
        db=db,
        actor=current_user,
        action_type="FACULTY_NOTE_UPDATE",
        target_entity="faculty_assignment",
        target_id=str(assignment.assignment_id),
        details=f"Updated mentoring note for student {student_id}",
        request=request
    )

    return {"message": "Mentoring notes and risk status updated successfully."}
