from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text
from app.database import Base

class ModelVersion(Base):
    __tablename__ = "model_versions"

    model_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    version_name = Column(String(100), unique=True, nullable=False)
    algorithm = Column(String(100), default="RandomForestClassifier")
    accuracy = Column(Float, default=0.92)
    precision = Column(Float, default=0.91)
    recall = Column(Float, default=0.93)
    f1_score = Column(Float, default=0.92)
    is_active = Column(Boolean, default=False)
    artifact_path = Column(String(500), nullable=False)
    features_list = Column(Text, default="cgpa,backlogs,aptitude_score,percentage,technical_skills")
    created_at = Column(DateTime, default=datetime.utcnow)
