import io
import csv
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.config import settings
from app.models.user import User, UserRole
from app.models.student import StudentProfile, AcademicRecord, SkillResume
from app.models.company import Company
from app.models.prediction import Prediction
from app.models.model_version import ModelVersion
from app.models.dataset import Dataset
from app.schemas.company import CompanyCreate, CompanyUpdate, CompanyOut
from app.schemas.admin import (
    SystemStatsOut, BranchReadinessStats, AggregateReportOut,
    AuditLogOut, ModelVersionOut
)
from app.core.rbac import require_role
from app.core.audit import log_audit_event
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

router = APIRouter(prefix="/admin", tags=["Admin Reporting & Management"])

@router.get("/stats", response_model=SystemStatsOut)
def get_system_stats(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    total_students = db.query(User).filter(User.role == "student").count()
    total_faculty = db.query(User).filter(User.role == "faculty").count()
    total_predictions = db.query(Prediction).count()
    total_companies = db.query(Company).count()

    preds = db.query(Prediction).all()
    avg_prob = round(sum(p.probability for p in preds) / len(preds), 1) if preds else 0.0
    high_cnt = sum(1 for p in preds if p.readiness_level == "High Readiness")
    mod_cnt = sum(1 for p in preds if p.readiness_level == "Moderate Readiness")
    needs_cnt = sum(1 for p in preds if p.readiness_level == "Needs Improvement")

    active_model = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    model_name = active_model.version_name if active_model else "v1.0-Default"
    model_acc = active_model.accuracy if active_model else 0.92

    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_predictions": total_predictions,
        "avg_placement_probability": avg_prob,
        "high_readiness_count": high_cnt,
        "moderate_readiness_count": mod_cnt,
        "needs_improvement_count": needs_cnt,
        "total_companies": total_companies,
        "active_model": model_name,
        "active_model_accuracy": model_acc
    }

@router.get("/reports/aggregate", response_model=AggregateReportOut)
def get_aggregate_reports(
    current_user: User = Depends(require_role(["admin", "faculty"])),
    db: Session = Depends(get_db)
):
    # Stats
    stats = get_system_stats(current_user=current_user, db=db)

    # Branch-wise aggregation
    students = db.query(User).filter(User.role == "student").all()
    branch_map = {}

    for s in students:
        prof = s.student_profile
        b_name = prof.branch if prof and prof.branch else "General Engineering"
        if b_name not in branch_map:
            branch_map[b_name] = {"count": 0, "probs": [], "cgpas": [], "high_ready": 0}

        branch_map[b_name]["count"] += 1
        if s.academic_record:
            branch_map[b_name]["cgpas"].append(s.academic_record.cgpa)

        latest_p = db.query(Prediction).filter(Prediction.user_id == s.user_id).order_by(Prediction.created_at.desc()).first()
        if latest_p:
            branch_map[b_name]["probs"].append(latest_p.probability)
            if latest_p.readiness_level == "High Readiness":
                branch_map[b_name]["high_ready"] += 1

    branch_stats_list = []
    for b_name, d in branch_map.items():
        avg_p = round(sum(d["probs"]) / len(d["probs"]), 1) if d["probs"] else 0.0
        avg_c = round(sum(d["cgpas"]) / len(d["cgpas"]), 2) if d["cgpas"] else 0.0
        high_pct = round((d["high_ready"] / d["count"]) * 100, 1) if d["count"] else 0.0
        branch_stats_list.append({
            "branch": b_name,
            "student_count": d["count"],
            "avg_probability": avg_p,
            "avg_cgpa": avg_c,
            "high_readiness_pct": high_pct
        })

    # CGPA distribution
    acads = db.query(AcademicRecord).all()
    cgpa_dist = {
        "9.0 - 10.0": sum(1 for a in acads if a.cgpa >= 9.0),
        "8.0 - 8.99": sum(1 for a in acads if 8.0 <= a.cgpa < 9.0),
        "7.0 - 7.99": sum(1 for a in acads if 7.0 <= a.cgpa < 8.0),
        "6.0 - 6.99": sum(1 for a in acads if 6.0 <= a.cgpa < 7.0),
        "< 6.0": sum(1 for a in acads if a.cgpa < 6.0),
    }

    # Top skills frequency
    skills_records = db.query(SkillResume).all()
    skill_counts = {}
    for sr in skills_records:
        if sr.technical_skills:
            for sk in sr.technical_skills.split(","):
                sk_clean = sk.strip()
                if sk_clean:
                    skill_counts[sk_clean] = skill_counts.get(sk_clean, 0) + 1

    top_skills = [{"skill": k, "count": v} for k, v in sorted(skill_counts.items(), key=lambda x: -x[1])[:10]]

    # Recent predictions
    recent_p = db.query(Prediction).order_by(Prediction.created_at.desc()).limit(10).all()
    recent_list = []
    for rp in recent_p:
        u = db.query(User).filter(User.user_id == rp.user_id).first()
        recent_list.append({
            "prediction_id": rp.prediction_id,
            "user_name": u.name if u else "Student",
            "probability": rp.probability,
            "readiness_level": rp.readiness_level,
            "job_role": rp.job_role,
            "created_at": rp.created_at.strftime("%Y-%m-%d %H:%M")
        })

    return {
        "system_stats": stats,
        "branch_stats": branch_stats_list,
        "cgpa_distribution": cgpa_dist,
        "top_skills": top_skills,
        "recent_predictions": recent_list
    }

@router.get("/predictions")
def get_all_predictions(
    branch: Optional[str] = Query(None),
    readiness: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(50, le=200),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(Prediction).order_by(Prediction.created_at.desc())
    all_preds = query.all()

    results = []
    for p in all_preds:
        student = db.query(User).filter(User.user_id == p.user_id).first()
        if not student:
            continue
        prof = student.student_profile
        b_name = prof.branch if prof else "N/A"

        if branch and b_name.lower() != branch.lower():
            continue
        if readiness and p.readiness_level.lower() != readiness.lower():
            continue
        if search:
            s_low = search.lower()
            if s_low not in student.name.lower() and s_low not in student.email.lower():
                continue

        results.append({
            "prediction_id": p.prediction_id,
            "user_id": p.user_id,
            "student_name": student.name,
            "student_email": student.email,
            "branch": b_name,
            "probability": p.probability,
            "readiness_level": p.readiness_level,
            "job_role": p.job_role,
            "model_version": p.model_version,
            "created_at": p.created_at.strftime("%Y-%m-%d %H:%M:%S")
        })
        if len(results) >= limit:
            break

    return results

@router.get("/reports/export/csv")
def export_report_csv(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    output = io.StringIO()
    writer = csv.writer(output)

    # Header
    writer.writerow([
        "Prediction ID", "Student Name", "Student Email", "Branch", "CGPA",
        "Backlogs", "Aptitude Score", "Probability (%)", "Readiness Level",
        "Recommended Role", "Model Version", "Date"
    ])

    preds = db.query(Prediction).order_by(Prediction.created_at.desc()).all()
    for p in preds:
        u = db.query(User).filter(User.user_id == p.user_id).first()
        prof = u.student_profile if u else None
        acad = u.academic_record if u else None

        writer.writerow([
            p.prediction_id,
            u.name if u else "N/A",
            u.email if u else "N/A",
            prof.branch if prof else "N/A",
            acad.cgpa if acad else "N/A",
            acad.backlogs if acad else "N/A",
            acad.aptitude_score if acad else "N/A",
            p.probability,
            p.readiness_level,
            p.job_role,
            p.model_version,
            p.created_at.strftime("%Y-%m-%d %H:%M")
        ])

    output.seek(0)
    filename = f"placement_predictions_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/reports/export/pdf")
def export_report_pdf(
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=36, leftMargin=36, topMargin=36, bottomMargin=36)
    elements = []
    styles = getSampleStyleSheet()

    # Title
    title_style = ParagraphStyle(
        name="TitleStyle",
        parent=styles["Heading1"],
        fontSize=20,
        leading=24,
        textColor=colors.HexColor("#1e293b"),
        alignment=1
    )
    subtitle_style = ParagraphStyle(
        name="SubTitleStyle",
        parent=styles["Normal"],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#64748b"),
        alignment=1
    )

    elements.append(Paragraph("Placement Prediction & Readiness Report", title_style))
    elements.append(Paragraph(f"Generated on {datetime.now().strftime('%B %d, %Y - %H:%M')} | Institutional Assessment", subtitle_style))
    elements.append(Spacer(1, 15))

    # Disclaimer Alert in PDF
    disclaimer_style = ParagraphStyle(
        name="DisclaimerStyle",
        parent=styles["Italic"],
        fontSize=8,
        leading=10,
        textColor=colors.HexColor("#b45309")
    )
    elements.append(Paragraph(f"<b>NOTE:</b> {settings.ADVISORY_DISCLAIMER}", disclaimer_style))
    elements.append(Spacer(1, 15))

    # Summary Stats Table
    total_stu = db.query(User).filter(User.role == "student").count()
    preds = db.query(Prediction).all()
    avg_p = round(sum(p.probability for p in preds) / len(preds), 1) if preds else 0.0

    summary_data = [
        ["Total Assessed Students", "Average Placement Probability", "Active Model Version"],
        [str(total_stu), f"{avg_p}%", "v1.0-RandomForest"]
    ]
    t_summary = Table(summary_data, colWidths=[180, 180, 180])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#3b82f6")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#f8fafc")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
    ]))
    elements.append(t_summary)
    elements.append(Spacer(1, 20))

    # Detailed Records Table
    elements.append(Paragraph("Student Predictions Summary", styles["Heading2"]))
    elements.append(Spacer(1, 8))

    records_data = [["Student", "Branch", "CGPA", "Aptitude", "Prob %", "Readiness Level"]]
    for p in preds[:25]:
        u = db.query(User).filter(User.user_id == p.user_id).first()
        prof = u.student_profile if u else None
        acad = u.academic_record if u else None
        records_data.append([
            u.name if u else "N/A",
            (prof.branch[:18] + '..') if prof and len(prof.branch) > 18 else (prof.branch if prof else "N/A"),
            str(acad.cgpa if acad else "-"),
            str(acad.aptitude_score if acad else "-"),
            f"{p.probability}%",
            p.readiness_level
        ])

    t_records = Table(records_data, colWidths=[110, 130, 50, 60, 60, 130])
    t_records.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
    ]))
    elements.append(t_records)

    doc.build(elements)
    buffer.seek(0)

    filename = f"placement_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# Company Management CRUD
@router.get("/companies", response_model=List[CompanyOut])
def get_companies(db: Session = Depends(get_db)):
    return db.query(Company).all()

@router.post("/companies", response_model=CompanyOut)
def create_company(
    comp_in: CompanyCreate,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    comp = Company(**comp_in.model_dump())
    db.add(comp)
    db.commit()
    db.refresh(comp)

    log_audit_event(
        db=db,
        actor=current_user,
        action_type="CREATE_COMPANY",
        target_entity="company",
        target_id=str(comp.company_id),
        details=f"Added recruiting company {comp.name}",
        request=request
    )
    return comp

@router.delete("/companies/{company_id}")
def delete_company(
    company_id: int,
    request: Request,
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    comp = db.query(Company).filter(Company.company_id == company_id).first()
    if not comp:
        raise HTTPException(status_code=404, detail="Company not found")
    
    comp_name = comp.name
    db.delete(comp)
    db.commit()

    log_audit_event(
        db=db,
        actor=current_user,
        action_type="DELETE_COMPANY",
        target_entity="company",
        target_id=str(company_id),
        details=f"Deleted recruiting company {comp_name}",
        request=request
    )
    return {"message": f"Company {comp_name} deleted successfully."}
