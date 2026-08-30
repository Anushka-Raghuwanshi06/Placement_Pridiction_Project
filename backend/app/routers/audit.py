from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.audit import AuditLog
from app.schemas.admin import AuditLogOut
from app.core.rbac import require_role

router = APIRouter(prefix="/audit", tags=["Audit Logging & Security"])

@router.get("/logs", response_model=List[AuditLogOut])
def get_audit_logs(
    action_type: Optional[str] = Query(None),
    actor_email: Optional[str] = Query(None),
    target_entity: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    limit: int = Query(100, le=500),
    current_user: User = Depends(require_role(["admin"])),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog).order_by(AuditLog.timestamp.desc())

    if action_type:
        query = query.filter(AuditLog.action_type.ilike(f"%{action_type}%"))
    if actor_email:
        query = query.filter(AuditLog.actor_email.ilike(f"%{actor_email}%"))
    if target_entity:
        query = query.filter(AuditLog.target_entity.ilike(f"%{target_entity}%"))
    if search:
        query = query.filter(
            (AuditLog.details.ilike(f"%{search}%")) |
            (AuditLog.action_type.ilike(f"%{search}%")) |
            (AuditLog.actor_email.ilike(f"%{search}%"))
        )

    return query.limit(limit).all()
