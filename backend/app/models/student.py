from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    profile_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)
    branch = Column(String(100), default="Computer Science & Engineering")
    semester = Column(Integer, default=7)
    phone = Column(String(30), nullable=True)
    date_of_birth = Column(String(50), nullable=True)

    user = relationship("User", back_populates="student_profile")


class AcademicRecord(Base):
    __tablename__ = "academic_records"

    record_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)
    cgpa = Column(Float, default=7.5, nullable=False)
    percentage = Column(Float, default=75.0, nullable=False)
    backlogs = Column(Integer, default=0, nullable=False)
    aptitude_score = Column(Float, default=70.0, nullable=False)

    user = relationship("User", back_populates="academic_record")


class SkillResume(Base):
    __tablename__ = "skills_resumes"

    skill_resume_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), unique=True, nullable=False)
    technical_skills = Column(Text, default="Python, SQL, React, Data Structures, Git")  # Stored as comma-separated or JSON string
    certifications = Column(Text, default="AWS Cloud Practitioner, Python for Data Science")
    resume_path = Column(String(500), nullable=True)

    user = relationship("User", back_populates="skill_resume")
