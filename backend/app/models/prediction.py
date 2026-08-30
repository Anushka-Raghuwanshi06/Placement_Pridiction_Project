from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class Prediction(Base):
    __tablename__ = "predictions"

    prediction_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    probability = Column(Float, nullable=False)  # 0.0 - 100.0 (percentage)
    readiness_level = Column(String(50), nullable=False)  # High Readiness, Moderate Readiness, Needs Improvement
    job_role = Column(String(255), default="Full Stack Engineer")
    contributing_factors = Column(Text, nullable=True)  # JSON string of factors & weights
    skill_gaps = Column(Text, nullable=True)  # JSON string of missing vs matched skills
    model_version = Column(String(50), default="v1.0-RandomForest")
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="predictions")
