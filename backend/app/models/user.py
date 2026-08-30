import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    STUDENT = "student"
    FACULTY = "faculty"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default=UserRole.STUDENT.value, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    student_profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    academic_record = relationship("AcademicRecord", back_populates="user", uselist=False, cascade="all, delete-orphan")
    skill_resume = relationship("SkillResume", back_populates="user", uselist=False, cascade="all, delete-orphan")
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    
    # Faculty assignments
    assigned_students = relationship("FacultyStudentAssignment", foreign_keys="FacultyStudentAssignment.faculty_id", back_populates="faculty")
    assigned_faculty = relationship("FacultyStudentAssignment", foreign_keys="FacultyStudentAssignment.student_id", back_populates="student")
