from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class FacultyStudentAssignment(Base):
    __tablename__ = "faculty_student_assignments"

    assignment_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    faculty_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    student_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    assigned_date = Column(DateTime, default=datetime.utcnow)
    mentor_notes = Column(Text, nullable=True)
    risk_status = Column(String(50), default="Normal")  # Normal, At Risk, High Attention

    faculty = relationship("User", foreign_keys=[faculty_id], back_populates="assigned_students")
    student = relationship("User", foreign_keys=[student_id], back_populates="assigned_faculty")
