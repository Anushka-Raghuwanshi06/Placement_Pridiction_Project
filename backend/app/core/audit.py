from sqlalchemy.orm import Session
from fastapi import Request
from typing import Optional
from app.models.audit import AuditLog
from app.models.user import User

def log_audit_event(
    db: Session,
    action_type: str,
    target_entity: str,
    target_id: Optional[str] = None,
    details: Optional[str] = None,
    actor: Optional[User] = None,
    actor_id: Optional[int] = None,
    actor_email: Optional[str] = None,
    actor_role: Optional[str] = None,
    request: Optional[Request] = None
):
    try:
        ip = None
        if request and request.client:
            ip = request.client.host

        act_id = actor.user_id if actor else actor_id
        act_email = actor.email if actor else actor_email
        act_role = actor.role if actor else actor_role

        audit_entry = AuditLog(
            actor_id=act_id,
            actor_email=act_email,
            actor_role=act_role,
            action_type=action_type,
            target_entity=target_entity,
            target_id=str(target_id) if target_id is not None else None,
            details=details,
            ip_address=ip
        )
        db.add(audit_entry)
        db.commit()
    except Exception as e:
        print(f"Audit log failed: {e}")
