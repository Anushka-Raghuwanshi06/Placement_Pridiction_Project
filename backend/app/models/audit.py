from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from app.database import Base

class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    actor_id = Column(Integer, nullable=True)  # User ID or 0 for system
    actor_email = Column(String(255), nullable=True)
    actor_role = Column(String(50), nullable=True)
    action_type = Column(String(100), nullable=False)  # PREDICTION_REQUEST, USER_UPDATE, DATASET_UPLOAD, MODEL_RETRAIN, etc.
    target_entity = Column(String(100), nullable=False)  # prediction, user, dataset, model, etc.
    target_id = Column(String(100), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(100), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
